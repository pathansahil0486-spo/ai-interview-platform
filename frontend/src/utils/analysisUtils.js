export const analysisUtils = {
  // Calculate confidence score from multiple metrics
  calculateConfidenceScore(metrics) {
    const {
      postureScore = 75,
      eyeContact = 75,
      speechClarity = 75,
      responseRelevance = 75,
      gestureEffectiveness = 75
    } = metrics;

    const weights = {
      posture: 0.15,
      eyeContact: 0.20,
      speechClarity: 0.25,
      responseRelevance: 0.30,
      gestureEffectiveness: 0.10
    };

    const score = 
      (postureScore * weights.posture) +
      (eyeContact * weights.eyeContact) +
      (speechClarity * weights.speechClarity) +
      (responseRelevance * weights.responseRelevance) +
      (gestureEffectiveness * weights.gestureEffectiveness);

    return Math.round(score);
  },

  // Generate performance insights
  generatePerformanceInsights(performanceData) {
    const insights = [];
    const { postureScore, gestures, speechAnalysis, answerQuality } = performanceData;

    // Posture insights
    if (postureScore >= 85) {
      insights.push("Excellent posture demonstrates confidence and professionalism.");
    } else if (postureScore >= 70) {
      insights.push("Good posture maintained throughout the session.");
    } else {
      insights.push("Consider improving posture for better presence.");
    }

    // Gesture insights
    if (gestures.handGestures === 'High') {
      insights.push("Effective use of hand gestures to emphasize points.");
    } else if (gestures.handGestures === 'Low') {
      insights.push("Using more hand gestures could enhance communication.");
    }

    // Speech insights
    if (speechAnalysis.confidence >= 80) {
      insights.push("Confident and clear speech delivery.");
    } else if (speechAnalysis.confidence < 60) {
      insights.push("Working on speech confidence would improve impact.");
    }

    if (speechAnalysis.fillerWords > 5) {
      insights.push("Reducing filler words would make speech more polished.");
    }

    // Answer quality insights
    if (answerQuality >= 80) {
      insights.push("Well-structured and relevant answers.");
    } else if (answerQuality < 60) {
      insights.push("Focus on providing more specific and detailed responses.");
    }

    return insights;
  },

  // Calculate improvement areas
  identifyImprovementAreas(performanceData) {
    const improvements = [];
    const { postureScore, gestures, speechAnalysis } = performanceData;

    if (postureScore < 70) {
      improvements.push({
        area: "Posture",
        suggestion: "Sit up straight with shoulders back to project confidence",
        priority: "High"
      });
    }

    if (gestures.eyeContact < 70) {
      improvements.push({
        area: "Eye Contact",
        suggestion: "Practice maintaining eye contact with the camera lens",
        priority: "Medium"
      });
    }

    if (speechAnalysis.fillerWords > 5) {
      improvements.push({
        area: "Speech Fluency",
        suggestion: "Practice pausing instead of using filler words like 'um' and 'like'",
        priority: "High"
      });
    }

    if (speechAnalysis.speakingRate > 160) {
      improvements.push({
        area: "Speaking Pace",
        suggestion: "Slow down your speaking pace for better clarity",
        priority: "Medium"
      });
    } else if (speechAnalysis.speakingRate < 100) {
      improvements.push({
        area: "Speaking Pace",
        suggestion: "Increase your speaking pace to maintain engagement",
        priority: "Medium"
      });
    }

    return improvements.sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  },

  // Generate summary report
  generateSummaryReport(performanceData, duration) {
    const overallScore = this.calculateConfidenceScore(performanceData);
    const insights = this.generatePerformanceInsights(performanceData);
    const improvements = this.identifyImprovementAreas(performanceData);

    const strengths = insights.filter(insight => 
      !insight.includes("Consider") && 
      !insight.includes("improving") && 
      !insight.includes("Reducing") &&
      !insight.includes("Working on") &&
      !insight.includes("Focus on")
    );

    return {
      overallScore,
      duration: Math.round(duration / 60), // Convert to minutes
      strengths,
      improvements,
      metrics: {
        posture: performanceData.postureScore,
        eyeContact: performanceData.gestures.eyeContact,
        speechConfidence: performanceData.speechAnalysis.confidence,
        responseQuality: performanceData.answerQuality || 75
      },
      recommendation: this.generateRecommendation(overallScore, improvements)
    };
  },

  // Generate personalized recommendation
  generateRecommendation(overallScore, improvements) {
    if (overallScore >= 85) {
      return "Excellent performance! Continue practicing to maintain these high standards.";
    } else if (overallScore >= 70) {
      return "Good performance with some areas for improvement. Focus on the highlighted areas.";
    } else if (overallScore >= 60) {
      return "Solid foundation with significant room for growth. Prioritize the high-impact improvements.";
    } else {
      return "Good effort! Focus on building fundamental skills through regular practice.";
    }
  },

  // Track progress over time
  calculateProgress(currentSession, previousSessions = []) {
    if (previousSessions.length === 0) {
      return {
        trend: "first_session",
        improvement: 0,
        message: "This is your first session. Great start!"
      };
    }

    const previousAvg = previousSessions.reduce((sum, session) => 
      sum + session.overallScore, 0) / previousSessions.length;

    const improvement = currentSession.overallScore - previousAvg;
    const trend = improvement > 5 ? "improving" : improvement < -5 ? "declining" : "stable";

    let message = "";
    if (trend === "improving") {
      message = `Great progress! You've improved by ${improvement.toFixed(1)} points.`;
    } else if (trend === "declining") {
      message = `Focus on consistent practice. Score decreased by ${Math.abs(improvement).toFixed(1)} points.`;
    } else {
      message = "Maintaining consistent performance. Keep practicing!";
    }

    return {
      trend,
      improvement: Math.round(improvement),
      message,
      currentScore: currentSession.overallScore,
      previousAverage: Math.round(previousAvg)
    };
  }
};