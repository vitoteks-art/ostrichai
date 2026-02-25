import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { AdminProvider } from "./contexts/AdminContext";
import { BookingProvider } from "./contexts/BookingContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Solutions from "./pages/Solutions";
import Login from "./pages/Login";
import RevenueAudit from "./pages/RevenueAudit";
import SeoAudit from "./pages/SeoAudit";
import VideoCreation from "./pages/VideoCreation";
import VideoStatusCheck from "./pages/VideoStatusCheck";
import VideoUgc from "./pages/VideoUgc";
import VideoExtend from "./pages/VideoExtend"; // Added import
import VideoLipsync from "./pages/VideoLipsync";
import VideoLipsyncStatus from "./pages/VideoLipsyncStatus";
import VideoEditor from "./pages/VideoEditor";
import LogoCreation from "./pages/LogoCreation";
import LogoResults from "./pages/LogoResults";
import TaskStatus from "./pages/TaskStatus";
import ImageAdCreative from "./pages/ImageAdCreative";
import BatchResults from "./pages/BatchResults";
import TwoImageEditor from "./pages/TwoImageEditor";
import NotFound from "./pages/NotFound";
import FlyerDesigner from "./pages/FlyerDesigner";
import AdsCreative from "./pages/AdsCreative";
import SocialMediaPost from "./pages/SocialMediaPost";
import SocialMediaDashboard from "./pages/SocialMediaDashboard";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Subscription from "./pages/Subscription";
import Pricing from "./pages/Pricing";
import BlogResearch from "./pages/BlogResearch";
import UserGuide from "./pages/UserGuide";

