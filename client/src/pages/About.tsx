import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Palette, Award, Globe, Heart, Target, Star } from "lucide-react";
import { Link } from "wouter";

// Import leader images
import ajantaPhoto from "@assets/Ajanta_Rajkhowa_1754924777601.jpg";
import amarPhoto from "@assets/Amar_kakoty_1754924777602.jpg";
import dilipPhoto from "@assets/Dilip phukan_1754630842171.jpg";
import nijoraPhoto from "@assets/Nijora_borthakur_1754924731273.jpg";
import soneswarPhoto from "@assets/Soneswar_Narah_1754924810787.jpg";

export default function About() {
  const teamMembers = [
    {
      name: "Dilip Phookan",
      role: "Chief Advisor", 
      description: "Strategic leadership and guidance for organizational excellence and vision",
      image: dilipPhoto
    },
    {
      name: "Nijora Borthakur", 
      role: "President",
      description: "Leading the organization with dedication to educational and cultural advancement",
      image: nijoraPhoto
    },
    {
      name: "Amar Kakoty",
      role: "Vice President",
      description: "Supporting organizational initiatives in cultural programs and community development", 
      image: amarPhoto
    },
    {
      name: "Ajanta Rajkhowa",
      role: "Vice President",
      description: "Driving educational excellence and academic innovation across all programs",
      image: ajantaPhoto
    },
    {
      name: "Soneswar Narah",
      role: "Chief Secretary",
      description: "Managing administrative operations and organizational coordination",
      image: soneswarPhoto
    }
  ];

  const achievements = [
    {
      icon: <Users className="h-8 w-8 text-red-600" />,
      title: "3+ Schools",
      description: "Educational institutions serving diverse communities"
    },
    {
      icon: <BookOpen className="h-8 w-8 text-red-600" />,
      title: "500+ Students",
      description: "Young minds empowered through quality education"
    },
    {
      icon: <Palette className="h-8 w-8 text-red-600" />,
      title: "5 Cultural Programs",
      description: "Preserving heritage through music, dance, arts, poetry, and drama"
    },
    {
      icon: <Award className="h-8 w-8 text-red-600" />,
      title: "Community Impact",
      description: "Creating lasting positive change in rural and urban areas"
    }
  ];

  const culturalPrograms = [
    {
      name: "Music",
      description: "Traditional and contemporary musical education preserving regional musical heritage",
      highlights: ["Vocal training", "Instrumental lessons", "Performance opportunities"]
    },
    {
      name: "Fine Arts",
      description: "Visual arts education fostering creativity and artistic expression",
      highlights: ["Painting workshops", "Sculpture classes", "Art exhibitions"]
    },
    {
      name: "Dance",
      description: "Classical and folk dance forms celebrating cultural diversity",
      highlights: ["Traditional choreography", "Performance training", "Cultural festivals"]
    },
    {
      name: "Poetry",
      description: "Literary arts nurturing creative writing and language appreciation",
      highlights: ["Poetry workshops", "Literary competitions", "Publication opportunities"]
    },
    {
      name: "Drama",
      description: "Theater arts developing communication skills and cultural awareness",
      highlights: ["Script writing", "Performance training", "Community theater"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 dark:from-red-950 dark:to-green-950">
      {/* Hero Section */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Prayas Study Circle
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
              A progressive educational and cultural organization dedicated to empowering communities through quality education, artistic expression, and social development initiatives across Northeast India.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="bg-green-600 text-white px-4 py-2 text-sm">
                Educational Excellence
              </Badge>
              <Badge variant="secondary" className="bg-green-600 text-white px-4 py-2 text-sm">
                Cultural Preservation
              </Badge>
              <Badge variant="secondary" className="bg-green-600 text-white px-4 py-2 text-sm">
                Community Development
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-l-4 border-red-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Target className="h-6 w-6" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To provide accessible, quality education and cultural opportunities that empower individuals and strengthen communities. We believe in fostering critical thinking, creative expression, and social responsibility through innovative educational approaches and meaningful community engagement.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Star className="h-6 w-6" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To build a network of educational and cultural institutions that serve as catalysts for positive social change, preserving cultural heritage while embracing progressive values and creating opportunities for all members of society to thrive and contribute meaningfully to their communities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* About Our Organization */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Heart className="h-8 w-8 text-red-600" />
              About Our Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none text-gray-700 dark:text-gray-300">
              <p className="text-lg leading-relaxed mb-4">
                Prayas Study Circle emerged from a deep commitment to educational equity and cultural preservation in Northeast India. Founded with the vision of creating accessible, quality educational opportunities, our organization has grown into a comprehensive platform serving diverse communities across the region.
              </p>
              <p className="leading-relaxed mb-4">
                Our work spans multiple dimensions of community development. Through our network of schools, we provide formal education that combines academic rigor with cultural awareness and social responsibility. Our cultural wing preserves and promotes the rich artistic traditions of the region while encouraging contemporary creative expression.
              </p>
              <p className="leading-relaxed mb-4">
                We believe that education and culture are powerful tools for social transformation. Our programs are designed to nurture critical thinking, creative expression, and community engagement. From early childhood education to adult learning programs, from traditional music preservation to contemporary arts initiatives, we work to create opportunities for lifelong learning and cultural participation.
              </p>
              <p className="leading-relaxed">
                Central to our approach is the recognition that authentic development must come from within communities themselves. We work collaboratively with local leaders, educators, artists, and families to ensure our programs are responsive to community needs and culturally appropriate. This grassroots approach has enabled us to build sustainable programs that continue to serve communities long after initial implementation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-red-600">Our Impact</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {achievement.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cultural Wing */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Palette className="h-8 w-8 text-green-600" />
              Our Cultural Wing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              The cultural wing of Prayas Study Circle serves as a vibrant center for artistic expression and cultural preservation. We offer comprehensive programs in multiple artistic disciplines, providing opportunities for people of all ages to engage with their cultural heritage while developing contemporary artistic skills.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {culturalPrograms.map((program, index) => (
                <Card key={index} className="border-l-4 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">{program.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{program.description}</p>
                    <ul className="space-y-1">
                      {program.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-sm text-gray-500 dark:text-gray-500 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leadership Team */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-8 w-8 text-red-600" />
              Our Leadership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              Our organization is guided by dedicated leaders who bring diverse expertise in education, arts, community development, and organizational management. Our collaborative leadership model ensures that decisions are made with input from all stakeholders.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-24 h-24 xl:w-28 xl:h-28 rounded-full mx-auto object-cover border-4 border-red-100 dark:border-red-800"
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-red-600">{member.name}</h3>
                    <Badge variant="outline" className="mb-4 text-green-600 border-green-600">{member.role}</Badge>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-red-600 to-green-600 text-white">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Be part of our mission to create positive change through education, culture, and community engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/schools">
                <Button size="lg" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                  Explore Our Schools
                </Button>
              </Link>
              <Link href="/culture">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
                  Cultural Programs
                </Button>
              </Link>
              <Link href="/community">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
                  Get Involved
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}