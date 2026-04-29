import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Globe, Users, TrendingUp, FlaskConical, BookOpen, Building2, Star, Quote, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const LEADERSHIP = [
  {
    name: 'Mr. Jaxay Shah',
    title: 'Chairman, QCI',
    initials: 'JS',
    gradient: 'from-brand-700 to-brand-500',
    photo: '',
    quote: 'Quality is the foundation on which India\'s global competitiveness will be built. QCI\'s mandate is to make quality a way of life — for every organisation, every product, every service.',
  },
  {
    name: 'Mr. Chakravarthy T. Kannan',
    title: 'Secretary General, QCI',
    initials: 'CK',
    gradient: 'from-blue-600 to-indigo-700',
    photo: 'https://nabh-portal-live.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/05/19163957/kannan-1-qmxcridtevpbu1xfiic557imy3kwve58q4nxm4jlug-e1758280197345.jpg',
    quote: 'Quality is not an abstract ideal — it is a measurable, manageable, and improvable reality. QCI exists to make that reality universal across India.',
  },
  {
    name: 'Mr. Rizwan Koita',
    title: 'Chairperson, NABH',
    initials: 'RK',
    gradient: 'from-teal-600 to-cyan-700',
    photo: 'https://nabh-portal-live.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/06/19164032/chairperson-1-e1758280232152.jpg',
    quote: 'We are building institutions that outlast individuals. Every accreditation QCI grants is a promise to the public that standards will be upheld.',
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
  {
    acronym: 'TCB',
    full: 'Training Certification Board (under NABET)',
    desc: 'Certifies training organisations and individual trainers across industry and academia, ensuring quality in skill delivery.',
    icon: '🎯',
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
    accentColor: 'text-purple-700 dark:text-purple-400',
  },
  {
    acronym: 'SPD',
    full: 'Standards & Product Division',
    desc: 'Develops and promotes voluntary product standards to enable global competitiveness and consumer confidence.',
    icon: '📐',
    color: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700',
    accentColor: 'text-cyan-700 dark:text-cyan-400',
  },
  {
    acronym: 'IT',
    full: 'Information Technology Division',
    desc: 'Drives digital quality infrastructure and IT-enabled quality management systems across QCI and its boards.',
    icon: '💻',
    color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700',
    accentColor: 'text-sky-700 dark:text-sky-400',
  },
  {
    acronym: 'Media',
    full: 'Media & Communications Division',
    desc: 'Leads quality awareness campaigns and knowledge dissemination through media outreach and public communications.',
    icon: '📡',
    color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700',
    accentColor: 'text-pink-700 dark:text-pink-400',
  },
  {
    acronym: 'Finance',
    full: 'Accounts & Finance Department',
    desc: 'Manages QCI\'s financial operations, accounts, budgeting, and procurement functions ensuring fiscal discipline.',
    icon: '💰',
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    accentColor: 'text-green-700 dark:text-green-400',
  },
  {
    acronym: 'HR',
    full: 'HR & Admin Department',
    desc: 'Drives talent acquisition, employee development, administration, and compliance across QCI and its constituent bodies.',
    icon: '👥',
    color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
    accentColor: 'text-orange-700 dark:text-orange-400',
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


export default function About() {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [lightbox, setLightbox] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(data => setGalleryItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
            India's apex body for quality standards — operating through NABCB, NABH, NABET, NABL, and NBQP to accredit hospitals, laboratories, educational institutions, and certification bodies. A Government of India Public-Private Partnership ensuring every Indian has access to quality services that meet international benchmarks.
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
            { value: '39', label: 'Council Members', icon: <Users size={22} className="text-orange-500" /> },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              {s.icon}
              <p className="text-3xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-2">Who We Are</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Mission & Vision</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">A Public-Private Partnership between the Government of India and India's apex industry bodies — ASSOCHAM, CII, and FICCI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800 p-8">
              <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-5">
                <TrendingUp size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Our Mission</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                To create a Quality Mindset across all sectors and ensure quality across products and services that touch every citizen — developing accreditation standards, improving processes, and ensuring compliance to quality benchmarks for inclusive and sustainable development.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
              <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center mb-5">
                <Globe size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Our Vision</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                To enhance quality across all sectors for inclusive and sustainable development — building <strong className="text-gray-800 dark:text-white">"Quality for National Wellbeing"</strong> as a way of life for every Indian organisation, product, and service.
              </p>
            </div>
          </div>
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              QCI is a non-profit autonomous body established through a Cabinet decision in 1996 under the <strong className="text-gray-700 dark:text-gray-300">Ministry of Commerce & Industry, Government of India</strong>, and registered under the Societies Registration Act. It operates on a unique Public-Private Partnership model with equal representation from Government, Industry, and Stakeholders across 39 council members.
            </p>
          </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {LEADERSHIP.map(leader => (
              <div key={leader.name}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                {/* Photo or gradient fallback */}
                <div className={`h-64 bg-gradient-to-br ${leader.gradient} flex items-center justify-center relative overflow-hidden`}>
                  {leader.photo ? (
                    <img src={leader.photo} alt={leader.name}
                      className="w-full h-full object-cover object-center" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-4xl font-black">
                      {leader.initials}
                    </div>
                  )}
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

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
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

      {/* ── PHOTO GALLERY ── */}
      {galleryItems.length > 0 && (
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Memories & Events</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">QCI in Action</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Highlights from conclaves, partnerships, award ceremonies, and field programmes across the country.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryItems.map(item => (
                <div key={item.id}
                  className="relative rounded-2xl overflow-hidden h-48 bg-gray-200 dark:bg-gray-700 group cursor-pointer"
                  onClick={() => setLightbox(item)}>
                  {item.image_path ? (
                    <img src={item.image_path} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-white/60 text-[10px] font-medium uppercase tracking-wide">{item.category}</span>
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {lightbox && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightbox(null)}>
              {/* Close button — fixed to viewport corner */}
              <button onClick={() => setLightbox(null)}
                className="fixed top-5 right-6 text-white/70 hover:text-white text-4xl font-light leading-none z-50">×</button>
              <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                {lightbox.image_path && (
                  <img src={lightbox.image_path} alt={lightbox.title}
                    className="w-full max-h-[70vh] object-contain rounded-xl" />
                )}
                <div className="mt-4 text-center">
                  <p className="text-white font-bold text-lg">{lightbox.title}</p>
                  {lightbox.description && <p className="text-white/70 text-sm mt-1">{lightbox.description}</p>}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

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

      {/* ── CONTACT & REACH US ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-2">Get in Touch</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Reach QCI</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">For career enquiries, accreditation questions, or general correspondence, here's how to find us.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <MapPin size={20} className="text-brand-500" />, label: 'Office', value: 'QCI World Trade Centre, J 200, Block J, Nauroji Nagar, New Delhi – 110029' },
              { icon: <BookOpen size={20} className="text-brand-500" />, label: 'Working Hours', value: 'Monday – Friday\n9:00 am – 5:30 pm' },
              { icon: <Globe size={20} className="text-brand-500" />, label: 'General', value: 'info@qcin.org\n011-26186680 to 83' },
              { icon: <Users size={20} className="text-brand-500" />, label: 'HR & Careers', value: 'hrcareers@qcin.org\nmedia@qcin.org' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  {c.icon}
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.label}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3">Be Part of Quality India</h2>
          <p className="text-white/80 text-lg mb-8">Join the organisation that sets the standard for standards. Open roles across all five boards and nine divisions.</p>
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
