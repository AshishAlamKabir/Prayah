import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings,
  Globe,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Palette,
  Menu,
  Save,
  MapPin,
  Clock,
  Users,
  BookOpen,
  Award,
  Target
} from "lucide-react";

interface PlatformSettings {
  id: number;
  // Navigation Settings
  primaryMenuItems: string[];
  secondaryMenuItems: string[];
  showLanguageSelector: boolean;
  showSearchBar: boolean;
  
  // Footer Content
  footerDescription: string;
  copyrightText: string;
  footerLinks: { title: string; url: string; }[];
  
  // Contact Information
  organizationName: string;
  address: string;
  phone: string;
  email: string;
  officeHours: string;
  
  // Social Media
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  
  // Theme Settings
  primaryColor: string;
  secondaryColor: string;
  showAnnouncementBar: boolean;
  announcementText: string;
  
  // Platform Features
  enableBookstore: boolean;
  enableCommunityPosts: boolean;
  enablePublications: boolean;
  enableCulturalPrograms: boolean;
  enableFeePayments: boolean;
  
  // SEO & Meta
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  
  updatedAt: string;
}

export default function PlatformSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("navigation");

  // Fetch platform settings
  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/platform-settings"],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<PlatformSettings>) => {
      const response = await apiRequest("PUT", "/api/platform-settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Platform settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update platform settings.",
        variant: "destructive",
      });
    }
  });

  const [formData, setFormData] = useState<Partial<PlatformSettings>>({});

  // Initialize form data when settings load
  useEffect(() => {
    if (settings && Object.keys(formData).length === 0) {
      setFormData(settings);
    }
  }, [settings, formData]);

  const handleSave = (section: keyof PlatformSettings | 'all') => {
    if (section === 'all') {
      updateSettingsMutation.mutate(formData);
    } else {
      const sectionData = { [section]: formData[section] };
      updateSettingsMutation.mutate(sectionData);
    }
  };

  const updateFormData = (field: keyof PlatformSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Settings className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading platform settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>
        <Button 
          onClick={() => handleSave('all')}
          disabled={updateSettingsMutation.isPending}
          className="bg-red-600 hover:bg-red-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        {/* Navigation Settings */}
        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="w-5 h-5" />
                Navigation Menu Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={formData.siteTitle || ''}
                  onChange={(e) => updateFormData('siteTitle', e.target.value)}
                  placeholder="Prayas Education Platform"
                />
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={formData.siteDescription || ''}
                  onChange={(e) => updateFormData('siteDescription', e.target.value)}
                  placeholder="A comprehensive educational platform..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Language Selector</Label>
                    <p className="text-sm text-gray-600">Display language options in header</p>
                  </div>
                  <Switch
                    checked={formData.showLanguageSelector || false}
                    onCheckedChange={(checked) => updateFormData('showLanguageSelector', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Search Bar</Label>
                    <p className="text-sm text-gray-600">Display search functionality</p>
                  </div>
                  <Switch
                    checked={formData.showSearchBar || false}
                    onCheckedChange={(checked) => updateFormData('showSearchBar', checked)}
                  />
                </div>
              </div>

              <div>
                <Label>Platform Features</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {[
                    { key: 'enableBookstore', label: 'Bookstore', icon: BookOpen },
                    { key: 'enableCommunityPosts', label: 'Community Posts', icon: Users },
                    { key: 'enablePublications', label: 'Publications', icon: BookOpen },
                    { key: 'enableCulturalPrograms', label: 'Cultural Programs', icon: Award },
                    { key: 'enableFeePayments', label: 'Fee Payments', icon: Target },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <Label>{label}</Label>
                      </div>
                      <Switch
                        checked={formData[key as keyof PlatformSettings] as boolean || false}
                        onCheckedChange={(checked) => updateFormData(key as keyof PlatformSettings, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Footer Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="footerDescription">Footer Description</Label>
                <Textarea
                  id="footerDescription"
                  value={formData.footerDescription || ''}
                  onChange={(e) => updateFormData('footerDescription', e.target.value)}
                  placeholder="Brief description about your organization..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="copyrightText">Copyright Text</Label>
                <Input
                  id="copyrightText"
                  value={formData.copyrightText || ''}
                  onChange={(e) => updateFormData('copyrightText', e.target.value)}
                  placeholder="© 2025 Prayas Education Platform. All rights reserved."
                />
              </div>

              <div>
                <Label htmlFor="keywords">SEO Keywords</Label>
                <Input
                  id="keywords"
                  value={formData.keywords || ''}
                  onChange={(e) => updateFormData('keywords', e.target.value)}
                  placeholder="education, school, cultural programs, books"
                />
                <p className="text-sm text-gray-600 mt-1">Comma-separated keywords for search engines</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName || ''}
                  onChange={(e) => updateFormData('organizationName', e.target.value)}
                  placeholder="Prayas Education Platform"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="Complete address with postal code"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="info@prayas.edu"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="officeHours">Office Hours</Label>
                <Input
                  id="officeHours"
                  value={formData.officeHours || ''}
                  onChange={(e) => updateFormData('officeHours', e.target.value)}
                  placeholder="Monday - Friday: 9:00 AM - 5:00 PM"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4" />
                    Facebook URL
                  </Label>
                  <Input
                    id="facebookUrl"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => updateFormData('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/prayas"
                  />
                </div>

                <div>
                  <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram URL
                  </Label>
                  <Input
                    id="instagramUrl"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => updateFormData('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/prayas"
                  />
                </div>

                <div>
                  <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
                    <Youtube className="w-4 h-4" />
                    YouTube URL
                  </Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl || ''}
                    onChange={(e) => updateFormData('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/@prayas"
                  />
                </div>

                <div>
                  <Label htmlFor="twitterUrl" className="flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter URL
                  </Label>
                  <Input
                    id="twitterUrl"
                    value={formData.twitterUrl || ''}
                    onChange={(e) => updateFormData('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/prayas"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor || '#dc2626'}
                      onChange={(e) => updateFormData('primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.primaryColor || '#dc2626'}
                      onChange={(e) => updateFormData('primaryColor', e.target.value)}
                      placeholder="#dc2626"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor || '#16a34a'}
                      onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.secondaryColor || '#16a34a'}
                      onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                      placeholder="#16a34a"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Show Announcement Bar</Label>
                  <p className="text-sm text-gray-600">Display announcement at top of site</p>
                </div>
                <Switch
                  checked={formData.showAnnouncementBar || false}
                  onCheckedChange={(checked) => updateFormData('showAnnouncementBar', checked)}
                />
              </div>

              {formData.showAnnouncementBar && (
                <div>
                  <Label htmlFor="announcementText">Announcement Text</Label>
                  <Input
                    id="announcementText"
                    value={formData.announcementText || ''}
                    onChange={(e) => updateFormData('announcementText', e.target.value)}
                    placeholder="Important announcement or notice..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}