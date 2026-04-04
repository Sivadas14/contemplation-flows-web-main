import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Please enter your full name");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        if (!password) {
            setError("Please enter a password");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const response = await register(email.trim(), password, name.trim());

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    handleClose();
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccess(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-brand-button" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-heading text-brand-heading">
                        Create Account
                    </DialogTitle>
                    <DialogDescription className="text-center font-body text-brand-body">
                        Join our mindful community
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-heading text-brand-heading mb-2">Account Created!</h3>
                        <p className="text-brand-body font-body">
                            You can now sign in with your email and password.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="register-name" className="font-body text-brand-heading">
                                Full Name
                            </Label>
                            <Input
                                id="register-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="text-lg py-3 px-4 border-2 border-gray-200 focus:border-brand-button transition-all duration-300 font-body"
                                disabled={isLoading}
                                autoComplete="name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register-email" className="font-body text-brand-heading">
                                Email Address
                            </Label>
                            <Input
                                id="register-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="text-lg py-3 px-4 border-2 border-gray-200 focus:border-brand-button transition-all duration-300 font-body"
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register-password" className="font-body text-brand-heading">
                                Password
                            </Label>
                            <Input
                                id="register-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                className="text-lg py-3 px-4 border-2 border-gray-200 focus:border-brand-button transition-all duration-300 font-body"
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register-confirm-password" className="font-body text-brand-heading">
                                Confirm Password
                            </Label>
                            <Input
                                id="register-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                className="text-lg py-3 px-4 border-2 border-gray-200 focus:border-brand-button transition-all duration-300 font-body"
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                        </div>

                        {error && (
                            <p className="text-red-600 text-sm font-body">{error}</p>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1 border-2 border-gray-200 hover:bg-gray-50 font-body"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !name.trim() || !email.trim() || !password || !confirmPassword}
                                className="flex-1 bg-brand-button hover:bg-brand-button/90 text-white font-body transition-all duration-300"
                            >
                                {isLoading ? "Creating..." : "Create Account"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RegisterModal;
