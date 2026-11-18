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
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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
        text: `✓ Successfully connected ${connectModalProvider.name}! Authorized study activities will now sync automatically.`,
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
        text: `✓ ${res.message || `Synchronized ${provider} successfully!`}`,
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

  const handleConnectAllDemo = async () => {
    try {
      setIsBulkProcessing(true);
      const res = await integrationService.connectAllDemo();
      setStatusMsg({
        text: '✓ All 5 external learning apps (Google Calendar, Notion, Todoist, GitHub, Anki) connected and synchronized for presentation!',
        type: 'success',
      });
      if (res.data) setIntegrations(res.data);
      else await fetchIntegrations();
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.message || 'Failed to connect demo integrations.',
        type: 'error',
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsBulkProcessing(true);
      const res = await integrationService.syncAll();
      setStatusMsg({
        text: `✓ ${res.message || 'All connected learning platforms synchronized successfully!'}`,
        type: 'success',
      });
      if (res.data) setIntegrations(res.data);
      else await fetchIntegrations();
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.message || 'Failed to sync all integrations.',
        type: 'error',
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const connectedCount = integrations.filter((i) => i.isConnected).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DCE9E1] text-[#183D35] rounded-[5px] text-xs font-semibold mb-2">
            <span>🔗</span> Connected Services
          </div>
          <h1 className="text-3xl font-extrabold text-[#252B28] tracking-tight">
            Connected Productivity & Learning Apps
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base max-w-3xl">
            StudyGauge integrates with third-party platforms via OAuth and authorized APIs to unify your calendar, notes, task lists, and revision decks in one central hub.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleConnectAllDemo}
            disabled={isBulkProcessing}
            className="sg-btn-primary text-xs sm:text-sm py-2 px-3.5 rounded-[5px] shadow-sm font-bold"
          >
            {isBulkProcessing ? 'Connecting...' : '⚡ Connect All for Presentation'}
          </button>
          {connectedCount > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={isBulkProcessing}
              className="sg-btn-secondary text-xs sm:text-sm py-2 px-3 rounded-[5px] font-bold"
            >
              🔄 Sync All ({connectedCount})
            </button>
          )}
          <Link to="/activity-timeline" className="sg-btn-secondary text-xs sm:text-sm py-2 px-3 rounded-[5px]">
            📜 Activity Timeline
          </Link>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-[5px] flex items-center justify-between text-sm font-semibold shadow-sm ${
            statusMsg.type === 'success'
              ? 'bg-[#DCE9E1] text-[#183D35] border border-[#183D35]/20'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline font-bold">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#DCE9E1] border-t-[#183D35] rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm">Loading integration connections...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => (
            <div
              key={item.provider}
              className={`bg-white border rounded-[5px] p-6 shadow-sm flex flex-col justify-between transition-all ${
                item.isConnected ? 'border-[#183D35]/30 ring-1 ring-[#183D35]/10' : 'border-[#E2DECE] hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 bg-[#FAF8F3] rounded-[5px] border border-[#E2DECE]">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#252B28]">{item.name}</h3>
                      <span className="text-xs font-semibold text-slate-500">{item.category}</span>
                    </div>
                  </div>

                  <span className={`sg-badge ${item.isConnected ? 'sg-badge-teal' : 'sg-badge-amber'}`}>
                    {item.isConnected ? '● Connected' : '○ Available'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>

                <div className="mb-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Authorized Features
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.capabilities.map((cap, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] bg-[#FAF8F3] text-slate-700 px-2 py-0.5 rounded-[4px] border border-[#E2DECE]"
                      >
                        ✓ {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {item.isConnected && (
                  <div className="bg-[#FAF8F3] border border-[#E2DECE] rounded-[5px] p-3 mb-4 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Account:</span>
                      <strong className="text-[#252B28]">{item.accountName || 'Active'}</strong>
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

              <div className="pt-4 border-t border-[#E2DECE] flex items-center gap-2">
                {item.isConnected ? (
                  <>
                    <button
                      onClick={() => handleSync(item.provider)}
                      disabled={syncingProvider === item.provider}
                      className="sg-btn-secondary text-xs flex-1 py-2 font-bold rounded-[4px] disabled:opacity-50"
                    >
                      {syncingProvider === item.provider ? 'Syncing...' : '🔄 Sync Now'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(item.provider)}
                      className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-[4px]"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConnect(item)}
                    className="sg-btn-primary w-full text-xs py-2.5 font-bold rounded-[4px]"
                  >
                    Connect via {item.authType}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {connectModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[5px] w-full max-w-md border border-[#E2DECE] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{connectModalProvider.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-[#252B28]">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Identifier / Email
                </label>
                <input
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2DECE] rounded-[5px] text-sm font-medium text-[#252B28] focus:outline-none focus:border-[#183D35]"
                />
              </div>

              <div className="p-3 bg-[#FAF8F3] border border-[#E2DECE] rounded-[5px] text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-[#252B28]">Security & Privacy Assurance:</div>
                <div>• Stored securely with JWT & salted tokens</div>
                <div>• No full device or private email access requested</div>
                <div>• Disconnect or revoke anytime with 1 click</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConnectModalProvider(null)}
                className="sg-btn-secondary text-xs py-2 px-4 rounded-[4px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConnect}
                disabled={connectingProvider !== null}
                className="sg-btn-primary text-xs py-2 px-5 rounded-[4px] shadow-sm disabled:opacity-50"
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
