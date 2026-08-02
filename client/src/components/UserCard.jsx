import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

export default function UserCard({ user, score, breakdown, sharedSkills, sharedInterests }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const isMe = currentUser?._id === user._id;

  return (
    <div className="card hover:-translate-y-1 transition-all flex flex-col h-full relative group">
      {/* Background glow for high scores */}
      {score >= 70 && (
        <div className="absolute inset-0 bg-hb-primary/5 rounded-2xl -z-10 group-hover:bg-hb-primary/10 transition-colors" />
      )}

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-modern-gradient rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300" />
          <div className="relative w-14 h-14 rounded-full bg-hb-card border border-hb-border flex items-center justify-center text-xl font-black text-white shadow-inner">
            {getInitials(user.name)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-white truncate text-lg tracking-tight uppercase">{user.name}</h3>
          <div className="inline-block px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-hb-primary uppercase tracking-widest">
            {user.role || 'Full Stack'}
          </div>
        </div>

        {score !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black text-hb-primary leading-none tracking-tighter">{score}</div>
            <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">Match</div>
          </div>
        )}
      </div>

      {/* Score breakdown chips */}
      {breakdown && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: 'Skills', val: breakdown.skills, max: 50, color: 'text-hb-accent' },
            { label: 'Interests', val: breakdown.interests, max: 30, color: 'text-hb-secondary' },
            { label: 'Role', val: breakdown.role, max: 20, color: 'text-hb-success' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-hb-bg/50 border border-hb-border px-2 py-1 rounded-lg text-[9px] font-bold">
              <span className="text-gray-500 uppercase mr-1">{label}</span>
              <span className={color}>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed italic font-medium">"{user.bio}"</p>
      )}

      {/* Stats/Tags section */}
      <div className="space-y-4 mb-6">
        {sharedSkills?.length > 0 && (
          <div>
            <p className="text-[8px] font-black text-hb-success uppercase tracking-[0.2em] mb-2 ml-1 opacity-80">Common Ground</p>
            <div className="flex flex-wrap gap-1.5">
              {sharedSkills.map((s) => <span key={s} className="tag-green">{s}</span>)}
            </div>
          </div>
        )}

        {user.skills?.length > 0 && (
          <div>
            <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-1">Core Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.slice(0, 4).map((s) => <span key={s} className="tag">{s}</span>)}
              {user.skills.length > 4 && <span className="text-[10px] font-bold text-gray-700 ml-1 flex items-center">+{user.skills.length - 4} more</span>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto">
        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-hb-border/50 items-center justify-between">
          <div className="flex gap-3">
            {user.github && (
              <a href={user.github} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-hb-border/30 flex items-center justify-center text-gray-500 hover:text-white hover:bg-hb-border transition-all" title="GitHub">
                🐙
              </a>
            )}
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-hb-border/30 flex items-center justify-center text-gray-500 hover:text-white hover:bg-hb-border transition-all" title="LinkedIn">
                🔗
              </a>
            )}
          </div>
          
          {!isMe && (
            <button 
              onClick={() => navigate(`/chat/private/${user._id}`)}
              className="btn-primary py-2 px-4 text-[10px] lowercase"
            >
              💬 message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
