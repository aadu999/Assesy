const { generateWithAI } = require('./groqService');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const { execSync } = require('child_process');

async function gradeSubmission(sessionId, submissionPath, jobDescription, complexity) {
    console.log(`Grading submission for session ${sessionId}...`);

    // 1. Extract Code (Handling Tar)
    const extractPath = path.join(__dirname, 'temp_grading', sessionId);
    fs.mkdirSync(extractPath, { recursive: true });

    try {
        // Extract tarball using system tar
        // submissionPath is the absolute path to the .tar file
        execSync(`tar -xf "${submissionPath}" -C "${extractPath}"`);
    } catch (e) {
        console.error("Failed to extract submission tar:", e);
        return { score: 0, feedback: "Failed to extract code submission." };
    }

    // 2. Find solution file (heuristic)
    // We need to search recursively because it might be nested
    function findCodeFile(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const found = findCodeFile(fullPath);
                if (found) return found;
            } else if (entry.isFile()) {
                if (entry.name.endsWith('.py') || entry.name.endsWith('.js') || entry.name.endsWith('.ts') || entry.name.endsWith('.c') || entry.name.endsWith('.cpp') || entry.name.endsWith('.java')) {
                    return fullPath;
                }
            }
        }
        return null;
    }

    const codeFilePath = findCodeFile(extractPath);

    if (!codeFilePath) {
        return { score: 0, feedback: "No code file found in submission." };
    }

    const codeContent = fs.readFileSync(codeFilePath, 'utf-8');
    const codeFileName = path.basename(codeFilePath);

    // 3. AI Evaluation
    const prompt = `
    You are an expert code reviewer. Evaluate the following coding submission for a ${complexity} level role ("${jobDescription}").

    CODE SUBMISSION:
    \`\`\`${codeFileName.endsWith('.py') ? 'python' : codeFileName.endsWith('.c') ? 'c' : 'javascript'}
    ${codeContent}
    \`\`\`

    CRITERIA:
    1. Correctness: Does it solve the problem? (Assume prompts were followed)
    2. Code Quality: Cleanliness, variable naming, comments.
    3. Efficiency: Time and space complexity.
    4. Best Practices: Error handling, modularity.

    OUTPUT JSON:
    {
        "score": 85, // 0-100
        "feedback": "Detailed feedback...",
        "strengths": ["...", "..."],
        "weaknesses": ["...", "..."],
        "bug_report": "List of potential bugs if any",
        "brief_note": "A short summary (2-3 sentences) of the overall code quality and submission status."
    }
    `;

    try {
        const assessment = await generateWithAI(prompt);
        return assessment;
    } catch (error) {
        console.error("Grading failed:", error);
        return { score: 0, feedback: "AI Grading Failed" };
    }
}

module.exports = { gradeSubmission };
