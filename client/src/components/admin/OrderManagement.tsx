import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAdminOrders } from "@/hooks/useOrders";
import { OrderService } from "@/services/orderService";
import { formatCurrency, formatDate } from "@/utils/business";
import { Eye, Edit, Package } from "lucide-react";
import { Order } from "@/types";

export function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdateOrder, setStatusUpdateOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const {
    orders,
    isLoading,
    updateOrderStatus,
    updateTrackingNumber,
    isUpdatingStatus,
    isUpdatingTracking,
  } = useAdminOrders();

  const handleStatusUpdate = (order: Order) => {
    setStatusUpdateOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.adminNotes || "");
    setTrackingNumber(order.trackingNumber || "");
  };

  const submitStatusUpdate = () => {
    if (!statusUpdateOrder) return;

    if (newStatus !== statusUpdateOrder.status) {
      updateOrderStatus({
        id: statusUpdateOrder.id,
        status: newStatus,
        adminNotes: adminNotes,
      });
    }

    if (trackingNumber !== statusUpdateOrder.trackingNumber && trackingNumber.trim()) {
      updateTrackingNumber({
        id: statusUpdateOrder.id,
        trackingNumber: trackingNumber.trim(),
      });
    }

    setStatusUpdateOrder(null);
    setNewStatus("");
    setAdminNotes("");
    setTrackingNumber("");
  };

  const getStatusBadgeVariant = (status: string) => {
    const color = OrderService.getOrderStatusColor(status);
    switch (color) {
      case 'green': return 'default';
      case 'blue': return 'secondary';
      case 'yellow': return 'outline';
      case 'red': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    const color = OrderService.getPaymentStatusColor(status);
    switch (color) {
      case 'green': return 'default';
      case 'red': return 'destructive';
      case 'yellow': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Management</h1>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.status === 'processing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, order) => sum + Number(order.totalAmount), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.user?.username || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt, 'short')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-semibold">Customer:</Label>
                                  <p>{selectedOrder.user?.username}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Total Amount:</Label>
                                  <p>{formatCurrency(Number(selectedOrder.totalAmount))}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Status:</Label>
                                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                                    {selectedOrder.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="font-semibold">Payment Status:</Label>
                                  <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.paymentStatus)}>
                                    {selectedOrder.paymentStatus}
                                  </Badge>
                                </div>
                              </div>
                              
                              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                                <div>
                                  <Label className="font-semibold">Order Items:</Label>
                                  <div className="mt-2 space-y-2">
                                    {selectedOrder.orderItems.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                                        <div>
                                          <p className="font-medium">{item.title}</p>
                                          <p className="text-sm text-gray-600">by {item.author}</p>
                                        </div>
                                        <div className="text-right">
                                          <p>Qty: {item.quantity}</p>
                                          <p>{formatCurrency(Number(item.price))}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {selectedOrder.trackingNumber && (
                                <div>
                                  <Label className="font-semibold">Tracking Number:</Label>
                                  <p>{selectedOrder.trackingNumber}</p>
                                </div>
                              )}
                              
                              {selectedOrder.adminNotes && (
                                <div>
                                  <Label className="font-semibold">Admin Notes:</Label>
                                  <p>{selectedOrder.adminNotes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Order - {order.orderNumber}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="status">Order Status</Label>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="tracking">Tracking Number</Label>
                              <Input
                                id="tracking"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="adminNotes">Admin Notes</Label>
                              <Textarea
                                id="adminNotes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes for this order"
                                rows={3}
                              />
                            </div>
                            
                            <Button 
                              onClick={submitStatusUpdate}
                              disabled={isUpdatingStatus || isUpdatingTracking}
                              className="w-full"
                            >
                              Update Order
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {orders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No orders found</h3>
              <p className="text-gray-500">Orders will appear here once customers start placing them.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}