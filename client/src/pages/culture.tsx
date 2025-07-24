import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, Music, Film, Users, Theater } from "lucide-react";
import type { CultureCategory } from "@shared/schema";

const iconMap = {
  "theater-masks": Theater,
  "music": Music,
  "paint-brush": Palette,
  "film": Film,
  "users": Users,
};

export default function Culture() {
  const { data: categories, isLoading } = useQuery<CultureCategory[]>({
    queryKey: ["/api/culture-categories"],
  });

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Palette;
    return <IconComponent className="h-8 w-8" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Art & Culture Programs
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Revolutionary expression through arts, music, theater, and cultural initiatives
          </p>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="revolutionary-card bg-white p-6">
                  <Skeleton className="h-12 w-12 mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : categories && categories.length === 0 ? (
            <div className="text-center py-16">
              <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No culture programs found</h3>
              <p className="text-gray-600">
                Culture programs will be displayed here once they are added to the platform.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Cultural Initiatives</h2>
                <p className="text-xl text-gray-600">
                  Discover our diverse range of programs promoting revolutionary arts and culture
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {categories?.map((category) => (
                  <Card key={category.id} className="revolutionary-card bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-red-800 text-3xl mb-4">
                      {getIcon(category.icon)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{category.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                    
                    {category.programs && Array.isArray(category.programs) && category.programs.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Programs:</h4>
                        <div className="space-y-1">
                          {(category.programs as any[]).slice(0, 3).map((program, index) => (
                            <p key={index} className="text-xs text-gray-600">• {program.name || program}</p>
                          ))}
                          {(category.programs as any[]).length > 3 && (
                            <p className="text-xs text-gray-500">+{(category.programs as any[]).length - 3} more programs</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                      Learn More
                    </Button>
                  </Card>
                ))}
              </div>

              {/* Featured Programs Section */}
              <section className="mt-20 py-16 bg-white rounded-lg shadow-lg">
                <div className="px-8">
                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Featured Cultural Initiatives</h3>
                    <p className="text-lg text-gray-600">
                      Highlighted programs making significant impact in our community
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-red-50 p-6 rounded-lg">
                      <div className="flex items-center mb-4">
                        <Theater className="h-8 w-8 text-red-800 mr-3" />
                        <h4 className="text-xl font-bold text-gray-900">Community Theater Project</h4>
                      </div>
                      <p className="text-gray-700 mb-4">
                        Our revolutionary theater productions address pressing social issues while celebrating 
                        the struggles and triumphs of working-class communities. Join our monthly performances 
                        and workshops.
                      </p>
                      <Button className="bg-green-600 hover:bg-green-700">
                        Join Theater Group
                      </Button>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center mb-4">
                        <Music className="h-8 w-8 text-green-800 mr-3" />
                        <h4 className="text-xl font-bold text-gray-900">Revolutionary Music Collective</h4>
                      </div>
                      <p className="text-gray-700 mb-4">
                        Preserving folk traditions while creating contemporary revolutionary songs. 
                        Our collective performs at community events and teaches traditional instruments 
                        to new generations.
                      </p>
                      <Button className="bg-green-600 hover:bg-green-700">
                        Join Music Collective
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Call to Action */}
              <div className="text-center mt-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to Start Your Own Cultural Program?</h3>
                <p className="text-lg text-gray-600 mb-6">
                  We support community-led cultural initiatives that promote social justice and revolutionary values.
                </p>
                <Button size="lg" className="bg-red-800 hover:bg-red-900 text-white px-8 py-4">
                  Propose New Program
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
