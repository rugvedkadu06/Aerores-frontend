
import React, { useState } from 'react';

const RightsCard = ({ rights, t }) => {
    return (
        <div className="space-y-3">
            {rights.map((right, index) => (
                <div key={index} className="bg-surface border border-surface-border rounded-lg overflow-hidden transition-all hover:bg-gray-800/50">
                    <div className="p-4 flex gap-4 items-start">
                        <div className="text-2xl bg-gray-900 rounded-lg p-2 h-12 w-12 flex items-center justify-center border border-gray-700">
                            {right.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-base mb-1">{right.title}</h4>
                            <div className="text-xs font-mono text-status-warning mb-2 border border-status-warning/30 bg-status-warning/10 inline-block px-1.5 py-0.5 rounded">
                                {right.reason}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-400">
                                <div>
                                    <span className="block text-gray-600 font-bold uppercase tracking-wider text-[10px]">Entitlement</span>
                                    {right.allowance}
                                </div>
                                <div>
                                    <span className="block text-gray-600 font-bold uppercase tracking-wider text-[10px]">Timing</span>
                                    {right.timing}
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-300">
                                <span className="text-accent mr-1">ℹ️</span> {right.claim_process}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RightsCard;
