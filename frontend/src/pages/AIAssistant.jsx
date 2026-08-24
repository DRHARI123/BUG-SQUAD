import React, { useState, useEffect, useRef } from 'react';
import aiService from '../services/aiService';
import projectService from '../services/projectService';
import { Bot, Send, Sparkles, Copy, Check, RefreshCw, Cpu, User } from 'lucide-react';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your **Bug Squad AI QA Assistant**. How can I help you analyze defect tickets, generate test cases, or evaluate release risks today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [usage, setUsage] = useState({ dailyCount: 0, dailyLimit: 50 });
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      const [projRes, usageRes] = await Promise.all([
        projectService.getProjects(),
        aiService.getAIUsage(),
      ]);
      setProjects(projRes.projects || projRes || []);
      setUsage(usageRes || { dailyCount: 0, dailyLimit: 50 });
    } catch (err) {}
  };

  const handleSendMessage = async (customMessage) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat({
        message: textToSend,
        project: selectedProject,
      });

      const aiMsg = {
        sender: 'ai',
        text: res.response || 'I analyzed your query.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI service error.');
      const errMsg = {
        sender: 'ai',
        text: '⚠️ **AI Service Error**: ' + (err.response?.data?.message || 'Unable to process request at this moment.'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPrompts = [
    'Generate test cases for authentication login feature',
    'Explain common root causes for HTTP 504 gateway timeout bugs',
    'How do I calculate requirement traceability coverage?',
    'Suggest security test scenarios for credit card payment checkout',
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-500 animate-pulse" /> AI QA Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent QA co-pilot for defect analysis, test scenario generation, and risk mitigation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Usage Badge */}
          <div className="px-3 py-1.5 bg-dark-900 border border-dark-800 rounded-xl flex items-center gap-2 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">Daily Requests:</span>
            <span className="text-white font-bold">{usage.dailyCount} / {usage.dailyLimit}</span>
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="">All Project Contexts</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.projectCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 glass-card p-4 md:p-6 rounded-2xl border border-dark-800 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-red-600 to-orange-500 text-white shadow-glow-red'
                  : 'bg-dark-800 text-red-400 border border-dark-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 relative group ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-tr-none'
                  : 'bg-dark-900 border border-dark-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] opacity-70">
                <span>{msg.time}</span>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleCopyText(msg.text, idx)}
                    className="hover:text-white flex items-center gap-1 font-mono transition-colors"
                  >
                    {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-xs text-slate-400 py-2">
            <div className="w-6 h-6 rounded-lg bg-dark-800 flex items-center justify-center text-red-400 animate-spin">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <span>AI QA Assistant is analyzing telemetry and formulating response...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {quickPrompts.map((promptText, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(promptText)}
            className="px-3 py-1.5 bg-dark-900 hover:bg-dark-850 text-slate-300 border border-dark-800 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="truncate max-w-xs">{promptText}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="glass-card p-3 rounded-2xl border border-dark-800 flex items-center gap-3 shrink-0">
        <input
          type="text"
          placeholder="Ask AI Assistant to analyze a bug, generate test cases, or inspect release risks..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" /> Send
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
