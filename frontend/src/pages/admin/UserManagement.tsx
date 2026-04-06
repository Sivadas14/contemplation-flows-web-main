import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    MoreVertical,
    Edit,
    Trash2,
    User,
    Phone,
    Mail,
    Calendar,
    Activity,
    CreditCard,
    BarChart,
    X,
    Copy,
    Eye,
    Ban,
    UserCheck,
    UserX,
    AlertTriangle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { adminAPI } from "@/apis/api";
import { UserProfile, AdminUserDetail } from "@/apis/wire";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UserManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 5;

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isToggleActiveConfirmOpen, setIsToggleActiveConfirmOpen] = useState(false);
    const [userToProcess, setUserToProcess] = useState<UserProfile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * limit;
            const data = await adminAPI.listUsers(limit, skip);
            setUsers(Array.isArray(data.users) ? data.users : []);
            setTotalCount(data.total_count || 0);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const openUserDetails = async (user: UserProfile) => {
        try {
            setLoading(true);
            const detail = await adminAPI.getUserDetail(user.id);
            setSelectedUser({ ...detail, is_active: user.is_active });
            setIsModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch user details:", error);
            toast.error("Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async () => {
        if (!userToProcess) return;
        try {
            setIsProcessing(true);
            await adminAPI.toggleUserActive(userToProcess.id);
            toast.success(`User ${userToProcess.is_active ? 'deactivated' : 'activated'} successfully`);
            fetchUsers();
            if (selectedUser?.id === userToProcess.id) {
                const detail = await adminAPI.getUserDetail(userToProcess.id);
                setSelectedUser({ ...detail, is_active: !userToProcess.is_active });
            }
        } catch (error) {
            console.error("Failed to toggle user status:", error);
            toast.error("Failed to update user status");
        } finally {
            setIsProcessing(false);
            setIsToggleActiveConfirmOpen(false);
            setUserToProcess(null);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToProcess) return;
        try {
            setIsProcessing(true);
            await adminAPI.deleteUser(userToProcess.id);
            toast.success("User deleted successfully");
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast.error("Failed to delete user");
        } finally {
            setIsProcessing(false);
            setIsDeleteConfirmOpen(false);
            setUserToProcess(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.role === 'user' && (
            (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.phone_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.plan_type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'FREE': return 'bg-gray-100 text-gray-700';
            case 'BASIC': return 'bg-blue-100 text-blue-700';
            case 'PRO': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'inactive': return 'bg-yellow-100 text-yellow-700';
            case 'No Subscription': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const calculateUsagePercentage = (used: number, limit: number | string) => {
        if (limit === 'Unlimited' || limit === 0) return 0;
        const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
        return Math.min((used / limitNum) * 100, 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage user accounts, subscriptions, and usage</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={fetchUsers}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                    placeholder="Search users by name, email, phone, or plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0"
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        <p className="text-gray-500">Loading users...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <User className="w-12 h-12 text-gray-300" />
                                        <p className="text-gray-500">No users found</p>
                                        <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => openUserDetails(user)}
                                >
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{user.name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                    {user.id}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                            <span className="truncate max-w-[200px]">{user.email_id || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.phone_number ? (
                                            <div className="flex items-center">
                                                <Phone className="w-3 h-3 mr-2 text-gray-400" />
                                                <span>{user.country_code || ''} {user.phone_number}</span>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getPlanColor(user.plan_type)}>
                                            {user.plan_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={user.is_active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                                        >
                                            {user.is_active !== false ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(user.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openUserDetails(user);
                                                }}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(user.id);
                                                        toast.success('User ID copied to clipboard');
                                                    }}>
                                                        <Copy className="mr-2 h-4 w-4" /> Copy ID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setUserToProcess(user);
                                                            setIsToggleActiveConfirmOpen(true);
                                                        }}
                                                        className={user.is_active !== false ? "text-amber-600 focus:text-amber-700" : "text-emerald-600 focus:text-emerald-700"}
                                                    >
                                                        {user.is_active !== false ? (
                                                            <><Ban className="mr-2 h-4 w-4" /> Deactivate</>
                                                        ) : (
                                                            <><UserCheck className="mr-2 h-4 w-4" /> Activate</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setUserToProcess(user);
                                                            setIsDeleteConfirmOpen(true);
                                                        }}
                                                        className="text-red-600 focus:text-red-700"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {!loading && totalCount > limit && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <Button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            variant="outline"
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={() => setPage(page + 1)}
                            disabled={page * limit >= totalCount}
                            variant="outline"
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(page * limit, totalCount)}
                                </span>{' '}
                                of <span className="font-medium">{totalCount}</span> results
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                variant="outline"
                                size="sm"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => setPage(page + 1)}
                                disabled={page * limit >= totalCount}
                                variant="outline"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Total Users</div>
                    <div className="text-2xl font-bold">{totalCount}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Active Subscriptions</div>
                    <div className="text-2xl font-bold">
                        {users.filter(u => u.subscription_status === 'active').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Pro Users</div>
                    <div className="text-2xl font-bold">
                        {users.filter(u => u.plan_type === 'PRO').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Free Users</div>
                    <div className="text-2xl font-bold">
                        {users.filter(u => u.plan_type === 'FREE').length}
                    </div>
                </div>
            </div>

            {/* User Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>User Details</span>
                            {/* <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsModalOpen(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button> */}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-6">
                            {/* User Info Section */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3 flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    User Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-500">Full Name</div>
                                            <div className="font-medium">{selectedUser.name || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Email</div>
                                            <div className="font-medium flex items-center">
                                                <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                                {selectedUser.email_id || 'No email'}
                                            </div>
                                        </div>
                                        {/* <div>
                                            <div className="text-sm text-gray-500">User ID</div>
                                            <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                                                {selectedUser.id}
                                            </div>
                                        </div> */}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-500">Phone Number</div>
                                            <div className="font-medium flex items-center">
                                                <Phone className="w-3 h-3 mr-2 text-gray-400" />
                                                {selectedUser.phone_number ?
                                                    `${selectedUser.country_code || ''} ${selectedUser.phone_number}` :
                                                    'No phone number'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Account Status</div>
                                            <div className="flex items-center space-x-2">
                                                <Badge className={getPlanColor(selectedUser.plan_type)}>
                                                    {selectedUser.plan_type} Plan
                                                </Badge>
                                                <Badge variant="outline" className={getStatusColor(selectedUser.subscription_status)}>
                                                    {selectedUser.subscription_status}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className={selectedUser.is_active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                                                >
                                                    {selectedUser.is_active !== false ? 'Account Active' : 'Account Deactivated'}
                                                </Badge>
                                                {selectedUser.phone_verified && (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Phone Verified
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {/* <div>
                                            <div className="text-sm text-gray-500">Role</div>
                                            <div className="font-medium capitalize">{selectedUser.role}</div>
                                        </div> */}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Section */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3 flex items-center">
                                    <Activity className="w-4 h-4 mr-2" />
                                    Activity Timeline
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Account Created</div>
                                        <div className="font-medium flex items-center">
                                            <Calendar className="w-3 h-3 mr-2 text-gray-400" />
                                            {formatDate(selectedUser.created_at)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Last Active</div>
                                        <div className="font-medium flex items-center">
                                            <Activity className="w-3 h-3 mr-2 text-gray-400" />
                                            {formatDate(selectedUser.last_active_at || selectedUser.last_active)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quota Usage Section */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3 flex items-center">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Quota Usage
                                </h3>
                                <div className="space-y-4">
                                    {/* Chat Tokens */}
                                    {/* <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">Chat Tokens</span>
                                            <span>
                                                {selectedUser.quota_details?.chat_tokens?.used || 0} / {selectedUser.quota_details?.chat_tokens?.limit || 0}
                                            </span>
                                        </div>
                                        <Progress
                                            value={calculateUsagePercentage(
                                                selectedUser.quota_details?.chat_tokens?.used || 0,
                                                selectedUser.quota_details?.chat_tokens?.limit || 0
                                            )}
                                            className="h-2"
                                        />
                                    </div> */}

                                    {/* Other Quotas Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-xs text-gray-500">Image Cards</div>
                                            <div className="font-semibold">
                                                {selectedUser.quota_details?.image_cards?.used || 0} / {selectedUser.quota_details?.image_cards?.limit || 0}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-xs text-gray-500">Conversations</div>
                                            <div className="font-semibold">
                                                {selectedUser.quota_details?.conversations?.used || 0} / {selectedUser.quota_details?.conversations?.limit || 0}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-xs text-gray-500">Meditation</div>
                                            <div className="font-semibold">
                                                {selectedUser.quota_details?.meditation_duration?.used || 0} min / {selectedUser.quota_details?.meditation_duration?.limit || 0} min
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-xs text-gray-500">Add-on Cards</div>
                                            <div className="font-semibold">
                                                {selectedUser.quota_details?.addon_cards?.used || 0} / {selectedUser.quota_details?.addon_cards?.limit || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="flex space-x-2">
                                        {selectedUser.quota_details?.audio_enabled && (
                                            <Badge variant="outline">Audio Enabled</Badge>
                                        )}
                                        {selectedUser.quota_details?.video_enabled && (
                                            <Badge variant="outline">Video Enabled</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Usage Statistics */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3 flex items-center">
                                    <BarChart className="w-4 h-4 mr-2" />
                                    Usage Statistics
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Total Conversations</div>
                                        <div className="text-2xl font-bold">
                                            {selectedUser.usage_stats?.conversations || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Total Content Generated</div>
                                        <div className="text-2xl font-bold">
                                            {selectedUser.usage_stats?.content_generations?.total || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded border">
                                        <div className="text-xs text-gray-500">Images Generated</div>
                                        <div className="font-semibold">
                                            {selectedUser.usage_stats?.content_generations?.image || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <div className="text-xs text-gray-500">Audio Generated</div>
                                        <div className="font-semibold">
                                            {selectedUser.usage_stats?.content_generations?.audio || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <div className="text-xs text-gray-500">Video Generated</div>
                                        <div className="font-semibold">
                                            {selectedUser.usage_stats?.content_generations?.video || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setUserToProcess(selectedUser);
                                        setIsToggleActiveConfirmOpen(true);
                                    }}
                                    className={selectedUser.is_active !== false ? "text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"}
                                >
                                    {selectedUser.is_active !== false ? (
                                        <><Ban className="w-4 h-4 mr-2" /> Deactivate Account</>
                                    ) : (
                                        <><UserCheck className="w-4 h-4 mr-2" /> Activate Account</>
                                    )}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setUserToProcess(selectedUser);
                                        setIsDeleteConfirmOpen(true);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete User
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Toggle Active Confirmation Dialog */}
            <Dialog open={isToggleActiveConfirmOpen} onOpenChange={setIsToggleActiveConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-amber-600">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            {userToProcess?.is_active !== false ? 'Deactivate User?' : 'Activate User?'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            {userToProcess?.is_active !== false
                                ? "Are you sure you want to deactivate this account? The user will be blocked from logging in, but their data will be preserved."
                                : "Are you sure you want to reactivate this account? The user will be able to log in and access their data again."
                            }
                        </p>
                        {userToProcess && (
                            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100 italic text-sm text-gray-500">
                                User: {userToProcess.name || userToProcess.email_id || userToProcess.phone_number}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsToggleActiveConfirmOpen(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button
                            className={userToProcess?.is_active !== false ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                            onClick={handleToggleActive}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <><Activity className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                            ) : (
                                userToProcess?.is_active !== false ? 'Deactivate' : 'Activate'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-red-600">
                            <Trash2 className="w-5 h-5 mr-2" />
                            Delete User Permanently?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-900 font-semibold mb-2">Warning: This action is irreversible.</p>
                        <p className="text-gray-600">
                            Deleting this user will permanently remove:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                            <li>Account profile and subscription info</li>
                            <li>All conversations and message history</li>
                            <li>All generated audio, video, and image content</li>
                            <li>Storage files associated with this user</li>
                        </ul>
                        {userToProcess && (
                            <div className="mt-4 p-3 bg-red-50 rounded border border-red-100 italic text-sm text-red-600">
                                Currently selected: {userToProcess.name || userToProcess.email_id || userToProcess.phone_number}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <><Activity className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                            ) : (
                                'Delete Permanently'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagement;