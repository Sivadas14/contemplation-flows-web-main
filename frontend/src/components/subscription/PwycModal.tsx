// PwycModal.tsx
import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PwycModalProps {
    userEmail: string;
    userName: string;
    hasPendingApplication: boolean;
    onClose: () => void;
}

export const PwycModal: React.FC<PwycModalProps> = ({ userEmail, userName, hasPendingApplication, onClose }) => {
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!reason.trim()) {
            setError('Please provide a reason for your application.');
            return;
        }
        try {
            console.log('Submitting PWYC application:', { userName, userEmail, reason });
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl  font-bold text-[#472b20]">Pay What You Can Application</DialogTitle>
                </DialogHeader>

                {submitted ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-[#472b20] mx-auto mb-4" />
                        <h3 className="text-lg  font-semibold text-[#472b20]">Application Submitted</h3>
                        <p className="text-[#472b20]/60 mt-2 font-light">Thank you. We will review your application and notify you of the outcome.</p>
                        <Button onClick={onClose} className="mt-6 bg-[#472b20] hover:bg-[#5d3a2c] text-white ">Close</Button>
                    </div>
                ) : hasPendingApplication ? (
                    <div className="text-center py-8">
                        <h3 className="text-lg  font-semibold text-[#472b20]">Application Pending</h3>
                        <p className="text-[#472b20]/60 mt-2 font-light">You already have an application under review. We will get back to you soon.</p>
                        <Button onClick={onClose} className="mt-6 bg-[#472b20] hover:bg-[#5d3a2c] text-white ">Close</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-[#472b20]/70 font-light">We believe these teachings should be accessible to all. If you are a genuine seeker facing financial hardship, please explain your situation below. Your application will be reviewed by our team.</p>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={5}
                            className="w-full p-3 border border-[#ECE5DF] rounded-xl focus:ring-[#472b20] focus:border-[#472b20] bg-white/50 font-light"
                            placeholder="Please briefly explain your situation..."
                        />
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        <div className="flex justify-end gap-3 mt-4">
                            <Button type="button" variant="outline" onClick={onClose} className="border-[#ECE5DF] text-[#472b20] hover:bg-[#F5F0EC] ">Cancel</Button>
                            <Button type="submit" className="bg-[#472b20] hover:bg-[#5d3a2c] text-white ">Submit Application</Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};