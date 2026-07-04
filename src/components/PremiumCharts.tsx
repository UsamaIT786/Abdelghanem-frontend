import React, { useState, useEffect, useRef } from 'react';

// ──────────────────── P R E M I U M A R E A C H A R T ────────────────────
interface AreaChartProps { data: { label: string; value: number }[]; gradientFrom?: string; gradientTo?: string; lineColor?: string; height?: number; showGrid?: boolean; animated?: boolean;
} export function PremiumAreaChart({ data, gradientFrom = '#f43f5e', gradientTo = '#ec4899', lineColor = '#f43f5e', height = 280, showGrid = true, animated = true,
}: AreaChartProps) { const [hoveredIdx, setHoveredIdx] = useState<number | null>(null); const [animateTo, setAnimateTo] = useState(animated ? 0 : 1); const [progress, setProgress] = useState(0); const animRef = useRef<number>(0); useEffect(() => { if (!animated) { setProgress(1); setAnimateTo(1); return; }
  let start: number | null = null; const duration = 1200; const step = (ts: number) => { if (!start) start = ts; const elapsed = ts - start; const p = Math.min(elapsed / duration, 1);
      // ease-out cubic
  const ease = 1 - Math.pow(1 - p, 3); setProgress(ease); if (p < 1) animRef.current = requestAnimationFrame(step);
    }; animRef.current = requestAnimationFrame(step); return () => cancelAnimationFrame(animRef.current);
  }, [animated]); if (!data.length) { return <div className="flex items-center justify-center h-40 text-xs text-slate-500 dark:text-slate-400">No data</div>;
  }
  const w = 1000; const h = height; const padX = 50; const padY = 40; const maxVal = Math.max(...data.map(d => d.value), 1); const scale = ((h - padY * 2) / maxVal) * progress; const pts = data.map((d, i) => { const x = padX + (i * (w - padX * 2)) / Math.max(data.length - 1, 1); const y = h - padY - d.value * scale; return { x, y, ...d };
  });

  // Smooth bezier path
  let pathD = ''; if (pts.length > 0) { pathD = `M ${pts[0].x} ${pts[0].y}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i]; const p1 = pts[i + 1]; const cpX1 = p0.x + (p1.x - p0.x) / 3; const cpX2 = p0.x + ((p1.x - p0.x) / 3) * 2; pathD += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }
  const fillD = pts.length > 0
    ? `${pathD} L ${pts[pts.length - 1].x} ${h - padY} L ${pts[0].x} ${h - padY} Z`
    : '';

  // Y-axis labels
  const yTicks = 4; const yLabels = Array.from({ length: yTicks }, (_, i) => Math.round((maxVal / (yTicks - 1)) * (yTicks - 1 - i))
  ); return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="overflow-visible">
        <defs>
          <linearGradient id={`area-grad-${gradientFrom}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.35} />
            <stop offset="100%" stopColor={gradientTo} stopOpacity={0.0} />
          </linearGradient>
          <filter id={`glow-${lineColor}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {showGrid && yLabels.map((_, i) => (
          <line key={i} x1={padX} y1={padY + (i * (h - padY * 2)) / (yTicks - 1)} x2={w - padX} y2={padY + (i * (h - padY * 2)) / (yTicks - 1)} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" opacity={0.5}
          />
        ))}

        {/* Y-axis */}
        <line x1={padX} y1={padY} x2={padX} y2={h - padY} stroke="var(--border-color)" strokeWidth="1" />
        <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="var(--border-color)" strokeWidth="1" />

        {/* Y labels */}
        {yLabels.map((l, i) => (
          <text key={i} x={padX - 10} y={padY + (i * (h - padY * 2)) / (yTicks - 1) + 4} textAnchor="end" className="fill-neutral-400 text-[9px] font-mono"
          >
            £{(l / 1000) >= 1 ? `${(l / 1000).toFixed(0)}k` : l}
          </text>
        ))}

        {/* Fill area */}
        {fillD && <path d={fillD} fill={`url(#area-grad-${gradientFrom})`} />}

        {/* Main line */}
        {pathD && (
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#glow-${lineColor})`}
          />
        )}

        {/* Data points */}
        {pts.map((p, i) => (
          <g key={i}>
            {hoveredIdx === i && (
              <circle cx={p.x} cy={p.y} r={16} fill={lineColor} opacity={0.12} />
            )}
            <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 4.5} fill={hoveredIdx === i ? '#fff' : lineColor} stroke={lineColor} strokeWidth={hoveredIdx === i ? 3 : 2} className="transition-all duration-200 cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}
            />
            {/* X labels */}
            <text x={p.x} y={h - padY + 18} textAnchor="middle" className={`text-[9px] font-semibold transition-colors duration-200 ${ hoveredIdx === i ? 'fill-neutral-800 dark:fill-neutral-200' : 'fill-neutral-400'
              }`}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover Tooltip */}
      {hoveredIdx !== null && pts[hoveredIdx] && (
        <div className="absolute pointer-events-none z-20 px-3.5 py-2.5 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-200" style={{ left: `${(pts[hoveredIdx].x / w) * 100}%`, top: `${(pts[hoveredIdx].y / h) * 100}%`, transform: 'translate(-50%, -110%)', backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)',
          }}
        >
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{pts[hoveredIdx].label}</div>
          <div className="text-sm font-bold" style={{ color: lineColor }}>
            £{pts[hoveredIdx].value.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────── P R E M I U M B A R C H A R T ────────────────────
interface BarChartProps { data: { label: string; value: number; color?: string }[]; height?: number; showValue?: boolean; barWidth?: number;
}
  const BAR_COLORS = [
  'from-[#f43f5e] to-[#ec4899]',
  'from-[#8b5cf6] to-[#6366f1]',
  'from-[#06b6d4] to-[#3b82f6]',
  'from-[#f59e0b] to-[#f97316]',
  'from-[#10b981] to-[#059669]',
  'from-[#ec4899] to-[#f43f5e]',
]; export function PremiumBarChart({ data, height = 280, showValue = true, barWidth = 32,
}: BarChartProps) { const [hoveredIdx, setHoveredIdx] = useState<number | null>(null); const [animProgress, setAnimProgress] = useState(0); const animRef = useRef<number>(0); useEffect(() => { let start: number | null = null; const duration = 800; const step = (ts: number) => { if (!start) start = ts; const p = Math.min((ts - start) / duration, 1); setAnimProgress(1 - Math.pow(1 - p, 3)); if (p < 1) animRef.current = requestAnimationFrame(step);
    }; animRef.current = requestAnimationFrame(step); return () => cancelAnimationFrame(animRef.current);
  }, []); if (!data.length) { return <div className="flex items-center justify-center h-40 text-xs text-slate-500 dark:text-slate-400">No data</div>;
  }
  const maxVal = Math.max(...data.map(d => d.value), 1); return (
    <div className="relative w-full pt-4">
      {/* Reference lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="border-b border-dashed w-full" style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
        ))}
      </div>

      <div className="relative flex items-end justify-around h-full" style={{ height }}>
        {data.map((b, i) => { const pct = maxVal > 0 ? (b.value / maxVal) * 100 * animProgress : 0; const isHovered = hoveredIdx === i; const color = b.color || BAR_COLORS[i % BAR_COLORS.length]; return (
            <div key={b.label} className="flex flex-col items-center flex-1 h-full justify-end relative" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && showValue && (
                <div className="absolute bottom-full mb-2 pointer-events-none z-20 px-3 py-2 rounded-xl shadow-xl border backdrop-blur-md whitespace-nowrap transition-all duration-200" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)',
                  }}
                >
                  <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 text-center">{b.label}</div>
                  <div className="text-xs font-bold text-center bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${color.replace('from-[', '').replace('] to-[', ', ').replace(']', '')})` }}>
                    £{b.value.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Bar container */}
              <div className="rounded-t-lg relative overflow-hidden transition-all duration-300" style={{ width: barWidth, height: `${Math.max(pct, 2)}%`, backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px 8px 0 0',
                }}
              >
                {/* Gradient fill */}
                <div className={`absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t ${color} transition-all duration-300`} style={{ height: '100%', boxShadow: isHovered ? `0 0 20px ${color.includes('f43f5e') ? '#f43f5e' : color.includes('8b5cf6') ? '#8b5cf6' : color.includes('06b6d4') ? '#06b6d4' : color.includes('f59e0b') ? '#f59e0b' : color.includes('10b981') ? '#10b981' : '#ec4899'}40` : 'none', transform: isHovered ? 'scaleX(1.1)' : 'scaleX(1)', transformOrigin: 'bottom center',
                  }}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] mt-2 font-semibold transition-colors duration-200" style={{ color: isHovered ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {b.label}
              </span>

              {/* Mini value */}
              {showValue && (
                <span className="text-[8px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  £{(b.value / 1000).toFixed(0)}k
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────── P R E M I U M D O N U T C H A R T ────────────────────
interface DonutChartProps { data: { name: string; value: number; color: string }[]; size?: number; innerRadius?: number; outerRadius?: number; animated?: boolean;
} export function PremiumDonutChart({ data, size = 220, innerRadius = 65, outerRadius = 95, animated = true,
}: DonutChartProps) { const [hoveredSlice, setHoveredSlice] = useState<number | null>(null); const [animProgress, setAnimProgress] = useState(animated ? 0 : 1); const animRef = useRef<number>(0); useEffect(() => { if (!animated) { setAnimProgress(1); return; }
  let start: number | null = null; const duration = 1000; const step = (ts: number) => { if (!start) start = ts; const p = Math.min((ts - start) / duration, 1); setAnimProgress(1 - Math.pow(1 - p, 3)); if (p < 1) animRef.current = requestAnimationFrame(step);
    }; animRef.current = requestAnimationFrame(step); return () => cancelAnimationFrame(animRef.current);
  }, [animated]); if (!data.length) { return <div className="flex items-center justify-center h-40 text-xs text-slate-500 dark:text-slate-400">No data</div>;
  }
  const total = data.reduce((s, d) => s + d.value, 0) || 1; const cx = size / 2; const cy = size / 2; const strokeWidth = outerRadius - innerRadius; const r = (outerRadius + innerRadius) / 2; const circumference = 2 * Math.PI * r; let cumulativeAngle = -Math.PI / 2;

  // Sort data by value descending
  const sorted = [...data].sort((a, b) => b.value - a.value); return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 w-full">
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            {sorted.map((d, i) => (
              <filter key={i} id={`donut-glow-${i}`}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
          </defs>

          {/* Background circle */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} />

          {/* Segments */}
          {sorted.map((d, i) => { const angle = (d.value / total) * 2 * Math.PI * animProgress; const startAngle = cumulativeAngle; const endAngle = cumulativeAngle + angle; cumulativeAngle = endAngle;

            // Arc path
  const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle); const x2 = cx + r * Math.cos(endAngle); const y2 = cy + r * Math.sin(endAngle); const largeArc = angle > Math.PI ? 1 : 0; const pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`; const isHovered = hoveredSlice === i; return (
              <g key={i}>
                <path d={pathD} fill="none" stroke={d.color} strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth} strokeLinecap="round" className="transition-all duration-300 cursor-pointer" filter={isHovered ? `url(#donut-glow-${i})` : undefined} style={{ transformOrigin: `${cx}px ${cy}px`, transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  }} onMouseEnter={() => setHoveredSlice(i)} onMouseLeave={() => setHoveredSlice(null)}
                />
              </g>
            );
          })}

          {/* Center text */}
          <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-bold uppercase tracking-widest"> Total
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-2xl font-black">
            £{(total / 1000).toFixed(0)}k
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col justify-center space-y-3 min-w-[140px] w-full md:w-auto">
        {sorted.map((d, i) => { const pct = Math.round((d.value / total) * 100); return (
            <div key={i} className="flex items-center gap-2.5 text-xs cursor-pointer transition-opacity" style={{ opacity: hoveredSlice === null || hoveredSlice === i ? 1 : 0.5 }} onMouseEnter={() => setHoveredSlice(i)} onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
              <span className="font-bold ml-auto" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────── P R E M I U M G A U G E C H A R T ────────────────────
interface GaugeChartProps { value: number; max: number; label: string; color?: string; size?: number;
} export function PremiumGaugeChart({ value, max, label, color = '#f43f5e', size = 140,
}: GaugeChartProps) { const [animProgress, setAnimProgress] = useState(0); const animRef = useRef<number>(0); useEffect(() => { let start: number | null = null; const duration = 1000; const step = (ts: number) => { if (!start) start = ts; const p = Math.min((ts - start) / duration, 1); setAnimProgress(1 - Math.pow(1 - p, 3)); if (p < 1) animRef.current = requestAnimationFrame(step);
    }; animRef.current = requestAnimationFrame(step); return () => cancelAnimationFrame(animRef.current);
  }, []); const cx = size / 2; const cy = size / 2; const r = (size - 30) / 2; const strokeWidth = 18; const circumference = 2 * Math.PI * r; const pct = max > 0 ? value / max : 0; const dashOffset = circumference * (1 - pct * animProgress); const angle = pct * 180; const rad = (angle * Math.PI) / 180; const endX = cx + r * Math.sin(rad); const endY = cy - r * Math.cos(rad); return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <defs>
          <linearGradient id={`gauge-grad-${color}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
          <filter id={`gauge-glow-${color}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} strokeLinecap="round"
        />

        {/* Value arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${endX} ${endY}`} fill="none" stroke={`url(#gauge-grad-${color})`} strokeWidth={strokeWidth} strokeLinecap="round" filter={`url(#gauge-glow-${color})`} className="transition-all duration-500"
        />

        {/* Value text */}
        <text x={cx} y={cy - 35} textAnchor="middle" className="fill-neutral-400 text-[10px] font-semibold">
          {label}
        </text>
        <text x={cx} y={cy - 12} textAnchor="middle" className="fill-neutral-800 dark:fill-neutral-200 text-xl font-black">
          {Math.round(pct * 100)}%
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" className="fill-neutral-400 text-[9px]">
          {value.toLocaleString()} / {max.toLocaleString()}
        </text>
      </svg>
    </div>
  );
}

// ──────────────────── S P A R K L I N E M I N I C H A R T ────────────────────
interface SparklineProps { data: number[]; color?: string; width?: number; height?: number;
} export function SparklineChart({ data, color = '#f43f5e', width = 80, height = 28,
}: SparklineProps) { if (!data.length) return null; const max = Math.max(...data, 1); const min = Math.min(...data, 0); const range = max - min || 1; const pad = 2; const pts = data.map((d, i) => { const x = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1); const y = height - pad - ((d - min) / range) * (height - pad * 2); return `${x},${y}`;
  }); const pathD = `M ${pts.join(' L ')}`; return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${width - pad} ${height} L ${pad} ${height} Z`} fill={`url(#spark-${color})`}
      />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}