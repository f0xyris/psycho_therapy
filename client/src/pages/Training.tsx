import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
// Paperclip icon removed per request
import { useEffect, useRef } from "react";
import { renderAsync as renderDocx } from "docx-preview";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Course } from "@shared/schema";

const Training = () => {
  const { t, language } = useLanguage();
  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  const [openId, setOpenId] = useState<number | null>(null);

  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const getCourseName = (category: string): string => {
    const names = {
      laser: t.laserEpilationCourse,
      massage: t.massageCourse,
      spa: t.skinCareCourse
    };
    return names[category as keyof typeof names] || t.laserEpilationCourse;
  };

  const getCourseDescription = (category: string): string => {
    const descriptions = {
      laser: t.laserEpilationCourseDesc,
      massage: t.massageCourseDesc,
      spa: t.skinCareCourseDesc
    };
    return descriptions[category as keyof typeof descriptions] || t.laserEpilationCourseDesc;
  };

  // Remove payment success handling (Stripe removed)

  const openDetails = (id: number) => setOpenId(id);
  const closeDetails = () => setOpenId(null);

  const getFileName = (url?: string) => {
    if (!url) return "Документ";
    try {
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1] || "Документ");
    } catch {
      return "Документ";
    }
  };

  const docContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    (async () => {
      if (openId && docContainerRef.current) {
        const course = courses?.find(c => c.id === openId);
        if (course?.docUrl && /\.docx?$/.test(course.docUrl)) {
          try {
            const res = await fetch(course.docUrl);
            const blob = await res.blob();
            docContainerRef.current.innerHTML = "";
            await renderDocx(blob, docContainerRef.current, undefined, { inWrapper: false });
          } catch {}
        }
      }
    })();
  }, [openId, courses]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{t.error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            {t.loading}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-3 sm:px-4 lg:px-8 py-6 sm:py-12 dark:bg-deep-900">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-mystical-500 dark:text-mystical-400 mb-2 sm:mb-4">{t.trainingTitle}</h1>
          <p className="text-muted-foreground dark:text-muted-foreground text-sm sm:text-base">{t.trainingDescription}</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {courses?.map((course: any) => (
          <Card key={course.id} className="course-card shadow-xl dark:shadow-mystical-500/10 overflow-hidden bg-background dark:bg-card hover:shadow-2xl dark:hover:shadow-mystical-500/20 transition-all duration-300 group">
            <img 
              src={course.imageUrl || getCourseImage(course.category)} 
              alt={String(course.name?.[language] || course.name?.ua)}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <CardContent className="course-card-content p-6">
              <div>
                <h3 className="text-xl font-semibold text-mystical-500 dark:text-mystical-400 mb-3">{String(course.name?.[language] || course.name?.ua)}</h3>
                <p className="text-muted-foreground dark:text-muted-foreground mb-3">{String(course.description?.[language] || course.description?.ua)}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.duration}:</span>
                    <span>{course.duration} {t.hours}</span>
                  </div>
                </div>
              </div>
              <div className="course-card-footer">
                <Button onClick={() => setLocation(`/training/${course.id}`)} className="course-button bg-mystical-600 text-white hover:bg-mystical-700 shadow-lg font-semibold">
                  Детальніше
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Modal removed in favor of dedicated page */}
      </div>
    </main>
  );
};

function getCourseImage(category: string): string {
  const images = {
    laser: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    massage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    spa: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
  };
  return images[category as keyof typeof images] || images.spa;
}



export default Training;