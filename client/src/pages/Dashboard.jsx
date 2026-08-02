// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { matchAPI, projectAPI } from '../services/api';
// import UserCard from '../components/UserCard';
// import ProjectCard from '../components/ProjectCard';

// export default function Dashboard() {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [topMatches, setTopMatches] = useState([]);
//   const [myProjects, setMyProjects] = useState([]);
//   const [recProjects, setRecProjects] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [matchRes, myProjRes, recProjRes] = await Promise.all([
//           matchAPI.getUsers(),
//           projectAPI.getMy(),
//           matchAPI.getProjects(),
//         ]);
//         setTopMatches(matchRes.data.slice(0, 3));
//         setMyProjects(myProjRes.data);
//         setRecProjects(recProjRes.data.slice(0, 3));
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   const handleJoin = async (id) => {
//     try {
//       await projectAPI.join(id);
//       const myProjRes = await projectAPI.getMy();
//       setMyProjects(myProjRes.data);
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to join');
//     }
//   };

//   const handleLeave = async (id) => {
//     try {
//       await projectAPI.leave(id);
//       const myProjRes = await projectAPI.getMy();
//       setMyProjects(myProjRes.data);
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to leave');
//     }
//   };

//   if (loading) return (
//     <div className="flex flex-col items-center justify-center h-[80vh] bg-hb-bg">
//       <div className="w-16 h-16 bg-modern-gradient rounded-3xl animate-spin shadow-glow-primary mb-6 flex items-center justify-center text-2xl">🚀</div>
//       <div className="text-xl font-black text-white tracking-widest animate-pulse uppercase">Syncing Workspace...</div>
//     </div>
//   );

//   const profileComplete = user?.skills?.length > 0 && user?.interests?.length > 0;

//   return (
//     <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
//       {/* Welcome Section */}
//       <div className="relative mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
//         <div>
//           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
//             WELCOME BACK, <br />
//             <span className="bg-modern-gradient bg-clip-text text-transparent">
//               {user?.name?.split(' ')[0].toUpperCase()}
//             </span> 👋
//           </h1>
//           <p className="text-gray-500 font-medium">Your hackathon command center is ready.</p>
//         </div>
        
//         {/* Profile Alert */}
//         {!profileComplete && (
//           <div className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl md:max-w-md">
//             <div className="text-2xl">⚠️</div>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-0.5">Profile Incomplete</p>
//               <p className="text-xs text-yellow-500/80">Add skills to boost your match scores.</p>
//             </div>
//             <button onClick={() => navigate('/profile')} className="btn-primary py-2 px-4 text-[10px] bg-yellow-600 hover:bg-yellow-500">
//               Fix Now
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
//         {[
//           { label: 'Skills Added', value: user?.skills?.length || 0, icon: '💡', color: 'text-hb-accent' },
//           { label: 'Domains', value: user?.interests?.length || 0, icon: '🎯', color: 'text-hb-primary' },
//           { label: 'Active Projects', value: myProjects.length, icon: '🛠️', color: 'text-hb-success' },
//           { label: 'Your Role', value: user?.role || '-', icon: '👤', color: 'text-indigo-400' },
//         ].map(({ label, value, icon, color }) => (
//           <div key={label} className="card group hover:-translate-y-1 transition-all">
//             <div className="text-2xl mb-3 flex items-center justify-between">
//               <span>{icon}</span>
//               <div className="w-1 h-8 rounded-full bg-hb-border" />
//             </div>
//             <div className={`text-2xl font-black ${color}`}>{value}</div>
//             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mt-1">{label}</div>
//           </div>
//         ))}
//       </div>

//       <div className="grid lg:grid-cols-2 gap-10">
//         {/* Top Matches Section */}
//         <section>
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-xl bg-modern-gradient flex items-center justify-center text-sm shadow-glow-primary">🎯</div>
//               <h2 className="text-xl font-black text-white tracking-tight uppercase">Top Teammates</h2>
//             </div>
//             <button onClick={() => navigate('/match')} className="text-[10px] font-black uppercase tracking-widest text-hb-primary hover:text-hb-accent transition-colors">
//               Discover All →
//             </button>
//           </div>
          
//           {topMatches.length === 0 ? (
//             <div className="card text-center py-16 text-gray-600 border-dashed border-2">
//               <div className="text-4xl mb-4 opacity-20">👥</div>
//               <p className="text-sm font-medium">No matches found. Try refining your skills!</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 gap-4">
//               {topMatches.map(({ user: u, score, breakdown, sharedSkills, sharedInterests }) => (
//                 <UserCard key={u._id} user={u} score={score} breakdown={breakdown}
//                   sharedSkills={sharedSkills} sharedInterests={sharedInterests} />
//               ))}
//             </div>
//           )}
//         </section>

//         {/* Recommended Projects Section */}
//         <section>
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-xl bg-modern-gradient flex items-center justify-center text-sm shadow-glow-primary">✨</div>
//               <h2 className="text-xl font-black text-white tracking-tight uppercase">Hot Projects</h2>
//             </div>
//             <button onClick={() => navigate('/projects')} className="text-[10px] font-black uppercase tracking-widest text-hb-primary hover:text-hb-accent transition-colors">
//               Explore All →
//             </button>
//           </div>
          
//           {recProjects.length === 0 ? (
//             <div className="card text-center py-16 text-gray-600 border-dashed border-2">
//               <div className="text-4xl mb-4 opacity-20">🛠️</div>
//               <p className="text-sm font-medium">No recommendations yet. Start hunting!</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 gap-4">
//               {recProjects.map(({ project, score, matchedSkills }) => (
//                 <ProjectCard key={project._id} project={project}
//                   matchScore={score} matchedSkills={matchedSkills} 
//                   onJoin={handleJoin} onLeave={handleLeave} showRequests={true} />
//               ))}
//             </div>
//           )}
//         </section>
//       </div>

//       {/* My Projects Grid */}
//       {myProjects.length > 0 && (
//         <section className="mt-16">
//           <div className="flex items-center gap-3 mb-8">
//             <div className="w-10 h-10 rounded-2xl bg-modern-gradient flex items-center justify-center text-lg shadow-glow-primary">🏗️</div>
//             <h2 className="text-2xl font-black text-white tracking-tight uppercase">My active Workspace</h2>
//           </div>
//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {myProjects.map((p) => (
//               <ProjectCard key={p._id} project={p} onJoin={handleJoin} onLeave={handleLeave} showRequests={true} />
//             ))}
//           </div>
//         </section>
//       )}
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { matchAPI, projectAPI } from '../services/api';
import UserCard from '../components/UserCard';
import ProjectCard from '../components/ProjectCard';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topMatches, setTopMatches] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [recProjects, setRecProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [matchRes, myProjRes, recProjRes] = await Promise.all([
          matchAPI.getUsers(),
          projectAPI.getMy(),
          matchAPI.getProjects(),
        ]);
        setTopMatches(matchRes.data.slice(0, 3));
        setMyProjects(myProjRes.data);
        setRecProjects(recProjRes.data.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleJoinClick = (id) => {
    setSelectedProjectId(id);
    setShowJoinModal(true);
  };

  const submitJoinRequest = async () => {
    try {
      setLoading(true);
      await projectAPI.join(selectedProjectId, { message: joinMessage });
      setShowJoinModal(false);
      setJoinMessage('');
      
      const myProjRes = await projectAPI.getMy();
      setMyProjects(myProjRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (id) => {
    try {
      await projectAPI.leave(id);
      const myProjRes = await projectAPI.getMy();
      setMyProjects(myProjRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] bg-hb-bg">
      <div className="w-16 h-16 bg-modern-gradient rounded-3xl animate-spin shadow-glow-primary mb-6 flex items-center justify-center text-2xl">🚀</div>
      <div className="text-xl font-black text-white tracking-widest animate-pulse uppercase">Syncing Workspace...</div>
    </div>
  );

  const profileComplete = user?.skills?.length > 0 && user?.interests?.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
            WELCOME BACK, <br />
            <span className="bg-modern-gradient bg-clip-text text-transparent">
              {user?.name?.split(' ')[0].toUpperCase()}
            </span> 👋
          </h1>
          <p className="text-gray-500 font-medium">Your hackathon command center is ready.</p>
        </div>
        
        {/* Profile Alert */}
        {!profileComplete && (
          <div className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl md:max-w-md">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-0.5">Profile Incomplete</p>
              <p className="text-xs text-yellow-500/80">Add skills to boost your match scores.</p>
            </div>
            <button onClick={() => navigate('/profile')} className="btn-primary py-2 px-4 text-[10px] bg-yellow-600 hover:bg-yellow-500">
              Fix Now
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Skills Added', value: user?.skills?.length || 0, icon: '💡', color: 'text-hb-accent' },
          { label: 'Domains', value: user?.interests?.length || 0, icon: '🎯', color: 'text-hb-primary' },
          { label: 'Active Projects', value: myProjects.length, icon: '🛠️', color: 'text-hb-success' },
          { label: 'Your Role', value: user?.role || '-', icon: '👤', color: 'text-indigo-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card group hover:-translate-y-1 transition-all">
            <div className="text-2xl mb-3 flex items-center justify-between">
              <span>{icon}</span>
              <div className="w-1 h-8 rounded-full bg-hb-border" />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Top Matches Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-modern-gradient flex items-center justify-center text-sm shadow-glow-primary">🎯</div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Top Teammates</h2>
            </div>
            <button onClick={() => navigate('/match')} className="text-[10px] font-black uppercase tracking-widest text-hb-primary hover:text-hb-accent transition-colors">
              Discover All →
            </button>
          </div>
          
          {topMatches.length === 0 ? (
            <div className="card text-center py-16 text-gray-600 border-dashed border-2">
              <div className="text-4xl mb-4 opacity-20">👥</div>
              <p className="text-sm font-medium">No matches found. Try refining your skills!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {topMatches.map(({ user: u, score, breakdown, sharedSkills, sharedInterests }) => (
                <UserCard key={u._id} user={u} score={score} breakdown={breakdown}
                  sharedSkills={sharedSkills} sharedInterests={sharedInterests} />
              ))}
            </div>
          )}
        </section>

        {/* Recommended Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-modern-gradient flex items-center justify-center text-sm shadow-glow-primary">✨</div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Hot Projects</h2>
            </div>
            <button onClick={() => navigate('/projects')} className="text-[10px] font-black uppercase tracking-widest text-hb-primary hover:text-hb-accent transition-colors">
              Explore All →
            </button>
          </div>
          
          {recProjects.length === 0 ? (
            <div className="card text-center py-16 text-gray-600 border-dashed border-2">
              <div className="text-4xl mb-4 opacity-20">🛠️</div>
              <p className="text-sm font-medium">No recommendations yet. Start hunting!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recProjects.map(({ project, score, matchedSkills }) => (
                <ProjectCard key={project._id} project={project}
                  matchScore={score} matchedSkills={matchedSkills} 
                  onJoin={handleJoinClick} onLeave={handleLeave} showRequests={true} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* My Projects Grid */}
      {myProjects.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-modern-gradient flex items-center justify-center text-lg shadow-glow-primary">🏗️</div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">My active Workspace</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProjects.map((p) => (
              <ProjectCard key={p._id} project={p} onJoin={handleJoinClick} onLeave={handleLeave} showRequests={true} />
            ))}
          </div>
        </section>
      )}

      {/* Join Request Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hb-bg/80 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full border-hb-primary/30 shadow-glow-primary/20 bg-hb-card animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-modern-gradient flex items-center justify-center text-lg shadow-glow-primary">✉️</div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Join Request</h2>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 font-medium">
              Tell the project owner why you're a great fit for this team.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Your Message</label>
                <textarea 
                  className="input" 
                  rows={4} 
                  placeholder="I'm interested in this project because..." 
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="btn-secondary flex-1 py-3 text-xs uppercase font-black"
              >
                Cancel
              </button>
              <button 
                onClick={submitJoinRequest}
                disabled={loading || !joinMessage.trim()}
                className="btn-primary flex-1 py-3 text-xs uppercase font-black"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
