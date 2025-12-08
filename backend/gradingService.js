const { generateWithAI } = require('./groqService');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

async function gradeSubmission(sessionId, zipBuffer, jobDescription, complexity) {
    console.log(`Grading submission for session ${sessionId}...`);

    // 1. Extract Code
    const extractPath = path.join(__dirname, 'submissions', sessionId);
    fs.mkdirSync(extractPath, { recursive: true });

    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(extractPath, true);

    // 2. Find solution file (heuristic)
    const files = fs.readdirSync(extractPath);
    const codeFile = files.find(f => f.endsWith('.py') || f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.c') || f.endsWith('.cpp'));

    if (!codeFile) {
        return { score: 0, feedback: "No code file found." };
    }

    const codeContent = fs.readFileSync(path.join(extractPath, codeFile), 'utf-8');

    // 3. AI Evaluation
    const prompt = `
    You are an expert code reviewer. Evaluate the following coding submission for a ${complexity} level role ("${jobDescription}").

    CODE SUBMISSION:
    \`\`\`${codeFile.endsWith('.py') ? 'python' : codeFile.endsWith('.c') ? 'c' : 'javascript'}
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
        "bug_report": "List of potential bugs if any"
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
