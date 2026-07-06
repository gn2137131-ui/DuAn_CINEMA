const fs = require('fs');

const code = `import { toast } from 'sonner';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Bot, X, Trash2, User, Send, Star, Film, Ticket, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CineBot.css';

interface MovieData {
  id: number;
  title: string;
  genre: string;
  poster?: string;
  rating?: number | string;
  duration?: number;
}

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  isMovieLink?: boolean;
  movieId?: number;
  type?: 'text' | 'movieCard' | 'showtimes';
  movieData?: MovieData;
  showtimes?: string[];
}

export default function CineBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [bookingContext, setBookingContext] = useState<MovieData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cinebot_messages');
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
      if (userStr) user = JSON.parse(userStr);
    } catch (e) {}
    
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      let welcomeMsg = 'Xin chào! 🎬 Mình là CineBot, trợ lý đặt vé xem phim của bạn. Bạn muốn xem thể loại phim gì hôm nay?';
      if (user && (user.fullName || user.username)) {
        welcomeMsg = \`Chào \${user.fullName || user.username}! 🎬 Mình là CineBot. Rất vui được gặp lại bạn, hôm nay bạn muốn xem phim gì nào?\`;
      }
      setMessages([{ id: Date.now(), text: welcomeMsg, sender: 'bot', type: 'text' }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cinebot_messages', JSON.stringify(messages));
    }
  }, [messages]);

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

  const handleClearHistory = () => {
    localStorage.removeItem('cinebot_messages');
    setMessages([{ id: Date.now(), text: 'Đã xóa lịch sử trò chuyện. Bạn cần giúp gì nào?', sender: 'bot', type: 'text' }]);
    setBookingContext(null);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now(), text: text, sender: 'user', type: 'text' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lowerInput = text.toLowerCase();
      let newMessages: Message[] = [];

      if (bookingContext && (lowerInput.includes('đặt') || lowerInput.includes('mua') || lowerInput.includes('xem') || lowerInput.includes('vé'))) {
        newMessages.push({
          id: Date.now(),
          text: \`Tuyệt vời! 🎉 Bạn muốn đặt vé phim "\${bookingContext.title}". Dưới đây là các suất chiếu trong ngày hôm nay:\`,
          sender: 'bot',
          type: 'showtimes',
          showtimes: ['14:30', '16:45', '19:00', '21:15', '23:30'],
          movieId: bookingContext.id
        });
        setBookingContext(null);
      } 
      else if (lowerInput.includes('giá vé') || lowerInput.includes('bao nhiêu tiền')) {
        newMessages.push({ id: Date.now(), text: 'Giá vé rạp CineVerse: 2D (90k), 3D (120k), IMAX (150k). Cuối tuần phụ thu 10k/vé nhé bạn!', sender: 'bot', type: 'text' });
      } 
      else if (lowerInput.includes('khuyến mãi') || lowerInput.includes('ưu đãi')) {
        newMessages.push({ id: Date.now(), text: 'Hiện đang có ưu đãi Đồng giá 50k vào Thứ 2 hàng tuần và Giảm 20% khi mua Combo Bắp Nước qua website!', sender: 'bot', type: 'text' });
      } 
      else if (lowerInput.includes('gợi ý') || lowerInput.includes('nên xem') || lowerInput.includes('phim đang hot')) {
        const userStr = localStorage.getItem('user');
        let user = null;
        try {
          if (userStr) user = JSON.parse(userStr);
        } catch(e){}

        let suggested = movies.length > 0 ? [...movies].sort((a, b) => parseFloat(String(b.rating || 0)) - parseFloat(String(a.rating || 0)))[0] : null;
        
        if (user && suggested) {
          newMessages.push({ 
            id: Date.now(), 
            text: \`Dựa trên sở thích của bạn, mình thấy siêu phẩm này rất tuyệt vời:\`, 
            sender: 'bot', type: 'text' 
          });
          newMessages.push({ id: Date.now() + 1, text: '', sender: 'bot', type: 'movieCard', movieData: suggested });
          setBookingContext(suggested);
        } else if (suggested) {
          newMessages.push({ id: Date.now(), text: 'Mình gợi ý cho bạn bộ phim đang hot nhất rạp hiện nay:', sender: 'bot', type: 'text' });
          newMessages.push({ id: Date.now() + 1, text: '', sender: 'bot', type: 'movieCard', movieData: suggested });
          setBookingContext(suggested);
        } else {
          newMessages.push({ id: Date.now(), text: 'Hiện tại hệ thống chưa cập nhật phim mới, bạn quay lại sau nhé!', sender: 'bot', type: 'text' });
        }
      }
      else {
        let matchedMovie = null;
        if (lowerInput.includes('hành động') || lowerInput.includes('action') || lowerInput.includes('đánh nhau')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('hành động') || m.genre?.toLowerCase().includes('action'));
        } else if (lowerInput.includes('kinh dị') || lowerInput.includes('ma') || lowerInput.includes('sợ')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('kinh dị') || m.genre?.toLowerCase().includes('horror'));
        } else if (lowerInput.includes('tình cảm') || lowerInput.includes('lãng mạn') || lowerInput.includes('yêu')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('tình cảm') || m.genre?.toLowerCase().includes('romance'));
        } else if (lowerInput.includes('hài') || lowerInput.includes('cười')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('hài') || m.genre?.toLowerCase().includes('comedy'));
        }

        if (!matchedMovie && movies.length > 0 && lowerInput.length > 0) {
          matchedMovie = movies[Math.floor(Math.random() * movies.length)];
        }

        if (matchedMovie) {
          newMessages.push({ id: Date.now(), text: \`Mình vừa tìm thấy phim này hợp với bạn! Cực kỳ hấp dẫn luôn nha.\`, sender: 'bot', type: 'text' });
          newMessages.push({ id: Date.now() + 1, text: '', sender: 'bot', type: 'movieCard', movieData: matchedMovie });
          setBookingContext(matchedMovie);
        } else {
          newMessages.push({ id: Date.now(), text: 'Xin lỗi, mình chưa tìm thấy thông tin phù hợp. Bạn thử các từ khóa như "hành động", "khuyến mãi", "giá vé" xem sao nhé!', sender: 'bot', type: 'text' });
        }
      }

      setMessages(prev => [...prev, ...newMessages]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const formatTime = () => {
    const d = new Date();
    return \`\${d.getHours()}:\${String(d.getMinutes()).padStart(2, '0')}\`;
  };

  const quickReplies = ["Phim đang chiếu", "Giá vé", "Khuyến mãi", "Đề xuất cho tôi"];

  return (
    <div className="fixed bottom-6 right-6 z-50 cine-bot-wrapper">
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
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-16 right-0 chat-container"
          >
            <div className="chat-header">
              <div className="bot-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15.6 11.6L22 7v10l-6.4-4.5"/>
                  <rect x="2" y="7" width="14" height="10" rx="2"/>
                </svg>
              </div>
              <div className="header-info">
                <h1>CineChat</h1>
                <div className="header-status">
                  <div className="status-dot"></div>
                  <span>Sẵn sàng hỗ trợ</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="header-btn" onClick={handleClearHistory} title="Xóa lịch sử">
                  <Trash2 size={16} />
                </button>
                <button className="header-btn" onClick={() => setIsOpen(false)} title="Đóng">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="chat-messages" id="chatMessages">
              {messages.map((msg, index) => (
                <div key={msg.id || index} className={\`message \${msg.sender === 'user' ? 'user' : 'bot'}\`}>
                  <div className="msg-avatar">
                    {msg.sender === 'user' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15.6 11.6L22 7v10l-6.4-4.5"/>
                        <rect x="2" y="7" width="14" height="10" rx="2"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 w-full overflow-hidden">
                    {(!msg.type || msg.type === 'text') && (
                      <div className="bubble">
                        {msg.text}
                      </div>
                    )}

                    {msg.type === 'movieCard' && msg.movieData && (
                      <div className="bubble p-0 overflow-hidden bg-transparent">
                        <div className="movie-cards">
                          <div className="movie-card" onClick={() => navigate(\`/movies/\${msg.movieData?.id}\`)}>
                            <div className="movie-poster">
                              {msg.movieData.poster ? (
                                <img src={msg.movieData.poster} alt={msg.movieData.title} />
                              ) : (
                                <div style={{width:'100%', height:'100%', background:'linear-gradient(135deg, oklch(35% 0.15 20), oklch(25% 0.12 350))', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                  <Film className="text-white/20 w-12 h-12" />
                                </div>
                              )}
                              <span className="rating">⭐ {msg.movieData.rating || 'N/A'}</span>
                            </div>
                            <div className="movie-info">
                              <h4>{msg.movieData.title}</h4>
                              <p>{msg.movieData.genre || 'Phim rạp'}</p>
                              <div className="quick-actions mt-2 mb-1 px-1">
                                <button 
                                  className="quick-btn w-full flex justify-center items-center gap-1 bg-[var(--accent)] text-black border-none py-1.5 rounded-lg font-bold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInputText(\`Đặt vé phim \${msg.movieData?.title}\`);
                                    setTimeout(() => handleSend(\`Đặt vé phim \${msg.movieData?.title}\`), 100);
                                  }}
                                >
                                  <Ticket size={14} /> Mua vé
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.type === 'showtimes' && msg.showtimes && (
                      <div className="bubble">
                        {msg.text}
                        <div className="showtime-grid">
                          {msg.showtimes.map((time, i) => (
                            <button 
                              key={i} 
                              className="showtime-btn"
                              onClick={() => navigate(\`/movies/\${msg.movieId}\`)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="msg-time">{formatTime()}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message bot">
                  <div className="msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.6 11.6L22 7v10l-6.4-4.5"/>
                      <rect x="2" y="7" width="14" height="10" rx="2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="bubble p-0">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && !isTyping && (
              <div className="px-4 pb-2 bg-[var(--bg-elevated)] overflow-x-auto whitespace-nowrap" style={{scrollbarWidth: 'none'}}>
                <div className="flex gap-2 pb-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputText(reply);
                        handleSend(reply);
                      }}
                      className="quick-btn py-1.5 px-3 text-xs"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="chat-input">
              <form 
                className="input-wrapper"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              >
                <button
                  type="button"
                  onClick={handleVoice}
                  className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer px-1 outline-none"
                >
                  {isListening ? <Mic className="text-red-500 animate-pulse" size={20} /> : <MicOff size={20} />}
                </button>

                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isListening ? "Đang nghe..." : "Nhập tin nhắn..."} 
                />
                
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="send-btn"
                  style={{ opacity: (!inputText.trim() || isTyping) ? 0.5 : 1 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync('frontendcinema-v2/src/components/CineBot.tsx', code);
console.log('CineBot.tsx updated successfully.');
