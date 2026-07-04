import React, { useState, useEffect } from 'react';
import { SystemLog } from '../types';
import { Shield, Activity, RefreshCw, Database, Radio, Clock, AlertTriangle, Check, Zap, BarChart3, Globe, LayoutDashboard, X, TrendingUp, ShieldCheck, Wifi, Cpu
} from 'lucide-react';
import { fetchLiveLogs, initLiveWebSocket } from '../lib/api'; interface AdminPanelProps { currentTenant: string; onTenantChange: (tenant: 'heating' | 'screed' | 'electrical' | 'all') => void;
} export default function AdminPanel({ currentTenant, onTenantChange }: AdminPanelProps) { const [logs, setLogs] = useState<SystemLog[]>([]); const [loading, setLoading] = useState(true); const [activeTab, setActiveTab] = useState<'n8n' | 'system'>('n8n'); const [isRefreshing, setIsRefreshing] = useState(false); const loadData = async () => { try { const loadedLogs = await fetchLiveLogs(); setLogs(loadedLogs);
    } catch (err) { console.error("Failed to load system logs:", err);
    } finally { setLoading(false);
    }
  };
  useEffect(() => { loadData(); const ws = initLiveWebSocket((message) => { if (message.type === "LOG_CREATED") loadData();
    }); return () => ws.close();
  }, []); const triggerLogsRefresh = () => { setIsRefreshing(true); loadData().finally(() => setTimeout(() => setIsRefreshing(false), 500));
  };
  const successCount = logs.filter(l => l.status === 'success').length; const warningCount = logs.filter(l => l.status === 'warning').length; const errorCount = logs.filter(l => l.status === 'error').length; const activeStyles = { all: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30', heating: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30', screed: 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30', electrical: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30',
  };
  const activeStyle = activeStyles[currentTenant as keyof typeof activeStyles] || activeStyles.all; return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header - Premium Dark Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 via-slate-50 dark:via-slate-800 to-white dark:to-slate-900 p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 /50">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-2 ring-white/10">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Control Panel</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">System monitoring, audit logs & integration health</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 rounded-2xl backdrop-blur-sm">
            {[
              { value: 'all', label: 'Central', icon: '🏢' },
              { value: 'heating', label: 'Heating', icon: '🔥' },
              { value: 'screed', label: 'Screed', icon: '🌍' },
              { value: 'electrical', label: 'Electrical', icon: '⚡' },
            ].map(opt => (
              <button key={opt.value} onClick={() => onTenantChange(opt.value as any)} className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${ currentTenant === opt.value ? activeStyle : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 '
                }`}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Premium KPI Cards - 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-5 hover:border-slate-300 /50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wifi className="w-5 h-5 text-slate-900 dark:text-white " />
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/40" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">n8n Stream</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white ">Online</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">Webhooks sync active</div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-5 hover:border-slate-300 /50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-5 h-5 text-slate-900 dark:text-white " />
            </div>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Total Logs</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white ">{logs.length}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">
            <span className="text-emerald-400">{successCount}</span> · <span className="text-amber-400">{warningCount}</span> · <span className="text-rose-400">{errorCount}</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-5 hover:border-slate-300 /50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Cpu className="w-5 h-5 text-slate-900 dark:text-white " />
            </div>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">System Status</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">Operational</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">All services running</div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-5 hover:border-slate-300 /50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <TrendingUp className="w-5 h-5 text-slate-900 dark:text-white " />
            </div>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Uptime SLA</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white ">99.97%</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">Last 30 days avg</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 /50 w-fit">
        {[
          { id: 'n8n', label: 'Integration Pipeline', icon: Radio },
          { id: 'system', label: 'System Health', icon: Activity },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${ activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 '
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* n8n Tab */}
      {activeTab === 'n8n' && (
        <div className="rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white ">Webhook Event Stream</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Real-time audit logs from all integrated services</p>
            </div>
            <button onClick={triggerLogsRefresh} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 /50 disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-600 dark:text-slate-300 ">
                  <Database className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No system logs recorded yet</p>
                </div>
              )}
              {logs.map(log => (
                <div key={log.id} className="group rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30 p-4 hover:border-slate-300 /50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${ log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : log.status === 'warning' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                    }`}>
                      {log.status === 'success' ? <Check className="w-4 h-4" /> : log.status === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                       <X className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">{log.service}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${ log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : log.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>{log.status}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white ">{log.event}</h4>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{log.timestamp}</span>
                        <span>{log.payloadSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-400" /> Service Status
            </h3>
            <div className="space-y-3">
              {[
                { name: 'WebSocket Gateway', uptime: '99.98%' },
                { name: 'Database Engine', uptime: '99.99%' },
                { name: 'AI Gemini Pipeline', uptime: '99.95%' },
                { name: 'n8n Webhook Integration', uptime: '99.97%' },
                { name: 'Authentication Service', uptime: '100%' },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30 hover:border-slate-300 /50 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="relative flex w-2.5 h-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30" />
                      <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-400" />
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white ">{svc.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">{svc.uptime}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-amber-400" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <ActionButton icon={RefreshCw} label="Refresh System Cache" desc="Clear and rebuild application cache" action="Run" color="indigo" />
              <ActionButton icon={Globe} label="Export Audit Report" desc="Download system logs as CSV report" action="Export" color="emerald" />
              <ActionButton icon={LayoutDashboard} label="Reset Dashboard Defaults" desc="Restore factory default settings" action="Reset" color="amber" />
              <ActionButton icon={ShieldCheck} label="Run Security Scan" desc="Verify system integrity & permissions" action="Scan" color="purple" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  function ActionButton({ icon: Icon, label, desc, action, color }: { icon: any; label: string; desc: string; action: string; color: string }) { const colorMap: Record<string, { bg: string; text: string; badge: string }> = { indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400' }, emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400' }, amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400' }, purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400' },
  };
  const c = colorMap[color] || colorMap.indigo; return (
    <button className="group w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30 hover:border-slate-300 /50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-200 text-left">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-slate-900 dark:hover:text-white transition-colors">{label}</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">{desc}</div>
        </div>
      </div>
      <span className={`text-[10px] font-bold ${c.text} opacity-0 group-hover:opacity-100 transition-all ${c.bg} px-3 py-1.5 rounded-lg`}>
        {action} →
      </span>
    </button>
  );
}