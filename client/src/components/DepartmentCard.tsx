import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Props {
  dept: 'NABH' | 'NABET' | 'NABL' | 'NABCB' | 'NBQP';
  openRoles: number;
  openings: number;
}

const DEPT_META = {
  NABCB: {
    full: 'National Accreditation Board for Certification Bodies',
    short: 'Accredits certification & inspection bodies under ISO standards.',
    from: '#1d4ed8', to: '#4f46e5',
    icon: '🏛️',
    tag: 'Certification',
  },
  NABH: {
    full: 'National Accreditation Board for Hospitals & Healthcare Providers',
    short: 'Healthcare accreditation for hospitals and nursing homes.',
    from: '#0f766e', to: '#0891b2',
    icon: '🏥',
    tag: 'Healthcare',
  },
  NABET: {
    full: 'National Accreditation Board for Education and Training',
    short: 'Quality certification for educational and training bodies.',
    from: '#6d28d9', to: '#7c3aed',
    icon: '🎓',
    tag: 'Education',
  },
  NABL: {
    full: 'National Accreditation Board for Testing and Calibration Laboratories',
    short: 'Accreditation for testing, calibration and medical labs.',
    from: '#c2410c', to: '#d97706',
    icon: '🔬',
    tag: 'Laboratories',
  },
  NBQP: {
    full: 'National Board for Quality Promotion',
    short: 'Leads quality movements and awareness campaigns nationwide.',
    from: '#be185d', to: '#e11d48',
    icon: '⭐',
    tag: 'Quality Promotion',
  },
};

export default function DepartmentCard({ dept, openRoles, openings }: Props) {
  const navigate = useNavigate();
  const meta = DEPT_META[dept];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-pointer hover:scale-[1.03] hover:shadow-2xl transition-all duration-300"
      onClick={() => navigate(`/browse?department=${dept}`)}>
      <div
        className="relative flex flex-col justify-between p-5 min-h-[190px]"
        style={{ background: `linear-gradient(145deg, ${meta.from} 0%, ${meta.to} 100%)` }}>
        {/* Glow blob */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, white 0%, transparent 55%)' }} />

        {/* Top row: icon + open roles count */}
        <div className="relative flex items-start justify-between">
          <span className="text-3xl drop-shadow">{meta.icon}</span>
          <div className="text-right">
            <p className="text-3xl font-black text-white leading-none">{openRoles}</p>
            <p className="text-white/70 text-[11px] font-medium">open roles</p>
          </div>
        </div>

        {/* Bottom: tag, name, full name, CTA */}
        <div className="relative mt-4">
          <span className="inline-block bg-white/20 text-white/90 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
            {meta.tag}
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">{dept}</h3>
          <p className="text-white/65 text-[11px] leading-snug line-clamp-2 mb-3">{meta.short}</p>
          <div className="flex items-center gap-1 text-white/80 text-xs font-semibold group-hover:gap-2 transition-all">
            View Roles <ArrowRight size={11} />
          </div>
        </div>

        {/* Openings pill */}
        {openings > 0 && (
          <div className="absolute top-3 right-3 bg-white/15 text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {openings} opening{openings !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
