// Temporary file to hold new endpoints - will be merged into index.js

const { generateSessionQuestions } = require("./groqService");

// POST /sessions/generate-ai - Create session with AI-generated questions
async function createAISession(pool, req, res) {
    const { candidateName, position, jobDescription, complexity } = req.body;

    if (!candidateName || !position || !jobDescription) {
        return res.status(400).json({
            message: "Candidate name, position, and job description are required.",
        });
    }

    const token = require("crypto").randomBytes(24).toString("hex");
    const complexityLevel = complexity || 'Medium';

    try {
        // Generate questions using AI
        console.log(`Generating ${complexityLevel} assessment for ${jobDescription}...`);
        const assessmentData = await generateSessionQuestions(jobDescription, complexityLevel);

        // Create session
        const sessionResult = await pool.query(
            "INSERT INTO sessions (token, status, candidate_name, position, complexity, job_description, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [token, "CREATED", candidateName, position, complexityLevel, jobDescription, req.user.id]
        );
        const sessionId = sessionResult.rows[0].id;

        // Save session-specific questions
        for (const q of assessmentData.questions) {
            await pool.query(
                "INSERT INTO session_questions (session_id, type, question_text, options, correct_answer, points, difficulty) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [
                    sessionId,
                    q.type,
                    q.question_text,
                    q.options ? JSON.stringify(q.options) : null,
                    q.correct_answer,
                    q.points || 1,
                    q.difficulty || complexityLevel
                ]
            );
        }

        // Save coding challenge metadata
        const codingChallenge = assessmentData.coding_challenge;
        if (codingChallenge) {
            await pool.query(
                "INSERT INTO session_questions (session_id, type, question_text, metadata, difficulty) VALUES ($1, $2, $3, $4, $5)",
                [
                    sessionId,
                    "CODING",
                    codingChallenge.title,
                    JSON.stringify({
                        description: codingChallenge.description,
                        constraints: codingChallenge.constraints,
                        examples: codingChallenge.examples,
                        template_code: codingChallenge.template_code,
                        filename: codingChallenge.filename,
                        test_cases: codingChallenge.test_cases
                    }),
                    codingChallenge.difficulty || complexityLevel
                ]
            );

            // Create assessment directory and save coding files
            const fs = require("fs");
            const path = require("path");
            const sessionPath = path.join(__dirname, "session_files", sessionId.toString());
            fs.mkdirSync(sessionPath, { recursive: true });

            // Save template file with test runner
            const fileExt = codingChallenge.filename.endsWith('.py') ? '.py' : '.js';
            let testRunner = '';

            if (fileExt === '.py') {
                testRunner = `\nif __name__ == "__main__":\n    test_cases = ${JSON.stringify(codingChallenge.test_cases, null, 4)}\n    passed = 0\n    print("\\n--- Running ${codingChallenge.test_cases.length} Test Cases ---")\n    for i, tc in enumerate(test_cases):\n        try:\n            result = solution(*tc["input"])\n            if result == tc["output"]:\n                print(f"Test {i+1}: PASS ✓")\n                passed += 1\n            else:\n                print(f"Test {i+1}: FAIL ✗ (Expected {tc['output']}, Got {result})")\n        except Exception as e:\n            print(f"Test {i+1}: ERROR - {e}")\n    print(f"\\nTotal: {passed}/{len(test_cases)} passed")`;
            } else {
                testRunner = `\n// Test Runner\n(function() {\n    const testCases = ${JSON.stringify(codingChallenge.test_cases, null, 4)};\n    let passed = 0;\n    console.log("\\n--- Running ${codingChallenge.test_cases.length} Test Cases ---");\n    testCases.forEach((tc, i) => {\n        try {\n            const result = solution(...tc.input);\n            if (JSON.stringify(result) === JSON.stringify(tc.output)) {\n                console.log(\`Test \${i+1}: PASS ✓\`);\n                passed++;\n            } else {\n                console.log(\`Test \${i+1}: FAIL ✗ (Expected \${JSON.stringify(tc.output)}, Got \${JSON.stringify(result)})\`);\n            }\n        } catch (e) {\n            console.log(\`Test \${i+1}: ERROR - \${e.message}\`);\n        }\n    });\n    console.log(\`\\nTotal: \${passed}/\${testCases.length} passed\`);\n})();`;
            }

            fs.writeFileSync(
                path.join(sessionPath, codingChallenge.filename),
                codingChallenge.template_code + testRunner
            );

            // Save README
            const readme = `# ${codingChallenge.title}\n\nDifficulty: **${codingChallenge.difficulty}**\n\n## Description\n\n${codingChallenge.description}\n\n## Constraints\n\n${codingChallenge.constraints?.map(c => `- ${c}`).join('\n') || 'None'}\n\n## Examples\n\n${codingChallenge.examples?.map((ex, i) => `### Example ${i + 1}\n\n**Input:** ${ex.input}\n**Output:** ${ex.output}\n**Explanation:** ${ex.explanation}\n`).join('\n') || 'None'}`;

            fs.writeFileSync(path.join(sessionPath, "README.md"), readme);
        }

        const shareableLink = `http://api.interview.localhost/session/${token}`;
        res.status(201).json({
            shareableLink,
            token,
            message: `Session created with ${assessmentData.questions.length} questions (${complexityLevel} difficulty)`
        });
    } catch (error) {
        console.error("Failed to create AI session:", error);
        res.status(500).json({ message: "Failed to generate assessment", error: error.message });
    }
}

// GET /admin/sessions/:token/questions - Preview session questions (for interviewer)
async function previewSessionQuestions(pool, req, res) {
    const { token } = req.params;

    try {
        const sessionResult = await pool.query(
            "SELECT id, complexity, job_description FROM sessions WHERE token = $1",
            [token]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: "Session not found" });
        }

        const session = sessionResult.rows[0];

        // Fetch all session questions
        const questionsResult = await pool.query(
            "SELECT * FROM session_questions WHERE session_id = $1 ORDER BY id ASC",
            [session.id]
        );

        const questions = questionsResult.rows.map(q => ({
            ...q,
            options: q.options,
            metadata: q.metadata
        }));

        res.json({
            complexity: session.complexity,
            jobDescription: session.job_description,
            questions: questions.filter(q => q.type !== 'CODING'),
            codingChallenge: questions.find(q => q.type === 'CODING') || null
        });
    } catch (error) {
        console.error("Error fetching session questions:", error);
        res.status(500).send("Error fetching questions");
    }
}

module.exports = { createAISession, previewSessionQuestions };
