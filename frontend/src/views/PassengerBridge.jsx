import React, { useState } from 'react';
import axios from 'axios';
import Timeline from '../components/passenger/Timeline';
import VoucherCard from '../components/passenger/VoucherCard';
import RebookingOptions from '../components/passenger/RebookingOptions';
import FlightStatusCard from '../components/passenger/FlightStatusCard';
import RightsCard from '../components/passenger/RightsCard';
import FeedbackWidget from '../components/passenger/FeedbackWidget';
import PassengerOptions from '../components/passenger/PassengerOptions';

const API_URL = 'http://localhost:8000';

// Translation Dictionary
const DICT = {
    en: {
        title: "Passenger Dignity & Assistance Portal",
        subtitle: "Industry 5.0 | Transparent • Ethical • Human-Centric",
        status_critical: "SAFETY PAUSE ACTIVE",
        reason_label: "TRANSPARENT CAUSE",
        timeline: "Real-Time Truth Timeline",
        compensation: "Your Guaranteed Rights",
        options: "How can we restore your comfort?",
        login_placeholder: "Enter Flight Number (e.g., FLY1001)",
        search_btn: "ACCESS MY FLIGHT",
        rights_info: "We prioritize your dignity. Based on the delay, these rights are automatically unlocked for you:",
        chat_placeholder: "Ask about safety, care, or your rights...",
        support_btn: "Human-AI Support"
    },
    hi: {
        title: "यात्री सहायता",
        subtitle: "वास्तविक समय अपडेट और समाधान",
        status_critical: "गंभीर देरी",
        reason_label: "देरी का कारण",
        timeline: "लाइव समयरेखा",
        compensation: "आपके अधिकार",
        options: "आप क्या करना चाहेंगे?",
        login_placeholder: "उड़ान संख्या दर्ज करें (उदा. FLY1001)",
        search_btn: "खोजें",
        rights_info: "आपकी देरी के आधार पर, हमने इन अधिकारों को सक्रिय किया है:",
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
        options: "விருப்பங்கள்",
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
        options: "বিকল্প",
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
    const [activeOption, setActiveOption] = useState(null);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const [chatHistory, setChatHistory] = useState([{ sender: 'bot', text: 'Hello! I am your SkyCoPilot Assistant. How can I help you regarding your flight today?' }]);

    const t = DICT[lang];

    const handleSearch = async () => {
        if (!flightId) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_URL}/passenger/flight/${flightId}`);
            setFlightData(res.data);
            setChatHistory([{ sender: 'bot', text: `Hello! I see flight ${res.data.flight_number} is currently ${res.data.status}. How can I assist you?` }]);
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

        try {
            const contextStr = flightData
                ? `Flight ${flightData.flight_number} is ${flightData.status} (Delay: ${flightData.delay_minutes}m). Reason: ${flightData.plain_reason_desc}.`
                : "General inquiry.";

            const res = await axios.post(`${API_URL}/passenger/support`, { message: userMsg, context: contextStr });
            setChatHistory(prev => [...prev, { sender: 'bot', text: res.data.response }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting." }]);
        }
    };

    const handleOptionSelect = async (optId) => {
        if (optId === 'REBOOK') {
            setShowRebook(true);
            return;
        }

        const email = prompt("Enter your email to receive the voucher/confirmation:", "passenger@example.com");
        if (!email) return;

        try {
            await axios.post(`${API_URL}/passenger/request-option`, {
                flight_id: flightData.flight_id,
                option_id: optId,
                email: email
            });
            alert(`✅ Confirmation sent to ${email}`);
        } catch (err) {
            console.error(err);
            alert("Failed to send email. Please try again.");
        }
    };

    const rebookOptions = [
        { id: 1, time: "02:30 PM", flightNo: "6E-554", carrier: "IndiGo", seats: 12 },
        { id: 2, time: "04:15 PM", flightNo: "AI-887", carrier: "Air India", seats: 5 },
    ];

    return (
        <div className="bg-bg-void text-white font-sans selection:bg-accent selection:text-bg-void pb-20">

            {/* --- TOP BAR --- */}
            <header className="sticky top-0 z-50 bg-bg-void/95 backdrop-blur-md border-b border-surface-border px-6 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-bold text-black text-2xl">A</div>
                    <div>
                        <h1 className="font-bold text-lg tracking-widest text-white">SKY<span className="text-accent">COPILOT</span></h1>
                        <p className="text-xs text-gray-500 tracking-wider">PASSENGER ASSISTANCE DASHBOARD</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {flightData && (
                        <div className="hidden md:block text-right mr-4 border-r border-gray-700 pr-4">
                            <h2 className="font-bold text-white text-sm">{flightData.flight_number}</h2>
                            <div className="text-xs text-gray-400 font-mono">{flightData.origin} ➔ {flightData.destination}</div>
                        </div>
                    )}
                    <div className="flex gap-1 bg-surface p-1 rounded-lg border border-surface-border">
                        {['en', 'hi', 'ta', 'bn'].map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${lang === l ? 'bg-accent text-bg-void' : 'text-gray-400 hover:text-white'}`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="w-full max-w-[1600px] mx-auto p-6 md:p-8 animate-fadeIn">

                {/* LOGIN / SEARCH - Centered if no data */}
                {!flightData && (
                    <div className="flex flex-col items-center justify-center h-[70vh]">
                        <div className="w-full max-w-lg bg-surface p-8 rounded-2xl border border-surface-border shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
                                <p className="text-gray-400">{t.subtitle}</p>
                            </div>

                            <label className="text-xs text-mono text-gray-400 mb-2 block uppercase tracking-widest">Flight Details</label>
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={flightId}
                                    onChange={(e) => setFlightId(e.target.value)}
                                    placeholder={t.login_placeholder}
                                    className="flex-1 bg-black/40 border border-gray-700 rounded-lg p-4 text-sm font-mono text-white focus:border-accent outline-none transition-all"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="bg-accent hover:bg-white text-black font-bold px-8 rounded-lg tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? "..." : "➔"}
                                </button>
                            </div>

                            {error && <div className="p-3 bg-red-900/30 border border-red-900 text-status-danger text-sm rounded mb-4 text-center">{error}</div>}

                            <div className="border-t border-gray-800 pt-4 text-center">
                                <p className="text-xs text-gray-600 mb-2">DEMO IDS</p>
                                <div className="flex gap-3 justify-center">
                                    <span className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1 rounded text-xs font-mono cursor-pointer transition-colors" onClick={() => setFlightId('FLY1001')}>FLY1001</span>
                                    <span className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1 rounded text-xs font-mono cursor-pointer transition-colors" onClick={() => setFlightId('FLY1002')}>FLY1002</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* DESKTOP DASHBOARD GRID */}
                {flightData && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* LEFT COLUMN: Status & Timeline (Wide) */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Hero Status Card */}
                            <FlightStatusCard data={flightData} t={t} />

                            {/* Timeline Section */}
                            <div className="bg-surface border border-surface-border rounded-xl p-8 shadow-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-300 uppercase tracking-wider">{t.timeline}</h3>
                                    <div className="text-xs font-mono text-accent animate-pulse">● LIVE UPDATES ACTIVE</div>
                                </div>
                                <Timeline events={flightData.timeline} language={lang} />
                            </div>

                            {/* Compensation & Rights (Now inline on left for better reading flow) */}
                            {flightData.rights.length > 0 && (
                                <div className="bg-surface border border-surface-border rounded-xl p-8 shadow-lg">
                                    <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                                        <span className="text-2xl">⚖️</span>
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">{t.compensation}</h3>
                                            <p className="text-xs text-gray-400">{t.rights_info}</p>
                                        </div>
                                    </div>

                                    <RightsCard rights={flightData.rights} t={t} />

                                    {flightData.vouchers.length > 0 && (
                                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {flightData.vouchers.map((v, i) => (
                                                <VoucherCard key={i} {...v} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Actions & Support (Sticky) */}
                        <div className="lg:col-span-4 space-y-6 sticky top-24">

                            {/* Action Menu */}
                            <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-lg">
                                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-800 pb-2">{t.options}</h3>
                                {!showRebook ? (
                                    <div className="flex flex-col gap-3">
                                        <PassengerOptions onSelect={handleOptionSelect} />
                                    </div>
                                ) : (
                                    <div className="animate-slideDown">
                                        <button onClick={() => setShowRebook(false)} className="text-xs text-gray-400 mb-3 hover:text-white flex items-center gap-1">← BACK</button>
                                        <RebookingOptions options={rebookOptions} onSelect={(opt) => alert(`Mock: Rebooked on ${opt.flightNo}`)} />
                                    </div>
                                )}
                            </div>

                            {/* Embedded Chat Widget (Always visible on desktop) */}
                            <div className="bg-bg-panel border border-surface-border rounded-xl shadow-2xl flex flex-col h-[500px] overflow-hidden">
                                <div className="bg-accent/10 p-4 border-b border-surface-border flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                                        <h3 className="font-bold text-accent text-sm">SKYCOPILOT AI</h3>
                                    </div>
                                    <span className="text-[10px] uppercase font-mono text-gray-500">Online</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40 scrollbar-thin">
                                    {chatHistory.map((c, i) => (
                                        <div key={i} className={`flex ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] text-sm p-3 rounded-lg shadow-sm ${c.sender === 'user' ? 'bg-accent text-black rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'}`}>
                                                {c.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 border-t border-surface-border bg-surface flex gap-2">
                                    <input
                                        className="flex-1 bg-black border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-accent outline-none"
                                        placeholder={t.chat_placeholder}
                                        value={chatMsg}
                                        onChange={e => setChatMsg(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendChat()}
                                    />
                                    <button onClick={sendChat} className="bg-accent hover:bg-white text-black p-3 rounded-lg font-bold transition-colors">➤</button>
                                </div>
                            </div>

                            {/* Feedback - Mini version */}
                            <FeedbackWidget flightId={flightData.flight_id} />

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PassengerBridge;
