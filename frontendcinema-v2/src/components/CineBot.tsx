import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  isMovieLink?: boolean;
  movieId?: number;
}

export default function CineBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Xin chào! Mình là CineBot 🤖. Bạn muốn xem thể loại phim gì hôm nay? (VD: hành động, kinh dị, hài...)', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [movies, setMovies] = useState<any[]>([]);

  // Fetch movies
  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => setMovies(data))
      .catch(err => console.error(err));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Mock AI Engine
    setTimeout(() => {
      const lowerInput = userMessage.text.toLowerCase();
      let matchedMovie = null;
      let replyText = 'Xin lỗi, mình chưa tìm thấy phim phù hợp với từ khóa này. Bạn thử từ khóa khác như "hành động", "tình cảm" xem sao nhé!';

      // Basic NLP matching
      if (lowerInput.includes('hành động') || lowerInput.includes('đánh nhau') || lowerInput.includes('action')) {
        matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('hành động') || m.genre?.toLowerCase().includes('action'));
      } else if (lowerInput.includes('kinh dị') || lowerInput.includes('ma') || lowerInput.includes('sợ')) {
        matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('kinh dị') || m.genre?.toLowerCase().includes('horror'));
      } else if (lowerInput.includes('tình cảm') || lowerInput.includes('lãng mạn') || lowerInput.includes('yêu')) {
        matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('tình cảm') || m.genre?.toLowerCase().includes('romance'));
      } else if (lowerInput.includes('hài') || lowerInput.includes('cười')) {
        matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('hài') || m.genre?.toLowerCase().includes('comedy'));
      } else if (lowerInput.includes('hay nhất') || lowerInput.includes('hot')) {
        // Find highest rated
        matchedMovie = [...movies].sort((a, b) => parseFloat(String(b.rating || 0)) - parseFloat(String(a.rating || 0)))[0];
      }

      if (!matchedMovie && movies.length > 0 && lowerInput.length > 0) {
        // Tạm random 1 phim nếu không khớp
        matchedMovie = movies[Math.floor(Math.random() * movies.length)];
      }

      if (matchedMovie) {
        replyText = `Mình nghĩ bộ phim "${matchedMovie.title}" rất hợp với bạn! Đây là phim cực kỳ hấp dẫn đang chiếu tại rạp.`;
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: replyText, sender: 'bot' },
          { id: Date.now() + 1, text: 'Xem chi tiết và Đặt vé ngay!', sender: 'bot', isMovieLink: true, movieId: matchedMovie.id }
        ]);
      } else {
        setMessages(prev => [...prev, { id: Date.now(), text: replyText, sender: 'bot' }]);
      }
      
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2s delay to simulate thinking
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Nút bật/tắt Bot */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(220,38,38,0.4)] cursor-pointer group"
          >
            <Bot size={28} className="group-hover:animate-bounce" />
            
            {/* Ping indicator */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cửa sổ Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-16 right-0 w-[350px] max-w-[calc(100vw-32px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-[500px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-4 flex items-center justify-between text-white shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">CineBot AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-xs text-white/80 font-medium">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 flex items-center justify-center text-white mr-2 shrink-0 shadow-sm mt-auto">
                      <Bot size={16} />
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.isMovieLink ? (
                      <Link 
                        to={`/movies/${msg.movieId}`}
                        className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400 hover:underline"
                      >
                        <Film size={18} />
                        {msg.text}
                      </Link>
                    ) : (
                      <p className="text-[15px] leading-relaxed">{msg.text}</p>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 ml-2 shrink-0 shadow-sm mt-auto">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 flex items-center justify-center text-white mr-2 shrink-0 shadow-sm mt-auto">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center shadow-sm">
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1"
              >
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập yêu cầu của bạn..." 
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-gray-800 dark:text-white placeholder-gray-500"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shrink-0 shadow-sm"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
