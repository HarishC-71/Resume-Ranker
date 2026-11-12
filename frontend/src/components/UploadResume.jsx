import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api';
import { FileText, UploadCloud, X, Loader2 } from 'lucide-react';

const UploadResume = ({ onUploaded, disabled }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = (acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    disabled: disabled || uploading,
  });

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('resumes', file));

    setUploading(true);
    setProgress(10);
    try {
      await api.post('/api/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });
      setFiles([]);
      onUploaded();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.details || error.response?.data?.error || 'Failed to process resumes';
      alert(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={`glass-card p-6 ${disabled ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
      <h3 className="font-semibold text-lg text-slate-800 mb-4 flex items-center">
        <FileText size={20} className="text-indigo-600 mr-2" />
        Upload Resumes
      </h3>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        } ${disabled ? 'pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <UploadCloud size={32} />
        </div>
        <p className="text-slate-700 font-medium text-lg">
          {isDragActive ? 'Drop resumes here...' : 'Drag & Drop resumes'}
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Supports PDF, DOCX (Max 10 files)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {files.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 truncate">
                <FileText size={18} className="text-indigo-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          className="btn-primary w-full mt-6 flex justify-center items-center h-12 shadow-indigo-200 shadow-lg text-lg font-semibold relative overflow-hidden"
          disabled={uploading}
        >
          {uploading ? (
            <div className="flex items-center">
              <Loader2 className="animate-spin mr-2" size={20} />
              Processing Resumes... {progress}%
            </div>
          ) : (
            `Upload ${files.length} Resume${files.length > 1 ? 's' : ''}`
          )}
        </button>
      )}

      {disabled && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm text-center">
          Please add a Job Description first to enable uploads.
        </div>
      )}
    </div>
  );
};

export default UploadResume;
