import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Video, Sparkles, User, LogOut, LogIn, ChevronDown, Palette, Film, Layout, BarChart3, Crown, CreditCard, Calendar, Clock, Share2, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { SubscriptionFeatures } from "../services/subscriptionService";
import { useAdmin } from "../contexts/AdminContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { subscription, plan } = useSubscription();
  const { isAdmin } = useAdmin();

  // Check screen size for mobile breakpoint at 768px
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMobile, isMenuOpen]);

  const resourcesMenu = {
    title: "Resources",
    icon: BookOpen,
    items: [
      { path: "/blog", label: "Blog" },
      { path: "/user-guide", label: "User Guide" },
    ],
  };

  const navGroups = [
    {
      title: "Main",
      items: [
        { path: "/", label: "Home" },
        { path: "/contact", label: "Contact" },
        { path: "/revenue-audit", label: "Revenue Audit" },
        { path: "/solutions", label: "Solutions" },
        { path: "/industries", label: "Industries" },
        { path: "/pricing", label: "Pricing" }
      ],
    },
    {
      title: "Resources",
      items: resourcesMenu.items,
    }
  ];

  // Filter menu items based on subscription access
  const getFilteredDropdownMenus = () => {
    const { canAccess } = useSubscription();

    interface NavMenuItem {
      path: string;
      label: string;
      feature?: keyof SubscriptionFeatures | null;
      category?: string;
      description?: string;
    }

    const allProductItems: NavMenuItem[] = [
      // Media Creation Items
      { path: "/logo-creation", label: "Logo Creation", feature: null, category: "Media Creation", description: "Design professional logos in seconds with AI." },
      { path: "/two-image-editor", label: "Image Editor", feature: null, category: "Media Creation", description: "Edit and enhance your images effortlessly." },
      { path: "/background-remover", label: "Background Remover", feature: null, category: "Media Creation", description: "Instantly remove backgrounds from photos." },
      { path: "/flyer-designer", label: "Flyer Designer", feature: null, category: "Media Creation", description: "Create stunning promotional flyers." },
      { path: "/ads-creative", label: "Ad Creative", feature: null, category: "Media Creation", description: "Generate high-converting ad visuals." },

      // Video Tools Items
      { path: "/video-creation", label: "Video Generation", feature: "videoGeneration", category: "Video Tools", description: "Create professional videos from text inputs." },
      { path: "/video-ugc", label: "Video UGC Creator", feature: "videoGeneration", category: "Video Tools", description: "Generate authentic UGC-style video content." },
      { path: "/video-lipsync", label: "Video Lipsync", feature: "videoGeneration", category: "Video Tools", description: "Perfect lip-syncing for your video avatars." },
      { path: "/video-extend", label: "Extend Video", feature: "videoGeneration", category: "Video Tools", description: "Seamlessly extend short video clips." },
      { path: "/video-lipsync-status", label: "Lipsync Status", feature: "videoGeneration", category: "Video Tools", description: "Check status of lip-sync generation." },
      { path: "/status", label: "Status Creation", feature: null, category: "Video Tools", description: "Monitor content creation status." },
      { path: "/video-status-check", label: "Ugc Status", feature: "videoGeneration", category: "Video Tools", description: "Track UGC video generation progress." },
      { path: "/video-editor", label: "Video Editor", feature: "videoGeneration", category: "Video Tools", description: "Trim and join videos without re-encoding." },

      // Social & Design
      { path: "/social-dashboard", label: "Social Dashboard", feature: null, category: "Social & Design", description: "Manage all social accounts in one place." },
      { path: "/social-media-post", label: "Social Media Post", feature: "socialMediaPosts", category: "Social & Design", description: "Generate engaging social media copy." },

      // Research & Utils
      { path: "/blog-research", label: "Blog Research", feature: "blogResearch", category: "Research & Utils", description: "Find trending topics for your blog." },
      { path: "/seo-audit", label: "SEO Audit", feature: null, category: "Research & Utils", description: "Run a fast SEO audit and get prioritized fixes." },
      { path: "/youtube-research", label: "YouTube Research", feature: "blogResearch", category: "Research & Utils", description: "Analyze competitors and keyword trends." },
      { path: "/youtube-script", label: "YouTube Script", feature: "scriptGeneration", category: "Research & Utils", description: "Write compelling scripts for your videos." },
      { path: "/enhanced-youtube-script", label: "Enhanced YouTube Script", feature: "scriptGeneration", category: "Research & Utils", description: "Advanced scripting with AI optimization." },
      { path: "/youtube-title-gen", label: "YouTube Title Generator", feature: "titleGeneration", category: "Research & Utils", description: "Generate click-worthy video titles." },
      { path: "/google-maps-scraping", label: "Google Maps Scraper", feature: null, category: "Research & Utils", description: "Extract business data from Google Maps." },
    ];

    const filteredItems = allProductItems;

    return [
      {
        title: "Product",
        icon: Palette,
        items: filteredItems,
      },
    ].filter(menu => menu.items.length > 0);
  };

  const getGroupedItems = (items: any[]) => {
    const groups: { [key: string]: any[] } = {};
    // Define exact order of columns
    const order = ["Media Creation", "Video Tools", "Social & Design", "Research & Utils"];

    // Initialize groups in order
    order.forEach(cat => groups[cat] = []);

    items.forEach(item => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  };


  // Separate Booking Menu
  const getBookingMenu = () => {
    const bookingItems = [
      { path: "/book", label: "Book Appointment" },
      { path: "/booking", label: "Dashboard" },
      { path: "/booking/appointments", label: "Appointments" },
      { path: "/booking/availability", label: "Availability" },
      { path: "/booking/meeting-types", label: "Meeting Types" },
      { path: "/booking/settings", label: "Settings" },
    ];

    return {
      title: "Booking",
      icon: Calendar,
      items: bookingItems,
    };
  };

  const dropdownMenus = getFilteredDropdownMenus();
  const bookingMenu = getBookingMenu();

  const allNavItems = navGroups.flatMap((group) => group.items);

  // Use startsWith for active state if nested routes are possible
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="bg-card/80 backdrop-blur-xl border-b border-border/50 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
              aria-label="OstrichAi Studio Home"
            >
              <img
                src="/ostrich-logo.png"
                alt="OstrichAi Logo"
                className="h-32 w-auto min-w-[280px] object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className={`items-center space-x-1 ${isMobile ? "hidden" : "flex"}`}>
              {/* Home Link */}
              {navGroups.map((group) =>
                group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      }`}
                    aria-current={isActive(item.path) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))
              )}
              {/* Resources Dropdown (Blog + User Guide) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    aria-label="Resources menu"
                  >
                    <resourcesMenu.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{resourcesMenu.title}</span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>{resourcesMenu.title}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {resourcesMenu.items.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`w-full ${isActive(item.path) ? "bg-primary/10 text-primary" : ""}`}
                        aria-current={isActive(item.path) ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-6 w-px bg-border/50 mx-3" aria-hidden="true" />

              {/* Product Dropdown Menu */}
              {dropdownMenus.map((menu) => (
                <DropdownMenu key={menu.title}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      aria-label={`${menu.title} menu`}
                    >
                      <menu.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{menu.title}</span>
                      <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[1000px] p-0" sideOffset={10}>
                    <div className="grid grid-cols-4 divide-x divide-border">
                      {Object.entries(getGroupedItems(menu.items)).map(([category, items]) => (
                        <div key={category} className="p-4 bg-popover/50">
                          <h4 className="text-sm font-semibold text-foreground mb-4 select-none px-2">{category}</h4>
                          <div className="space-y-1">
                            {items.map((item: any) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                className={`group block p-2 rounded-lg transition-colors hover:bg-accent ${isActive(item.path) ? "bg-accent/50" : ""
                                  }`}
                              >
                                <div className="text-sm font-medium leading-none text-foreground group-hover:text-accent-foreground">
                                  {item.label}
                                </div>
                                {item.description && (
                                  <p className="line-clamp-2 text-xs leading-snug text-muted-foreground group-hover:text-accent-foreground/80 mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}

              {/* Booking Dropdown Menu - Show only for logged in users */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      aria-label="Booking menu"
                    >
                      <bookingMenu.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{bookingMenu.title}</span>
                      <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>{bookingMenu.title} System</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {bookingMenu.items.map((item) => (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link
                          to={item.path}
                          className={`w-full ${isActive(item.path) ? "bg-primary/10 text-primary" : ""
                            }`}
                          aria-current={isActive(item.path) ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Auth Section */}
              <div className="ml-4 flex items-center space-x-2">
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" aria-label="Loading user status" />
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-2"
                        aria-label="User account menu"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden lg:inline">{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-muted-foreground">
                        {user.email}
                      </DropdownMenuItem>

                      {/* Subscription Status */}
                      {plan && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Plan:</span>
                              <Badge variant={plan.price > 0 ? "default" : "secondary"} className="text-xs">
                                {plan.name}
                              </Badge>
                            </div>
                            {plan.price > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ${plan.price}/month
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center text-primary font-medium">
                            <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/social-dashboard" className="flex items-center">
                          <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Social Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings/connected-accounts" className="flex items-center">
                          <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Connected Accounts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/subscription" className="flex items-center">
                          <Crown className="mr-2 h-4 w-4" aria-hidden="true" />
                          Subscription
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/pricing" className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                          Pricing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/projects" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                          My Projects
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" aria-hidden="true" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={signOut}
                        className="text-red-600"
                        aria-label="Sign out"
                      >
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild size="sm">
                    <Link
                      to="/login"
                      className="flex items-center space-x-2"
                      aria-label="Sign in"
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      <span>Sign In</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className={`text-foreground hover:bg-secondary/80 ${isMobile ? "block" : "hidden"}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Fixed Overlay */}
      {isMenuOpen && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Mobile Menu */}
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-background z-50 transition-transform duration-300 transform translate-y-0">
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Mobile Auth Section */}
                <div className="pb-4 border-b border-border/30">
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
                      <div className="h-4 bg-secondary rounded animate-pulse flex-1" />
                    </div>
                  ) : user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 pb-3 border-b border-border/30">
                        <User className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                      </div>
                      <div className="space-y-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={isActive("/dashboard") ? "page" : undefined}
                        >
                          <BarChart3 className="h-5 w-5" aria-hidden="true" />
                          <span>Dashboard</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                            aria-current={isActive("/admin") ? "page" : undefined}
                          >
                            <Shield className="h-5 w-5" aria-hidden="true" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link
                          to="/projects"
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={isActive("/projects") ? "page" : undefined}
                        >
                          <BarChart3 className="h-5 w-5" aria-hidden="true" />
                          <span>My Projects</span>
                        </Link>
                        <Link
                          to="/social-dashboard"
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={isActive("/social-dashboard") ? "page" : undefined}
                        >
                          <Share2 className="h-5 w-5" aria-hidden="true" />
                          <span>Social Dashboard</span>
                        </Link>
                        <Link
                          to="/settings/connected-accounts"
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={isActive("/settings/connected-accounts") ? "page" : undefined}
                        >
                          <Share2 className="h-5 w-5" aria-hidden="true" />
                          <span>Connected Accounts</span>
                        </Link>
                        <Link
                          to="/subscription"
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={isActive("/subscription") ? "page" : undefined}
                        >
                          <Crown className="h-5 w-5" aria-hidden="true" />
                          <span>Subscription</span>
                        </Link>
                        <Link
                          to="/pricing"
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={isActive("/pricing") ? "page" : undefined}
                        >
                          <CreditCard className="h-5 w-5" aria-hidden="true" />
                          <span>Pricing</span>
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={isActive("/profile") ? "page" : undefined}
                        >
                          <User className="h-5 w-5" aria-hidden="true" />
                          <span>Profile</span>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            signOut();
                            setIsMenuOpen(false);
                          }}
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-3 h-auto"
                          aria-label="Sign out"
                        >
                          <LogOut className="h-5 w-5 mr-3" aria-hidden="true" />
                          <span>Sign Out</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button asChild className="w-full h-12">
                      <Link
                        to="/login"
                        className="flex items-center justify-center space-x-2"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Sign in"
                      >
                        <LogIn className="h-5 w-5" aria-hidden="true" />
                        <span>Sign In</span>
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Navigation Sections */}
                <div className="space-y-6">
                  {navGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <div className="px-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.title}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                              }`}
                            onClick={() => setIsMenuOpen(false)}
                            aria-current={isActive(item.path) ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  {dropdownMenus.map((menu) => (
                    <div key={menu.title} className="space-y-3">
                      <div className="px-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center space-x-2">
                          <menu.icon className="h-4 w-4" aria-hidden="true" />
                          <span>{menu.title}</span>
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {menu.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                              }`}
                            onClick={() => setIsMenuOpen(false)}
                            aria-current={isActive(item.path) ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Booking Menu in Mobile */}
                  {user && (
                    <div className="space-y-3">
                      <div className="px-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center space-x-2">
                          <bookingMenu.icon className="h-4 w-4" aria-hidden="true" />
                          <span>{bookingMenu.title}</span>
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {bookingMenu.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                              }`}
                            onClick={() => setIsMenuOpen(false)}
                            aria-current={isActive(item.path) ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-6" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navigation;
