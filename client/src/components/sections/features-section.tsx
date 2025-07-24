import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, Palette, Book, Users } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: GraduationCap,
      title: "Schools Directory",
      description: "Comprehensive directory of educational institutions with detailed profiles and programs",
      link: "/schools",
      buttonText: "Explore Schools",
    },
    {
      icon: Palette,
      title: "Art & Culture",
      description: "Showcase of cultural programs, arts initiatives, and community creative expressions",
      link: "/culture",
      buttonText: "View Programs",
    },
    {
      icon: Book,
      title: "Books Platform",
      description: "E-commerce platform for revolutionary literature with free PDF access",
      link: "/books",
      buttonText: "Browse Books",
    },
    {
      icon: Users,
      title: "Community Posts",
      description: "Submit and moderate community content with comprehensive approval workflow",
      link: "/admin",
      buttonText: "Submit Post",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Platform Features</h2>
          <p className="text-xl text-gray-600">Comprehensive tools for revolutionary community organization</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="revolutionary-card bg-white p-8 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="text-red-800 text-4xl mb-4">
                  <feature.icon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <Link href={feature.link}>
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                    {feature.buttonText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
