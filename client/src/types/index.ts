export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'jobseeker' | 'employer' | 'hr';
  company_name?: string;
  city?: string;
  state?: string;
  pincode?: string;
  created_at: string;
}

export interface Job {
  id: number;
  employer_id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  category: string;
  experience_min: number;
  experience_max: number;
  salary_min?: number;
  salary_max?: number;
  description: string;
  requirements: string;
  skills: string;
  openings: number;
  is_active: number;
  department?: string;
  created_at: string;
  employer_name?: string;
  application_count?: number;
  match_score?: number;
  matched_skills?: string[];
}

export interface Application {
  id: number;
  job_id: number;
  applicant_id: number;
  full_name: string;
  email: string;
  phone: string;
  pincode: string;
  city?: string;
  state?: string;
  experience_years: number;
  current_company?: string;
  current_ctc?: string;
  expected_ctc?: string;
  notice_period?: string;
  cover_letter?: string;
  resume_path?: string;
  skills?: string;
  status: 'pending' | 'shortlisted' | 'interviewed' | 'rejected' | 'hired';
  match_score: number;
  applied_at: string;
  job_title?: string;
  company?: string;
  location?: string;
  job_type?: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  pincode: string;
  city: string;
  skills: string;
  experienceYears: string | number;
}

export interface ValidationErrors {
  [key: string]: string;
}
