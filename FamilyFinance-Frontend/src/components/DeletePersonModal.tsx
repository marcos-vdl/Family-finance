import { useState } from 'react';
import type { Person } from '../types';

interface Props {
  open: boolean;
  personToDelete: Person | null;
  people: Person[];
  onConfirm: (deletedByPersonId: string) => void;
  onCancel: () => void;
}

// Pergunta qual pessoa da família está excluindo outra pessoa. O nome escolhido aqui
// é o que aparece depois no Log, junto com a data/hora da ação.
export default function DeletePersonModal({ open, personToDelete, people, onConfirm, onCancel }: Props) {
  const [selectedId, setSelectedId] = useState('');
  const [touched, setTouched] = useState(false);

  if (!open || !personToDelete) return null;

  // Não faz sentido a própria pessoa sendo apagada constar como autora da exclusão.
  const candidates = people.filter((p) => p.id !== personToDelete.id);

  function handleConfirm() {
    if (!selectedId) {
      setTouched(true);
      return;
    }
    onConfirm(selectedId);
    setSelectedId('');
    setTouched(false);
  }

  function handleCancel() {
    setSelectedId('');
    setTouched(false);
    onCancel();
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={handleCancel}>
      <div
        className="modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-person-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="delete-person-title">Apagar "{personToDelete.name}"</h3>
        <p className="modal-message">
          Isso também apaga todas as transações dela e fica registrado no Log com nome e data.
          Quem está fazendo essa exclusão?
        </p>

        <div className="field" style={{ textAlign: 'left', margin: '1rem 0' }}>
          <label htmlFor="delete-person-who">Selecione seu nome</label>
          <select
            id="delete-person-who"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {touched && !selectedId && (
          <p className="error-text">Selecione quem está realizando a exclusão.</p>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={handleConfirm}>
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}
