import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ResourcePreloader } from "@/components/ResourcePreloader";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { useCacheRefresh } from "@/hooks/useCache";
import { useDataPreloader } from "@/hooks/useDataPreloader";
import { AppPreloader } from "@/components/LoadingSpinner";
import Home from "@/pages/Home";
import Booking from "@/pages/Booking";
import Training from "@/pages/Training";
import EventDetails from "@/pages/EventDetails";
import Reviews from "@/pages/Reviews";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
// import CourseCheckout from "@/pages/CourseCheckout"; // removed (Stripe)
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import LoginAdmin from "@/pages/LoginAdmin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking" component={Booking} />
      <Route path="/training" component={Training} />
      <Route path="/training/:id" component={EventDetails} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/account" component={Account} />
      <Route path="/admin" component={Admin} />
      <Route path="/login-admin" component={LoginAdmin} />
      {/* Stripe checkout route removed */}
      <Route path="/login" component={Login} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  useCacheRefresh();
  
  const { isPreloading, preloadProgress } = useDataPreloader();

  const [location] = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const forcePreloader = urlParams.get('preloader') === 'true';

  const criticalImages = [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=70",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=70"
  ];

  return (
    <LanguageProvider>
      <TooltipProvider>
        <ResourcePreloader images={criticalImages} />
        
        <AppPreloader isVisible={isPreloading || forcePreloader} progress={preloadProgress} />
        
        <div className={`min-h-screen bg-background transition-opacity duration-500 ${ (isPreloading || forcePreloader) ? 'opacity-0' : 'opacity-100' }`}>
          <Navigation />
          <Router />
          {location !== '/login' && <Footer />}
        </div>
        
        <Toaster />
        <PerformanceMonitor />
      </TooltipProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
