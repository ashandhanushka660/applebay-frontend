const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.fieldErrors) {
        errorMsg = Object.entries(errData.fieldErrors)
          .map(([f, m]) => `${f}: ${m}`)
          .join(", ");
      } else if (errData.message) {
        errorMsg = errData.message;
      }
    } catch {
      // no JSON payload
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}
