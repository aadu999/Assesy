const express = require("express")
const { Pool } = require("pg")
const crypto = require("crypto")
const Docker = require("dockerode")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const { execSync } = require("child_process")
const { generateAssessment } = require("./groqService")

const app = express()
const port = 3000
const docker = new Docker()
const JWT_SECRET = "your-super-secret-and-long-key-for-jwt"

app.use(cors())
app.use(express.json())

const assessmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempPath = path.join(__dirname, "assessment_files", "temp")
    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true })
    cb(null, tempPath)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})
const assessmentUpload = multer({ storage: assessmentStorage })
const submissionUpload = multer({ storage: multer.memoryStorage() })

const pool = new Pool({
  user: "user",
  host: process.env.DB_HOST || "database",
  database: "interviewdb",
  password: "password",
  port: process.env.DB_PORT || 5432,
})

// Track provisioning sessions to prevent race conditions
const provisioningLocks = new Map()

async function initializeDatabase() {
  let retries = 5
  while (retries) {
    try {
      const client = await pool.connect()
      console.log("Database connection successful.")

      // Users Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('ADMIN', 'INTERVIEWER', 'CANDIDATE')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Assessments Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS assessments (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          job_description TEXT,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Questions Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('MCQ', 'FILL_IN_THE_BLANKS', 'CODING')),
          question_text TEXT NOT NULL,
          options JSONB, -- For MCQ
          correct_answer TEXT, -- For MCQ and Fill in the blanks
          points INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Sessions Table (Updated)
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL,
          candidate_name TEXT,
          position TEXT,
          assessment_id INTEGER REFERENCES assessments(id),
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          active_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          score INTEGER
        );
      `)

      // Candidate Responses Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS candidate_responses (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions(id),
          response TEXT,
          is_correct BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

      console.log('Database tables are ready.')

      // Seed Admin User
      const adminCheck = await client.query("SELECT * FROM users WHERE username = 'admin'")
      if (adminCheck.rows.length === 0) {
        // In a real app, hash this password!
        await client.query("INSERT INTO users (username, password, role) VALUES ($1, $2, $3)", ['admin', 'password', 'ADMIN'])
        console.log("Default admin user created.")
      }

      fs.mkdirSync(path.join(__dirname, "submissions"), { recursive: true })
      fs.mkdirSync(path.join(__dirname, "assessment_files"), {
        recursive: true,
      })
      client.release()
      break
    } catch (err) {
      console.error("Failed to connect to database. Retrying...", err.message)
      retries -= 1
      await new Promise((res) => setTimeout(res, 5000))
    }
  }
}

async function provisionInterviewContainer(token, assessmentId) {
  const imageName = "custom-code-server:latest"
  console.log(`Starting to provision container for session: ${token}`)

  try {
    const assessmentFilesPath = path.join(
      __dirname,
      "assessment_files",
      String(assessmentId)
    )

    if (!fs.existsSync(assessmentFilesPath)) {
      throw new Error(`Assessment files not found for ID ${assessmentId}`)
    }

    // Log assessment files to verify they exist
    const assessmentFiles = fs.readdirSync(assessmentFilesPath)
    console.log(
      `Assessment files found for ID ${assessmentId}:`,
      assessmentFiles
    )

    const sessionHostPath = path.join("/tmp/interview-sessions", token)
    fs.mkdirSync(sessionHostPath, { recursive: true })

    // Copy assessment files first
    fs.cpSync(assessmentFilesPath, sessionHostPath, { recursive: true })
    console.log(`Copied all assessment files for session ${token}`)

    // Verify files were copied
    const copiedFiles = fs.readdirSync(sessionHostPath)
    console.log(`Files in session directory ${token}:`, copiedFiles)

    // Fix permissions AFTER copying files
    try {
      execSync(`chown -R 1000:1000 ${sessionHostPath}`)
      console.log(`Permissions fixed for ${sessionHostPath}`)
    } catch (e) {
      console.warn(
        `Could not fix permissions: ${e.message}. Container may have write issues.`
      )
    }

    const container = await docker.createContainer({
      Image: imageName,
      name: `session-${token}`,
      Labels: {
        "traefik.enable": "true",
        [`traefik.http.routers.session-${token}.rule`]: `Host(\`${token}.interview.localhost\`)`,
        [`traefik.http.services.service-${token}.loadbalancer.server.port`]:
          "8443",
        "traefik.docker.network": "assesy_default_network",
      },
      HostConfig: {
        NetworkMode: "assesy_default_network",
        AutoRemove: true,
        Binds: [`${sessionHostPath}:/home/coder/project:rw`],
      },
      Env: [`SESSION_ID=${token}`],
    })

    await container.start()
    console.log(`Container ${container.id} started for session ${token}`)
    return container
  } catch (err) {
    console.error(`Failed to provision container for ${token}:`, err)
    throw err
  }
}

