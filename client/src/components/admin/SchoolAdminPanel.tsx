import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  School, 
  Bell, 
  Calendar, 
  Upload, 
  PlusCircle, 
  Image,
  FileText,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  Activity,
  GraduationCap
} from "lucide-react";

// Import student management components
import StudentList from "@/components/school-admin/StudentList";
import AddStudentForm from "@/components/school-admin/AddStudentForm";
import ExcelUploader from "@/components/school-admin/ExcelUploader";
import FeePaymentTracker from "@/components/school-admin/FeePaymentTracker";
import StudentStatusManager from "@/components/school-admin/StudentStatusManager";

interface SchoolAdminPanelProps {
  schools: any[];
  userPermissions: number[];
}

export default function SchoolAdminPanel({ schools, userPermissions }: SchoolAdminPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSchool, setSelectedSchool] = useState<number | null>(
    schools.length > 0 ? schools[0].id : null
  );

  // Fetch students for selected school
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/schools", selectedSchool, "students"],
    queryFn: () => apiRequest("GET", `/api/schools/${selectedSchool}/students`).then(res => res.json()),
    enabled: !!selectedSchool,
  });

  // Fetch payment summary
  const { data: paymentSummary } = useQuery({
    queryKey: ["/api/schools", selectedSchool, "payments", "summary"],
    queryFn: () => apiRequest("GET", `/api/schools/${selectedSchool}/payments/summary`).then(res => res.json()),
    enabled: !!selectedSchool,
  });

  // Get class hierarchy
  const { data: classHierarchy } = useQuery({
    queryKey: ["/api/class-hierarchy"],
    queryFn: () => apiRequest("GET", "/api/class-hierarchy").then(res => res.json()),
  });

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    content: "",
    type: "announcement",
    priority: "medium",
    publishDate: new Date().toISOString().split('T')[0],
    mediaFiles: [] as File[]
  });

  // Activity form state
  const [activityForm, setActivityForm] = useState({
    title: "",
    description: "",
    activityType: "event",
    status: "upcoming",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    location: "",
    maxParticipants: 0,
    contactPerson: "",
    contactInfo: {
      phone: "",
      email: ""
    },
    requirements: "",
    achievements: "",
    isPublic: true,
    attachments: [] as File[]
  });

  // Mutations
  const createNotificationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest(`/api/admin/school-notifications`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification published successfully"
      });
      setNotificationForm({
        title: "",
        content: "",
        type: "announcement",
        priority: "medium",
        publishDate: new Date().toISOString().split('T')[0],
        mediaFiles: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish notification",
        variant: "destructive"
      });
    }
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest(`/api/admin/school-activities`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity created successfully"
      });
      setActivityForm({
        title: "",
        description: "",
        activityType: "event",
        status: "upcoming",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        location: "",
        maxParticipants: 0,
        contactPerson: "",
        contactInfo: { phone: "", email: "" },
        requirements: "",
        achievements: "",
        isPublic: true,
        attachments: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create activity",
        variant: "destructive"
      });
    }
  });

  const handlePublishNotification = async () => {
    if (!notificationForm.title || !notificationForm.content || !selectedSchool) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", notificationForm.title);
    formData.append("content", notificationForm.content);
    formData.append("type", notificationForm.type);
    formData.append("schoolId", selectedSchool.toString());
    formData.append("priority", notificationForm.priority);
    formData.append("publishDate", notificationForm.publishDate);

    notificationForm.mediaFiles.forEach((file, index) => {
      formData.append("mediaFile", file);
    });

    createNotificationMutation.mutate(formData);
  };

  const handleCreateActivity = async () => {
    if (!activityForm.title || !activityForm.description || !selectedSchool) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", activityForm.title);
    formData.append("description", activityForm.description);
    formData.append("activityType", activityForm.activityType);
    formData.append("schoolId", selectedSchool.toString());
    formData.append("status", activityForm.status);
    formData.append("startDate", activityForm.startDate);
    formData.append("endDate", activityForm.endDate || "");
    formData.append("location", activityForm.location);
    formData.append("maxParticipants", activityForm.maxParticipants.toString());
    formData.append("contactPerson", activityForm.contactPerson);
    formData.append("contactInfo", JSON.stringify(activityForm.contactInfo));
    formData.append("requirements", activityForm.requirements);
    formData.append("achievements", activityForm.achievements);
    formData.append("isPublic", activityForm.isPublic.toString());

    activityForm.attachments.forEach((file) => {
      formData.append("activityFiles", file);
    });

    createActivityMutation.mutate(formData);
  };

  const currentSchool = schools.find(school => school.id === selectedSchool);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <School className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">School Management</h2>
          </div>
          {schools.length > 1 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="schoolSelect">School:</Label>
              <Select
                value={selectedSchool?.toString() || ""}
                onValueChange={(value) => setSelectedSchool(parseInt(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {currentSchool && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">{currentSchool.name}</h3>
            <p className="text-blue-700 text-sm mt-1">{currentSchool.location}</p>
            <div className="flex gap-4 mt-2">
              <Badge variant="outline" className="bg-blue-100">
                {currentSchool.studentCount || 0} Students
              </Badge>
              <Badge variant="outline" className="bg-green-100">
                {currentSchool.teacherCount || 0} Teachers
              </Badge>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">No recent notifications</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("notifications")}>
                  Create Notification
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  School Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">No upcoming activities</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("activities")}>
                  Create Activity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Students:</span>
                    <span className="font-semibold">{students?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Teachers:</span>
                    <span className="font-semibold">{currentSchool?.teacherCount || 0}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setActiveTab("students")}>
                    Manage Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6 mt-6">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold">Student Management</h3>
            </div>
            
            {/* Student Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-blue-600">{students?.length || 0}</p>
                    </div>
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Students</p>
                      <p className="text-2xl font-bold text-green-600">{students?.filter(s => s.status === 'active')?.length || 0}</p>
                    </div>
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Classes</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {students ? Object.keys(students.reduce((acc, s) => ({ ...acc, [s.className]: true }), {})).length : 0}
                      </p>
                    </div>
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recent Admissions</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {students?.filter(s => {
                          const admissionDate = new Date(s.admissionDate);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return admissionDate >= thirtyDaysAgo;
                        })?.length || 0}
                      </p>
                    </div>
                    <PlusCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Management Tabs */}
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="list">Student List</TabsTrigger>
                <TabsTrigger value="add">Add Student</TabsTrigger>
                <TabsTrigger value="upload">Excel Upload</TabsTrigger>
                <TabsTrigger value="fees">Fee Management</TabsTrigger>
                <TabsTrigger value="status">Status Manager</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StudentList 
                      schoolId={selectedSchool} 
                      students={students || []}
                      isLoading={studentsLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="add" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Student</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AddStudentForm 
                      schoolId={selectedSchool}
                      classHierarchy={classHierarchy}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Student Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExcelUploader 
                      schoolId={selectedSchool}
                      classHierarchy={classHierarchy}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fee Payment Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FeePaymentTracker 
                      schoolId={selectedSchool}
                      students={students || []}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Status Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StudentStatusManager 
                      schoolId={selectedSchool}
                      students={students || []}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                Create School Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={notificationForm.type}
                      onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="admission">Admission</SelectItem>
                        <SelectItem value="examination">Examination</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={notificationForm.priority}
                      onValueChange={(value) => setNotificationForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="publishDate">Publish Date</Label>
                    <Input
                      id="publishDate"
                      type="date"
                      value={notificationForm.publishDate}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, publishDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={notificationForm.content}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter notification content"
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="mediaFiles">Media Attachments</Label>
                <Input
                  id="mediaFiles"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNotificationForm(prev => ({ ...prev, mediaFiles: files }));
                  }}
                />
                {notificationForm.mediaFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {notificationForm.mediaFiles.length} file(s) selected
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handlePublishNotification}
                disabled={createNotificationMutation.isPending}
                className="w-full"
              >
                {createNotificationMutation.isPending ? "Publishing..." : "Publish Notification"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Create School Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="activityTitle">Title *</Label>
                    <Input
                      id="activityTitle"
                      value={activityForm.title}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter activity title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="activityType">Type</Label>
                    <Select
                      value={activityForm.activityType}
                      onValueChange={(value) => setActivityForm(prev => ({ ...prev, activityType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="celebration">Celebration</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={activityForm.startDate}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={activityForm.endDate}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={activityForm.location}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter activity location"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={activityForm.maxParticipants}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={activityForm.contactPerson}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={activityForm.contactInfo.phone}
                      onChange={(e) => setActivityForm(prev => ({ 
                        ...prev, 
                        contactInfo: { ...prev.contactInfo, phone: e.target.value }
                      }))}
                      placeholder="Enter contact phone"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="activityDescription">Description *</Label>
                <Textarea
                  id="activityDescription"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter activity description"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="attachments">Activity Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setActivityForm(prev => ({ ...prev, attachments: files }));
                  }}
                />
              </div>

              <Button 
                onClick={handleCreateActivity}
                disabled={createActivityMutation.isPending}
                className="w-full"
              >
                {createActivityMutation.isPending ? "Creating..." : "Create Activity"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-600" />
                Media Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Media management features coming soon</p>
                <p className="text-sm text-gray-500">Upload and manage school photos, videos, and documents</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}