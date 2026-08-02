import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-hb-bg overflow-x-hidden relative">
      {/* Abstract Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-modern-gradient rounded-xl flex items-center justify-center text-xl shadow-glow-primary">
            🚀
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            HACKATHON<span className="text-hb-primary">BUDDY</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/register" className="btn-primary py-2 px-6">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-hb-border/50 border border-hb-border text-[10px] font-black uppercase tracking-[0.2em] text-hb-accent mb-6 animate-fade-in">
          Connect · Build · Ship
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] mb-8 animate-slide-up">
          FIND YOUR <br />
          <span className="bg-modern-gradient bg-clip-text text-transparent">IDEAL TEAM</span> <br />
          IN SECONDS
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-12 animate-slide-up opacity-0 [animation-delay:0.2s] [animation-fill-mode:forwards]">
          The ultimate platform for hackers. Match with compatible teammates based on 
          skills, interests, and role compatibility. Collaborative coding & GitHub integration included.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up opacity-0 [animation-delay:0.4s] [animation-fill-mode:forwards]">
          <Link to="/register" className="btn-primary py-4 px-10 text-lg">
            Create Your Profile
          </Link>
          <Link to="/login" className="btn-secondary py-4 px-10 text-lg">
            Explore Projects
          </Link>
        </div>

        {/* Feature Preview Card */}
        <div className="mt-32 w-full max-w-5xl animate-slide-up opacity-0 [animation-delay:0.6s] [animation-fill-mode:forwards]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-modern-gradient rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-hb-card rounded-[2rem] border border-hb-border p-4 md:p-8 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {[
                  { title: 'Smart Matching', desc: 'AI-driven teammate discovery based on real project needs.', icon: '🧠' },
                  { title: 'Live Editor', desc: 'Real-time collaborative workspace with built-in team chat.', icon: '💻' },
                  { title: 'Git Sync', desc: 'Push code directly to your GitHub repo without leaving the tab.', icon: '🐙' },
                ].map((f, i) => (
                  <div key={i} className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl shadow-inner">
                      {f.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-hb-border py-12 text-center text-gray-600 text-sm">
        &copy; 2026 HackathonBuddy. Made for Hackers.
      </footer>
    </div>
  );
}
