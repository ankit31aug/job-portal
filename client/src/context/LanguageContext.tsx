import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LangCode = 'en' | 'hi' | 'mr';

export const LANGUAGES: { code: LangCode; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English',  native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी',   flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi',  native: 'मराठी',    flag: '🇮🇳' },
];

type Translations = {
  nav_who_we_are: string;
  nav_our_boards: string;
  nav_careers: string;
  nav_media: string;
  nav_governance: string;
  nav_connect: string;
  nav_sign_in: string;
  nav_get_started: string;
  nav_sign_out: string;
  nav_dashboard: string;
  hero_badge: string;
  hero_search_placeholder: string;
  hero_cta_browse: string;
  hero_cta_match: string;
  browse_all_jobs: string;
  career_paths: string;
  resume_matcher: string;
  footer_quick_links: string;
  footer_connect: string;
  about_qci: string;
  about_leadership: string;
  about_our_boards: string;
  media_press: string;
  media_publications: string;
  media_reports: string;
  media_gallery: string;
  media_videos: string;
  media_newsletter: string;
  gov_rti: string;
  gov_annual_reports: string;
  gov_audit: string;
  gov_ethics: string;
  gov_policies: string;
  gov_compliance: string;
  contact_offices: string;
  contact_email: string;
  contact_phone: string;
  contact_social: string;
  contact_feedback: string;
};

