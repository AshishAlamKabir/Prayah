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
import PlatformSettings from "./PlatformSettings";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  School, 
  Palette, 
  Save, 
  Upload, 
  Image,
  FileText,
  MapPin,
  Phone,
  Mail,
  Globe,
  Activity,
  GraduationCap,
  Settings,
  Eye,
  Edit3
} from "lucide-react";

interface School {
  id: number;
  name: string;
  location: string;
  description: string;
  detailedDescription?: string;
  aboutUs?: string;
  mission?: string;
  vision?: string;
  history?: string;
  principalMessage?: string;
  studentCount: number;
  teacherCount: number;
  imageUrl?: string;
  logo?: string;
  mediaFiles?: any[];
  galleryImages?: any[];
  programs?: string[];
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  achievements?: string[];
  facilities?: string[];
  infrastructure?: string[];
  extracurriculars?: string[];
}

interface CultureCategory {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  aboutSection?: string;
  objectives?: string[];
  activities?: string[];
  instructorInfo?: string;
  scheduleInfo?: string;
  requirements?: string;
  achievements?: string[];
  history?: string;
  philosophy?: string;
  icon: string;
  programs?: any[];
  mediaFiles?: any[];
  galleryImages?: any[];
  performanceVideos?: any[];
  youtubeChannelUrl?: string;
  socialMediaLinks?: any;
  featured: boolean;
}

interface ContentEditorProps {
  schools: School[];
  cultureCategories: CultureCategory[];
}

