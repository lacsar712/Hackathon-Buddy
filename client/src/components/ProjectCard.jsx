// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { formatDate, getInitials } from '../utils/helpers';
// import { projectAPI, githubAPI } from '../services/api';
// import { useState, useEffect } from 'react';

// export default function ProjectCard({ project: initialProject, onJoin, onLeave, matchScore, matchedSkills, showRequests = false }) {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [project, setProject] = useState(initialProject);
//   const [actionLoading, setActionLoading] = useState(false);

//   useEffect(() => {
//     setProject(initialProject);
//   }, [initialProject]);

//   const isMember = project.teamMembers?.some(
//     (m) => (m._id || m) === user?._id
//   );
//   const isPending = project.pendingRequests?.some(
//     (m) => (m._id || m) === user?._id
//   );
//   const isCreator = (project.createdBy?._id || project.createdBy) === user?._id;
//   const isFull = project.teamMembers?.length >= project.maxTeamSize;

//   const handleLinkRepo = async () => {
//     const repoUrl = prompt('Enter GitHub Repository URL (e.g., https://github.com/user/repo):');
//     if (!repoUrl) return;

//     try {
//       const parts = repoUrl.replace('https://github.com/', '').split('/');
//       if (parts.length < 2) throw new Error('Invalid URL format');

//       const repoOwner = parts[0];
//       const repoName = parts[1];

