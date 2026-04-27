export interface SkillMatchResult {
  score: number;
  matched: string[];
  missing: string[];
}

export function computeSkillMatch(userSkills: string, jobSkills: string): SkillMatchResult {
  if (!userSkills || !jobSkills) return { score: 0, matched: [], missing: jobSkills ? jobSkills.split(',').map(s => s.trim()).filter(Boolean) : [] };
  const user = userSkills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const required = jobSkills.split(',').map(s => s.trim()).filter(Boolean);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of required) {
    const lc = skill.toLowerCase();
    if (user.some(u => u.includes(lc) || lc.includes(u))) matched.push(skill);
    else missing.push(skill);
  }
  const score = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0;
  return { score, matched, missing };
}

export const USER_SKILLS_KEY = 'qci_user_skills';

export function getUserSkills(): string {
  return localStorage.getItem(USER_SKILLS_KEY) || '';
}

export function setUserSkills(skills: string): void {
  localStorage.setItem(USER_SKILLS_KEY, skills);
}
