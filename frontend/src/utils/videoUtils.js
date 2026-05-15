export const videoUtils = {
  // Check camera permissions and available devices
  async getVideoDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error accessing video devices:', error);
      throw new Error('Camera access denied or not available');
    }
  },

  // Check microphone permissions and available devices
  async getAudioDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Error accessing audio devices:', error);
      throw new Error('Microphone access denied or not available');
    }
  },

  // Start media stream with specific devices
  async startMediaStream(videoDeviceId = null, audioDeviceId = null) {
    const constraints = {
      video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
      audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Error starting media stream:', error);
      throw error;
    }
  },

  // Stop all tracks in a stream
  stopMediaStream(stream) {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
  },

  // Take screenshot from video stream
  takeScreenshot(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/png');
  },

  // Check if browser supports required features
  checkBrowserSupport() {
    const supports = {
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      webRTC: !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'),
      speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };

    return supports;
  },

  // Get optimal video constraints for different scenarios
  getOptimalConstraints(scenario = 'default') {
    const constraints = {
      default: {
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
      },
      lowBandwidth: {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      },
      highQuality: {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 2
        }
      }
    };

    return constraints[scenario] || constraints.default;
  }
};