import { useState } from 'react';
import { authApi, extractErrorMessage } from '../api';

interface Props {
  familyId: string;
  familyName: string;
  revealedPassword?: string;
  onChanged: () => void;
}

export default function ChangePasswordForm({ familyId, familyName, revealedPassword, onChanged }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({ familyId, newPassword });
      onChanged();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <span className="eyebrow">Primeiro acesso</span>
      <h2>Troque a senha de {familyName}</h2>

      {revealedPassword && (
        <p className="warn-text">
          Sua senha padrão de cadastro é <strong className="mono">{revealedPassword}</strong>. Por
          segurança, defina uma senha nova agora — essa mensagem não vai aparecer de novo.
        </p>
      )}

      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="field">
          <label htmlFor="new-password">Nova senha</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Confirmar nova senha</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-gold" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando…' : 'Trocar senha e continuar'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
