import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_gradient_from: string;
  hero_gradient_to: string;
  primary_color: string;
  footer_about: string;
  footer_email: string;
  footer_phone: string;
  footer_address: string;
  footer_linkedin: string;
  footer_twitter: string;
  footer_instagram: string;
  footer_facebook: string;
  default_company: string;
  default_location: string;
  currency_symbol: string;
}

const defaults: SiteSettings = {
  site_name: 'Quality Council of India',
  site_tagline: "India's National Accreditation Body",
  hero_title: 'Build Your Career with QCI',
  hero_subtitle: "Discover meaningful opportunities at India's premier national accreditation body — across NABH, NABET, and NABL divisions.",
  hero_gradient_from: '#1e3a5f',
  hero_gradient_to: '#1d4ed8',
  primary_color: '#2563eb',
  footer_about: 'Quality Council of India (QCI) is a non-profit autonomous body established under the aegis of the Department for Promotion of Industry and Internal Trade (DPIIT), Ministry of Commerce & Industry, Government of India.',
  footer_email: 'careers@qci.org',
  footer_phone: '+91-11-45010102',
  footer_address: 'ITPI Building, 4th Floor, 4A Ring Road, I.P. Estate, New Delhi – 110002',
  footer_linkedin: 'https://www.linkedin.com/company/quality-council-of-india',
  footer_twitter: '',
  footer_instagram: '',
  footer_facebook: '',
  default_company: 'Quality Council of India',
  default_location: 'New Delhi',
  currency_symbol: '₹',
};

interface SettingsCtx {
  settings: SiteSettings;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsCtx>({ settings: defaults, refreshSettings: async () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaults);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings({ ...defaults, ...data });
    } catch {
      // use defaults on error
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