const adminUser = { username: "admin", password: "password" }

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(" ")[1]
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  } else {
    res.sendStatus(401)
  }
}

// Middleware to check for Admin role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
}

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username])
    const user = result.rows[0]

    if (user && user.password === password) { // In production, use bcrypt!
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "8h" })
      res.json({ token, role: user.role })
    } else {
      res.status(401).send("Invalid credentials")
    }
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).send("Internal server error")
  }
})

app.post("/auth/register", authenticateJWT, requireAdmin, async (req, res) => {
  const { username, password, role } = req.body
  if (!['INTERVIEWER', 'CANDIDATE'].includes(role)) {
    return res.status(400).json({ message: "Invalid role" })
  }
  try {
    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
      [username, password, role]
    )
    res.status(201).json({ message: "User created successfully" })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Failed to create user" })
  }
})

app.get("/users", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC")
    res.json(result.rows)
  } catch (error) {
    console.error("Fetch users error:", error)
    res.status(500).json({ message: "Failed to fetch users" })
  }
})

app.post("/sessions", authenticateJWT, async (req, res) => {
  const { candidateName, position, assessmentId } = req.body
  if (!candidateName || !position || !assessmentId) {
    return res.status(400).json({
      message: "Assessment, Candidate name and position are required.",
    })
  }
  const token = crypto.randomBytes(24).toString("hex")
  try {
    await pool.query(
      "INSERT INTO sessions (token, status, candidate_name, position, assessment_id) VALUES ($1, $2, $3, $4, $5)",
      [token, "CREATED", candidateName, position, assessmentId]
    )
    const shareableLink = `http://api.interview.localhost/session/${token}`
    res.status(201).json({ shareableLink })
  } catch (error) {
    console.error("Failed to create session:", error)
    res.status(500).send("Failed to create session.")
  }
})

app.get("/admin/sessions", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.token, s.status, s.candidate_name, s.position, s.created_at, a.title as assessment_title 
      FROM sessions s
      LEFT JOIN assessments a ON s.assessment_id = a.id
      ORDER BY s.created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    res.status(500).send("Error fetching sessions")
  }
})

app.post("/assessments/generate", authenticateJWT, async (req, res) => {
  const { jobDescription } = req.body;
  if (!jobDescription) {
    return res.status(400).json({ message: "Job description is required" });
  }
  try {
    const assessmentData = await generateAssessment(jobDescription);
    res.json(assessmentData);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate assessment" });
  }
});

