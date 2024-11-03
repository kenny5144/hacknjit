"use client";
import Video from "./component/Video";
import SpeechRecognitionComponent from "./component/SpeechRecognition";

export default function Home() {
  const handleTranscriptComplete = (transcript) => {
    console.log("Transcript complete:", transcript);
    // Handle the completed transcript here
  };

  return (
    <div>
      <h1>AI Audio Therapy / Diary</h1>
      <Video />
      <SpeechRecognitionComponent
        onTranscriptComplete={handleTranscriptComplete}
      />
    </div>
  );
}
