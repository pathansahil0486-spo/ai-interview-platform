import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  ArrowLeft, Bookmark, Share2, Download, Loader, ExternalLink,
  Clock, Star, Tag, BookOpen, Video, FileText, Zap, Target,
  ChevronRight, Globe, Play, CheckCircle, Award, TrendingUp,
  Users, AlertCircle
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Local resource bank (mirrors PreparationPage) ─────────────────────────────
const ALL_RESOURCES = {
  // Student resources
  s1: { _id: "s1", title: "Board Exam Strategy Guide", type: "guide", category: "academic", duration: "12 min", difficulty: "beginner", rating: 4.8, description: "Complete strategy for CBSE/ICSE board exams with time management tips.", content: `<h2>Board Exam Strategy Guide</h2><p>Cracking board exams requires a balanced approach of concept clarity, smart revision, and timed practice. Here's your complete strategy:</p><h3>1. Understand the Exam Pattern</h3><p>Know the blueprint — how many marks per chapter, what type of questions appear (short, long, MCQ). Download the official CBSE/ICSE sample papers and mark scheme from the official website.</p><h3>2. Create a Subject-wise Schedule</h3><p>Divide your remaining time equally across subjects, giving more time to weak areas. Don't ignore strong subjects — maintain them.</p><h3>3. NCERT First, Everything Else Second</h3><p>For CBSE, NCERT books are the bible. In the last month, read NCERT at least twice. Every definition, theorem, and formula in NCERT has appeared in board exams.</p><h3>4. Revise with Mind Maps</h3><p>Create one-page mind maps for each chapter. This helps in quick revision the night before and solidifies concepts.</p><h3>5. Solve Previous Year Papers</h3><p>Solve at least 10 years of previous year papers under exam conditions. Analyze where you lose marks and revisit those topics.</p><h3>6. Time Management During Exam</h3><ul><li>Read the entire paper in the first 15 minutes</li><li>Attempt questions you know best first</li><li>Leave 10 minutes for revision</li><li>Never leave any question blank — attempt everything</li></ul>`, tags: ["boards", "strategy", "time-management"], externalUrl: "https://www.cbse.gov.in/", saved: false },
  s4: { _id: "s4", title: "JEE Mains Foundation Course", type: "video", category: "technical", duration: "45 min", difficulty: "advanced", rating: 4.9, description: "Start your JEE journey with a solid foundation in Physics, Chemistry, and Math.", content: `<h2>JEE Mains Foundation — Getting Started</h2><p>JEE is a marathon, not a sprint. Here's how to build a rock-solid foundation:</p><h3>Physics Foundation</h3><p>Start with Kinematics and Newton's Laws. These are the backbone of mechanics. HC Verma Vol 1 is non-negotiable. Solve every exercise, not just examples.</p><h3>Chemistry Foundation</h3><p>Organic Chemistry: Start with GOC (General Organic Chemistry) — it unlocks all reactions. Inorganic: NCERT is king. Physical: Maths-heavy, focus on formulas and conceptual understanding.</p><h3>Mathematics Foundation</h3><p>Master Algebra (quadratic, complex numbers, sequences) and Trigonometry before anything else. These appear everywhere.</p><h3>Study Resources</h3><ul><li>Physics: HC Verma + DC Pandey</li><li>Chemistry: NCERT + JD Lee (Inorganic) + Morrison Boyd (Organic)</li><li>Maths: RD Sharma + Cengage</li></ul>`, tags: ["JEE", "PCM", "engineering"], externalUrl: "https://www.youtube.com/@PWFoundation", saved: false },
  u1: { _id: "u1", title: "Data Structures & Algorithms for Placements", type: "video", category: "technical", duration: "1hr 20min", difficulty: "intermediate", rating: 4.9, description: "Complete DSA course covering arrays, trees, graphs, and DP for campus placements.", content: `<h2>DSA for Campus Placements</h2><p>This is the most important skill for tech placements. Here's the complete roadmap:</p><h3>Phase 1: Arrays & Strings (Week 1-2)</h3><p>Start with basic array operations, sliding window, two-pointer techniques. These appear in almost every interview.</p><h3>Phase 2: Linked Lists, Stacks, Queues (Week 3)</h3><p>Implement from scratch. Know reversals, cycle detection (Floyd's algorithm), and monotonic stacks.</p><h3>Phase 3: Trees & Graphs (Week 4-6)</h3><p>BFS, DFS, Binary Search Trees, AVL trees basics. Graph: Dijkstra, Bellman-Ford, Union-Find.</p><h3>Phase 4: Dynamic Programming (Week 7-8)</h3><p>Start with 1D DP (Fibonacci, climbing stairs), then 2D DP (LCS, LIS, knapsack). This is where interviews are won or lost.</p><h3>Practice Platforms</h3><ul><li>LeetCode (focus on Medium problems)</li><li>GeeksForGeeks (company-wise questions)</li><li>Codeforces (for competitive edge)</li></ul><h3>Target: 150+ LeetCode problems before campus season</h3>`, tags: ["DSA", "placements", "coding"], externalUrl: "https://www.youtube.com/watch?v=8hly31xKli0", saved: false },
  u2: { _id: "u2", title: "System Design Interview Prep", type: "guide", category: "technical", duration: "30 min", difficulty: "advanced", rating: 4.8, description: "Learn to design scalable systems like Netflix, Uber from scratch.", content: `<h2>System Design Interview Guide</h2><p>System design interviews test your ability to think at scale. Here's the framework:</p><h3>The RESHADED Framework</h3><ul><li><strong>R</strong> — Requirements (functional + non-functional)</li><li><strong>E</strong> — Estimation (QPS, storage, bandwidth)</li><li><strong>S</strong> — Storage Schema</li><li><strong>H</strong> — High-Level Design</li><li><strong>A</strong> — API Design</li><li><strong>D</strong> — Deep Dive (bottlenecks, scaling)</li><li><strong>E</strong> — Edge Cases</li><li><strong>D</strong> — Done (summarize)</li></ul><h3>Core Concepts You Must Know</h3><ul><li>Load Balancing (Round Robin, Least Connections, IP Hash)</li><li>CDN and Caching (Redis, Memcached, Cache Eviction Policies)</li><li>Database Sharding and Replication</li><li>Message Queues (Kafka, RabbitMQ)</li><li>Microservices vs Monolith</li><li>CAP Theorem and Consistency models</li></ul><h3>Practice Problems</h3><p>Design: URL Shortener, Twitter Feed, Uber, Netflix, WhatsApp, Google Drive</p>`, tags: ["system-design", "architecture", "FAANG"], externalUrl: "https://github.com/donnemartin/system-design-primer", saved: false },
  j9: { _id: "j9", title: "PM Case Study Framework (CIRCLES)", type: "guide", category: "technical", duration: "20 min", difficulty: "intermediate", rating: 4.9, description: "Master the CIRCLES framework for answering product case study questions.", content: `<h2>CIRCLES Method for PM Interviews</h2><p>The CIRCLES framework is the gold standard for structuring product management interview answers.</p><h3>C — Comprehend the Situation</h3><p>Ask clarifying questions. "Who is the user? What platform? What's the business goal?"</p><h3>I — Identify the Customer</h3><p>Define user segments. Create a persona. Who are we really building for?</p><h3>R — Report Customer Needs</h3><p>List pain points, jobs-to-be-done, and desires. Use user research or infer from context.</p><h3>C — Cut Through Prioritization</h3><p>Use a framework: RICE (Reach × Impact × Confidence / Effort) or Impact vs Effort matrix.</p><h3>L — List Solutions</h3><p>Brainstorm 3-5 solutions. Show creative thinking. Don't jump to one solution.</p><h3>E — Evaluate Tradeoffs</h3><p>Compare solutions on feasibility, impact, timeline. Pick one and defend it.</h3><h3>S — Summarize</h3><p>Recap your recommendation clearly. State next steps and success metrics.</p><h3>Practice Questions</h3><ul><li>Design a feature for Instagram to reduce misinformation</li><li>Improve YouTube's recommendation algorithm</li><li>Design an onboarding flow for a new fintech app</li></ul>`, tags: ["CIRCLES", "case-study", "PM"], externalUrl: "https://www.productplan.com/glossary/circles-method/", saved: false },
  j16: { _id: "j16", title: "McKinsey Case Interview Framework", type: "guide", category: "technical", duration: "30 min", difficulty: "advanced", rating: 4.9, description: "Master hypothesis-driven problem solving for MBB consulting interviews.", content: `<h2>McKinsey Case Interview Guide</h2><p>McKinsey cases are about structured thinking and clear communication. Here's how to crack them:</p><h3>The McKinsey Approach</h3><p>Start with a hypothesis. Don't explore aimlessly — structure your analysis around proving or disproving your initial hypothesis.</p><h3>MECE Framework</h3><p>Mutually Exclusive, Collectively Exhaustive. Every issue tree you draw should be MECE. Practice this daily.</p><h3>Common Case Types</h3><ul><li><strong>Profitability:</strong> Revenue vs Cost breakdown</li><li><strong>Market Entry:</strong> Attractiveness + Capability + Strategy</li><li><strong>M&A:</strong> Strategic fit + Financial viability</li><li><strong>Pricing:</strong> Cost-based vs Value-based vs Competitive</li></ul><h3>The 4-Step Case Process</h3><ol><li>Understand & restate the problem</li><li>Structure your approach (issue tree)</li><li>Analyze data and ask for information</li><li>Synthesize and recommend</li></ol><h3>Communication Tips</h3><p>"So what?" — Every piece of data should lead to an insight. Don't just say "revenue is $5M" — say "revenue is $5M, which is below industry average, suggesting a pricing problem."</p>`, tags: ["McKinsey", "case", "MBB"], externalUrl: "https://www.youtube.com/@StrategyU", saved: false },
  gj1: { _id: "gj1", title: "Behavioral Interview Master Guide", type: "guide", category: "behavioral", duration: "18 min", difficulty: "beginner", rating: 4.8, description: "The ultimate STAR method guide with 30 example answers.", content: `<h2>Behavioral Interview Mastery</h2><p>Behavioral interviews follow a pattern: "Tell me about a time when..." The key is the STAR method.</p><h3>The STAR Method</h3><ul><li><strong>S</strong> — Situation: Set the context briefly (1-2 sentences)</li><li><strong>T</strong> — Task: What was your responsibility?</li><li><strong>A</strong> — Action: What did YOU specifically do? (This is the main part)</li><li><strong>R</strong> — Result: Quantify the outcome if possible</li></ul><h3>Top 10 Behavioral Questions</h3><ol><li>Tell me about a time you failed</li><li>Describe a conflict with a coworker</li><li>Give an example of leadership under pressure</li><li>Tell me about a time you influenced without authority</li><li>Describe your biggest professional achievement</li><li>Tell me about a time you had to learn something quickly</li><li>How did you handle an ambiguous situation?</li><li>Tell me about a time you disagreed with your manager</li><li>Describe a time you took initiative</li><li>Tell me about a time you dealt with a difficult customer</li></ol><h3>Key Principles</h3><ul><li>Always quantify results (increased by 30%, reduced time by 2 hours)</li><li>Focus on YOUR actions, not the team's</li><li>Show self-awareness — what did you learn?</li><li>Prepare 7-8 strong stories that can flex to different questions</li></ul>`, tags: ["behavioral", "STAR", "universal"], externalUrl: "https://www.themuse.com/advice/star-interview-method", saved: false },
};

