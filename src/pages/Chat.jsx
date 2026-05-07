import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';
import s from './Chat.module.css';

function timeLabel(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { id: convId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [otherName, setOtherName] = useState('');
  const [ready, setReady]         = useState(false);
  const bottomRef = useRef(null);

  const otherUid = convId.split('_').find(u => u !== currentUser.uid);

  // Fetch other user's name
  useEffect(() => {
    if (!otherUid) return;
    getDoc(doc(db, 'users', otherUid)).then(snap => {
      if (snap.exists()) setOtherName(snap.data().displayName);
    });
  }, [otherUid]);

  // Ensure conversation document exists before subscribing to messages
  useEffect(() => {
    if (!currentUser || !convId) return;
    const participants = convId.split('_');
    const convRef = doc(db, 'conversations', convId);
    setDoc(convRef, { participants, createdAt: serverTimestamp() }, { merge: true })
      .then(() => setReady(true))
      .catch(err => { console.error('Conv init error:', err); setReady(true); });
  }, [convId, currentUser]);

  // Real-time messages — only subscribe once conversation doc exists
  useEffect(() => {
    if (!ready) return;
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error('Messages error:', err));
    return unsub;
  }, [ready, convId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        senderUid:  currentUser.uid,
        senderName: currentUser.displayName,
        text:       trimmed,
        createdAt:  serverTimestamp(),
      });
      await setDoc(doc(db, 'conversations', convId), {
        participants:  convId.split('_'),
        lastMessage:   trimmed,
        updatedAt:     serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Send error:', err);
      alert('Message failed to send. Please check your connection.');
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className={s.headerName}>{otherName || 'Loading…'}</div>
      </div>

      <div className={s.messages}>
        {!ready && <div className={s.empty}>Connecting…</div>}
        {ready && messages.length === 0 && (
          <div className={s.empty}>
            Start the conversation. Even a simple "I'm here" means everything.
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.senderUid === currentUser.uid;
          return (
            <div key={msg.id} className={`${s.msgRow} ${mine ? s.mine : s.theirs}`}>
              <div className={`${s.bubble} ${mine ? s.bubbleMine : s.bubbleTheirs}`}>
                <p className={s.msgText}>{msg.text}</p>
                <span className={s.msgTime}>{timeLabel(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={s.composer}>
        <textarea
          className={s.input}
          rows={1}
          placeholder="Write something…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className={s.sendBtn} onClick={send} disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
