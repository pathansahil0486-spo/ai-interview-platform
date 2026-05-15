import { useState } from "react";
import { Link } from "react-router";
import {
  Mail, MessageSquare, Phone, MapPin, Send,
  Twitter, Linkedin, Github, Youtube,
  CheckCircle, Sparkles, Clock, Headphones
} from "lucide-react";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ── EmailJS config — fill these from your EmailJS dashboard ──────────────────
// 1. Sign up free at https://emailjs.com
// 2. Add Email Service (connect your Gmail) → copy Service ID
// 3. Create Email Template with vars: {{name}}, {{email}}, {{subject}}, {{message}}
//    → copy Template ID
// 4. Account tab → copy Public Key
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || "YOUR_CONTACT_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || "YOUR_PUBLIC_KEY";

const CONTACT_STYLES = `
  .contact-page * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
  .contact-page { min-height: 100vh; background: #faf9fd; }

  .contact-card {
    background: #fff;
    border: 1.5px solid #ece9f8;
    border-radius: 20px;
    box-shadow: 0 2px 16px rgba(91,62,245,.05);
  }

  .contact-input {
    width: 100%; padding: 12px 14px; border-radius: 12px;
    border: 1.5px solid #ece9f8; background: #faf9fd;
    font-size: 14px; font-family: 'Inter', sans-serif; color: #0f0e17;
    outline: none; transition: border-color .18s, box-shadow .18s;
  }
  .contact-input:focus { border-color: #5b3ef5; box-shadow: 0 0 0 3px rgba(91,62,245,.10); background: #fff; }
  .contact-input::placeholder { color: #9d96c8; }

  .contact-label {
    display: block; font-size: 13px; font-weight: 600;
    color: #2d2b3d; margin-bottom: 6px;
  }

  .contact-submit {
    width: 100%; padding: 13px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg,#5b3ef5,#9b6ff7);
    color: #fff; font-size: 15px; font-weight: 700;
    font-family: 'Inter', sans-serif; display: flex; align-items: center;
    justify-content: center; gap: 8px;
    box-shadow: 0 6px 22px rgba(91,62,245,.35);
    transition: transform .2s, box-shadow .2s;
  }
  .contact-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(91,62,245,.45); }
  .contact-submit:disabled { opacity: .65; cursor: not-allowed; }

  .info-card {
    display: flex; align-items: flex-start; gap: 14px;
    background: #fff; border: 1.5px solid #ece9f8;
    border-radius: 16px; padding: 18px 20px;
    transition: transform .2s, box-shadow .2s;
  }
  .info-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(91,62,245,.09); }

  .f-social {
    width: 36px; height: 36px; border-radius: 11px;
    background: #f0eeff; color: #5b3ef5;
    display: flex; align-items: center; justify-content: center;
    transition: background .18s, color .18s, transform .18s, box-shadow .18s;
    text-decoration: none;
  }
  .f-social:hover {
    background: linear-gradient(135deg,#5b3ef5,#a855f7);
    color: #fff; transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(91,62,245,.3);
  }

  .gradient-text {
    background: linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation: fadeUp .5s ease both; }

  .select-custom {
    width: 100%; padding: 12px 14px; border-radius: 12px;
    border: 1.5px solid #ece9f8; background: #faf9fd;
    font-size: 14px; font-family: 'Inter', sans-serif; color: #0f0e17;
    outline: none; cursor: pointer;
    transition: border-color .18s, box-shadow .18s;
    -webkit-appearance: none;
  }
  .select-custom:focus { border-color: #5b3ef5; box-shadow: 0 0 0 3px rgba(91,62,245,.10); background: #fff; }

  @media(max-width:767px){
    .contact-hero-title { font-size: 30px !important; }
    .contact-grid { grid-template-columns: 1fr !important; }
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

const INFO = [
  { icon: Mail,          bg: "#f0eeff", color: "#5b3ef5", title: "Email Us",      sub: "support@smartinterviewai.com", note: "We reply within 24 hours" },
  { icon: MessageSquare, bg: "#fdf0ff", color: "#a855f7", title: "Live Chat",     sub: "Available on Dashboard",       note: "Mon–Fri, 9am–6pm IST" },
  { icon: Clock,         bg: "#fff7e6", color: "#f5a623", title: "Response Time", sub: "Under 24 hours",               note: "For all support queries" },
  { icon: Headphones,    bg: "#e6fff8", color: "#00d4aa", title: "Help Center",   sub: "Searchable AI knowledge base", note: "Available 24/7" },
];

const SOCIAL = [
  { href: "https://twitter.com",  Icon: Twitter,  label: "Twitter"  },
  { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
  { href: "https://github.com",   Icon: Github,   label: "GitHub"   },
  { href: "https://youtube.com",  Icon: Youtube,  label: "YouTube"  },
];

const SUBJECTS = [
  "General Enquiry",
  "Technical Support",
  "Billing / Account",
  "Feature Request",
  "Partnership",
  "Press / Media",
  "Other",
];

export default function ContactPage() {
  const [form, setForm]     = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSending(true);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name:    form.name,
          email:   form.email,
          subject: form.subject,
          message: form.message,
        },
        EMAILJS_PUBLIC_KEY
      );
      setSending(false);
      setSent(true);
      setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" });
      toast.success("Message sent successfully!");
    } catch (err) {
      console.error("EmailJS error:", err);
      toast.error("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  return (
    <>
      <style>{CONTACT_STYLES}</style>
      <div className="contact-page">
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>

          {/* ── Hero ── */}
          <section className="fade-up" style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 99, padding: "6px 16px", marginBottom: 20 }}>
              <MessageSquare style={{ width: 13, height: 13, color: "#5b3ef5" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#5b3ef5" }}>Get in Touch</span>
            </div>
            <h1 className="contact-hero-title" style={{ fontSize: 42, fontWeight: 900, color: "#0f0e17", margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-1px" }}>
              We'd love to <span className="gradient-text">hear from you</span>
            </h1>
            <p style={{ fontSize: 16, color: "#6b6880", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              Have a question, suggestion, or just want to say hi? Our team is here and happy to help.
            </p>
          </section>

          {/* ── Info cards ── */}
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              {INFO.map(({ icon: Icon, bg, color, title, sub, note }) => (
                <div key={title} className="info-card">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: 18, height: 18, color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f0e17", margin: "0 0 3px" }}>{title}</p>
                    <p style={{ fontSize: 12, color: "#4b4869", margin: "0 0 2px", fontWeight: 500 }}>{sub}</p>
                    <p style={{ fontSize: 11, color: "#9d96c8", margin: 0 }}>{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Main grid ── */}
          <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24 }}>

            {/* Form */}
            <div className="contact-card" style={{ padding: "36px 32px" }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: "#e6fff8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <CheckCircle style={{ width: 30, height: 30, color: "#00d4aa" }} />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f0e17", margin: "0 0 10px" }}>Message sent!</h2>
                  <p style={{ fontSize: 14, color: "#6b6880", margin: "0 0 24px", lineHeight: 1.6 }}>
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    style={{ background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 12, padding: "10px 24px", color: "#5b3ef5", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f0e17", margin: "0 0 6px" }}>Send us a message</h2>
                  <p style={{ fontSize: 13, color: "#6b6880", margin: "0 0 28px" }}>All fields marked * are required.</p>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label className="contact-label">Name *</label>
                        <input className="contact-input" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="contact-label">Email *</label>
                        <input className="contact-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                      </div>
                    </div>

                    <div>
                      <label className="contact-label">Subject</label>
                      <select className="select-custom" name="subject" value={form.subject} onChange={handleChange}>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="contact-label">Message *</label>
                      <textarea
                        className="contact-input"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us what's on your mind…"
                        rows={5}
                        style={{ resize: "vertical", minHeight: 120 }}
                      />
                    </div>

                    <button type="submit" className="contact-submit" disabled={sending}>
                      {sending ? (
                        <><span style={{ width: 16, height: 16, border: "2.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} /> Sending…</>
                      ) : (
                        <><Send style={{ width: 15, height: 15 }} /> Send Message</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Dark card */}
              <div style={{
                background: "linear-gradient(135deg,#0f0e17,#1a1433)",
                borderRadius: 20, padding: "28px 24px",
                border: "1.5px solid rgba(91,62,245,.25)",
                boxShadow: "0 8px 32px rgba(91,62,245,.15)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(91,62,245,.3) 0%,transparent 70%)", top: -60, right: -60 }} />
                <div style={{ position: "relative" }}>
                  <Sparkles style={{ width: 22, height: 22, color: "#a899f7", marginBottom: 12 }} />
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>Need instant answers?</h3>
                  <p style={{ fontSize: 13, color: "#9d96c8", margin: "0 0 20px", lineHeight: 1.6 }}>
                    Our AI Help Center can answer most questions about your account, features, and prep strategy right away.
                  </p>
                  <Link to="/help" style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "10px 20px", borderRadius: 11,
                    background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                    color: "#d6cfff", fontSize: 13, fontWeight: 700, textDecoration: "none",
                    transition: "background .18s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(91,62,245,.3)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
                  >
                    Visit Help Center →
                  </Link>
                </div>
              </div>

              {/* Location */}
              <div className="contact-card" style={{ padding: "22px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff7e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin style={{ width: 16, height: 16, color: "#f5a623" }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0f0e17", margin: 0 }}>Our Location</p>
                </div>
                <p style={{ fontSize: 13, color: "#6b6880", margin: "0 0 4px", lineHeight: 1.6 }}>Bengaluru, Karnataka, India</p>
                <p style={{ fontSize: 12, color: "#9d96c8", margin: 0 }}>Remote-first team, globally available</p>
              </div>

              {/* Social */}
              <div className="contact-card" style={{ padding: "22px 22px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f0e17", margin: "0 0 14px" }}>Follow us</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {SOCIAL.map(({ href, Icon, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="f-social">
                      <Icon style={{ width: 16, height: 16 }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}