const T: Record<LangCode, Translations> = {
  en: {
    nav_who_we_are: 'Who We Are',
    nav_our_boards: 'Our Boards',
    nav_careers: 'Careers',
    nav_media: 'Media',
    nav_governance: 'Governance',
    nav_connect: 'Connect With Us',
    nav_sign_in: 'Sign In',
    nav_get_started: 'Get Started',
    nav_sign_out: 'Sign Out',
    nav_dashboard: 'Dashboard',
    hero_badge: 'Established 1997 · Ministry of Commerce & Industry',
    hero_search_placeholder: 'Role, board, skill, or department…',
    hero_cta_browse: 'Browse All Jobs',
    hero_cta_match: 'Match My Resume',
    browse_all_jobs: 'Browse All Jobs',
    career_paths: 'Career Paths',
    resume_matcher: 'Resume Matcher',
    footer_quick_links: 'Quick Links',
    footer_connect: 'Connect With Us',
    about_qci: 'About QCI',
    about_leadership: 'Leadership',
    about_our_boards: 'Our Boards',
    media_press: 'Press Releases',
    media_publications: 'Publications',
    media_reports: 'Annual Reports',
    media_gallery: 'Photo Gallery',
    media_videos: 'Videos & Webinars',
    media_newsletter: 'Newsletter',
    gov_rti: 'RTI',
    gov_annual_reports: 'Annual Reports',
    gov_audit: 'Audit Reports',
    gov_ethics: 'Ethics & Conduct',
    gov_policies: 'Policies',
    gov_compliance: 'Compliance',
    contact_offices: 'Our Offices',
    contact_email: 'Email Us',
    contact_phone: 'Call Us',
    contact_social: 'Social Media',
    contact_feedback: 'Feedback',
  },
  hi: {
    nav_who_we_are: 'हम कौन हैं',
    nav_our_boards: 'हमारे बोर्ड',
    nav_careers: 'करियर',
    nav_media: 'मीडिया',
    nav_governance: 'शासन',
    nav_connect: 'हमसे जुड़ें',
    nav_sign_in: 'साइन इन',
    nav_get_started: 'शुरू करें',
    nav_sign_out: 'साइन आउट',
    nav_dashboard: 'डैशबोर्ड',
    hero_badge: '1997 में स्थापित · वाणिज्य एवं उद्योग मंत्रालय',
    hero_search_placeholder: 'भूमिका, बोर्ड, कौशल या विभाग…',
    hero_cta_browse: 'सभी नौकरियाँ देखें',
    hero_cta_match: 'रिज्यूमे मिलाएँ',
    browse_all_jobs: 'सभी नौकरियाँ देखें',
    career_paths: 'करियर पथ',
    resume_matcher: 'रिज्यूमे मैचर',
    footer_quick_links: 'त्वरित लिंक',
    footer_connect: 'हमसे जुड़ें',
    about_qci: 'QCI के बारे में',
    about_leadership: 'नेतृत्व',
    about_our_boards: 'हमारे बोर्ड',
    media_press: 'प्रेस विज्ञप्ति',
    media_publications: 'प्रकाशन',
    media_reports: 'वार्षिक रिपोर्ट',
    media_gallery: 'फोटो गैलरी',
    media_videos: 'वीडियो और वेबिनार',
    media_newsletter: 'न्यूज़लेटर',
    gov_rti: 'आरटीआई',
    gov_annual_reports: 'वार्षिक रिपोर्ट',
    gov_audit: 'ऑडिट रिपोर्ट',
    gov_ethics: 'नैतिकता और आचार संहिता',
    gov_policies: 'नीतियाँ',
    gov_compliance: 'अनुपालन',
    contact_offices: 'हमारे कार्यालय',
    contact_email: 'ईमेल करें',
    contact_phone: 'फोन करें',
    contact_social: 'सोशल मीडिया',
    contact_feedback: 'फीडबैक',
  },
  mr: {
    nav_who_we_are: 'आम्ही कोण आहोत',
    nav_our_boards: 'आमचे मंडळ',
    nav_careers: 'करिअर',
    nav_media: 'माध्यमे',
    nav_governance: 'शासन',
    nav_connect: 'आमच्याशी संपर्क करा',
    nav_sign_in: 'साइन इन',
    nav_get_started: 'सुरुवात करा',
    nav_sign_out: 'साइन आउट',
    nav_dashboard: 'डॅशबोर्ड',
    hero_badge: '1997 मध्ये स्थापित · वाणिज्य आणि उद्योग मंत्रालय',
    hero_search_placeholder: 'भूमिका, मंडळ, कौशल्य किंवा विभाग…',
    hero_cta_browse: 'सर्व नोकऱ्या पाहा',
    hero_cta_match: 'रिझ्युमे जुळवा',
    browse_all_jobs: 'सर्व नोकऱ्या पाहा',
    career_paths: 'करिअर मार्ग',
    resume_matcher: 'रिझ्युमे मॅचर',
    footer_quick_links: 'त्वरित दुवे',
    footer_connect: 'आमच्याशी संपर्क करा',
    about_qci: 'QCI बद्दल',
    about_leadership: 'नेतृत्व',
    about_our_boards: 'आमचे मंडळ',
    media_press: 'प्रेस विज्ञप्ती',
    media_publications: 'प्रकाशने',
    media_reports: 'वार्षिक अहवाल',
    media_gallery: 'छायाचित्र दालन',
    media_videos: 'व्हिडिओ आणि वेबिनार',
    media_newsletter: 'न्यूजलेटर',
    gov_rti: 'आरटीआय',
    gov_annual_reports: 'वार्षिक अहवाल',
    gov_audit: 'लेखापरीक्षण अहवाल',
    gov_ethics: 'नैतिकता आणि आचारसंहिता',
    gov_policies: 'धोरणे',
    gov_compliance: 'अनुपालन',
    contact_offices: 'आमची कार्यालये',
    contact_email: 'ईमेल करा',
    contact_phone: 'फोन करा',
    contact_social: 'सोशल मीडिया',
    contact_feedback: 'अभिप्राय',
  },
};

type LanguageContextType = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: T.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem('qci_lang') as LangCode) || 'en';
  const [lang, setLangState] = useState<LangCode>(
    LANGUAGES.some(l => l.code === stored) ? stored : 'en'
  );

  const setLang = (l: LangCode) => {
    setLangState(l);
    localStorage.setItem('qci_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: T[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
