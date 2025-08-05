import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  School, 
  Users, 
  BookOpen, 
  Bell, 
  Upload, 
  PlusCircle,
  Activity,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Palette,
  Theater,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Edit,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SchoolAdminPanel from "@/components/admin/SchoolAdminPanel";
import CultureAdminPanel from "@/components/admin/CultureAdminPanel";
import SuperAdminPanel from "@/components/admin/SuperAdminPanel";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  schoolPermissions?: number[];
  culturePermissions?: number[];
  permissions?: string[];
}

interface DashboardData {
  user: User;
  accessibleSchools: any[];
  accessibleCultureCategories: any[];
  canManageAll: boolean;
}

interface BookAnalytics {
  totalBooks: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalRevenue: number;
  recentOrdersCount: number;
  lowStockBooks: any[];
  outOfStockBooks: any[];
  topSellingBooks: any[];
  categoryStats: { [key: string]: number };
}

interface BookStock {
  id: number;
  bookId: number;
  quantity: number;
  lastUpdated: string;
  updatedBy: number;
  book: {
    id: number;
    title: string;
    author: string;
    category: string;
    price: string;
    imageUrl?: string;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingStock, setEditingStock] = useState<{ [key: number]: boolean }>({});
  const [stockValues, setStockValues] = useState<{ [key: number]: number }>({});

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/role-admin/dashboard"],
    retry: 1
  });

  // Fetch book analytics (only for super admin)
  const { data: bookAnalytics, isLoading: analyticsLoading } = useQuery<BookAnalytics>({
    queryKey: ["/api/admin/book-analytics"],
    enabled: dashboardData?.user?.role === "admin"
  });

  // Fetch book stock (only for super admin)
  const { data: bookStock, isLoading: stockLoading } = useQuery<BookStock[]>({
    queryKey: ["/api/admin/book-stock"],
    enabled: dashboardData?.user?.role === "admin"
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ bookId, quantity }: { bookId: number; quantity: number }) => {
      return apiRequest(`/api/admin/books/${bookId}/stock`, {
        method: "PATCH",
        body: { quantity }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-analytics"] });
      toast({
        title: "Success",
        description: "Book stock updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update book stock",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
            <Button onClick={() => window.location.href = "/"}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, accessibleSchools, accessibleCultureCategories, canManageAll } = dashboardData;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Users className="w-6 h-6" />;
      case "school_admin": return <School className="w-6 h-6" />;
      case "culture_admin": return <Palette className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin": return "Super Administrator";
      case "school_admin": return "School Administrator";
      case "culture_admin": return "Culture Administrator";
      default: return "Administrator";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 border-red-200";
      case "school_admin": return "bg-blue-100 text-blue-800 border-blue-200";
      case "culture_admin": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {getRoleIcon(user.role)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  <span className="text-gray-600">Welcome, {user.username}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {user.role === "admin" && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Schools</p>
                      <p className="text-2xl font-bold">{accessibleSchools.length}</p>
                    </div>
                    <School className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Culture Categories</p>
                      <p className="text-2xl font-bold">{accessibleCultureCategories.length}</p>
                    </div>
                    <Palette className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Status</p>
                      <p className="text-lg font-semibold text-green-600">Operational</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {user.role === "school_admin" && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assigned Schools</p>
                      <p className="text-2xl font-bold">{accessibleSchools.length}</p>
                    </div>
                    <School className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recent Activities</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Notifications</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Bell className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === "culture_admin" && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assigned Categories</p>
                      <p className="text-2xl font-bold">{accessibleCultureCategories.length}</p>
                    </div>
                    <Palette className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Programs</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Music className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Activities</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Theater className="w-8 h-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            {user.role === "admin" && <TabsTrigger value="analytics">Book Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {user.role === "admin" && (
                  <SuperAdminPanel 
                    schools={accessibleSchools}
                    cultureCategories={accessibleCultureCategories}
                  />
                )}
                
                {user.role === "school_admin" && (
                  <SchoolAdminPanel 
                    schools={accessibleSchools}
                    userPermissions={user.schoolPermissions || []}
                  />
                )}
                
                {user.role === "culture_admin" && (
                  <CultureAdminPanel 
                    categories={accessibleCultureCategories}
                    userPermissions={user.culturePermissions || []}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {user.role === "admin" || user.role === "school_admin" ? (
                  <SchoolAdminPanel 
                    schools={accessibleSchools}
                    userPermissions={user.schoolPermissions || []}
                  />
                ) : (
                  <div className="text-center py-8">
                    <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">You don't have permission to manage schools.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="culture" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {user.role === "admin" || user.role === "culture_admin" ? (
                  <CultureAdminPanel 
                    categories={accessibleCultureCategories}
                    userPermissions={user.culturePermissions || []}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">You don't have permission to manage culture categories.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Content management features coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === "admin" && (
            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                {/* Book Analytics Overview */}
                {bookAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Books</p>
                            <p className="text-2xl font-bold">{bookAnalytics.totalBooks}</p>
                          </div>
                          <BookOpen className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Stock</p>
                            <p className="text-2xl font-bold">{bookAnalytics.totalStock}</p>
                          </div>
                          <Package className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Low Stock</p>
                            <p className="text-2xl font-bold text-orange-600">{bookAnalytics.lowStockCount}</p>
                          </div>
                          <AlertTriangle className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Revenue (30d)</p>
                            <p className="text-2xl font-bold text-green-600">₹{bookAnalytics.totalRevenue.toFixed(2)}</p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Stock Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Book Stock Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stockLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading stock data...</p>
                      </div>
                    ) : bookStock && bookStock.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Book</TableHead>
                              <TableHead>Author</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Current Stock</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookStock.map((stock) => (
                              <TableRow key={stock.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-3">
                                    {stock.book.imageUrl && (
                                      <img 
                                        src={stock.book.imageUrl} 
                                        alt={stock.book.title}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                    )}
                                    <span className="max-w-[200px] truncate">{stock.book.title}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{stock.book.author}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{stock.book.category}</Badge>
                                </TableCell>
                                <TableCell>₹{stock.book.price}</TableCell>
                                <TableCell>
                                  {editingStock[stock.id] ? (
                                    <Input
                                      type="number"
                                      value={stockValues[stock.id] ?? stock.quantity}
                                      onChange={(e) => setStockValues({
                                        ...stockValues,
                                        [stock.id]: parseInt(e.target.value) || 0
                                      })}
                                      className="w-20"
                                      min="0"
                                    />
                                  ) : (
                                    <span className={`font-medium ${
                                      stock.quantity === 0 ? 'text-red-600' : 
                                      stock.quantity < 10 ? 'text-orange-600' : 
                                      'text-green-600'
                                    }`}>
                                      {stock.quantity}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      stock.quantity === 0 ? 'destructive' : 
                                      stock.quantity < 10 ? 'secondary' : 
                                      'default'
                                    }
                                  >
                                    {stock.quantity === 0 ? 'Out of Stock' : 
                                     stock.quantity < 10 ? 'Low Stock' : 
                                     'In Stock'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {editingStock[stock.id] ? (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          const newQuantity = stockValues[stock.id] ?? stock.quantity;
                                          updateStockMutation.mutate({
                                            bookId: stock.bookId,
                                            quantity: newQuantity
                                          });
                                          setEditingStock({...editingStock, [stock.id]: false});
                                        }}
                                        disabled={updateStockMutation.isPending}
                                      >
                                        <Save className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingStock({...editingStock, [stock.id]: false});
                                          setStockValues({...stockValues, [stock.id]: stock.quantity});
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingStock({...editingStock, [stock.id]: true});
                                        setStockValues({...stockValues, [stock.id]: stock.quantity});
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No book stock data available.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Selling Books */}
                {bookAnalytics && bookAnalytics.topSellingBooks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Top Selling Books (Last 30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bookAnalytics.topSellingBooks.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{item.book?.title || 'Unknown Book'}</p>
                                <p className="text-sm text-gray-600">{item.book?.author || 'Unknown Author'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{item.quantity} sold</p>
                              <p className="text-sm text-gray-600">₹{item.book?.price || '0'} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}