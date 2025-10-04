import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    (async () => {
      if (!course?.docUrl || !docRef.current) return;
      if (/\.docx?$/i.test(course.docUrl)) {
        try {
          const res = await fetch(course.docUrl);
          const blob = await res.blob();
          docRef.current.innerHTML = "";
          await renderDocx(blob, docRef.current, undefined, { inWrapper: false });
        } catch {}
      } else if (/\.pdf$/i.test(course.docUrl)) {
        try {
          const loadingTask = getDocument(course.docUrl);
          const pdf = await (loadingTask as any).promise;
          docRef.current.innerHTML = "";
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const textDiv = document.createElement('div');
            textDiv.className = 'mb-4';
            textDiv.style.whiteSpace = 'pre-wrap';
            textDiv.textContent = textContent.items.map((i: any) => i.str).join(' ');
            docRef.current.appendChild(textDiv);
          }
        } catch {}
      }
    })();
  }, [course?.docUrl]);

  if (isLoading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="text-muted-foreground">Завантаження…</div>
      </main>
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


