import { useState } from 'react';
import { familyApi, extractErrorMessage } from '../api';
import type { Family } from '../types';

interface Props {
  family: Family | null;
  onFamilyReady: (family: Family) => void;
}

export default function FamilySetup({ family, onFamilyReady }: Props) {
  const [name, setName] = useState('');
  const [existingId, setExistingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Dê um nome para a família.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await familyApi.create(name.trim());
      onFamilyReady(created);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleUseExisting() {
    if (!existingId.trim()) {
      setError('Cole o ID (GUID) de uma família existente.');
      return;
    }
    onFamilyReady({ id: existingId.trim(), name: '(família existente)' });
  }

  if (family) {
    return (
      <div className="panel family-banner">
        <div>
          <span className="eyebrow">Família ativa</span>
          <h2>{family.name}</h2>
        </div>
        <code className="mono id-chip" title="ID da família">
          {family.id}
        </code>
      </div>
    );
  }

  return (
    <div className="panel">
      <span className="eyebrow">Passo 1</span>
      <h2>Comece uma família</h2>
      <p className="hint">
        Crie uma família nova ou informe o ID de uma que já existe no banco.
      </p>

      <div className="row">
        <div className="field grow">
          <label htmlFor="family-name">Nome da família</label>
          <input
            id="family-name"
            placeholder="Ex.: Família Oliveira"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button className="btn btn-gold" onClick={handleCreate} disabled={loading}>
          {loading ? 'Criando…' : 'Criar família'}
        </button>
      </div>

      <div className="divider-text">ou</div>

      <div className="row">
        <div className="field grow">
          <label htmlFor="family-id">ID de uma família existente</label>
          <input
            id="family-id"
            placeholder="00000000-0000-0000-0000-000000000000"
            value={existingId}
            onChange={(e) => setExistingId(e.target.value)}
            className="mono"
          />
        </div>
        <button className="btn" onClick={handleUseExisting}>
          Usar este ID
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
