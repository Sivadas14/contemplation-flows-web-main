import React from 'react';

interface UsageMetricProps {
    icon: React.ReactNode;
    label: string;
    used: number;
    limit: number | string;
    colorClass?: string;
    showResetMessage?: boolean;
    resetDays?: number;
    isLoading?: boolean;
}

export const UsageMetric: React.FC<UsageMetricProps> = ({
    icon,
    label,
    used,
    limit,
    colorClass = 'bg-orange-500',
    showResetMessage = false,
    resetDays,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                        <div className="w-24 h-4 bg-gray-200 rounded" />
                    </div>
                    <div className="w-16 h-4 bg-gray-200 rounded" />
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2" />
            </div>
        );
    }

    const isUnlimited = typeof limit === 'string' && limit.toLowerCase() === 'unlimited';
    const limitNum = typeof limit === 'number' ? limit : parseInt(limit) || 0;
    const percentage = isUnlimited ? 100 : limitNum > 0 ? Math.min((used / limitNum) * 100, 100) : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium text-[#472b20]">{label}</span>
                </div>
                <span className="text-sm text-[#472b20]/60">
                    {used} {isUnlimited ? 'of Unlimited' : `of ${limit}`}
                </span>
            </div>

            <div className="w-full bg-[#ECE5DF] rounded-full h-2">
                <div
                    className={`bg-[#d05e2d] h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {
                showResetMessage && resetDays !== undefined && (
                    <p className="text-xs text-gray-500">
                        Resets in {resetDays} {resetDays === 1 ? 'day' : 'days'}
                    </p>
                )
            }
        </div >
    );
};
