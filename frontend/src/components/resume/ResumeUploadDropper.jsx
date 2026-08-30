import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertOctagon } from 'lucide-react';

const ResumeUploadDropper = ({ onUploadComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fileState, setFileState] = useState(null); // null, 'success', 'error'

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const simulateUpload = (file) => {
        setIsDragging(false);
        setIsUploading(true);
        setFileState(null);

        // Dummy processing logic
        setTimeout(() => {
            setIsUploading(false);
            setFileState('success');

            // Generate some fake OCR text output to pass upstream
            const pseudoOcrText = `John Doe \n Software Engineer \n Skills: React, Node.js, SQL, TypeScript \n Experience: 3 years building scalable architectures and microservices.`;
            onUploadComplete(file.name, pseudoOcrText);

        }, 2000);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            simulateUpload(droppedFile);
        } else {
            setIsDragging(false);
            setIsUploading(false);
            setFileState('error');
        }
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) simulateUpload(file);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300
                ${isDragging ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]' : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'}
                ${fileState === 'success' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
                ${fileState === 'error' ? 'border-red-500/50 bg-red-500/5' : ''}
                backdrop-blur-md overflow-hidden cursor-pointer
            `}
        >
            <input
                type="file"
                accept=".pdf"
                onChange={handleChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                disabled={isUploading}
            />

            <div className="relative z-0 flex flex-col items-center pointer-events-none text-center px-4">
                {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <div>
                            <p className="text-white font-bold tracking-wide">Executing OCR Sequence...</p>
                            <p className="text-indigo-400 text-sm">Extracting AST Nodes from PDF</p>
                        </div>
                    </div>
                ) : fileState === 'success' ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-emerald-400 font-bold text-lg">Document Parsed Successfully</p>
                            <p className="text-gray-400 text-sm">AST mapped. Ready for ATS scoring.</p>
                        </div>
                    </div>
                ) : fileState === 'error' ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertOctagon className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <p className="text-red-400 font-bold text-lg">Invalid File Type</p>
                            <p className="text-gray-400 text-sm">Please upload a valid PDF document.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 group">
                        <div className={`w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-indigo-400' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white mb-1">Drag & Drop Resume PDF</p>
                            <p className="text-gray-500 text-sm">Click to browse or drop your file here</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeUploadDropper;
