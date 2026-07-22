import { Shield, Info } from 'lucide-react';

export default function SecurityRatingLegend() {
  // DFJ v2.3 — higher scores = safer. Max 97 pts.
  const ratings = [
    { range: '80–97', label: 'SAFE',     bar: 'bg-green-500',  text: 'text-green-400',  desc: 'Thoroughly audited, reputable security posture, no major concerns.' },
    { range: '65–79', label: 'LOW',      bar: 'bg-blue-500',   text: 'text-blue-400',   desc: 'Generally secure with minor unverified indicators.' },
    { range: '50–64', label: 'MEDIUM',   bar: 'bg-yellow-400', text: 'text-yellow-400', desc: 'Some security signals missing — verify before committing large funds.' },
    { range: '30–49', label: 'HIGH',     bar: 'bg-orange-400', text: 'text-orange-400', desc: 'Multiple indicators absent — proceed with significant caution.' },
    { range: '0–29',  label: 'CRITICAL', bar: 'bg-red-500',    text: 'text-red-400',    desc: 'Limited verifiable security data or significant risks detected.' },
  ];

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-5 py-4 flex items-center gap-2.5">
        <Shield className="w-4 h-4 text-[#E8C15A] shrink-0" />
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
          Security Rating Key
        </span>
      </div>

      {/* Rating rows */}
      <div className="divide-y divide-[#111] flex-1">
        {ratings.map((r) => (
          <div key={r.range} className="flex items-start gap-3 px-5 py-3.5">
            {/* Colour bar */}
            <div className={`w-0.5 self-stretch mt-0.5 shrink-0 ${r.bar}`} />
            {/* Score range */}
            <span className="text-[10px] font-black tabular-nums text-white/35 min-w-[3.2rem] pt-0.5">
              {r.range}
            </span>
            {/* Label + description */}
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-black tracking-wider ${r.text}`}>{r.label}</span>
              <p className="text-[10px] text-white/30 mt-0.5 leading-snug">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-[#1a1a1a] px-5 py-3 flex items-start gap-2">
        <Info className="w-3 h-3 text-white/20 mt-0.5 shrink-0" />
        <p className="text-[10px] text-white/25 leading-snug">
          <strong className="text-white/35 font-semibold">Higher = safer.</strong>{' '}
          Max 97 pts — Foundation (45) + Active (55) − Penalties (30).
        </p>
      </div>
    </div>
  );
}
