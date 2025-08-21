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
import dilipPhukan from "@assets/Dilip_phukan_1754924693932.jpg";
import nijoraBot from "@assets/Nijora_borthakur_1754924731273.jpg";
import amarKakoty from "@assets/Amar_kakoty_1754924777602.jpg";
// Note: Some assets may not be available yet
// import ajantaRajkhowa from "@assets/Ajanta_Rajkhowa_1754924777601.jpg";
// import soneswarNarah from "@assets/Soneswar_Narah_1754924810787.jpg";
// import bijuChautal from "@assets/Biju_Chautal_1754925020183.jpg";

export default function Home() {
  const { data: schools, isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  const { data: books, isLoading: booksLoading } = useQuery<BookType[]>({
    queryKey: ["/api/books"],
    staleTime: 0, // Always consider data stale to get fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">About PrayasAdhayanChakra Study Circle</h2>
            <div className="text-left max-w-4xl mx-auto space-y-6">
              <p className="text-lg leading-relaxed">
                PrayasAdhayanChakra (প্ৰয়াস অধ্যয়ন চক্ৰ, PADC) is a non-profit, non-governmental organization 
                founded in 1996 in Bokakhat, Assam. Guided by the constitutional values of equality, justice, 
                and fraternity, PACB works to create an equitable society through education and cultural 
                preservation, particularly focusing on marginalized communities.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Our Journey</h3>
                  <p className="text-lg leading-relaxed mb-4">
                    PADC began as a grassroots study circle serving rural areas around Bokakhat, addressing 
                    the educational needs of economically disadvantaged children. Our early initiatives included 
                    awareness campaigns encouraging students to pursue formal education and textbook distribution 
                    drives for families unable to afford educational materials.
                  </p>
                  <p className="text-lg leading-relaxed">
                    A significant milestone came in 2005 with the establishment of Bokakhat Jatiya Vidyalay, 
                    which has since grown into a network of four schools serving impoverished communities in 
                    remote and riverine areas.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
                  <p className="text-lg leading-relaxed mb-4">
                    PADC is deeply committed to preserving and promoting the languages and cultures of Assam's 
                    diverse communities, with particular attention to those historically marginalized and 
                    discriminated against.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Through our network of educational and cultural institutions, we work to build stronger, 
                    more informed communities that celebrate their heritage while embracing progress.
                  </p>
                </div>
              </div>
              
              <div className="mt-10">
                <h3 className="text-2xl font-semibold mb-6">Current Initiatives</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                    <h4 className="text-xl font-bold mb-3 text-green-400">Educational Network</h4>
                    <p className="text-lg">Four schools affiliated to Assam Jatiya Bidyalay, Guwahati, implementing scientific and evidence-based educational practices</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                    <h4 className="text-xl font-bold mb-3 text-green-400">Cultural Programs</h4>
                    <div className="text-lg space-y-2">
                      <p>• Five programs providing arts and cultural education</p>
                      <p>• A community library and an art gallery</p>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                    <h4 className="text-xl font-bold mb-3 text-green-400">Publications & Literature</h4>
                    <p className="text-lg">An in-house publication and book rally campaign promoting progressive literature and regional writers</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                    <h4 className="text-xl font-bold mb-3 text-green-400">Community Impact</h4>
                    <p className="text-lg">Nearly three decades of service upholding the belief that education is the most powerful instrument for realizing an equal and just society</p>
                  </div>
                </div>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Schools Directory</h2>
            <p className="text-xl text-gray-600">Educational institutions committed to comprehensive learning</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schoolsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="interactive-card overflow-hidden">
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
                  <Card key={school.id} className="interactive-card bg-gray-50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
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
                        <span className="text-sm text-red-800 font-medium">{school.studentCount} Students</span>
                        <Link href={`/schools/${school.id}`}>
                          <Button className="bg-green-600 hover:bg-green-700">
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
              <Button size="lg" className="bg-red-800 hover:bg-red-900 text-white px-8 py-4">
                View All Schools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Culture Programs */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Art & Culture Programs</h2>
            <p className="text-xl">Creative expression through arts, music, theater, and cultural initiatives</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cultureLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="interactive-card bg-white text-gray-900 p-6">
                  <Skeleton className="h-12 w-12 mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))
            ) : (
              featuredPrograms.map((program) => (
                <Card key={program.id} className="interactive-card bg-white text-gray-900 p-6">
                  <div className="text-red-800 text-3xl mb-4">
                    <Palette className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{program.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  <Link href="/culture">
                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Educational Literature</h2>
            <p className="text-xl text-gray-600">Access to educational books, free PDFs, and published works</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {booksLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="interactive-card overflow-hidden">
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
                <Card key={book.id} className="interactive-card overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
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
                        <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                          Buy Book
                        </Button>
                      </Link>
                      {book.pdfUrl && (
                        <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
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
              <Button size="lg" className="bg-red-800 hover:bg-red-900 text-white px-8 py-4">
                Browse Full Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
