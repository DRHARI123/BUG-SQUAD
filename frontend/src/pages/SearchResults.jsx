import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import searchService from '../services/searchService';
import { Search, Bug, FileCheck, Layers, PlayCircle, Tag, Folder } from 'lucide-react';
import toast from 'react-hot-toast';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState({ bugs: [], testCases: [], requirements: [], projects: [], testPlans: [], testRuns: [], releases: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, [queryParam]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const data = await searchService.globalSearch(searchTerm);
      setResults(data);
    } catch (err) {
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-red-500" /> Global Search Results
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Categorized search results for <span className="text-red-400 font-mono font-bold">"{queryParam}"</span>
        </p>
      </div>

      {/* Big Search Bar */}
      <form onSubmit={handleSearchSubmit} className="glass-card p-4 rounded-xl border border-dark-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search Bugs (BUG-0001), Requirements (REQ-0001), Test Cases, Projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red"
        >
          Search
        </button>
      </form>

      {/* Results Container */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.total === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-3">
          <Search className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Matching Results Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Try searching for ticket IDs (e.g. BUG-0001, TC-0001) or title keywords.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bugs Category */}
          {results.bugs?.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-500" /> Defect Tickets ({results.bugs.length})
              </h3>
              <div className="divide-y divide-dark-800/60">
                {results.bugs.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => navigate(`/bugs/${b._id}`)}
                    className="py-2.5 flex items-center justify-between hover:bg-dark-800/40 px-2 rounded-lg cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-red-400">{b.bugId}</span>
                      <span className="text-white font-medium">{b.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-800 text-slate-300 border border-dark-700">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Cases Category */}
          {results.testCases?.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Test Cases ({results.testCases.length})
              </h3>
              <div className="divide-y divide-dark-800/60">
                {results.testCases.map((tc) => (
                  <div
                    key={tc._id}
                    onClick={() => navigate(`/test-cases/${tc._id}`)}
                    className="py-2.5 flex items-center justify-between hover:bg-dark-800/40 px-2 rounded-lg cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-red-400">{tc.testCaseId}</span>
                      <span className="text-white font-medium">{tc.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-800 text-slate-300 border border-dark-700">
                      {tc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements Category */}
          {results.requirements?.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" /> Requirements ({results.requirements.length})
              </h3>
              <div className="divide-y divide-dark-800/60">
                {results.requirements.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => navigate(`/requirements/${r._id}`)}
                    className="py-2.5 flex items-center justify-between hover:bg-dark-800/40 px-2 rounded-lg cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-red-400">{r.requirementId}</span>
                      <span className="text-white font-medium">{r.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-800 text-slate-300 border border-dark-700">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
