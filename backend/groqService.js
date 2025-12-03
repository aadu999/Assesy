const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "your-api-key-here",
});

async function generateAssessment(jobDescription) {
    const prompt = `
    You are an expert technical interviewer. Create a technical assessment for the following job description:
    "${jobDescription}"

    The assessment should include:
    1. 3 Multiple Choice Questions (MCQ) related to the core skills.
    2. 2 Fill in the Blanks questions.
    3. 1 Coding Challenge with a problem statement, a starting template code (in Python or JavaScript), and test cases.

    Return the response in strictly valid JSON format with the following structure:
    {
      "questions": [
        {
          "type": "MCQ",
          "question_text": "...",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "A"
        },
        {
          "type": "FILL_IN_THE_BLANKS",
          "question_text": "The keyword used to declare a constant in JavaScript is ____.",
          "correct_answer": "const"
        }
      ],
      "coding_challenge": {
        "title": "...",
        "description": "...",
        "filename": "solution.js",
        "template_code": "...",
        "test_cases": "..."
      }
    }
    
    Do not include any markdown formatting (like \`\`\`json). Just the raw JSON string.
  `;

    try {
        console.log("Calling Groq API for job description:", jobDescription);
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        console.log("Groq API Response Content:", content);
        const parsed = JSON.parse(content);
        console.log("Successfully parsed JSON response");
        return parsed;
    } catch (error) {
        console.error("Error generating assessment with Groq:");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        if (error.response) {
            console.error("Groq API Error Data:", error.response.data);
            console.error("Groq API Error Status:", error.response.status);
        }
        throw error;
    }
}

module.exports = { generateAssessment };
