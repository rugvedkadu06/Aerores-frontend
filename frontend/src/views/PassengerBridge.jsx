
import React, { useState, useEffect } from 'react';
import Timeline from '../components/passenger/Timeline';
import VoucherCard from '../components/passenger/VoucherCard';
import RebookingOptions from '../components/passenger/RebookingOptions';

// Simulated Translation Dictionary
const DICT = {
    en: {
        title: "Passenger Assistance",
        subtitle: "Real-time updates & resolution",
        status_critical: "CRITICAL DELAY",
        reason_label: "TRANSPARENT REASON",
        reason_desc: "Pilot Duty Time Limits Exceeded. Crew requires mandatory rest for safety.",
        timeline: "Live Timeline",
        compensation: "Instant Compensation",
        rebook: "Quick Rebook",
        login_placeholder: "Enter Flight Number (e.g., 6E-202)"
    },
    hi: {
        title: "यात्री सहायता",
        subtitle: "वास्तविक समय अपडेट और समाधान",
        status_critical: "गंभीर देरी",
        reason_label: "स्पष्ट कारण",
        reason_desc: "पायलट ड्यूटी समय सीमा पार हो गई। सुरक्षा के लिए चालक दल को अनिवार्य आराम की आवश्यकता है।",
        timeline: "लाइव समयरेखा",
        compensation: "तत्काल मुआवजा",
        rebook: "त्वरित रीबुक",
        login_placeholder: "उड़ान संख्या दर्ज करें (जैसे, 6E-202)"
    },
    ta: {
        title: "பயணிகள் உதவி",
        subtitle: "நிகழ்நேர புதுப்பிப்புகள் & தீர்வு",
        status_critical: "முக்கியமான தாமதம்",
        reason_label: "வெளிப்படையான காரணம்",
        reason_desc: "விமானி பணி நேர வரம்புகள் மீறப்பட்டன. பாதுகாப்பிற்காக குழுவினருக்கு கட்டாய ஓய்வு தேவை.",
        timeline: "நிகழ்நேர காலவரிசை",
        compensation: "உடனடி இழப்பீடு",
        rebook: "விரைவு மறுபதிவு",
        login_placeholder: "விமான எண்ணை உள்ளிடவும்"
    },
    bn: {
        title: "যাত্রী সহায়তা",
        subtitle: "রিয়েল-টাইম আপডেট এবং সমাধান",
        status_critical: "গুরুতর বিলম্ব",
        reason_label: "স্বচ্ছ কারণ",
        reason_desc: "পাইলট ডিউটি ​​সময় সীমা অতিক্রম করেছে. নিরাপত্তার জন্য ক্রুদের বাধ্যতামূলক বিশ্রাম প্রয়োজন।",
        timeline: "লাইভ টাইমলাইন",
        compensation: "তাত্ক্ষণিক ক্ষতিপূরণ",
        rebook: "দ্রুত রিবুক",
        login_placeholder: "ফ্লাইট নম্বর লিখুন"
    }
};

