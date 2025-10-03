import { useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, User, LogOut, Instagram, Send } from "lucide-react";
// import { ThemeToggle } from "./ThemeToggle";
// import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
// import { Logo } from "./Logo";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading, logoutMutation } = useAuth();

  const navigationItems = useMemo(() => {
    const items = [
      { href: "/", label: t.home },
      { href: "/booking", label: t.booking },
      { href: "/training", label: t.events || "Події" },
      { href: "/reviews", label: t.reviews },
    ];
    
    // Добавляем ссылку на аккаунт только если пользователь аутентифицирован
    if (isAuthenticated && user) {
      items.push({ href: "/account", label: t.account });
    }
    
    // Добавляем ссылку на админку только если пользователь админ
    if (isAuthenticated && user?.isAdmin) {
      items.push({ href: "/admin", label: t.admin });
    }
    
    return items;
  }, [t, isAuthenticated, user]);

  const isActive = useCallback((href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  }, [location]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Мемоизируем десктопную навигацию
  const desktopNavigation = useMemo(() => (
    <div className="hidden lg:block">
      <div className="flex items-baseline space-x-6">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-2 py-2 font-medium transition-colors whitespace-nowrap",
              isActive(item.href)
                ? "text-mystical-600 dark:text-mystical-400"
                : "text-gray-700 dark:text-foreground hover:text-mystical-600 dark:hover:text-mystical-400"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  ), [navigationItems, isActive]);

  // Мемоизируем мобильную навигацию
  const mobileNavigation = useMemo(() => (
    <div className="lg:hidden flex items-center space-x-1">
      {/* Language selector removed for single-language site */}
      <a href="https://instagram.com/" target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-mystical-100">
        <Instagram className="h-4 w-4" />
      </a>
      <a href="https://t.me/" target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-mystical-100">
        <Send className="h-4 w-4" />
      </a>
      {!isLoading && (
        <>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="h-9 w-9 rounded-full transition-all hover:bg-mystical-100 dark:hover:bg-deep-700 dark:bg-deep-800 dark:text-mystical-300 dark:border dark:border-deep-600"
            >
              {logoutMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full transition-all hover:bg-mystical-100 dark:hover:bg-deep-700 dark:bg-deep-800 dark:text-mystical-300 dark:border dark:border-deep-600 flex items-center justify-center">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </>
      )}
      <button
        onClick={toggleMobileMenu}
        className="h-9 w-9 rounded-full transition-all hover:bg-mystical-100 dark:hover:bg-deep-700 dark:bg-deep-800 dark:text-mystical-300 dark:border dark:border-deep-600 flex items-center justify-center"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  ), [isLoading, isAuthenticated, logoutMutation, toggleMobileMenu, isMobileMenuOpen]);

  // Мемоизируем десктопные элементы управления
  const desktopControls = useMemo(() => (
    <div className="hidden lg:flex items-center space-x-2">
      {!isLoading && (
        <>
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                {user?.firstName || user?.email?.split('@')[0] || user?.email || 'User'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="h-9 w-9 rounded-full transition-all hover:bg-mystical-100 dark:hover:bg-deep-700 dark:bg-deep-800 dark:text-mystical-300 dark:border dark:border-deep-600"
              >
                {logoutMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full transition-all hover:bg-mystical-100 dark:hover:bg-deep-700 dark:bg-deep-800 dark:text-mystical-300 dark:border dark:border-deep-600 flex items-center justify-center">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </>
      )}
      {/* Language selector removed for single-language site */}
      <a href="https://www.instagram.com/mentalpsy.anna?igsh=MWszbmduNmFwN2IzdQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-mystical-100">
        <Instagram className="h-4 w-4" />
      </a>
      <a href="https://t.me/Annabordyug" target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-mystical-100">
        <Send className="h-4 w-4" />
      </a>
    </div>
  ), [isLoading, isAuthenticated, user, logoutMutation, t.login]);

  // Мемоизируем мобильное меню
  const mobileMenu = useMemo(() => {
    if (!isMobileMenuOpen) return null;

    return (
      <>
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={closeMobileMenu}
        />
        
        {/* Mobile menu panel */}
        <div className="fixed top-16 left-0 right-0 z-50 lg:hidden">
          <div className="bg-white dark:bg-deep-900 shadow-xl border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "block px-4 py-3 text-base font-medium transition-colors rounded-lg",
                    isActive(item.href)
                      ? "text-mystical-600 dark:text-mystical-400 bg-mystical-50 dark:bg-mystical-900/20"
                      : "text-gray-700 dark:text-foreground hover:text-mystical-600 dark:hover:text-mystical-400 hover:bg-mystical-50 dark:hover:bg-mystical-900/20"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }, [isMobileMenuOpen, navigationItems, isActive, closeMobileMenu]);

  return (
    <header className="bg-white/95 dark:bg-deep-900/95 shadow-lg sticky top-0 z-50 backdrop-blur-md border-0">
      <nav className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-shrink-0 h-8" />
          
          {/* Desktop Navigation */}
          {desktopNavigation}

          {/* Auth, Language Selector and Theme Toggle */}
          {desktopControls}

          {/* Mobile controls */}
          {mobileNavigation}
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {mobileMenu}
    </header>
  );
};

export default Navigation;
