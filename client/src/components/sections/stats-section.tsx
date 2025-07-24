import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, FileText, Book, Users } from "lucide-react";

export default function StatsSection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const statItems = [
    {
      icon: GraduationCap,
      value: stats?.totalSchools || 0,
      label: "Active Schools",
      color: "text-red-800",
    },
    {
      icon: FileText,
      value: stats?.totalPosts || 0,
      label: "Community Posts", 
      color: "text-red-800",
    },
    {
      icon: Book,
      value: stats?.totalBooks || 0,
      label: "Published Works",
      color: "text-red-800",
    },
    {
      icon: Users,
      value: stats?.totalMembers || 0,
      label: "Active Members",
      color: "text-red-800",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {statItems.map((item, index) => (
            <Card key={index} className="revolutionary-card bg-gray-50 p-6">
              <CardContent className="p-0">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-8 mx-auto mb-2" />
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </>
                ) : (
                  <>
                    <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                    <div className={`text-3xl font-bold mb-2 ${item.color}`}>
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-gray-600">{item.label}</div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
