
import React from 'react';

const PassengerOptions = ({ onSelect }) => {
    const options = [
        {
            id: 'WAIT',
            icon: '☕',
            title: "Wait comfortably",
            subtitle: "View lounge & rest areas"
        },
        {
            id: 'REBOOK',
            icon: '🔁',
            title: "Rebook Flight",
            subtitle: "Check next available connections"
        },
        {
            id: 'REFUND',
            icon: '💸',
            title: "Cancel & Refund",
            subtitle: "Process full refund to original source"
        },
        {
            id: 'HOTEL',
            icon: '🛏️',
            title: "Overnight Stay",
            subtitle: "Request hotel voucher entitlement"
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => onSelect(opt.id)}
                    className="bg-surface hover:bg-surface-border border border-surface-border rounded-lg p-4 text-left transition-all hover:scale-[1.02] group"
                >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">{opt.icon}</div>
                    <div className="font-bold text-white text-xs mb-0.5">{opt.title}</div>
                    <div className="text-[10px] text-gray-500">{opt.subtitle}</div>
                </button>
            ))}
        </div>
    );
};

export default PassengerOptions;
