import React, { useState, useEffect } from 'react';
import {
  integrationService,
  IntegrationItem,
} from '../../services/integrationService';
import { Link } from 'react-router-dom';

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [connectModalProvider, setConnectModalProvider] = useState<IntegrationItem | null>(null);
  const [accountInput, setAccountInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await integrationService.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error('Failed to load integrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleOpenConnect = (item: IntegrationItem) => {
    setConnectModalProvider(item);
    setAccountInput(
      item.provider === 'google-calendar'
        ? 'student.prep@gmail.com'
        : item.provider === 'notion'
        ? 'Ajeet / Study Workspace'
        : item.provider === 'github'
        ? 'github.com/student-dev'
        : `${item.name} Account`
    );
  };

  const handleConfirmConnect = async () => {
    if (!connectModalProvider) return;
    try {
      setConnectingProvider(connectModalProvider.provider);
      await integrationService.connectIntegration(connectModalProvider.provider, {
        accountName: accountInput,
      });
      setStatusMsg({
        text: `Successfully connected ${connectModalProvider.name}! Authorized study activities will now sync automatically.`,
        type: 'success',
      });
      setConnectModalProvider(null);
      await fetchIntegrations();
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.message || 'Failed to connect integration.',
        type: 'error',
      });
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!window.confirm(`Disconnect ${provider}? External auto-sync will be paused.`)) return;
    try {
      await integrationService.disconnectIntegration(provider);
      setStatusMsg({
        text: `Disconnected ${provider}.`,
        type: 'success',
      });
      await fetchIntegrations();
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.message || 'Failed to disconnect.',
        type: 'error',
      });
    }
  };

  const handleSync = async (provider: string) => {
    try {
      setSyncingProvider(provider);
      const res = await integrationService.syncIntegration(provider);
      setStatusMsg({
        text: res.message || `Synchronized ${provider} successfully!`,
        type: 'success',
      });
      await fetchIntegrations();
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.message || 'Sync failed.',
        type: 'error',
      });
    } finally {
      setSyncingProvider(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold mb-2">
            <span>🔗</span> Connected Services
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Connected Productivity & Learning Apps
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base max-w-3xl">
            StudyGauge supports integration with selected third-party platforms through authorized APIs and OAuth services to unify your calendar, notes, task lists, and revision decks in one place.
          </p>
        </div>

        <Link to="/activity-timeline" className="sg-btn-secondary text-sm">
          📜 View Unified Activity Timeline
        </Link>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-teal-50 text-teal-800 border border-teal-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-xl "></div>
          <p className="text-slate-500 text-sm">Loading integrations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => (
            <div
              key={item.provider}
              className={`bg-white border rounded-xl p-6   flex flex-col justify-between ${
                item.isConnected ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-slate-200 hover:'
              }`}
            >
              <div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                      <span className="text-xs font-semibold text-slate-400">{item.category}</span>
                    </div>
                  </div>

                  <span className={`sg-badge ${item.isConnected ? 'sg-badge-teal' : 'sg-badge-amber'}`}>
                    {item.isConnected ? '● Connected' : '○ Available'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>

                <div className="mb-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Authorized Features
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.capabilities.map((cap, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        ✓ {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {item.isConnected && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 mb-4 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account:</span>
                      <strong className="text-slate-900">{item.accountName || 'Active'}</strong>
                    </div>
                    {item.lastSyncAt && (
                      <div className="flex justify-between mt-1 text-[11px] text-slate-500">
                        <span>Last Synced:</span>
                        <span>{new Date(item.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                {item.isConnected ? (
                  <>
                    <button
                      onClick={() => handleSync(item.provider)}
                      disabled={syncingProvider === item.provider}
                      className="sg-btn-secondary text-xs flex-1 py-2 font-bold disabled:opacity-50"
                    >
                      {syncingProvider === item.provider ? 'Syncing...' : '🔄 Sync Now'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(item.provider)}
                      className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl "
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConnect(item)}
                    className="sg-btn-primary w-full text-xs py-2.5 font-bold"
                  >
                    Connect via {item.authType}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {connectModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md border border-slate-200  overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{connectModalProvider.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Connect {connectModalProvider.name}
                </h3>
                <p className="text-xs text-slate-500">Authorized API & OAuth Integration</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              StudyGauge requests read & sync permissions to aggregate study schedules, notes, and revision tasks. Your credentials and tokens are secured via server-side encryption.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Account Identifier / Email
                </label>
                <input
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Security & Privacy Assurance:</div>
                <div>• Stored securely with JWT & salted tokens</div>
                <div>• No full device or private email access requested</div>
                <div>• Disconnect or revoke anytime with 1 click</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConnectModalProvider(null)}
                className="sg-btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConnect}
                disabled={connectingProvider !== null}
                className="sg-btn-primary text-xs py-2 px-5 disabled:opacity-50"
              >
                {connectingProvider ? 'Authorizing...' : 'Authorize & Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;

