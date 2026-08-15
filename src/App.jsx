import React, { useState, useRef, useEffect } from "react";
import {
  Search, MapPin, Star, Calendar, Clock, ChevronLeft,
  Check, DollarSign, Heart, Home, Grid3x3, User, Bell,
  CreditCard, TrendingUp, X, Settings, ShieldCheck, ShieldAlert, Building2,
  Smartphone, LayoutGrid, Store, Lock, Unlock, SlidersHorizontal,
  Upload, Image as ImageIcon, Trash2, Scissors
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ---------------------------------------------------------
   DESIGN TOKENS
   ink:#241B24  plum:#3D1B3D  gold:#C89B3C  blush:#F3DCE0  cream:#FBF7F2
--------------------------------------------------------- */

const naira = (n) => `₦${Math.round(n).toLocaleString("en-NG")}`;
// Paystack NG local rate: 1.5% + ₦100, ₦100 waived under ₦2,500, fee capped at ₦2,000, borne by the salon subaccount
const paystackFee = (amount) => Math.min(amount * 0.015 + (amount >= 2500 ? 100 : 0), 2000);

const CATEGORIES = [
  { id: "hair", label: "Hair", emoji: "💇🏽‍♀️" },
  { id: "nails", label: "Nails", emoji: "💅🏽" },
  { id: "makeup", label: "Makeup", emoji: "💄" },
  { id: "lashes", label: "Lashes", emoji: "👁️" },
  { id: "spa", label: "Spa", emoji: "🧖🏽‍♀️" },
];

// Salon data now comes from Supabase (see fetchSalons in the root component).
// Each category gets a consistent gradient since real salons don't have photo uploads yet.
const CATEGORY_GRADIENTS = {
  hair: "linear-gradient(135deg,#3D1B3D,#7A3F5E)",
  nails: "linear-gradient(135deg,#B5476B,#EFDDB0)",
  makeup: "linear-gradient(135deg,#241B24,#C89B3C)",
  lashes: "linear-gradient(135deg,#3D1B3D,#B5476B)",
  spa: "linear-gradient(135deg,#7A3F5E,#3D1B3D)",
};
const gradientFor = (category) => CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.hair;

const inputStyle = { padding: "13px 14px", borderRadius: 12, border: "1px solid #EFE6DE", fontSize: 14, background: "#fff", fontFamily: "inherit" };

const TIME_SLOTS = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];
const DATES = ["Today", "Tomorrow", "Wed 12", "Thu 13", "Fri 14"];
const PAY_METHODS = [
  { id: "card", label: "Card (Paystack)", icon: CreditCard, sub: "Verve, Mastercard, Visa" },
  { id: "transfer", label: "Bank Transfer", icon: Building2, sub: "Instant confirmation" },
  { id: "ussd", label: "USSD", icon: Smartphone, sub: "*737# and other bank codes" },
];
const REFUND_POLICY = [
  { window: "More than 24 hours before", pct: 100 },
  { window: "12–24 hours before", pct: 75 },
  { window: "Less than 12 hours", pct: 50 },
  { window: "No-show", pct: 0 },
];

function PhoneFrame({ children }) {
  return (
    <div style={{ width: 390, maxWidth: "100%", height: 780, borderRadius: 40, background: "#FBF7F2", boxShadow: "0 30px 60px -20px rgba(36,27,36,0.45), 0 0 0 10px #17111a", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", fontFamily: "'Manrope', sans-serif", color: "#241B24" }}>{children}</div>
  );
}
function GlowRing({ size = 56, children }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", padding: 3, background: "conic-gradient(from 180deg,#C89B3C,#EFDDB0,#C89B3C)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{children}</div>
    </div>
  );
}
function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", background: "#FBF7F2" }}>
      <div style={{ width: 32 }}>{onBack && (<button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ChevronLeft size={22} color="#241B24" /></button>)}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600 }}>{title}</div>
      <div style={{ width: 32, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}
function BottomNav({ tab, setTab, tabs }) {
  return (
    <div style={{ display: "flex", borderTop: "1px solid #EFE6DE", background: "#fff", padding: "10px 8px calc(10px + env(safe-area-inset-bottom))" }}>
      {tabs.map(t => {
        const activeTab = tab === t.id; const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0" }}>
            <Icon size={20} color={activeTab ? "#3D1B3D" : "#B7ACB1"} strokeWidth={activeTab ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: activeTab ? 700 : 500, color: activeTab ? "#3D1B3D" : "#B7ACB1" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
function Pill({ children, tone = "gold" }) {
  const tones = { gold: { bg: "#F5EBD3", fg: "#8A6A21" }, plum: { bg: "#EFE1EA", fg: "#3D1B3D" }, green: { bg: "#E3EFE1", fg: "#3C6B2F" }, red: { bg: "#F5E1E1", fg: "#A33D3D" } };
  const c = tones[tone];
  return <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>{children}</span>;
}
function VerifiedBadge({ level, compact }) {
  if (level >= 3) return <span style={{ display: "flex", alignItems: "center", gap: 3 }}><ShieldCheck size={compact ? 12 : 16} color="#3C6B2F" />{!compact && <span style={{ fontSize: 11, fontWeight: 700, color: "#3C6B2F" }}>Verified Glow Circle Salon</span>}</span>;
  if (level === 2) return <span style={{ display: "flex", alignItems: "center", gap: 3 }}><ShieldAlert size={compact ? 12 : 16} color="#C89B3C" />{!compact && <span style={{ fontSize: 11, fontWeight: 700, color: "#8A6A21" }}>Verification in progress</span>}</span>;
  return null;
}
function LoadingBlock({ label = "Loading…" }) {
  return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 12, color: "#B7ACB1" }}>{label}</div></div>;
}

/* ---------------- CUSTOMER SCREENS ---------------- */

/* ---------------- AUTH ---------------- */

function RoleToggle({ role, setRole }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {[{ id: "customer", label: "I'm a customer" }, { id: "salon_owner", label: "I'm a salon owner" }].map(o => (
        <button key={o.id} type="button" onClick={() => setRole(o.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700, border: role === o.id ? "2px solid #C89B3C" : "1px solid #EFE6DE", background: role === o.id ? "#FBF3E0" : "#fff", color: role === o.id ? "#8A6A21" : "#241B24" }}>{o.label}</button>
      ))}
    </div>
  );
}

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [signupRole, setSignupRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(""); setInfo(""); setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role: signupRole } } });
      if (error) setError(error.message);
      else if (data.session) onAuthed(data.session);
      else setInfo("Check your email to confirm your account, then log in below.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onAuthed(data.session);
    }
    setBusy(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, textAlign: "center" }}>Glow Circle</div>
      <div style={{ fontSize: 13, color: "#8A7A85", textAlign: "center", marginTop: 6, marginBottom: 26 }}>{mode === "login" ? "Welcome back" : "Create your account to get started"}</div>

      {mode === "signup" && <RoleToggle role={signupRole} setRole={setSignupRole} />}
      {mode === "signup" && signupRole === "salon_owner" && (
        <div style={{ fontSize: 11.5, color: "#8A6A21", background: "#FBF3E0", borderRadius: 10, padding: "8px 10px", marginBottom: 10, lineHeight: 1.4 }}>
          You'll set up your salon profile next. Glow Circle reviews every new salon before it goes live in the marketplace.
        </div>
      )}
      {mode === "signup" && (
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ ...inputStyle, marginBottom: 10 }} />
      )}
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" autoCapitalize="none" style={{ ...inputStyle, marginBottom: 10 }} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" style={{ ...inputStyle, marginBottom: 6 }} />

      {info && <div style={{ fontSize: 12, color: "#3C6B2F", marginTop: 6 }}>{info}</div>}
      {error && <div style={{ fontSize: 12, color: "#B23B3B", marginTop: 6 }}>{error}</div>}

      <button onClick={submit} disabled={busy || !email || !password} style={{ marginTop: 16, padding: "14px", borderRadius: 14, border: "none", background: busy ? "#E4DCD9" : "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: busy ? "default" : "pointer" }}>
        {busy ? "Please wait…" : mode === "login" ? "Log in" : signupRole === "salon_owner" ? "Create salon owner account" : "Create account"}
      </button>

      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }} style={{ marginTop: 16, background: "none", border: "none", color: "#8A6A21", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </div>
  );
}

