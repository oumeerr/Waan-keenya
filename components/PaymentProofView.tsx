
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
    { role: 'model', text: 'Welcome to Waan Keenya Bingo Support! How can I help you today? You can ask about deposits, withdrawals, or how to upload your payment proof.' }
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

  // --- Upload Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !refId) return alert("Please select a file and enter a Reference ID.");
    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      alert("Proof uploaded successfully! Our team will verify it shortly.");
      setFile(null);
      setRefId('');
      setNotes('');
    }, 2000);
  };

  // --- Chat Logic ---
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are a helpful support agent for Waan Keenya Bingo, a betting app.
      Key Info:
      - We accept Telebirr, CBE Birr, E-Birr, Kacha.
      - Minimum Deposit: 30 ETB.
      - Minimum Withdrawal: 100 ETB.
      - Withdrawal Rule: Users must win at least 3 games to unlock withdrawals.
      - Payment Proof: Users should upload screenshots of their transaction in the 'Upload Proof' tab if deposits are delayed.
      - Tone: Professional, friendly, energetic.
      - If users ask about game rules: Mention it's a Bingo game with a 150-card deck and high entropy.
      - Keep answers concise (under 50 words usually).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction,
        },
      });

      const aiText = response.text || "I'm having trouble connecting to the server. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I am offline right now. Please check your connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-5 pb-24 h-full flex flex-col">
      <div className="bg-white border border-hb-border p-1.5 rounded-2xl mb-6 flex shrink-0">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === 'upload' ? 'bg-hb-blue text-white shadow-sm' : 'text-hb-muted hover:text-hb-navy'}`}
        >
          <i className="fas fa-upload mr-2"></i> Upload Proof
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === 'chat' ? 'bg-hb-blue text-white shadow-sm' : 'text-hb-muted hover:text-hb-navy'}`}
        >
          <i className="fas fa-robot mr-2"></i> AI Support
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gradient-to-br from-hb-surface to-[#121212] p-8 rounded-[2rem] border border-hb-border text-white shadow-xl mb-6 relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                 <img src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4a/6c/2e/4a6c2e37-122e-130f-2169-2810c9d94944/AppIcon-0-0-1x_U007emarketing-0-5-0-85-220.png/512x512bb.jpg" className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain" alt="Telebirr" />
                 <h2 className="text-xl font-black italic uppercase">Payment Verification</h2>
               </div>
               <p className="text-[11px] text-hb-muted font-bold leading-relaxed">
                 Upload screenshots (Telebirr/CBE) or documents to verify your deposits manually.
               </p>
             </div>
             <i className="fas fa-file-invoice-dollar absolute -right-6 -bottom-6 text-hb-gold/10 text-[8rem] rotate-12"></i>
          </div>

          <div className="space-y-4">
             <div>
                <label className="text-[10px] font-black uppercase text-hb-muted tracking-widest mb-1.5 block ml-1">Transaction Ref / ID</label>
                <input 
                  type="text" 
                  value={refId} 
                  onChange={e => setRefId(e.target.value)}
                  placeholder="e.g. 1234567890" 
                  className="w-full input-human"
                />
             </div>

             <div>
                <label className="text-[10px] font-black uppercase text-hb-muted tracking-widest mb-1.5 block ml-1">Upload Receipt</label>
                <div className="relative w-full h-32 border-2 border-dashed border-hb-border rounded-2xl bg-white/50 hover:bg-white transition-colors flex flex-col items-center justify-center cursor-pointer group">
                   <input 
                     type="file" 
                     accept=".jpg,.jpeg,.png,.pdf,.doc,.txt"
                     onChange={handleFileChange}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   {file ? (
                     <div className="flex flex-col items-center text-hb-blue">
                        <i className="fas fa-check-circle text-2xl mb-2"></i>
                        <span className="text-xs font-bold">{file.name}</span>
                        <span className="text-[9px] font-black uppercase opacity-60">{(file.size/1024).toFixed(1)} KB</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center text-hb-muted group-hover:text-hb-blue">
                        <i className="fas fa-cloud-upload-alt text-2xl mb-2"></i>
                        <span className="text-xs font-bold">Tap to upload proof</span>
                        <span className="text-[8px] font-black uppercase opacity-60 mt-1">PDF, PNG, JPG, DOC</span>
                     </div>
                   )}
                </div>
             </div>

             <div>
                <label className="text-[10px] font-black uppercase text-hb-muted tracking-widest mb-1.5 block ml-1">Additional Notes</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your issue..." 
                  className="w-full bg-white border border-hb-border rounded-2xl p-4 text-sm font-medium outline-none focus:border-hb-blue min-h-[100px] resize-none"
                />
             </div>

             <button 
               onClick={handleUpload}
               disabled={isUploading}
               className="w-full h-14 bg-hb-gold text-hb-blueblack font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
             >
               {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
               {isUploading ? 'Uploading...' : 'Submit Verification'}
             </button>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col bg-slate-50 border border-hb-border rounded-[2rem] overflow-hidden shadow-inner animate-in fade-in slide-in-from-right-2">
           <div className="bg-white p-4 border-b border-hb-border flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-hb-gold flex items-center justify-center text-hb-blueblack border-2 border-white shadow-md">
                 <i className="fas fa-robot text-lg"></i>
              </div>
              <div>
                 <div className="text-sm font-black text-hb-navy">HB Support Bot</div>
                 <div className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-bold leading-relaxed shadow-sm 
                     ${msg.role === 'user' ? 'bg-hb-blue text-white rounded-br-none' : 'bg-white text-hb-brand-grey border border-hb-border rounded-bl-none'}`}>
                      {msg.text}
                   </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-hb-border flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           <div className="p-3 bg-white border-t border-hb-border flex gap-2">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about payments..." 
                className="flex-1 h-10 bg-hb-bg border border-hb-border rounded-full px-4 text-xs font-bold outline-none focus:border-hb-blue"
              />
              <button 
                onClick={handleSendMessage}
                className="w-10 h-10 bg-hb-blue text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
              >
                <i className="fas fa-paper-plane text-xs"></i>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PaymentProofView;
