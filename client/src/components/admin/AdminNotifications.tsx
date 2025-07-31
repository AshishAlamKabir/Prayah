import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, DollarSign, FileText, School, Palette, Mail, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminNotification {
  id: number;
  notificationType: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedEntityType?: string;
  relatedEntityId?: number;
  paymentId?: number;
  isRead: boolean;
  readAt?: string;
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
}

interface AdminNotificationsProps {
  adminUserId: number;
}

export default function AdminNotifications({ adminUserId }: AdminNotificationsProps) {
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/admin/notifications", adminUserId, activeTab],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/notifications?unreadOnly=${activeTab === "unread"}`);
      return response.json();
    },
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/admin/notifications/unread-count", adminUserId],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/notifications/unread-count");
      const data = await response.json();
      return data.count || 0;
    },
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("POST", `/api/admin/notifications/${notificationId}/mark-read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/notifications/mark-all-read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return <DollarSign className="h-4 w-4" />;
      case 'publication_submitted': return <FileText className="h-4 w-4" />;
      case 'school_fee': return <School className="h-4 w-4" />;
      case 'culture_program': return <Palette className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Admin Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay updated on payments, submissions, and admin activities
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              disabled={markAllAsReadMutation.isPending}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "unread" | "all")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="mt-4">
            <NotificationsList 
              notifications={notifications.filter((n: AdminNotification) => !n.isRead)}
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              getPriorityColor={getPriorityColor}
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            <NotificationsList 
              notifications={notifications}
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              getPriorityColor={getPriorityColor}
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface NotificationsListProps {
  notifications: AdminNotification[];
  isLoading: boolean;
  onMarkAsRead: (id: number) => void;
  getPriorityColor: (priority: string) => string;
  getNotificationIcon: (type: string) => React.ReactNode;
}

function NotificationsList({ 
  notifications, 
  isLoading, 
  onMarkAsRead, 
  getPriorityColor, 
  getNotificationIcon 
}: NotificationsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">No notifications</p>
        <p className="text-sm text-muted-foreground">
          You're all caught up! New notifications will appear here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`transition-all duration-200 ${
              !notification.isRead 
                ? 'border-l-4 border-l-primary bg-primary/5' 
                : 'border-l-4 border-l-transparent'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notificationType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                    
                    <p className={`text-sm ${
                      !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {notification.emailSent && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email Sent
                          </Badge>
                        )}
                        
                        {notification.isRead && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Read
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {!notification.isRead && (
                  <Button
                    onClick={() => onMarkAsRead(notification.id)}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 ml-2"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}