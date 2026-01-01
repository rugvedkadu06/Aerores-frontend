import React from 'react';

export default function FlightTable({ flights, onRowClick }) {
    if (!flights || flights.length === 0) {
        return <div className="p-4 text-center text-gray-500 font-mono text-sm">NO DATA AVAILABLE</div>;
    }

    return (
        <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent">
            <table className="min-w-full text-left text-sm font-mono">
                <thead className="sticky top-0 z-10 bg-bg-panel/95 backdrop-blur-md text-gray-500 uppercase text-xs tracking-wider border-b border-surface-border">
                    <tr>
                        <th className="px-6 py-4 font-normal">Flight_ID</th>
                        <th className="px-6 py-4 font-normal">Route_Vector</th>
                        <th className="px-6 py-4 font-normal">ETD</th>
                        <th className="px-6 py-4 font-normal">Pilot_Command</th>
                        <th className="px-6 py-4 font-normal">Disruption</th>
                        <th className="px-6 py-4 font-normal text-right">Sys_Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-gray-300">
                    {flights.map((flight) => {
                        const isUnassigned = !flight.Name || flight.Name === "UNASSIGNED" || flight.Sys_Status === 'UNASSIGNED';
                        const rowClass = isUnassigned
                            ? "bg-status-danger/10 text-status-danger/90 hover:bg-status-danger/15"
                            : "hover:bg-surface";

                        // Status Logic
                        let statusColor = 'border-gray-500 text-gray-400';
                        if (flight.Sys_Status === 'SCHEDULED') statusColor = 'border-status-success text-status-success bg-status-success/10';
                        if (flight.Sys_Status === 'DELAYED' || flight.Sys_Status === 'RISK_HIGH') statusColor = 'border-status-warning text-status-warning bg-status-warning/10';
                        if (flight.Sys_Status === 'CANCELLED' || flight.Sys_Status === 'UNASSIGNED') statusColor = 'border-status-danger text-status-danger bg-status-danger/10';

                        return (
                            <tr
                                key={flight._id}
                                onClick={() => onRowClick && onRowClick(flight)}
                                className={`transition-colors duration-150 cursor-pointer ${rowClass}`}
                            >
                                <td className="px-6 py-4 font-bold tracking-tight text-accent">{flight.Flight_ID}</td>
                                <td className="px-6 py-4 opacity-80">{flight.Route}</td>
                                <td className="px-6 py-4 opacity-70">
                                    {new Date(flight.Departure_Time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4">
                                    {!isUnassigned ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_5px_#10b981]"></div>
                                            {flight.Name}
                                            <span className="text-xs opacity-50 ml-1">({flight.Pilot_ID})</span>
                                        </div>
                                    ) : (
                                        <span className="text-status-danger animate-pulse flex items-center gap-2">
                                            <span>⚠</span> UNASSIGNED
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {flight.Disruption_Type && (
                                        <span className="px-2 py-0.5 rounded bg-surface-border text-gray-400">
                                            {flight.Disruption_Type}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`inline-block px-2 py-1 rounded text-[10px] tracking-widest border ${statusColor}`}>
                                            {flight.Sys_Status}
                                        </span>
                                        {flight.Delay_Minutes && flight.Sys_Status === 'DELAYED' && (
                                            <span className="text-[10px] text-status-warning">+{flight.Delay_Minutes}m</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
