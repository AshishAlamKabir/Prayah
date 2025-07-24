import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music as MusicIcon, Play, Youtube, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Music() {
  const { data: musicCategory, isLoading } = useQuery({
    queryKey: ["/api/culture-categories"],
    select: (categories: any[]) => categories.find(cat => cat.name === 'music'),
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
              <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
                <MusicIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">
              Music Programs
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore our revolutionary music programs that blend traditional folk music with modern expression,
              creating harmonies that inspire social change and cultural unity.
            </p>
          </div>
        </div>

        {musicCategory && (
          <>
            {/* Detailed Description */}
            {musicCategory.detailedDescription && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">About Our Music Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {musicCategory.detailedDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* YouTube Channel Link */}
            {musicCategory.youtubeChannelUrl && (
              <Card className="mb-8 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
                    <Youtube className="w-6 h-6 mr-2" />
                    Our Music Channel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Watch our latest musical performances, learn traditional songs, and discover the revolutionary spirit in music.
                  </p>
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <a href={musicCategory.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
                      <Youtube className="w-4 h-4 mr-2" />
                      Visit YouTube Channel
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Media Gallery */}
            {musicCategory.mediaFiles && musicCategory.mediaFiles.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Musical Performances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {musicCategory.mediaFiles.map((media: any, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        {media.type === 'image' ? (
                          <div className="relative">
                            <img
                              src={media.url}
                              alt={media.caption || `Music ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        ) : media.type === 'video' ? (
                          <video
                            src={media.url}
                            controls
                            className="w-full h-48 object-cover"
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 flex items-center justify-center">
                            <div className="text-center">
                              <MusicIcon className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-2" />
                              <p className="text-red-600 dark:text-red-400 font-medium">Audio Track</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4">
                          {media.caption && (
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {media.caption}
                            </h3>
                          )}
                          {media.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {media.description}
                            </p>
                          )}
                          {media.type === 'audio' && (
                            <audio controls className="w-full">
                              <source src={media.url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {media.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {media.tags.map((tag: string, tagIndex: number) => (
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

            {/* Programs */}
            {musicCategory.programs && musicCategory.programs.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Our Music Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {musicCategory.programs.map((program: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {program.name || `Program ${index + 1}`}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {program.description || "A revolutionary music program designed to inspire change through melody and rhythm."}
                        </p>
                        {program.schedule && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            <strong>Schedule:</strong> {program.schedule}
                          </p>
                        )}
                        {program.instructor && (
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            <strong>Instructor:</strong> {program.instructor}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-red-600 to-green-600 text-white">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Join Our Musical Revolution</h2>
            <p className="text-lg mb-6">
              Be part of a community that uses music as a tool for social change and cultural expression.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Get Involved
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-red-600">
                  Contact Us
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}