
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HealthBanner from './components/HealthBanner';
import FatigueGauge from './components/FatigueGauge';
import FlightTable from './components/FlightTable';
import AgentLogs from './components/AgentLogs';
import FlightDetailModal from './components/FlightDetailModal';
import PilotRoster from './components/PilotRoster';

const API_URL = 'http://localhost:8000';

function App() {
  const [pilots, setPilots] = useState([]);
  const [flights, setFlights] = useState([]);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('VALID');
  const [loading, setLoading] = useState(true);

  // New State for Advanced Features
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [mode, setMode] = useState('AUTO'); // AUTO | MANUAL
  const [options, setOptions] = useState([]); // For Manual Resolution
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD | CREW | FLEET
  const [selectedFlight, setSelectedFlight] = useState(null); // For Modal

  // --- Management Forms State ---
  const [newFlight, setNewFlight] = useState({ origin: 'DEL', destination: 'BOM', departure_delay_hours: 2 });

  const fetchData = async () => {
    try {
      const dataRes = await axios.get(`${API_URL}/data?page=${page}&limit=20`);
      setPilots(dataRes.data.pilot_readiness || []);
      setFlights(dataRes.data.flights || []);
      setLogs(dataRes.data.agent_logs || []);
      setTotal(dataRes.data.total_flights || 0);

      const statusRes = await axios.get(`${API_URL}/status`);
      setStatus(statusRes.data.status);
    } catch (error) {
      console.error("API Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Poll every 2s
    return () => clearInterval(interval);
  }, [page]);

  // Auto-Heal Trigger
  useEffect(() => {
    if (status !== 'VALID' && mode === 'AUTO') {
      console.log("Auto-Healing Triggered...");
      handleHeal();
    }
  }, [status, mode]);

  // --- Actions ---

  const handleSimulate = async (type) => {
    await axios.post(`${API_URL}/simulate`, { type });
    fetchData();
  };

  const handleHeal = async () => {
    const res = await axios.post(`${API_URL}/heal`, { mode });
    if (res.data.status === 'OPTIONS_GENERATED') {
      setOptions(res.data.options);
    } else {
      setOptions([]);
    }
    fetchData();
  };

  const resolveCrisis = async (option) => {
    await axios.post(`${API_URL}/resolve`, { option });
    setOptions([]);
    fetchData();
  };

  const handleReset = async () => {
    await axios.get(`${API_URL}/seed`);
    setPage(1);
    setOptions([]);
    fetchData();
  };



  const handleCreateFlight = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/flights`, newFlight);
    setNewFlight({ origin: 'DEL', destination: 'BOM', departure_delay_hours: 2 });
    fetchData();
  };

  if (loading && pilots.length === 0) return <div className="text-center mt-20 text-accent font-mono">Initializing System...</div>;

  const isCrisis = status !== 'VALID';
  const themeClass = isCrisis ? 'bg-red-950/30' : '';

  return (
    <div className={`h-screen font-sans selection:bg-accent selection:text-bg-void overflow-hidden flex flex-col transition-colors duration-1000 ${isCrisis ? 'shadow-[inset_0_0_100px_rgba(239,68,68,0.2)]' : ''}`}>
      <div className="flex-1 w-full max-w-[1920px] mx-auto p-4 flex flex-col min-h-0 space-y-4">

        {/* Crisis Overlay Popup */}
        {isCrisis && mode === 'MANUAL' && (
          <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-status-danger text-bg-void px-8 py-3 rounded font-bold tracking-widest shadow-crisis-lg flex items-center gap-3">
              <span className="text-2xl">⚠</span> SYSTEM CRITICAL
            </div>
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-surface-border pb-6 relative">
          <div className="relative z-10">
            <h1 className={`text-4xl md:text-5xl font-bold tracking-tighter mb-2 ${isCrisis ? 'text-status-danger animate-pulse-fast' : 'text-white'}`}>
              AERO<span className={isCrisis ? 'text-white' : 'text-accent'}>RESILIENCE</span>
            </h1>
            <div className="flex items-center gap-3 text-xs md:text-sm font-mono text-gray-500 tracking-widest">
              <span className={isCrisis ? 'text-status-danger' : 'text-accent'}>///</span>
              <span>SELF-HEALING ROSTER ENGINE</span>
              <span className="opacity-30">|</span>
              <span>V2.1.0-HITL</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 md:mt-0">
            {/* Navigation Tabs */}
            <div className="flex bg-surface rounded-lg p-1 gap-1">
              {['DASHBOARD', 'CREW', 'FLEET'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded transition-all ${activeTab === tab ? 'bg-bg-panel text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-surface border border-surface-border p-1 rounded-lg">
              <button
                onClick={() => setMode('AUTO')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${mode === 'AUTO' ? (isCrisis ? 'bg-status-danger text-white' : 'bg-accent text-bg-void') : 'text-gray-500 hover:text-gray-300'}`}
              >
                AUTO
              </button>
              <button
                onClick={() => setMode('MANUAL')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${mode === 'MANUAL' ? 'bg-status-warning text-bg-void' : 'text-gray-500 hover:text-gray-300'}`}
              >
                MANUAL
              </button>
            </div>

            <div className="text-right hidden md:block group cursor-pointer" onClick={() => isCrisis && mode === 'MANUAL' && handleHeal()}>
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">System Status</div>
              <div className="flex items-center justify-end gap-2">
                <span className={`w-2 h-2 rounded-full ${!isCrisis ? 'bg-status-success shadow-[0_0_8px_#10b981]' : 'bg-status-danger animate-pulse'}`}></span>
                <span className={`text-sm font-bold ${isCrisis ? 'text-status-danger group-hover:underline' : 'text-gray-300'}`}>
                  {status} {isCrisis && mode === 'MANUAL' && '(CLICK TO HEAL)'}
                </span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-surface hover:bg-surface-border border border-surface-border text-gray-400 text-xs font-mono tracking-widest rounded transition-all hover:text-white hover:shadow-glow-sm"
            >
              RESET
            </button>
          </div>
          <div className={`absolute bottom-[-1px] left-0 w-full h-[1px] opacity-50 bg-gradient-to-r from-transparent via-transparent to-transparent ${isCrisis ? 'via-status-danger' : 'via-accent-dim'}`}></div>
        </header>

        {/* === TAB CONTENT === */}

        {/* DASHBOARD TAB */}
        {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0">
            {/* Left Column: Pilots (4 cols) */}
            <div className="lg:col-span-4 space-y-6 h-full flex flex-col min-h-0">
              <section className={`bg-bg-panel border p-6 rounded-xl relative overflow-hidden flex-1 flex flex-col group ${isCrisis ? 'border-status-danger/30 shadow-crisis' : 'border-surface-border'}`}>
                <h2 className="text-sm font-mono text-gray-500 tracking-widest mb-6 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCrisis ? 'bg-status-danger' : 'bg-accent'}`}></span>
                  PILOT_READINESS
                </h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin">
                  {pilots.map(p => (
                    <FatigueGauge key={p._id} value={p.Fatigue_Risk_Score} label={p.Pilot_Name} subLabel={p.Rank} />
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Mission Control (8 cols) */}
            <div className="lg:col-span-8 space-y-4 h-full flex flex-col min-h-0">
              {/* Crisis Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['TECHNICAL', 'WEATHER', 'ATC', 'CREW'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSimulate(type)}
                    className={`group relative overflow-hidden bg-surface hover:bg-surface-border border border-surface-border rounded-lg p-4 transition-all ${isCrisis ? 'hover:border-status-danger' : 'hover:border-accent'}`}
                  >
                    <div className="text-xs font-mono text-gray-500 mb-1">SIMULATE</div>
                    <div className="font-bold text-gray-300 group-hover:text-white transition-colors">{type}</div>
                  </button>
                ))}
              </div>

              {/* HEAL BUTTON (Prominent in Auto/Manual) */}
              {/* Removed Fixed Heal Button as per user request */}
              {/* Auto Heal or Manual Options appear dynamically above based on state */}

              {/* Options Modal Inline */}
              {mode === 'MANUAL' && options.length > 0 && (
                <div className="bg-bg-panel border border-status-warning/30 rounded-xl p-6 relative animate-fadeIn">
                  <h3 className="text-status-warning font-mono text-sm tracking-widest mb-4 flex items-center gap-2">
                    <span className="animate-pulse">●</span> INTERVENTION_REQUIRED
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {options.map(opt => (
                      <div key={opt.id} onClick={() => resolveCrisis(opt)} className="bg-black/40 border border-surface-border hover:border-accent p-4 rounded cursor-pointer hover:bg-surface transition-all">
                        <div className="text-accent font-bold mb-2">{opt.title}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{opt.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flight Table */}
              <div className="bg-bg-panel border border-surface-border rounded-xl overflow-hidden p-4 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs text-gray-500 font-mono">LIVE_FLIGHT_DATA // {total} RECORDS</div>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="text-xs bg-surface px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50">PREV</button>
                    <span className="text-xs font-mono py-1 px-2">{page}</span>
                    <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="text-xs bg-surface px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50">NEXT</button>
                  </div>
                </div>
                <FlightTable flights={flights} onRowClick={setSelectedFlight} />
              </div>

              <div className="bg-bg-panel border border-surface-border rounded-md p-1">
                <AgentLogs logs={logs} />
              </div>

            </div>
          </div>
        )}

        {/* CREW TAB (ROSTER GANTT) */}
        {activeTab === 'CREW' && (
          <PilotRoster pilots={pilots} flights={flights} />
        )}

        {/* FLEET MANAGER TAB */}
        {activeTab === 'FLEET' && (
          <div className="grid grid-cols-1 lg:col-span-3 gap-8">
            {/* Form */}
            <div className="bg-bg-panel border border-surface-border p-6 rounded-xl h-fit">
              <h2 className="text-xl font-bold mb-4">Add Flight</h2>
              <form onSubmit={handleCreateFlight} className="space-y-4">
                <input className="w-full bg-black border border-surface-border p-2 rounded text-gray-300" placeholder="Origin" value={newFlight.origin} onChange={e => setNewFlight({ ...newFlight, origin: e.target.value })} />
                <input className="w-full bg-black border border-surface-border p-2 rounded text-gray-300" placeholder="Destination" value={newFlight.destination} onChange={e => setNewFlight({ ...newFlight, destination: e.target.value })} />
                <input type="number" className="w-full bg-black border border-surface-border p-2 rounded text-gray-300" placeholder="Delay Hours from Now" value={newFlight.departure_delay_hours} onChange={e => setNewFlight({ ...newFlight, departure_delay_hours: parseFloat(e.target.value) })} />
                <button type="submit" className="w-full bg-status-success text-bg-void font-bold py-2 rounded">SCHEDULE FLIGHT</button>
              </form>
            </div>
            {/* List (Simple text list for now, reusing FlightTable logic internally or just simple cards) */}
            <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto">
              <FlightTable flights={flights} onRowClick={setSelectedFlight} />
            </div>
          </div>
        )}

      </div>

      {/* Flight Detail Modal */}
      <FlightDetailModal
        flight={selectedFlight}
        pilots={pilots}
        onClose={() => setSelectedFlight(null)}
      />
    </div>
  );
}

export default App;
