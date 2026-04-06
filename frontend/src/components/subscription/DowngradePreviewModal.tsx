import React from 'react';
import { X, ArrowDownCircle, Info, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DowngradePreview } from "@/apis/wire";
import { format } from "date-fns";

interface DowngradePreviewModalProps {
    preview: DowngradePreview;
    onConfirm: () => void;
    onClose: () => void;
    isProcessing: boolean;
}

export const DowngradePreviewModal: React.FC<DowngradePreviewModalProps> = ({
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

    const breakdown = [
        { description: "Unused credit from current plan", amount: -preview.unused_credit },
        { description: `Prorated charge for ${preview.new_plan}`, amount: preview.new_plan_prorated_charge },
        { description: "Net amount", amount: preview.net_amount, is_total: true }
    ];

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
                    <h3 className="text-2xl font-bold text-gray-900">Downgrade Preview</h3>
                    <p className="text-gray-500 mt-1">Review your plan changes and proration credit</p>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Plan Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
                            <p className="text-lg font-bold text-gray-900">{preview.current_plan}</p>
                            <p className="text-sm text-gray-600">${preview.current_price}/mo</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">New Plan</p>
                            <p className="text-lg font-bold text-gray-900">{preview.new_plan}</p>
                            <p className="text-sm text-gray-600">${preview.new_price}/mo</p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Financial Breakdown</p>
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                            {breakdown.map((item, index) => (
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
                    {/* <div className="flex gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-800">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold mb-1">Billing Update</p>
                            <ul className="space-y-1 list-disc list-inside opacity-90">
                                <li>{preview.credit_or_charge_description}</li>
                                <li>Next full billing cycle starts <strong>{formatDate(preview.next_billing_date)}</strong></li>
                                <li>Next bill amount: <strong>${preview.next_full_billing_amount.toFixed(2)}</strong></li>
                            </ul>
                        </div>
                    </div> */}


                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 flex flex-row gap-3">
                  
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>

                      <Button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="w-full py-6 bg-[#472b20] hover:bg-[#5d3a2b] text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Confirm Downgrade
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
