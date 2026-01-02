
import React from 'react';

const VoucherCard = ({ type, amount, currency, code, expiry }) => {
    const isFood = type === 'FOOD';
    const bgClass = isFood ? 'bg-orange-500/10 border-orange-500/30' : 'bg-purple-500/10 border-purple-500/30';
    const textClass = isFood ? 'text-orange-400' : 'text-purple-400';
    const icon = isFood ? '🍔' : '🏨';

    return (
        <div className={`border rounded-xl p-4 flex flex-col gap-3 ${bgClass}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <div className={`text-xs font-bold tracking-widest ${textClass}`}>{type} VOUCHER</div>
                        <div className="text-white font-bold text-lg">{currency} {amount}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-400">EXPIRY</div>
                    <div className="text-xs text-gray-300">{expiry}</div>
                </div>
            </div>

            <div className="bg-black/40 rounded border border-white/10 p-3 flex justify-between items-center cursor-pointer hover:bg-black/60 transition-colors group">
                <div className="font-mono text-sm tracking-widest text-gray-300 group-hover:text-white">{code}</div>
                <div className="text-xs text-gray-500">TAP TO COPY</div>
            </div>

            <div className="text-[10px] text-gray-500 leading-tight">
                Valid at all partner outlets in the terminal. Show QR code (simulated) at counter.
            </div>
        </div>
    );
};

export default VoucherCard;
