export const authApiBaseUrl = import.meta.env.VITE_AUTH_API_BASE_URL || "";

export const apiUrl = (path: string) => `${authApiBaseUrl}${path}`;
