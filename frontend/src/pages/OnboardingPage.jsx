import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  GraduationCap,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BookOpen,
  Code,
  Layers,
  Target,
  Loader,
  Sparkles,
  User
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Data ──────────────────────────────────────────────────────────────────────

const STUDENT_CLASSES = ["10th", "11th", "12th", "Undergraduate", "Postgraduate", "PhD"];

const STUDENT_STREAMS = {
  "10th": ["General"],
  "11th": ["Science (PCM)", "Science (PCB)", "Commerce", "Arts / Humanities"],
  "12th": ["Science (PCM)", "Science (PCB)", "Commerce", "Arts / Humanities"],
  Undergraduate: ["Engineering / Technology", "Medical / Health Sciences", "Commerce / Business", "Arts / Humanities", "Law", "Design", "Other"],
  Postgraduate: ["MBA", "M.Tech", "M.Sc", "MA", "LLM", "Other"],
  PhD: ["Science", "Engineering", "Management", "Humanities", "Other"],
};

const STUDENT_GOALS = [
  "Crack competitive exams (JEE / NEET / UPSC etc.)",
  "Campus placements",
  "Higher studies / MS abroad",
  "Internships",
  "Skill development",
  "Entrepreneurship",
];

const JOB_DOMAINS = [
  "Software Development", "Data Science / AI / ML", "Product Management",
  "Design (UI/UX)", "Marketing / Growth", "Sales / Business Development",
  "Finance / Accounting", "Human Resources", "Operations", "Consulting", "Other"
];

const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher", desc: "0 – 1 year" },
  { value: "junior", label: "Junior", desc: "1 – 3 years" },
  { value: "mid", label: "Mid-level", desc: "3 – 6 years" },
  { value: "senior", label: "Senior", desc: "6 – 10 years" },
  { value: "lead", label: "Lead / Principal", desc: "10+ years" },
];

const JOB_GOALS = [
  "Get my first job", "Switch careers", "Get a promotion",
  "Move to a top company", "Crack FAANG / MNC", "Freelance / Remote work",
];

const SKILL_SUGGESTIONS = [
  "JavaScript", "Python", "React", "Node.js", "Java", "C++",
  "SQL", "Machine Learning", "System Design", "TypeScript",
  "AWS", "Docker", "Communication", "Leadership",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProgressBar({ step, total }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
      <div
        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  );
}

