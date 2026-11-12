import React, { useState } from 'react';
import api from '../api';
import { Target, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const JobDescription = ({ jd, onSaved }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text) return;
    
    setLoading(true);
    try {
      await api.post('/api/job-description', { text });
      setText('');
      onSaved();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.details || error.response?.data?.error || 'Failed to save Job Description';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card mb-6">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Target size={20} />
          </div>
          <h3 className="font-semibold text-lg text-slate-800">Job Description</h3>
        </div>
        {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </div>
      
      {expanded && (
        <div className="p-5">
          {jd ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="text-green-500 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-green-800">Active JD Set</h4>
                  <p className="text-sm text-green-700 mt-1 line-clamp-2">{jd.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {jd.extractedSkills?.slice(0, 5).map((skill, index) => (
                      <span key={index} className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-md">
                        {skill}
                      </span>
                    ))}
                    {jd.extractedSkills?.length > 5 && (
                      <span className="text-xs font-medium text-green-700 mt-1">
                        +{jd.extractedSkills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-4">
              Paste your target job description here to initiate AI ranking.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <textarea
              className="input-field min-h-[160px] resize-none text-sm leading-relaxed"
              placeholder="Paste Job Description text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-primary w-full mt-4 flex justify-center items-center h-11"
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Set New Job Description</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default JobDescription;
