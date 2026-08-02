import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import { userAPI } from '../services/api';
import { getInitials } from '../utils/helpers';

export default function PrivateChat() {
  const { recipientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);

  const roomId = [user._id, recipientId].sort().join('_');

  useEffect(() => {
    const loadRecipient = async () => {
      try {
        const { data } = await userAPI.getUserById(recipientId);
        setRecipient(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadRecipient();
  }, [recipientId]);

  useEffect(() => {
    socket.connect();
    socket.emit('join_room', roomId);
    setConnected(true);

    socket.on('room_history', (history) => setMessages(history));
    socket.on('receive_message', (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off('room_history');
      socket.off('receive_message');
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('send_message', {
      roomId,
      message: input.trim(),
      sender: { name: user.name, id: user._id },
    });
    setInput('');
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
      {/* Header */}
      <div className="glass rounded-3xl p-5 mb-6 flex items-center justify-between border-hb-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-hb-border/30 flex items-center justify-center text-gray-400 hover:text-white transition-all">←</button>
          
          <div className="relative">
            <div className="absolute -inset-0.5 bg-modern-gradient rounded-full blur opacity-40" />
            <div className="relative w-12 h-12 rounded-full bg-hb-card border border-hb-border flex items-center justify-center text-sm font-black text-white">
               {getInitials(recipient?.name || '?')}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
               <h1 className="text-lg font-black text-white tracking-tight uppercase leading-none">
                 {recipient?.name || 'INITIALIZING...'}
               </h1>
               <span className={`w-2 h-2 rounded-full ${connected ? 'bg-hb-accent shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-red-400'}`} />
            </div>
            <div className="text-[9px] font-black text-hb-primary uppercase tracking-[0.2em]">
               {recipient?.role || 'Hacker'} · Direct Encrypted Link
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-40">
            <div className="text-6xl mb-4">👋</div>
            <p className="font-black uppercase tracking-[0.3em] text-[10px]">Start the conversation with {recipient?.name?.split(' ')[0]}</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?.id === user._id;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[80%] md:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
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
        <div className="absolute inset-0 bg-hb-accent/10 rounded-2xl blur-xl opacity-10" />
        <form onSubmit={sendMessage} className="relative flex gap-3 p-2 glass rounded-2xl border-hb-border/50 shadow-glow-accent/5">
          <input
            className="input bg-transparent border-none focus:ring-0 text-base"
            placeholder={`Message ${recipient?.name?.split(' ')[0]}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim()} className="w-12 h-12 rounded-xl bg-modern-gradient text-white flex items-center justify-center shadow-glow-primary transition-transform active:scale-90 disabled:opacity-50">
            ⚡
          </button>
        </form>
      </div>
    </div>
  );
}
