import { useEffect, useState } from 'react';
import { personApi, extractErrorMessage } from '../api';
import type { Person } from '../types';
import DeletePersonModal from './DeletePersonModal';

interface Props {
  familyId: string;
  onPeopleChanged?: (people: Person[]) => void;
}

export default function PeopleManager({ familyId, onPeopleChanged }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isPrincipal, setIsPrincipal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);

  async function loadPeople() {
    try {
      const list = await personApi.listByFamily(familyId);
      setPeople(list);
      onPeopleChanged?.(list);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  async function handleCreate() {
    if (!name.trim() || !birthDate) {
      setError('Preencha nome e data de nascimento.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await personApi.create({
        familyId,
        name: name.trim(),
        birthDate: new Date(birthDate).toISOString(),
        isPrincipal,
      });
      setName('');
      setBirthDate('');
      setIsPrincipal(false);
      await loadPeople();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(personId: string, deletedByPersonId: string) {
    setError('');
    try {
      await personApi.remove(personId, deletedByPersonId);
      await loadPeople();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  }

  function age(birth: string) {
    const b = new Date(birth);
    const today = new Date();
    let a = today.getFullYear() - b.getFullYear();
    const beforeBirthday =
      today.getMonth() < b.getMonth() ||
      (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
    if (beforeBirthday) a--;
    return a;
  }

  return (
    <div className="panel">
      <span className="eyebrow">Cadastro de pessoas</span>
      <h2>Membros da família</h2>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="p-name">Nome</label>
          <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-birth">Nascimento</label>
          <input
            id="p-birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="field checkbox-field">
          <label htmlFor="p-principal">
            <input
              id="p-principal"
              type="checkbox"
              checked={isPrincipal}
              onChange={(e) => setIsPrincipal(e.target.checked)}
            />
            É o principal / moderador da família
          </label>
        </div>
        <button className="btn btn-gold" onClick={handleCreate} disabled={loading}>
          {loading ? 'Adicionando…' : 'Adicionar pessoa'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <ul className="ledger-list">
        {people.length === 0 && <li className="empty-row">Nenhuma pessoa cadastrada ainda.</li>}
        {people.map((p) => (
          <li key={p.id} className="ledger-row">
            <div className="ledger-row-main">
              <span className="person-name">
                {p.name}
                {p.isPrincipal && <span className="badge badge-gold">Principal</span>}
                {p.isUnderAge && <span className="badge badge-muted">Menor de idade</span>}
              </span>
              <span className="hint">{age(p.birthDate)} anos</span>
            </div>
            <button className="btn btn-danger-ghost" onClick={() => setPendingDelete(p)}>
              Apagar
            </button>
          </li>
        ))}
      </ul>

      <DeletePersonModal
        open={pendingDelete !== null}
        personToDelete={pendingDelete}
        people={people}
        onConfirm={(deletedByPersonId) =>
          pendingDelete && handleDelete(pendingDelete.id, deletedByPersonId)
        }
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