app.post("/assessments/create-ai", authenticateJWT, async (req, res) => {
  const { title, jobDescription, questions, codingChallenge } = req.body;

  console.log("Received AI assessment save request:", { title, questionCount: questions?.length, hasCodingChallenge: !!codingChallenge });

  if (!title || !questions || !codingChallenge) {
    console.error("Missing required fields:", { title: !!title, questions: !!questions, codingChallenge: !!codingChallenge });
    return res.status(400).json({ message: "Missing required fields" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Create Assessment
    const result = await client.query(
      "INSERT INTO assessments (title, job_description, created_by) VALUES ($1, $2, $3) RETURNING id",
      [title, jobDescription, req.user.id]
    );
    const assessmentId = result.rows[0].id;
    console.log("Created assessment with ID:", assessmentId);

    // 2. Save Questions
    for (const q of questions) {
      const optionsJson = q.options ? JSON.stringify(q.options) : null;
      await client.query(
        "INSERT INTO questions (assessment_id, type, question_text, options, correct_answer) VALUES ($1, $2, $3, $4, $5)",
        [assessmentId, q.type, q.question_text, optionsJson, q.correct_answer]
      );
    }
    console.log("Saved", questions.length, "questions");

    // 3. Save Coding Challenge as Files
    const assessmentPath = path.join(__dirname, "assessment_files", String(assessmentId));
    fs.mkdirSync(assessmentPath, { recursive: true });

    // Save solution/template file
    fs.writeFileSync(path.join(assessmentPath, codingChallenge.filename), codingChallenge.template_code);

    // Save instructions/readme
    fs.writeFileSync(path.join(assessmentPath, "README.md"), `# ${codingChallenge.title}\n\n${codingChallenge.description}`);

    // Save test cases
    fs.writeFileSync(path.join(assessmentPath, "tests.json"), JSON.stringify(codingChallenge.test_cases, null, 2));

    // Also add a question record for the coding challenge
    await client.query(
      "INSERT INTO questions (assessment_id, type, question_text, points) VALUES ($1, 'CODING', $2, 10)",
      [assessmentId, codingChallenge.description]
    );
    console.log("Saved coding challenge files");

    await client.query("COMMIT");
    console.log("Assessment saved successfully");
    res.status(201).json({ message: "Assessment created successfully", id: assessmentId });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Failed to create AI assessment:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Failed to create assessment", error: error.message });
  } finally {
    if (client) client.release();
  }
});

app.post(
  "/assessments",
  authenticateJWT,
  assessmentUpload.array("assessmentFiles"),
  async (req, res) => {
    const { title } = req.body
    if (!title || !req.files || req.files.length === 0) {
      return res.status(400).send("Title and at least one file are required.")
    }
    let client
    try {
      client = await pool.connect()
      const result = await client.query(
        "INSERT INTO assessments (title, created_by) VALUES ($1, $2) RETURNING id",
        [title, req.user.id]
      )
      const newId = result.rows[0].id
      const newAssessmentPath = path.join(
        __dirname,
        "assessment_files",
        String(newId)
      )
      fs.mkdirSync(newAssessmentPath, { recursive: true })
      req.files.forEach((file) => {
        fs.renameSync(
          file.path,
          path.join(newAssessmentPath, file.originalname)
        )
      })
      res
        .status(201)
        .json({ message: "Assessment created successfully", id: newId })
    } catch (e) {
      console.error("Failed to create assessment", e)
      res.status(500).send("Failed to create assessment")
    } finally {
      if (client) client.release()
    }
  }
)

app.get("/assessments", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title FROM assessments ORDER BY title ASC"
    )
    res.json(result.rows)
  } catch (e) {
    console.error("Failed to fetch assessments:", e)
    res.status(500).send("Failed to fetch assessments")
  }
})

app.get("/assessments/:id", authenticateJWT, async (req, res) => {
  try {
    const assessmentId = req.params.id

    // Fetch assessment details
    const assessmentResult = await pool.query("SELECT * FROM assessments WHERE id = $1", [assessmentId])
    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Assessment not found" })
    }
    const assessment = assessmentResult.rows[0]

    // Fetch questions
    const questionsResult = await pool.query("SELECT * FROM questions WHERE assessment_id = $1 ORDER BY id ASC", [assessmentId])

    // Fetch files
    const assessmentDir = path.join(__dirname, "assessment_files", assessmentId)
    let files = []
    if (fs.existsSync(assessmentDir)) {
      files = fs.readdirSync(assessmentDir)
    }

    res.json({ ...assessment, questions: questionsResult.rows, files })
  } catch (e) {
    console.error("Failed to fetch assessment details:", e)
    res.status(500).send("Failed to fetch assessment details")
  }
})

