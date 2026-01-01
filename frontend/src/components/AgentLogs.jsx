import React from 'react';

const Node = ({ label, status, index }) => {
    let statusClass = 'border-gray-600 bg-surface text-gray-400';
    let icon = '○';

    if (status === 'active') {
        statusClass = 'border-accent bg-accent/10 text-white animate-pulse shadow-[0_0_15px_rgba(56,189,248,0.3)]';
        icon = '●';
    } else if (status === 'completed') {
        statusClass = 'border-status-success bg-status-success/10 text-status-success';
        icon = '✓';
    } else if (status === 'error') {
        statusClass = 'border-status-danger bg-status-danger/10 text-status-danger';
        icon = '✕';
    } else if (status === 'pending') {
        statusClass = 'border-surface-border bg-surface text-gray-600 opacity-50';
    }

    return (
        <div className="flex flex-col items-center min-w-[140px] relative group cursor-pointer">
            {/* Connection Line */}
            {index > 0 && (
                <div className={`absolute top-1/2 right-1/2 w-full h-[2px] -translate-y-1/2 translate-x-1/2 -z-10 ${status === 'pending' ? 'bg-gray-800' : 'bg-accent/30'}`}></div>
            )}
            {/* Left Connector (if not first) */}
            {index > 0 && (
                <div className={`absolute top-1/2 left-0 w-[50%] h-[2px] -translate-y-1/2 -z-10 ${status === 'pending' ? 'bg-gray-800' : 'bg-accent/30'}`}></div>
            )}

            <div className={`relative z-10 w-full p-4 rounded-xl border ${statusClass} transition-all duration-300 hover:scale-105 hover:shadow-lg bg-bg-panel`}>
                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                    <span className="text-[9px] font-mono uppercase opacity-70">Step {index + 1}</span>
                    <span className="text-xs">{icon}</span>
                </div>
                <div className="font-bold text-xs leading-tight">{label}</div>
            </div>

            {/* Simple Glow Effect Behind */}
            {status === 'active' && <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full z-0 animate-pulse"></div>}
        </div>
    );
};

export default function AgentLogs({ logs }) {
    // Mock flow logic
    let nodes = [
        { id: 1, label: 'Monitor Traffic', status: 'active' },
        { id: 2, label: 'Anomaly Detection', status: 'pending' },
        { id: 3, label: 'Constraint Solver', status: 'pending' },
        { id: 4, label: 'Negotiation Agent', status: 'pending' },
        { id: 5, label: 'Execution', status: 'pending' }
    ];

    // Dynamic Status Logic based on Keywords
    const latestLog = logs.length > 0 ? logs[logs.length - 1] : "";
    const allLogs = logs.join(" ");

    if (allLogs.includes("found")) nodes[0].status = 'completed'; // Monitor Traffic
    if (allLogs.includes("SICK") || allLogs.includes("FATIGUE") || allLogs.includes("DELAYED") || allLogs.includes("TECHNICAL") || allLogs.includes("ATC") || allLogs.includes("WEATHER") || allLogs.includes("CREW")) {
        nodes[0].status = 'completed';
        nodes[1].status = 'active'; // Anomaly Detection
    }
    if (allLogs.includes("risk") || allLogs.includes("Analysis")) {
        nodes[1].status = 'completed';
        nodes[2].status = 'active'; // Constraint Solver
    }
    if (allLogs.includes("Options") || allLogs.includes("OPTIONS_GENERATED") || allLogs.includes("Negotiation")) {
        nodes[2].status = 'completed';
        nodes[3].status = 'active'; // Negotiation
    }
    if (allLogs.includes("Applied") || allLogs.includes("HEALED")) {
        nodes[3].status = 'completed';
        nodes[4].status = 'completed'; // Execution
    }

    return (
        <div className="p-6 bg-black/40 rounded-xl border border-surface-border backdrop-blur-sm">
            <h3 className="text-xs font-mono text-gray-500 mb-8 tracking-widest flex items-center gap-2">
                <span className="text-accent animate-spin-slow">◈</span> LIVE_AGENT_WORKFLOW
            </h3>

            {/* Workflow Container */}
            <div className="flex gap-4 items-center overflow-x-auto pb-6 scrollbar-thin">
                {nodes.map((node, i) => (
                    <React.Fragment key={node.id}>
                        <Node label={node.label} status={node.status} index={i} />
                        {i < nodes.length - 1 && <div className={`h-[2px] w-8 flex-shrink-0 ${node.status === 'completed' ? 'bg-accent' : 'bg-gray-800'}`}></div>}
                    </React.Fragment>
                ))}
            </div>

            {/* Raw Logs Drawer */}
            {logs.length > 0 && (
                <div className="mt-6 border-t border-surface-border pt-4">
                    <div className="font-mono text-[10px] text-gray-600 mb-3 uppercase flex justify-between">
                        <span>Runtime_Logs</span>
                        <span className="text-accent">{logs.length} Events</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-xs text-gray-400 p-2 bg-black/20 rounded">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2 hover:bg-white/5 p-1 rounded transition-colors">
                                <span className="text-accent opacity-50">&gt;</span>
                                <span>{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
