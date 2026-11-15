import React, { useState } from 'react';
import { HeartPulse, Activity, TrendingDown, CheckCircle2, Calendar, ShieldCheck } from 'lucide-react';

export const VitalsTrendChart: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'bp' | 'glucose'>('bp');

  // Realistic 7-day clinical readings for Smt. Kamala Deshmukh
  const bpData = [
    { day: 'Mon', systolic: 138, diastolic: 86, time: '08:00' },
    { day: 'Tue', systolic: 134, diastolic: 84, time: '08:15' },
    { day: 'Wed', systolic: 130, diastolic: 82, time: '08:00' },
    { day: 'Thu', systolic: 128, diastolic: 80, time: '08:10' },
    { day: 'Fri', systolic: 126, diastolic: 78, time: '08:00' },
    { day: 'Sat', systolic: 125, diastolic: 78, time: '08:05' },
    { day: 'Sun', systolic: 124, diastolic: 76, time: '08:00' },
  ];

  const glucoseData = [
    { day: 'Mon', value: 128, label: 'Fasting' },
    { day: 'Tue', systolic: 124, label: 'Fasting' },
    { day: 'Wed', systolic: 120, label: 'Fasting' },
    { day: 'Thu', systolic: 116, label: 'Fasting' },
    { day: 'Fri', systolic: 114, label: 'Fasting' },
    { day: 'Sat', systolic: 112, label: 'Fasting' },
    { day: 'Sun', systolic: 110, label: 'Fasting' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                7-Day Longitudinal Vitals Trend Analysis
              </h2>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                Adherence Correlated
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Correlating daily medication intake with cardiovascular stability and glycemic response
            </p>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveMetric('bp')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeMetric === 'bp'
                ? 'bg-white text-teal-800 shadow-xs dark:bg-slate-700 dark:text-teal-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Blood Pressure (BP)
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('glucose')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeMetric === 'glucose'
                ? 'bg-white text-teal-800 shadow-xs dark:bg-slate-700 dark:text-teal-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Fasting Glucose
          </button>
        </div>
      </div>

      {activeMetric === 'bp' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-700" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Systolic (Target &lt; 130 mmHg)</span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-400 ml-3" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Diastolic (Target &lt; 80 mmHg)</span>
            </div>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              10.1% Improvement this week
            </span>
          </div>

          {/* SVG Chart for Blood Pressure */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <svg className="w-full h-36" viewBox="0 0 700 140">
              {/* Background Reference Target Zone (120-130 Systolic) */}
              <rect x="0" y="20" width="700" height="35" fill="rgba(16, 185, 129, 0.08)" />
              <line x1="0" y1="55" x2="700" y2="55" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="4 4" />

              {/* Systolic Line & Dots (138 -> 124) */}
              <polyline
                fill="none"
                stroke="#0f766e"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,15 150,28 250,42 350,55 450,65 550,68 650,72"
              />
              {[
                [50, 15, '138'],
                [150, 28, '134'],
                [250, 42, '130'],
                [350, 55, '128'],
                [450, 65, '126'],
                [550, 68, '125'],
                [650, 72, '124'],
              ].map(([x, y, val], idx) => (
                <g key={idx}>
                  <circle cx={x} cy={y} r="5.5" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
                  <text x={x} y={Number(y) - 9} textAnchor="middle" className="text-[11px] font-mono font-bold fill-teal-900 dark:fill-teal-200">
                    {val}
                  </text>
                </g>
              ))}

              {/* Diastolic Line & Dots (86 -> 76) */}
              <polyline
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2 1"
                points="50,78 150,84 250,90 350,96 450,102 550,102 650,108"
              />
              {[
                [50, 78, '86'],
                [150, 84, '84'],
                [250, 90, '82'],
                [350, 96, '80'],
                [450, 102, '78'],
                [550, 102, '78'],
                [650, 108, '76'],
              ].map(([x, y, val], idx) => (
                <g key={idx}>
                  <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#2dd4bf" strokeWidth="2" />
                  <text x={x} y={Number(y) + 16} textAnchor="middle" className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400">
                    {val}
                  </text>
                </g>
              ))}
            </svg>

            {/* X-Axis Day Labels */}
            <div className="flex justify-between px-6 pt-2 font-mono text-[11px] text-slate-500 border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
              {bpData.map((d) => (
                <span key={d.day} className="font-semibold">
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Fasting Blood Sugar (Target: 90-120 mg/dL)</span>
            </div>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Controlled Glycemic Range
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <svg className="w-full h-36" viewBox="0 0 700 140">
              <rect x="0" y="30" width="700" height="40" fill="rgba(59, 130, 246, 0.08)" />
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,25 150,38 250,52 350,68 450,76 550,84 650,92"
              />
              {[
                [50, 25, '128'],
                [150, 38, '124'],
                [250, 52, '120'],
                [350, 68, '116'],
                [450, 76, '114'],
                [550, 84, '112'],
                [650, 92, '110'],
              ].map(([x, y, val], idx) => (
                <g key={idx}>
                  <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                  <text x={x} y={Number(y) - 8} textAnchor="middle" className="text-[11px] font-mono font-bold fill-blue-900 dark:fill-blue-200">
                    {val} mg/dL
                  </text>
                </g>
              ))}
            </svg>
            <div className="flex justify-between px-6 pt-2 font-mono text-[11px] text-slate-500 border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day} className="font-semibold">
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Correlation Summary Box */}
      <div className="rounded-xl border border-teal-200/80 bg-teal-50/60 p-3 text-xs text-teal-900 dark:border-teal-900/40 dark:bg-teal-950/30 dark:text-teal-200 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Geriatric Cardiologist Assessment: </span>
          <span>
            Blood pressure shows marked stabilization dropping from 138/86 to 124/76 mmHg over the past 7 days, reflecting high compliance with morning Telma 40mg and bedtime Atorva 20mg.
          </span>
        </div>
      </div>
    </div>
  );
};
