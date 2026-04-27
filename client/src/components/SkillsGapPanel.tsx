import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { computeSkillMatch, getUserSkills, setUserSkills } from '../utils/skillMatch';

interface Props {
  jobSkills: string;
  compact?: boolean;
}

export default function SkillsGapPanel({ jobSkills, compact = false }: Props) {
  const [userSkillsInput, setUserSkillsInput] = useState(getUserSkills());
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const skills = userSkillsInput || getUserSkills();
  const { score, matched, missing } = computeSkillMatch(skills, jobSkills);
  const hasSkills = !!skills;

  const scoreColor = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-500';
  const barColor = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-400';

  const saveSkills = () => {
    setUserSkills(userSkillsInput);
    setEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Your Skills Match</span>
          {hasSkills && (
            <span className={`text-sm font-bold ${scoreColor}`}>{score}%</span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-4">
          {hasSkills ? (
            <>
              {/* Score bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Match score</span>
                  <span className={`font-semibold ${scoreColor}`}>{score}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {matched.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                      <CheckCircle size={12} />You have ({matched.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {matched.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {missing.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                      <AlertCircle size={12} />To develop ({missing.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {missing.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setEditing(!editing)}
                className="mt-3 text-xs text-blue-600 hover:text-blue-700">
                {editing ? 'Cancel' : 'Update my skills'}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500 mb-3">Add your skills to see how well you match this role.</p>
          )}

          {(editing || !hasSkills) && (
            <div className="mt-2">
              <input
                value={userSkillsInput}
                onChange={e => setUserSkillsInput(e.target.value)}
                placeholder="e.g. Healthcare,Documentation,MS Office,Communication"
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated. Saved locally on your device.</p>
              <button onClick={saveSkills}
                className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                Save & Analyse
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
