import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';

export default function Login({ aviso }: { aviso?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setEnviando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError('Correo o contraseña incorrectos.');
    }
    setEnviando(false);
  };

  const recuperar = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError('Escribe tu correo para enviarte el enlace.'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Te enviamos un correo para cambiar tu contraseña.');
    } catch {
      setError('No se pudo enviar el correo. Revisa que esté bien escrito.');
    }
  };

  return (
    <div className="welcome-wrapper">
      <form className="welcome-card" onSubmit={entrar}>
        <h1 className="welcome-title">Iniciar sesión</h1>
        <p className="welcome-subtitle">Usa el mismo correo y contraseña de la intranet.</p>
        {aviso && <p className="message error" style={{ marginTop: 0, marginBottom: '1rem' }}>{aviso}</p>}
        <div className="form-field" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <label htmlFor="correo">Correo</label>
          <input id="correo" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-field" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <label htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={enviando} style={{ width: '100%' }}>{enviando ? 'Entrando...' : 'Entrar'}</button>
        <button type="button" className="secondary-button" onClick={recuperar} style={{ width: '100%', marginTop: '0.75rem' }}>Olvidé mi contraseña</button>
        {error && <p className="message error">{error}</p>}
        {info && <p className="message success">{info}</p>}
      </form>
    </div>
  );
}
