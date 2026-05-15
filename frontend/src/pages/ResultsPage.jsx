import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import {
  ArrowLeft, Download, Star, TrendingUp,
  CheckCircle, Clock, Award, BarChart3, Loader,
  Brain, Target, BookOpen, AlertCircle, Lightbulb,
  ThumbsUp, ThumbsDown
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ResultsPage() {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    if (user && id) fetchResults();
  }, [user, id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/interviews/${id}/results?userId=${user.id}`);

      if (!response.ok) {
        // Fallback to raw interview data
        const interviewRes = await fetch(`${API_URL}/interviews/${id}?userId=${user.id}`);
        if (interviewRes.ok) {
          const interviewData = await interviewRes.json();
          if (interviewData.success) {
            const iv = interviewData.data;
            setResults({
              interview: iv,
              overallScore: iv.overallScore || 0,
              feedback: iv.analysis?.overallFeedback || iv.results?.overallFeedback || "Complete the interview to see full results.",
              metrics: {
                technical: iv.analysis?.technicalSkills || 0,
                communication: iv.analysis?.communication || 0,
                problemSolving: iv.analysis?.problemSolving || 0,
                confidence: iv.analysis?.confidence || 0
              },
              duration: iv.duration || 0,
              strengths: iv.analysis?.strengths || [],
              improvements: iv.analysis?.improvements || [],
              hiringRecommendation: iv.results?.hiringRecommendation || "",
              topPriorityToImprove: iv.results?.topPriorityToImprove || "",
              studyRecommendations: iv.results?.studyRecommendations || [],
              questions: iv.questions || []
            });
            return;
          }
        }
        throw new Error("Could not load results");
      }

      const data = await response.json();
      if (data.success) setResults(data.data);
      else toast.error(data.message || "Failed to load results");
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to load results.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Fair";
    return "Needs Work";
  };

  const getHiringColor = (rec) => {
    if (!rec) return "bg-gray-100 text-gray-700";
    if (rec.includes("Strong")) return "bg-green-100 text-green-800";
    if (rec === "Hire") return "bg-blue-100 text-blue-800";
    if (rec === "Maybe") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your results...</p>
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
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-4">Results not found.</p>
            <button onClick={() => navigate("/interviews")} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/interviews")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Results</h1>
              <p className="text-gray-500">{results.interview?.jobPosition} • {results.interview?.interviewType}</p>
            </div>
          </div>
        </div>

        {/* Overall score */}
        <div className={`rounded-2xl border-2 p-8 text-center mb-8 ${getScoreBg(results.overallScore)}`}>
          <Award className={`w-14 h-14 mx-auto mb-4 ${getScoreColor(results.overallScore)}`} />
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.overallScore)}`}>
            {results.overallScore}%
          </div>
          <div className="text-xl font-semibold text-gray-800 mb-3">{getScoreLabel(results.overallScore)}</div>

          {results.hiringRecommendation && (
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold mb-4 ${getHiringColor(results.hiringRecommendation)}`}>
              {results.hiringRecommendation.includes("Strong") || results.hiringRecommendation === "Hire"
                ? <ThumbsUp className="w-4 h-4" />
                : <ThumbsDown className="w-4 h-4" />
              }
              AI Verdict: {results.hiringRecommendation}
            </span>
          )}

          {results.feedback && (
            <p className="text-gray-700 max-w-2xl mx-auto">{results.feedback}</p>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Technical", value: results.metrics?.technical || 0, icon: <Brain className="w-6 h-6" />, color: "blue" },
            { label: "Communication", value: results.metrics?.communication || 0, icon: <Star className="w-6 h-6" />, color: "purple" },
            { label: "Problem Solving", value: results.metrics?.problemSolving || 0, icon: <TrendingUp className="w-6 h-6" />, color: "green" },
            { label: "Duration", value: `${results.duration || 0}m`, icon: <Clock className="w-6 h-6" />, color: "orange" },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <div className={`w-12 h-12 bg-${m.color}-100 text-${m.color}-600 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                {m.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{m.value}{typeof m.value === "number" ? "%" : ""}</div>
              <div className="text-sm text-gray-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Top priority + study recommendations */}
        {(results.topPriorityToImprove || results.studyRecommendations?.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> AI Action Plan
            </h3>

            {results.topPriorityToImprove && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Top Priority to Improve</p>
                <p className="text-amber-700">{results.topPriorityToImprove}</p>
              </div>
            )}

            {results.studyRecommendations?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Study These Topics</p>
                <div className="flex flex-wrap gap-2">
                  {results.studyRecommendations.map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Strengths
            </h3>
            {results.strengths?.length > 0 ? (
              <ul className="space-y-2">
                {results.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">Complete the interview to see strengths.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Areas to Improve
            </h3>
            {results.improvements?.length > 0 ? (
              <ul className="space-y-2">
                {results.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    {imp}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No improvements recorded yet.</p>
            )}
          </div>
        </div>

        {/* Per-question breakdown */}
        {results.questions?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Detailed Question Analysis</h3>
            <div className="space-y-4">
              {results.questions.map((q, i) => {
                const score = q.feedback?.score;
                const isExpanded = expandedQ === i;

                return (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(isExpanded ? null : i)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : score !== undefined ? "bg-red-400" : "bg-gray-300"
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-left line-clamp-1">{q.question}</p>
                            <div className="flex gap-2 mt-0.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                q.difficulty === "hard" ? "bg-red-100 text-red-700" :
                                q.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                              }`}>{q.difficulty}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{q.type}</span>
                            </div>
                          </div>
                        </div>
                        {score !== undefined && (
                          <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                        {q.userAnswer?.text && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">YOUR ANSWER</p>
                            <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border">{q.userAnswer.text}</p>
                          </div>
                        )}

                        {q.feedback?.detailedFeedback && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">AI FEEDBACK</p>
                            <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border">{q.feedback.detailedFeedback}</p>
                          </div>
                        )}

                        {q.feedback?.interviewerThought && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-1">INTERVIEWER'S THOUGHT</p>
                            <p className="text-sm text-blue-800 italic">"{q.feedback.interviewerThought}"</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          {q.feedback?.strengths?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-green-600 mb-1">STRENGTHS</p>
                              <ul className="space-y-1">
                                {q.feedback.strengths.map((s, si) => (
                                  <li key={si} className="text-xs text-gray-700 flex items-start gap-1">
                                    <span className="text-green-500 mt-0.5">✓</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {q.feedback?.improvements?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-orange-600 mb-1">IMPROVE</p>
                              <ul className="space-y-1">
                                {q.feedback.improvements.map((imp, ii) => (
                                  <li key={ii} className="text-xs text-gray-700 flex items-start gap-1">
                                    <span className="text-orange-500 mt-0.5">→</span> {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {q.feedback?.missedKeyPoints?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">MISSED KEY POINTS</p>
                            <div className="flex flex-wrap gap-1">
                              {q.feedback.missedKeyPoints.map((kp, ki) => (
                                <span key={ki} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">{kp}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.feedback?.exampleImprovements && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-1">HOW TO IMPROVE THIS ANSWER</p>
                            <p className="text-xs text-green-800">{q.feedback.exampleImprovements}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/interviews")}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-semibold"
          >
            Practice Another Interview
          </button>
          <button
            onClick={() => navigate("/syllabus")}
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 font-semibold"
          >
            <BookOpen className="w-4 h-4" /> Study Syllabus
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 font-semibold"
          >
            Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default ResultsPage;