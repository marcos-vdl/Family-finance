import { useEffect, useState } from 'react';
import { transactionApi, reportApi, extractErrorMessage } from '../api';
import type { Person, TransactionType } from '../types';
import ConfirmModal from './ConfirmModal';

interface Props {
  people: Person[];
  onCreated?: () => void;
}

interface TransactionRow {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  createdAt: string;
}

export default function TransactionForm({ people, onCreated }: Props) {
  const [personId, setPersonId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('Expense');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('Expense');
  const [pendingDelete, setPendingDelete] = useState<TransactionRow | null>(null);

  async function loadTransactions(pid: string) {
    if (!pid) {
      setTransactions([]);
      return;
    }
    try {
      const report = await reportApi.person(pid);
      setTransactions(report.transactions);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    loadTransactions(personId);
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  async function handleSubmit() {
    setError('');
    setSuccess('');
    if (!personId || !description.trim() || !amount) {
      setError('Preencha pessoa, descrição e valor.');
      return;
    }
    setLoading(true);
    try {
      await transactionApi.create({
        personId,
        description: description.trim(),
        amount: parseFloat(amount),
        type,
      });
      setDescription('');
      setAmount('');
      setSuccess('Transação registrada.');
      await loadTransactions(personId);
      onCreated?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function startEdit(t: TransactionRow) {
    setEditingId(t.id);
    setEditDescription(t.description);
    setEditAmount(String(t.amount));
    setEditType(t.type);
    setError('');
  }

  async function saveEdit(id: string) {
    setError('');
    try {
      await transactionApi.update(id, {
        description: editDescription.trim(),
        amount: parseFloat(editAmount),
        type: editType,
      });
      setEditingId(null);
      await loadTransactions(personId);
      onCreated?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    setError('');
    try {
      await transactionApi.remove(id);
      await loadTransactions(personId);
      onCreated?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="panel">
      <span className="eyebrow">Fluxo de caixa</span>
      <h2>Lançar transação</h2>
      <p className="hint">
        Menores de idade não podem registrar receitas — a API bloqueia isso automaticamente.
      </p>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="t-person">Pessoa</label>
          <select id="t-person" value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Selecione…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.isUnderAge ? ' (menor)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="t-type">Tipo</label>
          <select
            id="t-type"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="Expense">Despesa</option>
            <option value="Income">Receita</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="t-desc">Descrição</label>
          <input
            id="t-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Mesada, supermercado…"
          />
        </div>

        <div className="field">
          <label htmlFor="t-amount">Valor (R$)</label>
          <input
            id="t-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <button className="btn btn-gold" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando…' : 'Registrar'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {personId && (
        <>
          <div className="divider-text">Lançamentos desta pessoa</div>
          <ul className="ledger-list">
            {transactions.length === 0 && (
              <li className="empty-row">Nenhuma transação registrada ainda.</li>
            )}
            {transactions.map((t) =>
              editingId === t.id ? (
                <li key={t.id} className="ledger-row edit-row">
                  <div className="form-grid" style={{ flex: 1, marginTop: 0 }}>
                    <div className="field">
                      <label htmlFor={`edit-type-${t.id}`}>Tipo</label>
                      <select
                        id={`edit-type-${t.id}`}
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as TransactionType)}
                      >
                        <option value="Expense">Despesa</option>
                        <option value="Income">Receita</option>
                      </select>
                    </div>
                    <div className="field grow">
                      <label htmlFor={`edit-desc-${t.id}`}>Descrição</label>
                      <input
                        id={`edit-desc-${t.id}`}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`edit-amount-${t.id}`}>Valor (R$)</label>
                      <input
                        id={`edit-amount-${t.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                      />
                    </div>
                    <div className="ledger-row-actions">
                      <button className="btn btn-gold" onClick={() => saveEdit(t.id)}>
                        Salvar
                      </button>
                      <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={t.id} className="ledger-row">
                  <div className="ledger-row-main">
                    <span className="person-name">{t.description}</span>
                    <span className="hint">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <span className={`mono ${t.type === 'Income' ? 'amount-income' : 'amount-expense'}`}>
                    {t.type === 'Income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </span>
                  <div className="ledger-row-actions">
                    <button className="btn btn-ghost" onClick={() => startEdit(t)}>
                      Editar
                    </button>
                    <button className="btn btn-danger-ghost" onClick={() => setPendingDelete(t)}>
                      Apagar
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        title="Apagar transação"
        message={`Apagar o lançamento "${pendingDelete?.description}" (R$ ${pendingDelete?.amount.toFixed(2)})? Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        onConfirm={() => pendingDelete && handleDelete(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
