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

interface ActivityFormData {
  title: string;
  description: string;
  activityType: string;
  schoolId: number;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  contactPerson: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  requirements: string;
  achievements: string;
  isPublic: boolean;
}

export default function SchoolManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [activityFiles, setActivityFiles] = useState<File[]>([]);

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

  // Activity form state
  const [activityForm, setActivityForm] = useState<ActivityFormData>({
    title: "",
    description: "",
    activityType: "event",
    schoolId: 0,
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
    isPublic: true
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

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/school-activities", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity added successfully!",
      });
      resetActivityForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
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

  const resetActivityForm = () => {
    setActivityForm({
      title: "",
      description: "",
      activityType: "event",
      schoolId: 0,
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
      isPublic: true
    });
    setActivityFiles([]);
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

  const handleAddActivity = async () => {
    if (!activityForm.title || !activityForm.description || !activityForm.schoolId) {
      toast({
        title: "Missing Information",
        description: "Please fill in activity title, description, and select a school.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', activityForm.title);
    formData.append('description', activityForm.description);
    formData.append('activityType', activityForm.activityType);
    formData.append('schoolId', activityForm.schoolId.toString());
    formData.append('status', activityForm.status);
    formData.append('startDate', activityForm.startDate);
    if (activityForm.endDate) {
      formData.append('endDate', activityForm.endDate);
    }
    if (activityForm.location) {
      formData.append('location', activityForm.location);
    }
    formData.append('maxParticipants', activityForm.maxParticipants.toString());
    if (activityForm.contactPerson) {
      formData.append('contactPerson', activityForm.contactPerson);
    }
    formData.append('contactInfo', JSON.stringify(activityForm.contactInfo));
    if (activityForm.requirements) {
      formData.append('requirements', activityForm.requirements);
    }
    if (activityForm.achievements) {
      formData.append('achievements', activityForm.achievements);
    }
    formData.append('isPublic', activityForm.isPublic.toString());

    // Add activity files
    activityFiles.forEach((file, index) => {
      formData.append(`activityFile_${index}`, file);
    });

    addActivityMutation.mutate(formData);
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

  const removeActivityFile = (index: number) => {
    setActivityFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleActivityFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const isValidType = validTypes.some(type => file.type.startsWith(type));
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB size limit.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setActivityFiles(prev => [...prev, ...validFiles]);
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add-school">Add School</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
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
                      value={notificationForm.schoolId?.toString() || "all"}
                      onValueChange={(value) => setNotificationForm(prev => ({ 
                        ...prev, 
                        schoolId: value && value !== "all" ? parseInt(value) : null 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Schools</SelectItem>
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

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Add School Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="activityTitle">Activity Title *</Label>
                    <Input
                      id="activityTitle"
                      value={activityForm.title}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter activity title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="activityType">Activity Type</Label>
                    <Select
                      value={activityForm.activityType}
                      onValueChange={(value) => setActivityForm(prev => ({ ...prev, activityType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Cultural Event</SelectItem>
                        <SelectItem value="program">Educational Program</SelectItem>
                        <SelectItem value="achievement">Achievement/Award</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="workshop">Workshop/Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="activitySchool">Target School *</Label>
                    <Select
                      value={activityForm.schoolId.toString()}
                      onValueChange={(value) => setActivityForm(prev => ({ ...prev, schoolId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(schools) ? schools.map((school: any) => (
                          <SelectItem key={school.id} value={school.id.toString()}>
                            {school.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="activityStatus">Status</Label>
                    <Select
                      value={activityForm.status}
                      onValueChange={(value) => setActivityForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={activityForm.startDate}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={activityForm.endDate}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={activityForm.location}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Event location"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={activityForm.maxParticipants}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                      placeholder="Maximum participants"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={activityForm.contactPerson}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Contact person name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={activityForm.contactInfo.phone}
                        onChange={(e) => setActivityForm(prev => ({ 
                          ...prev, 
                          contactInfo: { ...prev.contactInfo, phone: e.target.value }
                        }))}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={activityForm.contactInfo.email}
                        onChange={(e) => setActivityForm(prev => ({ 
                          ...prev, 
                          contactInfo: { ...prev.contactInfo, email: e.target.value }
                        }))}
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="activityDescription">Description *</Label>
                <Textarea
                  id="activityDescription"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the activity in detail"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="requirements">Requirements/Prerequisites</Label>
                  <Textarea
                    id="requirements"
                    value={activityForm.requirements}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="Any requirements or prerequisites"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="achievements">Achievements/Awards</Label>
                  <Textarea
                    id="achievements"
                    value={activityForm.achievements}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, achievements: e.target.value }))}
                    placeholder="Awards, recognitions, or outcomes"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Activity Attachments</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Upload Activity Files</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add photos, documents, certificates, or other relevant files
                    </p>
                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-gray-500">
                        Supported: Images, Documents, Videos • Max 50MB per file
                      </p>
                    </div>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      onChange={(e) => handleActivityFileUpload(e.target.files)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
                
                {activityFiles.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Attached Files ({activityFiles.length})</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {activityFiles.map((file, index) => (
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
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeActivityFile(index)}
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

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={activityForm.isPublic}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isPublic" className="text-sm">
                    Make this activity publicly visible
                  </Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddActivity}
                  disabled={addActivityMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addActivityMutation.isPending ? "Adding..." : "Add Activity"}
                </Button>
                <Button variant="outline" onClick={resetActivityForm}>
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