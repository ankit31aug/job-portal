import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

export interface SiteSettings {
  // ── General ──────────────────────────────────────────────
  site_name: string;
  site_tagline: string;
  primary_color: string;
  default_company: string;
  default_location: string;
  currency_symbol: string;

  // ── Footer ───────────────────────────────────────────────
  footer_about: string;
  footer_email: string;
  footer_phone: string;
  footer_address: string;
  footer_linkedin: string;
  footer_twitter: string;
  footer_instagram: string;
  footer_facebook: string;
  footer_youtube: string;
  footer_links_who: string;       // JSON array
  footer_links_org: string;       // JSON array
  footer_links_work: string;      // JSON array
  footer_links_gov: string;       // JSON array
  footer_regional_offices: string; // JSON array
  footer_copyright: string;
  footer_tagline: string;

  // ── Contact ──────────────────────────────────────────────
  contact_address: string;
  contact_phone: string;
  contact_email_general: string;
  contact_email_hr: string;
  contact_hours: string;

  // ── Home: Hero ───────────────────────────────────────────
  home_hero_badge: string;
  home_hero_title_1: string;
  home_hero_title_2: string;
  home_hero_subtitle: string;
  home_search_placeholder: string;

  // ── Home: Impact Stats (4 stats × 3 fields) ──────────────
  home_stat1_value: string; home_stat1_label: string; home_stat1_sub: string;
  home_stat2_value: string; home_stat2_label: string; home_stat2_sub: string;
  home_stat3_value: string; home_stat3_label: string; home_stat3_sub: string;
  home_stat4_value: string; home_stat4_label: string; home_stat4_sub: string;

  // ── Home: JSON Arrays ─────────────────────────────────────
  home_announcements: string;   // JSON array
  home_events: string;          // JSON array
  home_initiatives: string;     // JSON array

  // ── Home: CTA ────────────────────────────────────────────
  home_cta_title: string;
  home_cta_subtitle: string;

  // ── About: Hero ──────────────────────────────────────────
  about_hero_badge: string;
  about_hero_title: string;
  about_hero_subtitle: string;

  // ── About: Stats (4 stats × 2 fields) ────────────────────
  about_stat1_value: string; about_stat1_label: string;
  about_stat2_value: string; about_stat2_label: string;
  about_stat3_value: string; about_stat3_label: string;
  about_stat4_value: string; about_stat4_label: string;

  // ── About: Mission & Vision ───────────────────────────────
  about_mission: string;
  about_vision: string;
  about_ppp_note: string;

  // ── About: JSON Arrays ────────────────────────────────────
  about_leaders: string;        // JSON array
  about_board_chairs: string;   // JSON array
  about_milestones: string;     // JSON array
  about_testimonials: string;   // JSON array

  // ── Legacy keys (kept for backward compat) ────────────────
  hero_title: string;
  hero_subtitle: string;
  hero_gradient_from: string;
  hero_gradient_to: string;
}

