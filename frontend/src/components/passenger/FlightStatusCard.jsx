import React from 'react';

const FlightStatusCard = ({ data, t }) => {
    const isCritical = data.status === 'CRITICAL' || data.status === 'DELAYED' || data.status === 'CANCELLED';
    const statusColor = isCritical ? 'red' : 'emerald';

    // Status text mapping
    const statusText = {
        'ON_TIME': 'ON TIME',
        'DELAYED': 'DELAYED',
        'CRITICAL': 'SERIOUS DELAY',
        'CANCELLED': 'CANCELLED',
        'SCHEDULED': 'SCHEDULED'
    };

    return (
        <div className={`bg-gradient-to-br from-${statusColor}-900/40 to-black border border-${statusColor}-500/50 rounded-xl p-5 shadow-[0_0_30px_rgba(${isCritical ? '239,68,68' : '16,185,129'},0.15)] animate-slideDown`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full bg-${statusColor}-500 ${isCritical ? 'animate-ping' : ''}`}></span>
                    <span className={`text-${statusColor}-400 font-mono text-xs font-bold tracking-widest`}>
                        {statusText[data.status] || data.status}
                    </span>
                </div>
                {data.delay_minutes > 0 && (
                    <div className="text-status-warning font-bold text-sm bg-status-warning/10 px-2 py-1 rounded border border-status-warning/30">
                        +{data.delay_minutes} MIN
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">{t.reason_label || "Reason"}</div>
                    <h3 className="text-lg font-bold text-white mb-1">{data.plain_reason_title}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed font-light border-l-2 border-accent pl-3">
                        {data.plain_reason_desc}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FlightStatusCard;
