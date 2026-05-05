import { useEffect, useRef, useState } from 'react';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import s from './Recovery.module.css';

const MILESTONES = [
  { days:1,   msg:'One day done. That took strength.' },
  { days:3,   msg:'Three days. Your body is already healing.' },
  { days:7,   msg:'One full week. You are proof it\'s possible.' },
  { days:14,  msg:'Two weeks strong. Keep choosing yourself.' },
  { days:30,  msg:'30 days. This is remarkable.' },
  { days:60,  msg:'Two months free. You\'ve rewritten your story.' },
  { days:90,  msg:'90 days. You are truly transforming.' },
  { days:180, msg:'Six months. You are an inspiration.' },
  { days:365, msg:'One full year. You did the impossible.' },
];

const ENCOURAGEMENTS = [
  'Every moment you hold on is a victory.',
  'You are stronger than your urges.',
  'This discomfort is temporary. Your freedom is permanent.',
  "You've already proven you can do hard things.",
  'The version of you that breaks free is worth fighting for.',
  "Progress isn't linear. Staying the course is everything.",
  'You are not your past. You are this moment.',
];

function elapsed(isoStr) {
  const ms = Date.now() - new Date(isoStr).getTime();
  if (ms < 0) return null;
  const s = Math.floor(ms/1000);
  return {
    days:  Math.floor(s/86400),
    hours: Math.floor((s%86400)/3600),
    mins:  Math.floor((s%3600)/60),
    secs:  s%60,
  };
}

export default function Recovery() {
  const { currentUser } = useAuth();
  const [tracker, setTracker] = useState(null); // { addictionName, soberSince }
  const [form, setForm]       = useState({ name:'', since:'' });
  const [time, setTime]       = useState(null);
  const [eIdx, setEIdx]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const timerRef = useRef(null);

  // Load from Firestore
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'recovery', currentUser.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setTracker(d);
        setTime(elapsed(d.soberSince));
      }
    });
  }, [currentUser]);

  // Tick
  useEffect(() => {
    if (!tracker) return;
    timerRef.current = setInterval(() => setTime(elapsed(tracker.soberSince)), 1000);
    return () => clearInterval(timerRef.current);
  }, [tracker]);

  // Rotate encouragements
  useEffect(() => {
    const iv = setInterval(() => setEIdx(i => (i+1) % ENCOURAGEMENTS.length), 6000);
    return () => clearInterval(iv);
  }, []);

  async function startTracking() {
    if (!form.name || !form.since) return;
    setSaving(true);
    const data = { addictionName: form.name, soberSince: form.since };
    await setDoc(doc(db, 'recovery', currentUser.uid), data);
    setTracker(data);
    setSaving(false);
  }

  async function resetTracking() {
    if (!confirm('Reset your timer? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'recovery', currentUser.uid));
    setTracker(null);
    setTime(null);
    setForm({ name:'', since:'' });
    clearInterval(timerRef.current);
  }

  const milestone = time ? MILESTONES.filter(m => m.days <= time.days).at(-1) : null;
  const upcoming  = time ? MILESTONES.filter(m => m.days > time.days).slice(0,3) : [];

  const pad = n => String(n).padStart(2,'0');

  return (
    <div className={s.page}>
      <h2 className={s.title}>Recovery</h2>

      {!tracker ? (
        <div className={s.setup}>
          <p className={s.setupSub}>Track your abstinence. Every second is a victory.</p>
          <label className={s.label}>What are you abstaining from?</label>
          <input
            className={s.input}
            placeholder="e.g. alcohol, smoking, gambling…"
            value={form.name}
            onChange={e => setForm(f=>({...f, name:e.target.value}))}
          />
          <label className={s.label}>When did you last use?</label>
          <input
            className={s.input}
            type="datetime-local"
            value={form.since}
            onChange={e => setForm(f=>({...f, since:e.target.value}))}
          />
          <button
            className={s.startBtn}
            onClick={startTracking}
            disabled={!form.name || !form.since || saving}
          >
            {saving ? 'Saving…' : 'Begin tracking'}
          </button>
        </div>
      ) : time ? (
        <>
          <div className={s.timerCard}>
            <div className={s.timerLabel}>Free from {tracker.addictionName}</div>
            <div className={s.timerDisplay}>
              {[['Days',time.days],['Hours',time.hours],['Mins',time.mins],['Secs',time.secs]].map(([l,v])=>(
                <div className={s.unit} key={l}>
                  <div className={s.num}>{pad(v)}</div>
                  <div className={s.unitLabel}>{l}</div>
                </div>
              ))}
            </div>
            <p className={s.encourage} key={eIdx}>{ENCOURAGEMENTS[eIdx]}</p>
          </div>

          {milestone && <div className={s.milestone}>🎯 {milestone.msg}</div>}

          {upcoming.length > 0 && (
            <div className={s.upcomingCard}>
              <div className={s.upcomingTitle}>Next milestones</div>
              {upcoming.map(m => (
                <div key={m.days} className={s.upcomingRow}>
                  <span className={s.upcomingDays}>{m.days} day{m.days!==1?'s':''}</span>
                  <span className={s.upcomingMsg}>{m.msg.split('.')[0]}</span>
                </div>
              ))}
            </div>
          )}

          {upcoming.length === 0 && (
            <div className={s.milestone} style={{background:'#e8f5e9',borderColor:'#a5d6a7',color:'#2d6b46'}}>
              ✨ You've reached every milestone. You are extraordinary.
            </div>
          )}

          <button className={s.resetBtn} onClick={resetTracking}>Reset timer</button>
        </>
      ) : (
        <p className={s.loading}>Loading your tracker…</p>
      )}

      <div className={s.crisis}>
        <div className={s.crisisTitle}>Need immediate support?</div>
        <p className={s.crisisText}>
          Befrienders Kenya: <strong>0800 723 253</strong> (toll-free, 24/7)<br />
          Mathare Hospital: <strong>+254 20 2012477</strong>
        </p>
      </div>
    </div>
  );
}
