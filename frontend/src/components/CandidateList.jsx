import React, { useState } from 'react';
import { User, Mail, Phone, ExternalLink, Activity, Target, AlertTriangle, FileText, Download, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { API_BASE_URL } from '../api';

const CandidateList = ({ candidates }) => {
  const [expandedId, setExpandedId] = useState(null);

  const getInitials = (name) => {
    if (!name || name === 'Unknown Candidate') return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-indigo-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-indigo-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getBarColor = (index, value) => {
    if (value >= 80) return '#10b981'; // emerald-500
    if (value >= 60) return '#6366f1'; // indigo-500
    if (value >= 40) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };
  
  const chartData = candidates.slice(0, 10).map((c, i) => ({
    name: c.name || `Cand ${i+1}`,
    score: c.matchScore
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Top Candidates Score Distribution
        </h4>
        <div className="h-48 w-full bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{fontSize: 12}} domain={[0, 100]} />
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index, entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {candidates.map((candidate, idx) => (
          <div
            key={idx}
            className={`card border-l-4 transition-all duration-300 hover:shadow-md ${expandedId === idx ? 'border-l-blue-500 ring-2 ring-blue-100' : 'border-l-indigo-400'}`}
          >
            <div
              className="p-5 flex items-center justify-between cursor-pointer group"
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors flex-shrink-0">
                  {candidate.name ? getInitials(candidate.name) : <User size={22} />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg text-slate-800 truncate">{candidate.name || 'Unknown Candidate'}</h3>
                  <div className="flex flex-wrap items-center text-sm text-slate-500 mt-1 gap-x-4 gap-y-1.5">
                    {candidate.email && (
                      <a
                        href={`mailto:${candidate.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center hover:text-blue-600 transition-colors"
                        title={`Email ${candidate.email}`}
                      >
                        <Mail size={14} className="mr-1.5 flex-shrink-0 text-slate-400 group-hover:text-blue-500" />
                        <span className="truncate max-w-[220px] sm:max-w-none">{candidate.email}</span>
                      </a>
                    )}
                    {candidate.phone && (
                      <a
                        href={`tel:${candidate.phone.replace(/[^\d+]/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center hover:text-emerald-700 transition-colors font-medium text-slate-700"
                        title={`Call ${candidate.phone}`}
                      >
                        <Phone size={14} className="mr-1.5 flex-shrink-0 text-emerald-600 group-hover:text-emerald-700" />
                        <span className="tracking-wide select-all">{candidate.phone}</span>
                      </a>
                    )}
                  </div>
                  {candidate.missingSkills?.length > 0 && (
                    <div className="flex items-center mt-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                         {candidate.missingSkills.length} SKILLS MISSING
                       </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className={`text-3xl font-bold tracking-tight ${getScoreColor(candidate.matchScore)}`}>
                    {candidate.matchScore}%
                  </div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Match</div>
                </div>
                
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                  <div
                    className={`h-full rounded-full ${getProgressColor(candidate.matchScore)} transition-all duration-1000 ease-out`}
                    style={{ width: `${candidate.matchScore}%` }}
                  />
                </div>
              </div>
            </div>

            {expandedId === idx && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-fade-in-up">
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2 space-y-5">
                    
                    <div>
                      <h4 className="flex items-center font-medium text-slate-700 mb-2">
                        <Target size={16} className="text-emerald-500 mr-2" /> Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {candidate.detectedSkills && candidate.detectedSkills.length > 0 ? (
                          candidate.detectedSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-md shadow-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400 italic">No exact skill matches detected.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="flex items-center font-medium text-slate-700 mb-2">
                        <AlertTriangle size={16} className="text-amber-500 mr-2" /> Missing Skills (Gap)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {candidate.missingSkills && candidate.missingSkills.length > 0 ? (
                          candidate.missingSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-md border border-amber-200">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400 italic">All requested skills present.</span>
                        )}
                      </div>
                    </div>

                    {candidate.bonusSkills?.length > 0 && (
                      <div>
                        <h4 className="flex items-center font-medium text-slate-700 mb-2">
                          <Star size={16} className="text-purple-500 mr-2" /> Bonus Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {candidate.bonusSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-100 shadow-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-1/2">
                    <h4 className="flex items-center font-medium text-slate-700 mb-2">
                      <FileText size={16} className="text-blue-500 mr-2" /> Resume Snippet
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-600 h-36 overflow-y-auto leading-relaxed shadow-inner whitespace-pre-wrap font-mono select-text">
                      {candidate.resumeText ? candidate.resumeText : 'Text not available'}
                    </div>
                    
                    <div className="mt-4 flex space-x-3">
                      <a
                        href={
                          candidate.filePath
                            ? candidate.filePath.startsWith('http')
                              ? candidate.filePath                                          // Cloudinary / absolute URL
                              : `${API_BASE_URL}/${candidate.filePath.replace(/\\/g, '/')}` // local relative path
                            : '#'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center space-x-2 flex-1 btn-secondary text-sm h-10 hover:border-blue-400 hover:text-blue-600 transition-all"
                      >
                        <ExternalLink size={16} />
                        <span>
                          View Original {candidate.filePath?.toLowerCase().endsWith('.docx') ? 'DOCX' : candidate.filePath?.toLowerCase().endsWith('.doc') ? 'DOC' : 'PDF'}
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateList;
