export interface User {
  id: number;
  firebase_uid?: string;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: '1' | '2' | '3' | '4';
  gender?: 'Male' | 'Female' | 'Other';
  profile_image?: string;
  role: 'student' | 'admin';
  created_at?: string;
}

export interface Event {
  id: number;
  title: string;
  category: 'Technical' | 'Non-Technical';
  description: string;
  rules: string;
  venue: string;
  event_date: string;
  event_time: string;
  coordinator: string;
  faculty: string;
  capacity: number;
  available_seats: number;
  fee: number;
  image_url: string;
  is_active: number; // 0 or 1
  registration_close_date?: string;
  created_at?: string;
}

export interface Registration {
  id: number;
  registration_id: string;
  user_id: number;
  event_id: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'free';
  transaction_id?: string;
  qr_code?: string;
  pdf_ticket_url?: string;
  registered_at?: string;
  
  // Joined fields
  event_title?: string;
  event_date?: string;
  event_time?: string;
  venue?: string;
  coordinator?: string;
  faculty?: string;
  fee?: number;

  student_name?: string;
  student_email?: string;
  student_phone?: string;
  student_dept?: string;
  student_year?: string;
  student_college?: string;
}

export interface Payment {
  id: number;
  registration_id: number;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  status: 'created' | 'captured' | 'failed';
  created_at?: string;

  // Joined fields
  student_name?: string;
  student_email?: string;
  event_title?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: number; // 0 or 1
  created_at?: string;
}

export interface AnalyticsSummary {
  summary: {
    totalUsers: number;
    totalRegistrations: number;
    totalRevenue: number;
    popularEvent: string;
    popularEventCount: number;
  };
  categories: { category: string; count: number }[];
  dailyRegistrations: { date: string; count: number }[];
  seatsSummary: { title: string; capacity: number; available_seats: number; registered: number }[];
}
