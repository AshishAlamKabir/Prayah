import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, GraduationCap } from "lucide-react";
import type { School } from "@shared/schema";

export default function StatsSection() {
  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Schools Directory</h2>
          <p className="text-lg text-gray-600">Educational institutions committed to transformative learning</p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="p-6">
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full mb-4 rounded-lg" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools?.map((school) => (
              <Card key={school.id} className="group hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-red-200">
                <CardContent className="p-6">
                  {school.imageUrl && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img 
                        src={school.imageUrl} 
                        alt={school.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                    {school.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm">{school.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <Users className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm">{school.studentCount} Students</span>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                    {school.description}
                  </p>
                  
                  {school.programs && school.programs.length > 0 && (
                    <div className="flex items-center text-gray-600">
                      <GraduationCap className="h-4 w-4 mr-2 text-red-500" />
                      <span className="text-sm">{school.programs.slice(0, 2).join(", ")}</span>
                      {school.programs.length > 2 && (
                        <span className="text-sm text-gray-500"> +{school.programs.length - 2} more</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
