import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import {
  ArrowLeft,
  Download,
  Share2,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Loader
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ResultsPage() {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchResults();
    }
  }, [user, id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/interviews/${id}/results?userId=${user.id}`);
      
      if (!response.ok) {
        // Try to get basic interview data if results endpoint fails
        const interviewResponse = await fetch(`${API_URL}/interviews/${id}?userId=${user.id}`);
        if (interviewResponse.ok) {
          const interviewData = await interviewResponse.json();
          if (interviewData.success) {
            // Create basic results structure from interview data
            setResults({
              interview: interviewData.data,
              overallScore: interviewData.data.overallScore || 0,
              feedback: interviewData.data.status === 'completed' 
                ? "Interview completed successfully!" 
                : "Complete the interview to see results",
              metrics: {
                technical: interviewData.data.analysis?.technicalSkills || interviewData.data.results?.technicalScore || 0,
                communication: interviewData.data.analysis?.communication || interviewData.data.results?.communicationScore || 0,
                problemSolving: interviewData.data.analysis?.problemSolving || 0,
                confidence: interviewData.data.analysis?.confidence || 0
              },
              duration: interviewData.data.duration || 0,
              strengths: interviewData.data.analysis?.strengths || interviewData.data.results?.strengths || [],
              improvements: interviewData.data.analysis?.improvements || interviewData.data.results?.improvements || []
            });
            return;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      } else {
        toast.error(data.message || "Failed to load results");
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to load results. The interview data may not be available yet.");
      
      // Set default results to prevent page crash
      setResults({
        interview: { title: "Interview Results" },
        overallScore: 0,
        feedback: "Results are being processed...",
        metrics: {
          technical: 0,
          communication: 0,
          problemSolving: 0,
          confidence: 0
        },
        duration: 0,
        strengths: [],
        improvements: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreFeedback = (score) => {
    if (score >= 80) return 'Excellent!';
    if (score >= 60) return 'Good job!';
    return 'Needs practice';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-gray-600">No results found.</p>
            <button
              onClick={() => navigate('/interviews')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Interviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/interviews')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Interviews
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
              <p className="text-gray-600">{results.interview?.title}</p>
              <p className="text-sm text-gray-500">
                {results.interview?.jobPosition} • {results.interview?.interviewType}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center mb-8">
          <div className="max-w-md mx-auto">
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(results.overallScore)}`}>
              {results.overallScore}%
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Award className="w-6 h-6 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-700">
                {getScoreFeedback(results.overallScore)}
              </span>
            </div>
            <p className="text-gray-600">
              {results.feedback}
            </p>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {results.metrics?.technical || 0}%
            </div>
            <div className="text-sm text-gray-600">Technical Skills</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {results.metrics?.communication || 0}%
            </div>
            <div className="text-sm text-gray-600">Communication</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {results.metrics?.problemSolving || 0}%
            </div>
            <div className="text-sm text-gray-600">Problem Solving</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {results.duration || 0}m
            </div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {results.strengths && results.strengths.length > 0 ? (
                results.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    {strength}
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No strengths recorded</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {results.improvements && results.improvements.length > 0 ? (
                results.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    {improvement}
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No improvements suggested</li>
              )}
            </ul>
          </div>
        </div>

        {/* Question Analysis */}
        {results.questions && results.questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Question Analysis</h3>
            <div className="space-y-6">
              {results.questions.map((q, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        q.type === 'technical' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {q.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{q.question}</p>
                  
                  {q.userAnswer && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">Your Answer:</p>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded mt-1">
                        {q.userAnswer.text || "Audio response recorded"}
                      </p>
                    </div>
                  )}

                  {q.feedback && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Feedback:</p>
                      <p className="text-gray-600 bg-blue-50 p-3 rounded mt-1">
                        {q.feedback.detailedFeedback || "No specific feedback available"}
                      </p>
                      {q.feedback.score && (
                        <p className="text-sm text-gray-600 mt-2">
                          Score: <span className="font-medium">{q.feedback.score}%</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/interviews')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Practice Another Interview
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default ResultsPage;