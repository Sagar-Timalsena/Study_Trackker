import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: "fas fa-chart-line" },
  { path: "/subjects", label: "Subjects", icon: "fas fa-book" },
  { path: "/reports", label: "Reports", icon: "fas fa-chart-bar" },
  { path: "/friends", label: "Friends", icon: "fas fa-users" },
  { path: "/profile", label: "Profile", icon: "fas fa-user" },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link href={item.path}>
      <a className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
        isActive 
          ? 'text-primary bg-blue-50' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}>
        <i className={`${item.icon} mr-3`}></i>
        {item.label}
      </a>
    </Link>
  );
}

function SidebarContent() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const getDisplayName = () => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return user?.email || "User";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center h-16 bg-primary">
        <div className="flex items-center">
          <i className="fas fa-graduation-cap text-white text-xl mr-2"></i>
          <span className="text-white text-xl font-bold">Study Tracker</span>
        </div>
      </div>
      
      {/* User Profile Section */}
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Avatar className="w-12 h-12 mr-3">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{getDisplayName()}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        {/* Navigation Links */}
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                item={item} 
                isActive={location === item.path}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Navigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg hidden lg:block">
        <SidebarContent />
      </nav>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <i className="fas fa-bars text-xl"></i>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <i className="fas fa-graduation-cap text-primary text-xl mr-2"></i>
          <span className="text-xl font-bold text-gray-900">Study Tracker</span>
        </div>

        <div className="w-8"></div> {/* Spacer for center alignment */}
      </header>

      {/* Mobile header spacer */}
      <div className="lg:hidden h-16"></div>
    </>
  );
}
