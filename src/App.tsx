import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Settings, 
  ShieldCheck, 
  Award, 
  Terminal,
  ChevronRight,
  LogOut,
  Zap,
  Clock,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  X,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

// Mock Auth State (Since real Auth0 requires redirect flow which is hard in iframe)
// In a real app, we'd use @auth0/auth0-react
const MOCK_USER = {
  sub: "auth0|mock_user_123",
  email: "contributor@meechain.io",
  name: "MeeChain Contributor",
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=MeeChain"
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [rpcResult, setRpcResult] = useState<any>(null);
  const [rpcMethod, setRpcMethod] = useState('eth_blockNumber');
  const [rpcParams, setRpcParams] = useState('[]');
  const [isCustomRpc, setIsCustomRpc] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaReason, setQuotaReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<any>({
    rpc_access_enabled: true,
    badge_awards_enabled: true,
    contributor_list_visible: true,
    market_insights_enabled: true
  });

  useEffect(() => {
    fetchStats();
    fetchBadges();
    fetchFeatureFlags();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (rpcResult) {
      Prism.highlightAll();
    }
  }, [rpcResult]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs/my');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        // Fallback for demo if backend fails or no auth
        setLogs([
          { id: 1, details: { method: 'eth_blockNumber' }, timestamp: new Date().toISOString() },
          { id: 2, details: { method: 'eth_gasPrice' }, timestamp: new Date(Date.now() - 3600000).toISOString() },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const res = await fetch('/api/feature-flags');
      if (res.ok) {
        const data = await res.json();
        setFeatureFlags(data);
        if (data.market_insights_enabled) {
          fetchInsights();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFeatureFlag = async (name: string) => {
    const newValue = !featureFlags[name];
    setFeatureFlags({ ...featureFlags, [name]: newValue });
    try {
      await fetch('/api/feature-flags/toggle', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, enabled: newValue })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market-insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      } else {
        setError("Failed to fetch insights. Feature might be disabled.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights' && !insights) {
      fetchInsights();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Fallback for demo
        setStats({
          total_users: 12,
          total_rpc_calls: 1450,
          my_calls: 42,
          quota_limit: 100
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/badges');
      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      } else {
        setBadges(['Auth0 Master', 'MeeChain Explorer']);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRpcTest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    let parsedParams = [];
    try {
      parsedParams = JSON.parse(rpcParams);
      if (!Array.isArray(parsedParams)) {
        throw new Error("Parameters must be a JSON array (e.g. [\"0x123\", true])");
      }
    } catch (err: any) {
      setError(`Invalid Parameters: ${err.message}`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: rpcMethod, params: parsedParams })
      });
      
      if (res.ok) {
        const data = await res.json();
        setRpcResult(data);
        setSuccess(`Successfully executed ${rpcMethod}`);
        fetchLogs();
        fetchStats();
      } else {
        const errData = await res.json();
        setError(errData.error || "RPC Call Failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuotaRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess("Quota increase request submitted successfully! Our team will review it shortly.");
    setIsQuotaModalOpen(false);
    setQuotaReason('');
    setRequestSubmitting(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="My RPC Calls" 
          value={stats?.my_calls || 0} 
          subtitle={`Quota: ${stats?.my_calls || 0}/${stats?.quota_limit || 100}`}
          icon={<Activity className="text-emerald-500" />}
          progress={(stats?.my_calls / (stats?.quota_limit || 100)) * 100}
        />
        <StatCard 
          title="Network Users" 
          value={stats?.total_users || 0} 
          subtitle="Active Contributors"
          icon={<Users className="text-blue-500" />}
        />
        <StatCard 
          title="Total Network Calls" 
          value={stats?.total_rpc_calls || 0} 
          subtitle="All-time processed"
          icon={<Zap className="text-amber-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {featureFlags.market_insights_enabled && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Market Pulse
              </h3>
              <button 
                onClick={() => setActiveTab('insights')}
                className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1"
              >
                View Full Report <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {loading && !insights ? (
              <div className="animate-pulse flex space-y-4">
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                </div>
              </div>
            ) : insights ? (
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {insights.text}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                Market insights are being generated. Click "View Full Report" to see the latest trends.
              </p>
            )}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Auth Status
            </h3>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              VALID
            </span>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl font-mono text-xs break-all">
              <p className="text-slate-500 mb-1 uppercase tracking-wider">Subject (sub)</p>
              <p className="text-slate-900">{MOCK_USER.sub}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl font-mono text-xs break-all">
              <p className="text-slate-500 mb-1 uppercase tracking-wider">Audience (aud)</p>
              <p className="text-slate-900">https://meechain.au.auth0.com/api/v2/</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl font-mono text-xs break-all">
              <p className="text-slate-500 mb-1 uppercase tracking-wider">Scopes</p>
              <p className="text-slate-900">read:rpc write:badges profile email</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-amber-500" />
            My Badges
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge) => (
              <div key={badge} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-sm font-medium text-amber-900">{badge}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 border-dashed opacity-50">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-500">RPC Ranger (Locked)</span>
            </div>
          </div>
          <button 
            onClick={handleRpcTest}
            disabled={loading || !featureFlags.badge_awards_enabled}
            className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {featureFlags.badge_awards_enabled ? 'Check for new badges' : 'Badge Awards Disabled'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-slate-500" />
          Recent RPC Calls
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-bottom border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {log.details.method}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                      Success
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm italic">
                    No recent RPC activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRpc = () => (
    <div className="space-y-6">
      {/* Quota Feedback Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Personal RPC Quota</h4>
                <p className="text-xs text-slate-500">Usage for the current period</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-slate-900">{stats?.my_calls || 0}</span>
              <span className="text-slate-400 text-sm"> / {stats?.quota_limit || 100}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-500 ${
                (stats?.my_calls / (stats?.quota_limit || 100)) > 0.9 ? 'bg-red-500' : 
                (stats?.my_calls / (stats?.quota_limit || 100)) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((stats?.my_calls / (stats?.quota_limit || 100)) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {Math.round((stats?.my_calls / (stats?.quota_limit || 100)) * 100)}% Consumed
            </p>
            {stats?.my_calls >= stats?.quota_limit && (
              <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> LIMIT REACHED
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsQuotaModalOpen(true)}
            className="mt-6 w-full py-2 border border-indigo-100 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-3 h-3" /> Request Quota Increase
          </button>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-md text-white border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Network Configuration</h4>
              <p className="text-xs text-slate-400">MeeChain Mainnet</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Chain ID</p>
              <p className="text-sm font-mono text-indigo-300">13390 (0x344e)</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Currency</p>
              <p className="text-sm font-mono text-emerald-400">MEC</p>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">RPC Endpoint</p>
            <p className="text-xs font-mono text-slate-300 truncate">https://rpc.meechain.run.place</p>
          </div>
        </div>
      </div>

      {!featureFlags.rpc_access_enabled && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">RPC Proxy is currently disabled for maintenance.</p>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${!featureFlags.rpc_access_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-500" />
                RPC Tester
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setIsCustomRpc(false)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${!isCustomRpc ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Presets
                </button>
                <button 
                  onClick={() => setIsCustomRpc(true)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${isCustomRpc ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Custom
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isCustomRpc ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Method Name</label>
                    <input 
                      type="text"
                      value={rpcMethod}
                      onChange={(e) => setRpcMethod(e.target.value)}
                      placeholder="e.g. eth_getBalance"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Parameters (JSON Array)</label>
                    <textarea 
                      value={rpcParams}
                      onChange={(e) => setRpcParams(e.target.value)}
                      placeholder='e.g. ["0x...", "latest"]'
                      rows={3}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono resize-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Preset</label>
                  <select 
                    value={rpcMethod}
                    onChange={(e) => {
                      setRpcMethod(e.target.value);
                      setRpcParams('[]');
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="eth_blockNumber">eth_blockNumber - Get current block</option>
                    <option value="eth_gasPrice">eth_gasPrice - Current network gas</option>
                    <option value="eth_getBalance">eth_getBalance - Check account balance</option>
                  </select>
                </div>
              )}
              <p className="mt-2 text-[10px] text-slate-400 italic">
                Each execution consumes 1 unit from your personal quota.
              </p>
              <button 
                onClick={handleRpcTest}
                disabled={loading || (stats?.my_calls >= stats?.quota_limit)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                {stats?.my_calls >= stats?.quota_limit ? 'Quota Exceeded' : 'Execute RPC Call'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {rpcResult ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 p-6 rounded-2xl shadow-lg h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h4 className="text-slate-400 text-sm font-mono">Live Response</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(rpcResult, null, 2));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-mono transition-colors border border-slate-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <span className="text-emerald-400 text-xs font-mono px-2 py-1 bg-emerald-400/10 rounded">200 OK</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto max-h-[300px] custom-scrollbar">
                <pre className="language-json !bg-transparent !p-0 !m-0">
                  <code className="language-json">
                    {JSON.stringify(rpcResult, null, 2)}
                  </code>
                </pre>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">MeeChain Mainnet (Chain ID: 13390)</p>
                <button 
                  onClick={() => setRpcResult(null)}
                  className="text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Clear Output
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Terminal className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-slate-900 font-semibold mb-2">No Active Response</h4>
              <p className="text-slate-500 text-sm max-w-xs">
                Select an RPC method and click execute to see the live network response data here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            RPC Usage History
          </h3>
          <button 
            onClick={fetchLogs}
            className="text-xs text-indigo-600 font-semibold hover:underline"
          >
            Refresh Logs
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-bottom border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {log.details.method}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                      Success
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm italic">
                    No recent RPC activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderQuotaModal = () => (
    <AnimatePresence>
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Request Quota Increase
              </h3>
              <button 
                onClick={() => setIsQuotaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleQuotaRequest} className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Current Quota: <strong>{stats?.quota_limit || 100} calls/period</strong>. 
                  Requests are typically reviewed within 24 hours.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Increase</label>
                <textarea 
                  required
                  value={quotaReason}
                  onChange={(e) => setQuotaReason(e.target.value)}
                  placeholder="Tell us why you need more RPC calls (e.g., developing a new dApp, running a node monitor...)"
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={requestSubmitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {requestSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MeeChain</h1>
          </div>

          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Overview"
            />
            <NavItem 
              active={activeTab === 'rpc'} 
              onClick={() => setActiveTab('rpc')}
              icon={<Terminal className="w-5 h-5" />}
              label="RPC Proxy"
            />
            {featureFlags.market_insights_enabled && (
              <NavItem 
                active={activeTab === 'insights'} 
                onClick={() => setActiveTab('insights')}
                icon={<TrendingUp className="w-5 h-5" />}
                label="Market Insights"
              />
            )}
            <NavItem 
              active={activeTab === 'contributors'} 
              onClick={() => setActiveTab('contributors')}
              icon={<Users className="w-5 h-5" />}
              label="Contributors"
            />
            <NavItem 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <img src={MOCK_USER.picture} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-100" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{MOCK_USER.name}</p>
              <p className="text-xs text-slate-500 truncate">{MOCK_USER.email}</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
            <p className="text-slate-500">Welcome back to MeeChain Contributor Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              Last active: Just now
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'rpc' && renderRpc()}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Network & Market Insights
                    </h3>
                    <button 
                      onClick={fetchInsights}
                      disabled={loading}
                      className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      <Clock className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                      <p>Consulting Gemini for the latest network trends...</p>
                    </div>
                  ) : insights ? (
                    <div className="prose prose-slate max-w-none">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {insights.text}
                      </div>
                      
                      {insights.sources && insights.sources.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Sources & References
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {insights.sources.map((source: any, idx: number) => (
                              <a 
                                key={idx} 
                                href={source.web?.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                {source.web?.title || `Source ${idx + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 italic">
                      No insights available. Click refresh to fetch.
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'contributors' && (
              featureFlags.contributor_list_visible ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-bottom border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contributor</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Badges</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">RPC Calls</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <ContributorRow name="Alice" badges={['Auth0 Master', 'JWT Guardian']} calls={120} status="Active" />
                      <ContributorRow name="Bob" badges={['MeeChain Explorer']} calls={45} status="Active" />
                      <ContributorRow name="Carol" badges={['Onboarding Hero']} calls={12} status="Idle" />
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900">Contributor List Hidden</h3>
                  <p className="text-slate-500">This feature is currently disabled via feature flag.</p>
                </div>
              )
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-bold text-indigo-900">Admin Control Center</h3>
                  </div>
                  <p className="text-sm text-indigo-700">
                    Manage network-wide features, contributor access, and system quotas. Changes take effect immediately for all users.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                      <Settings className="w-5 h-5 text-slate-500" />
                      Feature Rollouts
                    </h3>
                    <div className="space-y-4">
                      <FeatureToggle 
                        label="RPC Access" 
                        description="Enable/disable the RPC Proxy tester globally"
                        enabled={featureFlags.rpc_access_enabled}
                        onToggle={() => toggleFeatureFlag('rpc_access_enabled')}
                      />
                      <FeatureToggle 
                        label="Badge Awards" 
                        description="Enable/disable automatic badge checking and awarding"
                        enabled={featureFlags.badge_awards_enabled}
                        onToggle={() => toggleFeatureFlag('badge_awards_enabled')}
                      />
                      <FeatureToggle 
                        label="Contributor List" 
                        description="Show/hide the global contributor leaderboard"
                        enabled={featureFlags.contributor_list_visible}
                        onToggle={() => toggleFeatureFlag('contributor_list_visible')}
                      />
                      <FeatureToggle 
                        label="Market Insights" 
                        description="Enable AI-powered network trends (A/B Test)"
                        enabled={featureFlags.market_insights_enabled}
                        onToggle={() => toggleFeatureFlag('market_insights_enabled')}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Quota Management
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Global Default Quota</h4>
                        <p className="text-xs text-slate-500 mb-4">Initial RPC calls allowed for new contributors</p>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input 
                              type="number" 
                              value={stats?.quota_limit || 100} 
                              onChange={(e) => setStats({...stats, quota_limit: parseInt(e.target.value)})}
                              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                            />
                            <Activity className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          </div>
                          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                            Update
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-slate-100 rounded-xl">
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Quota Reset Policy</h4>
                        <p className="text-xs text-slate-500 mb-3">Quotas are currently set to persist indefinitely.</p>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase hover:bg-slate-200">Reset All Users</button>
                          <button className="flex-1 py-2 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase hover:bg-slate-200">Set Monthly Reset</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      {renderQuotaModal()}
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
      {active && <ChevronRight className="ml-auto w-4 h-4" />}
    </button>
  );
}

function StatCard({ title, value, subtitle, icon, progress }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ContributorRow({ name, badges, calls, status }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
            {name[0]}
          </div>
          <span className="text-sm font-medium text-slate-900">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-1">
          {badges.map((b: string) => (
            <span key={b} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">
              {b.split(' ')[0]}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{calls}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
          status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function FeatureToggle({ label, description, enabled, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
