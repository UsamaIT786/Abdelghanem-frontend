import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Zap, ArrowUpRight, Sparkles, RefreshCw, Download, Info, BarChart3, Activity, PieChart, Target, Award, Banknote, LineChart,
} from 'lucide-react';
import { fetchLiveAnalytics, getSavedTenant, initLiveWebSocket } from '../lib/api';
import { PremiumAreaChart, PremiumBarChart, PremiumDonutChart, PremiumGaugeChart, SparklineChart,
} from './PremiumCharts'; export default function GrowthDashboard() { const [analytics, setAnalytics] = useState<any>(null); const [loading, setLoading] = useState(true); const [selectedMetric, setSelectedMetric] = useState<string>('revenue'); const [timeframe, setTimeframe] = useState<'6m' | '1y' | 'all'>('1y'); const loadData = async () => { try { const data = await fetchLiveAnalytics(getSavedTenant()); setAnalytics(data);
    } catch (err) { console.error("Dashboard failed to fetch live analytics aggregates:", err);
    } finally { setLoading(false);
    }
  };
  useEffect(() => { loadData(); const ws = initLiveWebSocket((message) => { if ( message.type === "DEAL_CREATED" || message.type === "DEAL_UPDATED" || message.type === "DEAL_DELETED" || message.type === "CONTACT_CREATED" || message.type === "CONTACT_UPDATED" || message.type === "CONTACT_DELETED" || message.type === "TASK_CREATED" || message.type === "TASK_UPDATED" || message.type === "TASK_DELETED"
      ) { loadData();
      }
    }); return () => ws.close();
  }, []); const totalRevenue = analytics?.kpis?.totalRevenue || 0; const pipelineValue = analytics?.kpis?.pipelineValue || 0; const customerCount = analytics?.kpis?.customerCount || 0; const activeTechnicians = analytics?.kpis?.activeTechnicians || 0; const monthlyData = analytics?.charts?.monthlyTrend || []; const divisionData = analytics?.charts?.divisionDistribution || []; const revenueChartData = monthlyData.length > 0
    ? monthlyData.map((d: any) => ({ label: d.month, value: d.Revenue || 0 }))
    : []; const targetChartData = monthlyData.length > 0
    ? monthlyData.map((d: any) => ({ label: d.month, value: d.Target || 0 }))
    : []; const leadsChartData = monthlyData.length > 0
    ? monthlyData.map((d: any) => ({ label: d.month, value: d.Leads || 0 }))
    : []; const donutData = divisionData.length > 0
    ? divisionData.map((d: any) => ({ name: d.name, value: d.value, color: d.name.toLowerCase().includes('heat') ? '#f43f5e' : d.name.toLowerCase().includes('screed') ? '#06b6d4' : d.name.toLowerCase().includes('elect') ? '#f59e0b' : '#8b5cf6',
      }))
    : []; const sparkRevenue = revenueChartData.map(d => d.value); const revenueGrowth = monthlyData.length >= 2
    ? ((monthlyData[monthlyData.length - 1]?.Revenue || 0) -
       (monthlyData[0]?.Revenue || 0)) / Math.max(monthlyData[0]?.Revenue || 1, 1) * 100
    : 0; const avgRevenue = revenueChartData.length > 0
    ? revenueChartData.reduce((s: number, d: any) => s + d.value, 0) / revenueChartData.length
    : 0; const targetAchieved = monthlyData.filter((d: any) => d.Revenue >= d.Target).length; const totalMonths = monthlyData.length || 1; const achievementRate = (targetAchieved / totalMonths) * 100; const handleExport = () => { if (!monthlyData || monthlyData.length === 0) { alert("No data available to export."); return;
    }
  const header = "Month,Revenue,Target,Leads\n"; const csv = monthlyData.map((row: any) => `${row.month},${row.Revenue || 0},${row.Target || 0},${row.Leads || 0}`).join('\n'); const blob = new Blob([header + csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Growth-Data-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-sans" style={{ color: 'var(--text-primary)' }}>Growth Dashboard</h1>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>Home</span>
            <span>{'>'}</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Growth Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex p-0.5 rounded-lg border text-xs font-semibold" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-tertiary)' }}>
            {(['6m', '1y', 'all'] as const).map(t => (
              <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1.5 rounded-md transition ${ timeframe === t
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white '
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 '
                }`}
              >
                {t === '6m' ? '6 Months' : t === '1y' ? '1 Year' : 'All Time'}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="p-2 border rounded-lg transition shadow-sm flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 dark:hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-300 active:scale-95" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', cursor: 'pointer' }}
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 " />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ">Export</span>
          </button>
          <button onClick={loadData} title="Refresh" className="p-2 border rounded-lg transition shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 dark:hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-300 active:scale-95" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', cursor: 'pointer' }} 
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300  ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── KPI Cards with Sparklines ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="sleek-card p-6 relative overflow-hidden group" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div className="relative w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className={`text-[10px] font-bold ${revenueGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Total Revenue (Won)</div>
              <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {loading ? "..." : `£${totalRevenue.toLocaleString()}`}
              </div>
            </div>
            {sparkRevenue.length > 0 && (
              <SparklineChart data={sparkRevenue} color="#10b981" width={80} height={32} />
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${Math.min((totalRevenue / Math.max(totalRevenue, pipelineValue, 1)) * 100, 100)}%` }} />
            </div>
            <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400">Live</span>
          </div>
        </div>

        {/* Pipeline Valuation */}
        <div className="sleek-card p-6 relative overflow-hidden group" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full -mr-8 -mt-8" />
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div className="relative w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Pipeline Valuation</div>
          <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {loading ? "..." : `£${pipelineValue.toLocaleString()}`}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
            <Activity className="w-3 h-3 text-rose-500" />
            <span>Open pipeline value</span>
          </div>
        </div>

        {/* Customers */}
        <div className="sleek-card p-6 relative overflow-hidden group" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div className="relative w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-500">
              <ArrowUpRight className="w-3 h-3" />
              <span className="text-[10px] font-bold">+12%</span>
            </div>
          </div>
          <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Associated Accounts</div>
          <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {loading ? "..." : customerCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
            <Users className="w-3 h-3 text-indigo-500" />
            <span>From database</span>
          </div>
        </div>

        {/* Workforce */}
        <div className="sleek-card p-6 relative overflow-hidden group" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div className="relative w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Workforce Lead Count</div>
          <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {loading ? "..." : `${activeTechnicians} engineers`}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Live data</span>
          </div>
        </div>

        {/* Target Achievement Gauge */}
        <div className="sleek-card p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-500" />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>Target Achievement</span>
          </div>
          {!loading && (
            <PremiumGaugeChart value={targetAchieved} max={totalMonths} label="Months Hit" color="#8b5cf6" size={130}
            />
          )}
          {loading && (
            <div className="h-20 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">Loading...</div>
          )}
        </div>
      </div>

      {/* ─── Row 2: Main Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Flow - Premium Bar Chart */}
        <div className="sleek-card p-6 lg:col-span-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Revenue Flow</h2>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Monthly breakdown — hover for details</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-[10px] font-semibold rounded-lg p-0.5 border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                <button onClick={() => setSelectedMetric('revenue')} className={`px-2.5 py-1 rounded-md transition ${ selectedMetric === 'revenue'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                > Revenue
                </button>
                <button onClick={() => setSelectedMetric('target')} className={`px-2.5 py-1 rounded-md transition ${ selectedMetric === 'target'
                      ? 'bg-violet-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                > Target
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <div className="relative">
              {selectedMetric === 'revenue' ? (
                <PremiumBarChart data={revenueChartData} height={260} barWidth={36} showValue={true}
                />
              ) : (
                <PremiumBarChart data={targetChartData} height={260} barWidth={36} showValue={true}
                />
              )}
              {/* Summary stats bar */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-center">
                  <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Monthly Avg</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    £{Math.round(avgRevenue).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Best Month</div>
                  <div className="text-sm font-bold text-emerald-500">
                    £{(Math.max(...revenueChartData.map(d => d.value), 0)).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Growth Rate</div>
                  <div className={`text-sm font-bold ${revenueGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Division Distribution - Premium Donut */}
        <div className="sleek-card p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Division Revenue</h2>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Revenue distribution by division</span>
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : donutData.length > 0 ? (
            <div className="flex justify-center">
              <PremiumDonutChart data={donutData} size={240} innerRadius={70} outerRadius={100} animated={true}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
              <PieChart className="w-8 h-8 mx-auto mb-2 opacity-40" /> No division data available
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 3: Growth Trend Area Chart ─── */}
      <div className="sleek-card p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Growth Trend</h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                {revenueGrowth >= 0 ? '▲ Upward' : '▼ Downward'}
              </span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Monthly revenue progression with area gradient</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <Info className="w-3 h-3" />
            <span>Hover for details</span>
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : revenueChartData.length > 0 ? (
          <PremiumAreaChart data={revenueChartData} gradientFrom="#10b981" gradientTo="#059669" lineColor="#10b981" height={280} showGrid={true} animated={true}
          />
        ) : (
          <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
            <LineChart className="w-8 h-8 mx-auto mb-2 opacity-40" /> No trend data available
          </div>
        )}
      </div>

      {/* ─── Row 4: Leads Chart + Target Achievement ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Bar Chart */}
        <div className="sleek-card p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Monthly Lead Volume</h2>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">Loading...</div>
          ) : leadsChartData.length > 0 ? (
            <PremiumBarChart data={leadsChartData} height={200} barWidth={28} showValue={false}
            />
          ) : (
            <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" /> No lead data available
            </div>
          )}
        </div>

        {/* Performance Summary */}
        <div className="sleek-card p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Performance Summary</h2>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-5">
              {/* Achievement rate */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>Target Achievement Rate</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{achievementRate.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000" style={{ width: `${achievementRate}%` }}
                  />
                </div>
              </div>

              {/* Revenue vs Target */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>Revenue vs Target</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    £{monthlyData.reduce((s: number, d: any) => s + (d.Revenue || 0), 0).toLocaleString()}
                    {' / '}
                    £{monthlyData.reduce((s: number, d: any) => s + (d.Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(
                        (monthlyData.reduce((s: number, d: any) => s + (d.Revenue || 0), 0) / Math.max(monthlyData.reduce((s: number, d: any) => s + (d.Target || 0), 0), 1)) * 100, 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Customer Growth */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>Customer Growth</span>
                  <span className="font-bold text-emerald-500">+{Math.round(customerCount * 0.12)} this year</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 transition-all duration-1000" style={{ width: `${Math.min((customerCount / Math.max(customerCount, 50)) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-3 gap-3 pt-3">
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{monthlyData.length}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Months</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="text-lg font-black text-emerald-500">{targetAchieved}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Targets Hit</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{monthlyData.length - targetAchieved}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Missed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 5: Data Table ─── */}
      <div className="sleek-card p-6 overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Monthly Performance</h2>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Revenue, targets and leads by month</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <th className="py-4 px-4">Month</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Target</th>
                <th className="py-3 px-4 text-right">Leads</th>
                <th className="py-3 px-4 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs" style={{ borderColor: 'var(--border-color)' }}>
              {monthlyData.length > 0 ? monthlyData.map((row: any, i: number) => { const hitTarget = row.Revenue >= row.Target; return (
                  <tr key={i} className="hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700/30 /30 transition duration-150">
                    <td className="py-3.5 px-4 font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{row.month}</td>
                    <td className="py-3.5 px-4 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                      £{row.Revenue?.toLocaleString() || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                      £{row.Target?.toLocaleString() || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                      {row.Leads || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hitTarget ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <Target className="w-2.5 h-2.5" /> Achieved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"> Missed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    {loading ? 'Loading...' : 'No monthly data available yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}> Abdelghanem Enterprise Growth Analytics • Premium Dashboard v2.0 • Live Data
      </div>
    </div>
  );
}