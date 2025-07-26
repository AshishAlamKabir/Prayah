import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { School, Building, Upload, Image, Video, FileText, Calendar, Users, MapPin, Phone, Mail, Globe, Bell, Eye, Archive } from "lucide-react";

interface SchoolFormData {
  name: string;
  location: string;
  description: string;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  establishedYear: number;
  studentCount: number;
  teacherCount: number;
  programs: string[];
  facilities: string[];
}

interface NotificationFormData {
  title: string;
  content: string;
  type: string;
  schoolId: number | null;
  priority: string;
  publishDate: string;
}

export default function SchoolManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // School form state
  const [schoolForm, setSchoolForm] = useState<SchoolFormData>({
    name: "",
    location: "",
    description: "",
    contactInfo: {
      phone: "",
      email: "",
      website: "",
    },
    establishedYear: new Date().getFullYear(),
    studentCount: 0,
    teacherCount: 0,
    programs: [],
    facilities: [],
  });

  // Notification form state
  const [notificationForm, setNotificationForm] = useState<NotificationFormData>({
    title: "",
    content: "",
    type: "announcement",
    schoolId: null,
    priority: "medium",
    publishDate: new Date().toISOString().split('T')[0],
  });

  // Fetch schools
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ["/api/schools"],
  });

  // Add school mutation
  const addSchoolMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/schools", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Success",
        description: "School added successfully!",
      });
      resetSchoolForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add school. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add notification mutation
  const addNotificationMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/school-notifications", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification published successfully!",
      });
      resetNotificationForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish notification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetSchoolForm = () => {
    setSchoolForm({
      name: "",
      location: "",
      description: "",
      contactInfo: {
        phone: "",
        email: "",
        website: "",
      },
      establishedYear: new Date().getFullYear(),
      studentCount: 0,
      teacherCount: 0,
      programs: [],
      facilities: [],
    });
    setMediaFiles([]);
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      title: "",
      content: "",
      type: "announcement",
      schoolId: null,
      priority: "medium",
      publishDate: new Date().toISOString().split('T')[0],
    });
    setMediaFiles([]);
  };

  const handleAddSchool = async () => {
    if (!schoolForm.name || !schoolForm.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in school name and location.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', schoolForm.name);
    formData.append('location', schoolForm.location);
    formData.append('description', schoolForm.description);
    formData.append('contactInfo', JSON.stringify(schoolForm.contactInfo));
    formData.append('establishedYear', schoolForm.establishedYear.toString());
    formData.append('studentCount', schoolForm.studentCount.toString());
    formData.append('teacherCount', schoolForm.teacherCount.toString());
    formData.append('programs', JSON.stringify(schoolForm.programs));
    formData.append('facilities', JSON.stringify(schoolForm.facilities));

    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append(`mediaFile_${index}`, file);
    });

    addSchoolMutation.mutate(formData);
  };

  const handleAddNotification = async () => {
    if (!notificationForm.title || !notificationForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in notification title and content.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', notificationForm.title);
    formData.append('content', notificationForm.content);
    formData.append('type', notificationForm.type);
    formData.append('priority', notificationForm.priority);
    formData.append('publishDate', notificationForm.publishDate);
    if (notificationForm.schoolId) {
      formData.append('schoolId', notificationForm.schoolId.toString());
    }

    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append(`mediaFile_${index}`, file);
    });

    addNotificationMutation.mutate(formData);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">School Management System</h2>
          <p className="text-gray-600">Manage schools, notifications, and media content</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add-school">Add School</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="media">Media Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schoolsLoading ? (
              <div className="col-span-full text-center py-8">Loading schools...</div>
            ) : Array.isArray(schools) && schools.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Schools Added</h3>
                <p className="text-gray-500 mb-4">Start by adding your first school to the system.</p>
                <Button onClick={() => setActiveTab("add-school")}>Add First School</Button>
              </div>
            ) : Array.isArray(schools) ? (
              schools.map((school: any) => (
                <Card key={school.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      {school.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {school.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {school.studentCount || 0} Students
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Est. {school.establishedYear || 'N/A'}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="add-school" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5 text-green-600" />
                Add New School
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                      id="schoolName"
                      value={schoolForm.name}
                      onChange={(e) => setSchoolForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter school name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={schoolForm.location}
                      onChange={(e) => setSchoolForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter school location"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={schoolForm.contactInfo.phone}
                      onChange={(e) => setSchoolForm(prev => ({ 
                        ...prev, 
                        contactInfo: { ...prev.contactInfo, phone: e.target.value }
                      }))}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={schoolForm.contactInfo.email}
                      onChange={(e) => setSchoolForm(prev => ({ 
                        ...prev, 
                        contactInfo: { ...prev.contactInfo, email: e.target.value }
                      }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={schoolForm.contactInfo.website}
                      onChange={(e) => setSchoolForm(prev => ({ 
                        ...prev, 
                        contactInfo: { ...prev.contactInfo, website: e.target.value }
                      }))}
                      placeholder="Enter website URL"
                    />
                  </div>

                  <div>
                    <Label htmlFor="establishedYear">Established Year</Label>
                    <Input
                      id="establishedYear"
                      type="number"
                      value={schoolForm.establishedYear}
                      onChange={(e) => setSchoolForm(prev => ({ ...prev, establishedYear: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter established year"
                    />
                  </div>

                  <div>
                    <Label htmlFor="studentCount">Student Count</Label>
                    <Input
                      id="studentCount"
                      type="number"
                      value={schoolForm.studentCount}
                      onChange={(e) => setSchoolForm(prev => ({ ...prev, studentCount: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter student count"
                    />
                  </div>

                  <div>
                    <Label htmlFor="teacherCount">Teacher Count</Label>
                    <Input
                      id="teacherCount"
                      type="number"
                      value={schoolForm.teacherCount}
                      onChange={(e) => setSchoolForm(prev => ({ ...prev, teacherCount: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter teacher count"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter school description"
                  rows={4}
                />
              </div>

              <div>
                <Label>Media Files</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload school photos, documents, or videos</p>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
                
                {mediaFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Selected Files:</Label>
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') && <Image className="w-4 h-4" />}
                          {file.type.startsWith('video/') && <Video className="w-4 h-4" />}
                          {file.type.includes('pdf') && <FileText className="w-4 h-4" />}
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddSchool}
                  disabled={addSchoolMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addSchoolMutation.isPending ? "Adding School..." : "Add School"}
                </Button>
                <Button variant="outline" onClick={resetSchoolForm}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Create School Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notificationTitle">Notification Title *</Label>
                    <Input
                      id="notificationTitle"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notificationType">Type</Label>
                    <Select
                      value={notificationForm.type}
                      onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select notification type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="admission">Admission</SelectItem>
                        <SelectItem value="examination">Examination</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="school">Target School</Label>
                    <Select
                      value={notificationForm.schoolId?.toString() || ""}
                      onValueChange={(value) => setNotificationForm(prev => ({ 
                        ...prev, 
                        schoolId: value ? parseInt(value) : null 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Schools</SelectItem>
                        {Array.isArray(schools) ? schools.map((school: any) => (
                          <SelectItem key={school.id} value={school.id.toString()}>
                            {school.name}
                          </SelectItem>
                        )) : null}
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
                        <SelectValue placeholder="Select priority" />
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
                <Label htmlFor="notificationContent">Content *</Label>
                <Textarea
                  id="notificationContent"
                  value={notificationForm.content}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter notification content"
                  rows={6}
                />
              </div>

              <div>
                <Label>Attach Media Files</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Upload Notification Files</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop files here, or click to browse
                    </p>
                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-gray-500">
                        Supported: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX), Videos (MP4, AVI)
                      </p>
                      <p className="text-xs text-gray-500">Maximum file size: 50MB per file</p>
                    </div>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
                
                {mediaFiles.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Attached Files ({mediaFiles.length})</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {file.type.startsWith('image/') && (
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Image className="w-4 h-4 text-blue-600" />
                                </div>
                              )}
                              {file.type.startsWith('video/') && (
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <Video className="w-4 h-4 text-purple-600" />
                                </div>
                              )}
                              {file.type.includes('pdf') && (
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-red-600" />
                                </div>
                              )}
                              {file.type.includes('doc') && (
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddNotification}
                  disabled={addNotificationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {addNotificationMutation.isPending ? "Publishing..." : "Publish Notification"}
                </Button>
                <Button variant="outline" onClick={resetNotificationForm}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-600" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    Latest notifications will appear here with their media attachments.
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Sample Notification</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Announcement
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Example notification content...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Published today</span>
                        <span>•</span>
                        <span>2 attachments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Media Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-gray-600">Total Files</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-600">Active Notifications</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-gray-600">Images</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">0</div>
                      <div className="text-sm text-gray-600">Documents</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk File Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-600" />
                Notification Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Quick Actions</h3>
                    <p className="text-sm text-gray-600">Manage notifications and their attachments</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                    <Button size="sm" variant="outline">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Old
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Drag & drop files</p>
                    <p className="text-xs text-gray-500">or click to browse</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Supported Files</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Images: JPG, PNG, GIF</li>
                      <li>• Documents: PDF, DOC, DOCX</li>
                      <li>• Videos: MP4, AVI</li>
                      <li>• Max size: 50MB</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">File Guidelines</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Use descriptive names</li>
                      <li>• Compress large images</li>
                      <li>• Check content before upload</li>
                      <li>• Consider accessibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}