app.delete("/assessments/:id", authenticateJWT, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const assessmentId = req.params.id

    // Check if assessment exists
    const check = await client.query("SELECT id FROM assessments WHERE id = $1", [assessmentId])
    if (check.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "Assessment not found" })
    }

    // Delete questions
    await client.query("DELETE FROM questions WHERE assessment_id = $1", [assessmentId])

    // Delete sessions (optional, but good for cleanup)
    await client.query("DELETE FROM sessions WHERE assessment_id = $1", [assessmentId])

    // Delete assessment
    await client.query("DELETE FROM assessments WHERE id = $1", [assessmentId])

    // Delete files
    const assessmentDir = path.join(__dirname, "assessment_files", assessmentId)
    if (fs.existsSync(assessmentDir)) {
      fs.rmSync(assessmentDir, { recursive: true, force: true })
    }

    await client.query("COMMIT")
    res.json({ message: "Assessment deleted successfully" })
  } catch (e) {
    await client.query("ROLLBACK")
    console.error("Failed to delete assessment:", e)
    res.status(500).send("Failed to delete assessment")
  } finally {
    client.release()
  }
})

app.get("/session/:token/questions", async (req, res) => {
  const { token } = req.params
  try {
    const sessionResult = await pool.query("SELECT assessment_id FROM sessions WHERE token = $1", [token])
    if (sessionResult.rows.length === 0) return res.status(404).send("Session not found")

    const assessmentId = sessionResult.rows[0].assessment_id
    const questionsResult = await pool.query(
      "SELECT id, type, question_text, options, points FROM questions WHERE assessment_id = $1 AND type != 'CODING' ORDER BY id ASC",
      [assessmentId]
    )
    res.json(questionsResult.rows)
  } catch (error) {
    console.error("Error fetching questions:", error)
    res.status(500).send("Error fetching questions")
  }
})

app.post("/session/:token/answers", async (req, res) => {
  const { token } = req.params
  const { answers } = req.body // [{ questionId, response }]

  try {
    const sessionResult = await pool.query("SELECT id FROM sessions WHERE token = $1", [token])
    if (sessionResult.rows.length === 0) return res.status(404).send("Session not found")
    const sessionId = sessionResult.rows[0].id

    let score = 0

    for (const ans of answers) {
      // Check correctness
      const qResult = await pool.query("SELECT correct_answer, points FROM questions WHERE id = $1", [ans.questionId])
      if (qResult.rows.length > 0) {
        const question = qResult.rows[0]
        const isCorrect = question.correct_answer === ans.response
        if (isCorrect) score += question.points

        await pool.query(
          "INSERT INTO candidate_responses (session_id, question_id, response, is_correct) VALUES ($1, $2, $3, $4)",
          [sessionId, ans.questionId, ans.response, isCorrect]
        )
      }
    }

    // Update session score (partial)
    await pool.query("UPDATE sessions SET score = $1 WHERE id = $2", [score, sessionId])

    res.json({ message: "Answers submitted successfully" })
  } catch (error) {
    console.error("Error submitting answers:", error)
    res.status(500).send("Error submitting answers")
  }
})

app.post("/session/:token/start-coding", async (req, res) => {
  const { token } = req.params
  try {
    const result = await pool.query(
      "SELECT status, assessment_id FROM sessions WHERE token = $1",
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(404).send("Session not found.")
    }

    const session = result.rows[0]

    if (session.status === "ACTIVE") {
      return res.json({ url: `http://${token}.interview.localhost` })
    }

    if (session.status === "PROVISIONING") {
      return res.json({ status: "PROVISIONING" })
    }

    if (session.status === "CREATED" || session.status === "FAILED") {
      if (provisioningLocks.has(token)) {
        return res.json({ status: "PROVISIONING" })
      }

      provisioningLocks.set(token, true)
      await pool.query("UPDATE sessions SET status = 'PROVISIONING' WHERE token = $1", [token])

      // Start provisioning in background
      provisionInterviewContainer(token, session.assessment_id)
        .then(async () => {
          await pool.query("UPDATE sessions SET status = 'ACTIVE', active_at = NOW() WHERE token = $1", [token])
          provisioningLocks.delete(token)
        })
        .catch(async (err) => {
          await pool.query("UPDATE sessions SET status = 'FAILED' WHERE token = $1", [token])
          provisioningLocks.delete(token)
        })

      return res.json({ status: "PROVISIONING" })
    }
  } catch (error) {
    console.error("Error starting coding session:", error)
    res.status(500).send("Server error")
  }
})

