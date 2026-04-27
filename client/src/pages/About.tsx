import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Globe, Users, TrendingUp, FlaskConical, BookOpen, Building2, Star, Quote, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const LEADERSHIP = [
  {
    name: 'Shri Jaxay Shah',
    title: 'Chairperson',
    initials: 'JS',
    gradient: 'from-blue-600 to-indigo-700',
    quote: 'Quality is not an abstract ideal — it is a measurable, manageable, and improvable reality. QCI exists to make that reality universal across India.',
  },
  {
    name: 'Shri Ravi P. Singh',
    title: 'Chief Executive Officer',
    initials: 'RS',
    gradient: 'from-teal-600 to-cyan-700',
    quote: 'We are building institutions that outlast individuals. Every accreditation QCI grants is a promise to the public that standards will be upheld.',
  },
  {
    name: 'Dr. Anil Jauhary',
    title: 'Principal Advisor',
    initials: 'AJ',
    gradient: 'from-purple-600 to-violet-700',
    quote: 'Policy without implementation is fiction. Our role is to bridge the gap between what India aspires to and what its institutions actually deliver.',
  },
  {
    name: 'CA Priya Kapoor',
    title: 'Chief Financial Officer',
    initials: 'PK',
    gradient: 'from-orange-500 to-amber-600',
    quote: 'Financial integrity is the backbone of institutional credibility. At QCI, every resource is a stewardship — not an expenditure.',
  },
];

const BOARDS = [
  {
    acronym: 'NABCB',
    full: 'National Accreditation Board for Certification Bodies',
    desc: 'Accredits certification and inspection bodies, ensuring compliance with international ISO standards and promoting global trade.',
    icon: '🏛️',
    color: 'from-blue-600 to-blue-700',
    tag: 'Certification & Inspection',
  },
  {
    acronym: 'NABET',
    full: 'National Accreditation Board for Education and Training',
    desc: 'Offers accreditation for schools, vocational training organizations, and skill certification bodies across India.',
    icon: '🎓',
    color: 'from-violet-600 to-indigo-700',
    tag: 'Education & Training',
  },
  {
    acronym: 'NABL',
    full: 'National Accreditation Board for Testing and Calibration Laboratories',
    desc: 'Ensures technical competence and consistency in testing and calibration laboratories through rigorous international standards.',
    icon: '🔬',
    color: 'from-orange-600 to-amber-600',
    tag: 'Laboratories',
  },
  {
    acronym: 'NABH',
    full: 'National Accreditation Board for Hospitals & Healthcare Providers',
    desc: 'Sets standards and accredits healthcare organizations to ensure patient safety and quality clinical care across India.',
    icon: '🏥',
    color: 'from-teal-600 to-cyan-600',
    tag: 'Healthcare',
  },
  {
    acronym: 'NBQP',
    full: 'National Board for Quality Promotion',
    desc: 'Leads nationwide quality movements, awareness campaigns, and manages voluntary certification schemes for quality culture.',
    icon: '⭐',
    color: 'from-rose-600 to-pink-600',
    tag: 'Quality Promotion',
  },
];

const DIVISIONS = [
  {
    acronym: 'PADD',
    full: 'Project Analysis and Documentation Division',
    desc: 'Manages voluntary conformity assessment frameworks including IndiaGHP, Ayush Mark, and other national quality schemes.',
    icon: '📋',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    accentColor: 'text-blue-700 dark:text-blue-400',
  },
  {
    acronym: 'PPID',
    full: 'Project Planning & Implementation Division',
    desc: 'Executes quality improvement projects for central and state governments, translating policy into measurable outcomes.',
    icon: '🗂️',
    color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700',
    accentColor: 'text-violet-700 dark:text-violet-400',
  },
  {
    acronym: 'NDIE',
    full: 'National Division for Industry Excellence',
    desc: 'Focuses on enhancing industrial quality standards through benchmarking, best practices dissemination, and industry partnerships.',
    icon: '🏭',
    color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
    accentColor: 'text-emerald-700 dark:text-emerald-400',
  },
];

