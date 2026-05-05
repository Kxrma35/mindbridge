import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import s from './Chat.module.css';

function timeLabel(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { id: convId } = useParams(); // uid1_uid2
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [otherName, setOtherName] = useState('');
  const bottomRef = useRef(null);

  // Determine the other participant's UID
  const otherUid = convId.split('_').find(u => u !== currentUser.uid);

  // Fetch the other user's name
  useEffect(() => {
    if (!otherUid) return;
    getDoc(doc(db, 'users', otherUid)).then(snap => {
      if (snap.exists()) setOtherName(snap.data().displayName);
    });
  }, [otherUid]);

  // Real-time messages
  useEffect(() => {
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [convId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText('');
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      senderUid: currentUser.uid,
      senderName: currentUser.displayName,
      text: msgText,
      createdAt: serverTimestamp(),
    });
    // Update conversation metadata
    await setDoc(doc(db, 'conversations', convId), {
      participants: convId.split('_'),
      lastMessage: msgText,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.back} onClick={() => navigate(-1)}>←</button>
        <div className={s.headerName}>{otherName || 'Loading…'}</div>
      </div>

      <div className={s.messages}>
        {messages.length === 0 && (
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
          ➤
        </button>
      </div>
    </div>
  );
}
