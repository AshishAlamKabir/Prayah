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
  Save,
  CreditCard,
  CheckCircle,
  XCircle
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

  // Books query for management
  const { data: books } = useQuery({
    queryKey: ["/api/books"]
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

  // School payment management mutations
  const enablePaymentMutation = useMutation({
    mutationFn: async ({ schoolId, paymentMethods, adminApprovalRequired }: {
      schoolId: number;
      paymentMethods: string[];
      adminApprovalRequired: boolean;
    }) => {
      return apiRequest(`/api/admin/schools/${schoolId}/enable-payments`, {
        method: "POST",
        body: { paymentMethods, adminApprovalRequired }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-admin/dashboard"] });
      toast({
        title: "Success",
        description: "Fee payment enabled for school"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enable fee payment",
        variant: "destructive"
      });
    }
  });

  const disablePaymentMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      return apiRequest(`/api/admin/schools/${schoolId}/disable-payments`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-admin/dashboard"] });
      toast({
        title: "Success",
        description: "Fee payment disabled for school"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable fee payment",
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="books">Book Management</TabsTrigger>
            {user.role === "admin" && <TabsTrigger value="analytics">Book Analytics</TabsTrigger>}
            {user.role === "admin" && <TabsTrigger value="payments">Fee Payment Control</TabsTrigger>}
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

          {/* Book Management Tab */}
          <TabsContent value="books" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-red-600" />
                  <h2 className="text-2xl font-bold text-red-700">Book Management</h2>
                  <p className="text-gray-600 ml-2">Manage book catalog and inventory</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add New Book
                </Button>
              </div>

              {/* Books Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Books</p>
                        <p className="text-2xl font-bold">{books?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Package className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">In Stock</p>
                        <p className="text-2xl font-bold">{books?.filter(book => book.inStock).length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                        <p className="text-2xl font-bold">{books?.filter(book => !book.inStock).length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <DollarSign className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Value</p>
                        <p className="text-2xl font-bold">
                          ₹{books?.reduce((sum, book) => sum + parseFloat(book.price || "0"), 0).toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Books Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    All Books
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {books && books.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Featured</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {books.map((book) => (
                            <TableRow key={book.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {book.imageUrl && (
                                    <img 
                                      src={book.imageUrl} 
                                      alt={book.title}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{book.title}</p>
                                    <p className="text-sm text-gray-600">{book.description?.substring(0, 50)}...</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{book.author}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{book.category}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">₹{book.price}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={book.inStock ? "secondary" : "destructive"}
                                  className={book.inStock ? "bg-green-100 text-green-800" : ""}
                                >
                                  {book.inStock ? "In Stock" : "Out of Stock"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{book.bookType}</Badge>
                              </TableCell>
                              <TableCell>
                                {book.featured && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    View
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No books available.</p>
                      <Button className="mt-4 bg-red-600 hover:bg-red-700">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add First Book
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock Management Section for Super Admin */}
              {user.role === "admin" && bookStock && bookStock.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Stock Management
                      <Badge variant="outline" className="ml-2">Super Admin Only</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookStock.map((stock) => (
                            <TableRow key={stock.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{stock.book?.title}</p>
                                  <p className="text-sm text-gray-600">{stock.book?.author}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {editingStock[stock.id] ? (
                                  <Input
                                    type="number"
                                    value={stockValues[stock.id] || stock.quantity}
                                    onChange={(e) => setStockValues({
                                      ...stockValues,
                                      [stock.id]: parseInt(e.target.value) || 0
                                    })}
                                    className="w-20"
                                    min="0"
                                  />
                                ) : (
                                  <span className="font-medium">{stock.quantity}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={stock.quantity > 10 ? "secondary" : stock.quantity > 0 ? "outline" : "destructive"}
                                  className={
                                    stock.quantity > 10 ? "bg-green-100 text-green-800" :
                                    stock.quantity > 0 ? "bg-yellow-100 text-yellow-800" : ""
                                  }
                                >
                                  {stock.quantity > 10 ? "Good Stock" : 
                                   stock.quantity > 0 ? "Low Stock" : "Out of Stock"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {new Date(stock.lastUpdated).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {editingStock[stock.id] ? (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const newQuantity = stockValues[stock.id] || stock.quantity;
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
                  </CardContent>
                </Card>
              )}
            </div>
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

          {/* Fee Payment Control Tab - Super Admin Only */}
          {user.role === "admin" && (
            <TabsContent value="payments" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <h2 className="text-2xl font-bold text-red-700">Fee Payment Control</h2>
                  <p className="text-gray-600 ml-2">Manage school fee payment access and configurations</p>
                </div>

                {/* School Payment Status Cards */}
                <div className="grid gap-6">
                  {schools?.map((school) => (
                    <Card key={school.id} className="border-l-4 border-l-red-600">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{school.name}</CardTitle>
                            <p className="text-sm text-gray-600">{school.address}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {school.feePaymentEnabled ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Payment Enabled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Payment Disabled
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Current Configuration */}
                          {school.feePaymentEnabled && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Current Configuration:</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Payment Methods:</span>
                                  <p className="font-medium">
                                    {school.paymentMethods?.length > 0 
                                      ? school.paymentMethods.join(', ') 
                                      : 'Not configured'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Admin Approval:</span>
                                  <p className="font-medium">
                                    {school.adminApprovalRequired ? 'Required' : 'Not Required'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {school.feePaymentEnabled ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => disablePaymentMutation.mutate(school.id)}
                                disabled={disablePaymentMutation.isPending}
                              >
                                {disablePaymentMutation.isPending ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2" />
                                )}
                                Disable Payment
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => enablePaymentMutation.mutate({
                                    schoolId: school.id,
                                    paymentMethods: ['razorpay', 'stripe'],
                                    adminApprovalRequired: true
                                  })}
                                  disabled={enablePaymentMutation.isPending}
                                >
                                  {enablePaymentMutation.isPending ? (
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                  )}
                                  Enable Payment (Approval Required)
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => enablePaymentMutation.mutate({
                                    schoolId: school.id,
                                    paymentMethods: ['razorpay', 'stripe'],
                                    adminApprovalRequired: false
                                  })}
                                  disabled={enablePaymentMutation.isPending}
                                >
                                  Enable Payment (Direct)
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Statistics */}
                          <div className="pt-4 border-t">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-blue-600">0</p>
                                <p className="text-xs text-gray-600">Pending Payments</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-600">0</p>
                                <p className="text-xs text-gray-600">Completed Payments</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-red-600">₹0</p>
                                <p className="text-xs text-gray-600">Total Collected</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Fee Payment Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Payment System Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {schools?.filter(s => s.feePaymentEnabled).length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Schools with Payment Enabled</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">0</p>
                        <p className="text-sm text-gray-600">Total Fee Payments Today</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">0</p>
                        <p className="text-sm text-gray-600">Pending Approvals</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">₹0</p>
                        <p className="text-sm text-gray-600">Total Revenue This Month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}