import { useEffect, useState } from 'react';
import { fixedExpenseApi, extractErrorMessage } from '../api';
import type { FixedExpense, Person } from '../types';
import ConfirmModal from './ConfirmModal';

interface Props {
  familyId: string;
  people: Person[];
  onChanged?: () => void;
}

export default function FixedExpensesManager({ familyId, people, onChanged }: Props) {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<FixedExpense | null>(null);

  const principal = people.find((p) => p.isPrincipal);

  async function load() {
    try {
      const list = await fixedExpenseApi.listByFamily(familyId);
      setExpenses(list);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  async function handleCreate() {
    if (!description.trim() || !amount) {
      setError('Preencha descrição e valor.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await fixedExpenseApi.create({
        familyId,
        description: description.trim(),
        amount: parseFloat(amount),
      });
      setDescription('');
      setAmount('');
      await load();
      onChanged?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(id: string) {
    setError('');
    try {
      await fixedExpenseApi.markAsPaid(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    setError('');
    try {
      await fixedExpenseApi.remove(id);
      await load();
      onChanged?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="panel">
      <span className="eyebrow">Despesas fixas</span>
      <h2>Contas recorrentes da família</h2>

      {!principal && (
        <p className="warn-text">
          Nenhuma pessoa está marcada como <strong>principal</strong> desta família ainda.
          Marque alguém como principal em "Membros da família" antes de apagar despesas quitadas —
          toda exclusão fica registrada em nome dessa pessoa.
        </p>
      )}
      {principal && (
        <p className="hint">
          Toda exclusão de despesa fixa quitada fica registrada em nome de{' '}
          <strong>{principal.name}</strong>, o principal da família.
        </p>
      )}

      <div className="form-grid">
        <div className="field grow">
          <label htmlFor="fe-desc">Descrição</label>
          <input
            id="fe-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Aluguel, internet, plano de saúde…"
          />
        </div>
        <div className="field">
          <label htmlFor="fe-amount">Valor (R$)</label>
          <input
            id="fe-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button className="btn btn-gold" onClick={handleCreate} disabled={loading}>
          {loading ? 'Salvando…' : 'Cadastrar despesa fixa'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <ul className="ledger-list">
        {expenses.length === 0 && <li className="empty-row">Nenhuma despesa fixa cadastrada.</li>}
        {expenses.map((e) => (
          <li key={e.id} className="ledger-row">
            <div className="ledger-row-main">
              <span className="person-name">
                {e.description}
                {e.isPaid ? (
                  <span className="badge badge-income">Quitada</span>
                ) : (
                  <span className="badge badge-expense">Em aberto</span>
                )}
              </span>
              <span className="hint">
                Criada em {new Date(e.createdAt).toLocaleDateString('pt-BR')}
                {e.paidAt && ` · quitada em ${new Date(e.paidAt).toLocaleDateString('pt-BR')}`}
              </span>
              <span className="mono amount-expense">R$ {e.amount.toFixed(2)}</span>
            </div>
            <div className="ledger-row-actions">
              {!e.isPaid && (
                <button className="btn btn-ghost" onClick={() => handleMarkPaid(e.id)}>
                  Marcar como quitada
                </button>
              )}
              {e.isPaid && (
                <button className="btn btn-danger-ghost" onClick={() => setPendingDelete(e)}>
                  Apagar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Apagar despesa fixa"
        message={`Apagar "${pendingDelete?.description}" (R$ ${pendingDelete?.amount.toFixed(2)})? Isso gera um registro no log da família em nome de ${principal?.name ?? 'quem for o principal'}.`}
        confirmLabel="Apagar"
        onConfirm={() => pendingDelete && handleDelete(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
