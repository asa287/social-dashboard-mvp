"use server";

import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Uses Google Gemini AI to polish the provided content.
 */
export async function polishContent(text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API Key is not configured in environment variables.");
  }

  try {
    const prompt = `你是一位精通小红书、抖音、B站等平台的爆款博主。请帮我润色以下内容，使其更具吸引力，增加互动率。
    要求：
    1. 保持原意，但语言更活泼、地道。
    2. 自动添加 3-5 个相关的爆款标签（带#）。
    3. 根据内容判断，如果是笔记类，增加分段和 Emoji；如果是视频描述类，保持简洁。
    
    待润色内容：
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const polishedText = response.text();

    return {
      success: true,
      polishedContent: polishedText,
    };
  } catch (error: any) {
    console.error("Gemini AI polishing error:", error);
    return {
      success: false,
      error: error.message || "Failed to polish content",
    };
  }
}

/**
 * Creates a new post record in the database.
 */
export async function savePost(data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Logic to save to Prisma in the next step
  console.log("Saving post data for user:", userId, data);

  return {
    success: true,
    id: "mock-id-123",
  };
}