const MILESTONES = [
  { year: '1997', event: 'QCI established as India\'s national body for quality standards under the Ministry of Commerce & Industry.' },
  { year: '2000', event: 'NABL receives international recognition; India\'s first laboratory accreditations align with global norms.' },
  { year: '2006', event: 'NABH launches hospital accreditation, setting the foundation for quality healthcare across the country.' },
  { year: '2010', event: 'NABET expands to accredit vocational training providers under the National Skills Development framework.' },
  { year: '2015', event: 'QCI signs MoUs with international accreditation bodies — IAF, ILAC, APAC — for mutual recognition.' },
  { year: '2018', event: 'Launch of IndiaGHP (Good Hygiene Practices) certification for food-safety excellence.' },
  { year: '2020', event: 'QCI plays a pivotal role in COVID-19 testing lab accreditation, onboarding 1000+ labs in record time.' },
  { year: '2023', event: 'Digital transformation initiative — QCI launches online accreditation portals for all five boards.' },
];

const TESTIMONIALS = [
  {
    name: 'Arjun Mehta',
    role: 'Senior Analyst, NABL',
    tenure: '4 years at QCI',
    initials: 'AM',
    gradient: 'from-orange-500 to-amber-500',
    quote: 'Every assessment I conduct directly impacts whether a laboratory\'s results can be trusted by doctors and patients. That accountability gives every Monday morning real meaning.',
  },
  {
    name: 'Priya Nair',
    role: 'Associate Manager, NABH',
    tenure: '5 years at QCI',
    initials: 'PN',
    gradient: 'from-teal-500 to-cyan-600',
    quote: 'When a hospital gets NABH accreditation after our assessment, I know patient outcomes will improve. I\'ve never worked anywhere that the connection between my work and real-world impact is this direct.',
  },
  {
    name: 'Vikram Sharma',
    role: 'Project Manager, NABET',
    tenure: '6 years at QCI',
    initials: 'VS',
    gradient: 'from-violet-500 to-indigo-600',
    quote: 'The career growth here is genuinely structured — I started as a Coordinator, and within 6 years I\'m leading a team of 8 across three states. The clarity of the ladder is rare in government-adjacent bodies.',
  },
  {
    name: 'Sunita Reddy',
    role: 'Coordinator, PADD',
    tenure: '2 years at QCI',
    initials: 'SR',
    gradient: 'from-blue-500 to-indigo-600',
    quote: 'The collaborative culture across departments is something I didn\'t expect. I work daily with healthcare professionals, educators, and chemists — every project expands my perspective.',
  },
];

const GALLERY = [
  { label: 'National Quality Conclave 2023', tag: 'Event', gradient: 'from-blue-600 to-indigo-700' },
  { label: 'QCI Accreditation Excellence Awards', tag: 'Awards', gradient: 'from-teal-600 to-cyan-600' },
  { label: 'ISO Training Programme — New Delhi', tag: 'Training', gradient: 'from-violet-600 to-purple-700' },
  { label: 'State Government MoU Signing — UP', tag: 'Partnership', gradient: 'from-orange-500 to-amber-600' },
  { label: 'COVID Lab Accreditation Drive 2020', tag: 'Mission', gradient: 'from-rose-600 to-pink-600' },
  { label: 'QCI Leadership Meet 2024', tag: 'Leadership', gradient: 'from-slate-600 to-gray-700' },
];

