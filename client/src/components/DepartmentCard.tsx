import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Props {
  dept: 'NABH' | 'NABET' | 'NABL';
  openRoles: number;
  openings: number;
}

const DEPT_META = {
  NABH: {
    full: 'National Accreditation Board for Hospitals & Healthcare Providers',
    short: 'Healthcare accreditation for hospitals, nursing homes & healthcare organisations.',
    from: '#0f766e', to: '#0891b2',
    icon: '🏥',
    tag: 'Healthcare',
  },
  NABET: {
    full: 'National Accreditation Board for Education and Training',
    short: 'Quality certification for educational institutions and training bodies.',
    from: '#6d28d9', to: '#4f46e5',
    icon: '🎓',
    tag: 'Education',
  },
  NABL: {
    full: 'National Accreditation Board for Testing and Calibration Laboratories',
    short: 'Accreditation for testing, calibration and medical labs across India.',
    from: '#c2410c', to: '#d97706',
    icon: '🔬',
    tag: 'Laboratories',
  },
};

export default function DepartmentCard({ dept, openRoles, openings }: Props) {
  const navigate = useNavigate();
  const meta = DEPT_META[dept];

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/browse?department=${dept}`)}>
      {/* Gradient header */}
      <div className="h-28 flex items-center px-6 relative"
        style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div>
          <span className="text-4xl">{meta.icon}</span>
        </div>
        <div className="ml-4">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full mb-1">{meta.tag}</span>
          <h3 className="text-2xl font-black text-white tracking-tight">{dept}</h3>
        </div>
        <div className="ml-auto text-right">
          <p className="text-3xl font-black text-white">{openRoles}</p>
          <p className="text-white/80 text-xs">open roles</p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white p-5">
        <p className="text-xs font-semibold text-gray-500 mb-1">{meta.full}</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{meta.short}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{openings} total opening{openings !== 1 ? 's' : ''}</span>
          <button className="flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
            style={{ color: meta.from }}>
            View Roles <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
