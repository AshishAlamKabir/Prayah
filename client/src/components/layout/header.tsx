import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Crown, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import prayasLogo from "@assets/WhatsApp Image 2025-07-24 at 14.36.01_4d13e1cd_1753348314691.jpg";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isSubscribed, logout } = useAuth();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Schools", href: "/schools" },
    { name: "Art & Culture", href: "/culture" },
    { name: "Books", href: "/books" },
    { name: "Store", href: "/store" },
    ...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <header className="bg-red-800 text-white shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={prayasLogo} 
                alt="Prayas Logo" 
                className="h-10 w-10 object-contain rounded-sm"
              />
              <h1 className="text-2xl font-bold">প্রয়াস</h1>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span 
                  className={`hover:text-gray-200 transition-colors cursor-pointer ${
                    isActive(item.href) ? "text-yellow-300 font-semibold" : ""
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:bg-red-700 hidden sm:block">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-green-600 hover:bg-green-700 hidden sm:block">
                    Join Us
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {isSubscribed && (
                  <Crown className="w-5 h-5 text-yellow-400" />
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-red-700 p-2">
                      <User className="w-5 h-5" />
                      <span className="ml-2 hidden sm:inline">
                        {user?.firstName || user?.username}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled>
                      <User className="w-4 h-4 mr-2" />
                      {user?.email}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-red-800 text-white border-red-700">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <span 
                        className={`block py-2 px-4 rounded-lg hover:bg-red-700 transition-colors cursor-pointer ${
                          isActive(item.href) ? "bg-red-700 text-yellow-300 font-semibold" : ""
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </span>
                    </Link>
                  ))}
                  <Button className="bg-green-600 hover:bg-green-700 mt-4" onClick={() => setIsOpen(false)}>
                    Join Movement
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