import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import YouTubeScript from "./pages/YouTubeScript";
import YouTubeResearch from "./pages/YouTubeResearch";
import YouTubeTitleGen from "./pages/YouTubeTitleGen";
import EnhancedYouTubeScript from "./pages/EnhancedYouTubeScript";
import Projects from "./pages/Projects";
import ProjectView from "./pages/ProjectView";
import PaymentSuccess from "./pages/PaymentSuccess";
import GoogleMapsScraping from "./pages/GoogleMapsScraping";
import GoogleOAuthSettings from "./pages/GoogleOAuthSettings";
import ServicesRequest from "./pages/ServicesRequest";
import Industries from "./pages/Industries";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminEmailManagement from "./pages/AdminEmailManagement";
import AdminEmailComposer from "./pages/AdminEmailComposer";
import AdminSubscriptionManagement from "./pages/AdminSubscriptionManagement";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import BookingDashboard from "./pages/BookingDashboard";
import BookingAppointments from "./pages/BookingAppointments";
import BookingAvailability from "./pages/BookingAvailability";
import BookingMeetingTypes from "./pages/BookingMeetingTypes";
import BookingSettings from "./pages/BookingSettings";
import PublicBooking from "./pages/PublicBooking";
import ReferralLanding from "./pages/ReferralLanding";
import BackgroundRemover from "./pages/BackgroundRemover";
import OAuthCallback from "./pages/OAuthCallback";
import ConnectedAccounts from "./pages/ConnectedAccounts";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
              <AdminProvider>
                <BookingProvider>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/solutions" element={<Solutions />} />
                    {/* Redirects or legacy support if needed */}
                    <Route path="/studio" element={<Navigate to="/" replace />} />
                    <Route path="/services" element={<Navigate to="/solutions" replace />} />
                    <Route path="/revenue-audit" element={<RevenueAudit />} />
                    <Route path="/seo-audit" element={<SeoAudit />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/user-guide" element={<UserGuide />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected Routes - Require Authentication */}
                    <Route path="/video-creation" element={
                      <ProtectedRoute>
                        <VideoCreation />
                      </ProtectedRoute>
                    } />
                    <Route path="/video-status-check" element={
                      <ProtectedRoute>
                        <VideoStatusCheck />
                      </ProtectedRoute>
                    } />
                    <Route path="/video-ugc" element={
                      <ProtectedRoute>
                        <VideoUgc />
                      </ProtectedRoute>
                    } />
                    <Route path="/video-extend" element={
                      <ProtectedRoute>
                        <VideoExtend />
                      </ProtectedRoute>
                    } />
                    <Route path="/video-lipsync" element={
                      <ProtectedRoute>
                        <VideoLipsync />
                      </ProtectedRoute>
                    } />
                    <Route path="/video-lipsync-status" element={
                      <ProtectedRoute>
                        <VideoLipsyncStatus />
                      </ProtectedRoute>
                    } />
                    <Route path="/video-editor" element={
                      <ProtectedRoute>
                        <VideoEditor />
                      </ProtectedRoute>
                    } />
                    <Route path="/logo-creation" element={
                      <ProtectedRoute>
                        <LogoCreation />
                      </ProtectedRoute>
                    } />
                    <Route path="/logo-results" element={
                      <ProtectedRoute>
                        <LogoResults />
                      </ProtectedRoute>
                    } />
                    <Route path="/status" element={
                      <ProtectedRoute>
                        <TaskStatus />
                      </ProtectedRoute>
                    } />
                    <Route path="/image-creative" element={
                      <ProtectedRoute>
                        <ImageAdCreative />
                      </ProtectedRoute>
                    } />
                    <Route path="/batch-results" element={
                      <ProtectedRoute>
                        <BatchResults />
                      </ProtectedRoute>
                    } />
                    <Route path="/two-image-editor" element={
                      <ProtectedRoute>
                        <TwoImageEditor />
                      </ProtectedRoute>
                    } />
                    <Route path="/background-remover" element={
                      <ProtectedRoute>
                        <BackgroundRemover />
                      </ProtectedRoute>
                    } />
                    <Route path="/flyer-designer" element={
                      <ProtectedRoute>
                        <FlyerDesigner />
                      </ProtectedRoute>
                    } />
                    <Route path="/ads-creative" element={
                      <ProtectedRoute>
                        <AdsCreative />
                      </ProtectedRoute>
                    } />
                    <Route path="/social-media-post" element={
                      <ProtectedRoute>
                        <SocialMediaPost />
                      </ProtectedRoute>
                    } />
                    <Route path="/social-dashboard" element={
                      <ProtectedRoute>
                        <SocialMediaDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/projects" element={
                      <ProtectedRoute>
                        <Projects />
                      </ProtectedRoute>
                    } />
                    <Route path="/project/:id" element={
                      <ProtectedRoute>
                        <ProjectView />
                      </ProtectedRoute>
                    } />
                    <Route path="/subscription" element={
                      <ProtectedRoute>
                        <Subscription />
                      </ProtectedRoute>
                    } />
                    <Route path="/pricing" element={<Pricing />} />

                    <Route path="/services-request" element={<ServicesRequest />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/industries" element={<Industries />} />
                    <Route path="/payment-success" element={
                      <ProtectedRoute>
                        <PaymentSuccess />
                      </ProtectedRoute>
                    } />

                    <Route path="/blog-research" element={
                      <ProtectedRoute>
                        <BlogResearch />
                      </ProtectedRoute>
                    } />
                    <Route path="/youtube-research" element={
                      <ProtectedRoute>
                        <YouTubeResearch />
                      </ProtectedRoute>
                    } />
                    <Route path="/youtube-title-gen" element={
                      <ProtectedRoute>
                        <YouTubeTitleGen />
                      </ProtectedRoute>
                    } />
                    <Route path="/youtube-script" element={
                      <ProtectedRoute>
                        <YouTubeScript />
                      </ProtectedRoute>
                    } />
                    <Route path="/enhanced-youtube-script" element={
                      <ProtectedRoute>
                        <EnhancedYouTubeScript />
                      </ProtectedRoute>
                    } />
                    <Route path="/google-maps-scraping" element={
                      <ProtectedRoute>
                        <GoogleMapsScraping />
                      </ProtectedRoute>
                    } />                    <Route path="/oauth-settings" element={
                      <ProtectedRoute>
                        <GoogleOAuthSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings/connected-accounts" element={
                      <ProtectedRoute>
                        <ConnectedAccounts />
                      </ProtectedRoute>
                    } />

                    {/* OAuth Callback Routes */}
                    {/* OAuth Callback Routes - Must be public for Login flow */}
                    <Route path="/oauth/callback/:platform" element={<OAuthCallback />} />

                    {/* Booking System Routes - Admin Only */}
                    <Route path="/booking" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <BookingDashboard />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/booking/appointments" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <BookingAppointments />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/booking/availability" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <BookingAvailability />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/booking/meeting-types" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <BookingMeetingTypes />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/booking/settings" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <BookingSettings />
                      </ProtectedAdminRoute>
                    } />

                    {/* Public Booking Page - Accessible to everyone */}
                    <Route path="/book" element={<PublicBooking />} />

                    {/* Referral Landing Page - Public access for referral links */}
                    <Route path="/ref/:campaignId/:referralCode" element={<ReferralLanding />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <AdminUserManagement />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/subscriptions" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <AdminSubscriptionManagement />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/emails" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <AdminEmailManagement />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/emails/compose" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <AdminEmailComposer />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/emails/edit/:campaignId" element={
                      <ProtectedAdminRoute requiredRole="admin">
                        <AdminEmailComposer />
                      </ProtectedAdminRoute>
                    } />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BookingProvider>
              </AdminProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider >
);

export default App;
