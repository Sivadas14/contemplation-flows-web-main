// SimpleProgressBar.tsx - Updated for unlimited handling
import React from 'react';

interface SimpleProgressBarProps {
    label: string;
    icon: React.ReactNode;
    used: number;
    total: number | string; // Allow string for "Unlimited"
    colorClass: string;
}

export const SimpleProgressBar: React.FC<SimpleProgressBarProps> = ({ label, icon, used, total, colorClass }) => {
    // Check if total is "Unlimited"
    const isUnlimited = total === 'Unlimited' || total === 'unlimited';

    // For unlimited, we show a different UI
    if (isUnlimited) {
        return (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm  font-medium text-[#472b20]">{label}</span>
                    </div>
                    <span className="text-xs text-[#472b20]  font-bold">
                        Unlimited
                    </span>
                </div>
                <div className="w-full bg-[#ECE5DF] rounded-full h-2.5 mt-1">
                    <div className={`${colorClass} h-2.5 rounded-full w-full opacity-80`} />
                </div>
            </div>
        );
    }

    // For limited resources
    const numericTotal = typeof total === 'string' ? parseInt(total, 10) : total;
    const percentage = numericTotal > 0 ? (Math.min(used, numericTotal) / numericTotal) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm  font-medium text-[#472b20]">{label}</span>
                </div>
                <span className="text-xs text-[#472b20]/40  font-semibold">
                    {used} / {numericTotal}
                </span>
            </div>
            <div className="w-full bg-[#ECE5DF] rounded-full h-2.5 mt-1">
                <div
                    className={`${colorClass} h-2.5 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};