// utils/feedbackGenerator.js
export const generatePersonalizedFeedback = (results, questions = []) => {
  const { metrics, duration, overallScore } = results;
  
  // Calculate performance insights
  const technicalScore = metrics?.technical || 0;
  const communicationScore = metrics?.communication || 0;
  const problemSolvingScore = metrics?.problemSolving || 0;
  const confidenceScore = metrics?.confidence || 0;

  // Generate strengths based on performance
  const strengths = [];
  if (technicalScore >= 80) {
    strengths.push("Excellent technical knowledge and depth");
  } else if (technicalScore >= 60) {
    strengths.push("Solid technical foundation with good understanding");
  }

  if (communicationScore >= 80) {
    strengths.push("Clear, articulate communication style");
  } else if (communicationScore >= 60) {
    strengths.push("Good communication with room for refinement");
  }

  if (problemSolvingScore >= 80) {
    strengths.push("Strong analytical and problem-solving approach");
  } else if (problemSolvingScore >= 60) {
    strengths.push("Logical problem-solving methodology");
  }

  if (confidenceScore >= 80) {
    strengths.push("Confident and professional demeanor");
  }

  // Generate improvements
  const improvements = [];
  if (technicalScore < 70) {
    improvements.push("Deepen technical knowledge in core concepts");
  }
  if (communicationScore < 70) {
    improvements.push("Practice structuring answers more clearly");
  }
  if (problemSolvingScore < 70) {
    improvements.push("Work on breaking down complex problems systematically");
  }
  if (confidenceScore < 70) {
    improvements.push("Build confidence through more practice interviews");
  }

  // Time management feedback
  if (duration < 5) {
    improvements.push("Provide more detailed answers - aim for 2-3 minutes per question");
  } else if (duration > 45) {
    improvements.push("Work on being more concise in your responses");
  }

  // Generate overall feedback
  let feedback = "";
  if (overallScore >= 90) {
    feedback = "Outstanding performance! You demonstrated exceptional skills across all areas with strong technical depth and excellent communication.";
  } else if (overallScore >= 80) {
    feedback = "Excellent performance! You showed strong technical knowledge and good communication skills. Continue building on this solid foundation.";
  } else if (overallScore >= 70) {
    feedback = "Good performance! You have a solid foundation with clear strengths. Focus on the identified areas to reach the next level.";
  } else if (overallScore >= 60) {
    feedback = "Promising performance! You have the basic skills needed. With focused practice on the improvement areas, you'll see significant progress.";
  } else {
    feedback = "This was a good first attempt! Focus on building fundamental knowledge and practicing regularly to improve your scores.";
  }

  // Add question-specific insights if available
  if (questions.length > 0) {
    const difficultQuestions = questions.filter(q => 
      q.feedback?.score < 60 || q.difficulty === 'hard'
    );
    
    if (difficultQuestions.length > 0) {
      improvements.push(`Review ${difficultQuestions.length} challenging questions to strengthen weak areas`);
    }
  }

  return {
    strengths: strengths.length > 0 ? strengths : ["Good overall performance with balanced skills"],
    improvements: improvements.length > 0 ? improvements : ["Continue practicing to maintain your current level"],
    feedback,
    metrics: {
      technical: technicalScore,
      communication: communicationScore,
      problemSolving: problemSolvingScore,
      confidence: confidenceScore
    }
  };
};

// Calculate realistic scores based on question performance
export const calculateRealisticScores = (questions = []) => {
  if (!questions || questions.length === 0) {
    return {
      overallScore: Math.floor(Math.random() * 30) + 50, // 50-80 range for no data
      technical: Math.floor(Math.random() * 30) + 50,
      communication: Math.floor(Math.random() * 30) + 50,
      problemSolving: Math.floor(Math.random() * 30) + 50,
      confidence: Math.floor(Math.random() * 30) + 50
    };
  }

  let totalScore = 0;
  let technicalTotal = 0;
  let communicationTotal = 0;
  let problemSolvingTotal = 0;
  let confidenceTotal = 0;
  let count = 0;

  questions.forEach(question => {
    const questionScore = question.feedback?.score || 
                         (question.difficulty === 'easy' ? 75 :
                          question.difficulty === 'medium' ? 65 : 55);
    
    totalScore += questionScore;
    
    // Distribute scores based on question type and performance
    if (question.type === 'technical') {
      technicalTotal += questionScore;
      problemSolvingTotal += questionScore * 0.8;
      communicationTotal += questionScore * 0.6;
    } else {
      communicationTotal += questionScore;
      technicalTotal += questionScore * 0.4;
      problemSolvingTotal += questionScore * 0.7;
    }
    
    confidenceTotal += Math.min(questionScore + 10, 95);
    count++;
  });

  return {
    overallScore: Math.round(totalScore / count),
    technical: Math.round(technicalTotal / count),
    communication: Math.round(communicationTotal / count),
    problemSolving: Math.round(problemSolvingTotal / count),
    confidence: Math.round(confidenceTotal / count)
  };
};