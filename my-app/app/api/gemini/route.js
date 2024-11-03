import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY, // Use your OpenAI API key
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    // Log the form data entries for debugging
    console.log("Received form data:", ...formData.entries());

    if (!audioFile || !audioFile.name) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Get a readable stream from the audio file
    const audioStream = audioFile.stream();

    // Transcribe audio using OpenAI's Whisper API
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      response_format: "verbose_json", // or "text"
      language: "en", // Specify English language
      temperature: 0.2, // Adjust temperature as needed
      timestamp_granularities: ["word"],
    });

    const transcript = transcriptionResponse.text;
    console.log("Transcription:", transcript);

    const completionResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a supportive therapist. Provide calming and constructive feedback based on the transcript of an audio file.",
        },
        { role: "user", content: transcript },
      ],
    });

    const aiResponse = completionResponse.choices[0].message.content;
    console.log("AI Response:", aiResponse);

    return NextResponse.json({
      message: "Audio file processed and response generated successfully!",
      aiResponse,
    });
  } catch (error) {
    console.error("Error handling audio upload:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
