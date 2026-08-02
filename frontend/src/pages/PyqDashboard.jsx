import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Upload, AlertCircle, RefreshCw, CheckCircle, PieChart as PieChartIcon,
  TrendingUp, Award, HelpCircle, Layers, Calendar, Filter, ArrowLeft, ArrowUpRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, Legend
} from 'recharts';
import API from '../services/api';
import LeatherBoard from '../components/dashboard/LeatherBoard';
import VintagePaper from '../components/dashboard/VintagePaper';
import ThemeToggle from '../components/ThemeToggle';

const COLORS = ['#8B4513', '#D4AF37', '#2563EB', '#059669', '#7C3AED', '#DB2777', '#D97706', '#4B5563'];

const PyqDashboard = () => {
  const navigate = useNavigate();

  // State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [pyqList, setPyqList] = useState([]);
  const [selectedPyq, setSelectedPyq] = useState(null);
  
  // Upload form state
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isTimeout, setIsTimeout] = useState(false);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        if (res.data?.data) {
          setSubjects(res.data.data);
          if (res.data.data.length > 0) {
            setUploadSubjectId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch PYQs list
  const fetchPyqs = async () => {
    try {
      const url = selectedSubjectId ? `/pyqs?subjectId=${selectedSubjectId}` : '/pyqs';
      const res = await API.get(url);
      if (res.data?.data) {
        setPyqList(res.data.data);
        if (res.data.data.length > 0 && !selectedPyq) {
          setSelectedPyq(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch PYQs:', err);
    }
  };

  useEffect(() => {
    fetchPyqs();
  }, [selectedSubjectId]);

  // Handle Drag & Drop / File Select
  const handleFileChange = (e) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setUploadError('Please upload a valid PDF document.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploadError(null);
    setIsTimeout(false);
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== 'application/pdf' && !droppedFile.name.endsWith('.pdf')) {
        setUploadError('Please upload a valid PDF document.');
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }
      setUploadError(null);
      setIsTimeout(false);
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Upload handler
  const handleUploadAndAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setUploadError('Please select a PDF file.');
      return;
    }
    if (!uploadSubjectId) {
      setUploadError('Please select a subject.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setIsTimeout(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('year', year);
      formData.append('subjectId', uploadSubjectId);

      const res = await API.post('/pyqs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const newPyq = res.data?.data;
      if (newPyq) {
        setSelectedPyq(newPyq);
        fetchPyqs();
      }
      setFile(null);
      setTitle('');
    } catch (err) {
      console.error('Upload PYQ error:', err);
      const isTimeoutErr =
        err.code === 'ECONNABORTED' ||
        err.response?.status === 408 ||
        err.response?.status === 504 ||
        err.response?.data?.error?.toLowerCase().includes('timed out');

      if (isTimeoutErr) {
        setIsTimeout(true);
        setUploadError('PYQ analysis timed out. Click Retry to re-trigger.');
      } else {
        setUploadError(err.response?.data?.error || 'Failed to upload and analyze PYQ paper.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Prepared data for visualization
  const analysisData = selectedPyq?.analysisResults || null;

  const pieChartData = analysisData?.chapterWeightage
    ? analysisData.chapterWeightage.map((ch) => ({
        name: ch.chapterName,
        value: typeof ch.weightage === 'number' ? ch.weightage : parseFloat(ch.weightage) || 10,
      }))
    : [];

  const importantTopics = analysisData?.importantTopics || [];
  const repeatedQuestions = analysisData?.repeatedQuestions || [];
  const trendAnalysis = analysisData?.trendAnalysis || 'No trend analysis available yet for this paper.';

  return (
    <LeatherBoard>
      <div className="pl-4 md:pl-16 pr-4 lg:pr-8 py-8 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-black/20 pb-6 gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-sm text-amber-200/80 hover:text-amber-100 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Main Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gold-foil font-playfair tracking-tight flex items-center gap-3">
              <PieChartIcon className="w-10 h-10 text-yellow-500" />
              PYQ Intelligence & Analysis
            </h1>
            <p className="text-amber-100/70 text-sm md:text-base font-playfair mt-1">
              Upload Previous Year Question Papers to unlock AI chapter weightage, topic frequency, & trend insights.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        {/* --- MAIN GRID: UPLOADER & PAPER SELECTOR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Uploader Card */}
          <VintagePaper className="lg:col-span-2 shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center gap-2">
              <Upload className="w-6 h-6 text-yellow-700" /> Upload Question Paper (PDF)
            </h2>

            {uploadError && (
              <div className={`p-3 mb-4 rounded border flex items-center justify-between text-sm ${
                isTimeout
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
                {isTimeout && (
                  <button
                    onClick={handleUploadAndAnalyze}
                    disabled={isUploading}
                    className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleUploadAndAnalyze} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    value={uploadSubjectId}
                    onChange={(e) => setUploadSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-neutral-800 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                    disabled={isUploading}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Paper Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Endterm 2025"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-neutral-800 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                    disabled={isUploading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-neutral-800 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-neutral-400 rounded-lg p-6 text-center bg-amber-50/50 hover:bg-amber-100/50 transition-colors cursor-pointer relative"
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={isUploading}
                />
                <FileText className="w-10 h-10 mx-auto text-yellow-800 mb-2" />
                {file ? (
                  <p className="text-sm font-semibold text-amber-900">
                    Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      Drag & Drop your question paper PDF here, or <span className="text-amber-800 font-bold underline">Browse</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">Supports PDF files up to 10MB</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 font-bold text-sm rounded shadow hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Analyze PYQ
                    </>
                  )}
                </button>
              </div>
            </form>
          </VintagePaper>

          {/* PYQ Papers List */}
          <VintagePaper className="lg:col-span-1 shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col">
            <h2 className="text-xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-800" /> Exam Papers
              </span>
              <span className="text-xs font-normal text-neutral-600">({pyqList.length})</span>
            </h2>

            <div className="mb-3">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-neutral-800 text-xs focus:outline-none"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-60">
              {pyqList.length === 0 ? (
                <p className="text-xs text-neutral-500 italic text-center py-6">
                  No PYQs analyzed yet. Upload one above!
                </p>
              ) : (
                pyqList.map((pyq) => {
                  const isSelected = selectedPyq?.id === pyq.id;
                  return (
                    <div
                      key={pyq.id}
                      onClick={() => setSelectedPyq(pyq)}
                      className={`p-3 rounded border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-800 text-white border-amber-900 shadow-md'
                          : 'bg-white hover:bg-amber-100/60 border-neutral-300 text-neutral-800'
                      }`}
                    >
                      <p className="font-bold text-sm truncate">{pyq.title}</p>
                      <div className="flex justify-between items-center text-xs mt-1 opacity-80">
                        <span>Year: {pyq.year}</span>
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/10">
                          {pyq.analyzed ? 'Analyzed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </VintagePaper>
        </div>

        {/* --- VISUALIZATION & INSIGHTS SECTION --- */}
        {selectedPyq && (
          <div className="space-y-8">
            
            {/* Row 1: Pie Chart & AI Trend Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Recharts Chapter Weightage Pie Chart */}
              <VintagePaper className="shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                <h3 className="text-xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-amber-800" /> Chapter Weightage Breakdown
                </h3>
                <div className="h-64 w-full" style={{ minHeight: '260px' }}>
                  {pieChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-neutral-500 italic">
                      No chapter weightage data available for this paper.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <PieTooltip formatter={(val) => [`${val}% Weightage`, 'Chapter']} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </VintagePaper>

              {/* AI Exam Trend Card */}
              <VintagePaper className="shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col">
                <h3 className="text-xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-700" /> AI Exam Trend Summary
                </h3>
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-sm flex-1 font-inter text-neutral-800 text-sm leading-relaxed space-y-3">
                  <p className="font-medium text-amber-900 italic">
                    Analysis for: <span className="font-bold font-playfair underline">{selectedPyq.title}</span> ({selectedPyq.year})
                  </p>
                  <p className="whitespace-pre-line text-neutral-700">{trendAnalysis}</p>
                </div>
              </VintagePaper>
            </div>

            {/* Row 2: Important Topics & Repeated Questions Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Important Topics with Frequency Badges */}
              <VintagePaper className="shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                <h3 className="text-xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-800" /> Important Topics & Frequency
                </h3>

                {importantTopics.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4">No topic frequency data extracted.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-800">
                      <thead className="bg-neutral-200/80 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-2.5">Topic Name</th>
                          <th className="p-2.5">Importance</th>
                          <th className="p-2.5 text-right">Frequency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-300">
                        {importantTopics.map((item, idx) => (
                          <tr key={idx} className="hover:bg-amber-100/40">
                            <td className="p-2.5 font-semibold text-neutral-900">{item.topicName}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.importance?.toLowerCase() === 'high'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : item.importance?.toLowerCase() === 'medium'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-green-100 text-green-800 border border-green-300'
                              }`}>
                                {item.importance || 'Medium'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-bold text-amber-900">
                              {item.frequency ? `${item.frequency}x` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </VintagePaper>

              {/* Repeated Questions */}
              <VintagePaper className="shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                <h3 className="text-xl font-bold font-playfair text-neutral-900 mb-4 border-b border-neutral-400 pb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-800" /> Frequently Repeated Questions
                </h3>

                {repeatedQuestions.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4">No repeated question patterns detected.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {repeatedQuestions.map((rq, idx) => (
                      <div key={idx} className="p-3 bg-white border border-neutral-300 rounded text-xs text-neutral-800">
                        <p className="font-semibold text-neutral-900">{rq.questionText}</p>
                        {rq.years && (
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">Appeared in:</span>
                            {Array.isArray(rq.years) ? (
                              rq.years.map((y, yi) => (
                                <span key={yi} className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  {y}
                                </span>
                              ))
                            ) : (
                              <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                {rq.years}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </VintagePaper>
            </div>
          </div>
        )}
      </div>
    </LeatherBoard>
  );
};

export default PyqDashboard;
