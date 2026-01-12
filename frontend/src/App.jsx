
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import FatigueGauge from './components/FatigueGauge';
import FlightTable from './components/FlightTable';
import AgentLogs from './components/AgentLogs';
import FlightDetailModal from './components/FlightDetailModal';
import PassengerBridge from './views/PassengerBridge';
import CrewManagement from './views/CrewManagement';

const API_URL = 'http://localhost:8000';

const AgentStatusVisualizer = ({ status, mode, latestLog, onRefresh }) => {
  return (
    <div className="flex items-center gap-4 bg-black/40 border border-surface-border p-3 rounded-lg backdrop-blur-sm">
      <div className={`w-3 h-3 rounded-full ${status === 'CRITICAL' ? 'bg-status-danger animate-ping' : 'bg-status-success'}`}></div>
      <div className="flex-1">
        <div className="flex justify-between items-center text-xs font-mono mb-1">
          <span className="text-gray-400">CO-PILOT_STATE</span>
          <span className={status === 'CRITICAL' ? 'text-status-danger' : 'text-status-success'}>
            {status === 'CRITICAL' ? 'AWAITING_APPROVAL' : 'MONITORING_OPS'}
          </span>
        </div>
        <div className="text-[10px] text-accent truncate max-w-[200px] opacity-80">
          {latestLog || "Co-Pilot Standby..."}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs font-bold font-mono px-2 py-1 rounded bg-surface border border-surface-border">
          {mode}
        </div>
        <button
          onClick={onRefresh}
          className="p-1 rounded bg-surface border border-surface-border hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Force Refresh"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

// --- LOADING SCREEN ---
const LoadingScreen = () => (
  <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fadeOut pointer-events-none delay-[2000ms]">
    <div className="text-4xl font-bold tracking-tighter text-white mb-4 animate-pulse">
      SKY<span className="text-accent">COPILOT</span>
    </div>
    <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full bg-accent animate-loadingBar"></div>
    </div>
    <div className="mt-2 text-xs font-mono text-gray-500">INITIALIZING AI AGENTS...</div>
  </div>
);

function UnifiedDashboard() {
  const [pilots, setPilots] = useState([]);
  const [flights, setFlights] = useState([]);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('VALID');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [mode, setMode] = useState('AUTO');
  const [options, setOptions] = useState([]);
  const [recommendation, setRecommendation] = useState(null); // New state for Co-Pilot Rec
  const [selectedFlight, setSelectedFlight] = useState(null);

  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Simulation State
  const [simType, setSimType] = useState('WEATHER');
  const [simSubType, setSimSubType] = useState('Fog');
  const [targetFlight, setTargetFlight] = useState(''); // Empty = All

  const [isLoading, setIsLoading] = useState(true);

  // Manual Delay State
  const [showDelayInput, setShowDelayInput] = useState(false);
  const [manualDelayMinutes, setManualDelayMinutes] = useState(60);
  const [pendingOption, setPendingOption] = useState(null);

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
    }
  };

  useEffect(() => {
    // Show splash on mount
    const timer = setTimeout(() => setIsLoading(false), 2500);
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [page]);

  useEffect(() => {
    // FIX: Trigger heal logic regardless of mode if status is invalid
    if (status !== 'VALID') {
      handleHeal();
    }
  }, [status, mode]);

  const handleHeal = async () => {
    const res = await axios.post(`${API_URL}/heal`, { mode });
    if (res.data.status === 'OPTIONS_GENERATED') {
      setOptions(res.data.options);
      setRecommendation(res.data); // Store full recommendation packet
      setShowDelayInput(false);
    } else {
      if (mode !== 'MANUAL') {
        setOptions([]);
        setRecommendation(null);
      }
    }
    fetchData();
  };

  const resolveCrisis = async (option) => {
    // If approving recommended strategy, use it directly
    const optToUse = option || (recommendation ? recommendation.recommended_strategy : null);
    if (!optToUse) return;

    if (optToUse.action_type === 'DELAY_MANUAL') {
      setPendingOption(optToUse);
      setShowDelayInput(true);
      return;
    }
    await axios.post(`${API_URL}/resolve`, { option: optToUse });
    setOptions([]);
    setRecommendation(null);
    fetchData();
  };

  const confirmManualDelay = async () => {
    if (!pendingOption) return;
    const finalOption = {
      ...pendingOption,
      action_type: 'DELAY_APPLY',
      payload: { ...pendingOption.payload, minutes: parseInt(manualDelayMinutes) }
    };
    await axios.post(`${API_URL}/resolve`, { option: finalOption });
    setOptions([]);
    setRecommendation(null);
    setShowDelayInput(false);
    fetchData();
  };

  const handleReset = async () => {
    await axios.get(`${API_URL}/seed`);
    fetchData();
  };

  const runSim = async () => {
    await axios.post(`${API_URL}/simulate`, {
      type: simType,
      subType: simSubType,
      flight_id: targetFlight || null,
      airport: "DEL",
      severity: "HIGH"
    });
  };

  const isCrisis = status !== 'VALID';

  const analyticsData = flights.map(f => ({
    name: f.flightNumber,
    risk: f.predictedFailure ? 100 : 10,
    fatigue: pilots.find(p => p._id === f.assignedPilotId)?.fatigue_score * 100 || 0
  })).slice(0, 10);

  return (
    <div className={`h-screen font-sans selection:bg-accent selection:text-bg-void overflow-hidden flex flex-col transition-colors duration-1000 ${isCrisis ? 'shadow-[inset_0_0_100px_rgba(239,68,68,0.2)]' : ''}`}>
      {isLoading && <LoadingScreen />}

      <header className="flex flex-col md:flex-row justify-between items-end border-b border-surface-border p-4 pb-2 bg-bg-panel/50 backdrop-blur-md z-50">
        <div>
          <h1 className={`text-3xl font-bold tracking-tighter ${isCrisis ? 'text-status-danger animate-pulse' : 'text-white'}`}>
            SKY<span className={isCrisis ? 'text-white' : 'text-accent'}>COPILOT</span>
          </h1>
          <div className="flex gap-4 mt-2">
            {['DASHBOARD', 'CREW', 'SIMULATION', 'ANALYSIS'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-mono font-bold tracking-widest pb-1 border-b-2 transition-all ${activeTab === tab ? 'border-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/passenger" className="text-xs font-mono text-gray-400 hover:text-accent flex items-center gap-1">
            <span>➜</span> PASSENGER BRIDGE
          </Link>
          <AgentStatusVisualizer
            status={status}
            mode={mode}
            latestLog={logs[logs.length - 1]}
            onRefresh={fetchData}
          />

          <div className="flex bg-surface border border-surface-border rounded p-0.5">
            <button onClick={() => setMode('AUTO')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${mode === 'AUTO' ? 'bg-accent text-bg-void' : 'text-gray-500'}`}>AUTO</button>
            <button onClick={() => setMode('MANUAL')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${mode === 'MANUAL' ? 'bg-status-warning text-bg-void' : 'text-gray-500'}`}>MANUAL</button>
          </div>
          <button onClick={handleReset} className="text-[10px] bg-red-900/30 text-red-400 border border-red-900 px-2 py-1 rounded hover:bg-red-900/50">RESET DB</button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 relative">

        {/* --- SAFETY BANNER --- */}
        <div className="bg-blue-900/30 border-b border-blue-800 p-1 text-center text-[10px] font-mono text-blue-200 tracking-widest uppercase">
          🛡️ Global Safety Protocol Active: Human Dignity & Ethics Prioritized Over Efficiency
        </div>

        {/* --- CO-PILOT INTERVENTION MODAL --- */}
        {isCrisis && recommendation && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl animate-slideDown">
            <div className="bg-bg-void/95 backdrop-blur-xl border border-status-danger rounded-xl p-8 shadow-[0_0_100px_rgba(239,68,68,0.4)] flex flex-col gap-6">

              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-status-danger font-bold text-2xl mb-1 flex items-center gap-3">
                    <span className="w-3 h-3 bg-status-danger rounded-full animate-ping"></span>
                    CRITICAL OPS ALERT
                  </h3>
                  <p className="text-gray-400 text-sm">Disruption Detected. AI Co-Pilot has analyzed {options.length} strategies.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-mono">CONFIDENCE</div>
                  <div className="text-xl font-bold text-accent">98.5%</div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* LEFT: Recommendation Engine */}
                <div className="col-span-8 space-y-4">
                  <div className="bg-status-success/10 border border-status-success/50 p-5 rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-status-success text-black text-[10px] font-bold px-2 py-1">BEST RECOMMENDATION</div>
                    <h4 className="text-status-success font-bold text-lg mb-2">{recommendation.recommended_strategy.title}</h4>
                    <p className="text-gray-300 text-sm mb-4">{recommendation.recommended_strategy.description}</p>

                    {/* Explainability Trace */}
                    <div className="bg-black/40 rounded p-3 text-xs font-mono text-gray-400 border-l-2 border-status-success">
                      <div className="text-gray-500 mb-1">REASONING TRACE:</div>
                      {recommendation.reasoning_trace.map((line, i) => (
                        <div key={i}>&gt; {line}</div>
                      ))}
                    </div>
                  </div>

                  {/* Sustainability Impact */}
                  {recommendation.sustainability_impact && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-surface p-3 rounded border border-surface-border text-center">
                        <div className="text-xl font-bold text-accent">{recommendation.sustainability_impact.co2_saved_kg} kg</div>
                        <div className="text-[10px] text-gray-500">CO2 SAVED</div>
                      </div>
                      <div className="bg-surface p-3 rounded border border-surface-border text-center">
                        <div className="text-xl font-bold text-white">{parseInt(recommendation.sustainability_impact.fuel_saved_liters)} L</div>
                        <div className="text-[10px] text-gray-500">FUEL SAVED</div>
                      </div>
                      <div className="bg-surface p-3 rounded border border-surface-border flex items-center justify-center text-center">
                        <div className="text-[10px] text-gray-400 italic">"{recommendation.sustainability_impact.energy_efficiency_note}"</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Actions */}
                <div className="col-span-4 flex flex-col gap-3 justify-center border-l border-gray-800 pl-8">
                  <button
                    onClick={() => resolveCrisis(recommendation.recommended_strategy)}
                    className="w-full py-4 bg-status-success hover:bg-green-600 text-black font-bold rounded shadow-lg shadow-green-900/20 active:scale-95 transition-all text-sm tracking-wide"
                  >
                    APPROVE CO-PILOT
                  </button>

                  <div className="text-center text-[10px] text-gray-500 my-2">- OR -</div>

                  <button
                    onClick={() => { setRecommendation(null); setMode('MANUAL'); }}
                    className="w-full py-3 bg-surface border border-gray-600 hover:bg-gray-800 text-white rounded transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    <span>☰</span>
                    {options.some(o => o.action_type === 'SWAP_FLIGHT') ? "VIEW SWAP OPTIONS" : "VIEW ALL OPTIONS"}
                  </button>

                  <button
                    onClick={() => resolveCrisis({ action_type: 'DELAY_MANUAL', payload: { flight_id: recommendation.recommended_strategy.payload.flight_id } })}
                    className="w-full py-3 bg-red-900/20 border border-status-danger text-status-danger hover:bg-red-900/40 rounded transition-colors text-xs"
                  >
                    MANUAL OVERRIDE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Fallback List (Only if recommendation ignored or manual mode) */}
        {isCrisis && !recommendation && options.length > 0 && mode === 'MANUAL' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl animate-slideDown">
            <div className="bg-bg-void/90 backdrop-blur-xl border border-status-warning rounded-xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
              <h3 className="text-status-warning font-bold text-lg mb-4 flex items-center gap-2">
                ⚠️ MANUAL OVERRIDE MODE
              </h3>
              {!showDelayInput ? (
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => resolveCrisis(opt)}
                      className={`text-left p-3 rounded border transition-all group relative overflow-hidden ${opt.action_type === 'SWAP_FLIGHT' ? 'border-accent/40 hover:bg-accent/10' : 'border-surface-border hover:bg-surface'}`}
                    >
                      {opt.action_type === 'SWAP_FLIGHT' && <div className="absolute top-0 right-0 bg-accent text-black text-[9px] font-bold px-1 rounded-bl">SWAP</div>}

                      <div className="flex items-center gap-3">
                        <span className="text-xl">{opt.action_type === 'SWAP_FLIGHT' ? '🔁' : opt.action_type === 'ASSIGN' ? '👨‍✈️' : '⏱️'}</span>
                        <div>
                          <div className={`font-bold text-sm ${opt.action_type === 'SWAP_FLIGHT' ? 'text-accent' : 'text-white'}`}>{opt.title}</div>
                          <div className="text-xs text-gray-500">{opt.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => fetchData()} className="text-xs text-gray-500 mt-2 underline text-center w-full">Refresh Strategies</button>
                </div>
              ) : (
                // ... Manual Delay Input Same as before ...
                <div className="bg-surface p-4 rounded border border-status-warning/50 animate-fadeIn">
                  <h4 className="text-status-warning font-bold mb-2">Configure Manual Delay</h4>
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Duration (Minutes)</label>
                    <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" value={manualDelayMinutes} onChange={(e) => setManualDelayMinutes(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={confirmManualDelay} className="flex-1 bg-status-warning text-black font-bold py-2 rounded">CONFIRM</button>
                    <button onClick={() => setShowDelayInput(false)} className="px-4 py-2 border border-gray-700 rounded text-gray-400">BACK</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TABS CONTENT --- */}

        {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-3 bg-bg-panel border border-surface-border rounded-xl p-4 flex flex-col overflow-hidden">
              <h3 className="text-xs font-mono text-gray-500 mb-4 tracking-widest">CREW_FATIGUE_STATE</h3>
              <div className="overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                {pilots.map(p => (
                  <FatigueGauge key={p._id} value={p.fatigue_score || 0} label={p.name} subLabel={`${p.base} | ${p.remainingDutyMinutes}m`} />
                ))}
              </div>
            </div>

            <div className="col-span-9 flex flex-col gap-6 h-full overflow-hidden">
              <div className="flex-[0.65] bg-bg-panel border border-surface-border rounded-xl p-4 overflow-hidden flex flex-col">
                <FlightTable flights={flights} onRowClick={setSelectedFlight} />
              </div>
              <div className="flex-[0.35] bg-bg-panel border border-surface-border rounded-xl p-0 overflow-hidden flex flex-col">
                <AgentLogs logs={logs} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CREW' && (
          <CrewManagement pilots={pilots} onRefresh={fetchData} />
        )}

        {activeTab === 'SIMULATION' && (
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-2xl bg-bg-panel border border-surface-border rounded-xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-accent">⚡</span> INJECTION CONTROL
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">DISRUPTION_TYPE</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['WEATHER', 'TECHNICAL', 'ATC', 'CREW'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSimType(t)}
                        className={`p-3 border rounded-lg text-xs font-bold transition-all ${simType === t ? 'border-accent bg-accent/20 text-white' : 'border-surface-border bg-surface text-gray-500 hover:border-gray-600'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">CONDITION</label>
                  <select
                    className="w-full p-3 bg-gray-900 border border-surface-border rounded text-white font-mono focus:border-accent outline-none"
                    value={simSubType}
                    onChange={(e) => setSimSubType(e.target.value)}
                  >
                    {simType === 'WEATHER' && (
                      <>
                        <option className="bg-gray-900 text-white" value="Fog">Heavy Fog (Vis &lt; 50m)</option>
                        <option className="bg-gray-900 text-white" value="Thunderstorm">Severe Thunderstorm</option>
                        <option className="bg-gray-900 text-white" value="Cyclone">Cyclone Warning</option>
                      </>
                    )}
                    {simType === 'TECHNICAL' && <option className="bg-gray-900 text-white" value="Technical">Hydraulic Failure</option>}
                    {simType === 'ATC' && <option className="bg-gray-900 text-white" value="ATC">Airspace Closure</option>}
                    {simType === 'CREW' && <option className="bg-gray-900 text-white" value="Sickness">Pilot Incapacitated (Sickness)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">TARGET_FLIGHT</label>
                  <select
                    className="w-full p-3 bg-gray-900 border border-surface-border rounded text-white font-mono focus:border-accent outline-none"
                    value={targetFlight}
                    onChange={(e) => setTargetFlight(e.target.value)}
                  >
                    <option className="bg-gray-900 text-white" value="">ALL FLIGHTS @ ORIGIN</option>
                    {flights.map(f => (
                      <option className="bg-gray-900 text-white" key={f._id} value={f._id}>{f.flightNumber} ({f.origin} -&gt; {f.destination})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={runSim}
                  className="w-full py-4 bg-status-danger hover:bg-red-600 text-white font-bold tracking-widest rounded transition-all shadow-lg active:scale-95"
                >
                  EXECUTE INJECTION
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ANALYSIS' && (
          <div className="grid grid-cols-2 gap-6 h-full">
            <div className="bg-bg-panel border border-surface-border rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-6">PREDICTED RISK VS FATIGUE</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} />
                    <YAxis stroke="#4b5563" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="fatigue" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-bg-panel border border-surface-border rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">🌱 GREEN OPERATIONS IMPACT (Industry 5.0)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded text-center border border-green-900/50">
                  <div className="text-3xl font-bold text-green-400">1,240 <span className="text-xs text-gray-500">kg</span></div>
                  <div className="text-xs text-gray-400 mt-1">CO2 EMISSIONS PREVENTED</div>
                </div>
                <div className="bg-surface p-4 rounded text-center border border-green-900/50">
                  <div className="text-3xl font-bold text-green-400">480 <span className="text-xs text-gray-500">L</span></div>
                  <div className="text-xs text-gray-400 mt-1">AVIATION FUEL SAVED</div>
                </div>
                <div className="bg-surface p-4 rounded text-center col-span-2 flex items-center justify-between px-8">
                  <div className="text-left">
                    <div className="text-xl font-bold text-white">94%</div>
                    <div className="text-[10px] text-gray-500">ECO-OPTIMIZED RESOLUTIONS</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">12.5h</div>
                    <div className="text-[10px] text-gray-500">IDLE ENGINE TIME AVOIDED</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <FlightDetailModal flight={selectedFlight} pilots={pilots} onClose={() => setSelectedFlight(null)} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UnifiedDashboard />} />
        <Route path="/passenger" element={<PassengerBridge />} />
        <Route path="/crew" element={<CrewManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
