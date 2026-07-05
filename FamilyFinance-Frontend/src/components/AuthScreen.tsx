import { useState } from 'react';
import { authApi, extractErrorMessage } from '../api';
import type { Family } from '../types';

interface Props {
  onAuthenticated: (family: Family, revealedPassword?: string) => void;
}

type Mode = 'login' | 'register';

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');

  // login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // register
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [username, setUsername] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!loginUsername.trim() || !loginPassword) {
      setError('Preencha usuário e senha.');
      return;
    }
    setLoading(true);
    try {
      const family = await authApi.login({ username: loginUsername.trim(), password: loginPassword });
      onAuthenticated(family);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError('');
    const count = parseInt(memberCount, 10);
    if (!name.trim() || !city.trim() || !username.trim() || !count || count <= 0) {
      setError('Preencha todos os campos (quantidade de familiares deve ser maior que zero).');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.register({
        name: name.trim(),
        city: city.trim(),
        memberCount: count,
        username: username.trim(),
      });
      onAuthenticated(result, result.defaultPassword);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <span className="eyebrow">Family Finance</span>
      <h2>{mode === 'login' ? 'Entrar' : 'Criar conta da família'}</h2>

      <div className="tab-bar" style={{ marginTop: '1rem' }}>
        <button
          className={`tab-btn ${mode === 'login' ? 'tab-btn-active' : ''}`}
          onClick={() => {
            setMode('login');
            setError('');
          }}
        >
          Já tenho conta
        </button>
        <button
          className={`tab-btn ${mode === 'register' ? 'tab-btn-active' : ''}`}
          onClick={() => {
            setMode('register');
            setError('');
          }}
        >
          Criar família
        </button>
      </div>

      {mode === 'login' && (
        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="field">
            <label htmlFor="login-username">Usuário</label>
            <input
              id="login-username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="ex.: familia.dutra"
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-gold" onClick={handleLogin} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      )}

      {mode === 'register' && (
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field">
            <label htmlFor="reg-name">Nome da família</label>
            <input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="reg-city">Cidade</label>
            <input id="reg-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="reg-count">Quantidade de familiares</label>
            <input
              id="reg-count"
              type="number"
              min="1"
              value={memberCount}
              onChange={(e) => setMemberCount(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-username">Usuário (login)</label>
            <input
              id="reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex.: familia.dutra"
            />
          </div>
          <button className="btn btn-gold" onClick={handleRegister} disabled={loading} style={{ gridColumn: '1 / -1' }}>
            {loading ? 'Criando…' : 'Criar família'}
          </button>
          <p className="hint" style={{ gridColumn: '1 / -1', margin: 0 }}>
            Toda família nasce com a senha padrão <strong>123456</strong> e precisa trocá-la no primeiro acesso.
          </p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
