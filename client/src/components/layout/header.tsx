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
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSubscribed = user?.isSubscribed || false;

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Schools", href: "/schools" },
    { name: "Art & Culture", href: "/culture" },
    { name: "Community", href: "/community" },
    { name: "Store", href: "/store" },
    { name: "Publish Book", href: "/publish" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <header className="bg-red-800 text-white shadow-lg sticky top-0 z-50 border-b border-red-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-5">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={prayasLogo} 
                alt="Prayas Logo" 
                className="h-12 w-12 object-contain rounded-lg shadow-sm"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">প্রয়াস</h1>
                <span className="text-xs md:text-sm text-red-200 font-medium">Study Circle</span>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive(item.href) 
                      ? "bg-red-700 text-yellow-300 shadow-md" 
                      : "hover:bg-red-700/50 hover:text-white"
                  }`}
                >
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <>
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    className="hidden lg:inline-flex text-white hover:bg-red-700 font-medium px-6 py-2 border border-white/20 hover:border-white/40 transition-all"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="hidden lg:inline-flex bg-green-600 hover:bg-green-700 font-medium px-6 py-2 shadow-md hover:shadow-lg transition-all">
                    Register
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {isSubscribed && (
                  <div className="hidden lg:flex items-center bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-400/30">
                    <Crown className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-xs font-medium text-yellow-200">Premium</span>
                  </div>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-red-700 px-4 py-2 hidden lg:flex items-center space-x-2 rounded-lg border border-white/20 hover:border-white/40 transition-all">
                      <User className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {user?.firstName || user?.username}
                        </span>
                        <span className="text-xs text-red-200 capitalize">
                          {user?.role}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled>
                      <User className="w-4 h-4 mr-2" />
                      {user?.email}
                    </DropdownMenuItem>
                    {user?.role === "admin" ? (
                      <DropdownMenuItem asChild>
                        <Link href="/admin-dashboard">
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/user-dashboard">
                          <User className="w-4 h-4 mr-2" />
                          My Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}>
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
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="lg:hidden text-white bg-red-700 border-white/30 hover:bg-red-600 hover:border-white/50 rounded-lg"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-red-800 text-white border-red-700 w-[300px] sm:w-[350px]">
                <div className="flex flex-col space-y-2 mt-8">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-1">প্রয়াস</h2>
                    <p className="text-sm text-red-200">Study Circle</p>
                  </div>
                  
                  {navigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <div 
                        className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive(item.href) 
                            ? "bg-red-700 text-yellow-300 font-semibold border-l-4 border-yellow-300" 
                            : "hover:bg-red-700/50"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="text-base">{item.name}</span>
                      </div>
                    </Link>
                  ))}
                  
                  <div className="border-t border-red-700 pt-6 mt-6">
                    {!isAuthenticated ? (
                      <div className="space-y-3">
                        <Link href="/login">
                          <Button 
                            variant="outline" 
                            className="w-full text-white border-white/50 hover:bg-white hover:text-red-800 font-medium" 
                            onClick={() => setIsOpen(false)}
                          >
                            Login
                          </Button>
                        </Link>
                        <Link href="/register">
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 font-medium shadow-md" 
                            onClick={() => setIsOpen(false)}
                          >
                            Register
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-red-700/50 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <User className="w-5 h-5 mr-2" />
                            {isSubscribed && <Crown className="w-4 h-4 text-yellow-400 ml-1" />}
                          </div>
                          <p className="font-semibold text-lg">{user?.firstName || user?.username}</p>
                          <p className="text-sm text-red-200 capitalize">{user?.role}</p>
                          {isSubscribed && (
                            <span className="inline-block bg-yellow-500/20 text-yellow-200 text-xs px-2 py-1 rounded-full mt-1">
                              Premium Member
                            </span>
                          )}
                        </div>
                        
                        {user?.role === "admin" ? (
                          <Link href="/admin-dashboard">
                            <Button 
                              variant="outline" 
                              className="w-full text-white border-white/50 hover:bg-white hover:text-red-800 font-medium" 
                              onClick={() => setIsOpen(false)}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Admin Dashboard
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/user-dashboard">
                            <Button 
                              variant="outline" 
                              className="w-full text-white border-white/50 hover:bg-white hover:text-red-800 font-medium" 
                              onClick={() => setIsOpen(false)}
                            >
                              <User className="w-4 h-4 mr-2" />
                              My Dashboard
                            </Button>
                          </Link>
                        )}
                        
                        <Button 
                          variant="destructive" 
                          className="w-full font-medium" 
                          onClick={() => {
                            localStorage.removeItem("auth_token");
                            localStorage.removeItem("user");
                            window.location.href = "/";
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
