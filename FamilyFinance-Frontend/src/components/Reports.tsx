import { useEffect, useState } from 'react';
import { reportApi, transactionApi, fixedExpenseApi, extractErrorMessage } from '../api';
import type { FamilyReport, FixedExpense, Person, PersonReport, TransactionType } from '../types';
import ConfirmModal from './ConfirmModal';

interface Props {
  familyId: string;
  people: Person[];
  refreshKey?: number;
}

type ExtractTransaction = PersonReport['transactions'][number];

export default function Reports({ familyId, people, refreshKey }: Props) {
  const [familyReport, setFamilyReport] = useState<FamilyReport | null>(null);
  const [personId, setPersonId] = useState('');
  const [personReport, setPersonReport] = useState<PersonReport | null>(null);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('Expense');
  const [pendingDelete, setPendingDelete] = useState<ExtractTransaction | null>(null);

  useEffect(() => {
    reportApi
      .family(familyId)
      .then(setFamilyReport)
      .catch((err) => setError(extractErrorMessage(err)));

    fixedExpenseApi
      .listByFamily(familyId)
      .then(setFixedExpenses)
      .catch((err) => setError(extractErrorMessage(err)));
  }, [familyId, refreshKey]);

  const totalFixedExpenses =
    familyReport?.totalFixedExpenses ?? fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

  function loadPersonReport() {
    if (!personId) {
      setPersonReport(null);
      return;
    }
    reportApi
      .person(personId)
      .then(setPersonReport)
      .catch((err) => setError(extractErrorMessage(err)));
  }

  useEffect(() => {
    loadPersonReport();
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, refreshKey]);

  function startEdit(t: ExtractTransaction) {
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
      loadPersonReport();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    setError('');
    try {
      await transactionApi.remove(id);
      loadPersonReport();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="panel">
      <span className="eyebrow">Consulta de totais</span>
      <h2>Relatórios</h2>

      {error && <p className="error-text">{error}</p>}

      {familyReport && (
        <div className="report-summary">
          <div className="report-stat">
            <span className="hint">Receita da família</span>
            <span className="mono amount-income">R$ {familyReport.totalFamilyIncome.toFixed(2)}</span>
          </div>
          <div className="report-stat">
            <span className="hint">Despesa da família</span>
            <span className="mono amount-expense">R$ {familyReport.totalFamilyExpense.toFixed(2)}</span>
          </div>
          <div className="report-stat">
            <span className="hint"> Despesas fixas</span>
            <span className="mono amount-expense">R$ {totalFixedExpenses.toFixed(2)}</span>
          </div>
          <div className="report-stat">
            <span className="hint">Saldo</span>
            <span className="mono balance">R$ {familyReport.familyBalance.toFixed(2)}</span>
          </div>
        </div>
      )}

      {familyReport && (
        <ul className="ledger-list">
          {familyReport.members.map((m) => (
            <li key={m.personId} className="ledger-row">
              <span className="person-name">{m.name}</span>
              <span className="mono amount-income">+ R$ {m.totalIncome.toFixed(2)}</span>
              <span className="mono amount-expense">- R$ {m.totalExpense.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="field" style={{ marginTop: '1.5rem' }}>
        <label htmlFor="report-person">Ver extrato de uma pessoa</label>
        <select id="report-person" value={personId} onChange={(e) => setPersonId(e.target.value)}>
          <option value="">Selecione…</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {personReport && (
        <>
          <div className="report-summary">
            <div className="report-stat">
              <span className="hint">Receita</span>
              <span className="mono amount-income">R$ {personReport.totalIncome.toFixed(2)}</span>
            </div>
            <div className="report-stat">
              <span className="hint">Despesa</span>
              <span className="mono amount-expense">R$ {personReport.totalExpense.toFixed(2)}</span>
            </div>
            <div className="report-stat">
              <span className="hint">Despesas fixas</span>
              <span className="mono amount-expense">R$ {totalFixedExpenses.toFixed(2)}</span>
            </div>
            <div className="report-stat">
              <span className="hint">Saldo</span>
              <span className="mono balance">R$ {personReport.balance.toFixed(2)}</span>
            </div>
          </div>

          {fixedExpenses.length > 0 && (
            <>
              <div className="divider-text">Despesas fixas da família</div>
              <ul className="ledger-list">
                {fixedExpenses.map((e) => (
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
                      </span>
                    </div>
                    <span className="mono amount-expense">R$ {e.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="divider-text">Lançamentos de {people.find((p) => p.id === personId)?.name}</div>
          <ul className="ledger-list">
            {personReport.transactions.length === 0 && (
              <li className="empty-row">Nenhuma transação registrada.</li>
            )}
            {personReport.transactions.map((t) =>
              editingId === t.id ? (
                <li key={t.id} className="ledger-row edit-row">
                  <div className="form-grid" style={{ flex: 1, marginTop: 0 }}>
                    <div className="field">
                      <label htmlFor={`report-edit-type-${t.id}`}>Tipo</label>
                      <select
                        id={`report-edit-type-${t.id}`}
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as TransactionType)}
                      >
                        <option value="Expense">Despesa</option>
                        <option value="Income">Receita</option>
                      </select>
                    </div>
                    <div className="field grow">
                      <label htmlFor={`report-edit-desc-${t.id}`}>Descrição</label>
                      <input
                        id={`report-edit-desc-${t.id}`}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`report-edit-amount-${t.id}`}>Valor (R$)</label>
                      <input
                        id={`report-edit-amount-${t.id}`}
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