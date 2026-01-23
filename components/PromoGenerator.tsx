
import React, { useState } from 'react';
import { generatePromoDescription, PromoScript } from '../services/geminiService';

const PromoGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [promo, setPromo] = useState<PromoScript | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    const result = await generatePromoDescription(topic);
    setPromo(result);
    setLoading(false);
  };

  return (
    <div className="p-5">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
        <h2 className="text-xl font-black mb-2 flex items-center gap-2">
          <i className="fas fa-magic"></i> AI PROMO CREATOR
        </h2>
        <p className="text-sm opacity-80">Use Gemini to generate viral promotional text for your bingo streaks!</p>
      </div>

      <div className="space-y-4">
        <textarea 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What's the highlight? e.g., Just won 500 ETB! or Join my team for the 10k prize!"
          className="w-full bg-white border border-gray-200 p-5 rounded-2xl font-medium outline-none focus:border-purple-500 h-32 text-base leading-relaxed"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-5 bg-purple-600 text-white font-black text-base rounded-2xl shadow-lg hover:bg-purple-700 transition-all disabled:opacity-50"
        >
          {loading ? 'GENERATING...' : 'CREATE PROMO SCRIPT'}
        </button>

        {promo && (
          <div className="bg-white p-6 rounded-2xl border-2 border-purple-50 shadow-inner mt-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-xs font-black text-purple-400 uppercase mb-3">Script Suggestion</div>
            
            <div className="mb-3 font-black text-gray-800 text-lg leading-tight">{promo.title}</div>
            
            <p className="text-base text-gray-700 italic leading-relaxed whitespace-pre-wrap mb-5 font-medium">{promo.script}</p>
            
            <div className="flex flex-wrap gap-2 mb-5">
              {promo.hashtags.map((tag, i) => (
                <span key={i} className="text-xs text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-lg">#{tag.replace(/^#/, '')}</span>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Viral Prediction</span>
               <p className="text-xs text-slate-600 font-bold leading-snug">{promo.viralFactor}</p>
            </div>

            <button 
              onClick={() => {
                const fullText = `${promo.title}\n\n${promo.script}\n\n${promo.hashtags.join(' ')}`;
                navigator.clipboard.writeText(fullText);
                alert("Copied to clipboard!");
              }}
              className="mt-2 text-sm font-bold text-purple-600 flex items-center gap-2 hover:bg-purple-50 p-3 rounded-lg transition-colors w-full justify-center border border-purple-100"
            >
              <i className="fas fa-copy"></i> Copy Full Script
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoGenerator;
