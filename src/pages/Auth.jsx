import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import s from './Auth.module.css';

export default function Auth() {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        await register(email, password, name.trim());
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(friendlyError(err.code));
    }
    setLoading(false);
  }

  function friendlyError(code) {
    const map = {
      'auth/email-already-in-use': 'That email is already registered. Try logging in.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with that email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Incorrect email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }

  return (
    <div className={s.page}>
      <div className={s.top}>
        <h1 className={s.logo}>MindBridge</h1>
        <p className={s.tagline}>You don't have to carry it alone.</p>
      </div>

      <form className={s.form} onSubmit={handleSubmit}>
        <h2 className={s.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>

        {mode === 'register' && (
          <div className={s.field}>
            <label>Your name</label>
            <input
              type="text"
              placeholder="e.g. Amara"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className={s.field}>
          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={s.field}>
          <label>Password</label>
          <input
            type="password"
            placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className={s.error}>{error}</p>}

        <button className={s.submit} type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className={s.switch}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" className={s.link} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>

      <p className={s.disclaimer}>
        MindBridge is a support companion, not a substitute for professional care.
        If you're in crisis, please call Befrienders Kenya: 0800 723 253 (toll-free).
      </p>
    </div>
  );
}
