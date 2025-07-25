import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Mail, 
  User, 
  CreditCard,
  Package,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: number;
  userId: number;
  orderItems: Array<{
    bookId: number;
    quantity: number;
    price: number;
    title: string;
  }>;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  paymentLink: string;
  notifiedAt?: string;
  createdAt: string;
}

export default function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'notified'>('all');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const notifyMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await apiRequest("PATCH", `/api/admin/orders/${orderId}/notify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Notified",
        description: "Customer has been notified successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to notify customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNotify = (orderId: number) => {
    notifyMutation.mutate(orderId);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return !order.notifiedAt;
    if (filter === 'notified') return order.notifiedAt;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Orders ({orders.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pending ({orders.filter(o => !o.notifiedAt).length})
          </Button>
          <Button
            variant={filter === 'notified' ? 'default' : 'outline'}
            onClick={() => setFilter('notified')}
            size="sm"
          >
            Notified ({orders.filter(o => o.notifiedAt).length})
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "No orders have been placed yet." 
                : filter === 'pending'
                ? "No pending orders to notify."
                : "No notified orders found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.createdAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.notifiedAt ? "default" : "secondary"}>
                      {order.notifiedAt ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {order.notifiedAt ? "Notified" : "Pending"}
                    </Badge>
                    <Badge variant="outline" className="text-green-600">
                      ₹{order.totalAmount.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{order.customerEmail}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 text-gray-500">📞</span>
                        <span className="text-sm text-gray-600">{order.customerPhone}</span>
                      </div>
                    )}
                  </div>
                  
                  {order.shippingAddress && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Shipping Address</span>
                      </div>
                      <p className="text-sm text-gray-600 pl-6">{order.shippingAddress}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Order Items ({order.orderItems.length})
                  </h4>
                  <div className="space-y-2">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{item.title}</span>
                          <span className="text-sm text-gray-600 ml-2">× {item.quantity}</span>
                        </div>
                        <span className="font-medium text-green-600">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <a 
                      href={order.paymentLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Payment Link
                    </a>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.notifiedAt ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Notified on {format(new Date(order.notifiedAt), 'PP')}
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleNotify(order.id)}
                        disabled={notifyMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {notifyMutation.isPending ? "Notifying..." : "Notify Customer"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}