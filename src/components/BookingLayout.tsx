import { Link, useLocation } from "react-router-dom";
import { Calendar, Clock, Settings, Home, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/booking", icon: Home },
  { name: "Appointments", href: "/booking/appointments", icon: FileText },
  { name: "Availability", href: "/booking/availability", icon: Clock },
  { name: "Meeting Types", href: "/booking/meeting-types", icon: Calendar },
  { name: "Settings", href: "/booking/settings", icon: Settings },
];

export const BookingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Don't show layout on public booking pages
  if (location.pathname.startsWith("/book/")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/booking" className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">BookEasy</span>
              </Link>
            </div>
            <div className="flex space-x-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};
