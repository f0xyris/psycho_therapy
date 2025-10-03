// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX,
  Search,
  Crown,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Star,
  Trash2,
  Plus,
  Image as ImageIcon,
  Tag,
  ChevronDown,
  Mail,
  Loader2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useEffect } from "react";
import { useRef } from "react";
import { useState as useReactState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import React from "react";

const Admin = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tabValue, setTabValue] = useState("users");
  // Working hours state
  const [workingStart, setWorkingStart] = useState<string>("");
  const [workingEnd, setWorkingEnd] = useState<string>("");
  const [workingLoading, setWorkingLoading] = useState<boolean>(false);
  const [hasExistingHours, setHasExistingHours] = useState<boolean>(false);
  const [editWorking, setEditWorking] = useState<boolean>(false);
  const workingStartRef = useRef<HTMLInputElement | null>(null);
  const workingEndRef = useRef<HTMLInputElement | null>(null);
  
  // Admin appointment creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    serviceId: "",
    date: "",
    time: "",
    notes: "",
    clientName: ""
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Restore last selected date on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_calendar_selected_date');
      if (saved) {
        const dt = new Date(saved);
        if (!Number.isNaN(dt.getTime())) setSelectedDate(dt);
      }
    } catch {}
  }, []);

  // Update form date when selected date changes
  useEffect(() => {
    if (selectedDate) {
      // Format date in local timezone to avoid timezone conversion issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      try { localStorage.setItem('admin_calendar_selected_date', selectedDate.toISOString()); } catch {}

      setCreateFormData(prev => ({
        ...prev,
        date: formattedDate
      }));
      // Load working hours for selected date
      const token = localStorage.getItem('auth_token');
      setWorkingLoading(true);
      fetch(`/api/working-hours?date=${formattedDate}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      })
        .then(r => r.json())
        .then((data) => {
          const start = data?.startTime || "";
          const end = data?.endTime || "";
          setWorkingStart(start);
          setWorkingEnd(end);
          setHasExistingHours(Boolean(start && end));
          setEditWorking(false);
        })
        .catch(() => {
          setWorkingStart("");
          setWorkingEnd("");
        })
        .finally(() => setWorkingLoading(false));
    }
  }, [selectedDate]);

  // Demo banner
  const isDemo = (currentUser as any)?.isDemo === true;

  // --- Отзывы ---
  const [reviewsTab, setReviewsTab] = useReactState<{ loading: boolean, data: any[] }>({ loading: true, data: [] });
  const [approving, setApproving] = useReactState<number | null>(null);
  const fetchReviews = (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setReviewsTab(r => ({ ...r, loading: true }));
    const token = localStorage.getItem('auth_token');
    // В админке запрашиваем полный список
    fetch("/api/reviews/all", { 
      credentials: "include",
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => {
        return res.json();
      })
      .then(data => {
        setReviewsTab(prev => ({ loading: false, data }));
      })
      .catch((error) => {
        setReviewsTab({ loading: false, data: [] });
      });
  };
  useEffect(() => { fetchReviews(); }, []);
  const approveReview = async (id: number) => {
    setApproving(id);
    // Optimistic UI update
    const previous = reviewsTab.data;
    setReviewsTab(r => ({ ...r, data: r.data.map(rv => rv.id === id ? { ...rv, status: 'approved' } : rv) }));
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/reviews?id=${id}`, { 
      method: "PUT", 
      credentials: "include",
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status: 'approved' })
    });
    // Silent refresh to avoid flicker
    fetchReviews({ silent: true });
    setApproving(null);
  };

  const rejectReview = async (id: number) => {
    setApproving(id);
    try {
      const token = localStorage.getItem('auth_token');
      // Optimistic remove
      const previous = reviewsTab.data;
      setReviewsTab(r => ({ ...r, data: r.data.filter(rv => rv.id !== id) }));
      // По пожеланию: отклонённые отзывы сразу удаляем
      const res = await fetch(`/api/reviews?id=${id}`, { 
        method: "DELETE", 
        credentials: "include",
        headers: { 
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok && res.status !== 204) {
        // Rollback on error
        setReviewsTab(r => ({ ...r, data: previous }));
        alert('Error: ' + res.status);
      } else {
        // Silent refresh to keep in sync, no flicker
        fetchReviews({ silent: true });
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Network or JS error: ' + err);
    }
    setApproving(null);
  };

  const [openDialogId, setOpenDialogId] = useState<number | null>(null);
  const [openDeleteAppointmentDialogId, setOpenDeleteAppointmentDialogId] = useState<number | null>(null);
  const deleteReview = async (id: number) => {
    setApproving(id);
    try {
      const token = localStorage.getItem('auth_token');
      // Optimistic remove
      const previous = reviewsTab.data;
      setReviewsTab(r => ({ ...r, data: r.data.filter(rv => rv.id !== id) }));
      const res = await fetch(`/api/reviews?id=${id}`, { 
        method: "DELETE", 
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok || res.status === 204) {
        toast({ title: t.success, description: t.reviewDeleted });
        // Silent refresh after success
        fetchReviews({ silent: true });
      } else {
        // Rollback and notify
        setReviewsTab(r => ({ ...r, data: previous }));
        toast({ title: t.error, description: t.reviewDeleteError, variant: "destructive" });
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: t.error, description: t.reviewDeleteError, variant: "destructive" });
    }
    setApproving(null);
    setOpenDialogId(null);
  };

  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/users", {
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      return data;
    },
    enabled: !!(currentUser && (currentUser as any).isAdmin || (currentUser as any)?.isDemo),
  });

  // Fetch appointments
  const { data: appointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/appointments", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      const data = await response.json();
      return data;
    },
    enabled: !!(currentUser && (currentUser as any).isAdmin || (currentUser as any)?.isDemo),
    staleTime: 10 * 1000, // 10 секунд - данные считаются свежими только 10 секунд
    refetchOnWindowFocus: true, // Обновляем при фокусе окна
    refetchOnMount: true, // Обновляем при монтировании
  });

  // Update appointment status mutation with optimistic updates
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/appointments?id=${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update appointment status");
      }
      return response.json();
    },
    onMutate: async ({ appointmentId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/appointments"] });
      await queryClient.cancelQueries({ queryKey: ["/api/appointments/recent"] });
      await queryClient.cancelQueries({ queryKey: ["/api/appointments/user"] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueryData(["/api/appointments"]);
      const previousRecentAppointments = queryClient.getQueryData(["/api/appointments/recent"]);
      const previousUserAppointments = queryClient.getQueryData(["/api/appointments/user"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/appointments"], (old: any) => {
        if (!old) return old;
        return old.map((appointment: any) =>
          appointment.id === appointmentId ? { ...appointment, status } : appointment
        );
      });

      queryClient.setQueryData(["/api/appointments/recent"], (old: any) => {
        if (!old) return old;
        return old.map((appointment: any) =>
          appointment.id === appointmentId ? { ...appointment, status } : appointment
        );
      });

      queryClient.setQueryData(["/api/appointments/user"], (old: any) => {
        if (!old) return old;
        return old.map((appointment: any) =>
          appointment.id === appointmentId ? { ...appointment, status } : appointment
        );
      });

      // Return a context object with the snapshotted value
      return { previousAppointments, previousRecentAppointments, previousUserAppointments };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAppointments) {
        queryClient.setQueryData(["/api/appointments"], context.previousAppointments);
      }
      if (context?.previousRecentAppointments) {
        queryClient.setQueryData(["/api/appointments/recent"], context.previousRecentAppointments);
      }
      if (context?.previousUserAppointments) {
        queryClient.setQueryData(["/api/appointments/user"], context.previousUserAppointments);
      }
      
      toast({
        title: t.error,
        description: t.appointmentStatusUpdateFailed,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/by-date"] });
    },
    onSuccess: () => {
      toast({
        title: t.success,
        description: t.appointmentStatusUpdated,
      });
    },
  });

  // Delete appointment mutation with optimistic updates
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/appointments?id=${appointmentId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }
    },
    onMutate: async (appointmentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/appointments"] });
      await queryClient.cancelQueries({ queryKey: ["/api/appointments/recent"] });
      await queryClient.cancelQueries({ queryKey: ["/api/appointments/user"] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueryData(["/api/appointments"]);
      const previousRecentAppointments = queryClient.getQueryData(["/api/appointments/recent"]);
      const previousUserAppointments = queryClient.getQueryData(["/api/appointments/user"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/appointments"], (old: any) => {
        if (!old) return old;
        return old.filter((appointment: any) => appointment.id !== appointmentId);
      });

      queryClient.setQueryData(["/api/appointments/recent"], (old: any) => {
        if (!old) return old;
        return old.filter((appointment: any) => appointment.id !== appointmentId);
      });

      queryClient.setQueryData(["/api/appointments/user"], (old: any) => {
        if (!old) return old;
        return old.filter((appointment: any) => appointment.id !== appointmentId);
      });

      // Return a context object with the snapshotted value
      return { previousAppointments, previousRecentAppointments, previousUserAppointments };
    },
    onError: (err, appointmentId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAppointments) {
        queryClient.setQueryData(["/api/appointments"], context.previousAppointments);
      }
      if (context?.previousRecentAppointments) {
        queryClient.setQueryData(["/api/appointments/recent"], context.previousRecentAppointments);
      }
      if (context?.previousUserAppointments) {
        queryClient.setQueryData(["/api/appointments/user"], context.previousUserAppointments);
      }
      
      toast({
        title: t.error,
        description: t.appointmentDeleteError,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/by-date"] });
    },
    onSuccess: () => {
      setOpenDeleteAppointmentDialogId(null);
      toast({
        title: t.success,
        description: t.appointmentDeleted,
      });
    },
  });

  const handleUpdateAppointmentStatus = (appointmentId: number, status: string) => {
    updateAppointmentStatusMutation.mutate({ appointmentId, status });
  };

  const handleDeleteAppointment = (appointmentId: number) => {
    setOpenDeleteAppointmentDialogId(appointmentId);
  };

  const confirmDeleteAppointment = () => {
    if (openDeleteAppointmentDialogId) {
      deleteAppointmentMutation.mutate(openDeleteAppointmentDialogId);
      setOpenDeleteAppointmentDialogId(null);
    }
  };

  // Admin appointment creation functions
  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
  };

  const isTimeInPast = (time: string) => {
    if (!createFormData.date) return false;
    const [year, month, day] = createFormData.date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const selectedDateTime = new Date(year, month - 1, day, hour, minute, 0);
    const now = new Date();
    return selectedDateTime <= now;
  };

  const isTimeSlotBooked = (time: string) => {
    if (!filteredBookedAppointments || !createFormData.date) return false;
    
    const [year, month, day] = createFormData.date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const selectedDateTime = new Date(year, month - 1, day, hour, minute, 0);
    
    return filteredBookedAppointments.some((appointment: any) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.getTime() === selectedDateTime.getTime() && 
             appointment.status !== 'cancelled' && 
             appointment.status !== 'completed' &&
             !appointment.isDeletedFromAdmin;
    });
  };

  // Create appointment mutation for admin with optimistic updates
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }

      const created = await response.json();
      // Persist demo appointment locally to reflect in UI
      if (isDemo && typeof window !== 'undefined' && created?.demo) {
        const local = JSON.parse(localStorage.getItem('demo_appointments_recent') || '[]');
        const createdObj = { ...created };
        const updated = Array.isArray(local) ? [createdObj, ...local] : [createdObj];
        localStorage.setItem('demo_appointments_recent', JSON.stringify(updated));
      }

      return created;
    },
    onMutate: async (appointmentData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/appointments"] });
      await queryClient.cancelQueries({ queryKey: ["/api/appointments/recent"] });
      await queryClient.cancelQueries({ queryKey: ["/api/appointments/user"] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueryData(["/api/appointments"]);
      const previousRecentAppointments = queryClient.getQueryData(["/api/appointments/recent"]);
      const previousUserAppointments = queryClient.getQueryData(["/api/appointments/user"]);

      // Create optimistic appointment object
      const optimisticAppointment = {
        id: Date.now(), // Temporary ID
        serviceId: appointmentData.serviceId,
        appointmentDate: appointmentData.appointmentDate,
        status: appointmentData.status || "confirmed",
        notes: appointmentData.notes,
        createdAt: new Date().toISOString(),
        user: {
          firstName: appointmentData.clientInfo?.name || "Client",
          lastName: "",
          email: ""
        },
        service: {
          name: "Loading..." // Will be updated when data refetches
        },
        isOptimistic: true // Flag to identify optimistic updates
      };

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/appointments"], (old: any) => {
        if (!old) return [optimisticAppointment];
        return [optimisticAppointment, ...old];
      });

      queryClient.setQueryData(["/api/appointments/recent"], (old: any) => {
        if (!old) return [optimisticAppointment];
        return [optimisticAppointment, ...old];
      });

      // Return a context object with the snapshotted value
      return { previousAppointments, previousRecentAppointments, previousUserAppointments };
    },
    onError: (err, appointmentData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAppointments) {
        queryClient.setQueryData(["/api/appointments"], context.previousAppointments);
      }
      if (context?.previousRecentAppointments) {
        queryClient.setQueryData(["/api/appointments/recent"], context.previousRecentAppointments);
      }
      if (context?.previousUserAppointments) {
        queryClient.setQueryData(["/api/appointments/user"], context.previousUserAppointments);
      }
      
      toast({
        title: t.error,
        description: t.appointmentError || "Failed to create appointment",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", createFormData.date] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/by-date"] });
    },
    onSuccess: (data) => {
      // Reset form
      setCreateFormData({
        serviceId: "",
        date: "",
        time: "",
        notes: "",
        clientName: ""
      });
      setShowCreateForm(false);
      
      toast({
        title: t.success,
        description: t.appointmentCreated || "Appointment created successfully",
      });
    },
  });

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin can create appointments with any data - no validation needed
    if (!createFormData.serviceId) {
      toast({
        title: t.error || "Error",
        description: "Please select a service",
        variant: "destructive",
      });
      return;
    }

    // Create appointment date - use current date/time if not specified
    let appointmentDateTime;
    if (createFormData.date && createFormData.time) {
      // Create date in local timezone to avoid timezone conversion issues
      const [year, month, day] = createFormData.date.split('-').map(Number);
      const [hour, minute] = createFormData.time.split(':').map(Number);
      appointmentDateTime = new Date(year, month - 1, day, hour, minute, 0);
      
      // Check if the selected time is in the past
      if (appointmentDateTime <= new Date()) {
        toast({
          title: t.error || "Error",
          description: t.pastTimeError || "Cannot book appointments in the past",
          variant: "destructive",
        });
        return;
      }
      
      // Check if the time slot is booked
      if (isTimeSlotBooked(createFormData.time)) {
        toast({
          title: t.error || "Error",
          description: t.timeSlotAlreadyBooked || "This time slot is already booked",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Use current date/time if not specified
      appointmentDateTime = new Date();
    }
    
    // Format the date to ensure it's sent as the intended local date
    if (!createFormData.date || !createFormData.time) {
      toast({
        title: t.error || "Error",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }
    
    const formattedDate = `${createFormData.date}T${createFormData.time}:00.000Z`;
    
    // Validate the formatted date
    const testDate = new Date(formattedDate);
    if (isNaN(testDate.getTime())) {
      toast({
        title: t.error || "Error",
        description: "Invalid date format",
        variant: "destructive",
      });
      return;
    }
    
    const appointmentData = {
      serviceId: parseInt(createFormData.serviceId),
      appointmentDate: formattedDate,
      notes: createFormData.notes || null,
      status: "confirmed", // Admin creates confirmed appointments
      clientInfo: {
        name: createFormData.clientName || "Client without name"
      }
    };



    createAppointmentMutation.mutate(appointmentData);
  };

  // Fetch recent appointments with faster refresh settings
  const { data: recentAppointments, isLoading: recentLoading, refetch: refetchRecentAppointments } = useQuery({
    queryKey: ["/api/appointments/recent"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/appointments/recent", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch recent appointments");
      }
      const data = await response.json();
      if (isDemo && typeof window !== 'undefined') {
        try {
          const local = JSON.parse(localStorage.getItem('demo_appointments_recent') || '[]');
          if (Array.isArray(local) && local.length > 0) {
            return [...local, ...data];
          }
        } catch {}
      }
      return data;
    },
    staleTime: 10 * 1000, // 10 секунд - данные считаются свежими только 10 секунд
    refetchOnWindowFocus: true, // Обновляем при фокусе окна
    refetchOnMount: true, // Обновляем при монтировании
  });

  // Fetch services for admin appointment creation
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/services", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      // In demo mode, merge server data with locally created demo services
      if (isDemo && typeof window !== 'undefined') {
        try {
          const local = JSON.parse(localStorage.getItem('demo_services') || '[]');
          if (Array.isArray(local) && local.length > 0) {
            return [...data, ...local];
          }
        } catch {}
      }
      return data;
    }
  });

  // Get booked appointments for the selected date in admin form - pre-fetch all appointments
  const { data: bookedAppointments } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/appointments", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const appointments = await response.json();
      return appointments;
    },
    staleTime: 5 * 1000, // 5 seconds - very fresh data for booking
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Filter booked appointments for the selected date
  const filteredBookedAppointments = React.useMemo(() => {
    if (!bookedAppointments || !createFormData.date) return [];
    
    const selectedDate = new Date(createFormData.date);
    return bookedAppointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.toDateString() === selectedDate.toDateString();
    });
  }, [bookedAppointments, createFormData.date]);

  // Update admin status mutation
  const updateAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}/admin`, { isAdmin });
      return response.json();
    },
    onMutate: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      const previousUsers = queryClient.getQueryData<any[]>(["/api/users"]);
      queryClient.setQueryData(["/api/users"], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((u: any) => (u.id === userId ? { ...u, isAdmin } : u));
      });
      return { previousUsers } as { previousUsers?: any[] };
    },
    onSuccess: () => {
      toast({
        title: t.success || t.adminStatusUpdated || "Success",
        description: t.adminStatusUpdated || "Admin status updated",
      });
    },
    onError: (error, _vars, context) => {
      if (context && context.previousUsers) {
        queryClient.setQueryData(["/api/users"], context.previousUsers);
      }
      toast({
        title: t.error || t.adminStatusUpdateFailed || "Error",
        description: t.adminStatusUpdateFailed || "Failed to update admin status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  // Preserve visual order of users (stable ordering by first loaded sequence)
  const [userOrder, setUserOrder] = useState<number[]>([]);
  React.useEffect(() => {
    if (!users || users.length === 0) return;
    setUserOrder(prev => {
      if (!prev || prev.length === 0) {
        return users.map(u => u.id);
      }
      // Append any new user ids at the end, keep existing order intact
      const existing = new Set(prev);
      const additions = users.map(u => u.id).filter(id => !existing.has(id));
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [users]);

  const orderedUsers = React.useMemo(() => {
    if (!users || users.length === 0) return [] as any[];
    if (!userOrder || userOrder.length === 0) return users;
    const indexById = new Map<number, number>(userOrder.map((id, idx) => [id, idx]));
    const known = users.filter(u => indexById.has(u.id)).sort((a, b) => (indexById.get(a.id)! - indexById.get(b.id)!));
    const unknown = users.filter(u => !indexById.has(u.id));
    return [...known, ...unknown];
  }, [users, userOrder]);

  // Filter users based on search term but keep stable order
  const filteredUsers = orderedUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = users?.filter(user => user.isAdmin).length || 0;
  const totalUsers = users?.length || 0;

  const allowAdmin = !!(currentUser && ((currentUser as any).isAdmin || (currentUser as any).isDemo));

  if (!allowAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100 dark:from-sage-900 dark:to-sage-800">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
              {t.accessDenied || "Access denied"}
            </h2>
            <p className="text-muted-foreground">
              {t.adminAccessRequired || "Admin access required"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400">
              {t.errorLoadingUsers || "Failed to load users"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="admin-page min-h-[calc(100vh-64px)] flex items-center justify-center px-2 sm:px-4 lg:px-8 py-4 sm:py-8 dark:bg-deep-900 overflow-x-hidden">
      <div className="max-w-7xl w-full">
        {isDemo && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-4 py-3">
            <p className="text-sm">
              Demo mode: data is masked and changes are not saved.
            </p>
          </div>
        )}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-xl sm:text-3xl font-bold text-mystical-500 dark:text-mystical-400 mb-2 sm:mb-4">
            {t.adminTitle || "Admin Panel"}
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground text-xs sm:text-base">
            {t.userManagement || "User management"}
          </p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-mystical-500 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="text-white h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {t.totalUsers}
                </p>
                <p className="text-2xl font-bold text-mystical-500 dark:text-mystical-400">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                <Crown className="text-white h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {t.admin}
                </p>
                <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <UserCheck className="text-white h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {t.regularUsers}
                </p>
                <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{totalUsers - adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        {/* Мобильный select теперь md:hidden */}
        <div className="md:hidden mb-2 relative cursor-pointer">
          <select
            className="select-open w-full cursor-pointer rounded-lg border border-mystical-200 dark:border-mystical-700 bg-background dark:bg-card py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-mystical-400 pr-10 appearance-none"
            value={tabValue}
            onChange={e => setTabValue(e.target.value)}
          >
            <option value="users">{t.userManagement}</option>
            <option value="appointments">{t.appointments || "Appointments"}</option>
            <option value="calendar">{t.calendar || "Calendar"}</option>
            <option value="reviews">{t.reviewsTab || "Client reviews"}</option>
            <option value="prices">{t.pricesTab || "Prices & duration"}</option>
          </select>
          <ChevronDown className="chevron absolute right-3 top-[20%] w-7 h-7 text-mystical-500 pointer-events-none transition-transform duration-200" />
        </div>
        {/* TabsList только для md+ */}
        <TabsList className="admin-tabs-nav hidden md:flex md:flex-row w-full gap-1 md:gap-2 mb-2 md:mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabsTrigger value="users" className="flex items-center gap-2 px-2 py-2 sm:py-3 text-xs sm:text-base whitespace-nowrap data-[state=active]:text-mystical-600 dark:data-[state=active]:text-mystical-100">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-mystical-600 data-[state=active]:!text-white hidden lg:inline" />
            {t.userManagement}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2 px-2 py-2 sm:py-3 text-xs sm:text-base whitespace-nowrap">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-mystical-600 data-[state=active]:!text-white hidden lg:inline" />
            {t.appointments || "Appointments"}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2 px-2 py-2 sm:py-3 text-xs sm:text-base whitespace-nowrap">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-mystical-600 data-[state=active]:!text-white hidden lg:inline" />
            {t.calendar || "Calendar"}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2 px-2 py-2 sm:py-3 text-xs sm:text-base whitespace-nowrap">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-mystical-600 data-[state=active]:!text-white hidden lg:inline" />
            {t.reviewsTab || "Client reviews"}
          </TabsTrigger>
          <TabsTrigger value="prices" className="flex items-center gap-2 px-2 py-2 sm:py-3 text-xs sm:text-base whitespace-nowrap">
            <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-mystical-600 data-[state=active]:!text-white hidden lg:inline" />{t.pricesTab || "Prices & duration"}
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users">
          <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-mystical-500 dark:text-mystical-400 flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t.userManagement}
              </CardTitle>
              <CardDescription>
                {t.userManagement}
              </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[360px] sm:min-h-[420px]">
          {/* Search */}
          <div className="mb-4 sm:mb-6">
            <Label htmlFor="search" className="sr-only">
              {t.searchUsers}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mystical-500" />
              <Input
                id="search"
                placeholder={t.searchUsers || "Search users..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input search-input-light dark:bg-background dark:text-white dark:placeholder:text-muted-foreground border border-mystical-200 dark:border-input shadow-sm"
              />
            </div>
          </div>

          {/* Users List: адаптивный рендеринг */}
          {/* Мобильный список пользователей */}
          <div className="block sm:hidden space-y-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-lg border bg-card p-3 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-3">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.firstName || user.email} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-mystical-500 rounded-full flex items-center justify-center text-white">
                      <span className="text-white text-sm font-medium">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-mystical-700 dark:text-mystical-300">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.email
                      }
                    </div>
                    <div className="text-xs text-muted-foreground break-all">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.isAdmin ? "default" : "secondary"} className="flex items-center gap-1 w-8 sm:w-[120px] justify-center px-0">
                    {user.isAdmin ? (
                      <Crown className="h-3 w-3" />
                    ) : (
                      <UserCheck className="h-3 w-3" />
                    )}
                  </Badge>
                  <Switch
                    checked={user.isAdmin ?? false}
                    onCheckedChange={(checked) => {
                      updateAdminMutation.mutate({ userId: user.id, isAdmin: checked ?? false });
                    }}
                    disabled={updateAdminMutation.isPending || user.id === currentUser.id}
                  />
                  {user.id === currentUser.id && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">(You)</span>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-6">
                <UserX className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-xs">{t.noUsersFound || "No users found"}</p>
              </div>
            )}
          </div>

          {/* Users Table: только для >=sm */}
          {/* Таблица пользователей для >=sm */}
          <div className="hidden sm:block min-w-0">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-mystical-200 dark:border-mystical-700">
                  <th className="text-left py-2 sm:py-3 text-mystical-500 dark:text-mystical-400 font-semibold">
                    {t.user}
                  </th>
                  <th className="text-left py-2 sm:py-3 text-mystical-500 dark:text-mystical-400 font-semibold">
                    {t.email}
                  </th>
                  <th className="text-left py-2 sm:py-3 text-mystical-500 dark:text-mystical-400 font-semibold">
                    {t.role}
                  </th>
                  <th className="text-left py-2 sm:py-3 text-mystical-500 dark:text-mystical-400 font-semibold w-[140px]">
                    {t.adminAccess}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-mystical-100 dark:border-mystical-800">
                    <td className="py-4 text-mystical-700 dark:text-mystical-300">
                      <div className="flex items-center space-x-3">
                        {user.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt={user.firstName || user.email} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-mystical-500 rounded-full flex items-center justify-center text-white">
                            <span className="text-white text-sm font-medium">
                              {(user.firstName ? user.firstName.charAt(0) : user.email.charAt(0)).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                          </div>
                          {user.firstName && user.lastName ? (
                            <div className="text-sm text-muted-foreground break-all">{user.email}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-mystical-700 dark:text-mystical-300 break-all">{user.email}</td>
                    <td className="py-4">
                      <Badge variant={user.isAdmin ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                        {user.isAdmin ? (
                          <Crown className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                      </Badge>
                    </td>
                    <td className="py-4 w-[140px]">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.isAdmin ?? false}
                          onCheckedChange={(checked) => {
                            updateAdminMutation.mutate({ userId: user.id, isAdmin: checked ?? false });
                          }}
                          disabled={isDemo || updateAdminMutation.isPending || user.id === currentUser.id}
                        />
                        {user.id === currentUser.id && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            (You)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-6">
                <UserX className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-xs">{t.noUsersFound || "No users found"}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>

    {/* Appointments Tab */}
    <TabsContent value="appointments">
      <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-mystical-500 dark:text-mystical-400 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t.appointments}
          </CardTitle>
          <CardDescription>
            {t.appointments}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[360px] sm:min-h-[420px]">
          {recentLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentAppointments?.map((appointment: any) => (
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-mystical-500 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {appointment.user?.firstName && appointment.user?.lastName 
                          ? `${appointment.user.firstName} ${appointment.user.lastName}`
                          : appointment.user?.email || appointment.clientName || t.unknownClient || "Unknown Client"
                        }
                        {appointment.isOnline !== undefined && (
                          <Badge variant={appointment.isOnline ? 'secondary' : 'outline'}>
                            {appointment.isOnline ? 'Онлайн' : 'Офлайн'}
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {typeof appointment.service?.name === 'object' ? 
                          (appointment.service.name.ua || t.service) : 
                          (appointment.service?.name || t.service)
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at {new Date(appointment.appointmentDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <Badge variant={
                      appointment.status === 'completed' ? 'default' :
                      appointment.status === 'confirmed' ? 'secondary' :
                      appointment.status === 'cancelled' ? 'destructive' :
                      'outline'
                    }>
                      {appointment.status === 'completed' ? t.completed :
                       appointment.status === 'confirmed' ? t.confirmed :
                       appointment.status === 'cancelled' ? t.cancelled :
                       t.pending}
                    </Badge>
                    {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        disabled={deleteAppointmentMutation.isPending}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {appointment.status === 'pending' && (
                      <div className="flex flex-wrap gap-1 w-full sm:w-auto justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                          disabled={isDemo || updateAppointmentStatusMutation.isPending}
                          className="h-8 px-2 text-xs"
                        >
                          {t.confirmAppointment}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                          disabled={isDemo || updateAppointmentStatusMutation.isPending}
                          className="h-8 px-2 text-xs"
                        >
                          {t.rejectAppointment}
                        </Button>
                      </div>
                    )}
                    {appointment.status === 'confirmed' && (
                      <div className="flex flex-wrap gap-1 w-full sm:w-auto justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                          disabled={isDemo || updateAppointmentStatusMutation.isPending}
                          className="h-8 px-2 text-xs"
                        >
                          {t.completeAppointment}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                          disabled={isDemo || updateAppointmentStatusMutation.isPending}
                          className="h-8 px-2 text-xs"
                        >
                          {t.cancelAppointment}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!recentAppointments || recentAppointments.length === 0) && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {t.noAppointments}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>

    {/* Calendar Tab */}
    <TabsContent value="calendar">
      <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-mystical-500 dark:text-mystical-400 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t.calendar || "Calendar"}
          </CardTitle>
          {t.calendarDesc && (
            <CardDescription>{t.calendarDesc}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="min-h-[360px] sm:min-h-[420px]">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {selectedDate ? 
                    `${t.appointmentsFor} ${selectedDate.toLocaleDateString()}` :
                    t.selectDate
                  }
                </h3>
                {selectedDate && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-mystical-500 to-accent-500 text-white hover:from-mystical-600 hover:to-accent-600"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t.add || "Add"} {t.appointment}
                    </Button>
                  </div>
                )}
              </div>
              {selectedDate && (
                <div className="p-3 border rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{t.workingHoursForDay || "Робочі години на день"}</p>
                    {hasExistingHours && !editWorking && (
                      <Button size="sm" variant="outline" onClick={() => setEditWorking(true)}>
                        {t.edit || 'Редагувати'}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-end max-w-sm">
                    {/** Determine if inputs are immutable (view mode) */}
                    {/** Click opens picker only in edit mode */}
                    <div>
                      <Label className="text-xs">{t.start || "Start"}</Label>
                      <Input
                        ref={workingStartRef as any}
                        type="time"
                        value={workingStart}
                        onChange={e => setWorkingStart(e.target.value)}
                        onClick={() => { if (!(hasExistingHours && !editWorking)) { try { (workingStartRef.current as any)?.showPicker?.(); } catch {} } }}
                        readOnly={hasExistingHours && !editWorking}
                        className={hasExistingHours && !editWorking ? 'cursor-default' : ''}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t.end || "End"}</Label>
                      <Input
                        ref={workingEndRef as any}
                        type="time"
                        value={workingEnd}
                        onChange={e => setWorkingEnd(e.target.value)}
                        onClick={() => { if (!(hasExistingHours && !editWorking)) { try { (workingEndRef.current as any)?.showPicker?.(); } catch {} } }}
                        readOnly={hasExistingHours && !editWorking}
                        className={hasExistingHours && !editWorking ? 'cursor-default' : ''}
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={workingLoading || !createFormData.date || !workingStart || !workingEnd || (hasExistingHours && !editWorking)}
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('auth_token');
                            const res = await fetch('/api/working-hours', {
                              method: 'POST',
                              credentials: 'include',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({ date: createFormData.date, startTime: workingStart, endTime: workingEnd })
                            });
                            if (!res.ok) throw new Error('Save failed');
                            setHasExistingHours(true);
                            setEditWorking(false);
                            // Re-fetch to ensure persistence
                            setWorkingLoading(true);
                            fetch(`/api/working-hours?date=${createFormData.date}`, {
                              credentials: 'include',
                              headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                            }).then(r => r.json()).then((d) => {
                              if (d?.startTime && d?.endTime) {
                                setWorkingStart(d.startTime);
                                setWorkingEnd(d.endTime);
                              }
                            }).finally(() => setWorkingLoading(false));
                            toast({ title: t.success || 'Success', description: (t.saved || 'Збережено') });
                          } catch (e) {
                            toast({ title: t.error || 'Error', description: t.saveError || 'Failed to save working hours', variant: 'destructive' });
                          }
                        }}
                      >
                        {hasExistingHours && !editWorking ? (t.saved || 'Збережено') : (editWorking ? (t.save || 'Save') : (t.save || 'Save'))}
                      </Button>
                      {hasExistingHours && editWorking && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditWorking(false); }}>
                          {t.cancel || 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selectedDate && appointments && (
                <div className="space-y-3">
                  {appointments
                    .filter((appointment: any) => {
                      const appointmentDate = new Date(appointment.appointmentDate);
                      return appointmentDate.toDateString() === selectedDate.toDateString();
                    })
                    .map((appointment: any) => (
                      <div key={appointment.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {appointment.user?.firstName && appointment.user?.lastName 
                                ? `${appointment.user.firstName} ${appointment.user.lastName}`
                                : appointment.user?.email || appointment.clientName || t.unknownClient || "Unknown Client"
                              }
                              {appointment.isOnline !== undefined && (
                                <Badge variant={appointment.isOnline ? 'secondary' : 'outline'}>
                                  {appointment.isOnline ? 'Онлайн' : 'Офлайн'}
                                </Badge>
                              )}
                            </p>
                            {appointment.clientName && (
                              <p className="text-xs text-muted-foreground">
                                {t.clientWithoutAccount || "Client without account"}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {typeof appointment.service?.name === 'object' ? 
                                (appointment.service.name.ua || t.service) : 
                                (appointment.service?.name || t.service)
                              }
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {new Date(appointment.appointmentDate).toLocaleTimeString()}
                            </p>
                            <div className="flex items-center gap-2 justify-end">
                              <Badge variant={
                                appointment.status === 'completed' ? 'default' :
                                appointment.status === 'confirmed' ? 'secondary' :
                                appointment.status === 'cancelled' ? 'destructive' :
                                'outline'
                              }>
                                {appointment.status === 'completed' ? t.completed :
                                 appointment.status === 'confirmed' ? t.confirmed :
                                 appointment.status === 'cancelled' ? t.cancelled :
                                 t.pending}
                              </Badge>
                              {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteAppointment(appointment.id)}
                                  disabled={deleteAppointmentMutation.isPending}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Action buttons for calendar appointments */}
                        {appointment.status === 'pending' && (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                              disabled={updateAppointmentStatusMutation.isPending}
                              className="h-8 px-2 text-xs"
                            >
                              {t.confirmAppointment}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                              disabled={updateAppointmentStatusMutation.isPending}
                              className="h-8 px-2 text-xs"
                            >
                              {t.rejectAppointment}
                            </Button>
                          </div>
                        )}
                        {appointment.status === 'confirmed' && (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                              disabled={updateAppointmentStatusMutation.isPending}
                              className="h-8 px-2 text-xs"
                            >
                              {t.completeAppointment}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                              disabled={updateAppointmentStatusMutation.isPending}
                              className="h-8 px-2 text-xs"
                            >
                              {t.cancelAppointment}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  {appointments.filter((appointment: any) => {
                    const appointmentDate = new Date(appointment.appointmentDate);
                    return appointmentDate.toDateString() === selectedDate.toDateString();
                  }).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      {t.noAppointmentsThisDay}
                    </p>
                  )}
                </div>
              )}

              {/* Create Appointment Form */}
              {showCreateForm && selectedDate && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {t.create || "Create"} {t.appointment}
                      </h4>
                      {createFormData.date && (
                        <p className="text-sm text-muted-foreground">
                          {t.forDate || "For date"}: {new Date(createFormData.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <form onSubmit={handleCreateAppointment} className="space-y-4">
                    {/* Client Information */}
                    <div>
                      <Label htmlFor="clientName" className="text-sm font-medium">
                        {t.name || "Name"}
                      </Label>
                      <Input
                        id="clientName"
                        value={createFormData.clientName}
                        onChange={(e) => handleCreateFormChange("clientName", e.target.value)}
                        placeholder={t.namePlaceholder || "Client name"}
                        className="mt-1"
                      />
                    </div>



                    {/* Service Selection */}
                    <div>
                      <Label htmlFor="service" className="text-sm font-medium">
                        {t.selectService || "Select Service"}
                      </Label>
                      {servicesLoading ? (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mystical-500"></div>
                        </div>
                      ) : (
                        <Select value={createFormData.serviceId} onValueChange={(value) => handleCreateFormChange("serviceId", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t.selectService || "Select Service"} />
                          </SelectTrigger>
                          <SelectContent>
                            {services?.map((service: any) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {String(service.name?.en || service.name?.ua)} - {service.price / 100} грн ({service.duration} {t.minutes})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Time Selection */}
                    <div>
                      <Label htmlFor="time" className="text-sm font-medium">
                        {t.selectTime || "Select Time"}
                      </Label>
                      <Select value={createFormData.time} onValueChange={(value) => handleCreateFormChange("time", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t.selectTime || "Select Time"} />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"
                          ].filter((time) => {
                            if (!workingStart || !workingEnd) return true;
                            const toMin = (t:string)=>{ const [h,m]=t.split(":").map(Number); return h*60+m; };
                            const v = toMin(time);
                            return v >= toMin(workingStart) && v <= toMin(workingEnd);
                          }).map((time) => (
                            !isTimeInPast(time) && !isTimeSlotBooked(time) ? (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ) : null
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium">
                        {t.comments || "Notes"}
                      </Label>
                      <Textarea
                        id="notes"
                        rows={3}
                        placeholder={t.commentsPlaceholder || "Additional notes..."}
                        value={createFormData.notes}
                        onChange={(e) => handleCreateFormChange("notes", e.target.value)}
                        className="mt-1"
                      />
                    </div>



                    {/* Submit Button */}
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={isDemo || createAppointmentMutation.isPending}
                        className="bg-gradient-to-r from-mystical-500 to-accent-500 text-white hover:from-mystical-600 hover:to-accent-600"
                      >
                        {createAppointmentMutation.isPending ? (
                          <LoadingSpinner size="sm" text={t.processing || "Processing..."} horizontal />
                        ) : (
                          t.create || "Create"
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        {t.cancel || "Cancel"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>

    {/* Reviews Tab */}
    <TabsContent value="reviews">
      <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-mystical-500 dark:text-mystical-400 flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t.reviewsTitle || "Reviews"}
          </CardTitle>
          <CardDescription>
            {t.moderationReviewsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[360px] sm:min-h-[420px]">
          {reviewsTab.loading ? (
            <div className="text-center py-8">{t.loadingReviews}</div>
          ) : reviewsTab.data.length === 0 ? (
            <div className="text-center py-8">{t.noReviews}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {reviewsTab.data.map((review) => (
                <Card
                  key={review.id}
                  className={`shadow-xl bg-white dark:bg-card border border-mystical-100 dark:border-deep-700 transition-all duration-300 ${review.status === 'rejected' ? 'opacity-60 line-through' : ''}`}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-mystical-600 to-accent-600 dark:from-mystical-500 dark:to-accent-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-mystical-200 dark:border-mystical-700">
                          {review.avatar ? (
                            <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-mystical-700 dark:text-white text-lg font-bold">
                              {review.name?.[0]?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-mystical-700 dark:text-mystical-400">{review.name}</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={i < review.rating ? 'fill-yellow-500 text-yellow-500 transition-colors' : 'text-gray-300 dark:text-gray-500 transition-colors'} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-mystical-700 dark:text-muted-foreground">"{review.comment}"</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {review.status === 'pending' && t.reviewStatusPending}
                        {review.status === 'published' && t.reviewStatusPublished}
                        {review.status === 'rejected' && t.reviewStatusRejected}
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex gap-2">
                      {review.status === 'pending' && (
                        <>
                          <Button
                            className="bg-mystical-500 hover:bg-mystical-600 text-white rounded-lg shadow-md transition-colors border-none"
                            disabled={approving === review.id}
                            onClick={() => approveReview(review.id)}
                          >
                            {approving === review.id ? t.reviewApproving : t.reviewApprove}
                          </Button>
                          <Button
                            className="bg-destructive hover:bg-destructive/80 text-white rounded-lg shadow-md transition-colors border-none"
                            disabled={approving === review.id}
                            onClick={() => rejectReview(review.id)}
                            variant="destructive"
                          >
                            {approving === review.id ? t.reviewRejecting : t.reviewReject}
                          </Button>
                        </>
                      )}
                      {(review.status === 'approved' || review.status === 'published' || review.status === 'rejected') && (
                        <AlertDialog open={openDialogId === review.id} onOpenChange={open => setOpenDialogId(open ? review.id : null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="bg-destructive hover:bg-destructive/80 text-white rounded-lg shadow-md transition-colors border-none ml-2"
                              disabled={approving === review.id}
                              onClick={e => { e.stopPropagation(); setOpenDialogId(review.id); }}
                              variant="destructive"
                            >
                              {approving === review.id ? t.reviewDeleting : t.reviewDelete}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>{t.reviewDelete}</AlertDialogTitle>
                            <AlertDialogDescription>{t.reviewDeleteConfirm}</AlertDialogDescription>
                            <div className="flex justify-end gap-2 mt-4">
                              <AlertDialogCancel asChild>
                                <Button variant="secondary" onClick={() => setOpenDialogId(null)}>{t.cancel}</Button>
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant="destructive"
                                  disabled={approving === review.id}
                                  onClick={() => deleteReview(review.id)}
                                >
                                  {approving === review.id ? t.reviewDeleting : t.reviewDelete}
                                </Button>
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>

    {/* Prices Tab */}
    <TabsContent value="prices">
      <Card className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-mystical-500 dark:text-mystical-400 flex items-center gap-2">
            <Tag className="w-4 h-4 mr-2" />{t.pricesTab || "Prices & duration"}
          </CardTitle>
          <CardDescription>
            {t.editPricesDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[360px] sm:min-h-[420px]">
          <PricesEditor />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

  {/* Delete Appointment Dialog */}
  <AlertDialog 
    open={openDeleteAppointmentDialogId !== null} 
    onOpenChange={(open) => !open && setOpenDeleteAppointmentDialogId(null)}
  >
    <AlertDialogContent>
      <AlertDialogTitle>{t.deleteAppointment}</AlertDialogTitle>
      <AlertDialogDescription>{t.deleteAppointmentConfirm}</AlertDialogDescription>
      <div className="flex justify-end gap-2 mt-4">
        <AlertDialogCancel asChild>
          <Button variant="secondary" onClick={() => setOpenDeleteAppointmentDialogId(null)}>
            {t.cancel}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            variant="destructive"
            disabled={deleteAppointmentMutation.isPending}
            onClick={confirmDeleteAppointment}
          >
            {deleteAppointmentMutation.isPending ? t.deleting : t.deleteAppointment}
          </Button>
        </AlertDialogAction>
      </div>
    </AlertDialogContent>
  </AlertDialog>
      </div>
    </main>
  );
};

export default Admin;

function PricesEditor() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const isDemo = (authUser as any)?.isDemo === true;
  const queryClient = useQueryClient();
  const [courses, setCourses] = useReactState<any[]>([]);
  const [services, setServices] = useReactState<any[]>([]);
  const [loading, setLoading] = useReactState(true);
  const [savingId, setSavingId] = useReactState<string | null>(null);
  const [addingService, setAddingService] = useReactState(false);
  const [newService, setNewService] = useReactState({ name: { ua: '' }, price: "", duration: "" });
  const [addingCourse, setAddingCourse] = useReactState(false);
  const [newCourse, setNewCourse] = useReactState({ name: { ua: '' }, price: "", duration: "", description: { ua: '' }, file: null as File | null, imageUrl: "", docFile: null as File | null, docUrl: "" });
  const [imagePreview, setImagePreview] = useReactState("");
  const [docName, setDocName] = useReactState("");
  const [editCourseFiles, setEditCourseFiles] = useReactState<Record<number, File | null>>({});
  const [editCoursePreviews, setEditCoursePreviews] = useReactState<Record<number, string>>({});
  const [openDeleteDialogId, setOpenDeleteDialogId] = useReactState(null);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  // Состояния для диалогов удаления
  const [openDeleteCourseDialogId, setOpenDeleteCourseDialogId] = useState<number | null>(null);
  const [openDeleteServiceDialogId, setOpenDeleteServiceDialogId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    Promise.all([
      fetch("/api/courses", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).then(r => r.json()).catch(() => []),
      fetch("/api/services", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).then(r => r.json()).catch(() => []),
    ]).then(([courses, services]) => {
      // Проверяем, что это массивы
      setCourses(Array.isArray(courses) ? courses : []);
      setServices(Array.isArray(services) ? services : []);
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching data:', error);
      setCourses([]);
      setServices([]);
      setLoading(false);
    });
  }, []);

  const handleSave = async (
    type: string,
    id: number,
    price: number,
    duration: number,
    name: any,
    description: any
  ) => {
    setSavingId(`${type}-${id}`);
    let uploadedImageUrl: string | null = null;
    let uploadedDocUrl: string | null = null;
    if (type === "course" && editCourseFiles[id]) {
      const formData = new FormData();
      formData.append("file", editCourseFiles[id] as File);
      const tokenUpload = localStorage.getItem('auth_token');
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        headers: tokenUpload ? { 'Authorization': `Bearer ${tokenUpload}` } : {},
        body: formData
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        uploadedImageUrl = data.url;
      } else {
        toast({ title: t.error || t.uploadError || "Error", description: t.uploadError || "Error uploading image", variant: "destructive" });
        setSavingId(null);
        return;
      }
    }
    if (type === "course" && editCourseFiles[`doc-${id}`]) {
      const formData = new FormData();
      formData.append("file", editCourseFiles[`doc-${id}`] as File);
      const tokenUpload = localStorage.getItem('auth_token');
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        headers: tokenUpload ? { 'Authorization': `Bearer ${tokenUpload}` } : {},
        body: formData
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        uploadedDocUrl = data.url;
      } else {
        toast({ title: t.error || t.uploadError || "Error", description: t.uploadError || "Error uploading document", variant: "destructive" });
        setSavingId(null);
        return;
      }
    }
    const token = localStorage.getItem('auth_token');
    const url = type === "course" ? `/api/courses/${id}` : `/api/services/${id}`;
    const body: any = { price: Number(price), duration: Number(duration) };
    if (name !== undefined) body.name = name;
    if (description !== undefined) body.description = description;
    if (uploadedImageUrl) body.imageUrl = uploadedImageUrl;
    if (uploadedDocUrl) body.docUrl = uploadedDocUrl;
    const res = await fetch(url, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: "include",
      body: JSON.stringify(body)
    });
    if (res.ok) {
      toast({ title: t.success || t.save || "Success", description: t.save || "Saved" });
      if (type === "course") {
        setCourses(courses => courses.map(c => c.id === id ? { ...c, price, duration, name, description, ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}) } : c));
        if (uploadedImageUrl || uploadedDocUrl) {
          setEditCourseFiles(m => ({ ...m, [id]: null }));
          setEditCoursePreviews(m => ({ ...m, [id]: "" }));
        }
      } else {
        setServices(services => services.map(s => s.id === id ? { ...s, price, duration, name, description } : s));
        // Invalidate services cache to update booking page
        queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      }
      // If backend responded with demo flag, persist to local demo store
      try {
        const data = await res.clone().json();
        if (data?.demo && type !== 'course') {
          const local = JSON.parse(localStorage.getItem('demo_services') || '[]');
          const updated = Array.isArray(local) ? local.map((s:any)=> s.id===id? { ...s, price, duration, name, description }: s) : [];
          localStorage.setItem('demo_services', JSON.stringify(updated));
        }
      } catch {}
    } else {
      toast({ title: t.error || t.saveError || "Error", description: t.saveError || "Error saving", variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleDeleteService = async (id: number) => {
    setSavingId(`delete-${id}`);
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/services/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (res.ok) {
      setServices(services => services.filter(s => s.id !== id));
      toast({ title: t.success || t.deleted || "Success", description: t.deleted || "Deleted" });
      // Invalidate services cache to update booking page
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    } else {
      toast({ title: t.error || t.deleteError || "Error", description: t.deleteError || "Error deleting", variant: "destructive" });
    }
    setSavingId(null);
    setOpenDeleteServiceDialogId(null);
  };

  const handleAddService = async () => {
    if (!newService.name?.ua || !newService.price || !newService.duration) {
      toast({ title: t.error || t.fillAllFields || "Error", description: t.fillAllFields || "Fill all fields", variant: "destructive" });
      return;
    }
    setSavingId("add-service");
    const token = localStorage.getItem('auth_token');
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: "include",
      body: JSON.stringify({
        name: newService.name,
        price: Math.round(parseFloat(newService.price) * 100),
        duration: Number(newService.duration),
        description: {}, // Placeholder for description
        category: "custom"
      })
    });
    if (res.ok) {
      const created = await res.json();
      setServices(services => [...services, created]);
      // If it is a demo object, store it locally to persist in UI between reloads
      if (created?.demo && typeof window !== 'undefined') {
        const local = JSON.parse(localStorage.getItem('demo_services') || '[]');
        const updated = Array.isArray(local) ? [...local, created] : [created];
        localStorage.setItem('demo_services', JSON.stringify(updated));
      }
      setNewService({ name: { ua: '' }, price: "", duration: "" });
      setAddingService(false);
      toast({ title: t.success || t.added || "Success", description: t.added || "Added" });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    } else {
      toast({ title: t.error || t.addError || "Error", description: t.addError || "Error adding", variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleDeleteCourse = async (id: number) => {
    setSavingId(`delete-course-${id}`);
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/courses/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (res.ok) {
      setCourses(courses => courses.filter(c => c.id !== id));
      toast({ title: t.success || t.deleted || "Success", description: t.deleted || "Deleted" });
    } else {
      toast({ title: t.error || t.deleteError || "Error", description: t.deleteError || "Error deleting", variant: "destructive" });
    }
    setSavingId(null);
    setOpenDeleteCourseDialogId(null);
  };

  const handleAddCourse = async () => {
    if (!newCourse.name?.ua || !newCourse.price || !newCourse.duration || !newCourse.description?.ua) {
      toast({ title: t.error || t.fillAllFields || "Error", description: t.fillAllFields || "Fill all fields", variant: "destructive" });
      return;
    }
    setSavingId("add-course");
    let imageUrl = "";
    let docUrl = "";
    if (newCourse.file) {
      const formData = new FormData();
      formData.append("file", newCourse.file);
      const token = localStorage.getItem('auth_token');
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        imageUrl = data.url;
      } else {
        toast({ title: t.error || t.uploadError || "Error", description: t.uploadError || "Error uploading image", variant: "destructive" });
        setSavingId(null);
        return;
      }
    }
    if (newCourse.docFile) {
      const formDataDoc = new FormData();
      formDataDoc.append("file", newCourse.docFile);
      const tokenDoc = localStorage.getItem('auth_token');
      const resDoc = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        headers: tokenDoc ? { 'Authorization': `Bearer ${tokenDoc}` } : {},
        body: formDataDoc
      });
      if (resDoc.ok) {
        const data = await resDoc.json();
        docUrl = data.url;
      } else {
        toast({ title: t.error || t.uploadError || "Error", description: t.uploadError || "Error uploading document", variant: "destructive" });
        setSavingId(null);
        return;
      }
    }

    const token = localStorage.getItem('auth_token');
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: "include",
      body: JSON.stringify({
        name: newCourse.name,
        price: Math.round(parseFloat(newCourse.price) * 100),
        duration: Number(newCourse.duration),
        description: newCourse.description,
        imageUrl,
        docUrl,
        category: "custom"
      })
    });
    if (res.ok) {
      const created = await res.json();
      setCourses(courses => [...courses, created]);
      // If demo object, persist locally so UI keeps it after reload
      if (created?.demo && typeof window !== 'undefined') {
        const local = JSON.parse(localStorage.getItem('demo_courses') || '[]');
        const updated = Array.isArray(local) ? [...local, created] : [created];
        localStorage.setItem('demo_courses', JSON.stringify(updated));
      }
      setNewCourse({ name: { ua: '' }, price: "", duration: "", description: { ua: '' }, file: null, imageUrl: "", docFile: null, docUrl: "" });
      setImagePreview("");
      setDocName("");
      setAddingCourse(false);
      toast({ title: t.success || t.added || "Success", description: t.added || "Added" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    } else {
      toast({ title: t.error || t.addError || "Error", description: t.addError || "Error adding", variant: "destructive" });
    }
    setSavingId(null);
  };

  if (loading) return (
    <div className="space-y-8">
      {/* Courses Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-lg font-semibold mb-2">
          <div className="w-4 h-4 bg-gradient-to-r from-mystical-200 to-mystical-300 dark:from-mystical-700 dark:to-mystical-600 rounded animate-pulse"></div>
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-card rounded-lg shadow-md p-4 border border-mystical-100 dark:border-mystical-700 min-h-[420px] animate-pulse">
              <div className="space-y-4">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-full"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-2/3"></div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-16"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-20"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-32"></div>
                  <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-lg font-semibold mb-2">
          <div className="w-4 h-4 bg-gradient-to-r from-mystical-200 to-mystical-300 dark:from-mystical-700 dark:to-mystical-600 rounded animate-pulse"></div>
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-20 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-card rounded-lg shadow-md p-4 border border-mystical-100 dark:border-mystical-700 min-h-[200px] animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4"></div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-16"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-20"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gradient-to-r from-mystical-200 to-mystical-300 dark:from-mystical-700 dark:to-mystical-600 rounded w-16"></div>
                  <div className="h-8 bg-gradient-to-r from-red-200 to-red-300 dark:from-red-700 dark:to-red-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* АККОРДЕОН КУРСЫ */}
      <div className="mb-6">
        <div onClick={() => setCoursesOpen(o => !o)} className="flex items-center gap-2 text-lg font-semibold mb-2 cursor-pointer select-none">
          <span className={`transition-transform duration-300 ${coursesOpen ? 'rotate-90' : 'rotate-0'}`}>{/* SVG стрелочка */}
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span> {t.events || "Події"}
                      </div>
        {/* КУРСЫ FLEX GRID */}
        <div className={`transition-all duration-300 overflow-hidden ${coursesOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}> 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Пустая карточка для добавления курса */}
            {!addingCourse ? (
              <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 flex flex-col items-center justify-center border border-mystical-100 dark:border-mystical-700 min-h-[420px] cursor-pointer hover:bg-mystical-50 dark:hover:bg-mystical-800 transition" onClick={() => setAddingCourse(true)}>
                <button className="flex items-center justify-center w-16 h-16 rounded-full bg-mystical-100 dark:bg-mystical-700 text-mystical-500 dark:text-mystical-200 text-5xl font-bold shadow hover:bg-mystical-200 dark:hover:bg-mystical-600 transition-all">
                  +
                </button>
                <div className="mt-4 text-muted-foreground text-sm text-center">Додати подію</div>
              </div>
            ) : (
              <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 flex flex-col gap-3 border border-mystical-100 dark:border-mystical-700 min-h-[420px]">
                <div className="flex flex-col gap-2">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">Назва події</div>
                  <Input className="h-10" placeholder="UA" value={newCourse.name?.ua || ''} onChange={e => setNewCourse(s => ({ ...s, name: { ...s.name, ua: e.target.value } }))} />
                  {/* PL removed */}
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="font-semibold text-xs text-muted-foreground">Ціна</div>
                    <div className="relative">
                      <Input className="h-10 pl-8 pr-10" type="number" min="0" step="0.01" placeholder={t.price || "Price"} value={newCourse.price} onChange={e => setNewCourse(s => ({ ...s, price: e.target.value }))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">грн</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="font-semibold text-xs text-muted-foreground">Тривалість</div>
                    <div className="relative">
                      <Input className="h-10 pl-8 pr-10" type="number" min="0" placeholder={t.duration || "Тривалість"} value={newCourse.duration} onChange={e => setNewCourse(s => ({ ...s, duration: e.target.value }))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">хв</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">Опис події</div>
                  <textarea className="min-h-20 h-20 resize-none border rounded p-1 w-full" placeholder="UA" value={newCourse.description?.ua || ''} onChange={e => setNewCourse(s => ({ ...s, description: { ...s.description, ua: e.target.value } }))} />
                  {/* PL removed */}
                </div>
                <div className="flex flex-row items-center gap-2 mt-2">
                  {imagePreview && <img src={imagePreview} alt="preview" style={{ maxWidth: 60, maxHeight: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #ccc" }} />}
                    <input
                      type="file"
                      accept="image/*"
                      id="course-image-upload"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewCourse(s => ({ ...s, file }));
                          setImagePreview(URL.createObjectURL(file));
                        } else {
                          setNewCourse(s => ({ ...s, file: null }));
                          setImagePreview("");
                        }
                      }}
                    />
                    <label htmlFor="course-image-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {!imagePreview && <ImageIcon className="w-8 h-8 text-muted-foreground hover:text-mystical-500 transition-colors" />}
                    </label>
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf"
                    id="course-doc-upload"
                    style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setNewCourse(s => ({ ...s, docFile: file }));
                      setDocName(file ? file.name : "");
                    }}
                  />
                  <label htmlFor="course-doc-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {docName ? (
                      <div className="flex items-center gap-2 px-2 py-1 rounded border border-mystical-200 text-mystical-700 bg-mystical-50 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L19.5 9H14V3.5z"/></svg>
                        <span className="max-w-[140px] truncate">{docName}</span>
                      </div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-muted-foreground hover:text-mystical-500 transition-colors"><path d="M21.44 11.05l-7.07 7.07a5 5 0 11-7.07-7.07l7.07-7.07a3.5 3.5 0 114.95 4.95l-7.78 7.78a2 2 0 01-2.83-2.83l6.36-6.36"/></svg>
                    )}
                  </label>
                  <Button size="sm" className="h-10 w-full" onClick={handleAddCourse} disabled={savingId === "add-course"}>{savingId === "add-course" ? t.saving || "Збереження..." : t.add || "Створити"}</Button>
                  <Button size="icon" variant="secondary" onClick={() => { setAddingCourse(false); setNewCourse({ name: { ua: '' }, price: "0", duration: "0", description: { ua: '' }, file: null, imageUrl: "" }); setImagePreview(""); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {/* Список курсов */}
            {Array.isArray(courses) && courses.map((course, idx) => (
              <div key={course.id} className="bg-white dark:bg-card rounded-lg shadow-md p-4 flex flex-col gap-3 border border-mystical-100 dark:border-mystical-700 min-h-[420px]">
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">Назва події</div>
                  <div className="flex flex-col gap-1">
                    <Input className="h-10" value={typeof course.name === 'object' ? (course.name.ua || '') : course.name} onChange={e => setCourses(cs => cs.map((c, i) => i === idx ? { ...c, name: { ...c.name, ua: e.target.value } } : c))} placeholder="UA" />
                    {/* PL removed */}
        </div>
      </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="font-semibold text-xs text-muted-foreground">Ціна</div>
                    <div className="relative">
                      <Input className="h-10 pr-10" type="number" min="0" step="0.01" value={course.price / 100} onChange={e => setCourses(cs => cs.map((c, i) => i === idx ? { ...c, price: Math.round(parseFloat(e.target.value) * 100) } : c))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">грн</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="font-semibold text-xs text-muted-foreground">Тривалість</div>
                    <div className="relative">
                      <Input className="h-10 pr-10" type="number" min="0" value={course.duration} onChange={e => setCourses(cs => cs.map((c, i) => i === idx ? { ...c, duration: e.target.value } : c))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">хв</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">Course description</div>
                  <textarea className="min-h-20 h-20 resize-none border rounded p-1 w-full" value={typeof course.description === 'object' ? (course.description.ua || '') : course.description} onChange={e => setCourses(cs => cs.map((c, i) => i === idx ? { ...c, description: { ...c.description, ua: e.target.value } } : c))} placeholder="UA" />
                  {/* PL removed */}
                </div>
                <div className="flex flex-row items-center gap-2 mt-4">
                  {(editCoursePreviews[course.id] || course.imageUrl) && (
                    <img src={editCoursePreviews[course.id] || course.imageUrl} alt="preview" style={{ maxWidth: 60, maxHeight: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #ccc" }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id={`course-image-upload-${course.id}`}
                    style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setEditCourseFiles(m => ({ ...m, [course.id]: file }));
                      setEditCoursePreviews(m => ({ ...m, [course.id]: file ? URL.createObjectURL(file) : "" }));
                    }}
                  />
                  <label htmlFor={`course-image-upload-${course.id}`} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {!editCoursePreviews[course.id] && !course.imageUrl && (
                      <ImageIcon className="w-8 h-8 text-muted-foreground hover:text-mystical-500 transition-colors" />
                    )}
                  </label>
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf"
                    id={`course-doc-upload-${course.id}`}
                    style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setEditCourseFiles(m => ({ ...m, [`doc-${course.id}`]: file }));
                    }}
                  />
                  <label htmlFor={`course-doc-upload-${course.id}`} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="flex items-center gap-2 px-2 py-1 rounded border border-mystical-200 text-mystical-700 bg-mystical-50 text-xs max-width: 60px; max-height: 40px; object-fit: cover;">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L19.5 9H14V3.5z"/></svg>
                    </div>
                  </label>
                  <Button size="sm" className="h-10 w-full" onClick={() => handleSave("course", course.id, course.price, course.duration, course.name, course.description)} disabled={savingId === `course-${course.id}`}>{savingId === `course-${course.id}` ? t.saving || "Saving..." : t.save || "Save"}</Button>
                  <AlertDialog open={openDeleteCourseDialogId === course.id} onOpenChange={open => setOpenDeleteCourseDialogId(open ? course.id : null)}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        disabled={savingId === `delete-course-${course.id}` || savingId === `course-${course.id}`} 
                        title={t.delete || "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>{t.deleteCourse || "Delete Course"}</AlertDialogTitle>
                      <AlertDialogDescription>{t.deleteCourseConfirm || "Are you sure you want to delete this course? This action cannot be undone."}</AlertDialogDescription>
                      <div className="flex justify-end gap-2 mt-4">
                        <AlertDialogCancel asChild>
                          <Button variant="secondary" onClick={() => setOpenDeleteCourseDialogId(null)}>{t.cancel || "Cancel"}</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            variant="destructive"
                            disabled={savingId === `delete-course-${course.id}`}
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            {savingId === `delete-course-${course.id}` ? t.deleting || "Deleting..." : t.delete || "Delete"}
                          </Button>
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* АККОРДЕОН УСЛУГИ */}
      <div className="mb-6">
        <div onClick={() => setServicesOpen(o => !o)} className="flex items-center gap-2 text-lg font-semibold mb-2 cursor-pointer select-none">
          <span className={`transition-transform duration-300 ${servicesOpen ? 'rotate-90' : 'rotate-0'}`}>{/* SVG стрелочка */}
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span> {t.services || "Послуги"}
        </div>
        <div className={`transition-all duration-300 overflow-hidden ${servicesOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}> 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Пустая карточка для добавления услуги */}
            {!addingService ? (
              <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 flex flex-col items-center justify-center border border-mystical-100 dark:border-mystical-700 min-h-[420px] cursor-pointer hover:bg-mystical-50 dark:hover:bg-mystical-800 transition" onClick={() => setAddingService(true)}>
                <button className="flex items-center justify-center w-16 h-16 rounded-full bg-mystical-100 dark:bg-mystical-700 text-mystical-500 dark:text-mystical-200 text-5xl font-bold shadow hover:bg-mystical-200 dark:hover:bg-mystical-600 transition-all">
                  +
                </button>
                <div className="mt-4 text-muted-foreground text-sm text-center">Додати послугу</div>
              </div>
            ) : (
              <div className="w-full bg-white dark:bg-card rounded-lg shadow-md p-4 flex flex-col gap-4 border border-mystical-100 dark:border-mystical-700 min-h-[420px]">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-xs text-muted-foreground">Назва послуги</label>
                  <Input className="h-10" placeholder="UA" value={newService.name?.ua || ''} onChange={e => setNewService(s => ({ ...s, name: { ...s.name, ua: e.target.value } }))} />
                  {/* PL removed */}
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col gap-1 w-1/2">
                    <label className="font-semibold text-xs text-muted-foreground">Ціна</label>
                    <div className="relative">
                      <Input className="h-10 pl-8 pr-10" type="number" min="0" step="0.01" placeholder={t.price || "Price"} value={newService.price} onChange={e => setNewService(s => ({ ...s, price: e.target.value }))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">грн</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 w-1/2">
                    <label className="font-semibold text-xs text-muted-foreground">Тривалість</label>
                    <div className="relative">
                      <Input className="h-10 pl-8 pr-10" type="number" min="0" placeholder={t.duration || "Тривалість"} value={newService.duration} onChange={e => setNewService(s => ({ ...s, duration: e.target.value }))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">хв</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row gap-2 mt-4">
                  <Button size="sm" className="h-10 w-full" onClick={handleAddService} disabled={savingId === "add-service"}>{savingId === "add-service" ? t.saving || "Збереження..." : t.add || "Додати"}</Button>
                  <Button size="icon" variant="secondary" onClick={() => { setAddingService(false); setNewService({ name: { ua: '', en: '' }, price: "0", duration: "0" }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {/* Список услуг */}
            {Array.isArray(services) && services.map((service, idx) => (
              <div key={service.id} className="bg-white dark:bg-card rounded-lg shadow-md p-4 flex flex-col gap-3 border border-mystical-100 dark:border-mystical-700 min-h-[420px]">
                <div className="flex flex-col gap-2">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">Назва послуги</div>
                  <Input className="h-10" value={typeof service.name === 'object' ? (service.name.ua || '') : (service.name || '')} onChange={e => setServices(ss => ss.map((s, i) => i === idx ? { ...s, name: { ...s.name, ua: e.target.value } } : s))} placeholder="UA" />
                  {/* PL removed */}
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col gap-1 w-1/2">
                    <div className="font-semibold text-xs text-muted-foreground">Ціна</div>
                    <div className="relative">
                      <Input className="h-10 pl-8 pr-10" type="number" min="0" step="0.01" value={service.price / 100} onChange={e => setServices(ss => ss.map((s, i) => i === idx ? { ...s, price: Math.round(parseFloat(e.target.value) * 100) } : s))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">грн</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 w-1/2">
                    <div className="font-semibold text-xs text-muted-foreground">Тривалість</div>
                    <div className="relative">
                      <Input className="h-10 pr-10" type="number" min="0" value={service.duration} onChange={e => setServices(ss => ss.map((s, i) => i === idx ? { ...s, duration: e.target.value } : s))} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">хв</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row gap-2 mt-4">
                  <Button size="sm" className="h-10 w-full" onClick={() => handleSave("service", service.id, service.price, service.duration, service.name, service.description)} disabled={savingId === `service-${service.id}`}>{savingId === `service-${service.id}` ? t.saving || "Збереження..." : t.save || "Зберегти"}</Button>
                  <AlertDialog open={openDeleteServiceDialogId === service.id} onOpenChange={open => setOpenDeleteServiceDialogId(open ? service.id : null)}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        disabled={savingId === `delete-${service.id}` || savingId === `service-${service.id}`} 
                        title={t.delete || "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>{t.deleteService || "Delete Service"}</AlertDialogTitle>
                      <AlertDialogDescription>{t.deleteServiceConfirm || "Are you sure you want to delete this service? This action cannot be undone."}</AlertDialogDescription>
                      <div className="flex justify-end gap-2 mt-4">
                        <AlertDialogCancel asChild>
                          <Button variant="secondary" onClick={() => setOpenDeleteServiceDialogId(null)}>{t.cancel || "Cancel"}</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            variant="destructive"
                            disabled={savingId === `delete-${service.id}`}
                            onClick={() => handleDeleteService(service.id)}
                          >
                            {savingId === `delete-${service.id}` ? t.deleting || "Deleting..." : t.delete || "Delete"}
                          </Button>
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}