app.get("/session/:token", async (req, res) => {
  const { token } = req.params
  // Serve the candidate frontend
  // For now, we'll assume the frontend file is at public/candidate/index.html
  // We need to ensure express serves static files or we read it here.
  const candidateHtmlPath = path.join(__dirname, "public", "candidate", "index.html")
  if (fs.existsSync(candidateHtmlPath)) {
    res.sendFile(candidateHtmlPath)
  } else {
    res.send("Candidate interface not found. Please contact admin.")
  }
})

app.post(
  "/session/:token/submit",
  submissionUpload.single("code"),
  async (req, res) => {
    const { token } = req.params

    try {
      const details = JSON.parse(req.body.details)
      const detailsPath = path.join(
        __dirname,
        "submissions",
        `${token}_details.json`
      )
      fs.writeFileSync(detailsPath, JSON.stringify(details, null, 2))
      console.log(`Candidate details saved for session ${token}.`)

      const zipPath = path.join(__dirname, "submissions", `${token}_code.zip`)
      fs.writeFileSync(zipPath, req.file.buffer)
      console.log(`Code submission saved for session ${token}.`)

      await pool.query(
        "UPDATE sessions SET status = 'COMPLETED', completed_at = NOW() WHERE token = $1",
        [token]
      )
      console.log(`Session ${token} marked as COMPLETED.`)

      res.status(200).json({ message: "Submission successful!" })

        // Stop container asynchronously
        ; (async () => {
          const container = docker.getContainer(`session-${token}`)
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            console.log(`Stopping container for session ${token}...`)
            await container.stop()
            console.log(`Container stopped for session ${token}`)
          } catch (error) {
            console.log(
              `Container for session ${token} was already stopped or removed.`
            )
          }
        })()
    } catch (error) {
      console.error("Submission failed for session " + token, error)
      if (!res.headersSent) {
        res.status(500).send("Failed to process submission.")
      }
    }
  }
)

// Add these endpoints to your index.js file

// Get all submissions
app.get("/admin/submissions", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.token, s.candidate_name, s.position, s.completed_at, 
        a.title as assessment_title, s.status
      FROM sessions s
      LEFT JOIN assessments a ON s.assessment_id = a.id
      WHERE s.status = 'COMPLETED'
      ORDER BY s.completed_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    res.status(500).send("Error fetching submissions")
  }
})

// Get submission details (candidate info)
app.get(
  "/admin/submissions/:token/details",
  authenticateJWT,
  async (req, res) => {
    try {
      const { token } = req.params
      const detailsPath = path.join(
        __dirname,
        "submissions",
        `${token}_details.json`
      )

      if (!fs.existsSync(detailsPath)) {
        return res.status(404).json({ message: "Submission details not found" })
      }

      const details = JSON.parse(fs.readFileSync(detailsPath, "utf8"))
      res.json(details)
    } catch (error) {
      console.error("Error fetching submission details:", error)
      res.status(500).send("Error fetching submission details")
    }
  }
)

// Download submission zip - FIXED
app.get(
  "/admin/submissions/:token/download",
  authenticateJWT,
  async (req, res) => {
    try {
      const { token } = req.params
      const zipPath = path.join(__dirname, "submissions", `${token}_code.zip`)

      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ message: "Submission file not found" })
      }

      // Set proper headers for file download
      const filename = `submission_${token}.zip`
      res.setHeader("Content-Type", "application/zip")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      res.setHeader("Content-Length", fs.statSync(zipPath).size)

      // Create read stream and pipe to response
      const fileStream = fs.createReadStream(zipPath)
      fileStream.on("error", (error) => {
        console.error("Error streaming file:", error)
        if (!res.headersSent) {
          res.status(500).send("Error downloading file")
        }
      })
      fileStream.pipe(res)
    } catch (error) {
      console.error("Error downloading submission:", error)
      if (!res.headersSent) {
        res.status(500).send("Error downloading submission")
      }
    }
  }
)

