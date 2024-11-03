"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const SpeechRecognitionComponent = ({ onTranscriptComplete }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const videoStreamRef = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    const startVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoStreamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
            console.log("Audio chunk available:", event.data);
          }
        };

        // Start recording immediately when the stream is ready
        startRecording();
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    startVideoStream();

    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setTranscript(currentTranscript);

      if (debounceTimeout) clearTimeout(debounceTimeout);
      setDebounceTimeout(
        setTimeout(() => {
          stopRecording();
          handleUploadAudio(); // Upload when silence is detected
        }, 2000)
      );
    };

    recognition.onend = () => {
      if (listening) {
        recognition.start();
      }
    };

    if (listening) {
      recognition.start();
    } else {
      recognition.stop();
      stopRecording();
    }

    return () => {
      recognition.stop();
      stopRecording();
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [listening]); 

  const startRecording = () => {
    audioChunks.current = [];
    if (mediaRecorderRef.current) {
      console.log("Starting recording");
      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      console.log("Stopping recording");
      mediaRecorderRef.current.stop();
    }
  };

  const handleUploadAudio = async () => {
    setUploading(true);
    console.log("Audio chunks before upload:", audioChunks.current);

    try {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      console.log("Audio blob created:", audioBlob);

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      console.log("FormData before upload:", Array.from(formData));

      const response = await axios.post("/api/gemini", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        console.log("AI Response:", response.data.aiResponse);
        onTranscriptComplete(response.data.aiResponse);
      } else {
        console.error("Failed to upload audio:", response.status);
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <button onClick={() => setListening(!listening)}>
        {listening ? "Stop Listening" : "Start Listening"}
      </button>
      <p>Transcript: {transcript}</p>
      <button
        onClick={handleUploadAudio}
        disabled={uploading || !audioChunks.current.length}
      >
        {uploading ? "Uploading..." : "Send Audio to Gemini"}
      </button>
    </div>
  );
};

export default SpeechRecognitionComponent;