const PassengerBridge = () => {
    const [lang, setLang] = useState('en');
    const [flightId, setFlightId] = useState('');
    const [flightData, setFlightData] = useState(null);
    const [showRebook, setShowRebook] = useState(false);

    const t = DICT[lang];

    // Mock Data Loading
    const handleSearch = () => {
        if (!flightId) return;

        // Simulate API Fetch
        setTimeout(() => {
            setFlightData({
                id: flightId,
                origin: "DEL",
                dest: "BOM",
                originalTime: "10:00 AM",
                newTime: "01:00 PM",
                delayReason: "CREW_TIMEOUT",
                status: "CRITICAL",
                vouchers: [
                    { type: "FOOD", amount: "500", currency: "INR", code: "W23-FOOD-99", expiry: "Today" }
                ],
                timeline: [
                    { time: "08:00 AM", title: "Check-in Open", description: "Counter 14-20", status: "DONE" },
                    { time: "09:15 AM", title: "Fog Detected", description: "Visibility drops below 50m", status: "DONE" },
                    { time: "09:45 AM", title: "Crew Timeout Predicted", description: "System Alert: Pilot cannot legally fly.", status: "CRITICAL" },
                    { time: "09:50 AM", title: "Rebooking Initiated", description: "Auto-options generated for passengers.", status: "ACTIVE" }
                ]
            });
        }, 800);
    };

    const rebookOptions = [
        { id: 1, time: "02:30 PM", flightNo: "6E-554", carrier: "IndiGo", seats: 12 },
        { id: 2, time: "04:15 PM", flightNo: "AI-887", carrier: "Air India", seats: 5 },
    ];

    if (!flightData) {
        return (
            <div className="min-h-screen bg-bg-void text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Language Switcher */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {['en', 'hi', 'ta', 'bn'].map(l => (
                        <button key={l} onClick={() => setLang(l)} className={`text-xs p-1 px-2 rounded ${lang === l ? 'bg-accent text-bg-void' : 'bg-surface text-gray-400'}`}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-sm space-y-8 animate-fadeIn">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tighter mb-2">AERO<span className="text-accent">RESILIENCE</span></h1>
                        <p className="text-gray-500 font-mono text-xs">{t.subtitle}</p>
                    </div>

                    <div className="bg-surface p-6 rounded-xl border border-surface-border">
                        <label className="text-xs text-gray-400 font-bold block mb-2">FLIGHT LOOKUP</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={flightId}
                                onChange={(e) => setFlightId(e.target.value)}
                                placeholder={t.login_placeholder}
                                className="bg-black/30 border border-gray-700 rounded p-3 w-full text-white placeholder-gray-600 focus:outline-none focus:border-accent"
                            />
                            <button onClick={handleSearch} className="bg-accent text-bg-void font-bold px-4 rounded hover:bg-accent-light">
                                GO
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 text-center"> Try: 6E-202 </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg-void text-white pb-20 relative">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-bg-void/80 backdrop-blur-md border-b border-surface-border p-4 flex justify-between items-center">
                <div>
                    <h1 className="font-bold text-lg">{flightData.id}</h1>
                    <div className="text-xs text-gray-400">{flightData.origin} ➔ {flightData.dest}</div>
                </div>
                <div className="flex gap-2">
                    {['en', 'hi'].map(l => (
                        <button key={l} onClick={() => setLang(l)} className={`text-[10px] w-6 h-6 rounded flex items-center justify-center ${lang === l ? 'bg-accent text-bg-void' : 'bg-surface text-gray-400'}`}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4 space-y-6 max-w-md mx-auto animate-slideUp">

                {/* Status Card */}
                <div className="bg-gradient-to-br from-red-900/40 to-black border border-red-500/50 rounded-xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-red-400 font-mono text-xs font-bold tracking-widest">{t.status_critical}</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-xs text-gray-500 font-bold mb-1">{t.reason_label}</div>
                            <p className="text-sm font-medium leading-relaxed">{t.reason_desc}</p>
                        </div>
                    </div>
                </div>

                {/* Vouchers */}
                <section>
                    <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">{t.compensation}</h2>
                    <div className="space-y-3">
                        {flightData.vouchers.map((v, i) => (
                            <VoucherCard key={i} {...v} />
                        ))}
                    </div>
                </section>

                {/* Rebooking */}
                <section>
                    <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">{t.rebook}</h2>
                    {!showRebook ? (
                        <button onClick={() => setShowRebook(true)} className="w-full py-3 bg-accent text-bg-void font-bold rounded-lg shadow-lg hover:brightness-110 transition-all">
                            {t.rebook} ➔
                        </button>
                    ) : (
                        <RebookingOptions options={rebookOptions} onSelect={(opt) => alert(`Rebooked on ${opt.flightNo}`)} />
                    )}
                </section>

                {/* Timeline */}
                <section>
                    <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">{t.timeline}</h2>
                    <Timeline events={flightData.timeline} language={lang} />
                </section>

            </main>
        </div>
    );
};

export default PassengerBridge;
