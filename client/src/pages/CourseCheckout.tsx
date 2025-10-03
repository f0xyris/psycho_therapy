// @ts-nocheck
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ course }: { course: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const { t, language } = useLanguage();

  // Function to get course name translation
  const getCourseName = (category: string) => {
    switch (category) {
      case 'laser':
        return t?.laserEpilationCourse || 'Laser Hair Removal Course';
      case 'massage':
        return t?.massageCourse || 'Massage Course';
      case 'skincare':
        return t?.skinCareCourse || 'Skin Care Course';
      default:
        return typeof course.name === 'object' ? 
          (course.name.ua || 'Unknown Course') : 
          course.name;
    }
  };

  // Function to get course description translation
  const getCourseDescription = (category: string) => {
    switch (category) {
      case 'laser':
        return t?.laserEpilationCourseDesc || 'Professional laser hair removal training';
      case 'massage':
        return t?.massageCourseDesc || 'Professional massage therapy training';
      case 'skincare':
        return t?.skinCareCourseDesc || 'Professional skin care training';
      default:
        return typeof course.description === 'object' ? 
          (course.description.ua || 'No description') : 
          course.description;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/training?payment=success`,
      },
    });

    if (error) {
      toast({
        title: t?.paymentError || "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t?.paymentSuccess || "Payment Successful!",
        description: t?.paymentSuccessMessage || "Thank you for purchasing the course!",
      });
      setLocation("/training?payment=success");
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/training")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t?.backToCourses || "Back to Courses"}
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Course Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-mystical-600 dark:text-mystical-400">
              {t?.courseDetails || "Course Details"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">{String(course.name?.[language] || course.name?.ua)}</h3>
            <p className="text-muted-foreground mb-4">{String(course.description?.[language] || course.description?.ua)}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t?.duration || "Duration"}:</span>
                <span>{course.duration} {t?.hours || "hours"}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{t?.cost || "Cost"}:</span>
                <span className="text-accent-600 dark:text-accent-400">
                  {(course.price / 100).toLocaleString('uk-UA')} грн
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-mystical-600 dark:text-mystical-400">
              {t?.payment || "Payment"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <PaymentElement />
              <Button 
                type="submit" 
                disabled={!stripe || isProcessing}
                className="w-full bg-gradient-to-r from-mystical-500 to-accent-500 text-white hover:from-mystical-600 hover:to-accent-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t?.processing || "Processing..."}
                  </>
                ) : (
                  `${t?.payAmount || "Pay"} ${(course.price / 100).toLocaleString('uk-UA')} грн`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function CourseCheckout() {
  const [, params] = useRoute("/checkout/course/:id");
  const [clientSecret, setClientSecret] = useState("");
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (!params || typeof params.id !== 'string') {
      setLocation("/training");
      return;
    }

    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          courseId: parseInt(params.id),
          userEmail: user?.email || 'customer@example.com'
        });
        const data = await response.json();
        
        if (response.ok) {
          setClientSecret(data.clientSecret);
          setCourse(data.course);
        } else {
          throw new Error(data.error || "Failed to create payment intent");
        }
      } catch (error: any) {
        toast({
          title: t?.error || "Error",
          description: error.message || t?.paymentError || "Failed to create payment",
          variant: "destructive",
        });
        setLocation("/training");
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [params?.id, toast, setLocation]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">{t?.loading || "Loading"}...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret || !course) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t?.courseNotFound || "Course not found"}</p>
          <Button onClick={() => setLocation("/training")} className="mt-4">
            {t?.returnToCourses || "Return to Courses"}
          </Button>
        </div>
      </div>
    );
  }

  // Map language to Stripe locale (Ukrainian not supported by Stripe, use English instead)
  const getStripeLocale = (lang: string) => {
    switch (lang) {
      case 'uk':
      default:
        return 'en';
    }
  };

  // Detect dark mode
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const stripeAppearance: import('@stripe/stripe-js').Appearance = isDark
    ? {
        theme: "stripe",
        variables: {
          colorText: '#fff',
          colorTextPlaceholder: '#bbb',
          colorBackground: '#2d2240',
          colorPrimary: '#a78bfa',
        },
      }
    : {
        theme: "stripe",
        variables: {
          colorText: '#222',
          colorTextPlaceholder: '#888',
          colorBackground: '#fff',
          colorPrimary: '#a78bfa',
          borderRadius: '8px',
        },
      };

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: stripeAppearance,
        locale: getStripeLocale(language)
      }}
    >
      <CheckoutForm course={course} />
    </Elements>
  );
}