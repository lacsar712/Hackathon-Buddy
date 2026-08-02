// import { useEffect, useState } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { projectAPI } from '../services/api';
// import ProjectCard from '../components/ProjectCard';
// import TagInput from '../components/TagInput';
// import { SKILL_SUGGESTIONS, INTEREST_SUGGESTIONS } from '../utils/helpers';

// const INITIAL_FORM = {
//   title: '', description: '', requiredSkills: [], interests: [], maxTeamSize: 5,
// };

// export default function Projects() {
//   const [searchParams] = useSearchParams();
//   const initialSkill = searchParams.get('skill') || '';

//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState(INITIAL_FORM);
//   const [submitting, setSubmitting] = useState(false);
//   const [search, setSearch] = useState(initialSkill);
//   const [error, setError] = useState('');

//   const load = async () => {
//     try {
//       const { data } = await projectAPI.getAll();
//       setProjects(data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { load(); }, []);

//   useEffect(() => {
//     const skillParam = searchParams.get('skill');
//     if (skillParam) {
//       setSearch(skillParam);
//     }
//   }, [searchParams]);

//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     setError('');
//     try {
//       await projectAPI.create(form);
//       setForm(INITIAL_FORM);
//       setShowForm(false);
//       load();
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to create project');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleJoin = async (id) => {
//     try {
//       await projectAPI.join(id);
//       load();
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to join');
//     }
//   };

//   const handleLeave = async (id) => {
//     try {
//       await projectAPI.leave(id);
//       load();
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to leave');
//     }
//   };

//   const filtered = projects.filter(
//     (p) =>
//       p.title.toLowerCase().includes(search.toLowerCase()) ||
//       p.description.toLowerCase().includes(search.toLowerCase()) ||
//       p.requiredSkills?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
//   );

//   return (
//     <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
//         <div>
//           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-2">
//             BUILD THE <br />
//             <span className="bg-modern-gradient bg-clip-text text-transparent">FUTURE</span> 🚀
//           </h1>
//           <p className="text-gray-500 font-medium">Discover projects or launch your own idea.</p>
//         </div>
        
//         <div className="flex items-center gap-3">
//           <div className="relative group flex-1 md:w-80">
//             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">🔍</div>
//             <input 
//               className="input pl-10 bg-hb-card" 
//               placeholder="Search by title or skills..."
//               value={search} 
//               onChange={(e) => setSearch(e.target.value)} 
//             />
//           </div>
//           <button 
//             onClick={() => setShowForm(!showForm)} 
//             className={`btn-primary px-8 flex-shrink-0 whitespace-nowrap ${showForm ? 'bg-red-500 hover:bg-red-400' : ''}`}
//           >
//             {showForm ? '✕ Cancel' : '+ New Project'}
//           </button>
//         </div>
//       </div>

//       {/* Create form */}
//       {showForm && (
//         <div className="card mb-12 border-hb-primary/30 shadow-glow-primary/5 bg-hb-card/90 backdrop-blur-3xl animate-slide-up">
//           <div className="flex items-center gap-3 mb-8">
//             <div className="w-10 h-10 rounded-2xl bg-modern-gradient flex items-center justify-center text-lg shadow-glow-primary">🛠️</div>
//             <h2 className="text-2xl font-black text-white tracking-tight uppercase">Launch Project</h2>
//           </div>
          
//           {error && (
//             <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider mb-6">{error}</div>
//           )}

//           <form onSubmit={handleCreate} className="space-y-6">
//             <div className="grid md:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Project Title</label>
//                   <input className="input" placeholder="e.g. AI-Powered Smart Home" required
//                     value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Description</label>
//                   <textarea className="input" rows={4} placeholder="Describe the problem you're solving..." required
//                     value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Team Requirements</label>
//                   <TagInput tags={form.requiredSkills} onChange={(v) => setForm({ ...form, requiredSkills: v })}
//                     suggestions={SKILL_SUGGESTIONS} placeholder="React, Python, Figma..." />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Domains</label>
//                   <TagInput tags={form.interests} onChange={(v) => setForm({ ...form, interests: v })}
//                     suggestions={INTEREST_SUGGESTIONS} placeholder="FinTech, AI, Health..." />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Max Team Size</label>
//                   <input type="number" className="input w-32" min={2} max={10}
//                     value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })} />
//                 </div>
//               </div>
//             </div>

