import { useEffect, useState } from 'react';
import { auditLogApi, extractErrorMessage } from '../api';
import type { AuditLog } from '../types';

interface Props {
  familyId: string;
  refreshKey?: number;
}

const ACTION_LABELS: Record<string, string> = {
  FixedExpensePaidAndDeleted: 'Despesa fixa quitada e apagada',
  FixedExpenseDeleted: 'Despesa fixa apagada',
  FixedExpenseCreated: 'Despesa fixa criada',
  PersonDeleted: 'Pessoa removida',
};

export default function AuditLogPanel({ familyId, refreshKey }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    auditLogApi
      .listByFamily(familyId)
      .then(setLogs)
      .catch((err) => setError(extractErrorMessage(err)));
  }, [familyId, refreshKey]);

  return (
    <div className="panel">
      <span className="eyebrow">Auditoria</span>
      <h2>Log do principal da família</h2>
      <p className="hint">
        Sempre que uma despesa fixa quitada é apagada, fica um registro aqui em nome de quem é o
        principal/moderador no momento da ação.
      </p>

      {error && <p className="error-text">{error}</p>}

      <ul className="ledger-list">
        {logs.length === 0 && <li className="empty-row">Nenhum registro ainda.</li>}
        {logs.map((l) => (
          <li key={l.id} className="ledger-row log-row">
            <div className="ledger-row-main">
              <span className="person-name">
                {l.principalName}
                <span className="badge badge-muted">{ACTION_LABELS[l.action] ?? l.action}</span>
              </span>
              <span className="hint">{new Date(l.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            <p className="log-desc">{l.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
