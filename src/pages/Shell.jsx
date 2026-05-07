import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { HeartHandshake, MessageCircle, Sprout, UserCircle } from 'lucide-react';
import ReachOut  from './ReachOut';
import Inbox     from './Inbox';
import Chat      from './Chat';
import Recovery  from './Recovery';
import Profile   from './Profile';
import s from './Shell.module.css';

function NavItem({ path, label, icon: Icon, badge }) {
  return (
    <NavLink to={path} className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}>
      <Icon size={22} strokeWidth={2} />
      {badge > 0 && <span className={s.badge}>{badge > 9 ? '9+' : badge}</span>}
      <span className={s.navLabel}>{label}</span>
    </NavLink>
  );
}

export default function Shell() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

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
          <NavItem path="/"         label="Reach Out" icon={HeartHandshake} />
          <NavItem path="/inbox"    label="Inbox"     icon={MessageCircle}  badge={unread} />
          <NavItem path="/recovery" label="Recovery"  icon={Sprout} />
          <NavItem path="/profile"  label="Profile"   icon={UserCircle} />
        </nav>
      )}
    </div>
  );
}
