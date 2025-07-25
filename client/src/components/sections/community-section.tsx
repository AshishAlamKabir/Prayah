import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Calendar, ArrowRight, Image } from "lucide-react";
import { Link } from "wouter";

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorEmail: string;
  mediaFiles: string[];
  tags: string[];
  status: string;
  createdAt: string;
}

const categories = [
  { value: "education", label: "Education & Learning" },
  { value: "culture", label: "Arts & Culture" },
  { value: "community", label: "Community Events" },
  { value: "achievement", label: "Achievements" },
  { value: "news", label: "News & Updates" },
  { value: "other", label: "Other" }
];

export default function CommunitySection() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/community-posts", "approved"],
    queryFn: () => fetch("/api/community-posts?status=approved").then(res => res.json())
  });

  const recentPosts = posts.slice(0, 3);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "education": return <FileText className="w-4 h-4" />;
      case "culture": return <FileText className="w-4 h-4" />;
      case "community": return <Users className="w-4 h-4" />;
      case "achievement": return <FileText className="w-4 h-4" />;
      case "news": return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Community Highlights</h2>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Community Space</h2>
            <p className="text-xl text-gray-600 mb-8">
              A place for our community to share achievements, ideas, and contributions
            </p>
            <Link href="/community">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Users className="w-4 h-4 mr-2" />
                Join the Community
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Community Highlights</h2>
          <p className="text-xl text-gray-600 mb-8">
            Recent contributions from our community members
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {recentPosts.map((post: CommunityPost) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(post.category)}
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.value === post.category)?.label || post.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                <p className="text-sm text-gray-600">
                  By {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 text-sm line-clamp-3 mb-3">
                  {post.content}
                </p>
                
                {post.mediaFiles && post.mediaFiles.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Image className="w-3 h-3" />
                    {post.mediaFiles.length} media file{post.mediaFiles.length > 1 ? 's' : ''}
                  </div>
                )}
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{post.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/community">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              View All Community Posts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}