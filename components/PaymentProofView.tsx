import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const PaymentProofView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'chat'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [refId, setRefId] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Welcome to Beteseb Bet Bingo Support! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !refId) return alert("Please select a file and enter a Reference ID.");
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert("Proof uploaded successfully!");
      setFile(null);
      setRefId('');
      setNotes('');
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are a helpful support agent for Beteseb Bet Bingo. Tone: Professional, friendly.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { systemInstruction },
      });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "Sorry, I am offline." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Service unavailable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-5 pb-24 h-full flex flex-col">
      <div className="bg-white border border-hb-border p-1.5 rounded-2xl mb-6 flex shrink-0">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === 'upload' ? 'bg-hb-blue text-white' : 'text-hb-muted'}`}
        >
          Upload Proof
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === 'chat' ? 'bg-hb-blue text-white' : 'text-hb-muted'}`}
        >
          AI Support
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-br from-hb-surface to-[#121212] p-8 rounded-[2rem] border border-hb-border text-white shadow-xl mb-6 relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                 {/* New App Logo in Header */}
                 <img src="/logo.png" className="w-10 h-10 rounded-full bg-white object-contain border-2 border-white shadow-md" alt="Logo" />
                 <h2 className="text-xl font-black italic uppercase">Verification</h2>
               </div>
               <p className="text-[11px] text-hb-muted font-bold leading-relaxed">
                 Manually verify your deposits.
               </p>
             </div>
          </div>

          <div className="space-y-4">
             <input 
               type="text" 
               value={refId} 
               onChange={e => setRefId(e.target.value)}
               placeholder="Transaction Ref / ID" 
               className="w-full input-human"
             />
             <div className="relative w-full h-32 border-2 border-dashed border-hb-border rounded-2xl bg-white/50 flex flex-col items-center justify-center cursor-pointer">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <span className="text-xs font-bold text-hb-muted">{file ? file.name : 'Tap to upload receipt'}</span>
             </div>
             <textarea 
               value={notes}
               onChange={e => setNotes(e.target.value)}
               placeholder="Additional Notes" 
               className="w-full bg-white border border-hb-border rounded-2xl p-4 text-sm min-h-[100px] outline-none"
             />
             <button onClick={handleUpload} disabled={isUploading} className="w-full h-14 bg-hb-gold text-hb-blueblack font-black uppercase rounded-xl">
               {isUploading ? 'Uploading...' : 'Submit Verification'}
             </button>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col bg-slate-50 border border-hb-border rounded-[2rem] overflow-hidden">
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3 rounded-xl text-xs font-bold ${msg.role === 'user' ? 'bg-hb-blue text-white' : 'bg-white border border-hb-border text-hb-navy'}`}>
                      {msg.text}
                   </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
           </div>
           <div className="p-3 bg-white border-t border-hb-border flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask a question..." className="flex-1 h-10 border rounded-full px-4 text-xs font-bold" />
              <button onClick={handleSendMessage} className="w-10 h-10 bg-hb-blue text-white rounded-full"><i className="fas fa-paper-plane"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PaymentProofView;