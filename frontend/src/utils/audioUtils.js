export const audioUtils = {
  // Analyze audio volume levels
  analyzeVolume(audioContext, analyser, dataArray) {
    analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    
    const average = sum / dataArray.length;
    const normalized = average / 256; // Normalize to 0-1
    
    return {
      volume: normalized,
      isSpeaking: normalized > 0.1, // Threshold for speech detection
      dB: 20 * Math.log10(normalized + 1e-10) // Convert to dB
    };
  },

  // Create audio analyzer for real-time analysis
  createAudioAnalyzer(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    return {
      audioContext,
      analyser,
      dataArray,
      bufferLength
    };
  },

  // Detect speech patterns and pauses
  detectSpeechPatterns(volumeHistory, timestampHistory) {
    if (volumeHistory.length < 2) return { isSpeaking: false, speechRate: 0 };
    
    const speakingThreshold = 0.1;
    let speakingTime = 0;
    let totalTime = 0;
    
    for (let i = 0; i < volumeHistory.length; i++) {
      if (volumeHistory[i] > speakingThreshold) {
        speakingTime++;
      }
      totalTime++;
    }
    
    const speechRatio = speakingTime / totalTime;
    const isSpeaking = speechRatio > 0.3; // 30% speaking time threshold
    
    return {
      isSpeaking,
      speechRatio,
      confidence: Math.min(100, speechRatio * 100)
    };
  },

  // Calculate audio quality metrics
  calculateAudioQuality(stream) {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      return { quality: 'No audio', score: 0 };
    }
    
    const track = audioTracks[0];
    const settings = track.getSettings();
    
    let score = 50; // Base score
    
    // Score based on sample rate
    if (settings.sampleRate && settings.sampleRate >= 48000) score += 20;
    else if (settings.sampleRate && settings.sampleRate >= 44100) score += 10;
    
    // Score based on channel count
    if (settings.channelCount && settings.channelCount >= 2) score += 10;
    
    // Score based on echo cancellation
    if (settings.echoCancellation) score += 10;
    
    // Score based on noise suppression
    if (settings.noiseSuppression) score += 10;
    
    const quality = score >= 80 ? 'Excellent' :
                   score >= 60 ? 'Good' :
                   score >= 40 ? 'Fair' : 'Poor';
    
    return {
      quality,
      score,
      sampleRate: settings.sampleRate,
      channelCount: settings.channelCount,
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression
    };
  },

  // Create audio level meter for UI display
  createAudioLevelMeter(callback) {
    let analyser = null;
    let audioContext = null;
    let animationId = null;
    
    const start = async (stream) => {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 32;
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const update = () => {
          if (!analyser) return;
          
          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          
          const average = sum / dataArray.length;
          const normalized = Math.min(1, average / 255);
          
          callback(normalized);
          
          animationId = requestAnimationFrame(update);
        };
        
        update();
      } catch (error) {
        console.error('Error creating audio level meter:', error);
      }
    };
    
    const stop = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
      
      analyser = null;
    };
    
    return { start, stop };
  }
};