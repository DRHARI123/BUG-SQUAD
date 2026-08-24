import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-10 rounded-2xl max-w-md w-full border border-dark-800 shadow-card-dark flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-gradient-to-tr from-red-600/20 to-orange-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mb-5 text-red-400">
          <Construction className="w-8 h-8 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
          <Clock className="w-3.5 h-3.5" /> Phase 2 Feature
        </span>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The <span className="text-slate-200 font-medium">{title}</span> module is scheduled for development in the next phase of BUG SQUAD.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-dark-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
};

export default PlaceholderPage;
