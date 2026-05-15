const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class AIService {
  constructor() {
    this.baseURL = API_URL;
  }

  async generateInterviewQuestions(interviewData) {
    try {
      const response = await fetch(`${this.baseURL}/ai/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating interview questions:', error);
      throw error;
    }
  }

  async analyzeAnswer(question, answer, context = {}) {
    try {
      const response = await fetch(`${this.baseURL}/ai/analyze-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer,
          context
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error analyzing answer:', error);
      throw error;
    }
  }

  async getAIResponse(conversationHistory, currentContext) {
    try {
      const response = await fetch(`${this.baseURL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: conversationHistory,
          context: currentContext
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  }

  async analyzeGestures(gestureData) {
    try {
      const response = await fetch(`${this.baseURL}/ai/analyze-gestures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gestureData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error analyzing gestures:', error);
      throw error;
    }
  }

  async generateFeedback(interviewData, performanceMetrics) {
    try {
      const response = await fetch(`${this.baseURL}/ai/generate-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interview: interviewData,
          performance: performanceMetrics
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();