function HomeScreen({ goFeed, salons }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
      <div style={{ paddingTop: 22, paddingBottom: 6 }}>
        <div style={{ fontSize: 13, color: "#8A7A85", fontWeight: 600 }}>Good afternoon</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, marginTop: 2 }}>What are you looking for?</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, fontSize: 12, color: "#8A6A21", fontWeight: 700 }}><MapPin size={13} /> Lekki, Lagos <span style={{ color: "#B7ACB1", fontWeight: 600 }}>· change</span></div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #EFE6DE", borderRadius: 14, padding: "12px 14px" }}>
        <Search size={18} color="#B7ACB1" /><span style={{ color: "#B7ACB1", fontSize: 14 }}>Search braids, gel nails, lashes…</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => goFeed(c.id)} style={{ border: "1px solid #EFE6DE", background: "#fff", borderRadius: 16, padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 24 }}>{c.emoji}</span><span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 26 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600 }}>Available near you today</div>
        <button onClick={() => goFeed(null)} style={{ background: "none", border: "none", color: "#8A6A21", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>See all</button>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", marginTop: 12, paddingBottom: 4 }}>
        {salons.map(s => (
          <button key={s.id} onClick={() => goFeed(s.category, s)} style={{ minWidth: 160, textAlign: "left", border: "1px solid #EFE6DE", borderRadius: 16, background: "#fff", cursor: "pointer", padding: 0, overflow: "hidden" }}>
            <div style={{ height: 90, background: s.photo }} />
            <div style={{ padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{s.name}</div><VerifiedBadge level={s.verificationLevel} compact /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11.5, color: "#8A7A85" }}><Star size={11} fill="#C89B3C" color="#C89B3C" /> {s.rating} · {s.area.split(",")[0]}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedScreen({ category, setCategory, goProfile, posts, salons }) {
  const filtered = category ? salons.filter(s => s.category === category) : salons;
  const publishedPosts = posts.filter(p => p.status === "published");
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Discover" />
      {publishedPosts.length > 0 && (
        <div style={{ padding: "0 20px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", marginBottom: 10 }}>STYLE FEED</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {publishedPosts.map(p => {
              const salon = salons.find(s => s.id === p.salonId);
              const stylist = salon?.stylists.find(st => st.id === p.stylistId);
              if (!salon) return null;
              return (
                <button key={p.id} onClick={() => goProfile(salon)} style={{ minWidth: 140, textAlign: "left", border: "1px solid #EFE6DE", borderRadius: 14, overflow: "hidden", background: "#fff", cursor: "pointer", padding: 0 }}>
                  {p.mediaType === "video" ? <video src={p.mediaUrl} style={{ width: "100%", height: 120, objectFit: "cover" }} /> : <img src={p.mediaUrl} style={{ width: "100%", height: 120, objectFit: "cover" }} alt={p.caption} />}
                  <div style={{ padding: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{stylist?.name} · {salon.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 10.5, color: "#8A7A85", marginTop: 2, lineHeight: 1.3 }}>{p.caption}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, padding: "0 20px 14px", overflowX: "auto" }}>
        <button onClick={() => setCategory(null)} style={{ padding: "7px 14px", borderRadius: 20, whiteSpace: "nowrap", border: !category ? "none" : "1px solid #EFE6DE", background: !category ? "#3D1B3D" : "#fff", color: !category ? "#fff" : "#241B24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>All</button>
        {CATEGORIES.map(c => (<button key={c.id} onClick={() => setCategory(c.id)} style={{ padding: "7px 14px", borderRadius: 20, whiteSpace: "nowrap", border: category === c.id ? "none" : "1px solid #EFE6DE", background: category === c.id ? "#3D1B3D" : "#fff", color: category === c.id ? "#fff" : "#241B24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{c.emoji} {c.label}</button>))}
      </div>
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((salon) => {
          const service = salon.services[0];
          return (
            <button key={salon.id} onClick={() => goProfile(salon)} style={{ textAlign: "left", border: "1px solid #EFE6DE", borderRadius: 20, background: "#fff", cursor: "pointer", padding: 0, overflow: "hidden" }}>
              <div style={{ height: 150, background: salon.photo, position: "relative" }}>
                <div style={{ position: "absolute", top: 10, right: 10 }}><Heart size={18} color="#fff" /></div>
                <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", gap: 6 }}><Pill tone="gold">Available today</Pill>{salon.verificationLevel >= 3 && <Pill tone="green">Verified</Pill>}</div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15.5, fontWeight: 600 }}>{service.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{naira(service.price)}</div>
                </div>
                <div style={{ fontSize: 12.5, color: "#8A7A85", marginTop: 4 }}>{salon.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontSize: 11.5, color: "#8A7A85" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {salon.area}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} fill="#C89B3C" color="#C89B3C" /> {salon.rating} ({salon.reviews})</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SalonProfileScreen({ salon, onBack, startBooking, posts }) {
  const portfolio = posts.filter(p => p.salonId === salon.id && p.status === "published");
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ height: 190, background: salon.photo, position: "relative" }}>
        <button onClick={onBack} style={{ position: "absolute", top: 18, left: 16, background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronLeft size={18} /></button>
      </div>
      <div style={{ padding: "16px 20px 100px" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>{salon.name}</div>
        <div style={{ marginTop: 6 }}><VerifiedBadge level={salon.verificationLevel} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontSize: 12.5, color: "#8A7A85" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={12} fill="#C89B3C" color="#C89B3C" /> {salon.rating} ({salon.reviews} reviews)</span>
          <span>·</span><span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={12} /> {salon.area}</span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 22, marginBottom: 10, color: "#3D1B3D" }}>SERVICES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {salon.services.map(sv => (
            <button key={sv.id} onClick={() => startBooking(salon, sv)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #EFE6DE", borderRadius: 14, padding: "12px 14px", background: "#fff", cursor: "pointer", textAlign: "left" }}>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{sv.name}</div><div style={{ fontSize: 12, color: "#8A7A85", marginTop: 2 }}>{sv.duration} min</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontWeight: 800 }}>{naira(sv.price)}</span><span style={{ background: "#3D1B3D", color: "#fff", fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 10 }}>Book</span></div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 22, marginBottom: 10, color: "#3D1B3D" }}>STYLISTS</div>
        <div style={{ display: "flex", gap: 14 }}>
          {salon.stylists.map(st => (
            <div key={st.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 68 }}>
              <GlowRing size={54}><div style={{ width: "100%", height: "100%", background: salon.photo, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>{st.name[0]}</div></GlowRing>
              <div style={{ fontSize: 11.5, fontWeight: 700, textAlign: "center" }}>{st.name}</div>
            </div>
          ))}
        </div>

        {portfolio.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 22, marginBottom: 10, color: "#3D1B3D" }}>RECENT WORK</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {portfolio.map(p => (
                p.mediaType === "video"
                  ? <video key={p.id} src={p.mediaUrl} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
                  : <img key={p.id} src={p.mediaUrl} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} alt={p.caption} />
              ))}
            </div>
          </>
        )}

        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 22, marginBottom: 10, color: "#3D1B3D" }}>CANCELLATION POLICY</div>
        <div style={{ border: "1px solid #EFE6DE", borderRadius: 14, padding: 14, background: "#fff", display: "flex", flexDirection: "column", gap: 6 }}>
          {REFUND_POLICY.map((r, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: "#8A7A85" }}>{r.window}</span><span style={{ fontWeight: 700 }}>{r.pct}% refund</span></div>))}
        </div>
      </div>
    </div>
  );
}

function BookingFlow({ salon, service, onClose, onConfirmed, bookedSlots }) {
  const [step, setStep] = useState(1);
  const [stylist, setStylist] = useState(salon.stylists[0]);
  const [date, setDate] = useState("Today");
  const [slot, setSlot] = useState(null);
  const [payMethod, setPayMethod] = useState("card");
  const key = (d, t) => `${stylist.id}|${d}|${t}`;
  const isTaken = (t) => bookedSlots.has(key(date, t));
  const steps = ["Stylist", "Time", "Pay"];

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FBF7F2", display: "flex", flexDirection: "column", zIndex: 20 }}>
      <TopBar title={step === 4 ? "Confirmed" : `Book ${service.name}`} onBack={step === 4 ? null : (step === 1 ? onClose : () => setStep(step - 1))} right={step !== 4 && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>} />
      {step < 4 && <div style={{ display: "flex", gap: 6, padding: "0 20px 14px" }}>{steps.map((s, i) => (<div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: i < step ? "#C89B3C" : "#EFE6DE" }} />))}</div>}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D" }}>CHOOSE YOUR STYLIST</div>
            {salon.stylists.map(st => (
              <button key={st.id} onClick={() => setStylist(st)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: stylist.id === st.id ? "2px solid #C89B3C" : "1px solid #EFE6DE", borderRadius: 14, background: "#fff", cursor: "pointer", textAlign: "left" }}>
                <GlowRing size={44}><div style={{ width: "100%", height: "100%", background: salon.photo, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{st.name[0]}</div></GlowRing>
                <div><div style={{ fontWeight: 700, fontSize: 14 }}>{st.name}</div><div style={{ fontSize: 12, color: "#8A7A85" }}>{st.specialty}</div></div>
                {stylist.id === st.id && <Check size={18} color="#C89B3C" style={{ marginLeft: "auto" }} />}
              </button>
            ))}
            <button onClick={() => setStep(2)} style={{ marginTop: 10, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Continue</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", marginBottom: 10 }}>SELECT A DATE</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>{DATES.map(d => (<button key={d} onClick={() => { setDate(d); setSlot(null); }} style={{ padding: "8px 14px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", border: date === d ? "none" : "1px solid #EFE6DE", background: date === d ? "#3D1B3D" : "#fff", color: date === d ? "#fff" : "#241B24", fontSize: 12.5, fontWeight: 700 }}>{d}</button>))}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", margin: "18px 0 10px" }}>AVAILABLE TIMES · {stylist.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {TIME_SLOTS.map(t => { const taken = isTaken(t); const chosen = slot === t; return (<button key={t} disabled={taken} onClick={() => setSlot(t)} style={{ padding: "10px 4px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, cursor: taken ? "not-allowed" : "pointer", border: chosen ? "2px solid #C89B3C" : "1px solid #EFE6DE", background: taken ? "#F1EBEA" : chosen ? "#FBF3E0" : "#fff", color: taken ? "#C7BBBF" : "#241B24", textDecoration: taken ? "line-through" : "none" }}>{t}</button>); })}
            </div>
            <button disabled={!slot} onClick={() => setStep(3)} style={{ marginTop: 22, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: slot ? "#3D1B3D" : "#E4DCD9", color: "#fff", fontWeight: 700, fontSize: 14, cursor: slot ? "pointer" : "not-allowed" }}>Continue</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", marginBottom: 10 }}>ORDER SUMMARY</div>
            <div style={{ border: "1px solid #EFE6DE", borderRadius: 14, padding: 16, background: "#fff" }}>
              <Row label="Service" value={service.name} /><Row label="Stylist" value={stylist.name} /><Row label="When" value={`${date} · ${slot}`} />
              <div style={{ height: 1, background: "#EFE6DE", margin: "10px 0" }} />
              <Row label="Service price" value={naira(service.price)} />
              <div style={{ fontSize: 11, color: "#B7ACB1", marginTop: 8 }}>Held securely — released to the salon after your appointment. Free cancellation up to 24 hours before.</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", margin: "18px 0 10px" }}>PAYMENT METHOD</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PAY_METHODS.map(pm => (
                <button key={pm.id} onClick={() => setPayMethod(pm.id)} style={{ display: "flex", alignItems: "center", gap: 12, border: payMethod === pm.id ? "2px solid #C89B3C" : "1px solid #EFE6DE", borderRadius: 14, padding: 13, background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  <pm.icon size={18} color="#3D1B3D" /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{pm.label}</div><div style={{ fontSize: 11, color: "#8A7A85" }}>{pm.sub}</div></div>{payMethod === pm.id && <Check size={16} color="#C89B3C" />}
                </button>
              ))}
            </div>
            <button onClick={() => { onConfirmed({ salon, service, stylist, date, slot, payMethod }); setStep(4); }} style={{ marginTop: 22, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Confirm & Pay {naira(service.price)}</button>
          </div>
        )}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 40 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#EFE1EA", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><Check size={34} color="#3D1B3D" /></div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600 }}>You're booked!</div>
            <div style={{ fontSize: 13, color: "#8A7A85", marginTop: 8, lineHeight: 1.5 }}>{service.name} with {stylist.name} at {salon.name}<br />{date} · {slot}</div>
            <div style={{ fontSize: 12, color: "#B7ACB1", marginTop: 14 }}>A reminder will be sent by SMS and push notification 24 hours before.</div>
            <button onClick={onClose} style={{ marginTop: 26, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, muted }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}><span style={{ color: "#8A7A85" }}>{label}</span><span style={{ fontWeight: 700, color: muted ? "#B23B3B" : "#241B24" }}>{value}</span></div>;
}

function BookingsScreen({ bookings }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="My Bookings" />
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {bookings.length === 0 && <div style={{ textAlign: "center", marginTop: 60, color: "#B7ACB1", fontSize: 13 }}>No bookings yet. Find a salon to get started.</div>}
        {bookings.map((b, i) => (
          <div key={i} style={{ border: "1px solid #EFE6DE", borderRadius: 16, padding: 14, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{b.service.name}</div><div style={{ fontSize: 12, color: "#8A7A85", marginTop: 2 }}>{b.salon.name} · {b.stylist.name}</div></div>
              <Pill tone="green">Upcoming</Pill>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12.5, color: "#3D1B3D", fontWeight: 700 }}><Calendar size={13} /> {b.date} <Clock size={13} style={{ marginLeft: 6 }} /> {b.slot}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #EFE6DE", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reschedule</button>
              <button style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #EFE6DE", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#B23B3B" }}>Cancel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountScreen({ switchRole, user, onSignOut, isSalonOwner }) {
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Customer";
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Account" />
      <div style={{ padding: "10px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <GlowRing size={58}><div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#3D1B3D,#C89B3C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{name[0]?.toUpperCase()}</div></GlowRing>
          <div><div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600 }}>{name}</div><div style={{ fontSize: 12, color: "#8A7A85" }}>{user?.email}</div></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
          {[{ icon: CreditCard, label: "Payment methods" }, { icon: Bell, label: "Notifications" }, { icon: Settings, label: "Settings" }].map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: "1px solid #EFE6DE", borderRadius: 14, background: "#fff" }}><it.icon size={17} color="#3D1B3D" /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{it.label}</span></div>
          ))}
        </div>
        <button onClick={onSignOut} style={{ marginTop: 22, width: "100%", padding: "13px", borderRadius: 14, border: "1px solid #F5E1E1", background: "#fff", color: "#B23B3B", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Sign out</button>

        {isSalonOwner ? (
          <button onClick={() => switchRole("salon")} style={{ marginTop: 22, width: "100%", padding: "13px", borderRadius: 14, border: "1px solid #C89B3C", background: "#FBF3E0", color: "#8A6A21", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Go to my salon dashboard →</button>
        ) : (
          <div style={{ fontSize: 11.5, color: "#B7ACB1", marginTop: 22, lineHeight: 1.5 }}>Own a salon? Sign out and create a new account, choosing "I'm a salon owner" at signup.</div>
        )}

        <div style={{ fontSize: 11, color: "#B7ACB1", marginTop: 22, marginBottom: 6 }}>DEMO — for testing other roles:</div>
        <button onClick={() => switchRole("admin")} style={{ width: "100%", padding: "13px", borderRadius: 14, border: "1px dashed #3D1B3D", background: "#EFE1EA", color: "#3D1B3D", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Switch to Admin view (demo) →</button>
      </div>
    </div>
  );
}

/* ---------------- SALON OWNER: SIGN UP → ONBOARDING → APPROVAL ---------------- */

function SalonOnboarding({ session, onCreated }) {
  const [form, setForm] = useState({ name: "", category: "hair", area: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.area.trim()) { setError("Salon name and area are required."); return; }
    setBusy(true); setError("");
    const { data, error } = await supabase
      .from("salons")
      .insert({ name: form.name.trim(), category: form.category, area: form.area.trim(), owner_id: session.user.id, status: "pending" })
      .select()
      .single();
    setBusy(false);
    if (error) setError(error.message);
    else onCreated(data);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Set up your salon" />
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ fontSize: 12.5, color: "#8A7A85", marginBottom: 16, lineHeight: 1.5 }}>
          Tell us about your salon. Glow Circle reviews every application before it appears in the marketplace — usually within 1–2 business days.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Salon name" style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Area (e.g. Lekki Phase 1, Lagos)" style={inputStyle} />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address (optional for now)" style={inputStyle} />
        </div>
        {error && <div style={{ fontSize: 12, color: "#B23B3B", marginTop: 10 }}>{error}</div>}
        <button onClick={submit} disabled={busy} style={{ marginTop: 18, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: busy ? "#E4DCD9" : "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: busy ? "default" : "pointer" }}>
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </div>
  );
}

function SalonPending({ salon, onUpdated, onSignOut }) {
  const [form, setForm] = useState({ name: salon.name, category: salon.category, area: salon.area });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!form.name.trim() || !form.area.trim()) { setError("Salon name and area are required."); return; }
    setBusy(true); setError(""); setSaved(false);
    const { data, error } = await supabase
      .from("salons")
      .update({ name: form.name.trim(), category: form.category, area: form.area.trim() })
      .eq("id", salon.id)
      .select()
      .single();
    setBusy(false);
    if (error) setError(error.message);
    else { onUpdated(data); setSaved(true); }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Application status" right={<button onClick={onSignOut} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "#B23B3B" }}>Sign out</button>} />
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ border: "1px solid #EFE6DE", borderRadius: 16, padding: 16, background: "#FBF3E0", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldAlert size={16} color="#C89B3C" /><span style={{ fontWeight: 800, fontSize: 13, color: "#8A6A21" }}>Awaiting Glow Circle approval</span></div>
          <div style={{ fontSize: 12, color: "#8A7A85", marginTop: 8, lineHeight: 1.5 }}>Your application is under review. You can still update your details below — you'll be notified once approved.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Salon name" style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Area" style={inputStyle} />
        </div>
        {error && <div style={{ fontSize: 12, color: "#B23B3B", marginTop: 10 }}>{error}</div>}
        {saved && !error && <div style={{ fontSize: 12, color: "#3C6B2F", marginTop: 10 }}>Saved.</div>}
        <button onClick={save} disabled={busy} style={{ marginTop: 18, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: busy ? "#E4DCD9" : "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: busy ? "default" : "pointer" }}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function SalonOwnerHome({ salon, onRefresh, onSignOut }) {
  const [svc, setSvc] = useState({ name: "", price: "", duration_minutes: "60" });
  const [sty, setSty] = useState({ name: "", specialty: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addService = async () => {
    if (!svc.name.trim() || !svc.price) { setError("Service name and price are required."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.from("services").insert({ salon_id: salon.id, name: svc.name.trim(), price: Number(svc.price), duration_minutes: Number(svc.duration_minutes) || 60 });
    setBusy(false);
    if (error) setError(error.message);
    else { setSvc({ name: "", price: "", duration_minutes: "60" }); onRefresh(); }
  };
  const addStylist = async () => {
    if (!sty.name.trim()) { setError("Stylist name is required."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.from("stylists").insert({ salon_id: salon.id, name: sty.name.trim(), specialty: sty.specialty.trim() || null });
    setBusy(false);
    if (error) setError(error.message);
    else { setSty({ name: "", specialty: "" }); onRefresh(); }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "22px 20px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8A7A85", fontWeight: 600 }}>{salon.area}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>{salon.name}</div>
            <div style={{ marginTop: 6 }}><VerifiedBadge level={salon.verification_level || 1} /></div>
          </div>
          <button onClick={onSignOut} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "#B23B3B" }}>Sign out</button>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {error && <div style={{ fontSize: 12, color: "#B23B3B", marginBottom: 10 }}>{error}</div>}

        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", marginBottom: 10 }}>ADD A SERVICE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid #EFE6DE", borderRadius: 14, padding: 14, background: "#fff" }}>
          <input value={svc.name} onChange={(e) => setSvc({ ...svc, name: e.target.value })} placeholder="Service name (e.g. Silk press)" style={inputStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <input value={svc.price} onChange={(e) => setSvc({ ...svc, price: e.target.value })} placeholder="Price (₦)" inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
            <input value={svc.duration_minutes} onChange={(e) => setSvc({ ...svc, duration_minutes: e.target.value })} placeholder="Minutes" inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
          </div>
          <button onClick={addService} disabled={busy} style={{ padding: "11px", borderRadius: 10, border: "none", background: "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add service</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {(salon.services || []).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", border: "1px solid #EFE6DE", borderRadius: 12, padding: "10px 12px", background: "#fff" }}>
              <div><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "#8A7A85" }}>{s.duration_minutes} min</div></div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>{naira(s.price)}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", margin: "22px 0 10px" }}>ADD A STYLIST</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid #EFE6DE", borderRadius: 14, padding: 14, background: "#fff" }}>
          <input value={sty.name} onChange={(e) => setSty({ ...sty, name: e.target.value })} placeholder="Stylist name" style={inputStyle} />
          <input value={sty.specialty} onChange={(e) => setSty({ ...sty, specialty: e.target.value })} placeholder="Specialty (optional)" style={inputStyle} />
          <button onClick={addStylist} disabled={busy} style={{ padding: "11px", borderRadius: 10, border: "none", background: "#3D1B3D", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add stylist</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {(salon.stylists || []).map(st => (
            <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #EFE6DE", borderRadius: 12, padding: "10px 12px", background: "#fff" }}>
              <GlowRing size={36}><div style={{ width: "100%", height: "100%", background: gradientFor(salon.category), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{st.name[0]}</div></GlowRing>
              <div><div style={{ fontWeight: 700, fontSize: 13 }}>{st.name}</div><div style={{ fontSize: 11, color: "#8A7A85" }}>{st.specialty}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- SALON DASHBOARD (demo screens — real data comes later) ---------------- */

function DashCalendar({ availability, toggleSlot }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Availability" />
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: 12.5, color: "#8A7A85", marginBottom: 14 }}>Tap a slot to open or block it. (Demo — not yet wired to real bookings.)</div>
        {DATES.map(d => (
          <div key={d} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", marginBottom: 8 }}>{d.toUpperCase()}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {TIME_SLOTS.map(t => { const openSlot = availability[`${d}|${t}`] !== false; return (<button key={t} onClick={() => toggleSlot(d, t)} style={{ padding: "10px 4px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", border: openSlot ? "1px solid #EFE6DE" : "1px solid #E4DCD9", background: openSlot ? "#FBF3E0" : "#F1EBEA", color: openSlot ? "#8A6A21" : "#C7BBBF" }}>{t}</button>); })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function StatCard({ label, value, icon: Icon }) {
  return (<div style={{ flex: 1, border: "1px solid #EFE6DE", borderRadius: 16, padding: 14, background: "#fff" }}><Icon size={16} color="#C89B3C" /><div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, marginTop: 8 }}>{value}</div><div style={{ fontSize: 11, color: "#8A7A85", fontWeight: 600 }}>{label}</div></div>);
}
function DashEarnings({ bookings, commissionRate, frozen }) {
  const gross = bookings.reduce((sum, b) => sum + b.service.price, 0);
  const commission = gross * commissionRate;
  const fees = bookings.reduce((sum, b) => sum + paystackFee(b.service.price), 0);
  const net = gross - commission - fees;
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Earnings & Payouts" />
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ fontSize: 11, color: "#B7ACB1", marginBottom: 10 }}>Demo — not yet scoped to your real bookings.</div>
        {frozen && (<div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F5E1E1", color: "#A33D3D", borderRadius: 14, padding: 12, marginBottom: 14, fontSize: 12, fontWeight: 700 }}><Lock size={14} /> Payouts are currently frozen by Glow Circle admin. Contact support.</div>)}
        <div style={{ borderRadius: 20, padding: 20, background: "linear-gradient(135deg,#3D1B3D,#241B24)", color: "#fff" }}>
          <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600 }}>Available for payout</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, marginTop: 4 }}>{naira(net)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, opacity: 0.85 }}><TrendingUp size={13} /> Next payout: Monday, Aug 17 · GTBank ••1234</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", margin: "20px 0 10px" }}>THIS PERIOD</div>
        <div style={{ border: "1px solid #EFE6DE", borderRadius: 16, padding: 16, background: "#fff" }}>
          <Row label="Gross bookings" value={naira(gross)} />
          <Row label={`Glow Circle commission (${(commissionRate * 100).toFixed(0)}%)`} value={`–${naira(commission)}`} muted />
          <Row label="Paystack processing fee" value={`–${naira(fees)}`} muted />
          <div style={{ height: 1, background: "#EFE6DE", margin: "10px 0" }} />
          <Row label="Your net payout" value={naira(net)} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLIST STUDIO ---------------- */

function StylistStudio({ stylist, allStylists, onSwitchStylist, myPosts, onPublish, onDelete }) {
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ url, type: file.type.startsWith("video") ? "video" : "image" });
  };
  const publish = () => {
    if (!preview) return;
    onPublish({ stylistId: stylist.id, salonId: stylist.salonId, mediaUrl: preview.url, mediaType: preview.type, caption });
    setPreview(null); setCaption("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "22px 20px 6px" }}>
        <div style={{ fontSize: 13, color: "#8A7A85", fontWeight: 600 }}>{stylist.salonName}</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600 }}>My Work & Feed</div>
        <select value={stylist.id} onChange={(e) => onSwitchStylist(e.target.value)} style={{ marginTop: 10, fontSize: 12, fontWeight: 700, padding: "8px 10px", borderRadius: 10, border: "1px solid #EFE6DE", background: "#fff", color: "#3D1B3D" }}>
          {allStylists.map(st => <option key={st.id} value={st.id}>{st.name} · {st.salonName}</option>)}
        </select>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ border: "1px dashed #C89B3C", borderRadius: 16, padding: 16, background: "#FBF3E0" }}>
          {!preview ? (
            <button onClick={() => fileRef.current.click()} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "16px 0" }}>
              <Upload size={22} color="#8A6A21" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#8A6A21" }}>Add a photo or video of your work</span>
            </button>
          ) : (
            <div>
              {preview.type === "video"
                ? <video src={preview.url} style={{ width: "100%", borderRadius: 12, maxHeight: 220, objectFit: "cover" }} controls />
                : <img src={preview.url} style={{ width: "100%", borderRadius: 12, maxHeight: 220, objectFit: "cover" }} alt="preview" />}
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption this look…" style={{ width: "100%", marginTop: 10, borderRadius: 10, border: "1px solid #EFE6DE", padding: 10, fontSize: 13, fontFamily: "inherit", resize: "none", minHeight: 60 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setPreview(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #EFE6DE", background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Discard</button>
                <button onClick={publish} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#3D1B3D", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Publish</button>
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: "none" }} />
        </div>
        <div style={{ fontSize: 11, color: "#B7ACB1", marginTop: 8 }}>Posts go to Glow Circle admin for review before they appear in the customer feed.</div>

        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", margin: "22px 0 10px" }}>MY POSTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {myPosts.length === 0 && <div style={{ fontSize: 12.5, color: "#B7ACB1", gridColumn: "1 / -1" }}>No posts yet — share your first look above.</div>}
          {myPosts.map(p => (
            <div key={p.id} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #EFE6DE", background: "#fff" }}>
              {p.mediaType === "video"
                ? <video src={p.mediaUrl} style={{ width: "100%", height: 110, objectFit: "cover" }} />
                : <img src={p.mediaUrl} style={{ width: "100%", height: 110, objectFit: "cover" }} alt={p.caption} />}
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 11, color: "#8A7A85", lineHeight: 1.3, minHeight: 28 }}>{p.caption || "—"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <Pill tone={p.status === "published" ? "green" : p.status === "rejected" ? "red" : "gold"}>{p.status === "published" ? "Live" : p.status === "rejected" ? "Rejected" : "In review"}</Pill>
                  <button onClick={() => onDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={13} color="#B23B3B" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADMIN DASHBOARD (still demo — Phase 1 next task) ---------------- */

function AdminPayments({ bookings, commissionRate }) {
  const gross = bookings.reduce((s, b) => s + b.service.price, 0);
  const commissionEarned = gross * commissionRate;
  const feesTotal = bookings.reduce((s, b) => s + paystackFee(b.service.price), 0);
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "22px 20px 6px" }}>
        <div style={{ fontSize: 13, color: "#8A7A85", fontWeight: 600 }}>Glow Circle Admin</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600 }}>Payments & Payouts</div>
      </div>
      <div style={{ display: "flex", gap: 10, padding: "16px 20px 4px" }}>
        <StatCard label="Total volume" value={naira(gross)} icon={DollarSign} />
        <StatCard label="Commission earned" value={naira(commissionEarned)} icon={TrendingUp} />
      </div>
      <div style={{ padding: "10px 20px 4px" }}>
        <StatCard label="Paystack fees (borne by salons)" value={naira(feesTotal)} icon={CreditCard} />
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", marginBottom: 10 }}>LEDGER</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bookings.length === 0 && <div style={{ fontSize: 12.5, color: "#B7ACB1" }}>No transactions yet.</div>}
          {bookings.map((b, i) => {
            const fee = paystackFee(b.service.price);
            const comm = b.service.price * commissionRate;
            const salonNet = b.service.price - fee - comm;
            return (
              <div key={i} style={{ border: "1px solid #EFE6DE", borderRadius: 14, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{b.service.name} — {b.salon.name}</div>
                  <Pill tone="green">Paid</Pill>
                </div>
                <div style={{ fontSize: 11, color: "#8A7A85", marginTop: 2 }}>{b.date} · {b.slot} · {b.payMethod || "card"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 8, color: "#8A7A85" }}>
                  <span>Gross {naira(b.service.price)}</span><span>Fee –{naira(fee)}</span><span>Comm –{naira(comm)}</span><span style={{ fontWeight: 700, color: "#241B24" }}>Salon +{naira(salonNet)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminSalons({ salons, frozenSalons, toggleFreeze }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Salons" />
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {salons.map(s => {
          const isFrozen = frozenSalons.has(s.id);
          return (
            <div key={s.id} style={{ border: "1px solid #EFE6DE", borderRadius: 14, padding: 12, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: "#8A7A85", marginTop: 2 }}>{s.area}</div>
                  <div style={{ marginTop: 6 }}><VerifiedBadge level={s.verificationLevel} /></div>
                </div>
                <button onClick={() => toggleFreeze(s.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, border: "1px solid #EFE6DE", background: isFrozen ? "#F5E1E1" : "#fff", color: isFrozen ? "#A33D3D" : "#3D1B3D", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  {isFrozen ? <Unlock size={13} /> : <Lock size={13} />} {isFrozen ? "Unfreeze" : "Freeze payouts"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminContent({ posts, setPostStatus, salons }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Content Moderation" />
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.length === 0 && <div style={{ fontSize: 12.5, color: "#B7ACB1", marginTop: 20 }}>No posts submitted yet.</div>}
        {posts.map(p => {
          const salon = salons.find(s => s.id === p.salonId);
          const stylist = salon?.stylists.find(st => st.id === p.stylistId);
          return (
            <div key={p.id} style={{ border: "1px solid #EFE6DE", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
              {p.mediaType === "video"
                ? <video src={p.mediaUrl} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                : <img src={p.mediaUrl} style={{ width: "100%", height: 160, objectFit: "cover" }} alt={p.caption} />}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{stylist?.name} · {salon?.name}</div>
                <div style={{ fontSize: 12, color: "#8A7A85", marginTop: 4 }}>{p.caption || "No caption"}</div>
                <div style={{ marginTop: 8 }}><Pill tone={p.status === "published" ? "green" : p.status === "rejected" ? "red" : "gold"}>{p.status}</Pill></div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => setPostStatus(p.id, "published")} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "#3D1B3D", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                  <button onClick={() => setPostStatus(p.id, "rejected")} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #EFE6DE", background: "#fff", color: "#B23B3B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminSettings({ commissionRate, setCommissionRate, feeBearer, setFeeBearer }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <TopBar title="Settings" />
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", marginBottom: 10 }}>COMMISSION RATE</div>
        <div style={{ border: "1px solid #EFE6DE", borderRadius: 14, padding: 16, background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
          <SlidersHorizontal size={16} color="#C89B3C" />
          <input type="range" min="5" max="20" value={commissionRate * 100} onChange={(e) => setCommissionRate(Number(e.target.value) / 100)} style={{ flex: 1 }} />
          <span style={{ fontWeight: 800, fontSize: 14, width: 40, textAlign: "right" }}>{(commissionRate * 100).toFixed(0)}%</span>
        </div>
        <div style={{ fontSize: 11, color: "#B7ACB1", marginTop: 8 }}>Stored as a configurable value — applies platform-wide without an app update.</div>

        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", margin: "22px 0 10px" }}>WHO BEARS THE PAYSTACK FEE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[{ id: "salon", label: "Salon (default)", sub: "Glow Circle keeps its full advertised commission" }, { id: "customer", label: "Customer", sub: "Added at checkout, optional future toggle" }, { id: "platform", label: "Glow Circle", sub: "Promotional campaigns only" }].map(o => (
            <button key={o.id} onClick={() => setFeeBearer(o.id)} style={{ display: "flex", alignItems: "center", gap: 10, border: feeBearer === o.id ? "2px solid #C89B3C" : "1px solid #EFE6DE", borderRadius: 14, padding: 13, background: "#fff", cursor: "pointer", textAlign: "left" }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{o.label}</div><div style={{ fontSize: 11, color: "#8A7A85" }}>{o.sub}</div></div>
              {feeBearer === o.id && <Check size={16} color="#C89B3C" />}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: "#3D1B3D", margin: "22px 0 10px" }}>CANCELLATION POLICY</div>
        <div style={{ border: "1px solid #EFE6DE", borderRadius: 14, padding: 14, background: "#fff", display: "flex", flexDirection: "column", gap: 6 }}>
          {REFUND_POLICY.map((r, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: "#8A7A85" }}>{r.window}</span><span style={{ fontWeight: 700 }}>{r.pct}% refund</span></div>))}
        </div>
        <div style={{ fontSize: 11, color: "#B7ACB1", marginTop: 8 }}>Paystack processing fees are non-refundable — refunds beyond the salon's net are recorded as a Glow Circle cost in the ledger, not reversed from the salon.</div>
      </div>
    </div>
  );
}

/* ---------------- ROOT APP ---------------- */

export default function GlowCircleApp() {
  const [role, setRole] = useState("customer");
  const [tab, setTab] = useState("home");
  const [dashTab, setDashTab] = useState("overview");
  const [adminTab, setAdminTab] = useState("payments");
  const [feedCategory, setFeedCategory] = useState(null);
  const [activeSalon, setActiveSalon] = useState(null);
  const [bookingCtx, setBookingCtx] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookedSlots, setBookedSlots] = useState(new Set());
  const [availability, setAvailability] = useState({});
  const [commissionRate, setCommissionRate] = useState(0.10);
  const [feeBearer, setFeeBearer] = useState("salon");
  const [frozenSalons, setFrozenSalons] = useState(new Set());
  const [posts, setPosts] = useState([]);
  const [currentStylistId, setCurrentStylistId] = useState(null);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState(null);
  const [mySalon, setMySalon] = useState(null);

  // Check for an existing logged-in session, and keep it in sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Pull real salons + their services + stylists from Supabase on first load
  useEffect(() => {
    async function fetchSalons() {
      const { data, error } = await supabase
        .from("salons")
        .select("id, name, category, verification_level, rating, reviews_count, area, services(id, name, price, duration_minutes), stylists(id, name, specialty)");
      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }
      const mapped = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        verificationLevel: row.verification_level,
        rating: row.rating,
        reviews: row.reviews_count,
        area: row.area,
        photo: gradientFor(row.category),
        services: (row.services || []).map(sv => ({ id: sv.id, name: sv.name, price: sv.price, duration: sv.duration_minutes })),
        stylists: (row.stylists || []).map(st => ({ id: st.id, name: st.name, specialty: st.specialty })),
      }));
      setSalons(mapped);
      setLoading(false);
    }
    fetchSalons();
  }, []);

  // Load this user's profile (real role) whenever the session changes
  useEffect(() => {
    if (!session) { setProfile(null); setMySalon(null); return; }
    async function loadProfile() {
      const { data } = await supabase.from("profiles").select("id, role, name").eq("id", session.user.id).single();
      setProfile(data || null);
    }
    loadProfile();
  }, [session]);

  // A confirmed salon-owner account should land on the salon dashboard, not the customer home tab
  useEffect(() => {
    if (profile?.role === "salon_owner") setRole("salon");
  }, [profile]);

  const loadMySalon = async () => {
    if (!session) return;
    const { data } = await supabase
      .from("salons")
      .select("id, name, category, area, status, verification_level, services(id,name,price,duration_minutes), stylists(id,name,specialty)")
      .eq("owner_id", session.user.id)
      .maybeSingle();
    setMySalon(data || null);
  };
  useEffect(() => {
    if (profile?.role === "salon_owner") loadMySalon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const allStylists = salons.flatMap(s => s.stylists.map(st => ({ ...st, salonId: s.id, salonName: s.name, salonPhoto: s.photo })));

  // Once salons load, default the Stylist Studio to the first real stylist
  useEffect(() => {
    if (!currentStylistId && allStylists.length > 0) setCurrentStylistId(allStylists[0].id);
  }, [allStylists, currentStylistId]);

  useEffect(() => {
    if (!session) return;
    async function fetchMyBookings() {
      const { data } = await supabase
        .from("bookings")
        .select("id, booking_date, time_slot, gross_amount, salons(name), stylists(name), services(name)")
        .order("created_at", { ascending: false });
      if (data) {
        setBookings(data.map(b => ({
          salon: { name: b.salons?.name }, stylist: { name: b.stylists?.name }, service: { name: b.services?.name, price: b.gross_amount },
          date: b.booking_date, slot: b.time_slot,
        })));
      }
    }
    fetchMyBookings();
  }, [session]);

  const confirmBooking = async (b) => {
    setBookings(prev => [b, ...prev]);
    setBookedSlots(prev => new Set(prev).add(`${b.stylist.id}|${b.date}|${b.slot}`));
    const fee = paystackFee(b.service.price);
    const commission = b.service.price * commissionRate;
    const salonNet = b.service.price - fee - commission;
    const { error } = await supabase.from("bookings").insert({
      salon_id: b.salon.id,
      stylist_id: b.stylist.id,
      service_id: b.service.id,
      customer_id: session?.user?.id,
      customer_name: session?.user?.user_metadata?.full_name || session?.user?.email || "Guest",
      booking_date: b.date,
      time_slot: b.slot,
      status: "confirmed",
      gross_amount: b.service.price,
      commission_amount: Math.round(commission),
      paystack_fee: Math.round(fee),
      salon_net: Math.round(salonNet),
      payment_method: b.payMethod || "card",
    });
    if (error) console.error("Booking failed to save:", error.message);
  };

  const toggleSlot = (d, t) => setAvailability(prev => ({ ...prev, [`${d}|${t}`]: prev[`${d}|${t}`] === false ? true : false }));
  const toggleFreeze = (id) => setFrozenSalons(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const addPost = (post) => setPosts(prev => [{ id: `p${Date.now()}`, status: "pending", ...post }, ...prev]);
  const setPostStatus = (id, status) => setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  const deletePost = (id) => setPosts(prev => prev.filter(p => p.id !== id));
  const goFeed = (cat, salon) => { setFeedCategory(cat); if (salon) { setActiveSalon(salon); setTab("profile"); } else setTab("feed"); };

  const customerTabs = [{ id: "home", label: "Home", icon: Home }, { id: "feed", label: "Discover", icon: Grid3x3 }, { id: "bookings", label: "Bookings", icon: Calendar }, { id: "account", label: "Account", icon: User }];
  const dashTabs = [{ id: "overview", label: "My Salon", icon: Home }, { id: "calendar", label: "Calendar", icon: Calendar }, { id: "earnings", label: "Earnings", icon: DollarSign }];
  const adminTabs = [{ id: "payments", label: "Payments", icon: DollarSign }, { id: "salons", label: "Salons", icon: Store }, { id: "content", label: "Content", icon: ImageIcon }, { id: "settings", label: "Settings", icon: Settings }];

  const isSalonOwner = profile?.role === "salon_owner";

  let body;
  if (loading) {
    body = <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: "#3D1B3D" }}>Loading salons…</div>
      <div style={{ fontSize: 12, color: "#B7ACB1" }}>Connecting to Glow Circle's database</div>
    </div>;
  } else if (loadError) {
    body = <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, padding: 20, textAlign: "center" }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: "#B23B3B" }}>Couldn't load data</div>
      <div style={{ fontSize: 12, color: "#8A7A85" }}>{loadError}</div>
      <div style={{ fontSize: 11, color: "#B7ACB1" }}>Check that supabaseClient.js has your real project URL and anon key.</div>
    </div>;
  } else if (role === "customer") {
    if (tab === "home") body = <HomeScreen goFeed={goFeed} salons={salons} />;
    else if (tab === "feed") body = <FeedScreen category={feedCategory} setCategory={setFeedCategory} goProfile={(s) => { setActiveSalon(s); setTab("profile"); }} posts={posts} salons={salons} />;
    else if (tab === "profile") body = <SalonProfileScreen salon={activeSalon} onBack={() => setTab("feed")} startBooking={(salon, service) => { if (session) setBookingCtx({ salon, service }); else setPendingBooking({ salon, service }); }} posts={posts} />;
    else if (tab === "bookings") body = session ? <BookingsScreen bookings={bookings} /> : <AuthScreen onAuthed={() => {}} />;
    else if (tab === "account") body = session ? <AccountScreen user={session.user} isSalonOwner={isSalonOwner} switchRole={(r) => { setRole(r); if (r === "salon") setDashTab("overview"); if (r === "admin") setAdminTab("payments"); }} onSignOut={() => supabase.auth.signOut()} /> : <AuthScreen onAuthed={() => {}} />;
  } else if (role === "salon") {
    if (!session) {
      body = <AuthScreen onAuthed={() => {}} />;
    } else if (!profile) {
      body = <LoadingBlock label="Loading your account…" />;
    } else if (profile.role !== "salon_owner") {
      body = (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 10 }}>
          <Store size={28} color="#C89B3C" />
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600 }}>Not a salon account</div>
          <div style={{ fontSize: 12.5, color: "#8A7A85", lineHeight: 1.5 }}>This login isn't registered as a salon owner. Sign out and create a new account, choosing "I'm a salon owner" at signup.</div>
          <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 6, padding: "10px 16px", borderRadius: 12, border: "1px solid #EFE6DE", background: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Sign out</button>
        </div>
      );
    } else if (!mySalon) {
      body = <SalonOnboarding session={session} onCreated={(s) => setMySalon({ ...s, services: [], stylists: [] })} />;
    } else if (mySalon.status !== "approved") {
      body = <SalonPending salon={mySalon} onUpdated={(s) => setMySalon(prev => ({ ...prev, ...s }))} onSignOut={() => supabase.auth.signOut()} />;
    } else if (dashTab === "overview") {
      body = <SalonOwnerHome salon={mySalon} onRefresh={loadMySalon} onSignOut={() => supabase.auth.signOut()} />;
    } else if (dashTab === "calendar") {
      body = <DashCalendar availability={availability} toggleSlot={toggleSlot} />;
    } else {
      body = <DashEarnings bookings={bookings} commissionRate={commissionRate} frozen={frozenSalons.has("s1")} />;
    }
  } else if (role === "stylist") {
    const stylist = allStylists.find(s => s.id === currentStylistId);
    body = stylist
      ? <StylistStudio stylist={stylist} allStylists={allStylists} onSwitchStylist={setCurrentStylistId} myPosts={posts.filter(p => p.stylistId === currentStylistId)} onPublish={addPost} onDelete={deletePost} />
      : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 12, color: "#B7ACB1" }}>No stylists found.</div></div>;
  } else {
    if (adminTab === "payments") body = <AdminPayments bookings={bookings} commissionRate={commissionRate} />;
    else if (adminTab === "salons") body = <AdminSalons salons={salons} frozenSalons={frozenSalons} toggleFreeze={toggleFreeze} />;
    else if (adminTab === "content") body = <AdminContent posts={posts} setPostStatus={setPostStatus} salons={salons} />;
    else if (adminTab === "settings") body = <AdminSettings commissionRate={commissionRate} setCommissionRate={setCommissionRate} feeBearer={feeBearer} setFeeBearer={setFeeBearer} />;
  }

  const showSalonBottomNav = role === "salon" && session && profile?.role === "salon_owner" && mySalon?.status === "approved";

  return (
    <div style={{ minHeight: "100vh", background: "#EFE6DE", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 12px", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: "#3D1B3D" }}>Glow Circle</span>
        <span style={{ fontSize: 11, color: "#8A7A85" }}>— prototype ·</span>
        <div style={{ display: "flex", background: "#fff", borderRadius: 20, padding: 3, border: "1px solid #E4DCD9" }}>
          {[{ id: "customer", label: "Customer" }, { id: "salon", label: "Salon" }, { id: "stylist", label: "Stylist" }, { id: "admin", label: "Admin" }].map(r => (
            <button key={r.id} onClick={() => setRole(r.id)} style={{ padding: "5px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, background: role === r.id ? "#3D1B3D" : "transparent", color: role === r.id ? "#fff" : "#8A7A85" }}>{r.label}</button>
          ))}
        </div>
      </div>

      <PhoneFrame>
        {body}
        {pendingBooking && (
          <div style={{ position: "absolute", inset: 0, background: "#FBF7F2", display: "flex", flexDirection: "column", zIndex: 25 }}>
            <TopBar title="Log in to book" right={<button onClick={() => setPendingBooking(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>} />
            <AuthScreen onAuthed={() => { setBookingCtx(pendingBooking); setPendingBooking(null); }} />
          </div>
        )}
        {bookingCtx && (<BookingFlow salon={bookingCtx.salon} service={bookingCtx.service} bookedSlots={bookedSlots} onClose={() => { setBookingCtx(null); setTab("bookings"); }} onConfirmed={confirmBooking} />)}
        {role === "customer" && <BottomNav tab={tab} setTab={setTab} tabs={customerTabs} />}
        {showSalonBottomNav && <BottomNav tab={dashTab} setTab={setDashTab} tabs={dashTabs} />}
        {role === "admin" && <BottomNav tab={adminTab} setTab={setAdminTab} tabs={adminTabs} />}
      </PhoneFrame>
    </div>
  );
}
