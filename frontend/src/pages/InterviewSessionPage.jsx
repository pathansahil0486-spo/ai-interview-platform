import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Clock,
  HelpCircle,
  CheckCircle,
  Loader,
  Mic,
  Square
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function InterviewSessionPage() {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchInterview();
    }
  }, [user, id]);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Cleanup media recorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaRecorder]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/interviews/${id}?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setInterview(data.data);
        // Initialize answers state
        const initialAnswers = data.data.questions.reduce((acc, q) => {
          acc[q._id || q.id] = { 
            text: '', 
            audio: null, 
            timeSpent: 0,
            questionId: q._id || q.id
          };
          return acc;
        }, {});
        setAnswers(initialAnswers);
      } else {
        toast.error(data.message || "Failed to load interview");
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
      toast.error("Failed to load interview");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        const currentQuestion = interview.questions[currentQuestionIndex];
        setAnswers(prev => ({
          ...prev,
          [currentQuestion._id || currentQuestion.id]: {
            ...prev[currentQuestion._id || currentQuestion.id],
            audio: blob
          }
        }));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setIsTimerRunning(true);
      setTimer(0);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check your microphone permissions.");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      setIsTimerRunning(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder, recording]);

  const handleAnswerChange = (text) => {
    const currentQuestion = interview.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion._id || currentQuestion.id]: {
        ...prev[currentQuestion._id || currentQuestion.id],
        text,
        timeSpent: timer
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimer(0);
      setIsTimerRunning(false);
      setAudioBlob(null);
      stopRecording();
    } else {
      handleSubmitInterview();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setTimer(0);
      setIsTimerRunning(false);
      setAudioBlob(null);
      stopRecording();
    }
  };

  const handleSubmitInterview = async () => {
    try {
      setSubmitting(true);
      
      // Prepare answers for submission
      const submissionData = {
        answers: Object.values(answers),
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/interviews/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Interview completed successfully!");
        navigate(`/interview/${id}/results`);
      } else {
        toast.error(data.message || "Failed to submit interview");
      }
    } catch (error) {
      console.error("Error submitting interview:", error);
      toast.error("Failed to submit interview");
    } finally {
      setSubmitting(false);
    }
  };

  const saveProgress = async () => {
    try {
      const currentQuestion = interview.questions[currentQuestionIndex];
      const currentAnswer = answers[currentQuestion._id || currentQuestion.id];
      
      await fetch(`${API_URL}/interviews/${id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentQuestionIndex,
          answers: currentAnswer
        })
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Auto-save progress when moving between questions
  useEffect(() => {
    if (interview && Object.keys(answers).length > 0) {
      saveProgress();
    }
  }, [currentQuestionIndex, answers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading interview session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview not found</h3>
            <button
              onClick={() => navigate('/interviews')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Interviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;
  const currentAnswer = answers[currentQuestion._id || currentQuestion.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {interview.questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interview Info */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{interview.title}</h1>
          <p className="text-gray-600 mb-4">{interview.jobPosition}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className={`px-3 py-1 rounded-full ${
              currentQuestion.type === 'technical' 
                ? 'bg-purple-100 text-purple-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {currentQuestion.type}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {currentQuestion.timeLimit} seconds
            </span>
            <span>Difficulty: {currentQuestion.difficulty}</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQuestion.question}
          </h2>

          {/* Answer Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                value={currentAnswer?.text || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here or use the voice recording feature..."
                className="w-full h-32 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={recording}
              />
            </div>

            {/* Voice Recording */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {!recording ? (
                <div>
                  <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Record your answer for better practice and feedback
                  </p>
                  <button
                    onClick={startRecording}
                    disabled={recording}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors mx-auto disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    Start Recording
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-gray-600 mb-4">Recording in progress... {timer}s</p>
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors mx-auto"
                  >
                    <Square className="w-5 h-5" />
                    Stop Recording
                  </button>
                </div>
              )}
            </div>

            {audioBlob && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Recording saved</span>
                </div>
                <audio controls className="w-full">
                  <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : currentQuestionIndex === interview.questions.length - 1 ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Interview
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

export default InterviewSessionPage;