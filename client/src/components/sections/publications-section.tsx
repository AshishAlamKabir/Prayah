import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Calendar, User, Eye } from "lucide-react";
import { Link } from "wouter";
import type { PublishedWork } from "@shared/schema";

export default function PublicationsSection() {
  const { data: publications, isLoading } = useQuery<PublishedWork[]>({
    queryKey: ["/api/published-works"],
  });

  // Filter only approved publications
  const approvedPublications = publications?.filter((pub) => pub.status === "approved") || [];

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (approvedPublications.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Publications Available</h3>
        <p className="text-gray-600">
          Approved publications will appear here once they are reviewed and published.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {approvedPublications.map((publication) => (
          <Card key={publication.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 leading-tight">
                    {publication.title}
                  </CardTitle>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4 mr-1" />
                    <span>{publication.author}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {publication.type}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-gray-700 mb-4 line-clamp-3 text-sm leading-relaxed">
                {publication.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {publication.createdAt ? new Date(publication.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {publication.downloadCount !== undefined && (
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    <span>{publication.downloadCount} downloads</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {publication.pdfUrl && (
                  <Button size="sm" className="flex-1" asChild>
                    <a 
                      href={publication.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => {
                        // Increment download count
                        fetch(`/api/published-works/${publication.id}/download`, {
                          method: 'POST'
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href={`/publications/${publication.id}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {approvedPublications.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/publications">
              View All Publications
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}