import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PlanActionButtonsProps {
    planType: string;
    isFree: boolean;
    onCancelPlan: () => void;
    onManage: () => void;
    onViewPlans: () => void;
    isProcessing?: boolean;
    showCancel?: boolean;
}

export const PlanActionButtons: React.FC<PlanActionButtonsProps> = ({
    planType,
    isFree,
    onCancelPlan,
    onManage,
    onViewPlans,
    isProcessing = false,
    showCancel = true,
}) => {
    const navigate = useNavigate();

    const handleUpgrade = () => {
        onViewPlans();
    };

    if (isFree) {
        return (
            <div className="flex flex-wrap gap-3">
                <Button
                    variant="outline"
                    onClick={onViewPlans}
                    className="font-medium border-[#ECE5DF] text-[#472b20] hover:bg-[#ECE5DF]"
                >
                    View Plans
                </Button>
                <Button
                    onClick={handleUpgrade}
                    className="bg-[#472b20] hover:bg-[#5d3a2c] text-white font-medium"
                >
                    Upgrade
                </Button>
            </div>
        );
    }

    // For Basic/Pro plans
    return (
        <div className="flex flex-wrap gap-3">
            <Button
                variant="outline"
                onClick={onViewPlans}
                className="font-medium border-[#ECE5DF] text-[#472b20] hover:bg-[#ECE5DF]"
            >
                View Plans
            </Button>
            {/* <Button
                variant="outline"
                onClick={onManage}
                disabled={isProcessing}
                className="font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
            >
                Manage
            </Button> */}
            {showCancel && (
                <Button
                    variant="outline"
                    onClick={onCancelPlan}
                    disabled={isProcessing}
                    className="font-medium text-red-600 border-red-200 hover:bg-red-50"
                >
                    Cancel Plan
                </Button>
            )}
        </div>
    );
};