// Check if review container exists and is running
app.get(
  "/admin/submissions/:token/review/status",
  authenticateJWT,
  async (req, res) => {
    const { token } = req.params

    try {
      const container = docker.getContainer(`review-${token}`)
      const info = await container.inspect()
      res.json({
        exists: true,
        running: info.State.Running,
        status: info.State.Status,
      })
    } catch (error) {
      res.json({ exists: false, running: false })
    }
  }
)

// Provision a review code-server instance for a submission
app.post(
  "/admin/submissions/:token/review",
  authenticateJWT,
  async (req, res) => {
    const { token } = req.params

    try {
      // Check if container already exists
      try {
        const existingContainer = docker.getContainer(`review-${token}`)
        const info = await existingContainer.inspect()

        if (info.State.Running) {
          return res.json({
            reviewUrl: `http://review-${token}.interview.localhost`,
            message: "Review environment already running",
            alreadyExists: true,
          })
        } else {
          // Container exists but is stopped, remove it first
          console.log(`Removing stopped container review-${token}`)
          await existingContainer.remove({ force: true })
        }
      } catch (e) {
        // Container doesn't exist, continue with creation
        console.log(
          `No existing container found for review-${token}, creating new one`
        )
      }

      const zipPath = path.join(__dirname, "submissions", `${token}_code.zip`)
      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ message: "Submission not found" })
      }

      // Create review session directory
      const reviewToken = `review-${token}`
      const reviewHostPath = path.join("/tmp/interview-sessions", reviewToken)

      // Clean up old directory if exists
      if (fs.existsSync(reviewHostPath)) {
        fs.rmSync(reviewHostPath, { recursive: true, force: true })
      }

      fs.mkdirSync(reviewHostPath, { recursive: true })

      // Extract submission to review directory
      const AdmZip = require("adm-zip")
      const zip = new AdmZip(zipPath)
      zip.extractAllTo(reviewHostPath, true)

      console.log(`Extracted submission to ${reviewHostPath}`)

      // Fix permissions
      try {
        execSync(`chown -R 1000:1000 ${reviewHostPath}`)
        console.log(`Fixed permissions for ${reviewHostPath}`)
      } catch (e) {
        console.warn(`Could not fix permissions: ${e.message}`)
      }

      // Create read-only code-server container
      const container = await docker.createContainer({
        Image: "custom-code-server:latest",
        name: `review-${token}`,
        Labels: {
          "traefik.enable": "true",
          [`traefik.http.routers.review-${token}.rule`]: `Host(\`review-${token}.interview.localhost\`)`,
          [`traefik.http.services.service-review-${token}.loadbalancer.server.port`]:
            "8443",
          "traefik.docker.network": "assesy_default_network",
        },
        HostConfig: {
          NetworkMode: "assesy_default_network",
          AutoRemove: false,
          Binds: [`${reviewHostPath}:/home/coder/project:ro`],
        },
        Env: [`SESSION_ID=review-${token}`],
      })

      await container.start()
      console.log(`Review container started for submission ${token}`)

      // Set a timeout to auto-stop after 30 minutes of inactivity
      setTimeout(async () => {
        try {
          const c = docker.getContainer(`review-${token}`)
          await c.stop()
          await c.remove()
          console.log(
            `Auto-stopped review container for ${token} after 30 minutes`
          )
        } catch (e) {
          console.log(`Review container ${token} already stopped`)
        }
      }, 30 * 60 * 1000) // 30 minutes

      res.json({
        reviewUrl: `http://review-${token}.interview.localhost`,
        message: "Review environment ready",
        alreadyExists: false,
      })
    } catch (error) {
      console.error(`Failed to create review environment:`, error)
      res
        .status(500)
        .json({
          message: "Failed to create review environment",
          error: error.message,
        })
    }
  }
)

