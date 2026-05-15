import { useState, useRef, useCallback } from 'react';

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  
  // Store original stream reference for proper cleanup
  const streamRef = useRef(null);

  const startMedia = useCallback(async () => {
    try {
      setMediaError(null);
      
      // First, stop any existing stream to prevent conflicts
      if (streamRef.current) {
        stopMedia();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setLocalStream(stream);
      
      // Ensure video tracks are properly configured
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = isVideoEnabled;
      }
      
      // Ensure audio tracks are properly configured
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = isAudioEnabled;
      }

      console.log('🎥 Media stream started with tracks:', {
        video: videoTracks.length,
        audio: audioTracks.length
      });

    } catch (error) {
      console.error('Error accessing media devices:', error);
      setMediaError('Could not access camera or microphone. Please check permissions.');
    }
  }, [isVideoEnabled, isAudioEnabled]);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      console.log('🛑 Stopping media stream and releasing camera...');
      
      // Properly stop all tracks
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind} - ${track.label}`);
        track.stop(); // This releases the hardware
      });
      
      // Clear the stream reference
      streamRef.current = null;
      setLocalStream(null);
      
      // Reset states
      setIsVideoEnabled(false);
      setIsAudioEnabled(false);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        console.log(`📹 Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
        
        // If disabling video, also stop the track to release camera
        if (!videoTrack.enabled) {
          // Don't stop the track completely, just disable it
          // This allows re-enabling without requesting permissions again
        }
      }
    } else {
      // If no stream exists, just toggle the state for next stream
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log(`🎤 Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    } else {
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [isAudioEnabled]);

  // Force stop camera (completely release hardware)
  const forceStopCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        console.log('🔴 Force stopping camera track');
        track.stop(); // This releases the camera hardware
      });
      setIsVideoEnabled(false);
    }
  }, []);

  return {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    mediaError,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    forceStopCamera,
    setRemoteStream
  };
};