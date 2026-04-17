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
        console.log('🔵 [AdminRoute] User is not admin, showing access-denied page');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto border border-red-800/50">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your account (<span className="text-gray-300">{userProfile?.email_id}</span>) does not have admin privileges.
                            <br /><br />
                            If you are the site owner, your account needs to be promoted to admin.
                            Contact your developer to run the <code className="text-orange-400 text-xs bg-gray-800 px-1 py-0.5 rounded">/api/admin/make-admin</code> endpoint.
                        </p>
                    </div>
                    <a
                        href="/admin/login"
                        className="inline-block px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        ← Back to Admin Login
                    </a>
                </div>
            </div>
        );
    }

    console.log('✅ [AdminRoute] Admin user authenticated, granting access');
    return element;
};

export default AdminRoute;