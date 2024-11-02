"use client";
import React from "react";
import { useRef, useEffect } from "react";
const Video = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing the camera", error);
      }
    }
    startVideo();
  }, []);

  return <video ref={videoRef} autoPlay playsInline />;
};

export default Video;