// Stop and remove review container
app.delete(
  "/admin/submissions/:token/review",
  authenticateJWT,
  async (req, res) => {
    const { token } = req.params

    try {
      const container = docker.getContainer(`review-${token}`)
      await container.stop()
      await container.remove()
      console.log(`Stopped and removed review container for ${token}`)
      res.json({ message: "Review environment stopped" })
    } catch (error) {
      console.error(`Failed to stop review container:`, error)
      res.status(500).json({ message: "Failed to stop review environment" })
    }
  }
)

// Extract and view submission files
app.get(
  "/admin/submissions/:token/files",
  authenticateJWT,
  async (req, res) => {
    try {
      const { token } = req.params
      const zipPath = path.join(__dirname, "submissions", `${token}_code.zip`)

      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ message: "Submission not found" })
      }

      const AdmZip = require("adm-zip")
      const zip = new AdmZip(zipPath)
      const entries = zip.getEntries()

      const files = entries.map((entry) => ({
        name: entry.entryName,
        isDirectory: entry.isDirectory,
        size: entry.header.size,
      }))

      res.json({ files })
    } catch (error) {
      console.error("Error reading submission files:", error)
      res.status(500).send("Error reading submission files")
    }
  }
)

// Get individual file content from submission
app.get(
  "/admin/submissions/:token/file/*",
  authenticateJWT,
  async (req, res) => {
    try {
      const { token } = req.params
      const filePath = req.params[0] // Get the file path after /file/
      const zipPath = path.join(__dirname, "submissions", `${token}_code.zip`)

      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ message: "Submission not found" })
      }

      const AdmZip = require("adm-zip")
      const zip = new AdmZip(zipPath)
      const entry = zip.getEntry(filePath)

      if (!entry) {
        return res.status(404).json({ message: "File not found" })
      }

      const content = zip.readAsText(entry)
      res.json({ content, filename: path.basename(filePath) })
    } catch (error) {
      console.error("Error reading file:", error)
      res.status(500).send("Error reading file")
    }
  }
)

// Get assessment file content for editing
app.get(
  "/assessments/:id/file/:filename",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id, filename } = req.params
      const filePath = path.join(__dirname, "assessment_files", id, filename)

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" })
      }

      const content = fs.readFileSync(filePath, "utf8")
      res.json({ content, filename })
    } catch (error) {
      console.error("Error reading assessment file:", error)
      res.status(500).send("Error reading assessment file")
    }
  }
)

// Update assessment file
app.put(
  "/assessments/:id/file/:filename",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id, filename } = req.params
      const { content } = req.body
      const filePath = path.join(__dirname, "assessment_files", id, filename)

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" })
      }

      fs.writeFileSync(filePath, content, "utf8")
      res.json({ message: "File updated successfully" })
    } catch (error) {
      console.error("Error updating assessment file:", error)
      res.status(500).send("Error updating assessment file")
    }
  }
)

// Delete assessment file
app.delete(
  "/assessments/:id/file/:filename",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id, filename } = req.params
      const filePath = path.join(__dirname, "assessment_files", id, filename)

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" })
      }

      fs.unlinkSync(filePath)
      res.json({ message: "File deleted successfully" })
    } catch (error) {
      console.error("Error deleting assessment file:", error)
      res.status(500).send("Error deleting assessment file")
    }
  }
)

// Add new file to assessment
app.post(
  "/assessments/:id/file",
  authenticateJWT,
  assessmentUpload.single("file"),
  async (req, res) => {
    try {
      const { id } = req.params
      const assessmentDir = path.join(__dirname, "assessment_files", id)

      if (!fs.existsSync(assessmentDir)) {
        return res.status(404).json({ message: "Assessment not found" })
      }

      const destPath = path.join(assessmentDir, req.file.originalname)
      fs.renameSync(req.file.path, destPath)

      res.json({
        message: "File added successfully",
        filename: req.file.originalname,
      })
    } catch (error) {
      console.error("Error adding file:", error)
      res.status(500).send("Error adding file")
    }
  }
)

app.listen(port, () => {
  console.log(`Backend service listening on port ${port}`)
  initializeDatabase()
})
