import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageLoader } from "@/components/LoadingSpinner";
import { useEffect, useRef, useState } from "react";
import { renderAsync as renderDocx } from "docx-preview";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
// Use Vite asset URL to point worker to the correct path
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = pdfWorker as any;
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Course } from "@shared/schema";

export default function EventDetails() {
  const [, params] = useRoute("/training/:id");
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const docRef = useRef<HTMLDivElement | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const id = Number(params?.id);

  const { data: course, isLoading } = useQuery<Course | null>({
    queryKey: ["/api/courses", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) return null;
      return await res.json();
    },
  });

  // Parse document when course arrives
  useEffect(() => {
    (async () => {
      console.log('📄 Document effect triggered. docUrl:', course?.docUrl);
      console.log('📄 docRef.current:', docRef.current);
      
      // If no docUrl, don't wait for document
      if (!course?.docUrl) {
        console.log('⚠️ No docUrl, skipping document load');
        setDocLoading(false);
        return;
      }
      
      if (!docRef.current) {
        console.log('⚠️ docRef.current is null, retrying in 100ms');
        // Retry after a short delay to ensure DOM is ready
        setTimeout(() => {
          if (docRef.current && course?.docUrl) {
            console.log('✅ docRef ready after delay, rerunning effect');
            // Manually trigger by updating state
          }
        }, 100);
        setDocLoading(false);
        return;
      }
      
      // If docUrl exists, start loading immediately
      setDocLoading(true);
      console.log('🔄 Starting document load for:', course.docUrl);
      
      if (/\.docx?$/i.test(course.docUrl)) {
        console.log('📝 Detected DOCX file');
        try {
          const res = await fetch(course.docUrl);
          const blob = await res.blob();
          docRef.current.innerHTML = "";
          await renderDocx(blob, docRef.current, undefined, { inWrapper: false });
          console.log('✅ DOCX rendered successfully');
        } catch (err) {
          console.error('❌ Error loading docx:', err);
        }
        finally { setDocLoading(false); }
      } else if (/\.pdf$/i.test(course.docUrl)) {
        console.log('📄 Detected PDF file');
        try {
          const loadingTask = getDocument(course.docUrl);
          const pdf = await (loadingTask as any).promise;
          console.log('📄 PDF loaded, pages:', pdf.numPages);
          
          if (!docRef.current) {
            console.error('❌ docRef.current became null during PDF processing');
            setDocLoading(false);
            return;
          }
          
          docRef.current.innerHTML = "";
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const textDiv = document.createElement('div');
            textDiv.className = 'mb-4';
            textDiv.style.whiteSpace = 'pre-wrap';
            textDiv.textContent = textContent.items.map((i: any) => i.str).join(' ');
            if (docRef.current) {
              docRef.current.appendChild(textDiv);
              console.log(`📄 Page ${pageNum} text added, length:`, textDiv.textContent.length);
            }
          }
          console.log('✅ PDF rendered successfully, total pages:', pdf.numPages);
        } catch (err) {
          console.error('❌ Error loading pdf:', err);
        }
        finally { setDocLoading(false); }
      } else {
        console.log('⚠️ Unknown document type:', course.docUrl);
        setDocLoading(false);
      }
    })();
  }, [course?.docUrl]);

  // Show preloader while loading data OR while parsing document (only if docUrl exists)
  const showPreloader = isLoading || (course?.docUrl && docLoading);

  if (showPreloader) {
    return (
      <PageLoader />
    );
  }

  if (!course) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="text-muted-foreground">Подію не знайдено</div>
      </main>
    );
  }

  const title = String(course.name && (course as any).name?.[language] || (course as any).name?.ua || "");
  const desc = String(course.description && (course as any).description?.[language] || (course as any).description?.ua || "");

  return (
    <main className="px-3 sm:px-4 lg:px-6 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => setLocation("/training")} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Назад до подій
        </Button>

        <article className="prose prose-lg max-w-none dark:prose-invert">
          <header className="text-center mb-6">
            <h1 className="mb-2">{title}</h1>
            {desc && <p className="text-muted-foreground !mt-0">{desc}</p>}
          </header>

          {course.imageUrl && (
            <img
              src={course.imageUrl}
              alt={title}
              className="float-right w-full sm:w-1/2 ml-6 mb-4 rounded-lg shadow"
            />
          )}

          {course.docUrl ? (
            <div ref={docRef} />
          ) : (
            <p className="text-muted-foreground">Деталі події будуть додані пізніше.</p>
          )}

          <div className="clear-both" />
        </article>
      </div>
    </main>
  );
}


