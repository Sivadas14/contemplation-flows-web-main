import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';


const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
    const { userProfile, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    const mockSessionStr = localStorage.getItem('supabase.auth.token');
    if (mockSessionStr) {
        try {
            const mockSession = JSON.parse(mockSessionStr);
            const isMockAdmin = mockSession?.currentSession?.user?.user_metadata?.is_super_admin === true;

            if (isMockAdmin) {
                console.log('✅ [AdminRoute] Mock admin session detected, granting access');
                return element;
            }
        } catch (e) {
            console.log('🔵 [AdminRoute] No valid mock session');
        }
    }

    if (!isAuthenticated) {
        console.log('🔵 [AdminRoute] Not authenticated, redirecting to admin login');
        return <Navigate to="/admin/login" replace />;
    }

    const isAdmin = userProfile?.role === 'ADMIN';
    console.log(userProfile);
    
    console.log(isAdmin);
    
    if (!isAdmin) {
        console.log('🔵 [AdminRoute] User is not admin, redirecting to home');
        return <Navigate to="/" replace />;
    }

    console.log('✅ [AdminRoute] Admin user authenticated, granting access');
    return element;
};

export default AdminRoute;