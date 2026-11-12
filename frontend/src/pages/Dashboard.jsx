import React, { useState, useEffect } from 'react';
import api from '../api';
import { UploadCloud, CheckCircle, RefreshCcw, Download, Trash2 } from 'lucide-react';
import JobDescription from '../components/JobDescription';
import UploadResume from '../components/UploadResume';
import CandidateList from '../components/CandidateList';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [activeJD, setActiveJD] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/rank-candidates');
      setCandidates(res.data.candidates || []);
      setActiveJD(res.data.jd || null);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.details || 'Failed to connect to backend server. Ensure the backend is running.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleJDSaved = async () => {
    await fetchCandidates();
  };

  const handleResumesUploaded = async () => {
    await fetchCandidates();
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all candidates?')) {
      try {
        await api.delete('/api/candidates');
        fetchCandidates();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Failed to clear candidates');
      }
    }
  };

  const handleExport = () => {
    if (candidates.length === 0) {
      alert('No candidates available to export.');
      return;
    }

    const headers = ['Rank', 'Name', 'Match Score (%)', 'Email', 'Phone', 'Detected Skills', 'Missing Skills', 'Bonus Skills', 'Original File'];
    const rows = candidates.map((c, i) => [
      i + 1,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.matchScore,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.detectedSkills || []).join(', ').replace(/"/g, '""')}"`,
      `"${(c.missingSkills || []).join(', ').replace(/"/g, '""')}"`,
      `"${(c.bonusSkills || []).join(', ').replace(/"/g, '""')}"`,
      `"${(c.originalName || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ranked_candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <JobDescription jd={activeJD} onSaved={handleJDSaved} />

          <div className="mt-8">
            <UploadResume onUploaded={handleResumesUploaded} disabled={!activeJD} />
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="glass-card p-6 min-h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                  Ranked Candidates
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Candidates are scored based on TF-IDF + Keyword Overlap with active Job Description
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={fetchCandidates}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Refresh"
                >
                  <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear all candidates"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 btn-secondary text-sm"
                  title="Export candidates to CSV"
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="text-red-700 font-bold hover:text-red-900 ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex-grow">
              {loading && candidates.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : candidates.length > 0 ? (
                <CandidateList candidates={candidates} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800">No candidates available</h3>
                  <p className="text-slate-500 mt-2 max-w-sm">
                    Upload a job description and resumes to see the AI-ranked candidate list here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
