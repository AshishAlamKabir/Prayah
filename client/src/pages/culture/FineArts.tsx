import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Eye, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import fineArtsLogo from "@assets/fine arts logo_1753444165685.jpg";

export default function FineArts() {
  const { data: fineArtsCategory, isLoading } = useQuery({
    queryKey: ["/api/culture-categories"],
    select: (categories: any[]) => categories.find(cat => cat.name === 'fine-arts'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 dark:from-red-950 dark:to-green-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/culture">
            <Button variant="ghost" className="mb-4">← Back to Culture</Button>
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-full shadow-lg">
                <img 
                  src={fineArtsLogo} 
                  alt="Fine Arts Logo"
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
              Fine Arts Programs
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover our revolutionary fine arts programs where creativity meets activism,
              using visual expression to communicate powerful messages of social change and cultural identity.
            </p>
          </div>
        </div>

        {fineArtsCategory && (
          <>
            {/* Detailed Description */}
            {fineArtsCategory.detailedDescription && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400">About Our Fine Arts Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {fineArtsCategory.detailedDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Art Gallery */}
            {fineArtsCategory.mediaFiles && fineArtsCategory.mediaFiles.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Art Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fineArtsCategory.mediaFiles.map((artwork: any, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="relative group">
                          <img
                            src={artwork.url}
                            alt={artwork.caption || `Artwork ${index + 1}`}
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                        </div>
                        
                        <div className="p-4">
                          {artwork.caption && (
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                              {artwork.caption}
                            </h3>
                          )}
                          {artwork.artist && (
                            <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                              by {artwork.artist}
                            </p>
                          )}
                          {artwork.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {artwork.description}
                            </p>
                          )}
                          {artwork.medium && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                              Medium: {artwork.medium}
                            </p>
                          )}
                          {artwork.tags && (
                            <div className="flex flex-wrap gap-1">
                              {artwork.tags.map((tag: string, tagIndex: number) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Programs and Workshops */}
            {fineArtsCategory.programs && fineArtsCategory.programs.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400">Art Programs & Workshops</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fineArtsCategory.programs.map((program: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Palette className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                              {program.name || `Art Program ${index + 1}`}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {program.description || "An innovative art program that combines traditional techniques with revolutionary themes."}
                            </p>
                            {program.instructor && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                                <strong>Instructor:</strong> {program.instructor}
                              </p>
                            )}
                            {program.schedule && (
                              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                                <strong>Schedule:</strong> {program.schedule}
                              </p>
                            )}
                            {program.materials && (
                              <p className="text-sm text-purple-600 dark:text-purple-400">
                                <strong>Materials:</strong> {program.materials}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Artists */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">Featured Revolutionary Artists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Palette className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Community Artists</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Local artists creating powerful visual narratives for social change
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Eye className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Student Exhibitions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showcasing the creative work of our student artists
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <ExternalLink className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Collaborative Works</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Art projects that bring communities together
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-red-600 text-white">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Express Your Revolutionary Spirit</h2>
            <p className="text-lg mb-6">
              Join our fine arts community and use your creativity to make a difference in the world.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Start Creating
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-green-600">
                  Learn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}