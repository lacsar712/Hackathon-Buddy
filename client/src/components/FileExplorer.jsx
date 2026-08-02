import React, { useState } from 'react';

/**
 * VS Code style File Explorer with Folder Support
 */
export default function FileExplorer({ files, onFileSelect, activeFile, onRefresh, onFileCreate }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newFileName.trim() || !onFileCreate) return;
    onFileCreate(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderFileItem = (file, depth = 0) => {
    const isExpanded = expandedFolders[file.path];
    const isActive = activeFile?.path === file.path;

    return (
      <div key={file.path}>
        <div
          onClick={() => {
            if (file.type === 'dir') {
              toggleFolder(file.path);
              onFileSelect(file); // This will trigger loading folder contents
            } else {
              onFileSelect(file);
            }
          }}
          className={`group flex items-center gap-2 cursor-pointer px-2 py-1 rounded transition-all duration-200 ${
            isActive 
              ? 'bg-hb-primary/20 text-hb-primary border-l-2 border-hb-primary' 
              : 'text-gray-400 hover:bg-hb-border/30 hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${(depth * 12) + 8}px` }}
        >
          <span className="text-[14px] flex-shrink-0">
            {file.type === 'dir' ? (
              <span className={`inline-block transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            ) : (
              <span className="opacity-60">📄</span>
            )}
          </span>
          {file.type === 'dir' && <span className="text-sm">📁</span>}
          <span className="truncate flex-1 text-[12px] font-medium tracking-tight">
            {file.name}
          </span>
          {isActive && (
            <span className="w-1 h-1 rounded-full bg-hb-primary shadow-glow-primary"></span>
          )}
        </div>
        
        {/* Render nested children if any and folder is expanded */}
        {file.type === 'dir' && isExpanded && file.children && (
          <div className="mt-0.5">
            {file.children.map(child => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#09090b] border-r border-hb-border/30 overflow-hidden select-none">
      

      {/* Side Bar Content */}
      <div className="w-60 flex flex-col bg-[#09090b]">
        {/* Sidebar Header */}
        <div className="px-4 py-3 flex items-center justify-between group">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Explorer</h3>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="p-1 hover:bg-hb-border/40 rounded transition-colors"
              title="New File"
            >
              <span className="text-gray-400 text-sm">📄⁺</span>
            </button>
            <button 
              onClick={onRefresh}
              className="p-1 hover:bg-hb-border/40 rounded transition-colors"
              title="Refresh"
            >
              <span className="text-gray-400 text-sm">🔄</span>
            </button>
          </div>
        </div>

        {/* Collapsible Section: Project Name */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div 
            onClick={() => setIsExplorerOpen(!isExplorerOpen)}
            className="px-2 py-1 bg-hb-border/10 border-y border-hb-border/10 flex items-center gap-2 cursor-pointer hover:bg-hb-border/20 transition-colors"
          >
            <span className={`text-[8px] transition-transform duration-200 ${isExplorerOpen ? 'rotate-90' : ''}`}>▶</span>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Project Workspace</span>
          </div>

          {isExplorerOpen && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {isCreating && (
                <form onSubmit={handleCreateSubmit} className="px-2 mb-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="filename.js"
                    className="w-full bg-[#18181b] border border-hb-primary/30 text-white text-[12px] px-2 py-1 rounded outline-none"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={() => {
                      if (!newFileName.trim()) setIsCreating(false);
                    }}
                  />
                </form>
              )}

              <div className="space-y-0.5">
                {files.length === 0 && !isCreating ? (
                  <div className="py-12 px-4 text-center">
                     <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest">The workspace is empty</p>
                  </div>
                ) : (
                  files.map(file => renderFileItem(file))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Status (VS Code like) */}
        <div className="p-3 bg-hb-bg/40 border-t border-hb-border/10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-hb-success" />
               <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Connected to Main</span>
            </div>
        </div>
      </div>
    </div>
  );
}
