// app/api/gemini/route.js  (Make sure this is the correct path)

import { NextResponse } from "next/server";
import {
  GoogleAIFileManager,
  FileState,
  GoogleGenerativeAI,
} from "@google/generative-ai/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !audioFile.name) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const fileManager = new GoogleAIFileManager(process.env.API_KEY);
    const uploadResult = await fileManager.uploadFile(
      await audioFile.arrayBuffer(),
      {
        mimeType: audioFile.type,
        displayName: audioFile.name,
      }
    );

    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === FileState.FAILED) {
      throw new Error("Audio processing failed.");
    }

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
      { text: "As a therapist, help me feel accomplished and calm." },
    ]);

    const aiResponse = result.response.text();

    return NextResponse.json({
      message: "Audio file uploaded and processed successfully!",
      aiResponse,
    });
  } catch (error) {
    console.error("Error handling audio upload:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
