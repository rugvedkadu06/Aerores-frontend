import React, { useState } from 'react';
import axios from 'axios';
import Timeline from '../components/passenger/Timeline';
import VoucherCard from '../components/passenger/VoucherCard';
import RebookingOptions from '../components/passenger/RebookingOptions';
import FlightStatusCard from '../components/passenger/FlightStatusCard';

const API_URL = 'http://localhost:8000';

// Translation Dictionary
const DICT = {
    en: {
        title: "Passenger Assistance",
        subtitle: "Real-time updates & resolution",
        status_critical: "CRITICAL DELAY",
        reason_label: "TRANSPARENT REASON",
        timeline: "Live Timeline",
        compensation: "Your Entitlements",
        rebook: "Quick Rebook",
        login_placeholder: "Enter Flight Number (e.g., FLY1001)",
        search_btn: "FIND FLIGHT",
        rights_info: "Based on your delay duration, you are entitled to:",
        chat_placeholder: "Ask about delay, food, or refunds...",
        support_btn: "Chat Support"
    },
    hi: {
        title: "यात्री सहायता",
        subtitle: "वास्तविक समय अपडेट और समाधान",
        status_critical: "गंभीर देरी",
        reason_label: "देरी का कारण",
        timeline: "लाइव समयरेखा",
        compensation: "आपके अधिकार",
        rebook: "त्वरित रीबुक",
        login_placeholder: "उड़ान संख्या दर्ज करें (उदा. FLY1001)",
        search_btn: "खोजें",
        rights_info: "आपकी देरी के आधार पर, आप इसके हकदार हैं:",
        chat_placeholder: "देरी, भोजन या रिफंड के बारे में पूछें...",
        support_btn: "सहायता चैट"
    },
    ta: {
        title: "பயணிகள் உதவி",
        subtitle: "நிகழ்நேர புதுப்பிப்புகள்",
        status_critical: "தாமதம்",
        reason_label: "காரணம்",
        timeline: "காலவரிசை",
        compensation: "உரிமைகள்",
        rebook: "மறுபதிவு",
        login_placeholder: "விமான எண்",
        search_btn: "தேடு",
        rights_info: "தாமதத்தின் அடிப்படையில் உரிமைகள்:",
        chat_placeholder: "கேள்வி கேட்கவும்...",
        support_btn: "ஆதரவு"
    },
    bn: {
        title: "যাত্রী সহায়তা",
        subtitle: "রিয়েল-টাইম আপডেট",
        status_critical: "বিলম্ব",
        reason_label: "কারণ",
        timeline: "টাইমলাইন",
        compensation: "অধিকার",
        rebook: "রিবুক",
        login_placeholder: "ফ্লাইট নম্বর",
        search_btn: "অনুসন্ধান",
        rights_info: "বিলম্বের উপর ভিত্তি করে অধিকার:",
        chat_placeholder: "প্রশ্ন জিজ্ঞাসা করুন...",
        support_btn: "সমর্থন"
    }
};

