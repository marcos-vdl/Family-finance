import { useState } from 'react';
import { adminApi, extractErrorMessage } from '../api';
import type { AdminCredentials, AdminFamilyRow } from '../types';
import ConfirmModal from './ConfirmModal';

interface Props {
  onExit: () => void;
}

export default function AdminPanel({ onExit }: Props) {
  const [creds, setCreds] = useState<AdminCredentials | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [families, setFamilies] = useState<AdminFamilyRow[]>([]);
  const [pendingDelete, setPendingDelete] = useState<AdminFamilyRow | null>(null);
  const [pendingReset, setPendingReset] = useState<AdminFamilyRow | null>(null);
  const [feedback, setFeedback] = useState('');

  async function loadFamilies(activeCreds: AdminCredentials) {
    try {
      const result = await adminApi.listFamilies(activeCreds);
      setFamilies(result.families);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleLogin() {
    setError('');
    if (!username.trim() || !password) {
      setError('Preencha usuário e senha de administrador.');
      return;
    }
    setLoading(true);
    try {
      await adminApi.login({ username: username.trim(), password });
      const activeCreds = { username: username.trim(), password };
      setCreds(activeCreds);
      await loadFamilies(activeCreds);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(family: AdminFamilyRow) {
    if (!creds) return;
    setError('');
    setFeedback('');
    try {
      const result = await adminApi.resetPassword(family.id, creds);
      setFeedback(result?.message ?? 'Senha redefinida.');
      await loadFamilies(creds);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingReset(null);
    }
  }

  async function handleDelete(family: AdminFamilyRow) {
    if (!creds) return;
    setError('');
    try {
      await adminApi.deleteFamily(family.id, creds);
      await loadFamilies(creds);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  }

  if (!creds) {
    return (
      <div className="panel">
        <span className="eyebrow">Área administrativa</span>
        <h2>Login de administrador</h2>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="field">
            <label htmlFor="admin-username">Usuário</label>
            <input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Senha</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-gold" onClick={handleLogin} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar como admin'}
          </button>
          <button className="btn btn-ghost" onClick={onExit}>
            Voltar
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="family-banner">
        <div>
          <span className="eyebrow">Área administrativa</span>
          <h2>Todas as famílias</h2>
        </div>
        <button className="btn btn-ghost" onClick={onExit}>
          Sair do admin
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {feedback && <p className="success-text">{feedback}</p>}

      <ul className="ledger-list">
        {families.length === 0 && <li className="empty-row">Nenhuma família cadastrada ainda.</li>}
        {families.map((f) => (
          <li key={f.id} className="ledger-row">
            <div className="ledger-row-main">
              <span className="person-name">
                {f.name}
                {f.mustChangePassword && <span className="badge badge-muted">Senha padrão</span>}
              </span>
              <span className="hint">
                {f.city} · usuário <span className="mono">{f.username}</span> · {f.registeredPeopleCount}{' '}
                pessoa(s) · criada em {new Date(f.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="ledger-row-actions">
              <button className="btn btn-ghost" onClick={() => setPendingReset(f)}>
                Redefinir senha
              </button>
              <button className="btn btn-danger-ghost" onClick={() => setPendingDelete(f)}>
                Apagar família
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        open={pendingReset !== null}
        title="Redefinir senha"
        message={`Redefinir a senha de "${pendingReset?.name}" para o padrão (123456)? A família vai precisar trocá-la no próximo login.`}
        confirmLabel="Redefinir"
        danger={false}
        onConfirm={() => pendingReset && handleResetPassword(pendingReset)}
        onCancel={() => setPendingReset(null)}
      />

      <ConfirmModal
        open={pendingDelete !== null}
        title="Apagar família"
        message={`Apagar "${pendingDelete?.name}" e todos os dados dela (pessoas, transações, despesas fixas, logs)? Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