function OptionCard({ selected, onClick, icon, title, desc }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
        selected
          ? "border-blue-600 bg-blue-50 shadow-md scale-[1.01]"
          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        selected ? "bg-gradient-to-br from-blue-600 to-purple-600" : "bg-gray-100"
      }`}>
        <span className={selected ? "text-white" : "text-gray-500"}>{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {selected && <CheckCircle className="w-5 h-5 text-blue-600 ml-auto flex-shrink-0" />}
    </button>
  );
}

function ChipSelect({ options, selected, onToggle, max }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        const disabled = !isSelected && max && selected.length >= max;
        return (
          <button
            key={opt}
            onClick={() => !disabled && onToggle(opt)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
              isSelected
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-sm"
                : disabled
                ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function OnboardingPage({ onComplete }) {
  const { user } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Shared
  const [role, setRole] = useState(""); // "student" | "jobseeker"

  // Student
  const [studentClass, setStudentClass] = useState("");
  const [stream, setStream] = useState("");
  const [college, setCollege] = useState("");
  const [studentGoals, setStudentGoals] = useState([]);

  // Job Seeker
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [domain, setDomain] = useState("");
  const [experience, setExperience] = useState("");
  const [targetRoles, setTargetRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [jobGoals, setJobGoals] = useState([]);

  const totalSteps = role === "student" ? 4 : role === "jobseeker" ? 5 : 2;

  const toggleItem = (list, setList, item, max) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else if (!max || list.length < max) {
      setList([...list, item]);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!role;
    if (role === "student") {
      if (step === 2) return !!studentClass && !!stream;
      if (step === 3) return true; // college optional
      if (step === 4) return studentGoals.length > 0;
    }
    if (role === "jobseeker") {
      if (step === 2) return !!domain && !!experience;
      if (step === 3) return true;
      if (step === 4) return skills.length > 0;
      if (step === 5) return jobGoals.length > 0;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImageUrl,
        onboarded: true,
        userType: role,
        ...(role === "student" && {
          studentClass,
          stream,
          college,
          goals: studentGoals,
          experienceLevel: "entry",
        }),
        ...(role === "jobseeker" && {
          jobTitle,
          company,
          domain,
          experienceLevel: experience,
          targetRoles,
          skills,
          goals: jobGoals,
        }),
      };

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Welcome to SMART InterviewAi! 🎉");
        onComplete();
        navigate("/dashboard");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error(error);
      // Don't block user if API fails
      toast.success("Welcome to SMART InterviewAi! 🎉");
      onComplete();
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderStep = () => {
    // Step 1 — Role selection (common)
    if (step === 1) {
      return (
        <div className="space-y-4">
          <OptionCard
            selected={role === "student"}
            onClick={() => setRole("student")}
            icon={<GraduationCap className="w-6 h-6" />}
            title="I'm a Student"
            desc="School, college, or university student preparing for future opportunities"
          />
          <OptionCard
            selected={role === "jobseeker"}
            onClick={() => setRole("jobseeker")}
            icon={<Briefcase className="w-6 h-6" />}
            title="I'm a Job Seeker"
            desc="Working professional or fresher actively looking for job opportunities"
          />
        </div>
      );
    }

    // ── STUDENT STEPS ───────────────────────────────────────────────────────

    if (role === "student") {
      if (step === 2) {
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Current Class / Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STUDENT_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => { setStudentClass(cls); setStream(""); }}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      studentClass === cls
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {studentClass && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Stream / Branch</label>
                <div className="space-y-2">
                  {(STUDENT_STREAMS[studentClass] || []).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStream(s)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        stream === s
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      if (step === 3) {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College / School Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Delhi, Delhi Public School..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50"
              />
            </div>
            <p className="text-xs text-gray-400">This helps us personalise your preparation content.</p>
          </div>
        );
      }

      if (step === 4) {
        return (
          <div>
            <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
            <ChipSelect
              options={STUDENT_GOALS}
              selected={studentGoals}
              onToggle={(g) => toggleItem(studentGoals, setStudentGoals, g)}
            />
          </div>
        );
      }
    }

    // ── JOB SEEKER STEPS ────────────────────────────────────────────────────

    if (role === "jobseeker") {
      if (step === 2) {
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Domain / Field</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {JOB_DOMAINS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      domain === d
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Experience Level</label>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <OptionCard
                    key={lvl.value}
                    selected={experience === lvl.value}
                    onClick={() => setExperience(lvl.value)}
                    icon={<Briefcase className="w-5 h-5" />}
                    title={lvl.label}
                    desc={lvl.desc}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (step === 3) {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Job Title <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Company <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Infosys, Startup..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Roles <span className="text-gray-400">(type and press Enter)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior React Developer, Data Scientist..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    setTargetRoles([...targetRoles, e.target.value.trim()]);
                    e.target.value = "";
                  }
                }}
              />
              {targetRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {targetRoles.map((r, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {r}
                      <button onClick={() => setTargetRoles(targetRoles.filter((_, j) => j !== i))} className="ml-1 text-blue-400 hover:text-blue-700">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (step === 4) {
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Pick your top skills (select all that apply)</p>
            <ChipSelect
              options={SKILL_SUGGESTIONS}
              selected={skills}
              onToggle={(s) => toggleItem(skills, setSkills, s)}
            />
            <div>
              <input
                type="text"
                placeholder="Add a custom skill and press Enter..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50 mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    if (!skills.includes(e.target.value.trim())) {
                      setSkills([...skills, e.target.value.trim()]);
                    }
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        );
      }

      if (step === 5) {
        return (
          <div>
            <p className="text-sm text-gray-500 mb-4">What are you aiming for? (select all that apply)</p>
            <ChipSelect
              options={JOB_GOALS}
              selected={jobGoals}
              onToggle={(g) => toggleItem(jobGoals, setJobGoals, g)}
            />
          </div>
        );
      }
    }
  };

  const stepTitles = () => {
    if (step === 1) return { title: "Who are you?", sub: "Help us personalise your experience" };
    if (role === "student") {
      if (step === 2) return { title: "Your academics", sub: "Tell us about your current studies" };
      if (step === 3) return { title: "Your institution", sub: "Where are you studying?" };
      if (step === 4) return { title: "Your goals", sub: "What are you working towards?" };
    }
    if (role === "jobseeker") {
      if (step === 2) return { title: "Your field & experience", sub: "Tell us about your professional background" };
      if (step === 3) return { title: "Your current role", sub: "Where are you right now?" };
      if (step === 4) return { title: "Your skills", sub: "What are you good at?" };
      if (step === 5) return { title: "Your ambitions", sub: "What are you aiming for?" };
    }
    return { title: "", sub: "" };
  };

  const { title, sub } = stepTitles();
  const isLastStep = step === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/logop.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-mono tracking-wider">
            SMART InterviewAi
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          {/* Progress */}
          <ProgressBar step={step} total={totalSteps} />

          {/* Step counter */}
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
            Step {step} of {totalSteps}
          </p>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-gray-500 text-sm mb-6">{sub}</p>

          {/* Step content */}
          <div className="min-h-[200px]">
            {renderStep()}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            <button
              onClick={isLastStep ? handleSave : () => setStep(step + 1)}
              disabled={!canProceed() || saving}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-md"
            >
              {saving ? (
                <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
              ) : isLastStep ? (
                <><Sparkles className="w-4 h-4" /> Let's Go!</>
              ) : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Skip */}
          {step > 1 && (
            <button
              onClick={() => {
                onComplete();
                navigate("/dashboard");
              }}
              className="w-full mt-3 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          You can always update this info in your Profile settings.
        </p>
      </div>
    </div>
  );
}

export default OnboardingPage;