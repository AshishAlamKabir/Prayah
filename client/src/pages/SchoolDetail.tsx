import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Phone, Mail, Globe, Star, Award } from "lucide-react";
import { Link } from "wouter";
import mohuramukh_logo from "@assets/mohura mukh logo_1753439814424.jpg";
import brahmaputra_logo from "@assets/brahmaputra logo_1753439814424.jpg";
import bokaghat_logo from "@assets/b j b logo_1753439981026.jpg";

export default function SchoolDetail() {
  const [match, params] = useRoute("/schools/:id");
  const schoolId = params?.id;

  const { data: school, isLoading } = useQuery({
    queryKey: ["/api/schools", schoolId],
    enabled: !!schoolId,
  });

  const getSchoolLogo = (schoolName: string) => {
    switch (schoolName) {
      case "Mohuramukh Jatiya Vidyalai":
        return mohuramukh_logo;
      case "Brahmaputra Jatiya Vidyalai":
        return brahmaputra_logo;
      case "Bokaghat Jatiya Vidyalai":
        return bokaghat_logo;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">School Not Found</h2>
          <Link href="/schools">
            <Button>Back to Schools</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 dark:from-red-950 dark:to-green-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Link href="/schools">
            <Button variant="ghost" className="mb-4">← Back to Schools</Button>
          </Link>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {school.imageUrl && (
              <div className="h-64 md:h-80 relative">
                <img
                  src={school.imageUrl}
                  alt={school.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                  <div className="p-6 text-white">
                    {getSchoolLogo(school.name) && (
                      <div className="mb-4">
                        <img 
                          src={getSchoolLogo(school.name)!} 
                          alt={`${school.name} logo`}
                          className="h-16 w-16 object-contain bg-white rounded-lg p-2"
                        />
                      </div>
                    )}
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{school.name}</h1>
                    <div className="flex items-center text-lg">
                      <MapPin className="w-5 h-5 mr-2" />
                      {school.location}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!school.imageUrl && (
              <div className="p-6 border-b">
                {getSchoolLogo(school.name) && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={getSchoolLogo(school.name)!} 
                      alt={`${school.name} logo`}
                      className="h-24 w-24 object-contain"
                    />
                  </div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-red-600 dark:text-red-400">
                  {school.name}
                </h1>
                <div className="flex items-center text-lg text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5 mr-2" />
                  {school.location}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">About the School</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {school.detailedDescription || school.description}
                </p>
              </CardContent>
            </Card>

            {/* Media Gallery */}
            {school.mediaFiles && school.mediaFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Media Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {school.mediaFiles.map((media: any, index: number) => (
                      <div key={index} className="rounded-lg overflow-hidden shadow-md">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={media.caption || `Media ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            controls
                            className="w-full h-48 object-cover"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                        {media.caption && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {media.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Programs */}
            {school.programs && school.programs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Academic Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {school.programs.map((program: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {program}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {school.achievements && school.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {school.achievements.map((achievement: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Facilities */}
            {school.facilities && school.facilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Facilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {school.facilities.map((facility: string, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                        {facility}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-3 text-green-600" />
                  <div>
                    <p className="font-medium">Students</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {school.studentCount || 'Not specified'}
                    </p>
                  </div>
                </div>

                {school.contactEmail && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {school.contactEmail}
                      </p>
                    </div>
                  </div>
                )}

                {school.contactPhone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3 text-purple-600" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {school.contactPhone}
                      </p>
                    </div>
                  </div>
                )}

                {school.website && (
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-3 text-indigo-600" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Interested in learning more about {school.name}? Contact them directly.
                </p>
                {school.contactEmail && (
                  <Button className="w-full mb-2" asChild>
                    <a href={`mailto:${school.contactEmail}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                )}
                {school.contactPhone && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${school.contactPhone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}