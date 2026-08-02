// import { useEffect, useState } from 'react';
// import { projectAPI, matchAPI } from '../services/api';
// import UserCard from '../components/UserCard';
// import ProjectCard from '../components/ProjectCard';

// export default function Matching() {
//   const [tab, setTab] = useState('teammates');
//   const [userMatches, setUserMatches] = useState([]);
//   const [projectMatches, setProjectMatches] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const load = async () => {
//     try {
//       const [uRes, pRes] = await Promise.all([matchAPI.getUsers(), matchAPI.getProjects()]);
//       setUserMatches(uRes.data);
//       setProjectMatches(pRes.data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const handleJoin = async (id) => {
//     try {
//       await projectAPI.join(id);
//       load();
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to join');
//     }
//   };

//   if (loading) return (
//     <div className="flex flex-col items-center justify-center h-[80vh] bg-hb-bg">
//       <div className="w-16 h-16 bg-hb-card rounded-3xl animate-bounce shadow-glow-accent mb-6 flex items-center justify-center text-3xl">🧠</div>
//       <div className="text-xl font-black text-hb-accent tracking-widest animate-pulse uppercase">Analyzing Compatibility...</div>
//     </div>
//   );

//   return (
//     <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
//       <div className="mb-12">
//         <div className="inline-block px-4 py-1 rounded-full bg-hb-primary/10 border border-hb-primary/20 text-[10px] font-black uppercase tracking-widest text-hb-primary mb-4">
//           Proprietary Algorithm
//         </div>
//         <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-2">
//           SMART <span className="bg-modern-gradient bg-clip-text text-transparent">MATCHING</span>
//         </h1>
//         <p className="text-gray-500 font-medium">
//           Optimized by skills (50%), interests (30%), and role compatibility (20%)
//         </p>
//       </div>

//       {/* Algorithm explanation */}
//       <div className="card mb-12 border-hb-border/50 relative overflow-hidden group">
//         <div className="absolute top-0 right-0 w-32 h-32 bg-hb-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-hb-primary/10 transition-colors" />
        
//         <h3 className="text-xs font-black text-hb-accent uppercase tracking-[0.2em] mb-6">Internal Logic</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
//           {[
//             { label: 'Skills Match', weight: '50%', desc: 'Jaccard similarity on stack', icon: '💡' },
//             { label: 'Interests', weight: '30%', desc: 'Shared hackathon domains', icon: '🎯' },
//             { label: 'Role Compatibility', weight: '20%', desc: 'Complementary role scores', icon: '🤝' },
//           ].map(({ label, weight, desc, icon }) => (
//             <div key={label} className="bg-hb-bg rounded-2xl p-5 border border-hb-border hover:border-hb-primary/30 transition-all">
//               <div className="text-2xl mb-3">{icon}</div>
//               <div className="font-black text-white text-2xl mb-1">{weight}</div>
//               <div className="text-hb-primary text-[10px] font-black uppercase tracking-widest mb-2">{label}</div>
//               <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex items-center gap-3 mb-8 bg-hb-card p-1.5 rounded-2xl border border-hb-border w-fit">
//         {[
//           { id: 'teammates', label: `Teammates`, count: userMatches.length, icon: '👥' },
//           { id: 'projects', label: `Projects`, count: projectMatches.length, icon: '🛠️' },
//         ].map((t) => (
//           <button
//             key={t.id}
//             onClick={() => setTab(t.id)}
//             className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
//               tab === t.id 
//                 ? 'bg-modern-gradient text-white shadow-glow-primary' 
//                 : 'text-gray-500 hover:text-white hover:bg-hb-border/50'
//             }`}
//           >
//             <span>{t.icon}</span>
//             {t.label}
//             <span className={`ml-1 px-1.5 py-0.5 rounded-lg text-[8px] ${tab === t.id ? 'bg-white/20' : 'bg-hb-border'}`}>
//               {t.count}
//             </span>
//           </button>
//         ))}
//       </div>

//       {/* Teammate matches */}
//       {tab === 'teammates' && (
//         <div className="animate-slide-up">
//           {userMatches.length === 0 ? (
//             <div className="card text-center py-24 text-gray-600 border-dashed border-2">
//               <div className="text-5xl mb-6 opacity-10">👥</div>
//               <p className="text-lg font-bold uppercase tracking-tight">Zero matches detected.</p>
//               <p className="text-sm mt-1 opacity-60">Try expanding your skill profile!</p>
//             </div>
//           ) : (
//             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
//               {userMatches.map(({ user, score, breakdown, sharedSkills, sharedInterests }, i) => (
//                 <div key={user._id} className="relative group">
//                   {i === 0 && (
//                     <div className="absolute -top-3 -right-3 z-10 bg-hb-accent text-black text-[10px] font-black px-3 py-1 rounded-full shadow-glow-accent uppercase tracking-widest">
//                       Elite Match
//                     </div>
//                   )}
//                   <UserCard user={user} score={score} breakdown={breakdown}
//                     sharedSkills={sharedSkills} sharedInterests={sharedInterests} />
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Project matches */}
//       {tab === 'projects' && (
//         <div className="animate-slide-up">
//           {projectMatches.length === 0 ? (
//             <div className="card text-center py-24 text-gray-600 border-dashed border-2">
//               <div className="text-5xl mb-6 opacity-10">🛠️</div>
//               <p className="text-lg font-bold uppercase tracking-tight">No projects align with your profile.</p>
//               <p className="text-sm mt-1 opacity-60">Wait for more project launches!</p>
//             </div>
//           ) : (
//             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
//               {projectMatches.map(({ project, score, matchedSkills }) => (
//                 <ProjectCard key={project._id} project={project}
//                   matchScore={score} matchedSkills={matchedSkills} onJoin={handleJoin} />
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import { projectAPI, matchAPI } from '../services/api';
import UserCard from '../components/UserCard';
import ProjectCard from '../components/ProjectCard';

