import React, { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addonAPI, paymentAPI } from '@/apis/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAddonsQuery } from '@/hooks/useBillingData';

interface AddonsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    type?: 'default' | 'cards' | 'minutes';
}

export const AddonsModal: React.FC<AddonsModalProps> = ({ isOpen, onClose, onSuccess, type = 'default' }) => {
    const { userProfile } = useAuth();
    const { data: addons = [], isLoading: loading } = useAddonsQuery();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMeditationDuration, setSelectedMeditationDuration] = useState<number>(0);

    const currencySymbol = '$';

    useEffect(() => {
        if (addons.length > 0 && selectedMeditationDuration === 0) {
            const meditationAddons = addons.filter(a => a.unit_type === 'MINUTES');
            if (meditationAddons.length > 0) {
                const minDuration = Math.min(...meditationAddons.map(a => a.quantity));
                setSelectedMeditationDuration(minDuration);
            }
        }
    }, [addons, selectedMeditationDuration]);

    const handlePurchase = async (addonId: number) => {
        if (!userProfile?.id) {
            toast.error('Please log in to purchase addons');
            return;
        }

        setIsProcessing(true);
        try {
            const successUrl = window.location.href;

            const response = await paymentAPI.subscribeAddon(addonId, userProfile.id, successUrl);
            const res = response as any;
            const checkoutUrl = res.data?.checkout_url || res.checkout_url || res.url;

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                toast.error('Failed to get checkout URL');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error('Failed to initiate purchase');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={`relative w-full ${type === 'default' ? 'max-w-2xl' : 'max-w-md'} bg-[#F5F0EC] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#ECE5DF]`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE5DF]">
                    <div>
                        <h2 className="text-xl font-bold text-[#472b20]">
                            {type === 'cards' ? 'Limit exceeded' :
                                type === 'minutes' ? 'Limit exceeded' :
                                    'Buy credits'}
                        </h2>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-[#ECE5DF]"
                    >
                        <X className="w-5 h-5 text-[#472b20]" />
                    </Button>
                </div>

                 <div className="flex-1 overflow-y-auto p-6">
                    {type === 'default' && (
                        <p className="text-[#472b20]/60 text-sm font-light mb-6">Purchase one-time credits for premium features.</p>
                    )}

                    {type === 'cards' && (
                        <p className="text-[#472b20]/60 text-sm font-light mb-6">You have no contemplation card left for the month. To generate, buy a one contemplation card credit.</p>
                    )}

                    {type === 'minutes' && (
                        <p className="text-[#472b20]/60 text-sm font-light mb-6">You have no Guided meditation left for the month. To generate, buy a one Guided meditation credit.</p>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[1, 2].map(i => (
                                <div key={i} className="w-full h-[300px] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse flex flex-col p-6">
                                    <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full mb-4" />
                                    <div className="mx-auto w-32 h-6 bg-gray-200 rounded mb-4" />
                                    <div className="mx-auto w-24 h-8 bg-gray-200 rounded mb-4" />
                                    <div className="mt-auto w-full h-12 bg-gray-200 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 ${type === 'default' ? 'grid-cols-2' : ''} gap-6`}>
                            
                            {(type === 'default' || type === 'cards') && addons.filter(a => a.unit_type === 'CARDS').map(addon => (
                                <div key={addon.id} className="w-full text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#ECE5DF] hover:border-[#472b20]/20 transition-all duration-300 flex flex-col shadow-sm">
                                    {/* <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-orange-600" />
                                        </div>
                                    </div> */}
                                    <h3 className=" font-semibold text-[#472b20]">{addon.name}</h3>
                                    <p className="text-3xl  font-bold my-2 text-[#472b20]">{currencySymbol}{addon.price_usd}</p>
                                    <p className="text-[#472b20]/60 text-xs mb-6 flex-grow font-light">{addon.description}</p>
                                    <Button
                                        onClick={() => handlePurchase(addon.id)}
                                        disabled={isProcessing}
                                        className="w-full bg-[#472b20] hover:bg-[#5d3a2c] text-white py-4 rounded-md font-semibold mt-auto text-sm shadow-md transition-all"
                                    >
                                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Purchase'}
                                    </Button>
                                </div>
                            ))}

                            {(type === 'default' || type === 'minutes') && addons.some(a => a.unit_type === 'MINUTES') && (
                                <div className="w-full text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#ECE5DF] hover:border-[#472b20]/20 transition-all duration-300 flex flex-col shadow-sm">
                                    {/* <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                                            <Heart className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div> */}
                                    <h3 className=" font-semibold text-[#472b20]">Guided Meditation</h3>

                                    <div className="my-3">
                                        <div className="flex justify-center flex-wrap gap-1.5">
                                            {addons
                                                .filter(a => a.unit_type === 'MINUTES')
                                                .sort((a, b) => a.quantity - b.quantity)
                                                .map(addon => (
                                                    <button
                                                        key={addon.id}
                                                        onClick={() => setSelectedMeditationDuration(addon.quantity)}
                                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedMeditationDuration === addon.quantity ? 'bg-[#472b20] text-white border-[#472b20]' : 'bg-white text-[#472b20]/60 border-[#ECE5DF] hover:border-[#472b20]/30'}`}
                                                    >
                                                        {addon.quantity}m
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    {(() => {
                                        const selectedAddon = addons.find(a => a.unit_type === 'MINUTES' && a.quantity === selectedMeditationDuration) || addons.find(a => a.unit_type === 'MINUTES');
                                        if (!selectedAddon) return null;

                                        return (
                                            <>
                                                <p className="text-3xl font-bold my-2 text-gray-900">{currencySymbol}{selectedAddon.price_usd}</p>
                                                <p className="text-gray-500 text-xs mb-6 flex-grow">{selectedAddon.description}</p>
                                                <Button
                                                    onClick={() => handlePurchase(selectedAddon.id)}
                                                    disabled={isProcessing}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-md font-semibold mt-auto text-sm"
                                                >
                                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Purchase'}
                                                </Button>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
