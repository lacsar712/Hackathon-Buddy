import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import { projectAPI } from '../services/api';
import { getInitials } from '../utils/helpers';

export default function Chat() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [project, setProject] = useState(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data } = await projectAPI.getAll();
        const p = data.find((p) => p._id === projectId);
        setProject(p);
      } catch (err) {
        console.error(err);
      }
    };
    loadProject();
  }, [projectId]);

  useEffect(() => {
    socket.connect();
    socket.emit('join_room', projectId);
    setConnected(true);

    socket.on('room_history', (history) => setMessages(history));
    socket.on('receive_message', (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off('room_history');
      socket.off('receive_message');
    };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('send_message', {
      roomId: projectId,
      message: input.trim(),
      sender: { name: user.name, id: user._id },
    });
    setInput('');
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
      {/* Header */}
      <div className="glass rounded-3xl p-6 mb-6 flex items-center justify-between border-hb-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-hb-border/30 flex items-center justify-center text-gray-400 hover:text-white transition-all">←</button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
               <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">
                 {project?.title || 'COMMUNICATION HUB'}
               </h1>
               <span className={`w-2 h-2 rounded-full ${connected ? 'bg-hb-success shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-400 animate-pulse'}`} />
            </div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
               {project?.teamMembers?.length || 0} Operators Active
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex -space-x-3">
           {project?.teamMembers?.slice(0, 5).map((m, i) => (
             <div key={i} className="w-9 h-9 rounded-full bg-hb-card border-2 border-hb-bg flex items-center justify-center text-[10px] font-black text-white shadow-lg" title={m.name}>
               {getInitials(m.name || '?')}
             </div>
           ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-40">
            <div className="text-6xl mb-4">💬</div>
            <p className="font-black uppercase tracking-widest text-xs">Secure Channel Established</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?.id === user._id || msg.sender?.name === user.name;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[80%] md:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <span className="text-[9px] font-black text-hb-primary uppercase tracking-widest mb-1.5 ml-1">{msg.sender?.name}</span>
                  )}
                  <div className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-xl ${
                    isMe
                      ? 'bg-modern-gradient text-white rounded-tr-none'
                      : 'bg-hb-card text-gray-200 rounded-tl-none border border-hb-border'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1.5 mx-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <div className="absolute inset-0 bg-hb-primary/10 rounded-2xl blur-xl opacity-20" />
        <form onSubmit={sendMessage} className="relative flex gap-3 p-2 glass rounded-2xl border-hb-border/50">
          <input
            className="input bg-transparent border-none focus:ring-0 text-base"
            placeholder="Broadcast a message to the team..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim()} className="btn-primary px-8 flex items-center gap-2">
            <span>SEND</span>
            <span className="text-lg">⚡</span>
          </button>
        </form>
      </div>
    </div>
  );
}
