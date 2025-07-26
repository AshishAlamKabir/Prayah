import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Theater, Users, Calendar, Star } from "lucide-react";

export default function Drama() {
  const dramaPrograms = [
    {
      name: "Acting Workshop",
      description: "Basic and advanced acting techniques for stage and performance",
      instructor: "Pradeep Sarkar",
      schedule: "Monday, Wednesday, Friday - 6:00 PM to 8:00 PM",
      level: "All Levels",
      duration: "3 months"
    },
    {
      name: "Script Writing",
      description: "Creative writing for theater and dramatic performances",
      instructor: "Anita Das",
      schedule: "Tuesday, Thursday - 5:00 PM to 7:00 PM",
      level: "Intermediate",
      duration: "2 months"
    },
    {
      name: "Stage Production",
      description: "Complete theater production including direction and management",
      instructor: "Ranjan Ghosh",
      schedule: "Saturday - 2:00 PM to 6:00 PM",
      level: "Advanced",
      duration: "6 months"
    }
  ];

  const upcomingPerformances = [
    {
      title: "Voices of Change",
      description: "A powerful drama addressing social justice and equality",
      date: "March 15, 2025",
      venue: "Community Center Hall"
    },
    {
      title: "Heritage Stories",
      description: "Traditional Bengali folklore brought to life on stage",
      date: "April 20, 2025",
      venue: "Cultural Complex"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 dark:from-red-950 dark:to-green-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/culture">
            <Button variant="ghost" className="mb-4">← Back to Culture</Button>
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Theater className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-4">
              Prayas Natya Bidyalay
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Drama academy focusing on traditional and contemporary theatrical performances.
              Our academy provides comprehensive training in theatrical arts including script reading, acting techniques, and stage performance.
            </p>
          </div>
        </div>

        {/* Programs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
            Our Drama Programs
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dramaPrograms.map((program, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <Theater className="w-6 h-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {program.name}
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {program.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    Instructor: {program.instructor}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    {program.schedule}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Star className="w-4 h-4 mr-2" />
                    Level: {program.level} • Duration: {program.duration}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Performances */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
            Upcoming Performances
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {upcomingPerformances.map((performance, index) => (
              <Card key={index} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {performance.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {performance.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    {performance.date}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Theater className="w-4 h-4 mr-2" />
                    {performance.venue}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* YouTube Channel Section */}
        <div className="text-center">
          <Card className="p-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800">
            <Theater className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Follow Our Drama Journey
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Watch our performances, behind-the-scenes content, and drama workshops on our YouTube channel.
            </p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => window.open('https://youtube.com/@prayasdrama', '_blank')}
            >
              Visit Drama Channel
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}