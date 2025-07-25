import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section className="bg-red-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Prayas Study Circle Platform
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Empowering education, culture, and community development through digital learning and collaboration
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 px-8 py-4 text-lg font-semibold"
            onClick={() => {
              document.getElementById('community-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Submit Community Post
          </Button>
          <Link href="/schools">
            <Button 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
            >
              Explore Platform
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
