class AnalysisService {
  calculatePostureScore(poseData) {
    if (!poseData || !poseData.keypoints) return 75;

    // Simplified posture analysis based on keypoints
    const keypoints = poseData.keypoints;
    let score = 100;

    // Check shoulder alignment
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
    
    if (leftShoulder && rightShoulder) {
      const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);
      if (shoulderSlope > 20) score -= 15;
    }

    // Check head position
    const nose = keypoints.find(k => k.name === 'nose');
    const leftEye = keypoints.find(k => k.name === 'left_eye');
    const rightEye = keypoints.find(k => k.name === 'right_eye');
    
    if (nose && leftEye && rightEye) {
      const eyeLevel = (leftEye.y + rightEye.y) / 2;
      const headTilt = Math.abs(nose.y - eyeLevel);
      if (headTilt > 15) score -= 10;
    }

    return Math.max(50, Math.min(95, score));
  }

  analyzeGestures(poseData) {
    const gestures = {
      eyeContact: 75,
      handGestures: 'Moderate',
      facialExpressions: 'Neutral',
      confidence: 70
    };

    if (!poseData || !poseData.keypoints) return gestures;

    const keypoints = poseData.keypoints;

    // Analyze hand movements
    const leftWrist = keypoints.find(k => k.name === 'left_wrist');
    const rightWrist = keypoints.find(k => k.name === 'right_wrist');
    const nose = keypoints.find(k => k.name === 'nose');

    if (leftWrist && rightWrist && nose) {
      const leftHandMovement = Math.abs(leftWrist.x - nose.x) + Math.abs(leftWrist.y - nose.y);
      const rightHandMovement = Math.abs(rightWrist.x - nose.x) + Math.abs(rightWrist.y - nose.y);
      const totalMovement = leftHandMovement + rightHandMovement;

      if (totalMovement > 200) {
        gestures.handGestures = 'High';
        gestures.confidence += 10;
      } else if (totalMovement > 100) {
        gestures.handGestures = 'Moderate';
      } else {
        gestures.handGestures = 'Low';
        gestures.confidence -= 5;
      }
    }

    // Simulate eye contact based on head position
    if (nose) {
      const headPositionStability = Math.random() * 20 + 80; // Simulated stability
      gestures.eyeContact = Math.max(60, Math.min(95, headPositionStability));
    }

    return gestures;
  }

  analyzeSpeechPatterns(transcript, audioMetrics = {}) {
    const words = transcript.split(' ').filter(word => word.length > 0);
    const totalWords = words.length;
    
    // Basic speech analysis
    const analysis = {
      speakingRate: totalWords / 60, // words per minute (assuming 60-second sample)
      clarity: 75,
      fillerWords: this.countFillerWords(words),
      confidence: 70,
      coherence: 80
    };

    // Adjust confidence based on speech patterns
    if (analysis.fillerWords > 5) {
      analysis.confidence -= 10;
    }
    if (analysis.speakingRate > 150) {
      analysis.confidence -= 5;
      analysis.clarity -= 10;
    } else if (analysis.speakingRate < 100) {
      analysis.confidence -= 5;
    }

    analysis.confidence = Math.max(50, Math.min(95, analysis.confidence));
    analysis.clarity = Math.max(60, Math.min(90, analysis.clarity));

    return analysis;
  }

  countFillerWords(words) {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
    return words.filter(word => 
      fillerWords.includes(word.toLowerCase())
    ).length;
  }

  generateOverallFeedback(performanceData) {
    const { postureScore, gestures, speechAnalysis, questionAnswers = [] } = performanceData;
    
    let feedback = [];
    let improvements = [];

    // Posture feedback
    if (postureScore >= 80) {
      feedback.push("Excellent posture maintained throughout the interview.");
    } else if (postureScore >= 70) {
      feedback.push("Good posture overall.");
      improvements.push("Try to sit up straighter to project more confidence.");
    } else {
      improvements.push("Work on maintaining better posture during interviews.");
    }

    // Gesture feedback
    if (gestures.handGestures === 'Moderate') {
      feedback.push("Appropriate use of hand gestures.");
    } else if (gestures.handGestures === 'High') {
      feedback.push("Expressive hand gestures help emphasize points.");
    } else {
      improvements.push("Consider using more hand gestures to appear more engaged.");
    }

    // Speech feedback
    if (speechAnalysis.confidence >= 75) {
      feedback.push("Confident and clear speaking style.");
    } else {
      improvements.push("Practice speaking more confidently and reducing filler words.");
    }

    if (speechAnalysis.fillerWords > 5) {
      improvements.push("Try to reduce the use of filler words like 'um' and 'like'.");
    }

    return {
      feedback: feedback.join(' '),
      improvements,
      overallScore: this.calculateOverallScore(performanceData)
    };
  }

  calculateOverallScore(performanceData) {
    const { postureScore, gestures, speechAnalysis } = performanceData;
    
    const weights = {
      posture: 0.2,
      gestures: 0.2,
      speech: 0.3,
      content: 0.3
    };

    const gestureScore = gestures.confidence || 70;
    const speechScore = speechAnalysis.confidence || 70;
    const contentScore = 75; // This would come from AI analysis of answers

    const overallScore = 
      (postureScore * weights.posture) +
      (gestureScore * weights.gestures) +
      (speechScore * weights.speech) +
      (contentScore * weights.content);

    return Math.round(overallScore);
  }
}

export const analysisService = new AnalysisService();