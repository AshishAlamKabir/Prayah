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
import { 
  Music, Palette, Drama, BookOpen, Camera, Upload, Image, Video, 
  FileText, Calendar, Users, MapPin, Phone, Mail, Globe, Instagram, 
  Facebook, Twitter, Youtube, Link2, Plus, X, Eye
} from "lucide-react";

interface CultureProgramFormData {
  categoryId: number;
  title: string;
  description: string;
  activityType: string;
  instructorName: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
    website: string;
  };
  schedule: {
    days: string[];
    time: string;
    duration: string;
  };
  fees: {
    monthly: number;
    registration: number;
  };
  capacity: number;
  ageGroup: string;
}

interface ActivityFormData {
  categoryId: number;
  title: string;
  content: string;
  activityType: string;
  eventDate: string;
  location: string;
  participants: number;
  achievements: string;
}

export default function CultureManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // Culture program form state
  const [programForm, setProgramForm] = useState<CultureProgramFormData>({
    categoryId: 0,
    title: "",
    description: "",
    activityType: "regular",
    instructorName: "",
    contactInfo: {
      phone: "",
      email: "",
      address: "",
    },
    socialMedia: {
      facebook: "",
      instagram: "",
      youtube: "",
      twitter: "",
      website: "",
    },
    schedule: {
      days: [],
      time: "",
      duration: "",
    },
    fees: {
      monthly: 0,
      registration: 0,
    },
    capacity: 0,
    ageGroup: "all",
  });

  // Activity form state
  const [activityForm, setActivityForm] = useState<ActivityFormData>({
    categoryId: 0,
    title: "",
    content: "",
    activityType: "event",
    eventDate: new Date().toISOString().split('T')[0],
    location: "",
    participants: 0,
    achievements: "",
  });

  // Fetch culture categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/culture-categories"],
  });

  // Add program mutation
  const addProgramMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/culture-programs", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/culture-categories"] });
      toast({
        title: "Success",
        description: "Culture program added successfully!",
      });
      resetProgramForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add culture program. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/culture-activities", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity published successfully!",
      });
      resetActivityForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetProgramForm = () => {
    setProgramForm({
      categoryId: 0,
      title: "",
      description: "",
      activityType: "regular",
      instructorName: "",
      contactInfo: {
        phone: "",
        email: "",
        address: "",
      },
      socialMedia: {
        facebook: "",
        instagram: "",
        youtube: "",
        twitter: "",
        website: "",
      },
      schedule: {
        days: [],
        time: "",
        duration: "",
      },
      fees: {
        monthly: 0,
        registration: 0,
      },
      capacity: 0,
      ageGroup: "all",
    });
    setMediaFiles([]);
  };

  const resetActivityForm = () => {
    setActivityForm({
      categoryId: 0,
      title: "",
      content: "",
      activityType: "event",
      eventDate: new Date().toISOString().split('T')[0],
      location: "",
      participants: 0,
      achievements: "",
    });
    setMediaFiles([]);
  };

  const handleAddProgram = async () => {
    if (!programForm.title || !programForm.categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in program title and select a category.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(programForm).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append(`mediaFile_${index}`, file);
    });

    addProgramMutation.mutate(formData);
  };

  const handleAddActivity = async () => {
    if (!activityForm.title || !activityForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in activity title and content.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(activityForm).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append(`mediaFile_${index}`, file);
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

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('Sangeet') || categoryName.includes('Music')) return <Music className="w-5 h-5" />;
    if (categoryName.includes('Chitra') || categoryName.includes('Fine')) return <Palette className="w-5 h-5" />;
    if (categoryName.includes('Natya') || categoryName.includes('Drama')) return <Drama className="w-5 h-5" />;
    if (categoryName.includes('Kabya') || categoryName.includes('Poetry')) return <BookOpen className="w-5 h-5" />;
    if (categoryName.includes('Nritya') || categoryName.includes('Dance')) return <Camera className="w-5 h-5" />;
    return <Music className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Culture Program Management</h2>
          <p className="text-gray-600">Manage cultural programs, activities, and social media presence</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Add Program</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesLoading ? (
              <div className="col-span-full text-center py-8">Loading programs...</div>
            ) : !Array.isArray(categories) || categories.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Programs Available</h3>
                <p className="text-gray-500 mb-4">Start by adding your first cultural program.</p>
                <Button onClick={() => setActiveTab("programs")}>Add First Program</Button>
              </div>
            ) : (
              (categories as any[]).map((category: any) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(category.name)}
                      <span className="text-sm">{category.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{category.description || 'Traditional arts and cultural education'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        Active Programs: 0
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Recent Activities: 0
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedCategory(category.id);
                        setActiveTab("programs");
                      }}>
                        Add Program
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedCategory(category.id);
                        setActiveTab("activities");
                      }}>
                        Add Activity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Add New Culture Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Culture Category *</Label>
                    <Select
                      value={programForm.categoryId.toString()}
                      onValueChange={(value) => setProgramForm(prev => ({ ...prev, categoryId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(categories) ? categories.filter(category => category.id).map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>

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
                    <Label htmlFor="activityType">Program Type</Label>
                    <Select
                      value={programForm.activityType}
                      onValueChange={(value) => setProgramForm(prev => ({ ...prev, activityType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Classes</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="masterclass">Master Class</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={programForm.capacity}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      placeholder="Maximum students"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <Select
                      value={programForm.ageGroup}
                      onValueChange={(value) => setProgramForm(prev => ({ ...prev, ageGroup: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="children">Children (5-12)</SelectItem>
                        <SelectItem value="teens">Teens (13-18)</SelectItem>
                        <SelectItem value="adults">Adults (18+)</SelectItem>
                        <SelectItem value="seniors">Seniors (60+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="monthlyFee">Monthly Fee (₹)</Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={programForm.fees.monthly}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        fees: { ...prev.fees, monthly: parseFloat(e.target.value) || 0 }
                      }))}
                      placeholder="Monthly fee amount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="registrationFee">Registration Fee (₹)</Label>
                    <Input
                      id="registrationFee"
                      type="number"
                      value={programForm.fees.registration}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        fees: { ...prev.fees, registration: parseFloat(e.target.value) || 0 }
                      }))}
                      placeholder="One-time registration fee"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Program Description</Label>
                <Textarea
                  id="description"
                  value={programForm.description}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the program, objectives, and what students will learn"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    value={programForm.contactInfo.phone}
                    onChange={(e) => setProgramForm(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    placeholder="Contact number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={programForm.contactInfo.email}
                    onChange={(e) => setProgramForm(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    placeholder="Contact email"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={programForm.contactInfo.address}
                    onChange={(e) => setProgramForm(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, address: e.target.value }
                    }))}
                    placeholder="Program venue"
                  />
                </div>
              </div>

              <div>
                <Label>Social Media Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <Input
                      value={programForm.socialMedia.facebook}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                      }))}
                      placeholder="Facebook page URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <Input
                      value={programForm.socialMedia.instagram}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                      }))}
                      placeholder="Instagram profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <Input
                      value={programForm.socialMedia.youtube}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                      }))}
                      placeholder="YouTube channel URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <Input
                      value={programForm.socialMedia.website}
                      onChange={(e) => setProgramForm(prev => ({ 
                        ...prev, 
                        socialMedia: { ...prev.socialMedia, website: e.target.value }
                      }))}
                      placeholder="Website URL"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Media Files</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload program photos, videos, or documents</p>
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
                  onClick={handleAddProgram}
                  disabled={addProgramMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addProgramMutation.isPending ? "Adding Program..." : "Add Program"}
                </Button>
                <Button variant="outline" onClick={resetProgramForm}>
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
                <Calendar className="w-5 h-5 text-blue-600" />
                Add Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="activityCategory">Category</Label>
                    <Select
                      value={activityForm.categoryId.toString()}
                      onValueChange={(value) => setActivityForm(prev => ({ ...prev, categoryId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(categories) ? categories.filter(category => category.id).map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>

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
                    <Label htmlFor="actType">Activity Type</Label>
                    <Select
                      value={activityForm.activityType}
                      onValueChange={(value) => setActivityForm(prev => ({ ...prev, activityType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Cultural Event</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="exhibition">Exhibition</SelectItem>
                        <SelectItem value="award">Award/Recognition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={activityForm.eventDate}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, eventDate: e.target.value }))}
                    />
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
                    <Label htmlFor="participants">Participants</Label>
                    <Input
                      id="participants"
                      type="number"
                      value={activityForm.participants}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, participants: parseInt(e.target.value) || 0 }))}
                      placeholder="Number of participants"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Activity Description *</Label>
                <Textarea
                  id="content"
                  value={activityForm.content}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Describe the activity, what happened, and key highlights"
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="achievements">Awards & Achievements</Label>
                <Textarea
                  id="achievements"
                  value={activityForm.achievements}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, achievements: e.target.value }))}
                  placeholder="List any awards, recognitions, or notable achievements"
                  rows={3}
                />
              </div>

              <div>
                <Label>Attach Media Files</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload photos, videos, or documents from the activity</p>
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
                  <div className="mt-3 space-y-2">
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
                  onClick={handleAddActivity}
                  disabled={addActivityMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {addActivityMutation.isPending ? "Publishing..." : "Publish Activity"}
                </Button>
                <Button variant="outline" onClick={resetActivityForm}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-600" />
                Social Media Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Social Media Integration</h3>
                <p className="text-gray-500 mb-4">Manage social media links and integrations for all cultural programs.</p>
                <Button variant="outline">Configure Social Media</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}