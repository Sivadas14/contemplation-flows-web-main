import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    redirectTo = '/'     // Redirect to landing page so users from external links
                         // see the product before being asked to sign in.
                         // Landing page has prominent Sign In / Register buttons.
}) => {
    const { isAuthenticated, loading } = useAuth();
    console.log('🔒 [ProtectedRoute] isAuthenticated:', isAuthenticated, loading);

    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(236, 229, 223)' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-button mx-auto mb-4"></div>
                    <p className="text-brand-body font-body">Loading...</p>
                </div>
            </div>
        );
    }

    // Safe check for component name if possible
    const childName = React.isValidElement(children)
        ? (typeof children.type === 'string' ? children.type : (children.type as any).name || 'UnknownComponent')
        : 'UnknownNode';

    if (!isAuthenticated) {
        console.log(`🔒 [ProtectedRoute] Access denied to ${childName}, redirecting to ${redirectTo}`);
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    console.log(`🔓 [ProtectedRoute] Access granted to ${childName}`);
    return <>{children}</>;
};

export default ProtectedRoute; 