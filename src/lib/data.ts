
// All mock data has been removed from this file.
// The application now fetches live data from Firestore.

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  location: 'Nearby' | 'In City';
  availability: 'Online' | 'Offline';
  rating: number;
  bio: string;
  education: string;
  clinicName: string;
  address: string;
  previousExperience: string;
}

export interface Patient {
    id: string;
    name: string;
    lastVisit: string;
    avatar: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  description: string;
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'Normal' | 'Urgent';
  status: 'booked' | 'completed';
  cost: number;
}

export interface Order {
    id: string;
    patientName: string;
    items: { productId: string; name: string; quantity: number }[];
    total: number;
    status: 'pending' | 'approved' | 'declined';
    date?: string;
}

export interface MedicalRecord {
    id: string;
    fileName: string;
    uploadDate: string;
    type: 'Lab Report' | 'Prescription' | 'Imaging';
}
