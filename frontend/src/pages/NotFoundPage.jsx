import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, ArrowLeft, LayoutDashboard } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6 text-slate-100">
      <div className="glass-card max-w-lg w-full p-8 rounded-2xl border border-dark-800 shadow-card-dark text-center space-y-6">
        {/* Logo & 404 Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red font-extrabold text-2xl">
            <Bug className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono font-bold rounded-full">
            ERROR 404 - NOT FOUND
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Page Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            The route or resource you requested does not exist in the Bug Squad QA platform or may have been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
