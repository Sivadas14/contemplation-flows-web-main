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
import { Download } from "lucide-react";
import { ordersAPI } from "@/apis/api";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Order {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  billing_name: string;
  product?: {
    name: string;
  };
}

const LIMIT = 6;

const PaymentHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    ordersAPI.getOrdersAdmin(page, LIMIT)
      .then((data) => {
        setOrders(data.items || []);
        setMaxPage(data.pagination?.max_page || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load orders", err);
        setLoading(false);
      });
  }, [page]);

  const downloadInvoice = async (orderId: string) => {
    try {
      const res = await ordersAPI.downloadInvoice(orderId)


      const data = res;

      // Open invoice PDF in new tab (auto-download)
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Invoice download failed", err);
      alert("Unable to download invoice");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.invoice_number}
                  </TableCell>

                  <TableCell>{order.billing_name}</TableCell>

                  <TableCell>{order.product?.name || "-"}</TableCell>

                  <TableCell>
                    {(order.total_amount / 100).toFixed(2)}{" "}
                    {order.currency.toUpperCase()}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        order.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : order.status === "canceled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadInvoice(order.id)}
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {page} of {maxPage}
        </p>

        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPaginationRange(page, maxPage).map((item, index) => (
              <PaginationItem key={index}>
                {item === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={page === item}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(item as number);
                    }}
                    className="cursor-pointer"
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < maxPage) setPage(page + 1);
                }}
                className={page === maxPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

// Helper function to generate pagination range with ellipsis
function getPaginationRange(current: number, total: number) {
  const delta = 2; // Pages to show on each side of current page
  const range = [];
  const rangeWithDots = [];
  let l;

  range.push(1);

  if (total <= 1) return range;

  for (let i = current - delta; i <= current + delta; i++) {
    if (i < total && i > 1) {
      range.push(i);
    }
  }

  range.push(total);

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export default PaymentHistory;
