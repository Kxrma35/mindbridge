import { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs, addDoc,
  serverTimestamp, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Sparkles, HeartHandshake } from 'lucide-react';
import s from './ReachOut.module.css';

const FEELINGS = [
  { id: 'anxiety',      label: 'Anxiety',       desc: 'Racing thoughts, worry, panic' },
  { id: 'sadness',      label: 'Sadness',        desc: 'Feeling low, hopeless, tearful' },
  { id: 'loneliness',   label: 'Loneliness',     desc: 'Disconnected, isolated, unseen' },
  { id: 'overwhelm',    label: 'Overwhelm',      desc: 'Too much at once, burnout' },
  { id: 'anger',        label: 'Anger',           desc: 'Frustration, rage, resentment' },
  { id: 'grief',        label: 'Grief',           desc: 'Loss, mourning, emptiness' },
  { id: 'sleep',        label: 'Sleep issues',   desc: "Can't sleep, nightmares, fatigue" },
  { id: 'self-worth',   label: 'Self-worth',     desc: 'Shame, low confidence, self-doubt' },
  { id: 'relationship', label: 'Relationships',  desc: 'Conflict, heartbreak, betrayal' },
  { id: 'physical',     label: 'Physical pain',  desc: 'Chronic pain, illness, body image' },
];

const AVATAR_COLORS = [
  ['#c8e6c9','#2e7d32'], ['#ffe0b2','#e65100'], ['#e1bee7','#6a1b9a'],
  ['#b3e5fc','#01579b'], ['#f8bbd0','#880e4f'], ['#dcedc8','#33691e'],
  ['#fff9c4','#f57f17'], ['#ffccbc','#bf360c'],
];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ReachOut() {
  const { currentUser } = useAuth();
  const [contacts, setContacts]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [feelings, setFeelings]     = useState([]);
  const [note, setNote]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [loadingContacts, setLC]    = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function loadContacts() {
      const q = query(
        collection(db, 'contacts'),
        where('ownerUid', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setContacts(list);
      setLC(false);
    }
    loadContacts();
  }, [currentUser]);

  function toggleFeeling(id) {
    setFeelings(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  }

  async function sendSignal() {
    if (!selected) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'signals'), {
        fromUid:    currentUser.uid,
        fromName:   currentUser.displayName,
        toUid:      selected.contactUid,
        toName:     selected.displayName,
        feelings,
        note:       note.trim(),
        read:       false,
        createdAt:  serverTimestamp(),
      });
      setSent(true);
      setFeelings([]);
      setNote('');
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to send. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className={s.page}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'6px'}}>
        <Heart size={24} color="#9333ea" fill="#e9d5ff" />
        <h1 className={s.logo}>MindBridge</h1>
        <Sparkles size={24} color="#ec4899" />
      </div>
      <p className={s.tagline}>You matter. Your feelings are valid. We're here for you.</p>

      <h2 className={s.sectionTitle}><HeartHandshake size={20} color="#9333ea" /> Reach Out for Support</h2>
      <p className={s.sectionSub}>Pick someone you trust. They'll get a notification immediately.</p>

      {loadingContacts ? (
        <p className={s.loading}>Loading your contacts…</p>
      ) : contacts.length === 0 ? (
        <div className={s.emptyContacts}>
          <p>You haven't connected with anyone yet.</p>
          <p>Go to <strong>Profile</strong> to add a family member or friend by email.</p>
        </div>
      ) : (
        <div className={s.grid}>
          {contacts.map((c, i) => {
            const [bg, fg] = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div
                key={c.id}
                className={`${s.card} ${selected?.id === c.id ? s.cardSelected : ''}`}
                onClick={() => setSelected(c)}
              >
                <div className={s.avatar} style={{ background: bg }}>
                  <span style={{ color: fg }}>{initials(c.displayName)}</span>
                </div>
                <div className={s.cardName}>{c.displayName}</div>
                <div className={s.cardRole}>{c.relation}</div>
              </div>
            );
          })}
        </div>
      )}

      {sent && (
        <div className={s.toast}>
          ✓ Signal sent to {selected?.displayName}. They'll reach out to you.
        </div>
      )}

      <button
        className={s.helpBtn}
        disabled={!selected || loading}
        onClick={sendSignal}
      >
        {selected ? `Send a signal to ${selected.displayName}` : 'Select someone first'}
      </button>

      <hr className={s.divider} />

      <h2 className={s.sectionTitle}>What are you feeling?</h2>
      <p className={s.sectionSub}>Tap anything that fits — it'll be included in your signal so they know how to show up for you.</p>

      <div className={s.feelingsGrid}>
        {FEELINGS.map(f => (
          <div
            key={f.id}
            className={`${s.feeling} ${feelings.includes(f.id) ? s.feelingSelected : ''}`}
            onClick={() => toggleFeeling(f.id)}
          >
            <div className={s.feelingLabel}>{f.label}</div>
            <div className={s.feelingDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      <textarea
        className={s.noteArea}
        rows={3}
        placeholder="Add a note… (optional). Your words, however small, matter."
        value={note}
        onChange={e => setNote(e.target.value)}
      />
    </div>
  );
}
