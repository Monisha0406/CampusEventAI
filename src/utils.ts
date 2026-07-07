export function getToken(): string | null {
  return localStorage.getItem('campus_event_token');
}

export function setToken(token: string) {
  localStorage.setItem('campus_event_token', token);
}

export function removeToken() {
  localStorage.removeItem('campus_event_token');
}

export function getUser(): any {
  const userStr = localStorage.getItem('campus_event_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function setUser(user: any) {
  localStorage.setItem('campus_event_user', JSON.stringify(user));
}

export function removeUser() {
  localStorage.removeItem('campus_event_user');
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
