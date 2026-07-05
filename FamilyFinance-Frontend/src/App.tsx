import { useState } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';
import ChangePasswordForm from './components/ChangePasswordForm';
import AdminPanel from './components/AdminPanel';
import PeopleManager from './components/PeopleManager';
import TransactionForm from './components/TransactionForm';
import FixedExpensesManager from './components/FixedExpensesManager';
import AuditLogPanel from './components/AuditLogPanel';
import Reports from './components/Reports';
import History from './components/History';
import type { Family, Person } from './types';

type Screen = 'auth' | 'force-change' | 'app' | 'admin';
type Tab = 'people' | 'transactions' | 'fixed' | 'reports' | 'history' | 'log';

const TABS: { id: Tab; label: string }[] = [
  { id: 'people', label: 'Pessoas' },
  { id: 'transactions', label: 'Transações' },
  { id: 'fixed', label: 'Despesas fixas' },
  { id: 'reports', label: 'Totais' },
  { id: 'history', label: 'Histórico' },
  { id: 'log', label: 'Log' },
];

function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [family, setFamily] = useState<Family | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | undefined>(undefined);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<Tab>('people');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleAuthenticated(f: Family, revealed?: string) {
    setFamily(f);
    setRevealedPassword(revealed);
    setScreen(f.mustChangePassword ? 'force-change' : 'app');
  }

  function handleLogout() {
    setFamily(null);
    setPeople([]);
    setRevealedPassword(undefined);
    setScreen('auth');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span className="eyebrow">Family Finance</span>
            <h1>Livro-caixa da família</h1>
          </div>
          <div className="row">
            {screen === 'app' && (
              <button className="btn btn-ghost" onClick={handleLogout}>
                Sair
              </button>
            )}
            {screen === 'auth' && (
              <button className="btn btn-ghost" onClick={() => setScreen('admin')}>
                Área administrativa
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {screen === 'auth' && <AuthScreen onAuthenticated={handleAuthenticated} />}

        {screen === 'force-change' && family && (
          <ChangePasswordForm
            familyId={family.id}
            familyName={family.name}
            revealedPassword={revealedPassword}
            onChanged={() => setScreen('app')}
          />
        )}

        {screen === 'admin' && <AdminPanel onExit={() => setScreen(family ? 'app' : 'auth')} />}

        {screen === 'app' && family && (
          <>
            <div className="panel family-banner">
              <div>
                <span className="eyebrow">Família ativa</span>
                <h2>{family.name}</h2>
              </div>
              {family.city && (
                <span className="hint" style={{ margin: 0 }}>
                  {family.city} · usuário <span className="mono">{family.username}</span>
                </span>
              )}
            </div>

            <nav className="tab-bar">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {tab === 'people' && (
              <PeopleManager familyId={family.id} onPeopleChanged={setPeople} />
            )}

            {tab === 'transactions' && (
              <TransactionForm people={people} onCreated={() => setRefreshKey((k) => k + 1)} />
            )}

            {tab === 'fixed' && (
              <FixedExpensesManager
                familyId={family.id}
                people={people}
                onChanged={() => setRefreshKey((k) => k + 1)}
              />
            )}

            {tab === 'reports' && (
              <Reports familyId={family.id} people={people} refreshKey={refreshKey} />
            )}

            {tab === 'history' && <History familyId={family.id} />}

            {tab === 'log' && <AuditLogPanel familyId={family.id} refreshKey={refreshKey} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
