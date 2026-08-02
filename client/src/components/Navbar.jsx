import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userSkill = user?.skills?.[0] || '';
  const contributePath = `/projects?skill=${encodeURIComponent(userSkill)}`;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/match', label: 'Matching', icon: '🎯' },
    { path: '/projects', label: 'Projects', icon: '🛠️' },
    { path: '/hackathons', label: 'Hackathons', icon: '🧑‍💻' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (link) => {
    if (location.pathname === link.path) return true;
    if (link.activePaths?.includes(location.pathname) && !new URLSearchParams(location.search).get('skill')) {
        // Only return true for projects if no skill filter is active or if we are exactly on the path
        return false; 
    }
    // Simple logic for highlighting
    if (link.label === 'Contribute' && location.pathname === '/projects' && location.search.includes('skill')) return true;
    if (link.label === 'Projects' && location.pathname === '/projects' && !location.search.includes('skill')) return true;
    
    return location.pathname === link.path;
  };

  return (
    <nav className="sticky top-0 z-[100] px-4 py-3">
      <div className="max-w-7xl mx-auto glass rounded-2xl border border-hb-border/50 px-6 py-3 flex items-center justify-between shadow-glow-primary/5">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="w-8 h-8 bg-modern-gradient rounded-lg flex items-center justify-center text-sm shadow-glow-primary">
            🚀
          </div>
          <span className="text-lg font-black tracking-tighter text-white">
            HACKATHON<span className="text-hb-primary group-hover:text-hb-accent transition-colors">BUDDY</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                isActive({path, label})
                  ? 'nav-link-active bg-hb-primary/10'
                  : 'hover:bg-hb-border/30 hover:text-white'
              }`}
            >
              <span className="text-xs">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* User avatar + logout */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end mr-1">
            <span className="text-xs font-bold text-white leading-none mb-0.5">{user?.name}</span>
            <span className="text-[10px] text-hb-accent font-black uppercase tracking-widest">{user?.role || 'Hacker'}</span>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-modern-gradient rounded-full blur opacity-30 group-hover:opacity-100 transition duration-300" />
            <Link to="/profile" className="relative w-10 h-10 rounded-full bg-hb-card border border-hb-border flex items-center justify-center text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95">
              {getInitials(user?.name)}
            </Link>
          </div>

          <button 
            onClick={handleLogout} 
            className="w-10 h-10 rounded-xl bg-hb-border/30 hover:bg-red-500/10 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all duration-300 border border-transparent hover:border-red-500/20"
            title="Logout"
          >
            <span className="text-lg">👋</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden mt-3 glass rounded-xl border border-hb-border/50 flex overflow-x-auto custom-scrollbar no-scrollbar">
        {navLinks.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex-1 text-center py-3 px-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              isActive({path, label}) 
                ? 'text-hb-primary bg-hb-primary/10 border-b-2 border-hb-primary' 
                : 'text-gray-500'
            }`}
          >
            <div className="mb-1 text-sm">{icon}</div>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
