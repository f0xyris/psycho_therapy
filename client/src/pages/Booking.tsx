import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import removed: Input not used in custom time field
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";

const Booking = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    serviceId: "",
    date: "",
    time: "",
    notes: "",
    isOnline: false
  });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [workingStart, setWorkingStart] = useState<string>("");
  const [workingEnd, setWorkingEnd] = useState<string>("");
  // One-field picker UX
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [selectedMinute, setSelectedMinute] = useState<string>("");
  const [timeInlineOpen, setTimeInlineOpen] = useState(false);
  const timeBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!formData.date) {
      setWorkingStart("");
      setWorkingEnd("");
      return;
    }
    const token = localStorage.getItem('auth_token');
    fetch(`/api/working-hours?date=${formData.date}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(r => r.json())
      .then((data) => {
        setWorkingStart(data?.startTime || "");
        setWorkingEnd(data?.endTime || "");
      })
      .catch(() => {
        setWorkingStart("");
        setWorkingEnd("");
      });
  }, [formData.date]);

  // Reset hour/min when date changes
  useEffect(() => {
    setSelectedHour("");
    setSelectedMinute("");
    handleInputChange("time", "");
  }, [formData.date]);

  // Function to check if time is in the past
  const isTimeInPast = (time: string) => {
    if (!formData.date) return false;
    const selectedDateTime = new Date(`${formData.date}T${time}:00`);
    const now = new Date();
    return selectedDateTime <= now;
  };

  // Get services from database
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      // Merge local demo services if present
      try {
        const local = JSON.parse(localStorage.getItem('demo_services') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          return [...data, ...local];
        }
      } catch {}
      return data;
    }
  });

  // Get booked appointments for the selected date
  const { data: bookedAppointments } = useQuery({
    queryKey: ["/api/appointments/by-date", formData.date],
    queryFn: async () => {
      if (!formData.date) return [];
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/appointments/by-date?date=${formData.date}` , {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
    enabled: !!formData.date
  });

  // Function to check if time slot is booked
  const isTimeSlotBooked = (time: string) => {
    if (!bookedAppointments || !formData.date) return false;
    
    const selectedDateTime = new Date(`${formData.date}T${time}:00`);
    
    return bookedAppointments.some((appointment: any) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.getTime() === selectedDateTime.getTime() && 
             appointment.status !== 'cancelled' && 
             appointment.status !== 'completed' &&
             !appointment.isDeletedFromAdmin;
    });
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const isWithinWorkingHours = (time: string) => {
    if (!workingStart || !workingEnd) return true;
    const t = timeToMinutes(time);
    return t >= timeToMinutes(workingStart) && t <= timeToMinutes(workingEnd);
  };

  // removed unused clamp/generator helpers after moving to inline picker

  const generateAllowedHours = (): string[] => {
    const hours: number[] = [];
    const start = workingStart ? timeToMinutes(workingStart) : 0;
    const end = workingEnd ? timeToMinutes(workingEnd) : 23 * 60 + 59;
    let effStart = start;
    if (formData.date) {
      const today = new Date();
      const isSameDay = new Date(formData.date).toDateString() === today.toDateString();
      if (isSameDay) {
        const nowV = today.getHours() * 60 + today.getMinutes();
        effStart = Math.max(effStart, nowV);
      }
    }
    const startHour = Math.floor(effStart / 60);
    const endHour = Math.floor(end / 60);
    for (let h = startHour; h <= endHour; h++) hours.push(h);
    return hours.map(h => String(h).padStart(2, '0'));
  };

  const generateAllowedMinutesForHour = (hourStr: string): string[] => {
    if (!hourStr) return [];
    const hour = parseInt(hourStr, 10);
    const start = workingStart ? timeToMinutes(workingStart) : 0;
    const end = workingEnd ? timeToMinutes(workingEnd) : 23 * 60 + 59;
    let minMinute = 0;
    let maxMinute = 59;
    const startHour = Math.floor(start / 60);
    const startMin = start % 60;
    const endHour = Math.floor(end / 60);
    const endMin = end % 60;
    if (hour === startHour) minMinute = startMin;
    if (hour === endHour) maxMinute = endMin;
    if (formData.date) {
      const today = new Date();
      const isSameDay = new Date(formData.date).toDateString() === today.toDateString();
      if (isSameDay && hour === today.getHours()) {
        minMinute = Math.max(minMinute, today.getMinutes());
      }
    }
    const minutes: string[] = [];
    for (let m = minMinute; m <= maxMinute; m++) {
      const mStr = String(m).padStart(2, '0');
      const time = `${hourStr}:${mStr}`;
      if (!isTimeInPast(time) && !isTimeSlotBooked(time)) minutes.push(mStr);
    }
    return minutes;
  };

  // Compose time from hour/min selections
  useEffect(() => {
    if (selectedHour && selectedMinute) {
      const composed = `${selectedHour}:${selectedMinute}`;
      if (isWithinWorkingHours(composed) && !isTimeInPast(composed) && !isTimeSlotBooked(composed)) {
        handleInputChange("time", composed);
      } else {
        handleInputChange("time", "");
      }
    } else {
      handleInputChange("time", "");
    }
  }, [selectedHour, selectedMinute]);

  const blockOutsideWorkingHours = () => {
    if (!formData.date || !formData.time) return false;
    if (!workingStart || !workingEnd) return false;
    const t = timeToMinutes(formData.time);
    return !(t >= timeToMinutes(workingStart) && t <= timeToMinutes(workingEnd));
  };

  // removed unused getAppointmentStatus helper

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/by-date"] });
      
      toast({
        title: t.success || "Success",
        description: t.appointmentCreated || "Appointment created successfully",
      });
      
      // Reset form
      setFormData({
        serviceId: "",
        date: "",
        time: "",
        notes: "",
        isOnline: false
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: t.appointmentError || "Failed to create appointment",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: t.error || "Error",
        description: t.loginRequired || "Login required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.serviceId || !formData.date || !formData.time) {
      toast({
        title: t.error || "Error",
        description: t.fillAllFields || "Fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (blockOutsideWorkingHours()) {
      toast({
        title: t.error || "Error",
        description: "Selected time is outside of working hours",
        variant: "destructive",
      });
      return;
    }

    // Create appointment date by combining date and time
    const appointmentDateTime = new Date(`${formData.date}T${formData.time}:00`);
    
    // Check if the selected time is in the past
    if (appointmentDateTime <= new Date()) {
      toast({
        title: t.error || "Error",
        description: t.pastTimeError || "Cannot book appointments in the past",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the time slot is already booked
    if (isTimeSlotBooked(formData.time)) {
      toast({
        title: t.error || "Error",
        description: t.timeSlotAlreadyBooked || "This time slot is already booked",
        variant: "destructive",
      });
      return;
    }
    

    

    
    const appointmentData = {
      serviceId: parseInt(formData.serviceId),
      appointmentDate: appointmentDateTime.toISOString(),
      isOnline: formData.isOnline,
      notes: formData.notes || null,
      status: "pending"
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-3 sm:px-4 lg:px-8 py-6 sm:py-12 dark:bg-deep-900">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-mystical-500 dark:text-mystical-400 mb-2 sm:mb-4">{t.bookingTitle}</h1>
            <p className="text-muted-foreground dark:text-muted-foreground text-sm sm:text-base">{t.bookingDescription}</p>
          </div>

          <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground mb-6">
                {t.loginRequired || "Login required"}
              </p>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-mystical-500 to-accent-500 text-white px-8 py-3 hover:from-mystical-600 hover:to-accent-600 shadow-lg transform hover:scale-105 transition-all font-semibold">
                  {t.login || "Login"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-3 sm:px-4 lg:px-8 py-6 sm:py-12 dark:bg-deep-900">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-mystical-500 dark:text-mystical-400 mb-2 sm:mb-4">{t.bookingTitle}</h1>
          <p className="text-muted-foreground dark:text-muted-foreground text-sm sm:text-base">{t.bookingDescription}</p>
        </div>

      <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
        <CardContent className="p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div>
              <Label htmlFor="service" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                {t.selectService}
              </Label>
              {servicesLoading ? (
                <div className="space-y-3">
                  <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-md animate-pulse"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-mystical-200 to-mystical-300 dark:from-mystical-700 dark:to-mystical-600 rounded-full animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <Select value={formData.serviceId} onValueChange={(value) => handleInputChange("serviceId", value)}>
                  <SelectTrigger className="dark:bg-background dark:border-mystical-700 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder={t.selectService} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-background dark:border-mystical-700">
                    {services?.map((service: any) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name?.[language] || service.name?.ua || 'Service'} - {service.price / 100} грн ({service.duration} {t.minutes})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Online/Offline toggle */}
            <div>
              <Label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">Формат запису</Label>
              <div className="flex gap-2">
                <Button type="button" variant={formData.isOnline ? "outline" : "default"} className={!formData.isOnline ? "bg-gradient-to-r from-mystical-500 to-accent-500 text-white" : ""} onClick={() => setFormData(p=>({...p, isOnline:false}))}>Офлайн</Button>
                <Button type="button" variant={formData.isOnline ? "default" : "outline"} className={formData.isOnline ? "bg-gradient-to-r from-mystical-500 to-accent-500 text-white" : ""} onClick={() => setFormData(p=>({...p, isOnline:true}))}>Онлайн</Button>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="date" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                  {t.selectDate}
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={"w-full justify-start text-left font-normal dark:bg-background dark:border-mystical-700 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0" + (formData.date ? "" : " text-muted-foreground")}
                    >
                      {formData.date ? format(new Date(formData.date), "yyyy-MM-dd") : t.selectDate}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={date => {
                        if (date) handleInputChange("date", format(date, "yyyy-MM-dd"));
                        setCalendarOpen(false);
                      }}
                      disabled={date => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                  {t.selectTime}
                </Label>
                <div ref={timeBoxRef} className="dark:bg-background dark:border-mystical-700 border rounded-md">
                  {!timeInlineOpen ? (
                    <button
                      type="button"
                      className="w-full h-10 px-3 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0"
                      onClick={() => setTimeInlineOpen(true)}
                      aria-haspopup="listbox"
                      aria-expanded={timeInlineOpen}
                    >
                      <span className="text-sm select-none">{formData.time || "--:--"}</span>
                    </button>
                  ) : (
                    <div className="p-0 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Select value={selectedHour} onValueChange={(v) => { setSelectedHour(v); setSelectedMinute(""); }}>
                          <SelectTrigger className="h-9 border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0">
                              <SelectValue placeholder="Година" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {generateAllowedHours().map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Select value={selectedMinute} onValueChange={(v) => { setSelectedMinute(v); setTimeInlineOpen(false); }} disabled={!selectedHour}>
                          <SelectTrigger className="h-9 border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0" disabled={!selectedHour}>
                              <SelectValue placeholder="Хвилини" />
                  </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {selectedHour && generateAllowedMinutesForHour(selectedHour).map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                              {selectedHour && generateAllowedMinutesForHour(selectedHour).length === 0 && (
                                <div className="px-2 py-1 text-xs text-muted-foreground">Немає доступних хвилин</div>
                    )}
                  </SelectContent>
                </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {workingStart && workingEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Робочі години: {workingStart}–{workingEnd}
                  </p>
                )}
              </div>
            </div>

            

            {/* Comments */}
            <div>
              <Label htmlFor="notes" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                {t.comments}
              </Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder={t.commentsPlaceholder}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="dark:bg-background dark:border-mystical-700 focus:outline-none focus:ring-0 focus-visible:ring-0"
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <Button 
                type="submit" 
                disabled={createAppointmentMutation.isPending}
                className="bg-gradient-to-r from-mystical-500 to-accent-500 text-white px-8 py-3 hover:from-mystical-600 hover:to-accent-600 shadow-lg transform hover:scale-105 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {createAppointmentMutation.isPending ? (
                  <LoadingSpinner size="sm" text={t.processing || "Processing..."} horizontal />
                ) : (
                  t.bookAppointment || "Book appointment"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </main>
  );
};

export default Booking;
