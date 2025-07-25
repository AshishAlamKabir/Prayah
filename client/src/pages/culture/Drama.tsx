import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Theater, Youtube, ExternalLink, Play, Users } from "lucide-react";
import { Link } from "wouter";

export default function Drama() {
  const { data: category, isLoading } = useQuery({
    queryKey: ["/api/culture-categories"],
    select: (categories: any[]) => categories.find(cat => cat.name === 'dance-drama-poems'),
  });

  const dramaPrograms = category?.programs?.filter((program: any) => program.type === 'drama') || [];
  const dramaMedia = category?.mediaFiles?.filter((media: any) => 
    media.tags?.includes('drama') || media.tags?.includes('theater') || media.tags?.includes('social-justice')
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
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Theater className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-4">
              Revolutionary Theater
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience powerful theatrical performances that address social issues, celebrate heroic struggles,
              and inspire audiences to become agents of positive change in their communities.
            </p>
          </div>
        </div>

        {/* Drama Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-purple-600 dark:text-purple-400">About Our Drama Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our drama programs combine traditional Assamese theatrical forms with contemporary social themes. 
              Students participate in creating and performing plays that tackle issues like inequality, environmental 
              conservation, and community empowerment. Through dramatic expression, participants develop confidence, 
              critical thinking skills, and a deeper understanding of social justice while entertaining and educating audiences.
            </p>
          </CardContent>
        </Card>

        {/* YouTube Channel Link */}
        {category?.youtubeChannelUrl && (
          <Card className="mb-8 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
                <Youtube className="w-6 h-6 mr-2" />
                Drama Performances Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Watch our thought-provoking drama performances and behind-the-scenes content from our theater productions.
              </p>
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <a href={category.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-4 h-4 mr-2" />
                  Watch Drama Performances
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Drama Performances Gallery */}
        {dramaMedia.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-purple-600 dark:text-purple-400">Featured Productions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dramaMedia.map((media: any, index: number) => (
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
                          alt={media.caption || `Drama ${index + 1}`}
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
                        <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                          Cast: {media.performer}
                        </p>
                      )}
                      {media.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {media.description}
                        </p>
                      )}
                      {media.date && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                          Performed: {new Date(media.date).toLocaleDateString()}
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

        {/* Drama Programs */}
        {dramaPrograms.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-purple-600 dark:text-purple-400">Our Drama Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dramaPrograms.map((program: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Theater className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                            <strong>Director:</strong> {program.instructor}
                          </p>
                        )}
                        {program.schedule && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                            <strong>Rehearsals:</strong> {program.schedule}
                          </p>
                        )}
                        {program.nextShow && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            <strong>Next Show:</strong> {program.nextShow}
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

        {/* Drama Themes Section */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-purple-600 dark:text-purple-400">Our Theater Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Social Justice</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Plays addressing inequality, human rights, and community empowerment
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Theater className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold mb-2">Historical Heroes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stories of freedom fighters and revolutionary leaders
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Theater className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Contemporary Issues</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Modern challenges and solutions in community development
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Productions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-purple-600 dark:text-purple-400">Upcoming Productions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-lg">Freedom Fighters - March 2025</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  A powerful drama celebrating the untold stories of local heroes who fought for independence
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                  Auditions open - Contact our drama director for details
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-lg">Voices of the Earth - April 2025</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Environmental drama focusing on climate change and community action
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Community participation welcome
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Join Our Theater Revolution</h2>
            <p className="text-lg mb-6">
              Use the power of drama to tell important stories and inspire social change in your community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Join Our Cast
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