function getResourceById(id) {
  return ALL_RESOURCES[id] || null;
}

const TYPE_CONFIG = {
  guide: { icon: BookOpen, color: "bg-blue-100 text-blue-700", label: "Guide" },
  video: { icon: Video, color: "bg-purple-100 text-purple-700", label: "Video" },
  article: { icon: FileText, color: "bg-emerald-100 text-emerald-700", label: "Article" },
  practice: { icon: Zap, color: "bg-orange-100 text-orange-700", label: "Practice" },
};

const DIFF_CONFIG = {
  beginner: { color: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", width: "33%" },
  intermediate: { color: "bg-amber-100 text-amber-700", bar: "bg-amber-500", width: "66%" },
  advanced: { color: "bg-red-100 text-red-700", bar: "bg-red-500", width: "100%" },
};

function ResourceDetailPage() {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    if (user && id) fetchResource();
  }, [user, id]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById("resource-content");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(100, Math.round((scrolled / totalHeight) * 100));
      setReadProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [resource]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      // Try API first
      try {
        const response = await fetch(`${API_URL}/preparation/resources/${id}?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setResource(data.data);
            setSaved(data.data.saved || false);
            setLoading(false);
            return;
          }
        }
      } catch (_) {}

      // Fallback to local data
      const localResource = getResourceById(id);
      if (localResource) {
        setResource(localResource);
        setSaved(localResource.saved || false);
      } else {
        toast.error("Resource not found");
        navigate("/preparation");
      }
    } catch (error) {
      console.error("Error fetching resource:", error);
      toast.error("Failed to load resource");
      navigate("/preparation");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (resource?._id && !resource._id.startsWith("s") && !resource._id.startsWith("u") && !resource._id.startsWith("j") && !resource._id.startsWith("g")) {
        await fetch(`${API_URL}/preparation/resources/${id}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
      }
      setSaved(!saved);
      toast.success(saved ? "Removed from saved!" : "Saved to library!");
    } catch {
      setSaved(!saved);
      toast.success(saved ? "Removed from saved!" : "Saved to library!");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const url = resource?.externalUrl || window.location.href;
    const text = `Check out: ${resource?.title} — ${resource?.description}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: resource?.title, text: resource?.description, url });
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast("Could not share");
    }
  };

  const handleDownload = () => {
    if (!resource) return;
    const raw = resource.content?.replace(/<[^>]+>/g, "") || resource.description;
    const text = `${resource.title}\n${"=".repeat(resource.title.length)}\n\n${resource.description}\n\nDifficulty: ${resource.difficulty} | Duration: ${resource.duration} | Rating: ${resource.rating}/5\n\n${raw}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resource.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const handleOpenExternal = () => {
    if (resource?.externalUrl) {
      window.open(resource.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        
        <div className="flex items-center justify-center h-[calc(100vh-70px)]">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto animate-pulse">
              <Loader className="w-7 h-7 text-white animate-spin" />
            </div>
            <p className="text-gray-500 font-medium">Loading resource…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resource) return null;

  const typeConf = TYPE_CONFIG[resource.type] || TYPE_CONFIG.guide;
  const diffConf = DIFF_CONFIG[resource.difficulty] || DIFF_CONFIG.beginner;
  const TypeIcon = typeConf.icon;

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/preparation")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm font-medium group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Resources
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Colored top strip based on type */}
          <div className={`h-1.5 ${
            resource.type === "guide" ? "bg-gradient-to-r from-blue-500 to-blue-600" :
            resource.type === "video" ? "bg-gradient-to-r from-purple-500 to-purple-600" :
            resource.type === "article" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
            "bg-gradient-to-r from-orange-500 to-orange-600"
          }`} />

          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${typeConf.color}`}>
                  <TypeIcon className="w-4 h-4" /> {typeConf.label}
                </span>
                <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${diffConf.color}`}>
                  {resource.difficulty}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" /> {resource.duration}
                </span>
                <span className="flex items-center gap-1 text-sm text-amber-600 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {resource.rating}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  title={saved ? "Remove from saved" : "Save"}
                >
                  {saving ? (
                    <Loader className="w-4 h-4 animate-spin text-purple-600" />
                  ) : (
                    <Bookmark className={`w-4 h-4 ${saved ? "fill-purple-600 text-purple-600" : "text-gray-400"}`} />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">{resource.title}</h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-5">{resource.description}</p>

            {/* Tags */}
            {resource.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                    <Tag className="w-3 h-3" />#{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div id="resource-content" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              {resource.content ? (
                <div
                  className="prose prose-gray max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:first:mt-0
                    prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-gray-800
                    prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
                    prose-ul:text-gray-600 prose-ul:space-y-1.5
                    prose-ol:text-gray-600 prose-ol:space-y-1.5
                    prose-li:leading-relaxed
                    prose-strong:text-gray-800 prose-strong:font-semibold"
                  dangerouslySetInnerHTML={{ __html: resource.content }}
                />
              ) : (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">This resource is hosted externally.</p>
                  <p className="text-gray-400 text-sm mb-6">Click the button below to open it in a new tab.</p>
                  {resource.externalUrl && (
                    <button
                      onClick={handleOpenExternal}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold mx-auto hover:shadow-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Resource
                    </button>
                  )}
                </div>
              )}

              {/* Read Progress */}
              {resource.content && readProgress > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 font-medium">Reading progress</span>
                    <span className="text-sm font-bold text-purple-600">{readProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                      style={{ width: `${readProgress}%` }}
                    />
                  </div>
                  {readProgress === 100 && (
                    <div className="flex items-center gap-2 mt-3 text-emerald-600 text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Resource completed!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Resource Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className={`px-2.5 py-1 rounded-lg font-medium text-xs ${typeConf.color}`}>{typeConf.label}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-800">{resource.duration}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Difficulty</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${diffConf.bar}`} style={{ width: diffConf.width }} />
                    </div>
                    <span className="font-medium text-gray-800 text-xs capitalize">{resource.difficulty}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-gray-800">{resource.rating}</span>
                    <span className="text-gray-400 text-xs">/ 5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Open External Link */}
            {resource.externalUrl && (
              <button
                onClick={handleOpenExternal}
                className="w-full flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-2xl font-semibold text-sm hover:shadow-lg transition-all group"
              >
                <span className="flex items-center gap-2">
                  {resource.type === "video" ? <Play className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {resource.type === "video" ? "Watch Full Video" : "Open Full Resource"}
                </span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Practice CTA */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-gray-900 text-sm">Ready to Practice?</span>
              </div>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                Apply what you've learned with an AI-powered mock interview session.
              </p>
              <button
                onClick={() => navigate("/interviews")}
                className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
              >
                <Zap className="w-4 h-4" /> Start Mock Interview
              </button>
            </div>

            {/* More Resources CTA */}
            <button
              onClick={() => navigate("/preparation")}
              className="w-full flex items-center justify-between bg-white border border-gray-100 shadow-sm p-4 rounded-2xl text-sm font-medium text-gray-700 hover:shadow-md transition-all group"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                Browse More Resources
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResourceDetailPage;