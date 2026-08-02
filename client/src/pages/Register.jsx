import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TagInput from '../components/TagInput';
import { ROLES, SKILL_SUGGESTIONS, INTEREST_SUGGESTIONS } from '../utils/helpers';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'Full Stack', bio: '', github: '', linkedin: '',
    skills: [], interests: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      login(data, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-hb-bg py-12 px-4 relative overflow-hidden flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-hb-primary/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-hb-secondary/10 rounded-full blur-[100px] animate-pulse-slow" />

      <div className="w-full max-w-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 group transition-transform hover:scale-105">
            <div className="w-12 h-12 bg-modern-gradient rounded-2xl flex items-center justify-center text-2xl shadow-glow-primary">
              🚀
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              HACKATHON<span className="text-hb-primary">BUDDY</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">JOIN THE CLUB</h1>
          <p className="text-gray-500 mt-2 font-medium">Create your profile to get matched</p>
        </div>

        <div className="card shadow-glow-primary/5 border-hb-border/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-hb-primary mb-4 ml-1">Identity</h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Full Name</label>
                  <input className="input" placeholder="Jane Doe" required
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Email</label>
                  <input className="input" type="email" placeholder="jane@example.com" required
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Password</label>
                  <input className="input" type="password" placeholder="Min 6 chars" required minLength={6}
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Primary Role</label>
                  <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Skills and interests */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-hb-accent mb-4 ml-1">Stack</h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Tech Skills</label>
                  <TagInput tags={form.skills} onChange={set('skills')} suggestions={SKILL_SUGGESTIONS} placeholder="React, Node..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Project Domains</label>
                  <TagInput tags={form.interests} onChange={set('interests')} suggestions={INTEREST_SUGGESTIONS} placeholder="AI, Web3..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">GitHub URL</label>
                  <input className="input" placeholder="https://github.com/..." value={form.github}
                    onChange={(e) => setForm({ ...form, github: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-sm">
                {loading ? 'Creating Account...' : 'Initialize Profile'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-hb-border/50 text-center">
            <p className="text-gray-500 text-sm font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-hb-primary font-bold hover:text-hb-accent transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
