import React from 'react';
import { X, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UpgradePreview } from "@/apis/wire";
import { format } from "date-fns";

interface UpgradePreviewModalProps {
    preview: UpgradePreview;
    onConfirm: () => void;
    onClose: () => void;
    isProcessing: boolean;
}

export const UpgradePreviewModal: React.FC<UpgradePreviewModalProps> = ({
    preview,
    onConfirm,
    onClose,
    isProcessing
}) => {
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM d, yyyy");
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="relative p-6 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-2xl font-bold text-gray-900">Upgrade Preview</h3>
                    <p className="text-gray-500 mt-1">Review your plan changes and proration breakdown</p>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Plan Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
                            <p className="text-lg font-bold text-gray-900">{preview.current_plan}</p>
                            <p className="text-sm text-gray-600">${preview.current_monthly_price}/mo</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">New Plan</p>
                            <p className="text-lg font-bold text-gray-900">{preview.new_plan}</p>
                            <p className="text-sm text-gray-600">${preview.new_monthly_price}/mo</p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Detailed Breakdown</p>
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                            {preview.breakdown.map((item, index) => (
                                <div key={index} className={`flex justify-between items-center ${item.is_total ? 'pt-2 mt-2 border-t border-gray-200 font-bold' : 'text-gray-600 text-sm'}`}>
                                    <span>{item.description}</span>
                                    <span className={item.amount < 0 ? 'text-green-600' : 'text-gray-900'}>
                                        {item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Important Info */}
                    {/* <div className="flex gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold mb-1">Key Billing Updates</p>
                            <ul className="space-y-1 list-disc list-inside opacity-90">
                                <li>You'll be charged <strong>${preview.prorated_amount.toFixed(2)}</strong> today</li>
                                <li><strong>{preview.days_remaining} days</strong> remaining in current cycle</li>
                                <li>Next full billing on <strong>{formatDate(preview.next_full_billing)}</strong></li>
                            </ul>
                        </div>
                    </div> */}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 flex flex-col gap-3">
                    <Button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Confirm & Upgrade
                            </>
                        )}
                    </Button>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
