
import React, { useState } from 'react';
import axios from 'axios';

const CrewManagement = ({ pilots = [], onRefresh }) => {
    const [selectedPilot, setSelectedPilot] = useState(null);
    const [modifyMinutes, setModifyMinutes] = useState(60);
    const [costData, setCostData] = useState(null);

    const handleAllocateRest = async (pilotId) => {
        if (!confirm("Grant 24h Rest? This will reset all fatigue stats.")) return;
        try {
            await axios.post('http://127.0.0.1:8000/crew/update_rest', { pilot_id: pilotId });
            alert("Rest Allocated Successfully");
            if (handleRefresh) handleRefresh();
            setSelectedPilot(null);
        } catch (err) {
            alert("Failed to allocate rest");
        }
    };

    // Local state for standalone mode
    const [localPilots, setLocalPilots] = useState([]);

    // Determine effective data source
    const effectivePilots = pilots.length > 0 ? pilots : localPilots;

    // Fetch data if standalone (no props provided)
    React.useEffect(() => {
        if (pilots.length === 0) {
            fetchData();
        }
    }, [pilots]);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/data?page=1&limit=50');
            if (res.data.pilot_readiness) {
                setLocalPilots(res.data.pilot_readiness);
            }
        } catch (err) {
            console.error("Failed to fetch crew data", err);
        }
    };

    // Use internal refresh if no prop provided
    const handleRefresh = onRefresh || fetchData;

    const calculateCost = async () => {
        if (!selectedPilot) return;
        try {
            const res = await axios.post('http://127.0.0.1:8000/crew/calculate_cost', {
                pilot_id: selectedPilot._id,
                additional_minutes: parseInt(modifyMinutes)
            });
            setCostData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-full flex gap-6 overflow-hidden">
            {/* LEFT: ROSTER LIST */}
            <div className="w-2/3 bg-black/40 border border-surface-border rounded-lg overflow-hidden flex flex-col backdrop-blur-sm">
                <div className="p-4 border-b border-surface-border bg-surface/50">
                    <h2 className="text-xl font-bold font-display text-primary-400">Crew Roster & FDTL Status</h2>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs uppercase text-gray-500 border-b border-gray-800">
                                <th className="p-2">Name</th>
                                <th className="p-2">Base</th>
                                <th className="p-2">Duty (Today)</th>
                                <th className="p-2">Weekly Hours</th>
                                <th className="p-2">Fatigue</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {effectivePilots.map(p => {
                                const weeklyHours = (p.weekly_flight_minutes / 60).toFixed(1);
                                const isOvertime = p.weekly_flight_minutes > 2400; // >40h

                                return (
                                    <tr
                                        key={p._id}
                                        className={`border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer ${selectedPilot?._id === p._id ? 'bg-primary-900/20 border-primary-500/50' : ''}`}
                                        onClick={() => { setSelectedPilot(p); setCostData(null); }}
                                    >
                                        <td className="p-3 font-mono text-sm">{p.name || p._id}</td>
                                        <td className="p-3 text-sm text-gray-400">{p.base}</td>
                                        <td className="p-3 font-mono text-primary-300">{p.currentDutyMinutes}m</td>
                                        <td className="p-3 font-mono">
                                            <span className={isOvertime ? "text-red-400 font-bold" : "text-green-400"}>
                                                {weeklyHours}h
                                            </span>
                                            {isOvertime && <span className="ml-2 text-xs text-red-500 border border-red-500 px-1 rounded">OT</span>}
                                        </td>
                                        <td className="p-3">
                                            <div className="w-24 h-2 bg-gray-800 rounded overflow-hidden">
                                                <div
                                                    className={`h-full ${p.fatigue_score > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${p.fatigue_score * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                className="px-2 py-1 text-xs bg-surface border border-surface-border hover:bg-white/10 rounded"
                                                onClick={(e) => { e.stopPropagation(); setSelectedPilot(p); }}
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RIGHT: ACTION PANEL */}
            <div className="w-1/3 flex flex-col gap-4 overflow-hidden">

                {/* HEADLINE PANEL */}
                <div className="bg-black/40 border border-surface-border rounded-lg p-4 backdrop-blur-sm shrink-0">
                    <h3 className="text-lg font-bold text-gray-200 mb-1">Crew Operations</h3>
                    <p className="text-xs text-gray-400">Select a pilot from the roster to manage schedule.</p>
                </div>

                {selectedPilot ? (
                    <div className="bg-surface/30 border border-primary-500/30 rounded-lg p-4 flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 overflow-hidden">
                        <div className="shrink-0">
                            <span className="text-xs font-bold text-primary-400 tracking-wider">SELECTED CREW</span>
                            <h2 className="text-2xl font-display text-white mt-1">{selectedPilot.name || selectedPilot._id}</h2>
                            <div className="flex gap-4 mt-2 text-sm text-gray-400">
                                <span>Base: {selectedPilot.base}</span>
                                <span> • </span>
                                <span>OT Rate: ₹{selectedPilot.overtime_rate_per_hour}/hr</span>
                            </div>
                        </div>

                        {/* FATIGUE & REST */}
                        <div className="p-3 bg-black/40 rounded border border-surface-border shrink-0">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-300">Fatigue Risk</span>
                                <span className={`text-xl font-mono ${(selectedPilot.fatigue_score * 100) > 80 ? 'text-red-500' : 'text-green-500'}`}>
                                    {(selectedPilot.fatigue_score * 100).toFixed(0)}%
                                </span>
                            </div>
                            <button
                                onClick={() => handleAllocateRest(selectedPilot._id)}
                                className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded font-bold transition-all text-xs"
                            >
                                Grant 24h Mandatory Rest
                            </button>
                        </div>

                        {/* FLIGHT MODIFIER & COST */}
                        <div className="p-4 bg-black/40 rounded border border-surface-border flex-1 overflow-y-auto scrollbar-thin">
                            <h4 className="text-sm font-bold text-gray-300 mb-4">Modify Schedule & Calculate Cost</h4>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="number"
                                    value={modifyMinutes}
                                    onChange={(e) => setModifyMinutes(e.target.value)}
                                    className="bg-black border border-surface-border text-white px-3 py-2 rounded w-24 text-center font-mono"
                                />
                                <span className="self-center text-sm text-gray-400">mins extra flight</span>
                            </div>

                            <button
                                onClick={calculateCost}
                                className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded font-bold mb-4"
                            >
                                Calculate Detailed Impact
                            </button>

                            {costData && (
                                <div className="space-y-3 pt-4 border-t border-gray-800 animate-fadeIn">
                                    <h5 className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cost Breakdown</h5>

                                    <div className="bg-black/40 rounded p-2">
                                        <table className="w-full text-xs">
                                            <tbody>
                                                {costData.breakdown && costData.breakdown.map((item, i) => (
                                                    <tr key={i} className="border-b border-gray-800/50 last:border-0">
                                                        <td className="py-1 text-gray-400">{item.category}</td>
                                                        <td className="py-1 text-right font-mono text-white">₹{item.amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="border-t border-gray-700 font-bold">
                                                    <td className="py-2 text-white">TOTAL ESTIMATED COST</td>
                                                    <td className="py-2 text-right font-mono text-yellow-400 text-sm">₹{costData.cost.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-between text-sm items-center bg-gray-900/50 p-2 rounded">
                                        <span className="text-gray-400">Fatigue Impact:</span>
                                        <span className={`font-mono font-bold ${costData.projected_fatigue > 0.8 ? 'text-red-500' : 'text-green-500'}`}>
                                            {(selectedPilot.fatigue_score * 100).toFixed(0)}% &rarr; {(costData.projected_fatigue * 100).toFixed(0)}%
                                        </span>
                                    </div>

                                    {costData.is_overtime && (
                                        <div className="text-xs text-red-300 bg-red-900/30 p-2 rounded text-center border border-red-500/30 flex items-center justify-center gap-2">
                                            <span>⚠️</span>
                                            <span>High Cost: Includes Overtime / Slab Rates</span>
                                        </div>
                                    )}

                                    {costData.compliance && (
                                        <div className="space-y-2 pt-2 border-t border-gray-800">
                                            <h5 className="text-xs text-gray-500 font-bold uppercase tracking-wider">Compliance Checks</h5>

                                            <div className="flex justify-between text-xs items-center bg-gray-900/50 p-2 rounded">
                                                <span className="text-gray-400">Rest Period</span>
                                                <span className="font-mono text-green-400">{costData.compliance.rest_48h}</span>
                                            </div>
                                            <div className="flex justify-between text-xs items-center bg-gray-900/50 p-2 rounded">
                                                <span className="text-gray-400">Night Flights</span>
                                                <span className="font-mono text-yellow-500">{costData.compliance.night_flights}</span>
                                            </div>
                                            <div className="flex justify-between text-xs items-center bg-gray-900/50 p-2 rounded">
                                                <span className="text-gray-400">Recent Duty</span>
                                                <span className="font-mono text-blue-400">{costData.compliance.recent_duty}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-600 italic border border-dashed border-gray-800 rounded-lg">
                        Select a pilot to modify stats
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrewManagement;
