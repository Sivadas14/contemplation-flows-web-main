// FeatureListItem.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface FeatureListItemProps {
    text: string | React.ReactNode;
    isPremium?: boolean;
}

export const FeatureListItem: React.FC<FeatureListItemProps> = ({ text, isPremium }) => (
    <li className="flex items-start gap-3">
        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isPremium ? 'text-orange-600' : 'text-green-500'}`} />
        <span className="text-gray-700 text-sm">{text}</span>
    </li>
);