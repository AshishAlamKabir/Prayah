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
  const isSchoolAdmin = user?.role === 'school_admin';
  const isCultureAdmin = user?.role === 'culture_admin';
  const hasAdminAccess = isAdmin || isSchoolAdmin || isCultureAdmin;
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
    <header className="logo-red-bg text-white shadow-lg sticky top-0 z-50 border-b border-red-600">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-5">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={prayasLogo} 
                alt="Prayas Logo" 
                className="h-12 w-12 object-contain rounded-lg shadow-sm"
              />
              <h1 className="text-2xl md:text-3xl font-bold">প্রয়াস</h1>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span 
                  className={`text-sm font-medium transition-colors duration-200 cursor-pointer hover:text-yellow-200 ${
                    isActive(item.href) ? "text-yellow-300 border-b-2 border-yellow-300 pb-1" : ""
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
                  <Button variant="ghost" className="hidden md:inline-flex text-white hover:bg-red-700 font-medium">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="hidden md:inline-flex bg-green-600 hover:bg-green-700 font-medium">
                    Register
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {isSubscribed && (
                  <Crown className="w-5 h-5 text-yellow-400 hidden md:block" />
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-red-700 hidden md:flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span className="font-medium">
                        {user?.firstName || user?.username}
                        <span className="text-xs opacity-75 ml-1">({user?.role})</span>
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled>
                      <User className="w-4 h-4 mr-2" />
                      {user?.email}
                    </DropdownMenuItem>
                    {hasAdminAccess ? (
                      <>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin-dashboard">
                              <Settings className="w-4 h-4 mr-2" />
                              Super Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href="/role-admin">
                            <Settings className="w-4 h-4 mr-2" />
                            {isSchoolAdmin ? "School Admin" : isCultureAdmin ? "Culture Admin" : "Role Admin"}
                          </Link>
                        </DropdownMenuItem>
                      </>
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
                  className="md:hidden text-white border-white/30 hover:border-white/50"
                  style={{ backgroundColor: 'var(--deep-red)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--revolutionary-red)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--deep-red)'}
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="logo-red-bg text-white border-red-600 w-[280px] sm:w-[350px]">
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
                  
                  
                  {!isAuthenticated ? (
                    <div className="mt-6 space-y-3">
                      <Link href="/login">
                        <Button 
                          variant="outline" 
                          className="w-full text-white border-white hover:bg-white hover:text-red-800" 
                          onClick={() => setIsOpen(false)}
                        >
                          Login
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700" 
                          onClick={() => setIsOpen(false)}
                        >
                          Register
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      <div className="text-center py-2">
                        <p className="text-sm">Logged in as</p>
                        <p className="font-semibold">{user?.firstName || user?.username}</p>
                        <p className="text-xs opacity-75">({user?.role})</p>
                        {isSubscribed && <Crown className="w-4 h-4 text-yellow-400 mx-auto mt-1" />}
                      </div>
                      {hasAdminAccess ? (
                        <Link href="/role-admin">
                          <Button 
                            variant="outline" 
                            className="w-full text-white border-white hover:bg-white hover:text-red-800" 
                            onClick={() => setIsOpen(false)}
                          >
                            Admin Dashboard
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/user-dashboard">
                          <Button 
                            variant="outline" 
                            className="w-full text-white border-white hover:bg-white hover:text-red-800" 
                            onClick={() => setIsOpen(false)}
                          >
                            My Dashboard
                          </Button>
                        </Link>
                      )}
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={() => {
                          localStorage.removeItem("auth_token");
                          localStorage.removeItem("user");
                          window.location.href = "/";
                          setIsOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