export default function ContentEditor({ schools, cultureCategories }: ContentEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("schools");
  const [selectedSchool, setSelectedSchool] = useState<number | null>(
    schools.length > 0 ? schools[0].id : null
  );
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    cultureCategories.length > 0 ? cultureCategories[0].id : null
  );
  const [editMode, setEditMode] = useState(false);

  // Get current school data
  const currentSchool = schools.find(s => s.id === selectedSchool);
  const currentCategory = cultureCategories.find(c => c.id === selectedCategory);

  // School form state
  const [schoolForm, setSchoolForm] = useState({
    aboutUs: currentSchool?.aboutUs || "",
    mission: currentSchool?.mission || "",
    vision: currentSchool?.vision || "",
    history: currentSchool?.history || "",
    principalMessage: currentSchool?.principalMessage || "",
    detailedDescription: currentSchool?.detailedDescription || "",
    contactEmail: currentSchool?.contactEmail || "",
    contactPhone: currentSchool?.contactPhone || "",
    website: currentSchool?.website || "",
    achievements: currentSchool?.achievements?.join('\n') || "",
    facilities: currentSchool?.facilities?.join('\n') || "",
    infrastructure: currentSchool?.infrastructure?.join('\n') || "",
    extracurriculars: currentSchool?.extracurriculars?.join('\n') || ""
  });

  // Culture form state
  const [cultureForm, setCultureForm] = useState({
    aboutSection: currentCategory?.aboutSection || "",
    detailedDescription: currentCategory?.detailedDescription || "",
    objectives: currentCategory?.objectives?.join('\n') || "",
    activities: currentCategory?.activities?.join('\n') || "",
    instructorInfo: currentCategory?.instructorInfo || "",
    scheduleInfo: currentCategory?.scheduleInfo || "",
    requirements: currentCategory?.requirements || "",
    achievements: currentCategory?.achievements?.join('\n') || "",
    history: currentCategory?.history || "",
    philosophy: currentCategory?.philosophy || "",
    youtubeChannelUrl: currentCategory?.youtubeChannelUrl || ""
  });

  // Update school content
  const updateSchoolMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/schools/${selectedSchool}`, {
        ...data,
        achievements: data.achievements.split('\n').filter((item: string) => item.trim()),
        facilities: data.facilities.split('\n').filter((item: string) => item.trim()),
        infrastructure: data.infrastructure.split('\n').filter((item: string) => item.trim()),
        extracurriculars: data.extracurriculars.split('\n').filter((item: string) => item.trim())
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Updated",
        description: "School content has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update school content.",
        variant: "destructive",
      });
    }
  });

  // Update culture content
  const updateCultureMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/culture-categories/${selectedCategory}`, {
        ...data,
        objectives: data.objectives.split('\n').filter((item: string) => item.trim()),
        activities: data.activities.split('\n').filter((item: string) => item.trim()),
        achievements: data.achievements.split('\n').filter((item: string) => item.trim())
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Updated",
        description: "Cultural program content has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/culture-categories"] });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update cultural program content.",
        variant: "destructive",
      });
    }
  });

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolMutation.mutate(schoolForm);
  };

  const handleCultureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCultureMutation.mutate(cultureForm);
  };

  // Update forms when selection changes
  const handleSchoolChange = (schoolId: string) => {
    const id = parseInt(schoolId);
    setSelectedSchool(id);
    const school = schools.find(s => s.id === id);
    if (school) {
      setSchoolForm({
        aboutUs: school.aboutUs || "",
        mission: school.mission || "",
        vision: school.vision || "",
        history: school.history || "",
        principalMessage: school.principalMessage || "",
        detailedDescription: school.detailedDescription || "",
        contactEmail: school.contactEmail || "",
        contactPhone: school.contactPhone || "",
        website: school.website || "",
        achievements: school.achievements?.join('\n') || "",
        facilities: school.facilities?.join('\n') || "",
        infrastructure: school.infrastructure?.join('\n') || "",
        extracurriculars: school.extracurriculars?.join('\n') || ""
      });
    }
    setEditMode(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    const id = parseInt(categoryId);
    setSelectedCategory(id);
    const category = cultureCategories.find(c => c.id === id);
    if (category) {
      setCultureForm({
        aboutSection: category.aboutSection || "",
        detailedDescription: category.detailedDescription || "",
        objectives: category.objectives?.join('\n') || "",
        activities: category.activities?.join('\n') || "",
        instructorInfo: category.instructorInfo || "",
        scheduleInfo: category.scheduleInfo || "",
        requirements: category.requirements || "",
        achievements: category.achievements?.join('\n') || "",
        history: category.history || "",
        philosophy: category.philosophy || "",
        youtubeChannelUrl: category.youtubeChannelUrl || ""
      });
    }
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Editor</h2>
          <p className="text-gray-600">Edit and manage content across schools and cultural programs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? "destructive" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                View Mode
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Mode
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schools" className="flex items-center gap-2">
            <School className="w-4 h-4" />
            Schools ({schools.length})
          </TabsTrigger>
          <TabsTrigger value="culture" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Culture ({cultureCategories.length})
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Platform Settings
          </TabsTrigger>
        </TabsList>

        {/* Schools Content Editor */}
        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <School className="w-5 h-5" />
                  School Content Management
                </div>
                <Select value={selectedSchool?.toString()} onValueChange={handleSchoolChange}>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSchool && (
                <form onSubmit={handleSchoolSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="aboutUs">About Us</Label>
                        <Textarea
                          id="aboutUs"
                          value={schoolForm.aboutUs}
                          onChange={(e) => setSchoolForm({...schoolForm, aboutUs: e.target.value})}
                          placeholder="Describe the school's overview and purpose"
                          rows={4}
                          disabled={!editMode}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mission">Mission Statement</Label>
                        <Textarea
                          id="mission"
                          value={schoolForm.mission}
                          onChange={(e) => setSchoolForm({...schoolForm, mission: e.target.value})}
                          placeholder="School's mission statement"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="vision">Vision Statement</Label>
                        <Textarea
                          id="vision"
                          value={schoolForm.vision}
                          onChange={(e) => setSchoolForm({...schoolForm, vision: e.target.value})}
                          placeholder="School's vision for the future"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="history">School History</Label>
                        <Textarea
                          id="history"
                          value={schoolForm.history}
                          onChange={(e) => setSchoolForm({...schoolForm, history: e.target.value})}
                          placeholder="History and founding story"
                          rows={4}
                          disabled={!editMode}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="principalMessage">Principal's Message</Label>
                        <Textarea
                          id="principalMessage"
                          value={schoolForm.principalMessage}
                          onChange={(e) => setSchoolForm({...schoolForm, principalMessage: e.target.value})}
                          placeholder="Message from the principal"
                          rows={4}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={schoolForm.contactEmail}
                          onChange={(e) => setSchoolForm({...schoolForm, contactEmail: e.target.value})}
                          placeholder="school@example.com"
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          value={schoolForm.contactPhone}
                          onChange={(e) => setSchoolForm({...schoolForm, contactPhone: e.target.value})}
                          placeholder="+91 12345 67890"
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="website">Website URL</Label>
                        <Input
                          id="website"
                          type="url"
                          value={schoolForm.website}
                          onChange={(e) => setSchoolForm({...schoolForm, website: e.target.value})}
                          placeholder="https://school.example.com"
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="achievements">Achievements (one per line)</Label>
                        <Textarea
                          id="achievements"
                          value={schoolForm.achievements}
                          onChange={(e) => setSchoolForm({...schoolForm, achievements: e.target.value})}
                          placeholder="List school achievements, one per line"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="facilities">Facilities (one per line)</Label>
                      <Textarea
                        id="facilities"
                        value={schoolForm.facilities}
                        onChange={(e) => setSchoolForm({...schoolForm, facilities: e.target.value})}
                        placeholder="List school facilities"
                        rows={4}
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="infrastructure">Infrastructure (one per line)</Label>
                      <Textarea
                        id="infrastructure"
                        value={schoolForm.infrastructure}
                        onChange={(e) => setSchoolForm({...schoolForm, infrastructure: e.target.value})}
                        placeholder="List infrastructure details"
                        rows={4}
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="extracurriculars">Extracurriculars (one per line)</Label>
                      <Textarea
                        id="extracurriculars"
                        value={schoolForm.extracurriculars}
                        onChange={(e) => setSchoolForm({...schoolForm, extracurriculars: e.target.value})}
                        placeholder="List extracurricular activities"
                        rows={4}
                        disabled={!editMode}
                      />
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateSchoolMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateSchoolMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Culture Content Editor */}
        <TabsContent value="culture">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Cultural Program Content Management
                </div>
                <Select value={selectedCategory?.toString()} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {cultureCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentCategory && (
                <form onSubmit={handleCultureSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="aboutSection">About This Program</Label>
                        <Textarea
                          id="aboutSection"
                          value={cultureForm.aboutSection}
                          onChange={(e) => setCultureForm({...cultureForm, aboutSection: e.target.value})}
                          placeholder="Detailed description of the cultural program"
                          rows={4}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="objectives">Program Objectives (one per line)</Label>
                        <Textarea
                          id="objectives"
                          value={cultureForm.objectives}
                          onChange={(e) => setCultureForm({...cultureForm, objectives: e.target.value})}
                          placeholder="List program objectives"
                          rows={4}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="activities">Activities Offered (one per line)</Label>
                        <Textarea
                          id="activities"
                          value={cultureForm.activities}
                          onChange={(e) => setCultureForm({...cultureForm, activities: e.target.value})}
                          placeholder="List activities offered"
                          rows={4}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="instructorInfo">Instructor Information</Label>
                        <Textarea
                          id="instructorInfo"
                          value={cultureForm.instructorInfo}
                          onChange={(e) => setCultureForm({...cultureForm, instructorInfo: e.target.value})}
                          placeholder="Information about instructors"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="scheduleInfo">Schedule Information</Label>
                        <Textarea
                          id="scheduleInfo"
                          value={cultureForm.scheduleInfo}
                          onChange={(e) => setCultureForm({...cultureForm, scheduleInfo: e.target.value})}
                          placeholder="Program schedule details"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="requirements">Requirements</Label>
                        <Textarea
                          id="requirements"
                          value={cultureForm.requirements}
                          onChange={(e) => setCultureForm({...cultureForm, requirements: e.target.value})}
                          placeholder="Prerequisites or requirements"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="history">Program History</Label>
                        <Textarea
                          id="history"
                          value={cultureForm.history}
                          onChange={(e) => setCultureForm({...cultureForm, history: e.target.value})}
                          placeholder="History of the cultural program"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="philosophy">Teaching Philosophy</Label>
                        <Textarea
                          id="philosophy"
                          value={cultureForm.philosophy}
                          onChange={(e) => setCultureForm({...cultureForm, philosophy: e.target.value})}
                          placeholder="Teaching philosophy and approach"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="youtubeChannelUrl">YouTube Channel URL</Label>
                        <Input
                          id="youtubeChannelUrl"
                          type="url"
                          value={cultureForm.youtubeChannelUrl}
                          onChange={(e) => setCultureForm({...cultureForm, youtubeChannelUrl: e.target.value})}
                          placeholder="https://youtube.com/channel/..."
                          disabled={!editMode}
                        />
                      </div>

                      <div>
                        <Label htmlFor="achievements">Achievements (one per line)</Label>
                        <Textarea
                          id="achievements"
                          value={cultureForm.achievements}
                          onChange={(e) => setCultureForm({...cultureForm, achievements: e.target.value})}
                          placeholder="List program achievements"
                          rows={3}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateCultureMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateCultureMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <PlatformSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}