const PassengerBridge = () => {
    const [lang, setLang] = useState('en');
    const [flightId, setFlightId] = useState('');
    const [flightData, setFlightData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showRebook, setShowRebook] = useState(false);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const [chatHistory, setChatHistory] = useState([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);

    const t = DICT[lang];

    const handleSearch = async () => {
        if (!flightId) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_URL}/passenger/flight/${flightId}`);
            setFlightData(res.data);
        } catch (err) {
            setError('Flight not found. Please check the number.');
            setFlightData(null);
        } finally {
            setLoading(false);
        }
    };

    const sendChat = async () => {
        if (!chatMsg.trim()) return;

        const userMsg = chatMsg;
        setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatMsg('');

        // Mock API call or real endpoint
        try {
            const res = await axios.post(`${API_URL}/passenger/support`, { message: userMsg });
            setChatHistory(prev => [...prev, { sender: 'bot', text: res.data.response }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting." }]);
        }
    };

    const rebookOptions = [
        { id: 1, time: "02:30 PM", flightNo: "6E-554", carrier: "IndiGo", seats: 12 },
        { id: 2, time: "04:15 PM", flightNo: "AI-887", carrier: "Air India", seats: 5 },
    ];

    return (
        <div className="min-h-screen bg-bg-void text-white pb-24 relative font-sans selection:bg-accent selection:text-bg-void">

            {/* --- TOP BAR --- */}
            <header className="sticky top-0 z-40 bg-bg-void/90 backdrop-blur-md border-b border-surface-border p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-black text-xl">A</div>
                    {flightData && (
                        <div className="leading-tight">
                            <h1 className="font-bold text-sm tracking-widest">{flightData.flight_number}</h1>
                            <div className="text-[10px] text-gray-400 font-mono">{flightData.origin} ➔ {flightData.destination}</div>
                        </div>
                    )}
                </div>
                <div className="flex gap-1 bg-surface p-1 rounded-lg border border-surface-border">
                    {['en', 'hi', 'ta', 'bn'].map(l => (
                        <button
                            key={l}
                            onClick={() => setLang(l)}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${lang === l ? 'bg-accent text-bg-void' : 'text-gray-400 hover:text-white'}`}
                        >
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="p-4 max-w-md mx-auto space-y-6 animate-fadeIn">

                {/* LOGIN / SEARCH */}
                {!flightData && (
                    <div className="mt-10 space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter">AERO<span className="text-accent">RESILIENCE</span></h2>
                            <p className="text-gray-500 text-sm">{t.subtitle}</p>
                        </div>

                        <div className="bg-surface p-6 rounded-2xl border border-surface-border shadow-xl">
                            <label className="text-xs text-mono text-gray-400 mb-2 block uppercase tracking-widest">Flight Details</label>
                            <input
                                type="text"
                                value={flightId}
                                onChange={(e) => setFlightId(e.target.value)}
                                placeholder={t.login_placeholder}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg p-4 text-lg font-mono text-white focus:border-accent outline-none transition-all mb-4"
                            />
                            {error && <div className="text-status-danger text-xs mb-4 text-center">{error}</div>}
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full bg-accent hover:bg-white text-black font-bold py-4 rounded-lg tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? "SEARCHING..." : t.search_btn}
                            </button>

                            <p className="text-[10px] text-gray-600">Try these IDs for demo:</p>
                            <div className="flex gap-2 justify-center mt-2">
                                <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-mono cursor-pointer hover:text-white" onClick={() => setFlightId('FLY1001')}>FLY1001</span>
                                <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-mono cursor-pointer hover:text-white" onClick={() => setFlightId('FLY1002')}>FLY1002</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* DASHBOARD */}
                {flightData && (
                    <>
                        <FlightStatusCard data={flightData} t={t} />

                        {flightData.rights.length > 0 && (
                            <div className="bg-surface border border-surface-border rounded-xl p-5">
                                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">{t.compensation}</h3>
                                <p className="text-xs text-gray-500 mb-4">{t.rights_info}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {flightData.rights.map((r, i) => (
                                        <span key={i} className="text-xs bg-gray-800 border border-gray-600 text-gray-300 px-3 py-1 rounded-full">
                                            ✓ {r}
                                        </span>
                                    ))}
                                </div>
                                {flightData.vouchers.map((v, i) => (
                                    <VoucherCard key={i} {...v} />
                                ))}
                            </div>
                        )}

                        <div className="bg-surface border border-surface-border rounded-xl p-5">
                            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">{t.timeline}</h3>
                            <Timeline events={flightData.timeline} language={lang} />
                        </div>

                        {/* Manual Rebook Trigger (Mock) */}
                        <div className="bg-surface border border-surface-border rounded-xl p-5">
                            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Options</h3>
                            {!showRebook ? (
                                <button onClick={() => setShowRebook(true)} className="w-full py-3 bg-gray-800 border border-gray-600 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition-all">
                                    {t.rebook} ➔
                                </button>
                            ) : (
                                <RebookingOptions options={rebookOptions} onSelect={(opt) => alert(`Rebooked on ${opt.flightNo}`)} />
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* --- SUPPORT CHAT FLOATING BTN --- */}
            {flightData && (
                <div className="fixed bottom-6 right-6 z-50">
                    {!showChat ? (
                        <button
                            onClick={() => setShowChat(true)}
                            className="bg-accent text-black font-bold p-4 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform flex items-center gap-2"
                        >
                            <span className="text-xl">💬</span>
                            <span className="hidden md:inline">{t.support_btn}</span>
                        </button>
                    ) : (
                        <div className="bg-bg-panel border border-surface-border rounded-xl w-80 shadow-2xl overflow-hidden flex flex-col animate-slideUp">
                            <div className="bg-accent/10 p-4 border-b border-surface-border flex justify-between items-center">
                                <h3 className="font-bold text-accent text-sm">AeroAssist AI</h3>
                                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>
                            <div className="h-64 overflow-y-auto p-4 space-y-4 bg-black/60">
                                {chatHistory.map((c, i) => (
                                    <div key={i} className={`flex ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] text-xs p-3 rounded-xl ${c.sender === 'user' ? 'bg-accent text-black rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                                            {c.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 border-t border-surface-border bg-surface flex gap-2">
                                <input
                                    className="flex-1 bg-black border border-gray-700 rounded p-2 text-xs text-white focus:border-accent outline-none"
                                    placeholder={t.chat_placeholder}
                                    value={chatMsg}
                                    onChange={e => setChatMsg(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                                />
                                <button onClick={sendChat} className="bg-accent text-black p-2 rounded text-xs font-bold">➤</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default PassengerBridge;
