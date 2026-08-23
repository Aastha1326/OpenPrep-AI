import React, { useState } from 'react';
import { X, Building, Briefcase, MapPin, DollarSign, Calendar } from 'lucide-react';

const JobApplicationForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        companyName: initialData?.companyName || '',
        roleTitle: initialData?.roleTitle || '',
        location: initialData?.location || '',
        status: initialData?.status || 'Wishlist',
        expectedSalary: initialData?.expectedSalary || '',
        applicationUrl: initialData?.applicationUrl || '',
        colorTag: initialData?.colorTag || '#3b82f6'
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const COLOR_OPTIONS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-gray-900 border border-white/20 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header Gradient */}
                <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {initialData ? 'Update Application' : 'New Job Application'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Company & Role */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Building className="w-4 h-4 text-blue-400" /> Company Name
                                </label>
                                <input
                                    required
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-purple-400" /> Role Title
                                </label>
                                <input
                                    required
                                    name="roleTitle"
                                    value={formData.roleTitle}
                                    onChange={handleChange}
                                    placeholder="e.g. Software Engineer"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                                />
                            </div>
                        </div>

                        {/* Location & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-400" /> Location / Type
                                </label>
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Remote, NYC, etc."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-yellow-400" /> Current Phase
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-yellow-500 appearance-none"
                                >
                                    <option value="Wishlist">Wishlist</option>
                                    <option value="Applied">Applied</option>
                                    <option value="Interviewing">Interviewing</option>
                                    <option value="Offered">Offered</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        {/* Salary and Link */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-400" /> Expected Salary
                                </label>
                                <input
                                    type="number"
                                    name="expectedSalary"
                                    value={formData.expectedSalary}
                                    onChange={handleChange}
                                    placeholder="$100k"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>

                        </div>

                        {/* Color Selector */}
                        <div className="pt-2">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Card Highlight Color</label>
                            <div className="flex gap-3">
                                {COLOR_OPTIONS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, colorTag: color }))}
                                        className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 ${formData.colorTag === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 border-none' : 'border border-white/20'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                {initialData ? 'Save Changes' : 'Add Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobApplicationForm;
