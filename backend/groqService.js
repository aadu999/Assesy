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
        "template_code": "function solution(a, b) {\\n  // Your code here\\n}",
        "test_cases": [
          { "input": [1, 2], "output": 3 },
          { "input": [5, 10], "output": 15 }
        ]
      }
    }
    
    IMPORTANT: 
    1. The template_code must define a function named solution.
    2. test_cases must be an array of objects with input (array of arguments) and output (expected return value).
    3. Ensure the filename extension matches the language of template_code (e.g., .js for JavaScript, .py for Python).
    4. Do not include any markdown formatting (like \\\`\\\`\\\`json). Just the raw JSON string.
  `;

  try {
    console.log("Calling AI Service for job description:", jobDescription);

    // Use generic AI service if available
    let content;
    if (aiService) {
      const result = await aiService.generateCompletion(prompt, { temperature: 0.5 });
      // aiService returns parsed JSON usually, but let's be safe
      return result;
    } else {
      // Fallback
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        response_format: { type: "json_object" },
      });
      content = completion.choices[0].message.content;
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error generating assessment:", error.message);
    throw error;
  }
}

// Helper function to get question counts based on complexity
function getQuestionCounts(complexity) {
  switch (complexity) {
    case 'Easy': return { mcq: 3, fillBlank: 2, testCases: 5 };
    case 'Medium': return { mcq: 4, fillBlank: 2, testCases: 7 };
    case 'Hard': return { mcq: 5, fillBlank: 3, testCases: 10 };
    default: return { mcq: 4, fillBlank: 2, testCases: 7 };
  }
}

// Enhanced function for per-session question generation
async function generateSessionQuestions(jobDescription, complexity = 'Medium') {
  const counts = getQuestionCounts(complexity);

  const prompt = `
You are an expert technical interviewer. Generate a ${complexity} difficulty assessment for: "${jobDescription}"

REQUIREMENTS:
1. ${counts.mcq} Multiple Choice Questions (MCQ) - ${complexity} level
2. ${counts.fillBlank} Fill-in-the-Blank questions - ${complexity} level  
3. 1 LeetCode-style coding challenge - ${complexity} difficulty

CODING CHALLENGE REQUIREMENTS:
- Clear, professional problem statement
- Constraints section (input bounds, time/space complexity if ${complexity === 'Hard' ? 'required' : 'applicable'})
- 2-3 examples with detailed explanations
- Clean function signature (Python or JavaScript)
- EXACTLY ${counts.testCases} comprehensive test cases including:
  * Happy path cases (normal inputs)
  * Edge cases (empty, single element, boundaries)
  * Corner cases (max values, special conditions)
${complexity === 'Hard' ? '  * Performance test cases (large inputs)' : ''}

DIFFICULTY GUIDELINES FOR ${complexity.toUpperCase()}:
${complexity === 'Easy' ? `
- MCQ: Basic syntax, simple concepts
- Coding: Simple loops, basic array/string manipulation
- Time Complexity: O(n) or simpler
- Examples: Two Sum, Reverse String, Find Max
` : complexity === 'Medium' ? `
- MCQ: Intermediate concepts, common patterns
- Coding: Hash maps, two pointers, recursion
- Time Complexity: O(n log n) acceptable
- Examples: Valid Parentheses, Longest Substring, Binary Search
` : `
- MCQ: Advanced patterns, optimization techniques
- Coding: Dynamic programming, graph algorithms, advanced data structures
- Time Complexity: O(n log n) or better required
- Examples: Merge K Sorted Lists, Word Ladder, LRU Cache
`}

Return STRICTLY valid JSON (no markdown, no backticks):
{
  "questions": [
    {
      "type": "MCQ",
      "question_text": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "difficulty": "${complexity}"
    }
  ],
  "coding_challenge": {
    "title": "Descriptive Title",
    "difficulty": "${complexity}",
    "description": "Clear problem statement...",
    "constraints": [
      "1 <= n <= 10^4",
      "Time Complexity: O(n)",
      "Space Complexity: O(1)"
    ],
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ],
    "template_code": "def solution(nums, target):\\n    pass",
    "filename": "solution.py",
    "test_cases": [
      {"input": [[2,7,11,15], 9], "output": [0,1]},
      {"input": [[3,2,4], 6], "output": [1,2]}
    ]
  }
}

CRITICAL: Provide EXACTLY ${counts.testCases} test cases, no more, no less.
  `;

  try {
    console.log(`Generating ${complexity} assessment for: ${jobDescription}`);

    let parsed;
    if (aiService) {
      parsed = await aiService.generateCompletion(prompt, { temperature: 0.7 });
    } else {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        response_format: { type: "json_object" },
      });
      parsed = JSON.parse(completion.choices[0].message.content);
    }

    // Validate test case count
    if (parsed.coding_challenge && parsed.coding_challenge.test_cases) {
      const actualCount = parsed.coding_challenge.test_cases.length;
      if (actualCount !== counts.testCases) {
        console.warn(`Expected ${counts.testCases} test cases, got ${actualCount}. Adjusting...`);
      }
    }

    console.log(`Successfully generated ${complexity} assessment`);
    return parsed;
  } catch (error) {
    console.error("Error generating session questions:", error.message);
    throw error;
  }
}

// Multi-Provider AI Service Integration
const AIService = require("./aiService");
let aiService = null;

function initializeAIService(pool) {
  aiService = new AIService(pool);
  console.log("AIService initialized with multi-provider support");
}

// Use multi-provider service if available, fallback to Groq
async function generateWithAI(prompt) {
  if (aiService) {
    return await aiService.generateCompletion(prompt);
  }
  // Fallback to direct Groq
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    response_format: { type: "json_object" },
  });
  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { generateAssessment, generateSessionQuestions, initializeAIService, generateWithAI };
