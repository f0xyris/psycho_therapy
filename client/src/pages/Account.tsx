import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Phone, Mail, Star, Edit2, LogIn, User, Camera, Upload, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { LoadingSpinner, PageLoader } from "@/components/LoadingSpinner";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Account() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    profileImageUrl: user?.profileImageUrl || "",
  });

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingProfile(false);
      toast({
        title: t.success || "Успешно",
        description: t.success || "Профиль обновлен",
      });
    },
    onError: (error) => {
      toast({
        title: t.error || "Ошибка",
        description: t.error || "Не удалось обновить профиль",
        variant: "destructive",
      });
    },
  });

  // Generate random avatar
  const generateAvatar = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    const updatedData = { ...profileData, profileImageUrl: newAvatarUrl };
    setProfileData(updatedData);
    updateProfileMutation.mutate(updatedData);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t?.unauthorized || "Unauthorized",
        description: t?.loginDescription || "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login", { replace: true });
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, t, setLocation]);

  // Get user appointments with faster refresh settings
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments/user"],
    enabled: isAuthenticated,
    staleTime: 10 * 1000, // 10 секунд - данные считаются свежими только 10 секунд
    refetchOnWindowFocus: true, // Обновляем при фокусе окна
    refetchOnMount: true, // Обновляем при монтировании
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 dark:from-sage-900 dark:to-sage-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-playfair text-sage-700 dark:text-sage-300">
              {t.accountTitle || "Access Denied"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400">
              {t.loginDescription || "Please log in to access your account."}
            </p>
            <Button
              onClick={() => window.location.href = "/login"}
              className="w-full bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {t.login || "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-sage-50 to-sage-100 dark:bg-deep-900 p-4 flex items-center justify-center">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-playfair font-bold text-mystical-600 dark:text-mystical-400 mb-2">
            {t?.account || "Account"}
          </h1>
          <p className="text-mystical-600 dark:text-mystical-400">
            {t?.welcomeMessage || "Welcome to your personal dashboard"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                {t?.profileSettings || "Profile Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mystical-400 to-mystical-600 flex items-center justify-center mx-auto mb-4">
                  <img
                    src={user?.profileImageUrl && user.profileImageUrl.trim() !== ''
                      ? user.profileImageUrl
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || user?.firstName || 'default')}`}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/default-avatar.png'; // дефолтная публичная картинка
                    }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-mystical-600 dark:text-mystical-400">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
                </h3>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-mystical-500" />
                  <span className="text-sm text-mystical-600 dark:text-mystical-400">
                    {t?.email || "Email"}:
                  </span>
                  <span className="text-sm font-medium text-mystical-700 dark:text-mystical-300">
                    {user?.email || "Не доданий"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-mystical-500" />
                  <span className="text-sm text-mystical-600 dark:text-mystical-400">
                    {t?.phone || "Phone"}:
                  </span>
                  <span className="text-sm font-medium text-mystical-700 dark:text-mystical-300">
                    {user?.phone || "Не доданий"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-mystical-500" />
                  <span className="text-sm text-mystical-600 dark:text-mystical-400">
                    {t.bookingHistory || "Visits"}:
                  </span>
                  <span className="text-sm font-medium text-mystical-700 dark:text-mystical-300">
                    {(appointments as any[]).length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-mystical-500 to-mystical-600 hover:from-mystical-600 hover:to-mystical-700 text-white">
                      <Edit2 className="h-4 w-4 mr-2" />
                      {"Редагувати"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.save || "Edit Profile"}</DialogTitle>
                      <DialogDescription>
                        {t.profileSettings || "Update your profile information below."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          <Avatar className="w-20 h-20">
                            <AvatarImage
                              src={profileData.profileImageUrl && profileData.profileImageUrl.trim() !== ''
                                ? profileData.profileImageUrl
                                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || user?.firstName || 'default')}`}
                              onError={e => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/default-avatar.png'; // дефолтная публичная картинка
                              }}
                            />
                            <AvatarFallback className={`${generateAvatar(user?.firstName || user?.email || 'U')} text-white text-xl`}>
                              {/* Показываем пусто, чтобы не было буквы */}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="sm"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                            onClick={() => {
                              const randomAvatars = [
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`,
                                `https://api.dicebear.com/7.x/personas/svg?seed=${user?.email}`,
                                `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.email}`,
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`,
                                `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email}`,
                              ];
                              const randomAvatar = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
                              setProfileData({...profileData, profileImageUrl: randomAvatar});
                            }}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-mystical-600 dark:text-mystical-400">
                          {t.save || "Click camera to generate new avatar"}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">{"First Name"}</Label>
                          <Input
                            id="firstName"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                            placeholder={t?.firstName || "First Name"}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">{"Last Name"}</Label>
                          <Input
                            id="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            placeholder={t?.lastName || "Last Name"}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">{t?.phone || "Phone"}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          placeholder={t?.phone || "Phone"}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleProfileUpdate}
                          disabled={updateProfileMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-mystical-500 to-mystical-600 hover:from-mystical-600 hover:to-mystical-700 text-white"
                        >
                          {updateProfileMutation.isPending ? (
                            <LoadingSpinner size="sm" text={t.saving || "Saving..."} horizontal />
                          ) : (
                            t.save || "Save Changes"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1"
                        >
                          {t.cancel || "Cancel"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={async () => {
                    const token = localStorage.getItem('auth_token');
                    await fetch("/api/auth/logout", { 
                      method: "POST", 
                      credentials: "include",
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    setLocation("/login", { replace: true });
                  }}
                >
                  {t.logout || "Logout"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t.myAppointments || "My Appointments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="border rounded-lg p-4 animate-pulse">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          </div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (appointments as any[]).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-mystical-400 mx-auto mb-4" />
                    <p className="text-mystical-500 dark:text-mystical-400 mb-4">
                      {t.myAppointments || "No appointments yet"}
                    </p>
                    <Button 
                      onClick={() => setLocation("/booking")}
                      className="bg-gradient-to-r from-mystical-500 to-mystical-600 hover:from-mystical-600 hover:to-mystical-700 text-white"
                    >
                      {t.bookNow || "Book Now"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(appointments as any[]).map((appointment: any) => (
                      <div 
                        key={appointment.id} 
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          appointment.isDeletedFromAdmin ? 'opacity-60 bg-gray-50 dark:bg-gray-800' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-mystical-600 dark:text-mystical-400 flex items-center gap-2">
                              {typeof appointment.service?.name === 'object' ? 
                                (appointment.service.name.ua || "Service") :
                                (appointment.service?.name || "Service")
                              }
                              {appointment.isOnline !== undefined && (
                                <Badge variant={appointment.isOnline ? 'secondary' : 'outline'} className="ml-1">
                                  {appointment.isOnline ? 'Онлайн' : 'Офлайн'}
                                </Badge>
                              )}
                            </h4>
                            <p className="text-sm text-mystical-600 dark:text-mystical-400">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} / {new Date(appointment.appointmentDate).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge 
                            variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              appointment.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : appointment.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {appointment.status === 'completed' ? t.completed :
                              appointment.status === 'confirmed' ? t.confirmed :
                              appointment.status === 'cancelled' ? t.cancelled :
                              t.pending}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-mystical-600 dark:text-mystical-400">
                          <div className="flex items-center gap-1">
                            {appointment.isOnline ? 'Онлайн запис' : 'Офлайн запис'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.service?.duration || "60"} {t.minutes}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}