"use server";

import { auth } from "@clerk/nextjs/server";
import { generatePolish } from "@/lib/gemini";

/**
 * Uses Gemini AI to polish social media content.
 */
export async function polishContent(text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!text || text.trim().length === 0) {
    throw new Error("Content cannot be empty");
  }

  try {
    const polished = await generatePolish(text);
    return {
      success: true,
      polishedContent: polished,
    };
  } catch (error: any) {
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
