import HeroSection from "@/components/sections/hero-section";
import StatsSection from "@/components/sections/stats-section";
import FeaturesSection from "@/components/sections/features-section";
import PublicationsSection from "@/components/sections/publications-section";
import CommunitySection from "@/components/sections/community-section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, GraduationCap, Palette, Users } from "lucide-react";
import { Link } from "wouter";
import type { School, Book as BookType, CultureCategory } from "@shared/schema";
import bokaghatLogo from "@assets/bokaghat_logo_optimized.jpg";
import brahmaputraLogo from "@assets/brahmaputra_logo_optimized.jpg";
import mohuramukhtLogo from "@assets/mohuramukh_logo_optimized.jpg";

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
      <CommunitySection />
      
      {/* About Prayas Section */}
      <section className="logo-red-bg text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">About Prayas Study Circle</h2>
            <div className="text-left max-w-3xl mx-auto space-y-6">
              <p className="text-lg leading-relaxed">
                Prayas is a dedicated study circle committed to fostering education, cultural preservation, and community development 
                across Assam. Our mission is to create a network of educational institutions and cultural programs that empower 
                individuals through knowledge, skill development, and cultural awareness.
              </p>
              <p className="text-lg leading-relaxed">
                We believe in the transformative power of education and the importance of preserving our rich cultural heritage 
                while adapting to modern challenges. Through our schools, cultural programs, and educational resources, we strive 
                to build stronger, more informed communities.
              </p>
              
              <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4">Our Goals & Objectives</h3>
                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3">•</span>
                    Establish and support quality educational institutions in rural and urban areas
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3">•</span>
                    Preserve and promote Assamese culture through arts, music, drama, and literature
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3">•</span>
                    Provide accessible educational resources and books to communities
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3">•</span>
                    Foster critical thinking and social awareness among students and community members
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3">•</span>
                    Create platforms for knowledge sharing and community collaboration
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approved Publications Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Publications</h2>
            <p className="text-xl text-gray-600">
              Educational resources and research materials approved by our study circle
            </p>
          </div>
          
          <PublicationsSection />
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
              featuredSchools.map((school) => {
                const getSchoolLogo = (schoolName: string) => {
                  if (schoolName.includes('বকাঘাট') || schoolName.includes('Bokaghat')) return bokaghatLogo;
                  if (schoolName.includes('ব্রহ্মপুত্র') || schoolName.includes('Brahmaputra')) return brahmaputraLogo;
                  if (schoolName.includes('মহুরামুখ') || schoolName.includes('Mohuramukh')) return mohuramukhtLogo;
                  return bokaghatLogo; // default fallback
                };

                return (
                  <Card key={school.id} className="revolutionary-card bg-gray-50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center p-4">
                      <img 
                        src={getSchoolLogo(school.name)} 
                        alt={`${school.name} Logo`}
                        className="max-h-24 max-w-24 object-contain"
                        loading="lazy"
                        style={{ 
                          maxWidth: '96px', 
                          maxHeight: '96px',
                          width: 'auto',
                          height: 'auto'
                        }}
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{school.name}</h3>
                      <p className="text-gray-600 mb-3">{school.location}</p>
                      <p className="text-gray-700 mb-4">{school.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-logo-red font-medium">{school.studentCount} Students</span>
                        <Link href={`/schools/${school.id}`}>
                          <Button className="prayas-green-bg hover:bg-green-700">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/schools">
              <Button size="lg" className="logo-red-bg hover:bg-red-700 text-white px-8 py-4">
                View All Schools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Culture Programs */}
      <section className="logo-red-bg text-white py-20">
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
                  <div className="text-logo-red text-3xl mb-4">
                    <Palette className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{program.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  <Link href="/culture">
                    <Button className="prayas-green-bg hover:bg-green-700 text-white w-full">
                      Learn More
                    </Button>
                  </Link>
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
                    <p className="text-gray-600 text-sm mb-3">
                      by {book.author}
                      {book.editor && <span className="text-gray-500"> • edited by {book.editor}</span>}
                    </p>
                    <p className="text-gray-700 text-sm mb-4">{book.description}</p>
                    <div className="flex gap-2">
                      <Link href={`/books/${book.id}`} className="flex-1">
                        <Button className="prayas-green-bg hover:bg-green-700 text-white w-full">
                          Buy Book
                        </Button>
                      </Link>
                      {book.pdfUrl && (
                        <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-prayas-green text-prayas-green hover:prayas-green-bg hover:text-white">
                            Free PDF
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/books">
              <Button size="lg" className="logo-red-bg hover:bg-red-700 text-white px-8 py-4">
                Browse Full Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
