import { QueryClient, QueryFunction } from "@tanstack/react-query";

// JWT token utilities
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const error = new Error(`HTTP error! status: ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add JWT token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    await throwIfResNotOk(response);
    return response;
  } catch (error) {
    console.error('API request failed:', { method, url, error });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    
    // Add JWT token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return await res.json() as T;
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Включаем обновление при фокусе окна для мгновенного отображения изменений
      refetchOnMount: true, // Обновляем данные при монтировании компонента
      refetchOnReconnect: true, // Включаем обновление при восстановлении соединения
      staleTime: 30 * 1000, // 30 секунд - данные считаются свежими 30 секунд (быстрее обновление)
      gcTime: 2 * 60 * 1000, // 2 минуты - данные хранятся в кеше 2 минуты
      retry: 2, // Пробуем повторить запрос 2 раза при ошибке
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Optimize for preloaded data
      placeholderData: (previousData: any) => previousData,
    },
    mutations: {
      retry: 1, // Пробуем повторить мутацию 1 раз при ошибке
    },
  },
});
