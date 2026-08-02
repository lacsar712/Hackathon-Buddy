import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';

export default function EditorChat({ projectId, projectName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);

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

  return (
    <div className="flex flex-col h-full bg-hb-card border-l border-hb-border/50 w-72">
      <div className="p-4 border-b border-hb-border/30 flex items-center justify-between bg-hb-bg/20 shrink-0">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Stream Chat</h3>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-hb-success shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-400'}`} />
          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{connected ? 'Live' : 'Off'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12 opacity-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Quiet Protocol</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?.id === user._id || msg.sender?.name === user.name;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[8px] font-black text-hb-primary uppercase tracking-widest mb-1 ml-1">{msg.sender?.name}</span>
                  )}
                  <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed shadow-lg ${
                    isMe
                      ? 'bg-modern-gradient text-white rounded-tr-none'
                      : 'bg-hb-bg text-gray-300 rounded-tl-none border border-hb-border'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-hb-bg/20 border-t border-hb-border/30 shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2 relative">
          <input
            className="w-full bg-hb-bg border border-hb-border text-white text-[11px] font-medium py-2.5 px-3 rounded-xl outline-none focus:border-hb-primary/50 transition-all shadow-inner placeholder-gray-700"
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim()} className="w-10 h-10 rounded-xl bg-hb-border/50 hover:bg-hb-primary text-white flex items-center justify-center transition-all disabled:opacity-30 border border-hb-border/50 shadow-lg">
             ⚡
          </button>
        </form>
      </div>
    </div>
  );
}
