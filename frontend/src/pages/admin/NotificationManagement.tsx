import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Plus, Loader2, Save, X } from "lucide-react";
import { api } from "@/apis";
import { Notification } from "@/apis/wire";
import { toast } from "sonner";
import { create } from "domain";

const NotificationManagement = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editMessage, setEditMessage] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await api.notification.getNotificationBar();
            setNotifications(Array.isArray(data) ? data : data ? [data] : []);
        } catch (error) {
            console.error("Failed to load notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newMessage.trim()) return;
        try {
            setIsSaving(true);
            await api.notification.createNotification({ message: newMessage });
            toast.success("Notification created successfully");
            setNewMessage("");
            setIsAdding(false);
            loadNotifications();
        } catch (error) {
            console.error("Failed to create notification:", error);
            toast.error("Failed to create notification");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (notification: Notification) => {
        if (!editMessage.trim()) return;
        try {
            setIsSaving(true);
            await api.notification.updateNotification(notification.id, {id:notification.id, message: editMessage,created_at : notification.created_at });
            toast.success("Notification updated successfully");
            setEditingId(null);
            loadNotifications();
        } catch (error) {
            console.error("Failed to update notification:", error);
            toast.error("Failed to update notification");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this notification?")) return;
        try {
            await api.notification.deleteNotification(id);
            toast.success("Notification deleted successfully");
            loadNotifications();
        } catch (error) {
            console.error("Failed to delete notification:", error);
            toast.error("Failed to delete notification");
        }
    };

    const startEditing = (notification: Notification) => {
        setEditingId(notification.id);
        setEditMessage(notification.message);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Banner</h1>
                    <p className="text-gray-600 mt-1">Manage announcement banner content</p>
                </div>
                {/* {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Notification
                    </Button>
                )} */}
            </div>

            {isAdding && (
                <Card className="border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Add New Notification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Enter notification message..."
                            disabled={isSaving}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsAdding(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={isSaving || !newMessage.trim()}>
                                {isSaving ? "Saving..." : "Create Notification"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Message</TableHead>
                                <TableHead className="w-[150px]">Created At</TableHead>
                                <TableHead className="w-[150px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                        No notifications found. Create one to show it on the banner.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                notifications.map((notification) => (
                                    <TableRow key={notification.id}>
                                        <TableCell>
                                            {editingId === notification.id ? (
                                                <Input
                                                    value={editMessage}
                                                    onChange={(e) => setEditMessage(e.target.value)}
                                                    className="w-full"
                                                />
                                            ) : (
                                                <span className="text-gray-900">{notification.message}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingId === notification.id ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpdate(notification)}
                                                            disabled={isSaving || !editMessage.trim()}
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => startEditing(notification)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        {/* <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(notification.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button> */}
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
            </div>
        </div>
    );
};

export default NotificationManagement;
