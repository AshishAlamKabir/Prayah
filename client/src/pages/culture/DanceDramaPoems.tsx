import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drama, Heart, Youtube, ExternalLink, Play } from "lucide-react";
import { Link } from "wouter";

export default function DanceDramaPoems() {
  const { data: category, isLoading } = useQuery({
    queryKey: ["/api/culture-categories"],
    select: (categories: any[]) => categories.find(cat => cat.name === 'dance-drama-poems'),
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
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Drama className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-4">
              Prayas Satriya Nritya Kala Kendra
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Dance academy focusing on traditional Satriya dance and cultural performances.
              Experience the grace and discipline of classical dance forms that preserve our cultural heritage.
            </p>
          </div>
        </div>

        {category && (
          <>
            {/* Detailed Description */}
            {category.detailedDescription && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-purple-600 dark:text-purple-400">About Our Performing Arts Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {category.detailedDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* YouTube Drama Channel */}
            {category.youtubeChannelUrl && (
              <Card className="mb-8 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
                    <Youtube className="w-6 h-6 mr-2" />
                    Drama Channel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Watch our revolutionary drama performances, dance recitals, and poetry readings that inspire change and unite communities.
                  </p>
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <a href={category.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
                      <Youtube className="w-4 h-4 mr-2" />
                      Visit Drama Channel
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Performance Gallery */}
            {category.mediaFiles && category.mediaFiles.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-purple-600 dark:text-purple-400">Featured Performances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.mediaFiles.map((media: any, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        {media.type === 'video' ? (
                          <div className="relative">
                            <video
                              src={media.url}
                              controls
                              className="w-full h-48 object-cover"
                              poster={media.thumbnail}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : media.type === 'image' ? (
                          <div className="relative group">
                            <img
                              src={media.url}
                              alt={media.caption || `Performance ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center">
                            <div className="text-center">
                              <Heart className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                              <p className="text-purple-600 dark:text-purple-400 font-medium">Poetry Reading</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4">
                          {media.caption && (
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                              {media.caption}
                            </h3>
                          )}
                          {media.performer && (
                            <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                              Performed by {media.performer}
                            </p>
                          )}
                          {media.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {media.description}
                            </p>
                          )}
                          {media.date && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                              {new Date(media.date).toLocaleDateString()}
                            </p>
                          )}
                          {media.tags && (
                            <div className="flex flex-wrap gap-1">
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
            {category.programs && category.programs.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-purple-600 dark:text-purple-400">Our Performance Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.programs.map((program: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            {program.type === 'dance' ? (
                              <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <Drama className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                              {program.name || `Performance Program ${index + 1}`}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {program.description || "A dynamic performing arts program that combines traditional and contemporary expressions."}
                            </p>
                            {program.instructor && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                                <strong>Director:</strong> {program.instructor}
                              </p>
                            )}
                            {program.schedule && (
                              <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                                <strong>Rehearsals:</strong> {program.schedule}
                              </p>
                            )}
                            {program.nextShow && (
                              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                                <strong>Next Performance:</strong> {program.nextShow}
                              </p>
                            )}
                            {program.type && (
                              <Badge variant="outline" className="text-xs">
                                {program.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Poetry Section */}
            <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-purple-600 dark:text-purple-400 flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Revolutionary Poetry Corner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Voices of Change</h3>
                    <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-700 dark:text-gray-300">
                      "Through verse and rhythm, we speak truth to power, weaving words that awaken consciousness and inspire action."
                    </blockquote>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Our poetry programs encourage artistic expression that reflects social awareness and cultural identity.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Open Mic Nights</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Join our monthly poetry gatherings where community members share original works that celebrate struggle, hope, and transformation.
                    </p>
                    <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                      Join Next Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-purple-600 to-red-600 text-white">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Take the Stage for Change</h2>
            <p className="text-lg mb-6">
              Use your voice, movement, and passion to tell stories that matter and inspire revolutionary action.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Join Our Troupe
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-purple-600">
                  Audition Info
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}