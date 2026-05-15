import { useRef, useEffect } from "react";
import { Video, VideoOff, Bot } from "lucide-react";

function AIAvatar({ isSpeaking, size }) {
  const bars = Array.from({ length: 14 });
  const csz  = size === "sm" ? 46 : 64;
  const isz  = size === "sm" ? 20 : 28;
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#060810 0%,#0b1020 55%,#060810 100%)", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes av-w{0%,100%{transform:scaleY(0.1)}50%{transform:scaleY(1)}}
        @keyframes av-g{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0),0 0 12px rgba(99,102,241,0.1)}50%{box-shadow:0 0 0 9px rgba(99,102,241,0),0 0 28px rgba(99,102,241,0.32)}}
        @keyframes av-f{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes av-s{from{transform:translate(-50%,-50%)rotate(0deg)}to{transform:translate(-50%,-50%)rotate(360deg)}}
        @keyframes av-gr{0%,100%{opacity:0.02}50%{opacity:0.048}}
      `}</style>
      <div style={{ position:"absolute",inset:0, backgroundImage:"linear-gradient(rgba(99,102,241,0.04)1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04)1px,transparent 1px)", backgroundSize:"20px 20px", animation:"av-gr 4s ease infinite" }}/>
      <div style={{ position:"absolute",top:"50%",left:"50%", width:160,height:160,borderRadius:"50%", background:isSpeaking?"conic-gradient(from 0deg,rgba(99,102,241,0.16),rgba(6,182,212,0.06),rgba(139,92,246,0.11),rgba(99,102,241,0.16))":"radial-gradient(circle,rgba(99,102,241,0.04),transparent 70%)", animation:isSpeaking?"av-s 5s linear infinite":"none", filter:"blur(20px)",pointerEvents:"none" }}/>
      <div style={{ animation:isSpeaking?"av-g 1.5s ease-in-out infinite,av-f 2.8s ease-in-out infinite":"av-f 4s ease-in-out infinite", borderRadius:"50%", background:isSpeaking?"linear-gradient(145deg,rgba(99,102,241,0.18),rgba(6,182,212,0.09))":"linear-gradient(145deg,rgba(99,102,241,0.08),rgba(6,182,212,0.04))", border:`1.5px solid ${isSpeaking?"rgba(99,102,241,0.55)":"rgba(99,102,241,0.16)"}`, width:csz,height:csz, display:"flex",alignItems:"center",justifyContent:"center", marginBottom:7,position:"relative",zIndex:1,transition:"all 0.4s ease" }}>
        <Bot style={{ width:isz,height:isz,color:isSpeaking?"#a5b4fc":"#6366f1" }}/>
      </div>
      <div style={{ color:isSpeaking?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.26)", fontSize:size==="sm"?8:9, fontWeight:700, marginBottom:6, zIndex:1, letterSpacing:"0.06em", textTransform:"uppercase", transition:"color 0.3s" }}>
        {isSpeaking?"Speaking…":"AI Interviewer"}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:1.5,height:18, opacity:isSpeaking?1:0.09,transition:"opacity 0.4s ease",zIndex:1 }}>
        {bars.map((_,i)=>(
          <div key={i} style={{ width:1.5,height:"100%",borderRadius:2, background:"linear-gradient(to top,#6366f1,#38bdf8)", transformOrigin:"bottom",transform:"scaleY(0.1)", animation:isSpeaking?`av-w ${0.28+(i%5)*0.1}s ease-in-out infinite`:"none", animationDelay:`${i*0.05}s` }}/>
        ))}
      </div>
      {isSpeaking && (
        <div style={{ position:"absolute",bottom:5,right:5, background:"rgba(99,102,241,0.82)",borderRadius:20,padding:"2px 6px", fontSize:7.5,color:"#fff",fontWeight:700, display:"flex",alignItems:"center",gap:2 }}>
          <div style={{ width:3,height:3,borderRadius:"50%",background:"#fff" }}/>
          Live
        </div>
      )}
    </div>
  );
}

function VideoCell({ label, icon, badge, badgeColor, glowing, children }) {
  return (
    <div style={{ flex:"1 1 0", minWidth:0, minHeight:0, position:"relative", borderRadius:9, overflow:"hidden", border:glowing?"1.5px solid rgba(99,102,241,0.48)":"1.5px solid rgba(255,255,255,0.06)", boxShadow:glowing?"0 0 16px rgba(99,102,241,0.18)":"none", transition:"border-color 0.3s,box-shadow 0.3s", background:"#060810" }}>
      {children}
      {/* Bottom label */}
      <div style={{ position:"absolute",bottom:0,left:0,right:0,zIndex:10, padding:"18px 6px 5px", background:"linear-gradient(to top,rgba(0,0,0,0.78),transparent)", display:"flex",alignItems:"center",gap:3 }}>
        {icon}
        <span style={{ fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.58)",letterSpacing:"0.05em",textTransform:"uppercase", flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{label}</span>
        {badge && (
          <span style={{ display:"flex",alignItems:"center",gap:2, padding:"1px 4px",borderRadius:5,fontSize:7,fontWeight:700,flexShrink:0, background:badgeColor==="green"?"rgba(74,222,128,0.16)":badgeColor==="red"?"rgba(248,113,113,0.16)":"rgba(99,102,241,0.16)", color:badgeColor==="green"?"#4ade80":badgeColor==="red"?"#f87171":"#a5b4fc" }}>
            <div style={{ width:2.5,height:2.5,borderRadius:"50%",background:"currentColor" }}/>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export default function VideoPanel({
  localStream, remoteStream,
  isVideoEnabled, isAudioEnabled,
  interviewStarted, isAISpeaking,
  size = "md",
  onVideoRef = null,   // NEW: exposes <video> element to parent for MediaPipe
}) {
  const localRef  = useRef();
  const remoteRef = useRef();

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (localStream) { el.srcObject = localStream; el.play().catch(()=>{}); }
    else { el.srcObject = null; el.load(); }
    return () => { if (el) { el.srcObject = null; el.load(); } };
  }, [localStream]);

  useEffect(() => {
    const el = remoteRef.current;
    if (!el) return;
    if (remoteStream) { el.srcObject = remoteStream; el.play().catch(()=>{}); }
    else { el.srcObject = null; el.load(); }
    return () => { if (el) { el.srcObject = null; el.load(); } };
  }, [remoteStream]);

  // ── Expose local video element for real gesture/posture detection ──────────
  useEffect(() => {
    if (onVideoRef && localRef.current) {
      onVideoRef(localRef.current);
    }
  }, [onVideoRef, localStream]); // re-fire when stream changes

  const avatarSz = size === "sm" ? "sm" : "md";

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"row", gap:5, padding:5, background:"#07090f", boxSizing:"border-box" }}>

      {/* AI Cell */}
      <VideoCell
        label="AI Interviewer"
        icon={<Bot style={{ width:8,height:8,color:"#818cf8" }}/>}
        badge={isAISpeaking?"Speaking":null}
        badgeColor="purple"
        glowing={isAISpeaking}
      >
        {remoteStream
          ? <video ref={remoteRef} autoPlay playsInline muted style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
          : <AIAvatar isSpeaking={isAISpeaking} size={avatarSz}/>
        }
      </VideoCell>

      {/* User Cell */}
      <VideoCell
        label="You"
        icon={isVideoEnabled
          ? <Video    style={{ width:8,height:8,color:"#4ade80" }}/>
          : <VideoOff style={{ width:8,height:8,color:"#f87171" }}/>}
        badge={interviewStarted && localStream ? (isAudioEnabled?"Live":"Muted") : null}
        badgeColor={isAudioEnabled?"green":"red"}
        glowing={false}
      >
        {localStream ? (
          <>
            {/* This video element is exposed via onVideoRef for MediaPipe */}
            <video
              ref={localRef}
              autoPlay playsInline muted
              style={{ width:"100%",height:"100%",objectFit:"cover",display:isVideoEnabled?"block":"none",transform:"scaleX(-1)" }}
            />
            {!isVideoEnabled && (
              <div style={{ position:"absolute",inset:0, display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center", background:"linear-gradient(160deg,#060810,#0c1118)" }}>
                <VideoOff style={{ width:14,height:14,color:"rgba(255,255,255,0.13)",marginBottom:3 }}/>
                <span style={{ color:"rgba(255,255,255,0.17)",fontSize:8 }}>Camera Off</span>
              </div>
            )}
          </>
        ) : (
          <div style={{ position:"absolute",inset:0, display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center", background:"linear-gradient(160deg,#060810,#0c1118)" }}>
            <Video style={{ width:14,height:14,color:"rgba(255,255,255,0.07)",marginBottom:3 }}/>
            <span style={{ color:"rgba(255,255,255,0.14)",fontSize:8,textAlign:"center",padding:"0 8px" }}>
              {interviewStarted?"No camera":"Activates on start"}
            </span>
          </div>
        )}
      </VideoCell>
    </div>
  );
}