export default function About() {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-gray-900">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 px-4">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)' }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Globe size={14} className="text-blue-400" />
            Established 1997 · Ministry of Commerce & Industry, Government of India
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
            Quality Council<br />
            <span className="text-blue-400">of India</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
            India's apex body for quality standards — accrediting hospitals, laboratories, educational institutions, and certification bodies to ensure every Indian has access to quality services that meet international benchmarks.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/browse"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2">
              Explore Careers <ArrowRight size={16} />
            </Link>
            <a href="https://www.qcin.org" target="_blank" rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors">
              Visit qcin.org
            </a>
          </div>
        </div>
      </section>

      {/* ── AT A GLANCE STATS ── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '27+', label: 'Years of Excellence', icon: <Award size={22} className="text-blue-500" /> },
            { value: '5', label: 'National Boards', icon: <Building2 size={22} className="text-teal-500" /> },
            { value: '10,000+', label: 'Accredited Entities', icon: <Globe size={22} className="text-purple-500" /> },
            { value: '3', label: 'Operating Divisions', icon: <Users size={22} className="text-orange-500" /> },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              {s.icon}
              <p className="text-3xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEADERSHIP ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Our Leadership</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Vision at the Top</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">The people who guide QCI's mission of raising quality standards across India's most critical sectors.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERSHIP.map(leader => (
              <div key={leader.name}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                {/* Avatar */}
                <div className={`h-36 bg-gradient-to-br ${leader.gradient} flex items-center justify-center relative`}>
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-black">
                    {leader.initials}
                  </div>
                </div>
                {/* Info */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-0.5">{leader.name}</h3>
                  <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wide mb-4">{leader.title}</p>
                  <div className="relative">
                    <Quote size={16} className="text-gray-200 dark:text-gray-700 absolute -top-1 -left-1" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic pl-3">
                      {leader.quote}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR BOARDS ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Our Boards</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Five Boards. One Standard.</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">QCI operates five national accreditation boards, each setting quality benchmarks in a critical sector of India's economy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOARDS.map(board => (
              <div key={board.acronym}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${board.color}`} />
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{board.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">{board.acronym}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">{board.tag}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">{board.full}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{board.desc}</p>
                  <Link to={`/browse?department=${board.acronym}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    View open roles <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR DIVISIONS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Our Divisions</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Where Projects Come to Life</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Beyond accreditation, QCI's divisions implement quality improvement programmes for government, industry, and consumers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIVISIONS.map(div => (
              <div key={div.acronym}
                className={`rounded-2xl border p-6 ${div.color}`}>
                <span className="text-3xl mb-3 block">{div.icon}</span>
                <h3 className={`text-xl font-black mb-1 ${div.accentColor}`}>{div.acronym}</h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">{div.full}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{div.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOURNEY / MILESTONES ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Our Journey</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">27 Years of Building Quality India</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Key milestones in QCI's mission to make quality the foundation of India's growth story.</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-16 md:left-1/2 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-8">
              {MILESTONES.map((m, idx) => (
                <div key={m.year}
                  className={`relative flex gap-6 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Year badge */}
                  <div className="flex-shrink-0 w-16 md:w-1/2 flex md:justify-end md:pr-8 items-start">
                    <div className="bg-blue-600 text-white text-sm font-black px-3 py-1.5 rounded-lg">{m.year}</div>
                  </div>
                  {/* Dot */}
                  <div className="absolute left-16 md:left-1/2 -translate-x-1/2 top-2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-900 z-10" />
                  {/* Content */}
                  <div className="flex-1 md:pl-8 pb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                      {m.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY / MEMORIES ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Memories & Events</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">QCI in Action</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Highlights from conclaves, partnerships, award ceremonies, and field programmes across the country.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GALLERY.map((item, i) => (
              <div key={i}
                className={`relative rounded-2xl overflow-hidden h-44 bg-gradient-to-br ${item.gradient} group cursor-pointer`}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-300" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <span className="text-white/60 text-xs font-medium">{item.tag}</span>
                  <p className="text-white text-sm font-semibold mt-0.5 leading-tight">{item.label}</p>
                </div>
                {/* Photo icon placeholder */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">Photo gallery — managed via HR Admin Panel</p>
        </div>
      </section>

      {/* ── EMPLOYEE TESTIMONIALS ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Employee Stories</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Why Our People Stay</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Hear directly from QCI employees about what makes working here different from anywhere else.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all">
                <Quote size={24} className="text-blue-100 dark:text-blue-900 mb-3" />
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic mb-5">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role} · {t.tenure}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3">Be Part of Quality India</h2>
          <p className="text-white/80 text-lg mb-8">Join the organisation that sets the standard for standards. Open roles across all five boards and three divisions.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/browse"
              className="bg-white text-blue-700 font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
              Browse Open Roles <ArrowRight size={16} />
            </Link>
            <Link to="/careers"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors">
              View Career Paths
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
