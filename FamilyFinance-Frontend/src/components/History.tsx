import { useEffect, useState } from 'react';
import { reportApi, extractErrorMessage } from '../api';
import type { FamilyReport, MonthOption } from '../types';

interface Props {
  familyId: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function monthLabel(m: MonthOption) {
  return `${MONTH_NAMES[m.month - 1]} de ${m.year}`;
}

export default function History({ familyId }: Props) {
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [selected, setSelected] = useState<MonthOption | null>(null);
  const [report, setReport] = useState<FamilyReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reportApi
      .availableMonths(familyId)
      .then((list) => {
        setMonths(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch((err) => setError(extractErrorMessage(err)));
  }, [familyId]);

  useEffect(() => {
    if (!selected) {
      setReport(null);
      return;
    }
    setLoading(true);
    reportApi
      .family(familyId, selected)
      .then(setReport)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [familyId, selected]);

  return (
    <div className="panel">
      <span className="eyebrow">Meses anteriores</span>
      <h2>Histórico</h2>
      <p className="hint">Veja os totais fechados de cada mês já registrado pela família.</p>

      {error && <p className="error-text">{error}</p>}

      {months.length === 0 && !error && (
        <p className="empty-row">Ainda não há meses registrados.</p>
      )}

      {months.length > 0 && (
        <div className="field" style={{ maxWidth: 260 }}>
          <label htmlFor="history-month">Mês</label>
          <select
            id="history-month"
            value={selected ? `${selected.year}-${selected.month}` : ''}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number);
              setSelected({ year: y, month: m });
            }}
          >
            {months.map((m) => (
              <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <p className="hint">Carregando…</p>}

      {report && !loading && (
        <>
          <div className="report-summary">
            <div className="report-stat">
              <span className="hint">Receita da família</span>
              <span className="mono amount-income">R$ {report.totalFamilyIncome.toFixed(2)}</span>
            </div>
            <div className="report-stat">
              <span className="hint">Despesa da família</span>
              <span className="mono amount-expense">R$ {report.totalFamilyExpense.toFixed(2)}</span>
            </div>
            <div className="report-stat">
              <span className="hint">Saldo</span>
              <span className="mono balance">R$ {report.familyBalance.toFixed(2)}</span>
            </div>
          </div>

          <ul className="ledger-list">
            {report.members.map((m) => (
              <li key={m.personId} className="ledger-row">
                <span className="person-name">{m.name}</span>
                <span className="mono amount-income">+ R$ {m.totalIncome.toFixed(2)}</span>
                <span className="mono amount-expense">- R$ {m.totalExpense.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
