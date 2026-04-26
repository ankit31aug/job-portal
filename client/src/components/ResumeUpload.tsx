import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { ParsedResume } from '../types';

interface ResumeUploadProps {
  onParsed?: (data: ParsedResume) => void;
  onFileSelected?: (file: File) => void;
  label?: string;
  parseOnly?: boolean;
}

export default function ResumeUpload({ onParsed, onFileSelected, label = 'Upload Resume', parseOnly = false }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selected: File) => {
    setError('');
    setParsed(false);
    setFile(selected);
    onFileSelected?.(selected);

    if (parseOnly || onParsed) {
      if (selected.type !== 'application/pdf') {
        setError('Only PDF files are supported for auto-fill. File attached but not parsed.');
        return;
      }

      setParsing(true);
      try {
        const formData = new FormData();
        formData.append('resume', selected);
        const { data } = await api.post('/resume/parse', formData);
        setParsed(true);
        onParsed?.(data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to parse resume');
      } finally {
        setParsing(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setParsed(false);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <Upload size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Drag & drop your resume here</p>
          <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX — Max 5MB</p>
          {onParsed && <p className="text-xs text-blue-600 mt-1 font-medium">📄 PDF resumes will auto-fill your form!</p>}
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleChange} className="hidden" />
        </div>
      ) : (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${parsed ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          <div className={`p-2 rounded-lg ${parsed ? 'bg-green-100' : 'bg-blue-100'}`}>
            {parsing ? <Loader2 size={20} className="text-blue-600 animate-spin" /> :
              parsed ? <CheckCircle size={20} className="text-green-600" /> :
              <FileText size={20} className="text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">
              {parsing ? 'Parsing resume and auto-filling form...' :
                parsed ? '✓ Form auto-filled from resume' :
                `${(file.size / 1024).toFixed(0)} KB`}
            </p>
          </div>
          {!parsing && (
            <button onClick={clearFile} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">⚠️ {error}</p>}
    </div>
  );
}
