import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Youtube, ExternalLink, Play } from "lucide-react";
import { Link } from "wouter";

export default function Dance() {
  const { data: category, isLoading } = useQuery({
    queryKey: ["/api/culture-categories"],
    select: (categories: any[]) => categories.find(cat => cat.name === 'dance-drama-poems'),
  });

  const dancePrograms = category?.programs?.filter((program: any) => program.type === 'dance') || [];
  const danceMedia = category?.mediaFiles?.filter((media: any) => 
    media.tags?.includes('bihu') || media.tags?.includes('dance') || media.tags?.includes('traditional')
  ) || [];

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
              <div className="p-4 bg-pink-100 dark:bg-pink-900 rounded-full">
                <Heart className="w-12 h-12 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-4">
              Traditional Dance Programs
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Celebrate the rich heritage of Assamese dance forms including Bihu, Sattriya, and folk dances
              that express joy, devotion, and the revolutionary spirit of our culture.
            </p>
          </div>
        </div>

        {/* Dance Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-pink-600 dark:text-pink-400">About Our Dance Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our dance programs celebrate the vibrant traditions of Assamese culture through movement and music. 
              Students learn classical forms like Sattriya, the joyful Bihu dance, and various folk dances that 
              tell stories of harvest, love, and community life. These programs preserve our cultural heritage 
              while fostering physical fitness, artistic expression, and cultural pride among participants.
            </p>
          </CardContent>
        </Card>

        {/* YouTube Channel Link */}
        {category?.youtubeChannelUrl && (
          <Card className="mb-8 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
                <Youtube className="w-6 h-6 mr-2" />
                Dance Performances Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Watch our beautiful dance performances and learn traditional Assamese dance forms through our video tutorials.
              </p>
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <a href={category.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-4 h-4 mr-2" />
                  Watch Dance Videos
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dance Performances Gallery */}
        {danceMedia.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-pink-600 dark:text-pink-400">Dance Performances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {danceMedia.map((media: any, index: number) => (
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
                    ) : (
                      <div className="relative group">
                        <img
                          src={media.url}
                          alt={media.caption || `Dance ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-12 h-12 text-white" />
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
                        <p className="text-sm text-pink-600 dark:text-pink-400 mb-2">
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

        {/* Dance Programs */}
        {dancePrograms.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-pink-600 dark:text-pink-400">Our Dance Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dancePrograms.map((program: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                        <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {program.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {program.description}
                        </p>
                        {program.instructor && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                            <strong>Instructor:</strong> {program.instructor}
                          </p>
                        )}
                        {program.schedule && (
                          <p className="text-sm text-pink-600 dark:text-pink-400 mb-2">
                            <strong>Classes:</strong> {program.schedule}
                          </p>
                        )}
                        {program.nextShow && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            <strong>Next Performance:</strong> {program.nextShow}
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

        {/* Dance Types Section */}
        <Card className="mb-8 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-950 dark:to-red-950 border-pink-200 dark:border-pink-800">
          <CardHeader>
            <CardTitle className="text-pink-600 dark:text-pink-400">Traditional Dance Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold mb-2">Bihu Dance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Joyful harvest dance celebrating Assamese New Year with vibrant movements
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold mb-2">Sattriya Dance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Classical dance form expressing devotion and spiritual stories
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Folk Dances</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Regional folk dances celebrating community life and traditions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-pink-600 to-red-600 text-white">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Join Our Dance Community</h2>
            <p className="text-lg mb-6">
              Express your cultural identity through the beautiful art of traditional Assamese dance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Start Dancing
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-pink-600">
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