export default function Matching() {
  const [tab, setTab] = useState('teammates');
  const [userMatches, setUserMatches] = useState([]);
  const [projectMatches, setProjectMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [uRes, pRes] = await Promise.all([matchAPI.getUsers(), matchAPI.getProjects()]);
      setUserMatches(uRes.data);
      setProjectMatches(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleJoinClick = (id) => {
    setSelectedProjectId(id);
    setShowJoinModal(true);
  };

  const submitJoinRequest = async () => {
    try {
      setSubmitting(true);
      await projectAPI.join(selectedProjectId, { message: joinMessage });
      setShowJoinModal(false);
      setJoinMessage('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] bg-hb-bg">
      <div className="w-16 h-16 bg-hb-card rounded-3xl animate-bounce shadow-glow-accent mb-6 flex items-center justify-center text-3xl">🧠</div>
      <div className="text-xl font-black text-hb-accent tracking-widest animate-pulse uppercase">Analyzing Compatibility...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-12">
        <div className="inline-block px-4 py-1 rounded-full bg-hb-primary/10 border border-hb-primary/20 text-[10px] font-black uppercase tracking-widest text-hb-primary mb-4">
          Proprietary Algorithm
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-2">
          SMART <span className="bg-modern-gradient bg-clip-text text-transparent">MATCHING</span>
        </h1>
        <p className="text-gray-500 font-medium">
          Optimized by skills (50%), interests (30%), and role compatibility (20%)
        </p>
      </div>

      {/* Algorithm explanation */}
      <div className="card mb-12 border-hb-border/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-hb-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-hb-primary/10 transition-colors" />
        
        <h3 className="text-xs font-black text-hb-accent uppercase tracking-[0.2em] mb-6">Internal Logic</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { label: 'Skills Match', weight: '50%', desc: 'Jaccard similarity on stack', icon: '💡' },
            { label: 'Interests', weight: '30%', desc: 'Shared hackathon domains', icon: '🎯' },
            { label: 'Role Compatibility', weight: '20%', desc: 'Complementary role scores', icon: '🤝' },
          ].map(({ label, weight, desc, icon }) => (
            <div key={label} className="bg-hb-bg rounded-2xl p-5 border border-hb-border hover:border-hb-primary/30 transition-all">
              <div className="text-2xl mb-3">{icon}</div>
              <div className="font-black text-white text-2xl mb-1">{weight}</div>
              <div className="text-hb-primary text-[10px] font-black uppercase tracking-widest mb-2">{label}</div>
              <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8 bg-hb-card p-1.5 rounded-2xl border border-hb-border w-fit">
        {[
          { id: 'teammates', label: `Teammates`, count: userMatches.length, icon: '👥' },
          { id: 'projects', label: `Projects`, count: projectMatches.length, icon: '🛠️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
              tab === t.id 
                ? 'bg-modern-gradient text-white shadow-glow-primary' 
                : 'text-gray-500 hover:text-white hover:bg-hb-border/50'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-lg text-[8px] ${tab === t.id ? 'bg-white/20' : 'bg-hb-border'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Teammate matches */}
      {tab === 'teammates' && (
        <div className="animate-slide-up">
          {userMatches.length === 0 ? (
            <div className="card text-center py-24 text-gray-600 border-dashed border-2">
              <div className="text-5xl mb-6 opacity-10">👥</div>
              <p className="text-lg font-bold uppercase tracking-tight">Zero matches detected.</p>
              <p className="text-sm mt-1 opacity-60">Try expanding your skill profile!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {userMatches.map(({ user, score, breakdown, sharedSkills, sharedInterests }, i) => (
                <div key={user._id} className="relative group">
                  {i === 0 && (
                    <div className="absolute -top-3 -right-3 z-10 bg-hb-accent text-black text-[10px] font-black px-3 py-1 rounded-full shadow-glow-accent uppercase tracking-widest">
                      Elite Match
                    </div>
                  )}
                  <UserCard user={user} score={score} breakdown={breakdown}
                    sharedSkills={sharedSkills} sharedInterests={sharedInterests} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project matches */}
      {tab === 'projects' && (
        <div className="animate-slide-up">
          {projectMatches.length === 0 ? (
            <div className="card text-center py-24 text-gray-600 border-dashed border-2">
              <div className="text-5xl mb-6 opacity-10">🛠️</div>
              <p className="text-lg font-bold uppercase tracking-tight">No projects align with your profile.</p>
              <p className="text-sm mt-1 opacity-60">Wait for more project launches!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projectMatches.map(({ project, score, matchedSkills }) => (
                <ProjectCard key={project._id} project={project}
                  matchScore={score} matchedSkills={matchedSkills} onJoin={handleJoinClick} />
              ))}
            </div>
          )}
        </div>
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
                disabled={submitting || !joinMessage.trim()}
                className="btn-primary flex-1 py-3 text-xs uppercase font-black"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}