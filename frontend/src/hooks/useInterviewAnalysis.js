import { useState, useCallback } from 'react';

export const useInterviewAnalysis = () => {
  const [analysis, setAnalysis] = useState({
    confidence: 65,
    clarity: 70,
    relevance: 75,
    feedback: "Good start! Try to maintain eye contact with the camera.",
    improvements: []
  });

  const startAnalysis = useCallback(() => {
    // Initialize analysis
    setAnalysis({
      confidence: 65,
      clarity: 70,
      relevance: 75,
      feedback: "Good start! Try to maintain eye contact with the camera.",
      improvements: []
    });
  }, []);

  const stopAnalysis = useCallback(() => {
    // Clean up analysis
  }, []);

  const updateAnalysis = useCallback((newData) => {
    setAnalysis(prev => ({
      ...prev,
      ...newData,
      confidence: Math.max(50, Math.min(95, prev.confidence + (Math.random() * 4 - 2))),
      clarity: Math.max(60, Math.min(90, prev.clarity + (Math.random() * 3 - 1.5)))
    }));
  }, []);

  return {
    analysis,
    startAnalysis,
    stopAnalysis,
    updateAnalysis
  };
};