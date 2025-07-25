import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, CreditCard, Download, Calendar, User, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Order } from "@shared/schema";

export default function UserDashboard() {
  const { user, isSubscribed } = useAuth();

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/my-orders"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard.</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-green-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome, {user.firstName || user.username}!</h1>
              <p className="text-xl opacity-90">Your Personal Dashboard</p>
            </div>
            <div className="text-right">
              <Badge variant={isSubscribed ? "default" : "destructive"} className="text-lg px-4 py-2">
                {isSubscribed ? "Premium Member" : "Free Member"}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="p-6">
                <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{user.role}</div>
                <div className="text-gray-600">Account Type</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{orders?.length || 0}</div>
                <div className="text-gray-600">Total Orders</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Book className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {isSubscribed ? "Unlimited" : "Limited"}
                </div>
                <div className="text-gray-600">Book Access</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {user.subscriptionExpiry 
                    ? new Date(user.subscriptionExpiry).toLocaleDateString()
                    : "N/A"
                  }
                </div>
                <div className="text-gray-600">Subscription Expires</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isSubscribed ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-800">Active Premium Subscription</span>
                      </div>
                      <p className="text-green-700">
                        You have full access to all books, PDFs, and premium content.
                      </p>
                      {user.subscriptionExpiry && (
                        <p className="text-sm text-green-600 mt-2">
                          Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="font-semibold text-yellow-800">Free Account</span>
                      </div>
                      <p className="text-yellow-700 mb-3">
                        Upgrade to premium to access all books and PDF downloads.
                      </p>
                      <Link href="/store">
                        <Button className="bg-green-600 hover:bg-green-700">
                          Upgrade to Premium
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-900">Order #{order.id}</span>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          ${order.amount} • {new Date(order.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No orders yet</p>
                    <Link href="/store">
                      <Button variant="outline" className="mt-2">
                        Browse Books
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Link href="/books">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Book className="h-6 w-6 mb-2" />
                    Browse Books
                  </Button>
                </Link>
                
                <Link href="/store">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <CreditCard className="h-6 w-6 mb-2" />
                    Book Store
                  </Button>
                </Link>
                
                <Link href="/schools">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <User className="h-6 w-6 mb-2" />
                    Schools Directory
                  </Button>
                </Link>
                
                <Link href="/culture">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Calendar className="h-6 w-6 mb-2" />
                    Culture Programs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}