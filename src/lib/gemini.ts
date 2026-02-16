import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

const systemPrompt = `
你是一位顶级社交媒体文案专家和全能创作助手。
你的任务是将用户输入的原始文本润色为适合社交媒体（小红书、抖音、B站、微博等）分发的爆款内容。

润色规则：
1. 保持原文核心意思不变，但语言更具吸引力、情绪价值和传播力。
2. 自动根据内容添加适当的表情符号 (Emojis) 增加亲和力。
3. 在末尾自动生成 3-5 个具有流量标签（Hashtags）。
4. 结构清晰，段落分明，适合手机端阅读。
5. 语气要亲切、自然，像一个真实的朋友在分享，避免过于死板的 AI 味。

请直接返回润色后的内容，不要包含任何解释或开场白。
`;

export async function generatePolish(content: string) {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(content);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("AI 润色失败，请稍后再试或检查 API Key 配置。");
    }
}
