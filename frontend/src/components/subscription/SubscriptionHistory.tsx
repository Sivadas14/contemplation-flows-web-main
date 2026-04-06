import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ordersAPI } from "@/apis/api";
import { Order } from "@/apis/wire";
import { toast } from "sonner";

const LIMIT = 10;

interface SubscriptionHistoryProps {
    onBack?: () => void;
}

export const SubscriptionHistory: React.FC<SubscriptionHistoryProps> = ({ onBack }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [maxPage, setMaxPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await ordersAPI.getOrders(page, LIMIT);
            setOrders(data.items || []);
            setMaxPage(data.pagination?.max_page || 1);
        } catch (err) {
            console.error("Failed to load orders", err);
            toast.error("Failed to load subscription history");
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = async (orderId: string) => {
        try {
            const data = await ordersAPI.downloadInvoice(orderId);
            if (data.url) {
                window.open(data.url, "_blank");
            } else {
                toast.error("Invoice URL not found");
            }
        } catch (err) {
            console.error("Invoice download failed", err);
            toast.error("Unable to download invoice");
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl  font-bold text-[#472b20]">Subscription History</h1>
                    <p className="text-[#472b20]/60 mt-1 font-light">View your past payments and download invoices.</p>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-[#ECE5DF] overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[#F5F0EC]/50">
                            <TableRow className="border-b border-[#ECE5DF]">
                                <TableHead className=" font-semibold text-[#472b20]">Invoice ID</TableHead>
                                <TableHead className=" font-semibold text-[#472b20]">Billing Name</TableHead>
                                <TableHead className=" font-semibold text-[#472b20]">Plan</TableHead>
                                <TableHead className=" font-semibold text-[#472b20]">Amount</TableHead>
                                <TableHead className=" font-semibold text-[#472b20]">Status</TableHead>
                                <TableHead className=" font-semibold text-[#472b20]">Date</TableHead>
                                <TableHead className="text-right  font-semibold text-[#472b20]">Invoice</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#472b20]" />
                                            <p className="text-[#472b20]/60 text-sm font-light">Loading payments...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center text-[#472b20]/60 font-light">
                                        No payments found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium text-gray-900 py-4">
                                            {order.invoice_number}
                                        </TableCell>

                                        <TableCell className="text-gray-600">{order.billing_name}</TableCell>

                                        <TableCell className="text-gray-600">{order.product?.name || "-"}</TableCell>

                                        <TableCell className="font-semibold text-gray-900">
                                            {(order.total_amount / 100).toFixed(2)}{" "}
                                            {order.currency.toUpperCase()}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                className={
                                                    order.status === "paid"
                                                        ? "bg-green-50 text-green-700 border-green-100"
                                                        : order.status === " canceled" || order.status === "failed"
                                                            ? "bg-red-50 text-red-700 border-red-100"
                                                            : "bg-gray-50 text-gray-700 border-gray-100"
                                                }
                                                variant="outline"
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-gray-600">
                                            {new Date(order.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>

                                        <TableCell className="text-right py-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => downloadInvoice(order.id)}
                                                className="text-[#472b20]/40 hover:text-[#472b20] hover:bg-[#ECE5DF] rounded-full h-9 w-9"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {maxPage > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-[#472b20]/60 font-light">
                        Page {page} of {maxPage}
                    </p>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="rounded-lg border-[#ECE5DF] text-[#472b20] hover:bg-[#ECE5DF]"
                        >
                            Prev
                        </Button>

                        {Array.from({ length: maxPage }, (_, i) => i + 1).map((pageNumber) => (
                            <Button
                                key={pageNumber}
                                size="sm"
                                variant={page === pageNumber ? "default" : "outline"}
                                onClick={() => setPage(pageNumber)}
                                className={`h-8 w-8 p-0 rounded-lg ${page === pageNumber ? 'bg-[#472b20] hover:bg-[#5d3a2c] text-white' : 'border-[#ECE5DF] text-[#472b20] hover:bg-[#ECE5DF]'}`}
                            >
                                {pageNumber}
                            </Button>
                        ))}

                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page === maxPage}
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded-lg border-[#ECE5DF] text-[#472b20] hover:bg-[#ECE5DF]"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
