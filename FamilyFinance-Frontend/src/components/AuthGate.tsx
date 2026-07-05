import { useState } from 'react';
import { authApi, extractErrorMessage } from '../api';
import type { AuthFamily } from '../types';

interface Props {
  onAuthenticated: (family: AuthFamily) => void;
}

type Mode = 'login' | 'register';

const DEFAULT_PASSWORD = '123456';

export default function AuthGate({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');

  // Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Cadastro
  const [regName, setRegName] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regMemberCount, setRegMemberCount] = useState('');
  const [regUsername, setRegUsername] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal com a senha padrão, exibido logo após o cadastro.
  const [showDefaultPasswordModal, setShowDefaultPasswordModal] = useState(false);

  // Tela de troca de senha obrigatória no primeiro acesso.
  const [pendingFamily, setPendingFamily] = useState<AuthFamily | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleLogin() {
    if (!loginUsername.trim() || !loginPassword) {
      setError('Preencha usuário e senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const family = await authApi.login({
        username: loginUsername.trim(),
        password: loginPassword,
      });

      if (family.mustChangePassword) {
        setPendingFamily(family);
      } else {
        onAuthenticated(family);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    const memberCount = Number(regMemberCount);

    if (!regName.trim() || !regCity.trim() || !regUsername.trim()) {
      setError('Preencha nome da família, cidade e usuário.');
      return;
    }
    if (!regMemberCount || memberCount <= 0) {
      setError('Informe quantos familiares vão usar o sistema.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const created = await authApi.register({
        name: regName.trim(),
        city: regCity.trim(),
        memberCount,
        username: regUsername.trim(),
      });

      setShowDefaultPasswordModal(true);
      // Já deixa o usuário pronto pra logar em seguida.
      setLoginUsername(created.username);
      setLoginPassword('');
      setRegName('');
      setRegCity('');
      setRegMemberCount('');
      setRegUsername('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!pendingFamily) return;

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.changePassword({ familyId: pendingFamily.id, newPassword });
      onAuthenticated({ ...pendingFamily, mustChangePassword: false });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // --- Tela: troca de senha obrigatória no primeiro acesso ---
  if (pendingFamily) {
    return (
      <div className="panel auth-panel">
        <span className="eyebrow">Primeiro acesso</span>
        <h2>Crie uma senha nova</h2>
        <p className="hint">
          Você entrou com a senha padrão. Por segurança, defina uma senha só sua antes de continuar,{' '}
          {pendingFamily.name}.
        </p>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="new-password">Nova senha</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirmar senha</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
              placeholder="Repita a nova senha"
            />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="row" style={{ marginTop: '1rem' }}>
          <button className="btn btn-gold" onClick={handleChangePassword} disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar e entrar'}
          </button>
        </div>
      </div>
    );
  }

  // --- Tela: login / cadastro ---
  return (
    <div className="panel auth-panel">
      <nav className="tab-bar">
        <button
          className={`tab-btn ${mode === 'login' ? 'tab-btn-active' : ''}`}
          onClick={() => switchMode('login')}
        >
          Entrar
        </button>
        <button
          className={`tab-btn ${mode === 'register' ? 'tab-btn-active' : ''}`}
          onClick={() => switchMode('register')}
        >
          Cadastrar família
        </button>
      </nav>

      {mode === 'login' ? (
        <>
          <span className="eyebrow">Acesso</span>
          <h2>Entrar</h2>
          <p className="hint">Use o usuário e a senha da sua família.</p>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="login-username">Usuário</label>
              <input
                id="login-username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Ex.: familia.dutra"
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••"
              />
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="row" style={{ marginTop: '1rem' }}>
            <button className="btn btn-gold" onClick={handleLogin} disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="eyebrow">Passo 1</span>
          <h2>Cadastre sua família</h2>
          <p className="hint">
            Cada família tem seu próprio login. Depois de cadastrar, você recebe uma senha padrão
            para o primeiro acesso.
          </p>

          <div className="form-grid">
            <div className="field grow">
              <label htmlFor="reg-name">Nome da família</label>
              <input
                id="reg-name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ex.: Família Dutra"
              />
            </div>
            <div className="field">
              <label htmlFor="reg-city">Cidade</label>
              <input
                id="reg-city"
                value={regCity}
                onChange={(e) => setRegCity(e.target.value)}
                placeholder="Ex.: Goiânia"
              />
            </div>
            <div className="field">
              <label htmlFor="reg-member-count">Quantidade de familiares</label>
              <input
                id="reg-member-count"
                type="number"
                min={1}
                value={regMemberCount}
                onChange={(e) => setRegMemberCount(e.target.value)}
                placeholder="Ex.: 4"
              />
            </div>
            <div className="field grow">
              <label htmlFor="reg-username">Usuário (login)</label>
              <input
                id="reg-username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                placeholder="Ex.: familia.dutra"
                className="mono"
              />
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="row" style={{ marginTop: '1rem' }}>
            <button className="btn btn-gold" onClick={handleRegister} disabled={loading}>
              {loading ? 'Cadastrando…' : 'Cadastrar'}
            </button>
          </div>
        </>
      )}

      {showDefaultPasswordModal && (
        <div className="modal-overlay">
          <div className="panel modal-box">
            <span className="eyebrow">Cadastro concluído</span>
            <h2>Sua senha padrão é</h2>
            <p className="mono default-password">{DEFAULT_PASSWORD}</p>
            <p className="hint">
              Use usuário <strong>{loginUsername}</strong> e essa senha para entrar agora. No
              primeiro acesso, você vai ser levado(a) direto para criar uma senha só sua.
            </p>
            <button
              className="btn btn-gold"
              onClick={() => {
                setShowDefaultPasswordModal(false);
                setMode('login');
              }}
            >
              Entendi, ir para o login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
