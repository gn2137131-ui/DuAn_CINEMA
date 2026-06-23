import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Trash2, ShieldCheck, CheckCircle2, X } from 'lucide-react';

export default function SavedPaymentMethods() {
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    const cards = JSON.parse(localStorage.getItem('saved_cards') || '[]');
    setSavedCards(cards);
  }, []);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder || !expiry) return;

    const newCard = {
      id: Date.now().toString(),
      type: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
      last4: cardNumber.slice(-4),
      holder: cardHolder.toUpperCase(),
      expiry: expiry
    };

    const updated = [...savedCards, newCard];
    setSavedCards(updated);
    localStorage.setItem('saved_cards', JSON.stringify(updated));
    
    // Reset form
    setCardNumber('');
    setCardHolder('');
    setExpiry('');
    setCvv('');
    setIsAddingCard(false);
  };

  const removeCard = (id: string) => {
    const updated = savedCards.filter(c => c.id !== id);
    setSavedCards(updated);
    localStorage.setItem('saved_cards', JSON.stringify(updated));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-50 mt-6">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-2">
        <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-600" />
          Thẻ thanh toán của tôi
        </h2>
        <button 
          onClick={() => setIsAddingCard(true)}
          className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm thẻ
        </button>
      </div>

      {savedCards.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold mb-1">Chưa có thẻ nào được liên kết</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">Liên kết thẻ Visa/Mastercard để thanh toán vé phim chỉ với 1 chạm (Tokenization Sandbox).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedCards.map(card => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={card.id} 
              className={`p-5 rounded-2xl text-white relative overflow-hidden shadow-md group ${card.type === 'Visa' ? 'bg-gradient-to-br from-blue-700 to-blue-900' : 'bg-gradient-to-br from-gray-800 to-black'}`}
            >
              {/* Card Decoration */}
              <div className="absolute right-[-20px] top-[-20px] opacity-10">
                <CreditCard className="w-32 h-32" />
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <span className="font-black italic text-xl tracking-wider">{card.type}</span>
                <button 
                  onClick={() => removeCard(card.id)}
                  className="w-8 h-8 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="font-mono text-lg tracking-widest mb-2 opacity-90">
                **** **** **** {card.last4}
              </div>
              
              <div className="flex justify-between text-xs font-semibold opacity-80 uppercase tracking-widest">
                <span>{card.holder}</span>
                <span>{card.expiry}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {isAddingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddingCard(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Thêm thẻ thanh toán
                </h3>
                <button onClick={() => setIsAddingCard(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleAddCard} className="p-6 space-y-4">
                {/* 3D Card Preview */}
                <div className="w-full h-48 bg-gradient-to-tr from-gray-800 to-gray-600 rounded-xl mb-6 shadow-xl p-5 text-white flex flex-col justify-between relative overflow-hidden transform perspective-1000 transition-all hover:scale-105">
                  <div className="absolute right-[-10%] top-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-center z-10">
                    <div className="w-12 h-8 bg-yellow-200/80 rounded-md"></div>
                    <span className="font-black italic text-xl opacity-80">
                      {cardNumber.startsWith('4') ? 'VISA' : 'MASTER'}
                    </span>
                  </div>
                  <div className="font-mono text-xl tracking-[0.2em] z-10 text-shadow">
                    {cardNumber ? formatCardNumber(cardNumber) : '**** **** **** ****'}
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-widest opacity-80 z-10">
                    <span>{cardHolder || 'HỌ TÊN CHỦ THẺ'}</span>
                    <span>{expiry || 'MM/YY'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số thẻ</label>
                  <input 
                    type="text" required maxLength={19}
                    value={formatCardNumber(cardNumber)}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 font-mono focus:bg-white transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên in trên thẻ</label>
                  <input 
                    type="text" required
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:bg-white uppercase transition-colors"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hết hạn (MM/YY)</label>
                    <input 
                      type="text" required maxLength={5}
                      value={expiry}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                        setExpiry(val);
                      }}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 font-mono focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV</label>
                    <input 
                      type="password" required maxLength={3}
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="***"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 font-mono focus:bg-white transition-colors text-center"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400 flex items-center gap-1 justify-center mt-4">
                  <ShieldCheck className="w-3 h-3" />
                  Mô phỏng PCI-DSS. Không lưu số CVV.
                </p>

                <button 
                  type="submit"
                  className="w-full mt-2 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Lưu Thẻ An Toàn
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
