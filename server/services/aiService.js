const dotenv = require('dotenv');
dotenv.config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// console.log("process.env.GEMINI_API_KEY : ",process.env.GEMINI_API_KEY);


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const analyzeFit = async (project, user, message) => {
  try {
    const prompt = `
      As a hackathon team formation assistant, analyze if a user is a good fit for a project.
      
      Project Title: ${project.title}
      Project Description: ${project.description}
      Required Skills: ${project.requiredSkills.join(", ")}
      
      User Name: ${user.name}
      User Role: ${user.role}
      User Skills: ${user.skills.join(", ")}
      User's Join Message: "${message}"
      
      Based on the above, provide a single-line summary (max 20 words) for the project owner explaining why this user is a good fit or any potential gaps. Be direct and objective.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error("Gemini AI Error:", err);
    return "AI assessment unavailable.";
  }
};

module.exports = { analyzeFit };