
import React from 'react';

const RebookingOptions = ({ options, onSelect }) => {
    return (
        <div className="space-y-3">
            {options.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => onSelect(opt)}
                    className="w-full text-left bg-surface hover:bg-surface-border border border-surface-border rounded-lg p-4 transition-all group relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white text-sm">{opt.time}</span>
                        <span className="text-xs font-mono text-accent">{opt.flightNo}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex justify-between">
                        <span>{opt.carrier}</span>
                        <span>{opt.seats} seats left</span>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            ))}
        </div>
    );
};

export default RebookingOptions;
