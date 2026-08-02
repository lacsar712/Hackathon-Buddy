import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      login(data, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-hb-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-hb-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-hb-secondary/20 rounded-full blur-[100px] animate-pulse-slow" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group transition-transform hover:scale-105">
            <div className="w-12 h-12 bg-modern-gradient rounded-2xl flex items-center justify-center text-2xl shadow-glow-primary">
              🚀
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              HACKATHON<span className="text-hb-primary">BUDDY</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">WELCOME BACK</h1>
          <p className="text-gray-500 mt-2 font-medium">Continue your hackathon journey</p>
        </div>

        <div className="card shadow-glow-primary/5 border-hb-border/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider mb-6 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-sm">
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-hb-border/50 text-center">
            <p className="text-gray-500 text-sm font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-hb-primary font-bold hover:text-hb-accent transition-colors">
                Create One
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
