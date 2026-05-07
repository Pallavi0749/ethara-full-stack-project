const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

const getAIModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not found in environment. AI features will be disabled.');
    return null;
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Generate a summary for a task based on its title and description
 */
const generateTaskSummary = async (task) => {
  const model = getAIModel();
  if (!model) return 'AI services are currently unavailable.';

  const prompt = `
    You are an AI assistant for a project management tool called Ethara.
    Please provide a concise, professional summary for the following task:
    
    Task Title: ${task.title}
    Task Description: ${task.description || 'No description provided.'}
    Task Priority: ${task.priority}
    Task Status: ${task.status}
    
    Your summary should highlight the core objective and any key actions required. 
    Keep it under 3 sentences.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ AI Summary generation failed:', error.message);
    return 'Failed to generate AI summary.';
  }
};

/**
 * Predict if a task might become overdue based on current progress and deadline
 */
const predictOverdueRisk = async (task) => {
  const model = getAIModel();
  if (!model || !task.deadline) return null;

  const prompt = `
    Analyze the risk of this task becoming overdue.
    Task: ${task.title}
    Status: ${task.status}
    Priority: ${task.priority}
    Deadline: ${task.deadline}
    Estimated Hours: ${task.estimatedHours || 'Not specified'}
    
    Return a JSON object with:
    {
      "riskLevel": "low" | "medium" | "high",
      "reason": "Short explanation"
    }
    Only return the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Basic cleanup in case it returns markdown
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    return null;
  }
};

/**
 * Parse a natural language string into task fields
 */
const parseTaskPrompt = async (input) => {
  const model = getAIModel();
  if (!model) return null;

  const prompt = `
    Extract task information from this text: "${input}"
    
    Return a JSON object with:
    {
      "title": "string",
      "priority": "low" | "medium" | "high" | "critical",
      "deadline": "ISO date string or null",
      "description": "optional string"
    }
    
    Current date is ${new Date().toISOString()}.
    If priority isn't mentioned, default to "medium".
    Only return JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('❌ AI Task Parsing failed:', error.message);
    return null;
  }
};

module.exports = { generateTaskSummary, predictOverdueRisk, parseTaskPrompt };
