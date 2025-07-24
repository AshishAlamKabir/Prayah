import HeroSection from "@/components/sections/hero-section";
import StatsSection from "@/components/sections/stats-section";
import FeaturesSection from "@/components/sections/features-section";
import CommunityPostForm from "@/components/forms/community-post-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, GraduationCap, Palette, Users } from "lucide-react";
import type { School, Book as BookType, CultureCategory } from "@shared/schema";

export default function Home() {
  const { data: schools, isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  const { data: books, isLoading: booksLoading } = useQuery<BookType[]>({
    queryKey: ["/api/books"],
  });

  const { data: cultureCategories, isLoading: cultureLoading } = useQuery<CultureCategory[]>({
    queryKey: ["/api/culture-categories"],
  });

  const featuredSchools = schools?.slice(0, 3) || [];
  const featuredBooks = books?.slice(0, 4) || [];
  const featuredPrograms = cultureCategories?.slice(0, 4) || [];

  return (
    <div className="w-full">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      
      {/* Community Submission Form Section */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Join the Revolutionary Movement</h2>
            <p className="text-xl">Submit your community post and contribute to the collective struggle</p>
          </div>
          <CommunityPostForm />
        </div>
      </section>

      {/* Schools Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Revolutionary Schools Directory</h2>
            <p className="text-xl text-gray-600">Educational institutions committed to transformative learning</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schoolsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="revolutionary-card overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredSchools.map((school) => (
                <Card key={school.id} className="revolutionary-card bg-gray-50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <GraduationCap className="h-16 w-16 text-red-800" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{school.name}</h3>
                    <p className="text-gray-600 mb-3">{school.location}</p>
                    <p className="text-gray-700 mb-4">{school.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-800 font-medium">{school.studentCount} Students</span>
                      <Button className="bg-green-600 hover:bg-green-700">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-red-800 hover:bg-red-900 text-white px-8 py-4">
              View All Schools
            </Button>
          </div>
        </div>
      </section>

      {/* Culture Programs */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Art & Culture Programs</h2>
            <p className="text-xl">Revolutionary expression through arts, music, theater, and cultural initiatives</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cultureLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="revolutionary-card bg-white text-gray-900 p-6">
                  <Skeleton className="h-12 w-12 mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))
            ) : (
              featuredPrograms.map((program) => (
                <Card key={program.id} className="revolutionary-card bg-white text-gray-900 p-6">
                  <div className="text-red-800 text-3xl mb-4">
                    <Palette className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{program.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                    Learn More
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Books Platform */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Revolutionary Literature</h2>
            <p className="text-xl text-gray-600">Access to transformative books, free PDFs, and published works</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {booksLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="revolutionary-card overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredBooks.map((book) => (
                <Card key={book.id} className="revolutionary-card overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <Book className="h-16 w-16 text-amber-800" />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-red-800 text-white text-xs px-2 py-1 rounded-full">{book.category}</span>
                      <span className="text-green-600 font-bold">₹{book.price}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{book.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">by {book.author}</p>
                    <p className="text-gray-700 text-sm mb-4">{book.description}</p>
                    <div className="flex gap-2">
                      <Button className="bg-green-600 hover:bg-green-700 text-white flex-1">
                        Buy Book
                      </Button>
                      <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                        Free PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-red-800 hover:bg-red-900 text-white px-8 py-4">
              Browse Full Catalog
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
