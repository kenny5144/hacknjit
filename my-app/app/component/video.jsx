"use client";
import React, { useEffect, useRef, useState } from "react";

const Video = ({ onStreamReady }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (onStreamReady) {
            onStreamReady(stream);
          }
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError(
          "Unable to access media devices. Please check your permissions."
        );
      }
    };

    startVideoStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onStreamReady]);

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "auto" }}
        />
      )}
    </div>
  );
};

export default Video;
