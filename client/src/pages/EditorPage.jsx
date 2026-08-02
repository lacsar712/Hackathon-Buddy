import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { githubAPI, projectAPI } from '../services/api';
import CodeEditor from '../components/CodeEditor';
import FileExplorer from '../components/FileExplorer';
import EditorChat from '../components/EditorChat';

export default function EditorPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  
  const socketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const projRes = await projectAPI.getAll(); 
        const currentProj = projRes.data.find(p => p._id === projectId);
        
        if (!currentProj) {
          setError('Project not found');
          return;
        }
        
        setProject(currentProj);

        const socketBase = import.meta.env.VITE_SOCKET_URL || undefined;
        socketRef.current = io(socketBase ? `${socketBase}/editor` : '/editor');
        socketRef.current.emit('join_editor', projectId);

        socketRef.current.on('code_update', ({ path, content }) => {
          if (activeFile?.path === path) {
            setCode(content);
          }
        });

        if (currentProj.githubRepoName) {
          loadFiles();
        }
      } catch (err) {
        console.error(err);
        setError('Failed to initialize editor');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [projectId]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.off('code_update');
      socketRef.current.on('code_update', ({ path, content }) => {
        if (activeFile?.path === path) {
          setCode(content);
        }
      });
    }
  }, [activeFile]);

  const loadFiles = async (path = '') => {
    try {
      const res = await githubAPI.getFiles(projectId, path);
      const newFiles = res.data;

      if (path === '') {
        setFiles(newFiles);
      } else {
        // Update the tree recursively
        setFiles(prevFiles => {
          const updateTree = (items) => {
            return items.map(item => {
              if (item.path === path) {
                return { ...item, children: newFiles };
              }
              if (item.children) {
                return { ...item, children: updateTree(item.children) };
              }
              return item;
            });
          };
          return updateTree(prevFiles);
        });
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 500) {
        setError('Connect your GitHub account to access files.');
      }
    }
  };

  const handleFileSelect = async (file) => {
    if (file.type === 'dir') {
      // If children not loaded yet, load them
      if (!file.children) {
        loadFiles(file.path);
      }
      return;
    }

    try {
      setLoading(true);
      setActiveFile(file);
      const res = await githubAPI.getFileContent(projectId, file.path);
      // Decoded content might be complex if it's binary or very large, but for text:
      const decodedContent = atob(res.data.content.replace(/\n/g, ''));
      setCode(decodedContent);
      setActiveFile({ ...file, sha: res.data.sha });
      setCommitMessage(`Update ${file.name}`);
    } catch (err) {
      console.error(err);
      alert('Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socketRef.current && activeFile) {
      socketRef.current.emit('code_change', { 
        projectId, 
        path: activeFile.path, 
        content: newCode 
      });
    }
  };

  const handlePull = async () => {
    if (!activeFile) return;
    try {
      setLoading(true);
      const res = await githubAPI.getFileContent(projectId, activeFile.path);
      const decodedContent = atob(res.data.content.replace(/\n/g, ''));
      setCode(decodedContent);
      setActiveFile({ ...activeFile, sha: res.data.sha });
      if (socketRef.current) {
        socketRef.current.emit('code_change', { 
          projectId, 
          path: activeFile.path, 
          content: decodedContent 
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      const msg = commitMessage.trim() || `Update ${activeFile.name}`;
      const res = await githubAPI.updateFile({
        projectId,
        path: activeFile.path,
        content: code,
        message: msg,
        sha: activeFile.sha
      });
      setActiveFile({ ...activeFile, sha: res.data.content.sha });
      setCommitMessage(`Update ${activeFile.name}`);
      alert('File pushed to GitHub! 🚀');
    } catch (err) {
      console.error(err);
      alert('Failed to push file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileCreate = async (filename) => {
    try {
      setLoading(true);
      const res = await githubAPI.updateFile({
        projectId,
        path: filename,
        content: '// New file created',
        message: `Create ${filename}`,
      });
      await loadFiles();
      const newFileObj = {
        name: filename,
        path: filename,
        type: 'file',
        sha: res.data.content.sha
      };
      setActiveFile(newFileObj);
      setCode('// New file created');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGithub = () => {
    githubAPI.login(user._id);
    window.addEventListener('message', (event) => {
      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        window.location.reload();
      }
    }, { once: true });
  };

  if (loading && !project) return (
    <div className="flex flex-col items-center justify-center h-screen bg-hb-bg">
      <div className="w-12 h-12 bg-hb-border rounded-xl animate-spin border-b-2 border-hb-primary mb-4" />
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Mounting Workspace...</div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-hb-bg overflow-hidden animate-fade-in">
      {/* Sidebar - File Explorer */}
      <FileExplorer 
        files={files} 
        onFileSelect={handleFileSelect} 
        activeFile={activeFile} 
        onRefresh={() => loadFiles()}
        onFileCreate={handleFileCreate}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-hb-border/50">
        {/* Toolbar */}
        <div className="bg-hb-card/50 border-b border-hb-border/50 px-6 py-3 flex justify-between items-center shrink-0 backdrop-blur-xl">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-hb-bg flex items-center justify-center border border-hb-border text-xs">🛠️</div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-white font-black text-xs truncate uppercase tracking-tight">{project?.title}</h2>
              {activeFile && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-hb-accent shrink-0 uppercase tracking-widest">
                  <span className="text-gray-600">/</span>
                  <span className="truncate">{activeFile.path}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!user.githubAccessToken && (
              <button 
                onClick={handleConnectGithub}
                className="text-[9px] font-black uppercase tracking-widest bg-hb-border/50 hover:bg-hb-primary/10 text-hb-primary py-2 px-4 rounded-lg border border-hb-primary/20 transition-all"
              >
                Sync GitHub
              </button>
            )}
            
            {activeFile && (
              <>
                <button 
                  onClick={handlePull}
                  disabled={isSaving}
                  className="w-9 h-9 rounded-lg bg-hb-border/30 hover:bg-hb-border text-gray-400 hover:text-white flex items-center justify-center transition-all border border-hb-border/50"
                  title="Pull latest changes"
                >
                  ⬇️
                </button>
                <div className="flex items-center bg-hb-bg border border-hb-border rounded-xl overflow-hidden focus-within:border-hb-primary/50 transition-all shadow-inner">
                  <input 
                    type="text"
                    placeholder="COMMIT MSG..."
                    className="bg-transparent text-[10px] font-black text-white px-4 py-2 outline-none w-40 placeholder-gray-700 uppercase"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-modern-gradient text-white py-2 px-4 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-glow-primary/20 h-full"
                  >
                    {isSaving ? '...' : 'Push ⚡'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative bg-[#0d0d15]">
          {error && (
            <div className="absolute inset-0 z-20 bg-hb-bg/95 backdrop-blur-md flex items-center justify-center p-12 text-center animate-fade-in">
              <div className="max-w-md">
                <div className="text-4xl mb-6">🐙</div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">{error}</h3>
                {error.includes('Connect') && (
                  <button onClick={handleConnectGithub} className="btn-primary py-4 px-10 text-xs">Authorize GitHub Access</button>
                )}
              </div>
            </div>
          )}
          
          {!activeFile && !error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-gray-700 animate-pulse">
              <div className="text-5xl mb-6 opacity-20">📂</div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Select Resource from Grid</p>
              {!project?.githubRepoName && (
                <p className="text-[9px] mt-4 text-hb-primary/40 font-bold uppercase tracking-widest">No Repository Linked to Project</p>
              )}
            </div>
          )}

          <div className="h-full w-full opacity-90">
            <CodeEditor 
              code={code} 
              onChange={handleCodeChange} 
              language={activeFile?.name?.endsWith('.css') ? 'css' : activeFile?.name?.endsWith('.html') ? 'html' : activeFile?.name?.endsWith('.json') ? 'json' : 'javascript'} 
            />
          </div>
        </div>
      </div>

      {/* Sidebar - Chat */}
      <EditorChat projectId={projectId} projectName={project?.title} />
    </div>
  );
}
