import { Link } from "wouter";
import { Zap, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Footer() {
  const { data: platformSettings } = useQuery({
    queryKey: ["/api/platform-settings"],
  });

  const socialLinks = [
    {
      icon: Facebook,
      url: (platformSettings as any)?.facebook_url,
      name: "Facebook"
    },
    {
      icon: Twitter, 
      url: (platformSettings as any)?.twitter_url,
      name: "Twitter"
    },
    {
      icon: Instagram,
      url: (platformSettings as any)?.instagram_url, 
      name: "Instagram"
    },
    {
      icon: Youtube,
      url: (platformSettings as any)?.youtube_url,
      name: "YouTube"
    }
  ];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-8 w-8 text-red-800" />
              <h3 className="text-xl font-bold">{(platformSettings as any)?.site_title || "Prayas"}</h3>
            </div>
            <p className="text-gray-400 mb-4">
              {(platformSettings as any)?.footer_description || "Revolutionary community organization platform empowering education, culture, and social change through digital unity."}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ icon: Icon, url, name }) => (
                url ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-red-300 transition-colors"
                    aria-label={`Follow us on ${name}`}
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                ) : (
                  <Icon key={name} className="h-6 w-6 text-gray-600 cursor-not-allowed" />
                )
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/schools">
                  <span className="hover:text-white transition-colors cursor-pointer">Schools Directory</span>
                </Link>
              </li>
              <li>
                <Link href="/culture">
                  <span className="hover:text-white transition-colors cursor-pointer">Art & Culture</span>
                </Link>
              </li>
              <li>
                <Link href="/books">
                  <span className="hover:text-white transition-colors cursor-pointer">Books Platform</span>
                </Link>
              </li>
              <li>
                <Link href="/admin">
                  <span className="hover:text-white transition-colors cursor-pointer">Admin Tools</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-gray-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">Submit Posts</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Join Movement</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Guidelines</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Support</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Email: info@prayas.org</li>
              <li>Phone: +91 9876543210</li>
              <li>Address: Revolution Center, Mumbai</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>{(platformSettings as any)?.copyright_text || "&copy; 2024 Prayas Revolutionary Community Organization. All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}
