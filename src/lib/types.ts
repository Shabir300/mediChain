
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'patient' | 'doctor' | 'pharmacy';
  pharmacyName?: string;
}

export interface Doctor {
  uid: string;
  email: string;
  fullName: string;
  specialty: string;
  bio: string;
  education: string;
  clinicName: string;
  address: string;
  previousExperience: string;
  avatar?: string;
  location?: string;
  availability?: string;
  rating?: number;
}

export interface Product {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; // May not always be available depending on query context
  doctorName: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'Normal' | 'Urgent';
  status: 'booked' | 'completed' | 'cancelled';
  cost: number;
}

export interface Order {
    id: string;
    patientId: string;
    pharmacyId: string;
    items: {
        productId: string;
        name: string;
        quantity: number;
    }[];
    total: number;
    status: 'pending' | 'approved' | 'declined';
    date: string;
}

export interface MedicalRecord {
    id: string;
    patientId: string;
    fileName: string;
    uploadDate: string;
    type: 'Lab Report' | 'Prescription' | 'Imaging';
    fileUrl: string;
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}
