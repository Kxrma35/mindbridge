import { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import s from './Profile.module.css';

const AVATAR_COLORS = [
  ['#c8e6c9','#2e7d32'],['#ffe0b2','#e65100'],['#e1bee7','#6a1b9a'],
  ['#b3e5fc','#01579b'],['#f8bbd0','#880e4f'],['#dcedc8','#33691e'],
  ['#fff9c4','#f57f17'],['#ffccbc','#bf360c'],
];
function initials(n=''){return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);}
function colorFor(n=''){return AVATAR_COLORS[n.charCodeAt(0)%AVATAR_COLORS.length];}

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const [contacts, setContacts]   = useState([]);
  const [email, setEmail]         = useState('');
  const [relation, setRelation]   = useState('');
  const [adding, setAdding]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  async function loadContacts() {
    const q = query(collection(db,'contacts'), where('ownerUid','==',currentUser.uid));
    const snap = await getDocs(q);
    setContacts(snap.docs.map(d=>({id:d.id,...d.data()})));
  }

  useEffect(() => { loadContacts(); }, [currentUser]);

  async function addContact(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim() || !relation.trim()) { setError('Please fill in both fields.'); return; }
    if (email.trim().toLowerCase() === currentUser.email.toLowerCase()) {
      setError("You can't add yourself."); return;
    }
    setAdding(true);
    // Look up the user by email
    const q = query(collection(db,'users'), where('email','==', email.trim().toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) {
      setError('No MindBridge account found with that email. Ask them to sign up first.');
      setAdding(false); return;
    }
    const found = snap.docs[0].data();
    // Check for duplicate
    const dup = contacts.find(c => c.contactUid === found.uid);
    if (dup) { setError('This person is already in your contacts.'); setAdding(false); return; }

    await addDoc(collection(db,'contacts'), {
      ownerUid:    currentUser.uid,
      contactUid:  found.uid,
      displayName: found.displayName,
      email:       found.email,
      relation:    relation.trim(),
      addedAt:     serverTimestamp(),
    });
    setEmail(''); setRelation('');
    setSuccess(`${found.displayName} added to your contacts!`);
    loadContacts();
    setAdding(false);
  }

  async function removeContact(id) {
    if (!confirm('Remove this contact?')) return;
    await deleteDoc(doc(db,'contacts', id));
    loadContacts();
  }

  return (
    <div className={s.page}>
      <h2 className={s.title}>Profile</h2>

      {/* Current user */}
      <div className={s.meCard}>
        <div className={s.meAvatar}>{initials(currentUser.displayName || '')}</div>
        <div>
          <div className={s.meName}>{currentUser.displayName}</div>
          <div className={s.meEmail}>{currentUser.email}</div>
        </div>
      </div>

      {/* Add contact */}
      <h3 className={s.sectionTitle}>Add a contact</h3>
      <p className={s.sectionSub}>They need to have a MindBridge account. Add them by email.</p>
      <form className={s.addForm} onSubmit={addContact}>
        <input
          className={s.input}
          type="email"
          placeholder="Their email address"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          className={s.input}
          type="text"
          placeholder="How do you know them? (e.g. Mum, Best friend)"
          value={relation}
          onChange={e=>setRelation(e.target.value)}
        />
        {error && <p className={s.error}>{error}</p>}
        {success && <p className={s.success}>{success}</p>}
        <button className={s.addBtn} type="submit" disabled={adding}>
          {adding ? 'Looking up…' : '+ Add contact'}
        </button>
      </form>

      {/* Existing contacts */}
      {contacts.length > 0 && (
        <>
          <h3 className={s.sectionTitle} style={{marginTop:'1.5rem'}}>Your contacts</h3>
          <div className={s.list}>
            {contacts.map((c,i) => {
              const [bg,fg] = colorFor(c.displayName);
              return (
                <div key={c.id} className={s.contactRow}>
                  <div className={s.contactAvatar} style={{background:bg}}>
                    <span style={{color:fg}}>{initials(c.displayName)}</span>
                  </div>
                  <div className={s.contactInfo}>
                    <div className={s.contactName}>{c.displayName}</div>
                    <div className={s.contactRole}>{c.relation}</div>
                  </div>
                  <button className={s.removeBtn} onClick={()=>removeContact(c.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button className={s.logoutBtn} onClick={logout}>Sign out</button>
    </div>
  );
}
