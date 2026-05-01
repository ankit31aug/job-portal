-- QCI Job Portal — PostgreSQL Seed Data
-- Run after 001_schema.sql to populate required initial data for tests and local dev.
-- Password hash below is bcryptjs hash of 'Admin@123' (cost=10).

BEGIN;

-- ── Seed Users ──────────────────────────────────────────────────────────────
INSERT INTO users (name, email, password, role, company_name, phone, city, state, pincode, is_verified)
VALUES
  ('QCI Super Admin',  'superadmin@qci.org', '$2a$10$j5svcVaK5ZZJSVMFqJux5.GXvda8lErhyklIHmmW7.ecPU80G74kq', 'super_admin', 'Quality Council of India', '9876500001', 'New Delhi', 'Delhi', '110001', 1),
  ('QCI HR Admin',     'hr-admin@qci.org',   '$2a$10$j5svcVaK5ZZJSVMFqJux5.GXvda8lErhyklIHmmW7.ecPU80G74kq', 'hr',          'Quality Council of India', '9876500002', 'New Delhi', 'Delhi', '110001', 1),
  ('QCI NABH Manager', 'nabh@qci.org',       '$2a$10$j5svcVaK5ZZJSVMFqJux5.GXvda8lErhyklIHmmW7.ecPU80G74kq', 'employer',    'Quality Council of India', '9876543210', 'New Delhi', 'Delhi', '110001', 1),
  ('QCI NABET Manager','nabet@qci.org',      '$2a$10$j5svcVaK5ZZJSVMFqJux5.GXvda8lErhyklIHmmW7.ecPU80G74kq', 'employer',    'Quality Council of India', '9876543211', 'New Delhi', 'Delhi', '110001', 1),
  ('QCI NABL Manager', 'nabl@qci.org',       '$2a$10$j5svcVaK5ZZJSVMFqJux5.GXvda8lErhyklIHmmW7.ecPU80G74kq', 'employer',    'Quality Council of India', '9876543212', 'New Delhi', 'Delhi', '110001', 1)
ON CONFLICT (email) DO NOTHING;

-- ── Seed Board Configuration ─────────────────────────────────────────────────
INSERT INTO board_config (code, name, full_name, description, color, display_order, board_type)
VALUES
  ('NABCB', 'NABCB', 'National Accreditation Board for Certification Bodies',                  'Accreditation of certification and inspection bodies.',           'indigo-600', 1, 'board'),
  ('NABH',  'NABH',  'National Accreditation Board for Hospitals & Healthcare Providers',       'Accreditation of hospitals and healthcare organisations.',        'teal-600',   2, 'board'),
  ('NABET', 'NABET', 'National Accreditation Board for Education and Training',                 'Accreditation of education and training organisations.',          'violet-600', 3, 'board'),
  ('NABL',  'NABL',  'National Accreditation Board for Testing and Calibration Laboratories',   'Accreditation of testing and calibration laboratories.',          'orange-600', 4, 'board'),
  ('NBQP',  'NBQP',  'National Board for Quality Promotion',                                   'Promoting quality culture across Indian industry.',               'rose-600',   5, 'board'),
  ('PADD',  'PADD',  'Project Analysis and Documentation Division',                             'Project documentation and analysis support.',                     'blue-600',   6, 'division'),
  ('PPID',  'PPID',  'Project Planning & Implementation Division',                              'Strategic project planning and implementation.',                  'emerald-600',7, 'division'),
  ('NDIE',  'NDIE',  'National Division for Industry Excellence',                               'Driving excellence across Indian industry.',                      'amber-600',  8, 'division')
ON CONFLICT (code) DO NOTHING;

-- ── Seed Site Settings ───────────────────────────────────────────────────────
INSERT INTO settings (key, value, label, category)
VALUES
  ('hero_title',         'Build Your Career with QCI',                                                               'Hero Title',                  'hero'),
  ('hero_subtitle',      'Discover meaningful opportunities at India''s premier national accreditation body — across NABH, NABET, and NABL divisions.', 'Hero Subtitle', 'hero'),
  ('hero_gradient_from', '#1e3a5f',                                                                                  'Hero Background Start Color', 'hero'),
  ('hero_gradient_to',   '#1d4ed8',                                                                                  'Hero Background End Color',   'hero'),
  ('primary_color',      '#2563eb',                                                                                  'Primary Accent Color',        'branding'),
  ('footer_about',       'Quality Council of India (QCI) is a non-profit autonomous body established under the aegis of the Department for Promotion of Industry and Internal Trade (DPIIT), Ministry of Commerce & Industry, Government of India, to spearhead the quality movement in India.', 'Footer About Text', 'footer'),
  ('footer_email',       'careers@qci.org',                                                                         'Contact Email',               'footer'),
  ('footer_phone',       '+91-11-45010102',                                                                         'Contact Phone',               'footer'),
  ('footer_address',     'ITPI Building, 4th Floor, 4A Ring Road, I.P. Estate, New Delhi – 110002',                 'Address',                     'footer'),
  ('footer_linkedin',    'https://www.linkedin.com/company/quality-council-of-india',                               'LinkedIn URL',                'footer'),
  ('footer_twitter',     '',                                                                                         'Twitter/X URL',               'footer'),
  ('footer_instagram',   '',                                                                                         'Instagram URL',               'footer'),
  ('footer_facebook',    '',                                                                                         'Facebook URL',                'footer'),
  ('default_company',    'Quality Council of India',                                                                 'Default Company Name',        'jobs'),
  ('default_location',   'New Delhi',                                                                                'Default Location',            'jobs'),
  ('currency_symbol',    '₹',                                                                                        'Currency Symbol',             'jobs')
ON CONFLICT (key) DO NOTHING;

COMMIT;
