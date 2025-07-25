import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, Mic, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function Poems() {
  const { data: category, isLoading } = useQuery({
    queryKey: ["/api/culture-categories"],
    select: (categories: any[]) => categories.find(cat => cat.name === 'dance-drama-poems'),
  });

  const poetryPrograms = category?.programs?.filter((program: any) => program.type === 'poetry') || [];
  const poetryMedia = category?.mediaFiles?.filter((media: any) => 
    media.tags?.includes('poetry') || media.tags?.includes('reading') || media.tags?.includes('community')
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
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Revolutionary Poetry
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Express the power of words through spoken and written poetry that captures the spirit of revolution,
              hope, love, and social transformation in the beautiful Assamese language.
            </p>
          </div>
        </div>

        {/* Poetry Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">About Our Poetry Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our poetry programs celebrate the rich literary tradition of Assam while encouraging contemporary 
              expression of revolutionary ideas. Participants learn to craft powerful verses that address social 
              issues, celebrate cultural identity, and inspire community action. Through workshops, open mic nights, 
              and poetry circles, we create spaces where voices can be heard and stories can be shared.
            </p>
          </CardContent>
        </Card>

        {/* Featured Poetry Corner */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400 flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Revolutionary Poetry Corner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Voices of Change</h3>
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300">
                  "শব্দৰ শক্তিয়ে সত্যক জগাই তোলে,<br/>
                  কবিতাৰ ছন্দত বিপ্লৱৰ গান।<br/>
                  আমাৰ কণ্ঠত মিলি যায় হাজাৰ কণ্ঠ,<br/>
                  সামাজিক ন্যায়ৰ বাবে আমাৰ প্ৰাণ।"
                </blockquote>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Through verse and rhythm, we speak truth to power, weaving words that awaken consciousness and inspire action.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Open Mic Nights</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Join our monthly poetry gatherings where community members share original works that celebrate 
                  struggle, hope, and transformation. Every voice matters, every story counts.
                </p>
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  <Mic className="w-4 h-4 mr-2" />
                  Join Next Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Poetry Performances Gallery */}
        {poetryMedia.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400">Poetry Readings & Performances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {poetryMedia.map((media: any, index: number) => (
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
                          alt={media.caption || `Poetry ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <BookOpen className="w-12 h-12 text-white" />
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
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                          Poet: {media.performer}
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

        {/* Poetry Programs */}
        {poetryPrograms.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400">Our Poetry Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {poetryPrograms.map((program: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {program.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {program.description}
                        </p>
                        {program.instructor && (
                          <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                            <strong>Facilitator:</strong> {program.instructor}
                          </p>
                        )}
                        {program.schedule && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                            <strong>Sessions:</strong> {program.schedule}
                          </p>
                        )}
                        {program.nextShow && (
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            <strong>Next Event:</strong> {program.nextShow}
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

        {/* Poetry Themes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">Poetry Themes We Explore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Love & Relationships</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Personal connections and community bonds</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Social Justice</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Equality, rights, and community empowerment</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Nature & Environment</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Celebrating and protecting our natural world</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <BookOpen className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Cultural Heritage</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Preserving traditions and celebrating identity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Upcoming Poetry Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Monthly Open Mic Night</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Share your original poetry with the community in a supportive environment
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Every last Friday of the month • 7:00 PM • Community Hall
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="p-2 bg-green-200 dark:bg-green-800 rounded-full">
                  <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Poetry Workshop Series</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Learn different poetry forms and techniques from experienced poets
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Every Thursday • 7:00-9:00 PM • Library Reading Room
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Community Poetry Contest</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Annual competition celebrating the best revolutionary poetry from our community
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Submissions open March 2025 • Theme: "Voices of Tomorrow"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Share Your Voice Through Poetry</h2>
            <p className="text-lg mb-6">
              Join our community of poets and use the power of words to inspire change and celebrate life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Writing
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  Join Poetry Circle
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}