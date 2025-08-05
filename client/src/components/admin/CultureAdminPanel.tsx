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
  Palette, 
  Music, 
  Theater, 
  Camera, 
  Upload, 
  PlusCircle, 
  Image,
  Video,
  Calendar,
  Users,
  Activity,
  BookOpen
} from "lucide-react";

interface CultureAdminPanelProps {
  categories: any[];
  userPermissions: number[];
}

export default function CultureAdminPanel({ categories, userPermissions }: CultureAdminPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categories.length > 0 ? categories[0].id : null
  );

  // Program form state
  const [programForm, setProgramForm] = useState({
    title: "",
    description: "",
    activityType: "regular",
    instructorName: "",
    contactInfo: {
      phone: "",
      email: "",
      address: ""
    },
    socialMedia: {
      facebook: "",
      instagram: "",
      youtube: ""
    },
    schedule: {
      days: "",
      time: "",
      duration: ""
    },
    fees: {
      monthly: 0,
      quarterly: 0,
      yearly: 0
    },
    capacity: 0,
    ageGroup: "all",
    mediaFiles: [] as File[]
  });

  // Activity form state
  const [activityForm, setActivityForm] = useState({
    title: "",
    content: "",
    activityType: "performance",
    eventDate: new Date().toISOString().split('T')[0],
    location: "",
    participants: 0,
    achievements: "",
    mediaFiles: [] as File[]
  });

  // Mutations
  const createProgramMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest(`/api/admin/culture-programs`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program created successfully"
      });
      setProgramForm({
        title: "",
        description: "",
        activityType: "regular",
        instructorName: "",
        contactInfo: { phone: "", email: "", address: "" },
        socialMedia: { facebook: "", instagram: "", youtube: "" },
        schedule: { days: "", time: "", duration: "" },
        fees: { monthly: 0, quarterly: 0, yearly: 0 },
        capacity: 0,
        ageGroup: "all",
        mediaFiles: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive"
      });
    }
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest(`/api/admin/culture-activities`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity published successfully"
      });
      setActivityForm({
        title: "",
        content: "",
        activityType: "performance",
        eventDate: new Date().toISOString().split('T')[0],
        location: "",
        participants: 0,
        achievements: "",
        mediaFiles: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish activity",
        variant: "destructive"
      });
    }
  });

  const handleCreateProgram = async () => {
    if (!programForm.title || !programForm.description || !selectedCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("categoryId", selectedCategory.toString());
    formData.append("title", programForm.title);
    formData.append("description", programForm.description);
    formData.append("activityType", programForm.activityType);
    formData.append("instructorName", programForm.instructorName);
    formData.append("contactInfo", JSON.stringify(programForm.contactInfo));
    formData.append("socialMedia", JSON.stringify(programForm.socialMedia));
    formData.append("schedule", JSON.stringify(programForm.schedule));
    formData.append("fees", JSON.stringify(programForm.fees));
    formData.append("capacity", programForm.capacity.toString());
    formData.append("ageGroup", programForm.ageGroup);

    programForm.mediaFiles.forEach((file) => {
      formData.append("mediaFile", file);
    });

    createProgramMutation.mutate(formData);
  };

  const handlePublishActivity = async () => {
    if (!activityForm.title || !activityForm.content || !selectedCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("categoryId", selectedCategory.toString());
    formData.append("title", activityForm.title);
    formData.append("content", activityForm.content);
    formData.append("activityType", activityForm.activityType);
    formData.append("eventDate", activityForm.eventDate);
    formData.append("location", activityForm.location);
    formData.append("participants", activityForm.participants.toString());
    formData.append("achievements", activityForm.achievements);

    activityForm.mediaFiles.forEach((file) => {
      formData.append("mediaFile", file);
    });

    createActivityMutation.mutate(formData);
  };

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("music") || name.includes("সঙ্গীত")) return <Music className="w-5 h-5" />;
    if (name.includes("dance") || name.includes("নৃত্য")) return <Theater className="w-5 h-5" />;
    if (name.includes("art") || name.includes("চিত্র")) return <Palette className="w-5 h-5" />;
    if (name.includes("drama") || name.includes("নাটক")) return <Theater className="w-5 h-5" />;
    if (name.includes("poetry") || name.includes("কবিতা")) return <BookOpen className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Culture Management</h2>
          </div>
          {categories.length > 1 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="categorySelect">Category:</Label>
              <Select
                value={selectedCategory?.toString() || ""}
                onValueChange={(value) => setSelectedCategory(parseInt(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {currentCategory && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(currentCategory.name)}
              <h3 className="font-semibold text-green-900">{currentCategory.name}</h3>
            </div>
            <p className="text-green-700 text-sm">{currentCategory.description}</p>
            {currentCategory.featured && (
              <Badge className="mt-2 bg-green-100 text-green-800">Featured Category</Badge>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Active Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">No active programs</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("programs")}>
                  Create Program
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">No recent activities</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("activities")}>
                  Publish Activity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Enrolled:</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active:</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Create Culture Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="programTitle">Program Title *</Label>
                    <Input
                      id="programTitle"
                      value={programForm.title}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter program title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructorName">Instructor Name</Label>
                    <Input
                      id="instructorName"
                      value={programForm.instructorName}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, instructorName: e.target.value }))}
                      placeholder="Enter instructor name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacity">Maximum Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={programForm.capacity}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <Select
                      value={programForm.ageGroup}
                      onValueChange={(value) => setProgramForm(prev => ({ ...prev, ageGroup: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="children">Children (5-12)</SelectItem>
                        <SelectItem value="teenagers">Teenagers (13-17)</SelectItem>
                        <SelectItem value="adults">Adults (18+)</SelectItem>
                        <SelectItem value="seniors">Seniors (60+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={programForm.contactInfo.phone}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        contactInfo: { ...prev.contactInfo, phone: e.target.value }
                      }))}
                      placeholder="Enter contact phone"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={programForm.contactInfo.email}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        contactInfo: { ...prev.contactInfo, email: e.target.value }
                      }))}
                      placeholder="Enter contact email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="scheduleDays">Schedule Days</Label>
                    <Input
                      id="scheduleDays"
                      value={programForm.schedule.days}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        schedule: { ...prev.schedule, days: e.target.value }
                      }))}
                      placeholder="e.g., Monday, Wednesday, Friday"
                    />
                  </div>

                  <div>
                    <Label htmlFor="scheduleTime">Schedule Time</Label>
                    <Input
                      id="scheduleTime"
                      value={programForm.schedule.time}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        schedule: { ...prev.schedule, time: e.target.value }
                      }))}
                      placeholder="e.g., 4:00 PM - 6:00 PM"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="programDescription">Program Description *</Label>
                <Textarea
                  id="programDescription"
                  value={programForm.description}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed program description"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthlyFee">Monthly Fee (₹)</Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    value={programForm.fees.monthly}
                    onChange={(e) => setProgramForm(prev => ({ 
                      ...prev, 
                      fees: { ...prev.fees, monthly: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="quarterlyFee">Quarterly Fee (₹)</Label>
                  <Input
                    id="quarterlyFee"
                    type="number"
                    value={programForm.fees.quarterly}
                    onChange={(e) => setProgramForm(prev => ({ 
                      ...prev, 
                      fees: { ...prev.fees, quarterly: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="yearlyFee">Yearly Fee (₹)</Label>
                  <Input
                    id="yearlyFee"
                    type="number"
                    value={programForm.fees.yearly}
                    onChange={(e) => setProgramForm(prev => ({ 
                      ...prev, 
                      fees: { ...prev.fees, yearly: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="programMedia">Program Media</Label>
                <Input
                  id="programMedia"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setProgramForm(prev => ({ ...prev, mediaFiles: files }));
                  }}
                />
                {programForm.mediaFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {programForm.mediaFiles.length} file(s) selected
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreateProgram}
                disabled={createProgramMutation.isPending}
                className="w-full"
              >
                {createProgramMutation.isPending ? "Creating..." : "Create Program"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Publish Culture Activity
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="exhibition">Exhibition</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={activityForm.eventDate}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, eventDate: e.target.value }))}
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
                      placeholder="Enter event location"
                    />
                  </div>

                  <div>
                    <Label htmlFor="participants">Number of Participants</Label>
                    <Input
                      id="participants"
                      type="number"
                      value={activityForm.participants}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, participants: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="achievements">Achievements/Awards</Label>
                    <Input
                      id="achievements"
                      value={activityForm.achievements}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, achievements: e.target.value }))}
                      placeholder="Enter any achievements or awards"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="activityContent">Activity Content *</Label>
                <Textarea
                  id="activityContent"
                  value={activityForm.content}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Describe the activity, its impact, and outcomes"
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="activityMedia">Activity Media</Label>
                <Input
                  id="activityMedia"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setActivityForm(prev => ({ ...prev, mediaFiles: files }));
                  }}
                />
                {activityForm.mediaFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {activityForm.mediaFiles.length} file(s) selected
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handlePublishActivity}
                disabled={createActivityMutation.isPending}
                className="w-full"
              >
                {createActivityMutation.isPending ? "Publishing..." : "Publish Activity"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-indigo-600" />
                Media Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Media gallery features coming soon</p>
                <p className="text-sm text-gray-500">Upload and manage cultural program photos, videos, and promotional materials</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}