export const SETTINGS_DEFAULTS: SiteSettings = {
  // General
  site_name: 'Quality Council of India',
  site_tagline: "India's National Accreditation Body",
  primary_color: '#3791E5',
  default_company: 'Quality Council of India',
  default_location: 'New Delhi',
  currency_symbol: '₹',

  // Footer
  footer_about: 'Quality Council of India (QCI) is a non-profit autonomous body established under the aegis of DPIIT, Ministry of Commerce & Industry, Government of India. A unique Public-Private Partnership for quality standards.',
  footer_email: 'info@qcin.org',
  footer_phone: '011-26186680',
  footer_address: 'J 200, Block J, Nauroji Nagar, World Trade Centre, New Delhi – 110029',
  footer_linkedin: 'https://www.linkedin.com/company/quality-council-of-india/',
  footer_twitter: 'https://twitter.com/qci_india',
  footer_instagram: 'https://www.instagram.com/qualitycouncilofindia/',
  footer_facebook: 'https://www.facebook.com/QualityCouncilOfIndia/',
  footer_youtube: 'https://www.youtube.com/@qualitycouncilofindia',
  footer_links_who: JSON.stringify([
    { label: 'About QCI', to: '/about' },
    { label: 'Leadership', to: '/about#leadership' },
    { label: 'Our Boards', to: '/about#boards' },
    { label: 'Vision & Mission', href: 'https://www.qcin.org/who-we-are/vision-mission' },
    { label: 'Quality Movement', href: 'https://www.qcin.org/who-we-are/quality-movement-in-india' },
  ]),
  footer_links_org: JSON.stringify([
    { label: 'NABH', href: 'https://www.nabh.co/', desc: 'Healthcare' },
    { label: 'NABL', href: 'https://www.nabl-india.org/', desc: 'Laboratories' },
    { label: 'NABCB', href: 'https://nabcb.qcin.org/', desc: 'Certification' },
    { label: 'NABET', href: 'https://www.nabet.org.in/', desc: 'Education' },
    { label: 'NBQP', href: 'https://qcin.org/nbqp', desc: 'Quality Promotion' },
  ]),
  footer_links_work: JSON.stringify([
    { label: 'Browse All Jobs', to: '/browse' },
    { label: 'Career Paths', to: '/careers' },
    { label: 'Resume Matcher', to: '/resume-match' },
    { label: 'Create Account', to: '/register' },
    { label: 'ZED Certification', href: 'https://zed.org.in/' },
    { label: 'Gunvatta Gurukul', href: 'https://gunvattagurukul.qcin.org/' },
  ]),
  footer_links_gov: JSON.stringify([
    { label: 'Annual Reports', href: 'https://www.qcin.org/governance-and-compliance/annual-reports' },
    { label: 'MoU & Agreements', href: 'https://www.qcin.org/governance-and-compliance' },
    { label: 'RTI', href: 'https://www.qcin.org/governance-and-compliance/rti' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Use', href: '#' },
  ]),
  footer_regional_offices: JSON.stringify([
    { city: 'Delhi HQ', addr: 'J 200, Block J, Nauroji Nagar, World Trade Centre, New Delhi – 110029', phone: '011-26186680 to 83' },
    { city: 'Ahmedabad', addr: 'B-302, Safal Profitaire, Corporate Road, Prahlad Nagar, Ahmedabad – 380015', phone: '079-29701600' },
    { city: 'Bengaluru', addr: '111, 4th Cross, Sadashivanagar, Bengaluru – 560080', phone: '080-23617591' },
    { city: 'Kolkata', addr: 'GN-38/2, Sector V, Salt Lake City, Kolkata – 700091', phone: '033-40630021' },
  ]),
  footer_copyright: 'Quality Council of India. All rights reserved.',
  footer_tagline: 'Creating an Ecosystem for Quality',

  // Contact
  contact_address: 'J 200, Block J, Nauroji Nagar, World Trade Centre, New Delhi – 110029',
  contact_phone: '011-26186680 to 83',
  contact_email_general: 'info@qcin.org',
  contact_email_hr: 'hrcareers@qcin.org',
  contact_hours: 'Monday – Friday, 9:00 am – 5:30 pm',

  // Home Hero
  home_hero_badge: 'Established 1997 · Ministry of Commerce & Industry, Government of India',
  home_hero_title_1: 'One Portal.',
  home_hero_title_2: 'All of Quality India.',
  home_hero_subtitle: 'Search careers across NABH, NABL, NABCB, NABET & NBQP — every board, every division, all in one place.',
  home_search_placeholder: 'Role, board, skill, or department…',

  // Home Stats
  home_stat1_value: '500000', home_stat1_label: 'MSMEs Certified',       home_stat1_sub: 'Under ZED Programme',
  home_stat2_value: '29000',  home_stat2_label: 'Healthcare Entities',   home_stat2_sub: 'Accredited by NABH',
  home_stat3_value: '14000',  home_stat3_label: 'Laboratories',          home_stat3_sub: 'Accredited by NABL',
  home_stat4_value: '45000',  home_stat4_label: 'Professionals Trained', home_stat4_sub: 'Across programmes',

  // Home Announcements (JSON)
  home_announcements: JSON.stringify([
    { tag: 'Recruitment', date: 'Apr 2025', title: 'CEO Recruitment — NBQP', desc: "Applications invited for the position of Chief Executive Officer at National Board for Quality Promotion (NBQP).", color: 'border-l-rose-500', href: 'https://qcin.org/nbqp' },
    { tag: 'Workshop',    date: 'Apr 2025', title: 'Capacity Building Workshop', desc: 'QCI and NABH to conduct a capacity building workshop for hospital administrators and quality managers.', color: 'border-l-teal-500', href: 'https://www.nabh.co/' },
    { tag: 'Initiative',  date: 'Mar 2025', title: 'Quality Reform Initiative', desc: 'QCI launches a nationwide quality reform initiative targeting MSMEs under the ZED Certification programme.', color: 'border-l-blue-500', href: 'https://zed.org.in/' },
    { tag: 'Accreditation', date: 'Mar 2025', title: 'NABL Milestone: 14,000+ Labs', desc: "NABL crosses 14,000 accredited laboratories — a major milestone in India's quality infrastructure journey.", color: 'border-l-orange-500', href: 'https://www.nabl-india.org/' },
    { tag: 'Education',   date: 'Feb 2025', title: 'Gunvatta Gurukul — Batch 6', desc: "Applications open for the 6th batch of QCI's flagship student programme on quality management. 100 seats.", color: 'border-l-amber-500', href: 'https://gunvattagurukul.qcin.org/' },
    { tag: 'Governance',  date: 'Feb 2025', title: 'Sarpanch Samwaad Programme', desc: "New cohort of Gram Panchayat leaders trained under QCI's rural quality governance outreach initiative.", color: 'border-l-green-500', href: 'https://qcin.org/sarpanch-samvaad/' },
  ]),

  // Home Events (JSON)
  home_events: JSON.stringify([
    { emoji: '🏥', type: 'NABH', month: 'May', year: '2025', title: 'NABH Healthcare Quality Summit', location: 'New Delhi', desc: 'Annual summit bringing together healthcare leaders to discuss accreditation standards and patient safety.' },
    { emoji: '🔬', type: 'NABL', month: 'Apr', year: '2025', title: 'Laboratory Quality Forum', location: 'Mumbai', desc: 'Forum for laboratory professionals on emerging testing standards and NABL accreditation processes.' },
    { emoji: '🎓', type: 'NABET', month: 'Apr', year: '2025', title: 'Education Quality Conclave', location: 'Bengaluru', desc: 'Conclave on quality frameworks for educational institutions with NABET accreditation body.' },
    { emoji: '🏆', type: 'NBQP', month: 'Mar', year: '2025', title: 'National Quality Award Ceremony', location: 'New Delhi', desc: 'Annual ceremony recognising organisations for excellence in quality management and innovation.' },
  ]),

  // Home Initiatives (JSON)
  home_initiatives: JSON.stringify([
    { emoji: '🎓', tag: 'Student Programme', title: 'Gunvatta Gurukul', desc: "QCI's flagship student initiative — 100 seats every two months for hands-on quality management training.", badges: ['100 seats/batch', 'Every 2 months', 'Certificate'], gradient: 'from-amber-500 to-red-500', href: 'https://gunvattagurukul.qcin.org/' },
    { emoji: '🌾', tag: 'Rural Outreach', title: 'Sarpanch Samwaad', desc: 'Connecting Gram Panchayat leaders with quality frameworks to drive governance at the grassroot level.', badges: ['Gram Panchayats', 'Quality Governance', 'Rural Impact'], gradient: 'from-green-600 to-teal-500', href: 'https://qcin.org/sarpanch-samvaad/' },
    { emoji: '🏙️', tag: 'Smart City', title: 'Quality City Nashik', desc: "Transforming Nashik into India's first Quality City — embedding standards across civic services and industry.", badges: ['Nashik', 'Civic Quality', 'Model City'], gradient: 'from-violet-600 to-pink-500', href: 'https://qcin.org/quality-city-nashik/' },
    { emoji: '🏭', tag: 'Make in India', title: 'ZED Certification', desc: 'Zero Defect Zero Effect — MSME certification programme targeting 1.25 million MSMEs for international quality standards.', badges: ['1.25M MSMEs', 'Zero Defect', 'Make in India'], gradient: 'from-teal-600 to-blue-600', href: 'https://zed.org.in/' },
  ]),

  // Home CTA
  home_cta_title: 'Be Part of Quality India',
  home_cta_subtitle: 'Open roles across all five boards and four core divisions. Upload your resume and let our matcher find the best fit.',

  // About Hero
  about_hero_badge: 'Established 1997 · Ministry of Commerce & Industry, Government of India',
  about_hero_title: 'Quality Council of India',
  about_hero_subtitle: "India's apex body for quality standards — operating through NABCB, NABH, NABET, NABL, and NBQP to accredit hospitals, laboratories, educational institutions, and certification bodies.",

  // About Stats
  about_stat1_value: '27+',     about_stat1_label: 'Years of Excellence',
  about_stat2_value: '5',       about_stat2_label: 'National Boards',
  about_stat3_value: '10,000+', about_stat3_label: 'Accredited Entities',
  about_stat4_value: '39',      about_stat4_label: 'Council Members',

  // About Mission/Vision
  about_mission: "To create a Quality Mindset across all sectors and ensure quality across products and services that touch every citizen — developing accreditation standards, improving processes, and ensuring compliance to quality benchmarks for inclusive and sustainable development.",
  about_vision: 'To enhance quality across all sectors for inclusive and sustainable development — building "Quality for National Wellbeing" as a way of life for every Indian organisation, product, and service.',
  about_ppp_note: 'QCI is a non-profit autonomous body established through a Cabinet decision in 1996 under the Ministry of Commerce & Industry, Government of India, and registered under the Societies Registration Act. It operates on a unique Public-Private Partnership model with equal representation from Government, Industry, and Stakeholders across 39 council members.',

  // About Leaders (JSON)
  about_leaders: JSON.stringify([
    { name: 'Mr. Jaxay Shah', title: 'Chairperson, QCI', initials: 'JS', gradient: 'from-brand-700 to-brand-500', photo: 'https://nabet.qci.org.in/wp-content/uploads/elementor/thumbs/1000211985-1-qjghotg3esmx7uf2drd68lnr1b1a619ti5ybq4nwpk.jpg', quote: "Quality is the foundation on which India's global competitiveness will be built. QCI's mandate is to make quality a way of life — for every organisation, every product, every service." },
    { name: 'Ms. Hema Bhandari', title: 'Chief Advisor, QCI', initials: 'HB', gradient: 'from-indigo-600 to-blue-700', photo: '', quote: "Quality leadership means building systems that sustain excellence long after we are gone. QCI exists to create those enduring systems across every sector of India." },
    { name: 'Mr. Chakravarthy T. Kannan', title: 'Secretary General, QCI', initials: 'CK', gradient: 'from-blue-600 to-indigo-700', photo: 'https://nabet.qci.org.in/wp-content/uploads/elementor/thumbs/kannan-qmxcv27v8ckbp0rqs1lekb9bqi2ty88qjpdyvra2c8.jpg', quote: 'Quality is not an abstract ideal — it is a measurable, manageable, and improvable reality. QCI exists to make that reality universal across India.' },
    { name: 'Mr. Rizwan Koita', title: 'Chairperson, NABH', initials: 'RK', gradient: 'from-teal-600 to-cyan-700', photo: 'https://nabh-portal-live.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/06/19164032/chairperson-1-e1758280232152.jpg', quote: 'We are building institutions that outlast individuals. Every accreditation QCI grants is a promise to the public that standards will be upheld.' },
  ]),

  // About Board Chairs (JSON)
  about_board_chairs: JSON.stringify([
    { name: 'Dr. Sandip Shah',       title: 'Chairperson, NABL',          initials: 'SS', gradient: 'from-orange-600 to-amber-500', board: 'NABL',  tag: 'Laboratories',       photo: '' },
    { name: 'Mr. Jalaj Dani',        title: 'Chairman, NABET',            initials: 'JD', gradient: 'from-violet-700 to-purple-600', board: 'NABET', tag: 'Education & Training', photo: 'https://nabet.qci.org.in/wp-content/uploads/2025/11/ee-277x300.jpg' },
    { name: 'Mr. Deep Kapuria',      title: 'Chairman, NABCB',            initials: 'DK', gradient: 'from-blue-700 to-indigo-600',  board: 'NABCB', tag: 'Certification',       photo: '' },
    { name: 'Dr. Aishvarya Raj',     title: 'CEO, NBQP',                  initials: 'AR', gradient: 'from-rose-600 to-pink-500',   board: 'NBQP',  tag: 'Quality Promotion',  photo: '' },
    { name: 'Mr. N. Venkateswaran',  title: 'CEO, NABL',                  initials: 'NV', gradient: 'from-orange-500 to-amber-400', board: 'NABL',  tag: 'Laboratories',       photo: '' },
    { name: 'Mr. C K Maheshwari',    title: 'Accreditation Chair, NABCB', initials: 'CM', gradient: 'from-sky-600 to-cyan-500',    board: 'NABCB', tag: 'Certification',       photo: '' },
  ]),

  // About Milestones (JSON)
  about_milestones: JSON.stringify([
    { year: '1997', event: "QCI established as India's national body for quality standards under the Ministry of Commerce & Industry." },
    { year: '2000', event: "NABL receives international recognition; India's first laboratory accreditations align with global norms." },
    { year: '2006', event: 'NABH launches hospital accreditation, setting the foundation for quality healthcare across the country.' },
    { year: '2010', event: 'NABET expands to accredit vocational training providers under the National Skills Development framework.' },
    { year: '2015', event: 'QCI signs MoUs with international accreditation bodies — IAF, ILAC, APAC — for mutual recognition.' },
    { year: '2018', event: 'Launch of IndiaGHP (Good Hygiene Practices) certification for food-safety excellence.' },
    { year: '2020', event: 'QCI plays a pivotal role in COVID-19 testing lab accreditation, onboarding 1000+ labs in record time.' },
    { year: '2023', event: 'Digital transformation initiative — QCI launches online accreditation portals for all five boards.' },
  ]),

  // About Testimonials (JSON)
  about_testimonials: JSON.stringify([
    { name: 'Arjun Mehta',  role: 'Senior Analyst, NABL',    tenure: '4 years at QCI', initials: 'AM', gradient: 'from-orange-500 to-amber-500', quote: "Every assessment I conduct directly impacts whether a laboratory's results can be trusted by doctors and patients. That accountability gives every Monday morning real meaning." },
    { name: 'Priya Nair',   role: 'Associate Manager, NABH', tenure: '5 years at QCI', initials: 'PN', gradient: 'from-teal-500 to-cyan-600',   quote: "When a hospital gets NABH accreditation after our assessment, I know patient outcomes will improve. I've never worked anywhere that the connection between my work and real-world impact is this direct." },
    { name: 'Vikram Sharma',role: 'Project Manager, NABET',  tenure: '6 years at QCI', initials: 'VS', gradient: 'from-violet-500 to-indigo-600', quote: "The career growth here is genuinely structured — I started as a Coordinator, and within 6 years I'm leading a team of 8 across three states. The clarity of the ladder is rare in government-adjacent bodies." },
    { name: 'Sunita Reddy', role: 'Coordinator, PADD',       tenure: '2 years at QCI', initials: 'SR', gradient: 'from-blue-500 to-indigo-600',  quote: "The collaborative culture across departments is something I didn't expect. I work daily with healthcare professionals, educators, and chemists — every project expands my perspective." },
  ]),

  // Legacy
  hero_title: 'Build Your Career with QCI',
  hero_subtitle: "Discover meaningful opportunities at India's premier national accreditation body.",
  hero_gradient_from: '#012249',
  hero_gradient_to: '#3791E5',
};

function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

interface SettingsCtx {
  settings: SiteSettings;
  refreshSettings: () => Promise<void>;
  parseJSON: typeof parseJSON;
}

const SettingsContext = createContext<SettingsCtx>({
  settings: SETTINGS_DEFAULTS,
  refreshSettings: async () => {},
  parseJSON,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(SETTINGS_DEFAULTS);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings({ ...SETTINGS_DEFAULTS, ...data });
    } catch {
      // use defaults on error
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings, parseJSON }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
