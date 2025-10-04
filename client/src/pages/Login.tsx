import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PasswordInput } from "@/components/PasswordInput";

// Validation schemas
const createLoginSchema = (t: any) => z.object({
  email: z.string().min(1, t?.auth?.emailRequired || "Email is required").email(t?.auth?.emailInvalid || "Please enter a valid email address"),
  password: z.string().min(1, t?.auth?.passwordRequired || "Password is required").min(6, t?.auth?.passwordMinLength || "Password must be at least 6 characters")
});

const createRegisterSchema = (t: any) => z.object({
  email: z.string().min(1, t?.auth?.emailRequired || "Email is required").email(t?.auth?.emailInvalid || "Please enter a valid email address"),
  password: z.string().min(1, t?.auth?.passwordRequired || "Password is required").min(6, t?.auth?.passwordMinLength || "Password must be at least 6 characters"),
  firstName: z.string().min(1, t?.auth?.firstNameRequired || "First name is required"),
  lastName: z.string().min(1, t?.auth?.lastNameRequired || "Last name is required"),
  phone: z.string().min(1, t?.auth?.phoneRequired || "Phone number is required")
});

export default function Login() {
  const { t } = useLanguage();
  const { loginMutation, registerMutation, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize forms unconditionally (all hooks must be called at the top level)
  const loginForm = useForm({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: { email: "", password: "" },
    mode: "onChange"
  });
  
  const registerForm = useForm({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", phone: "" },
    mode: "onChange"
  });

  // Handle authentication redirect in useEffect
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Check for OAuth error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'oauth_failed') {
      toast({
        title: t.auth?.oauthError || "OAuth Error",
        description: t.auth?.oauthErrorMessage || "Google login failed. Please try email/password login.",
        variant: "destructive",
      });
    }
  }, [toast, t]);

  const handleLogin = async (data: any) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: t.auth?.loginWelcomeTitle || "Welcome back!",
        description: t.auth?.loginWelcomeCreative || "You look amazing today! Glad to see you again!",
      });
      // Небольшая задержка перед перенаправлением, чтобы пользователь увидел тост
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    } catch (error) {
      toast({
        title: t.auth?.login || "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (data: any) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({
        title: t.auth?.register || "Registration successful",
        description: "Ласкаво просимо до Psycho Therapy!",
      });
      // Небольшая задержка перед перенаправлением, чтобы пользователь увидел тост
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    } catch (error) {
      toast({
        title: t.auth?.register || "Registration failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };


  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't render the form if already authenticated (redirect will happen in useEffect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100 dark:bg-deep-900 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side - Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-playfair text-sage-800 dark:text-sage-100">
              {t.auth?.welcome || "Welcome"}
            </CardTitle>
            <CardDescription className="text-sage-600 dark:text-sage-300">
              {t.auth?.subtitle || "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t.auth?.login || "Login"}</TabsTrigger>
                <TabsTrigger value="register">{t.auth?.register || "Register"}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.auth?.email || "Email"}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.auth?.emailPlaceholder || "Enter your email"}
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t.auth?.password || "Password"}</Label>
                    <PasswordInput
                      id="password"
                      placeholder={t.auth?.passwordPlaceholder || "Enter your password"}
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                                     <Button 
                     type="submit" 
                     className="w-full bg-sage-600 hover:bg-sage-700 text-white dark:hover:text-white"
                     disabled={loginMutation.isPending}
                   >
                    {loginMutation.isPending ? (
                      <LoadingSpinner size="sm" text={t.auth?.loggingIn || "Logging in..."} horizontal />
                    ) : (
                      t.auth?.login || "Login"
                    )}
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t.auth?.or || "OR"}
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t.auth?.googleLogin || "Continue with Google"}
                </Button>

                {/* Demo button removed: use /login-admin link instead */}
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t.auth?.firstName || "First Name"}</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder={t.auth?.firstNamePlaceholder || "Enter your first name"}
                        {...registerForm.register("firstName")}
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t.auth?.lastName || "Last Name"}</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder={t.auth?.lastNamePlaceholder || "Enter your last name"}
                        {...registerForm.register("lastName")}
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">{t.auth?.email || "Email"}</Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder={t.auth?.emailPlaceholder || "Enter your email"}
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPhone">{t.auth?.phone || "Phone Number"}</Label>
                    <Input
                      id="registerPhone"
                      type="tel"
                      placeholder={t.auth?.phonePlaceholder || "+48 (___) ___-__-__"}
                      {...registerForm.register("phone")}
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">{t.auth?.password || "Password"}</Label>
                    <PasswordInput
                      id="registerPassword"
                      placeholder={t.auth?.passwordPlaceholder || "Enter your password"}
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                                     <Button 
                     type="submit" 
                     className="w-full bg-sage-600 hover:bg-sage-700 text-white dark:hover:text-white"
                     disabled={registerMutation.isPending}
                   >
                    {registerMutation.isPending ? (
                      <LoadingSpinner size="sm" text={t.auth?.registering || "Registering..."} horizontal />
                    ) : (
                      t.auth?.register || "Register"
                    )}
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t.auth?.or || "OR"}
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t.auth?.googleLogin || "Continue with Google"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side - Hero */}
        <div className="flex flex-col justify-center items-center text-center space-y-6">
          <div className="max-w-md">
            <h1 className="text-4xl font-playfair font-bold text-sage-800 dark:text-sage-100 mb-4">
              Psycho Therapy
            </h1>
            <p className="text-lg text-sage-600 dark:text-sage-300 mb-6">
              {t.auth?.heroDescription || "Професійна психологічна допомога та підтримка"}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-sage-600 dark:text-sage-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sage-600 rounded-full"></div>
                <span>{t.individualTherapy || "Індивідуальна терапія"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sage-600 rounded-full"></div>
                <span>{t.groupTherapy || "Групова терапія"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sage-600 rounded-full"></div>
                <span>{t.childTherapy || "Дитяча терапія"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sage-600 rounded-full"></div>
                <span>{t.onlineConsultations || "Онлайн консультації"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}