import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, MapPin, Users, Search, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import type { School } from "@shared/schema";
import mohuramukh_logo from "@assets/mohuramukh_logo_optimized.jpg";
import brahmaputra_logo from "@assets/brahmaputra_logo_optimized.jpg";

// Component to show fee payment button only if enabled
function FeePaymentButton({ schoolId }: { schoolId: number }) {
  const { data: paymentStatus, isLoading } = useQuery<{
    feePaymentEnabled: boolean;
    paymentMethods: string[];
    adminApprovalRequired: boolean;
  }>({
    queryKey: ["/api/schools", schoolId, "payment-status"],
    staleTime: 0, // Always fetch fresh data for payment status
  });

  // Show loading state briefly
  if (isLoading) {
    return (
      <Button disabled variant="outline" className="w-full border-gray-300 text-gray-400">
        <CreditCard className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // Hide button completely if payment is disabled
  if (!paymentStatus?.feePaymentEnabled) {
    return null;
  }

  return (
    <Link href={`/schools/${schoolId}/fee-payment`}>
      <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
        <CreditCard className="h-4 w-4 mr-2" />
        Pay School Fee
      </Button>
    </Link>
  );
}

export default function Schools() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const getSchoolLogo = (schoolName: string) => {
    if (schoolName.includes('ব্ৰহ্মপুত্ৰ') || schoolName.includes('Brahmaputra')) return brahmaputra_logo;
    if (schoolName.includes('মহুৰামুখ') || schoolName.includes('Mohuramukh')) return mohuramukh_logo;
    return brahmaputra_logo; // default fallback
  };

  const filteredSchools = schools?.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Schools Directory
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Educational institutions committed to quality learning and community development
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search schools by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full text-lg border-2 border-gray-300 focus:border-red-800 focus:ring-red-800"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Schools Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="revolutionary-card overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-16 w-full mb-4" />
                    <Skeleton className="h-4 w-20 mb-4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No schools found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No schools match your search for "${searchTerm}"`
                  : "No schools are currently available in the directory"
                }
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchTerm ? `Search Results (${filteredSchools.length})` : `All Schools (${filteredSchools.length})`}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSchools.map((school) => (
                  <Card key={school.id} className="revolutionary-card bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
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
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{school.location}</span>
                      </div>
                      <p className="text-gray-700 mb-4 line-clamp-3">{school.description}</p>
                      
                      {school.programs && school.programs.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">Programs:</p>
                          <div className="flex flex-wrap gap-1">
                            {school.programs.slice(0, 3).map((program, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {program}
                              </span>
                            ))}
                            {school.programs.length > 3 && (
                              <span className="text-xs text-gray-500">+{school.programs.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-red-800 font-medium">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm">{school.studentCount || 0} Students</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Link href={`/schools/${school.id}`}>
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            View Details
                          </Button>
                        </Link>
                        <FeePaymentButton schoolId={school.id} />
                      </div>
                      
                      {(school.contactEmail || school.contactPhone || school.website) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-1">
                            {school.contactEmail && (
                              <p className="text-xs text-gray-600">Email: {school.contactEmail}</p>
                            )}
                            {school.contactPhone && (
                              <p className="text-xs text-gray-600">Phone: {school.contactPhone}</p>
                            )}
                            {school.website && (
                              <p className="text-xs text-gray-600">Website: {school.website}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
