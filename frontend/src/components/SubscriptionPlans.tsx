import React from 'react';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanProps {
    name: string;
    price: string;
    description: string;
    features: string[];
    popular?: boolean;
    buttonText?: string;
    onSubscribe: () => void;
    isLoading?: boolean;
}

const Plan: React.FC<PlanProps> = ({ name, price, description, features, popular, buttonText = "Subscribe", onSubscribe, isLoading }) => (
    <Card className={`flex flex-col relative ${popular ? 'border-orange-500 shadow-lg scale-105' : 'border-gray-200'}`}>
        {popular && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                </span>
            </div>
        )}
        <CardHeader>
            <CardTitle className="text-2xl font-bold">{name}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
            <div className="mb-6">
                <span className="text-4xl font-bold">{price}</span>
                {price !== 'Free' && <span className="text-gray-500 ml-1">/month</span>}
            </div>
            <ul className="space-y-3">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter>
            <Button
                className={`w-full ${popular ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                variant={popular ? 'default' : 'outline'}
                onClick={onSubscribe}
                disabled={isLoading}
            >
                {isLoading ? "Processing..." : buttonText}
            </Button>
        </CardFooter>
    </Card>
);

import { paymentAPI, plansAPI } from "@/apis/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Plan as PlanType } from "@/apis/wire";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const SubscriptionPlans: React.FC = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [plans, setPlans] = useState<PlanType[]>([]);
    const [fetchingPlans, setFetchingPlans] = useState(true);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const fetchedPlans = await plansAPI.getPlans();
      
                setPlans(fetchedPlans.filter(plan => plan.active));
            } catch (error) {
                console.error("Failed to load plans:", error);
                toast.error("Failed to load subscription plans");
            } finally {
                setFetchingPlans(false);
            }
        };
        loadPlans();
    }, []);

    const handleSubscribe = async (plan: PlanType) => {
        if (plan.name === 'Free' || plan.is_free) {
            toast.info("You are already on the Free plan.");
            return;
        }

        if (!userProfile?.id) {
            toast.error("Please log in to subscribe");
            return;
        }

        if (!plan.polar_plan_id) {
            toast.error("This plan is not available for subscription");
            return;
        }

        try {
            setLoading(plan.name);
            console.log(`Subscribing to ${plan.name}`);
            const redirectUrl = `${window.location.origin}/subscription?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`;
            const response = await paymentAPI.createCheckoutSession(
                plan.polar_plan_id,
                userProfile.id,
                redirectUrl
            );

            const checkoutUrl = response?.data?.checkout_url || response?.checkout_url || response?.url;

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                toast.error("Failed to start payment session");
            }
        } catch (error) {
            console.error("Subscription error:", error);
            toast.error("Failed to process subscription request");
        } finally {
            setLoading(null);
        }
    };

    if (fetchingPlans) {
        return (
            <div className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Choose Your Plan
                    </h2>
                    <p className="mt-4 text-xl text-gray-600">
                        Select the perfect plan for your mindfulness journey
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Plan
                            key={plan.id}
                            name={plan.name}
                            price={plan.prices.monthly.USD === 0 ? 'Free' : `$${plan.prices.monthly.USD}`}
                            description={plan.description}
                            features={plan.features}
                            popular={plan.isRecommended}
                            buttonText={plan.prices.monthly.USD === 0 || plan.is_free ? 'Current Plan' : 'Subscribe'}
                            onSubscribe={() => handleSubscribe(plan)}
                            isLoading={loading === plan.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
