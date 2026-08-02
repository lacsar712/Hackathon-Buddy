import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import TagInput from '../components/TagInput';
import { ROLES, SKILL_SUGGESTIONS, INTEREST_SUGGESTIONS } from '../utils/helpers';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    role: user?.role || 'Full Stack',
    bio: user?.bio || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    skills: user?.skills || [],
    interests: user?.interests || [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await userAPI.updateProfile(form);
      updateProfile(data);
      setMessage({ type: 'success', text: 'Profile updated successfully! 🚀' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-modern-gradient flex items-center justify-center text-2xl shadow-glow-primary">
          👤
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Identity Hub</h1>
          <p className="text-gray-500 font-medium">Manage your public profile and hacker stack.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="card sticky top-24 text-center">
            <div className="w-24 h-24 rounded-full bg-hb-bg border-4 border-hb-border mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 bg-modern-gradient opacity-10" />
               {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-white text-lg">{user?.name}</h3>
            <p className="text-hb-primary text-xs font-black uppercase tracking-widest mt-1">{user?.role}</p>
            
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-xs font-black uppercase tracking-wider border ${
                message.type === 'success' ? 'bg-hb-success/10 border-hb-success/30 text-hb-success' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Full Name</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Primary Role</label>
                  <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Short Bio</label>
                <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                  placeholder="What makes you a great teammate?" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">GitHub Profile</label>
                  <input className="input" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">LinkedIn Profile</label>
                  <input className="input" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-hb-border">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-hb-primary mb-3 ml-1">Technical Stack</label>
                  <TagInput tags={form.skills} onChange={set('skills')} suggestions={SKILL_SUGGESTIONS} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-hb-accent mb-3 ml-1">Interests & Domains</label>
                  <TagInput tags={form.interests} onChange={set('interests')} suggestions={INTEREST_SUGGESTIONS} />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={loading} className="btn-primary w-full py-4 shadow-glow-primary/20">
                  {loading ? 'Propagating Changes...' : 'Save Profile Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
