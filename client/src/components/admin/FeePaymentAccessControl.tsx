import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, CreditCard, Bell, Users, AlertTriangle } from "lucide-react";
import { useSchools, useUpdatePaymentSettings } from "@/hooks/useSchools";
import { usePaymentNotifications, usePaymentStats } from "@/hooks/usePayments";
import { School } from "@/services/schoolService";


export default function FeePaymentAccessControl() {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Use custom hooks for data and business logic
  const { data: schools = [], isLoading: schoolsLoading } = useSchools();
  const { data: paymentNotifications = [] } = usePaymentNotifications();
  const { data: stats } = usePaymentStats(schools);
  const updatePaymentSettingsMutation = useUpdatePaymentSettings();

  const toggleFeePaymentAccess = (schoolId: number, enabled: boolean) => {
    updatePaymentSettingsMutation.mutate({
      schoolId,
      settings: { feePaymentEnabled: enabled }
    });
  };

  const openConfigDialog = (school: School) => {
    setSelectedSchool(school);
    setIsConfigDialogOpen(true);
  };

  const savePaymentConfig = () => {
    if (!selectedSchool) return;

    updatePaymentSettingsMutation.mutate({
      schoolId: selectedSchool.id,
      settings: {
        feePaymentEnabled: selectedSchool.feePaymentEnabled,
        paymentMethods: selectedSchool.paymentMethods,
        adminApprovalRequired: selectedSchool.adminApprovalRequired,
        paymentConfig: selectedSchool.paymentConfig
      }
    }, {
      onSuccess: () => {
        setIsConfigDialogOpen(false);
      }
    });
  };

  // Default stats for loading/error states
  const defaultStats = {
    totalSchools: schools.length || 0,
    enabledSchools: schools.filter(s => s.feePaymentEnabled).length || 0,
    pendingNotifications: paymentNotifications.filter(n => n.status === 'pending').length || 0,
    recentPayments: paymentNotifications.filter(n => {
      const notifDate = new Date(n.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return notifDate > weekAgo;
    }).length || 0
  };

  const displayStats = stats || defaultStats;

  if (schoolsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-2xl font-bold">Fee Payment Access Control</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-2xl font-bold">Fee Payment Access Control</h2>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Super Admin Only</span>
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Schools</p>
                <p className="text-2xl font-bold">{displayStats.totalSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Enabled</p>
                <p className="text-2xl font-bold">{displayStats.enabledSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Notifications</p>
                <p className="text-2xl font-bold">{displayStats.pendingNotifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Recent Payments</p>
                <p className="text-2xl font-bold">{displayStats.recentPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Payment Access Table */}
      <Card>
        <CardHeader>
          <CardTitle>School Fee Payment Access</CardTitle>
          <CardDescription>
            Enable or disable fee payment functionality for each school. Only enabled schools can process student fee payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Methods</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>{school.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Switch
                          checked={school.feePaymentEnabled || false}
                          onCheckedChange={(enabled) => toggleFeePaymentAccess(school.id, enabled)}
                          disabled={updatePaymentSettingsMutation.isPending}
                          aria-label={`Toggle payment for ${school.name}`}
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                        />
                        {updatePaymentSettingsMutation.isPending && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant={school.feePaymentEnabled ? "default" : "secondary"}
                        className={school.feePaymentEnabled ? "bg-green-600" : "bg-gray-500"}
                      >
                        {school.feePaymentEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {school.paymentMethods?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {school.paymentMethods.map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Not configured</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openConfigDialog(school)}
                      disabled={updatePaymentSettingsMutation.isPending}
                    >
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payment Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Notifications</CardTitle>
          <CardDescription>
            Real-time notifications of fee payments received from all schools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentNotifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentNotifications.slice(0, 10).map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.schoolName}</TableCell>
                    <TableCell>{notification.studentName}</TableCell>
                    <TableCell>₹{notification.amount}</TableCell>
                    <TableCell>{notification.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge variant={notification.status === 'completed' ? 'default' : 'secondary'}>
                        {notification.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(notification.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent payment notifications</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Payment Settings</DialogTitle>
            <DialogDescription>
              Configure payment methods and approval settings for {selectedSchool?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="payment-enabled" className="text-sm font-medium">
                  Fee Payment Enabled
                </label>
                <Switch
                  id="payment-enabled"
                  checked={selectedSchool.feePaymentEnabled}
                  onCheckedChange={(checked) => 
                    setSelectedSchool({...selectedSchool, feePaymentEnabled: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="admin-approval" className="text-sm font-medium">
                  Require Admin Approval
                </label>
                <Switch
                  id="admin-approval"
                  checked={selectedSchool.adminApprovalRequired}
                  onCheckedChange={(checked) => 
                    setSelectedSchool({...selectedSchool, adminApprovalRequired: checked})
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Payment Methods</label>
                <Select 
                  value={selectedSchool.paymentMethods?.[0] || ""}
                  onValueChange={(value) => 
                    setSelectedSchool({...selectedSchool, paymentMethods: [value]})
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsConfigDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={savePaymentConfig}
                  disabled={updatePaymentSettingsMutation.isPending}
                >
                  {updatePaymentSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}