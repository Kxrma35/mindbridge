import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ReachOut  from './ReachOut';
import Inbox     from './Inbox';
import Chat      from './Chat';
import Recovery  from './Recovery';
import Profile   from './Profile';
import s from './Shell.module.css';

const NavIcon = ({ path, label, icon, badge }) => (
  <NavLink to={path} className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}>
    <span className={s.navIcon}>{icon}</span>
    {badge > 0 && <span className={s.badge}>{badge > 9 ? '9+' : badge}</span>}
    <span className={s.navLabel}>{label}</span>
  </NavLink>
);

export default function Shell() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  // Listen for unread signals in real time
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'signals'),
      where('toUid', '==', currentUser.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, snap => setUnread(snap.size));
    return unsub;
  }, [currentUser]);

  const isChatRoute = location.pathname.startsWith('/chat/');

  return (
    <div className={s.shell}>
      <div className={s.content}>
        <Routes>
          <Route path="/"         element={<ReachOut />} />
          <Route path="/inbox"    element={<Inbox />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/profile"  element={<Profile />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!isChatRoute && (
        <nav className={s.nav}>
          <NavIcon path="/"         label="Reach Out" icon="🤝" />
          <NavIcon path="/inbox"    label="Inbox"     icon="💬" badge={unread} />
          <NavIcon path="/recovery" label="Recovery"  icon="🌱" />
          <NavIcon path="/profile"  label="Profile"   icon="👤" />
        </nav>
      )}
    </div>
  );
}
