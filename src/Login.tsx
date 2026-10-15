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
    if (!email.trim()) { setError('Escribe tu correo y te enviamos un enlace para cambiar la contraseña.'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Te enviamos un correo para cambiar tu contraseña.');
    } catch {
      setError('No se pudo enviar el correo. Revisa que esté bien escrito.');
    }
  };

  return (
    <main className="login">
      <div className="marcas"><img src="/logo-natstone-h.png" alt="Natstone" className="m-nat" /><span className="m-sep" aria-hidden="true" /><img src="/logo-pietra.png" alt="Pietra" className="m-pie" /></div>
      <h1 className="rc-title">Radar Comercial</h1>
      <p className="rc-sub">Entra con el mismo correo y contraseña de la intranet.</p>
      {aviso && <p className="notice">{aviso}</p>}
      <form className="sheet" onSubmit={entrar}>
        <label className="field"><span>Correo</span>
          <input className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="field"><span>Contraseña</span>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        <p style={{ textAlign: 'center', margin: '12px 0 4px' }}>
          <button type="button" className="btn-link" onClick={recuperar}>Olvidé mi contraseña</button>
        </p>
        {error && <p className="notice" style={{ marginTop: 10 }}>{error}</p>}
        {info && <p className="auto-note">{info}</p>}
      </form>
    </main>
  );
}
