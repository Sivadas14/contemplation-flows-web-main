import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Check, Edit, Plus, X, Loader2, Star, Info, Headphones, Video, Lock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { plansAPI } from "@/apis/api";
import { Plan, Price, PlanFeature } from "@/apis/wire";
import { toast } from "sonner";

// Define enums matching backend
type BillingCycle = 'MONTHLY' | 'YEARLY';
type PlanType = 'FREE' | 'BASIC' | 'PRO';

interface FormErrors {
    name?: string;
    description?: string;
    monthlyPrice?: string;
    yearlyPrice?: string;
    [key: string]: string | undefined;
}

interface PlanGroup {
    planType: PlanType;
    monthlyPlan: Plan | null;
    yearlyPlan: Plan | null;
}

const PlanManagement: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGroup, setEditingGroup] = useState<PlanGroup | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const fetchedPlans = await plansAPI.getPlans();
            // Transform the data to ensure it has the expected structure
            const transformedPlans = fetchedPlans.map(plan => ({
                ...plan,
                plan_type: (plan.plan_type?.toUpperCase() as PlanType) || 'BASIC',
                billing_cycle: (plan.billing_cycle?.toUpperCase() as BillingCycle) || 'MONTHLY',
                prices: (plan.prices || []).map(price => ({
                    ...price,
                    currency: price.currency?.toUpperCase() || 'USD'
                })),
                is_audio: plan.is_audio || false,
                is_video: plan.is_video || false,
                is_free: plan.plan_type?.toUpperCase() === 'FREE' || plan.is_free === true
            }));
            setPlans(transformedPlans);
        } catch (error) {
            console.error("Failed to load plans:", error);
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get price by currency
    const getPrice = (plan: Plan, currency: 'USD') => {
        const priceObj = plan.prices?.find(p => p.currency === currency);
        return priceObj ? priceObj.price : 0;
    };

    // Get billing cycle text
    const getBillingCycleText = (cycle: BillingCycle) => {
        switch (cycle) {
            case 'MONTHLY': return '/month';
            case 'YEARLY': return '/year';
            default: return '/month';
        }
    };

    // Get media type badge
    const getMediaTypeBadge = (plan: Plan) => {
        if (plan.is_audio && plan.is_video) {
            return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                <Video className="w-3 h-3" /> Video
            </Badge>;
        }
        if (plan.is_audio) {
            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                <Headphones className="w-3 h-3" /> Audio
            </Badge>;
        }
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <Lock className="w-3 h-3" /> No Media
        </Badge>;
    };

    // Group plans by type
    const groupPlansByType = (): PlanGroup[] => {
        const grouped = new Map<PlanType, PlanGroup>();

        // Initialize all plan types
        (['FREE', 'BASIC', 'PRO'] as PlanType[]).forEach(type => {
            grouped.set(type, {
                planType: type,
                monthlyPlan: null,
                yearlyPlan: null
            });
        });

        // Assign plans to groups
        plans.forEach(plan => {
            const planType = (plan.plan_type?.toUpperCase() as PlanType) || 'BASIC';
            const group = grouped.get(planType);

            if (group) {
                if (plan.billing_cycle === 'MONTHLY') {
                    group.monthlyPlan = plan;
                } else if (plan.billing_cycle === 'YEARLY') {
                    group.yearlyPlan = plan;
                }
            }
        });

        return Array.from(grouped.values());
    };

    const handleEditClick = (group: PlanGroup) => {
        setEditingGroup(group);
        setErrors({});
        setIsSheetOpen(true);
    };

    // Validation function
    const validateForm = (group: PlanGroup): boolean => {
        const newErrors: FormErrors = {};

        // Get base plan for validation (use monthly if exists, otherwise yearly)
        const basePlan = group.monthlyPlan || group.yearlyPlan;
        
        if (!basePlan) {
            toast.error("No plan data found");
            return false;
        }

        // Name validation
        if (!basePlan.name?.trim()) {
            newErrors.name = 'Plan name is required';
        }

        // Description validation
        if (!basePlan.description?.trim()) {
            newErrors.description = 'Description is required';
        }

        // Price validation for non-free plans
        if (basePlan.plan_type !== 'FREE' && !basePlan.is_free) {
            if (group.monthlyPlan) {
                const monthlyPrice = getPrice(group.monthlyPlan, 'USD');
                if (monthlyPrice <= 0) {
                    newErrors.monthlyPrice = 'Monthly price must be greater than 0';
                }
            }
            
            if (group.yearlyPlan) {
                const yearlyPrice = getPrice(group.yearlyPlan, 'USD');
                if (yearlyPrice <= 0) {
                    newErrors.yearlyPrice = 'Yearly price must be greater than 0';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!editingGroup) return;

        if (!validateForm(editingGroup)) {
            toast.error("Please fix validation errors");
            return;
        }

        try {
            const basePlan = editingGroup.monthlyPlan || editingGroup.yearlyPlan;
            if (!basePlan) return;

            const isFree = basePlan.plan_type === 'FREE' || basePlan.is_free;

            // Prepare promises for saving plans
            const savePromises: Promise<Plan>[] = [];

            // Save monthly plan if exists
            if (editingGroup.monthlyPlan) {
                const monthlyData = {
                    ...editingGroup.monthlyPlan,
                    // Ensure plan_type and is_free are synchronized
                    plan_type: editingGroup.planType,
                    is_free: isFree,
                    // If free, set price to 0
                    prices: isFree ? [{ ...editingGroup.monthlyPlan.prices?.[0], price: 0 }] : editingGroup.monthlyPlan.prices
                };

                if (editingGroup.monthlyPlan.id === 0) {
                    savePromises.push(plansAPI.createPlan(monthlyData));
                } else {
                    savePromises.push(plansAPI.updatePlan(monthlyData));
                }
            }

            // Save yearly plan if exists
            if (editingGroup.yearlyPlan) {
                const yearlyData = {
                    ...editingGroup.yearlyPlan,
                    // Ensure plan_type and is_free are synchronized
                    plan_type: editingGroup.planType,
                    is_free: isFree,
                    // If free, set price to 0
                    prices: isFree ? [{ ...editingGroup.yearlyPlan.prices?.[0], price: 0 }] : editingGroup.yearlyPlan.prices
                };

                if (editingGroup.yearlyPlan.id === 0) {
                    savePromises.push(plansAPI.createPlan(yearlyData));
                } else {
                    savePromises.push(plansAPI.updatePlan(yearlyData));
                }
            }

            // Execute all save operations
            const savedPlans = await Promise.all(savePromises);

            // Update local state
            setPlans(prev => {
                const newPlans = [...prev];
                
                savedPlans.forEach(savedPlan => {
                    const transformedPlan = {
                        ...savedPlan,
                        plan_type: (savedPlan.plan_type?.toUpperCase() as PlanType) || 'BASIC',
                        billing_cycle: (savedPlan.billing_cycle?.toUpperCase() as BillingCycle) || 'MONTHLY',
                        prices: (savedPlan.prices || []).map(price => ({
                            ...price,
                            currency: price.currency?.toUpperCase() || 'USD'
                        })),
                        is_audio: savedPlan.is_audio || false,
                        is_video: savedPlan.is_video || false,
                        is_free: savedPlan.plan_type?.toUpperCase() === 'FREE' || savedPlan.is_free === true
                    };

                    const existingIndex = newPlans.findIndex(p => p.id === transformedPlan.id);
                    if (existingIndex >= 0) {
                        newPlans[existingIndex] = transformedPlan;
                    } else {
                        newPlans.push(transformedPlan);
                    }
                });

                return newPlans;
            });

            toast.success(`Plans updated successfully`);
            setIsSheetOpen(false);
            setEditingGroup(null);
            setErrors({});
        } catch (error: any) {
            console.error("Failed to save plans:", error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to save plans";
            toast.error(errorMessage);
        }
    };

    // Update common fields across both plans
    const updateCommonField = (field: keyof Plan, value: any) => {
        if (!editingGroup) return;

        const updatedGroup = { ...editingGroup };

        if (updatedGroup.monthlyPlan) {
            updatedGroup.monthlyPlan = { ...updatedGroup.monthlyPlan, [field]: value };
        }
        
        if (updatedGroup.yearlyPlan) {
            updatedGroup.yearlyPlan = { ...updatedGroup.yearlyPlan, [field]: value };
        }

        setEditingGroup(updatedGroup);

        // Clear error if field has error
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Update price for specific billing cycle
    const updatePrice = (billingCycle: BillingCycle, value: string) => {
        if (!editingGroup) return;
        
        const numValue = parseFloat(value) || 0;
        const updatedGroup = { ...editingGroup };

        if (billingCycle === 'MONTHLY' && updatedGroup.monthlyPlan) {
            const updatedPrices = [...(updatedGroup.monthlyPlan.prices || [])];
            const priceIndex = updatedPrices.findIndex(p => p.currency === 'USD');

            if (priceIndex >= 0) {
                updatedPrices[priceIndex] = {
                    ...updatedPrices[priceIndex],
                    price: numValue
                };
            } else {
                updatedPrices.push({
                    id: 0,
                    price: numValue,
                    currency: 'USD',
                    plan_id: updatedGroup.monthlyPlan.id as number
                });
            }

            updatedGroup.monthlyPlan = {
                ...updatedGroup.monthlyPlan,
                prices: updatedPrices
            };
        } else if (billingCycle === 'YEARLY' && updatedGroup.yearlyPlan) {
            const updatedPrices = [...(updatedGroup.yearlyPlan.prices || [])];
            const priceIndex = updatedPrices.findIndex(p => p.currency === 'USD');

            if (priceIndex >= 0) {
                updatedPrices[priceIndex] = {
                    ...updatedPrices[priceIndex],
                    price: numValue
                };
            } else {
                updatedPrices.push({
                    id: 0,
                    price: numValue,
                    currency: 'USD',
                    plan_id: updatedGroup.yearlyPlan.id as number
                });
            }

            updatedGroup.yearlyPlan = {
                ...updatedGroup.yearlyPlan,
                prices: updatedPrices
            };
        }

        setEditingGroup(updatedGroup);

        // Clear price error when user starts typing
        const errorKey = billingCycle === 'MONTHLY' ? 'monthlyPrice' : 'yearlyPrice';
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }
    };

    // Update features for both plans
    const updateFeature = (index: number, value: string) => {
        if (!editingGroup) return;

        const updatedGroup = { ...editingGroup };
        const basePlanId = updatedGroup.monthlyPlan?.id || updatedGroup.yearlyPlan?.id;

        if (updatedGroup.monthlyPlan) {
            const newFeatures = [...(updatedGroup.monthlyPlan.features || [])];
            newFeatures[index] = {
                ...newFeatures[index],
                feature_text: value,
                plan_id: basePlanId as number
            };
            updatedGroup.monthlyPlan = { ...updatedGroup.monthlyPlan, features: newFeatures };
        }
        
        if (updatedGroup.yearlyPlan) {
            const newFeatures = [...(updatedGroup.yearlyPlan.features || [])];
            newFeatures[index] = {
                ...newFeatures[index],
                feature_text: value,
                plan_id: basePlanId as number
            };
            updatedGroup.yearlyPlan = { ...updatedGroup.yearlyPlan, features: newFeatures };
        }

        setEditingGroup(updatedGroup);
    };

    const addFeature = () => {
        if (!editingGroup) return;

        const updatedGroup = { ...editingGroup };
        const basePlanId = updatedGroup.monthlyPlan?.id || updatedGroup.yearlyPlan?.id;
        const newFeature = {
            id: 0,
            feature_text: '',
            plan_id: basePlanId as number
        };

        if (updatedGroup.monthlyPlan) {
            updatedGroup.monthlyPlan = {
                ...updatedGroup.monthlyPlan,
                features: [...(updatedGroup.monthlyPlan.features || []), newFeature]
            };
        }
        
        if (updatedGroup.yearlyPlan) {
            updatedGroup.yearlyPlan = {
                ...updatedGroup.yearlyPlan,
                features: [...(updatedGroup.yearlyPlan.features || []), newFeature]
            };
        }

        setEditingGroup(updatedGroup);
    };

    const removeFeature = (index: number) => {
        if (!editingGroup) return;

        const updatedGroup = { ...editingGroup };

        if (updatedGroup.monthlyPlan) {
            const newFeatures = (updatedGroup.monthlyPlan.features || []).filter((_, i) => i !== index);
            updatedGroup.monthlyPlan = { ...updatedGroup.monthlyPlan, features: newFeatures };
        }
        
        if (updatedGroup.yearlyPlan) {
            const newFeatures = (updatedGroup.yearlyPlan.features || []).filter((_, i) => i !== index);
            updatedGroup.yearlyPlan = { ...updatedGroup.yearlyPlan, features: newFeatures };
        }

        setEditingGroup(updatedGroup);
    };

    // Helper to format chat limit display
    const formatChatLimit = (limit: string) => {
        if (!limit) return 'Unlimited';
        if (limit.toLowerCase() === 'unlimited') return 'Unlimited';
        return limit;
    };

    // Get plan type badge color
    const getPlanTypeColor = (type: PlanType) => {
        switch (type) {
            case 'FREE': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'BASIC': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'PRO': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
    };

    // Get plan type display name
    const getPlanTypeDisplay = (type: PlanType) => {
        switch (type) {
            case 'FREE': return 'Free';
            case 'BASIC': return 'Basic';
            case 'PRO': return 'Pro';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    const groupedPlans = groupPlansByType();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
                    <p className="text-gray-600 mt-1">Manage subscription plans and pricing</p>
                </div>
            </div>

            {groupedPlans.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-gray-100 p-3 mb-4">
                            <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans yet</h3>
                        <p className="text-gray-500 text-center mb-4 max-w-md">
                            Plans will appear here once created.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {groupedPlans.map((group) => {
                        const basePlan = group.monthlyPlan || group.yearlyPlan;
                        if (!basePlan) return null;

                        return (
                            <Card key={group.planType} className={`flex flex-col h-full transition-all duration-200 hover:shadow-lg ${basePlan.is_recommended ? 'border-orange-300 border-2 shadow-lg relative' : 'border-gray-200'}`}>
                                {basePlan.is_recommended && (
                                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-orange-500 hover:bg-orange-600">
                                            <Star className="w-3 h-3 mr-1" /> Recommended
                                        </Badge>
                                    </div>
                                )}
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className={getPlanTypeColor(group.planType)}>
                                                {getPlanTypeDisplay(group.planType)}
                                            </Badge>
                                            <Badge variant="outline" className={`${basePlan.is_video ? 'bg-purple-50 text-purple-700 border-purple-200' : basePlan.is_audio ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'} flex items-center gap-1`}>
                                                {basePlan.is_video ? (
                                                    <><Video className="w-3 h-3" /> Video</>
                                                ) : basePlan.is_audio ? (
                                                    <><Headphones className="w-3 h-3" /> Audio</>
                                                ) : (
                                                    <><Lock className="w-3 h-3" /> No Media</>
                                                )}
                                            </Badge>
                                        </div>
                                        <Badge variant={basePlan.active ? "default" : "secondary"} className={basePlan.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                            {basePlan.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl flex items-center justify-between">
                                        {/* <span>{getPlanTypeDisplay(group.planType)} Plan</span> */}
                                        <span>{basePlan.name}</span>
                                        {basePlan.is_recommended && (
                                            <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 pb-4">
                                    {/* Pricing Section */}
                                    <div className="mb-6 space-y-3">
                                        {group.planType === 'FREE' ? (
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <span className="text-3xl font-bold text-green-600">FREE</span>
                                            </div>
                                        ) : (
                                            <>
                                                {group.monthlyPlan && (
                                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                        <div className="flex items-baseline justify-center">
                                                            <span className="text-2xl font-bold text-blue-900">${getPrice(group.monthlyPlan, 'USD')}</span>
                                                            <span className="text-blue-700 ml-1 text-sm">/month</span>
                                                        </div>
                                                        <div className="text-xs text-blue-600 mt-1 text-center">
                                                            Monthly Plan
                                                        </div>
                                                    </div>
                                                )}
                                                {group.yearlyPlan && (
                                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                        <div className="flex items-baseline justify-center">
                                                            <span className="text-2xl font-bold text-purple-900">${getPrice(group.yearlyPlan, 'USD')}</span>
                                                            <span className="text-purple-700 ml-1 text-sm">/year</span>
                                                        </div>
                                                        <div className="text-xs text-purple-600 mt-1 text-center">
                                                            Yearly Plan
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {/* Quotas */}
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 mb-2">Quota:</div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <div className="font-medium text-gray-900">Chat</div>
                                                    <div className="text-gray-600">{formatChatLimit(basePlan.chat_limit || '')}</div>
                                                </div>
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <div className="font-medium text-gray-900">Cards</div>
                                                    <div className="text-gray-600">{basePlan.card_limit || 0}/day</div>
                                                </div>
                                                <div className="p-2 bg-gray-50 rounded col-span-2">
                                                    <div className="font-medium text-gray-900">Meditation Duration</div>
                                                    <div className="text-gray-600">{basePlan.max_meditation_duration || 0} mins max</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 mb-2">Details:</div>
                                            <ul className="space-y-2">
                                                {(basePlan.features || []).slice(0, 4).map((feature, index) => (
                                                    <li key={feature.id || index} className="flex items-start">
                                                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm text-gray-600 line-clamp-1">{feature.feature_text}</span>
                                                    </li>
                                                ))}
                                                {(basePlan.features || []).length > 4 && (
                                                    <li className="text-sm text-gray-500 pl-6">
                                                        +{(basePlan.features || []).length - 4} more
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleEditClick(group)}
                                    >
                                        <Edit className="w-4 h-4 mr-2" /> Edit Plan
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Sheet open={isSheetOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsSheetOpen(false);
                    setEditingGroup(null);
                }
            }}>
                <SheetContent className="sm:max-w-[700px] overflow-y-auto w-full">
                    <SheetHeader className="pb-4 border-b">
                        <SheetTitle>
                            {editingGroup ? `Edit ${getPlanTypeDisplay(editingGroup.planType)} Plan` : 'Edit Plan'}
                        </SheetTitle>
                        <SheetDescription>
                            Edit both monthly and yearly variants. All fields except prices will be applied to both plans.
                        </SheetDescription>
                    </SheetHeader>

                    {editingGroup && (
                        <div className="py-6 space-y-8">
                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                                    <TabsTrigger value="features">Features</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-6 pt-6">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="flex items-center gap-2">
                                                Plan Name *
                                                {errors.name && (
                                                    <span className="text-red-500 text-sm font-normal">({errors.name})</span>
                                                )}
                                            </Label>
                                            <Input
                                                id="name"
                                                value={editingGroup.monthlyPlan?.name || editingGroup.yearlyPlan?.name || ''}
                                                onChange={(e) => updateCommonField('name', e.target.value)}
                                                placeholder="e.g., Basic Plan"
                                                className={errors.name ? "border-red-500" : ""}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description" className="flex items-center gap-2">
                                                Description *
                                                {errors.description && (
                                                    <span className="text-red-500 text-sm font-normal">({errors.description})</span>
                                                )}
                                            </Label>
                                            <Textarea
                                                id="description"
                                                value={editingGroup.monthlyPlan?.description || editingGroup.yearlyPlan?.description || ''}
                                                onChange={(e) => updateCommonField('description', e.target.value)}
                                                placeholder="Describe what this plan offers to users"
                                                className={errors.description ? "border-red-500" : ""}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Plan Type</Label>
                                                <div className="p-2 bg-gray-50 rounded border text-sm">
                                                    {getPlanTypeDisplay(editingGroup.planType)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggle Switches */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${editingGroup.monthlyPlan?.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                        Active
                                                    </Label>
                                                    <div className="text-sm text-gray-500">Show in pricing page</div>
                                                </div>
                                                <Switch
                                                    checked={editingGroup.monthlyPlan?.active || editingGroup.yearlyPlan?.active || false}
                                                    onCheckedChange={(checked) => updateCommonField('active', checked)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${editingGroup.monthlyPlan?.is_recommended ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                                        Recommended
                                                    </Label>
                                                    <div className="text-sm text-gray-500">Highlight as best value</div>
                                                </div>
                                                <Switch
                                                    checked={editingGroup.monthlyPlan?.is_recommended || editingGroup.yearlyPlan?.is_recommended || false}
                                                    onCheckedChange={(checked) => updateCommonField('is_recommended', checked)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base flex items-center gap-2">
                                                        <Headphones className={`w-4 h-4 ${editingGroup.monthlyPlan?.is_audio ? 'text-blue-500' : 'text-gray-400'}`} />
                                                        Audio Content
                                                    </Label>
                                                    <div className="text-sm text-gray-500">Access to audio meditations</div>
                                                </div>
                                                <Switch
                                                    checked={editingGroup.monthlyPlan?.is_audio || editingGroup.yearlyPlan?.is_audio || false}
                                                    onCheckedChange={(checked) => {
                                                        const updatedGroup = { ...editingGroup };
                                                        if (updatedGroup.monthlyPlan) {
                                                            updatedGroup.monthlyPlan = { 
                                                                ...updatedGroup.monthlyPlan, 
                                                                is_audio: checked,
                                                                // If disabling audio and video is enabled, keep video
                                                                is_video: checked ? updatedGroup.monthlyPlan.is_video : false
                                                            };
                                                        }
                                                        if (updatedGroup.yearlyPlan) {
                                                            updatedGroup.yearlyPlan = { 
                                                                ...updatedGroup.yearlyPlan, 
                                                                is_audio: checked,
                                                                // If disabling audio and video is enabled, keep video
                                                                is_video: checked ? updatedGroup.yearlyPlan.is_video : false
                                                            };
                                                        }
                                                        setEditingGroup(updatedGroup);
                                                    }}
                                                    disabled={editingGroup.monthlyPlan?.is_video}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base flex items-center gap-2">
                                                        <Video className={`w-4 h-4 ${editingGroup.monthlyPlan?.is_video ? 'text-purple-500' : 'text-gray-400'}`} />
                                                        Video Content
                                                    </Label>
                                                    <div className="text-sm text-gray-500">Access to video meditations</div>
                                                </div>
                                                <Switch
                                                    checked={editingGroup.monthlyPlan?.is_video || editingGroup.yearlyPlan?.is_video || false}
                                                    onCheckedChange={(checked) => {
                                                        const updatedGroup = { ...editingGroup };
                                                        if (updatedGroup.monthlyPlan) {
                                                            updatedGroup.monthlyPlan = { 
                                                                ...updatedGroup.monthlyPlan, 
                                                                is_video: checked,
                                                                // If enabling video, audio should also be enabled
                                                                is_audio: checked ? true : updatedGroup.monthlyPlan.is_audio
                                                            };
                                                        }
                                                        if (updatedGroup.yearlyPlan) {
                                                            updatedGroup.yearlyPlan = { 
                                                                ...updatedGroup.yearlyPlan, 
                                                                is_video: checked,
                                                                // If enabling video, audio should also be enabled
                                                                is_audio: checked ? true : updatedGroup.yearlyPlan.is_audio
                                                            };
                                                        }
                                                        setEditingGroup(updatedGroup);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="chat-limit" className="text-base">
                                                        Chat Limit
                                                    </Label>
                                                    <div className="text-sm text-gray-500">Daily chat sessions</div>
                                                </div>
                                                <Input
                                                    id="chat-limit"
                                                    value={editingGroup.monthlyPlan?.chat_limit || editingGroup.yearlyPlan?.chat_limit || ''}
                                                    onChange={(e) => updateCommonField('chat_limit', e.target.value)}
                                                    className="w-24"
                                                    placeholder="e.g. 100"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="card-limit" className="text-base">
                                                        Card Limit
                                                    </Label>
                                                    <div className="text-sm text-gray-500">Daily personalized cards</div>
                                                </div>
                                                <Input
                                                    id="card-limit"
                                                    type="number"
                                                    min="0"
                                                    value={editingGroup.monthlyPlan?.card_limit || editingGroup.yearlyPlan?.card_limit || 0}
                                                    onChange={(e) => updateCommonField('card_limit', parseInt(e.target.value) || 0)}
                                                    className="w-24"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border p-4 col-span-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">
                                                        Max Meditation Duration
                                                    </Label>
                                                    <div className="text-sm text-gray-500">Maximum meditation session length</div>
                                                </div>
                                                <Select
                                                    value={(editingGroup.monthlyPlan?.max_meditation_duration || editingGroup.yearlyPlan?.max_meditation_duration || 15).toString()}
                                                    onValueChange={(val) => updateCommonField('max_meditation_duration', parseInt(val))}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue placeholder="Select duration" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="5">5 minutes</SelectItem>
                                                        <SelectItem value="10">10 minutes</SelectItem>
                                                        <SelectItem value="15">15 minutes</SelectItem>
                                                        <SelectItem value="20">20 minutes</SelectItem>
                                                        <SelectItem value="30">30 minutes</SelectItem>
                                                        <SelectItem value="60">60 minutes</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Alert className="mt-4">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-sm">
                                                <div className="font-medium mb-1">Media Content Rules:</div>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    <li>Video includes Audio (enabling Video automatically enables Audio)</li>
                                                    <li>Audio can be enabled independently</li>
                                                    <li>If Video is disabled, Audio can be toggled separately</li>
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </TabsContent>

                                <TabsContent value="pricing" className="space-y-6 pt-6">
                                    {/* Pricing - Only show if not FREE plan */}
                                    {editingGroup.planType !== 'FREE' ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Monthly Price */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-medium text-gray-900">Monthly Price</h3>
                                                        {editingGroup.monthlyPlan ? (
                                                            <Badge variant="outline" className="text-xs">
                                                                ID: {editingGroup.monthlyPlan.id}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Not Created
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="monthly-price" className="flex items-center gap-2">
                                                            USD Price *
                                                            {errors.monthlyPrice && (
                                                                <span className="text-red-500 text-sm font-normal">({errors.monthlyPrice})</span>
                                                            )}
                                                        </Label>
                                                        <Input
                                                            id="monthly-price"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={editingGroup.monthlyPlan ? getPrice(editingGroup.monthlyPlan, 'USD') : 0}
                                                            onChange={(e) => updatePrice('MONTHLY', e.target.value)}
                                                            placeholder="0.00"
                                                            className={errors.monthlyPrice ? "border-red-500" : ""}
                                                            disabled={!editingGroup.monthlyPlan}
                                                        />
                                                        <p className="text-xs text-gray-500">
                                                            Price in US Dollars per month
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Yearly Price */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-medium text-gray-900">Yearly Price</h3>
                                                        {editingGroup.yearlyPlan ? (
                                                            <Badge variant="outline" className="text-xs">
                                                                ID: {editingGroup.yearlyPlan.id}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Not Created
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="yearly-price" className="flex items-center gap-2">
                                                            USD Price *
                                                            {errors.yearlyPrice && (
                                                                <span className="text-red-500 text-sm font-normal">({errors.yearlyPrice})</span>
                                                            )}
                                                        </Label>
                                                        <Input
                                                            id="yearly-price"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={editingGroup.yearlyPlan ? getPrice(editingGroup.yearlyPlan, 'USD') : 0}
                                                            onChange={(e) => updatePrice('YEARLY', e.target.value)}
                                                            placeholder="0.00"
                                                            className={errors.yearlyPrice ? "border-red-500" : ""}
                                                            disabled={!editingGroup.yearlyPlan}
                                                        />
                                                        <p className="text-xs text-gray-500">
                                                            Price in US Dollars per year
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                This is a FREE plan. Price is automatically set to 0 for both monthly and yearly variants.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </TabsContent>

                                <TabsContent value="features" className="space-y-6 pt-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Display Features</h3>
                                                <p className="text-sm text-gray-500">Features shown on pricing page</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={addFeature}>
                                                <Plus className="w-4 h-4 mr-2" /> Add Feature
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {(editingGroup.monthlyPlan?.features || editingGroup.yearlyPlan?.features || []).length === 0 ? (
                                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                                    <p className="text-gray-500">No features added yet</p>
                                                    <p className="text-sm text-gray-400 mt-1">Add features that users get with this plan</p>
                                                </div>
                                            ) : (
                                                (editingGroup.monthlyPlan?.features || editingGroup.yearlyPlan?.features || []).map((feature, index) => (
                                                    <div key={feature.id || index} className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <Input
                                                                value={feature.feature_text}
                                                                onChange={(e) => updateFeature(index, e.target.value)}
                                                                placeholder="Feature description (e.g., Access to all meditation tracks)"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeFeature(index)}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    <SheetFooter className="pt-6 border-t">
                        <div className="flex justify-between w-full">
                            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                                Cancel
                            </Button>
                            <div className="flex gap-3">
                                <Button onClick={handleSave} className="min-w-[120px]">
                                    Save All Changes
                                </Button>
                            </div>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default PlanManagement;