//             <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-sm">
//               {submitting ? 'Broadcasting Idea...' : 'Create & Launch Project'}
//             </button>
//           </form>
//         </div>
//       )}

//       {/* Projects grid */}
//       {loading ? (
//         <div className="flex flex-col items-center justify-center py-32">
//           <div className="w-12 h-12 bg-hb-border rounded-2xl animate-spin border-t-2 border-hb-primary mb-4" />
//           <div className="text-xs font-black uppercase tracking-widest text-gray-600 animate-pulse">Scanning Grid...</div>
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="card text-center py-24 text-gray-600 border-dashed border-2">
//           <div className="text-6xl mb-6 opacity-10">🚀</div>
//           <p className="text-lg font-bold">No projects found on this frequency.</p>
//           <p className="text-sm mt-1 opacity-60">Be the first to launch an idea!</p>
//         </div>
//       ) : (
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {filtered.map((project) => (
//             <ProjectCard 
//               key={project._id} 
//               project={project} 
//               matchScore={project.matchScore}
//               matchedSkills={project.matchedSkills}
//               onJoin={handleJoin} 
//               onLeave={handleLeave} 
//               showRequests={true} 
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { projectAPI } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import TagInput from '../components/TagInput';
import { SKILL_SUGGESTIONS, INTEREST_SUGGESTIONS } from '../utils/helpers';

const INITIAL_FORM = {
  title: '', description: '', requiredSkills: [], interests: [], maxTeamSize: 5,
};

export default function Projects() {
  const [searchParams] = useSearchParams();
  const initialSkill = searchParams.get('skill') || '';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState(initialSkill);
  const [error, setError] = useState('');

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');

  const load = async () => {
    try {
      const { data } = await projectAPI.getAll();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const skillParam = searchParams.get('skill');
    if (skillParam) {
      setSearch(skillParam);
    }
  }, [searchParams]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await projectAPI.create(form);
      setForm(INITIAL_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleLeave = async (id) => {
    try {
      await projectAPI.leave(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave');
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.requiredSkills?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-2">
            BUILD THE <br />
            <span className="bg-modern-gradient bg-clip-text text-transparent">FUTURE</span> 🚀
          </h1>
          <p className="text-gray-500 font-medium">Discover projects or launch your own idea.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">🔍</div>
            <input 
              className="input pl-10 bg-hb-card" 
              placeholder="Search by title or skills..."
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className={`btn-primary px-8 flex-shrink-0 whitespace-nowrap ${showForm ? 'bg-red-500 hover:bg-red-400' : ''}`}
          >
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card mb-12 border-hb-primary/30 shadow-glow-primary/5 bg-hb-card/90 backdrop-blur-3xl animate-slide-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-modern-gradient flex items-center justify-center text-lg shadow-glow-primary">🛠️</div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Launch Project</h2>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider mb-6">{error}</div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Project Title</label>
                  <input className="input" placeholder="e.g. AI-Powered Smart Home" required
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Description</label>
                  <textarea className="input" rows={4} placeholder="Describe the problem you're solving..." required
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Team Requirements</label>
                  <TagInput tags={form.requiredSkills} onChange={(v) => setForm({ ...form, requiredSkills: v })}
                    suggestions={SKILL_SUGGESTIONS} placeholder="React, Python, Figma..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Domains</label>
                  <TagInput tags={form.interests} onChange={(v) => setForm({ ...form, interests: v })}
                    suggestions={INTEREST_SUGGESTIONS} placeholder="FinTech, AI, Health..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Max Team Size</label>
                  <input type="number" className="input w-32" min={2} max={10}
                    value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-sm">
              {submitting ? 'Broadcasting Idea...' : 'Create & Launch Project'}
            </button>
          </form>
        </div>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 bg-hb-border rounded-2xl animate-spin border-t-2 border-hb-primary mb-4" />
          <div className="text-xs font-black uppercase tracking-widest text-gray-600 animate-pulse">Scanning Grid...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-24 text-gray-600 border-dashed border-2">
          <div className="text-6xl mb-6 opacity-10">🚀</div>
          <p className="text-lg font-bold">No projects found on this frequency.</p>
          <p className="text-sm mt-1 opacity-60">Be the first to launch an idea!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((project) => (
            <ProjectCard 
              key={project._id} 
              project={project} 
              matchScore={project.matchScore}
              matchedSkills={project.matchedSkills}
              onJoin={handleJoinClick} 
              onLeave={handleLeave} 
              showRequests={true} 
            />
          ))}
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