//       setActionLoading(true);
//       const res = await githubAPI.linkRepo({
//         projectId: project._id,
//         repoName,
//         repoOwner,
//         repoUrl
//       });
//       setProject(res.data);
//       alert('GitHub repository linked successfully!');
//     } catch (err) {
//       alert('Failed to link repository. Please check the URL.');
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleApprove = async (userId) => {
//     try {
//       setActionLoading(true);
//       const res = await projectAPI.approve(project._id, userId);
//       setProject(res.data);
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || 'Failed to approve');
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleReject = async (userId) => {
//     try {
//       setActionLoading(true);
//       const res = await projectAPI.reject(project._id, userId);
//       setProject(res.data);
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || 'Failed to reject');
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   return (
//     <div className="card hover:-translate-y-1 transition-all flex flex-col h-full relative group overflow-hidden">
//       {/* Background glow for matched projects */}
//       {matchScore !== undefined && matchScore >= 70 && (
//         <div className="absolute top-0 right-0 w-32 h-32 bg-hb-primary/10 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-hb-primary/20 transition-colors" />
//       )}

//       {/* Header */}
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           {matchScore !== undefined && (
//             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-2">
//               <span className="w-1 h-1 rounded-full bg-hb-primary animate-pulse" />
//               <span className="text-[9px] font-black text-hb-primary uppercase tracking-widest">{matchScore}% compatible</span>
//             </div>
//           )}
//           <h3 className="text-xl font-black text-white tracking-tight uppercase leading-[1.1]">{project.title}</h3>
//         </div>
//       </div>

//       <p className="text-gray-500 text-xs mb-6 flex-1 line-clamp-3 leading-relaxed font-medium">{project.description}</p>

//       {/* Tags section */}
//       <div className="space-y-4 mb-6">
//         {matchedSkills?.length > 0 && (
//           <div>
//             <p className="text-[8px] font-black text-hb-success uppercase tracking-[0.2em] mb-2 ml-1">Requirement Match</p>
//             <div className="flex flex-wrap gap-1.5">
//               {matchedSkills.map((s) => <span key={s} className="tag-green">{s}</span>)}
//             </div>
//           </div>
//         )}

//         {project.requiredSkills?.length > 0 && (
//           <div>
//             <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-1">Looking For</p>
//             <div className="flex flex-wrap gap-1.5">
//               {project.requiredSkills.map((s) => <span key={s} className="tag">{s}</span>)}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Team preview Section */}
//       <div className="bg-hb-bg/50 border border-hb-border rounded-2xl p-4 mb-6">
//         <div className="flex items-center justify-between mb-3">
//           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active Roster</p>
//           <div className="flex items-center gap-1.5">
//             <span className={`text-[10px] font-black ${isFull ? 'text-red-400' : 'text-hb-accent'}`}>
//               {project.teamMembers?.length || 0} / {project.maxTeamSize}
//             </span>
//             <div className="w-20 h-1.5 bg-hb-border rounded-full overflow-hidden">
//               <div 
//                 className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-hb-accent shadow-glow-accent'}`}
//                 style={{ width: `${((project.teamMembers?.length || 0) / project.maxTeamSize) * 100}%` }}
//               />
//             </div>
//           </div>
//         </div>

//         <div className="flex -space-x-3">
//           {project.teamMembers?.slice(0, 5).map((m, i) => (
//             <div key={i} title={m.name} className="relative group/avatar">
//               <div className="absolute -inset-0.5 bg-modern-gradient rounded-full blur opacity-0 group-hover/avatar:opacity-100 transition duration-300" />
//               <div className="relative w-8 h-8 rounded-full bg-hb-card border-2 border-hb-bg flex items-center justify-center text-[10px] font-black text-white">
//                 {getInitials(m.name || '?')}
//               </div>
//             </div>
//           ))}
//           {project.teamMembers?.length > 5 && (
//             <div className="relative w-8 h-8 rounded-full bg-hb-border border-2 border-hb-bg flex items-center justify-center text-[8px] font-black text-gray-500">
//               +{project.teamMembers.length - 5}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Pending Requests - For Owner only */}
//       {isCreator && showRequests && project.pendingRequests?.length > 0 && (
//         <div className="mb-6 p-4 bg-hb-primary/5 rounded-2xl border border-hb-primary/10">
//           <div className="flex items-center justify-between mb-3">
//              <p className="text-[9px] font-black text-hb-primary uppercase tracking-widest">Join Requests ({project.pendingRequests.length})</p>
//           </div>
//           <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
//             {project.pendingRequests.map((reqUser) => (
//               <div key={reqUser._id} className="flex items-center justify-between bg-hb-bg/50 p-2 rounded-xl border border-hb-border/50">
//                 <div className="flex items-center gap-2">
//                   <div className="w-6 h-6 rounded-lg bg-modern-gradient flex items-center justify-center text-[8px] font-black text-white">
//                     {getInitials(reqUser.name)}
//                   </div>
//                   <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{reqUser.name}</span>
//                 </div>
//                 <div className="flex gap-1.5">
//                   <button 
//                     disabled={actionLoading}
//                     onClick={() => handleApprove(reqUser._id)}
//                     className="w-6 h-6 rounded-lg bg-hb-success/20 text-hb-success hover:bg-hb-success hover:text-white transition-all text-xs flex items-center justify-center"
//                     title="Approve"
//                   >
//                     ✓
//                   </button>
//                   <button 
//                     disabled={actionLoading}
//                     onClick={() => handleReject(reqUser._id)}
//                     className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center"
//                     title="Reject"
//                   >
//                     ✕
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Footer Actions */}
//       <div className="mt-auto">
//         <div className="flex items-center justify-between pt-4 border-t border-hb-border/50">
//           <div className="flex flex-col">
//             <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Architect</span>
//             <span className="text-[10px] font-bold text-gray-400 truncate max-w-[100px]">{project.createdBy?.name || 'Anonymous'}</span>
//           </div>

//           <div className="flex gap-2">
//             {isMember && (
//               <>
//                 <button
//                   onClick={() => navigate(`/editor/${project._id}`)}
//                   className="w-9 h-9 rounded-xl bg-hb-primary/10 hover:bg-hb-primary text-hb-primary hover:text-white flex items-center justify-center transition-all border border-hb-primary/20"
//                   title="Collaborative Editor"
//                 >
//                   💻
//                 </button>
//                 <button
//                   onClick={() => navigate(`/chat/${project._id}`)}
//                   className="w-9 h-9 rounded-xl bg-hb-border/50 hover:bg-white text-gray-400 hover:text-black flex items-center justify-center transition-all border border-hb-border"
//                   title="Project Chat"
//                 >
//                   💬
//                 </button>
//               </>
//             )}
            
//             {isCreator && !project.githubRepoName && (
//               <button
//                 onClick={handleLinkRepo}
//                 disabled={actionLoading}
//                 className="btn-secondary py-2 px-4 text-[10px] uppercase font-black"
//               >
//                 Link Git
//               </button>
//             )}

//             {!isCreator && !isMember && !isPending && !isFull && onJoin && (
//               <button 
//                 onClick={() => onJoin(project._id)} 
//                 className="btn-primary py-2 px-6 text-[10px]"
//               >
//                 Apply
//               </button>
//             )}

//             {!isCreator && !isMember && isPending && (
//               <div className="px-4 py-2 rounded-full bg-hb-border/50 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-hb-border italic">
//                 Awaiting Approval
//               </div>
//             )}

//             {isCreator && (
//               <div className="px-3 py-1.5 rounded-xl bg-modern-gradient/10 border border-hb-primary/20 text-hb-primary text-[10px] font-black uppercase tracking-widest">
//                 Admin
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate, getInitials } from '../utils/helpers';
import { projectAPI, githubAPI } from '../services/api';
import { useState, useEffect } from 'react';

export default function ProjectCard({ project: initialProject, onJoin, onLeave, matchScore, matchedSkills, showRequests = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(initialProject);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const isMember = project.teamMembers?.some(
    (m) => (m._id || m) === user?._id
  );
  const isPending = project.pendingRequests?.some(
    (req) => (req.user?._id || req.user) === user?._id
  );
  const isCreator = (project.createdBy?._id || project.createdBy) === user?._id;
  const isFull = project.teamMembers?.length >= project.maxTeamSize;

  const handleLinkRepo = async () => {
    const repoUrl = prompt('Enter GitHub Repository URL (e.g., https://github.com/user/repo):');
    if (!repoUrl) return;

    try {
      const parts = repoUrl.replace('https://github.com/', '').split('/');
      if (parts.length < 2) throw new Error('Invalid URL format');

      const repoOwner = parts[0];
      const repoName = parts[1];

      setActionLoading(true);
      const res = await githubAPI.linkRepo({
        projectId: project._id,
        repoName,
        repoOwner,
        repoUrl
      });
      setProject(res.data);
      alert('GitHub repository linked successfully!');
    } catch (err) {
      alert('Failed to link repository. Please check the URL.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(true);
      const res = await projectAPI.approve(project._id, userId);
      setProject(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId) => {
    try {
      setActionLoading(true);
      const res = await projectAPI.reject(project._id, userId);
      setProject(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="card hover:-translate-y-1 transition-all flex flex-col h-full relative group overflow-hidden">
      {/* Background glow for matched projects */}
      {matchScore !== undefined && matchScore >= 70 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-hb-primary/10 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-hb-primary/20 transition-colors" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {matchScore !== undefined && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-2">
              <span className="w-1 h-1 rounded-full bg-hb-primary animate-pulse" />
              <span className="text-[9px] font-black text-hb-primary uppercase tracking-widest">{matchScore}% compatible</span>
            </div>
          )}
          <h3 className="text-xl font-black text-white tracking-tight uppercase leading-[1.1]">{project.title}</h3>
        </div>
      </div>

      <p className="text-gray-500 text-xs mb-6 flex-1 line-clamp-3 leading-relaxed font-medium">{project.description}</p>

      {/* Tags section */}
      <div className="space-y-4 mb-6">
        {matchedSkills?.length > 0 && (
          <div>
            <p className="text-[8px] font-black text-hb-success uppercase tracking-[0.2em] mb-2 ml-1">Requirement Match</p>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((s) => <span key={s} className="tag-green">{s}</span>)}
            </div>
          </div>
        )}

        {project.requiredSkills?.length > 0 && (
          <div>
            <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-1">Looking For</p>
            <div className="flex flex-wrap gap-1.5">
              {project.requiredSkills.map((s) => <span key={s} className="tag">{s}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* Team preview Section */}
      <div className="bg-hb-bg/50 border border-hb-border rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active Roster</p>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-black ${isFull ? 'text-red-400' : 'text-hb-accent'}`}>
              {project.teamMembers?.length || 0} / {project.maxTeamSize}
            </span>
            <div className="w-20 h-1.5 bg-hb-border rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-hb-accent shadow-glow-accent'}`}
                style={{ width: `${((project.teamMembers?.length || 0) / project.maxTeamSize) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex -space-x-3">
          {project.teamMembers?.slice(0, 5).map((m, i) => (
            <div key={i} title={m.name} className="relative group/avatar">
              <div className="absolute -inset-0.5 bg-modern-gradient rounded-full blur opacity-0 group-hover/avatar:opacity-100 transition duration-300" />
              <div className="relative w-8 h-8 rounded-full bg-hb-card border-2 border-hb-bg flex items-center justify-center text-[10px] font-black text-white">
                {getInitials(m.name || '?')}
              </div>
            </div>
          ))}
          {project.teamMembers?.length > 5 && (
            <div className="relative w-8 h-8 rounded-full bg-hb-border border-2 border-hb-bg flex items-center justify-center text-[8px] font-black text-gray-500">
              +{project.teamMembers.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Pending Requests - For Owner only */}
      {isCreator && showRequests && project.pendingRequests?.length > 0 && (
        <div className="mb-6 p-4 bg-hb-primary/5 rounded-2xl border border-hb-primary/10">
          <div className="flex items-center justify-between mb-3">
             <p className="text-[9px] font-black text-hb-primary uppercase tracking-widest">Join Requests ({project.pendingRequests.length})</p>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {project.pendingRequests.map((request) => (
              <div key={request.user?._id || request.user} className="flex flex-col bg-hb-bg/50 p-3 rounded-xl border border-hb-border/50 gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-modern-gradient flex items-center justify-center text-[8px] font-black text-white">
                      {getInitials(request.user?.name || '?')}
                    </div>
                    <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{request.user?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      disabled={actionLoading}
                      onClick={() => handleApprove(request.user?._id || request.user)}
                      className="w-6 h-6 rounded-lg bg-hb-success/20 text-hb-success hover:bg-hb-success hover:text-white transition-all text-xs flex items-center justify-center"
                      title="Approve"
                    >
                      ✓
                    </button>
                    <button 
                      disabled={actionLoading}
                      onClick={() => handleReject(request.user?._id || request.user)}
                      className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center"
                      title="Reject"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {request.aiSummary && (
                  <div className="flex flex-col gap-1.5 bg-hb-card/50 p-2.5 rounded-lg border border-hb-primary/20">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7px] font-black text-hb-primary uppercase tracking-[0.2em]">Smart Fit Analysis</span>
                      <div className="h-[1px] flex-1 bg-hb-primary/10" />
                    </div>
                    <div className="text-[9px] text-gray-400 font-medium leading-relaxed italic">
                      "{request.aiSummary}"
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-auto">
        <div className="flex items-center justify-between pt-4 border-t border-hb-border/50">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Architect</span>
            <span className="text-[10px] font-bold text-gray-400 truncate max-w-[100px]">{project.createdBy?.name || 'Anonymous'}</span>
          </div>

          <div className="flex gap-2">
            {isMember && (
              <>
                <button
                  onClick={() => navigate(`/editor/${project._id}`)}
                  className="w-9 h-9 rounded-xl bg-hb-primary/10 hover:bg-hb-primary text-hb-primary hover:text-white flex items-center justify-center transition-all border border-hb-primary/20"
                  title="Collaborative Editor"
                >
                  💻
                </button>
                <button
                  onClick={() => navigate(`/chat/${project._id}`)}
                  className="w-9 h-9 rounded-xl bg-hb-border/50 hover:bg-white text-gray-400 hover:text-black flex items-center justify-center transition-all border border-hb-border"
                  title="Project Chat"
                >
                  💬
                </button>
              </>
            )}
            
            {isCreator && !project.githubRepoName && (
              <button
                onClick={handleLinkRepo}
                disabled={actionLoading}
                className="btn-secondary py-2 px-4 text-[10px] uppercase font-black"
              >
                Link Git
              </button>
            )}

            {!isCreator && !isMember && !isPending && !isFull && onJoin && (
              <button 
                onClick={() => onJoin(project._id)} 
                className="btn-primary py-2 px-6 text-[10px]"
              >
                Apply
              </button>
            )}

            {!isCreator && !isMember && isPending && (
              <div className="px-4 py-2 rounded-full bg-hb-border/50 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-hb-border italic">
                Awaiting Approval
              </div>
            )}

            {isCreator && (
              <div className="px-3 py-1.5 rounded-xl bg-modern-gradient/10 border border-hb-primary/20 text-hb-primary text-[10px] font-black uppercase tracking-widest">
                Admin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
