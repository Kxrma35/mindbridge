import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, orderBy, addDoc, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import s from './Inbox.module.css';

const AVATAR_COLORS = [
  ['#c8e6c9','#2e7d32'],['#ffe0b2','#e65100'],['#e1bee7','#6a1b9a'],
  ['#b3e5fc','#01579b'],['#f8bbd0','#880e4f'],['#dcedc8','#33691e'],
];
function initials(n=''){return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);}
function colorFor(name=''){return AVATAR_COLORS[name.charCodeAt(0)%AVATAR_COLORS.length];}
function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString();
}

export default function Inbox() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [tab, setTab] = useState('received'); // 'received' | 'sent'

  // Received signals (real-time)
  useEffect(() => {
    if (!currentUser || tab !== 'received') return;
    const q = query(
      collection(db, 'signals'),
      where('toUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSignals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser, tab]);

  // Sent signals (real-time)
  useEffect(() => {
    if (!currentUser || tab !== 'sent') return;
    const q = query(
      collection(db, 'signals'),
      where('fromUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSignals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser, tab]);

  async function markRead(id) {
    await updateDoc(doc(db, 'signals', id), { read: true });
  }

  async function openChat(signal) {
    // Mark signal read
    if (!signal.read && tab === 'received') {
      await markRead(signal.id);
    }
    // Find or create a conversation between the two users
    const uid1 = signal.fromUid;
    const uid2 = signal.toUid;
    const convId = [uid1, uid2].sort().join('_');
    navigate(`/chat/${convId}`);
  }

  const unread = signals.filter(s => !s.read && tab === 'received').length;

  return (
    <div className={s.page}>
      <h2 className={s.title}>Inbox</h2>

      <div className={s.tabs}>
        <button className={`${s.tab} ${tab==='received'?s.active:''}`} onClick={()=>setTab('received')}>
          Received {unread > 0 && <span className={s.badge}>{unread}</span>}
        </button>
        <button className={`${s.tab} ${tab==='sent'?s.active:''}`} onClick={()=>setTab('sent')}>
          Sent
        </button>
      </div>

      {signals.length === 0 && (
        <div className={s.empty}>
          {tab === 'received'
            ? "No signals yet. When someone reaches out, you'll see it here."
            : "You haven't sent any signals yet."}
        </div>
      )}

      <div className={s.list}>
        {signals.map(sig => {
          const name = tab === 'received' ? sig.fromName : sig.toName;
          const [bg, fg] = colorFor(name);
          return (
            <div
              key={sig.id}
              className={`${s.item} ${!sig.read && tab==='received' ? s.unread : ''}`}
              onClick={() => openChat(sig)}
            >
              <div className={s.avatar} style={{background:bg}}>
                <span style={{color:fg}}>{initials(name)}</span>
              </div>
              <div className={s.body}>
                <div className={s.row}>
                  <span className={s.name}>{name}</span>
                  <span className={s.time}>{timeAgo(sig.createdAt)}</span>
                </div>
                <div className={s.preview}>
                  {tab === 'received' ? 'Needs to talk' : 'You reached out'}
                  {sig.feelings?.length > 0 && ` · ${sig.feelings.slice(0,2).join(', ')}${sig.feelings.length>2?'…':''}`}
                </div>
                {sig.note && <div className={s.note}>"{sig.note}"</div>}
                {sig.feelings?.length > 0 && (
                  <div className={s.chips}>
                    {sig.feelings.map(f => <span key={f} className={s.chip}>{f}</span>)}
                  </div>
                )}
              </div>
              {!sig.read && tab === 'received' && <div className={s.dot} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
