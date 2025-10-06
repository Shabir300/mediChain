import { Timestamp } from 'firebase/firestore';

// Base user data
interface UserBase {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
}

// Role-specific data structures
export interface PatientData {
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: string;
  address?: string;
}

export interface DoctorData {
  specialization?: string;
  experience?: number;
  qualification?: string;
  hospitalAffiliation?: string;
  consultationFee?: number;
  availableOnline?: boolean;
  bio?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  ratings?: {
    average: number;
    count: number;
  };
  reviews?: any[];
}

export interface PharmacyData {
    pharmacyName?: string;
    licenseNumber?: string;
    address?: string;
    operatingHours?: string;
    contactNumber?: string;
    profileImage?: string;
    location?: {
        lat: number;
        lng: number;
        address: string;
    };
}

export interface HospitalData {
  hospitalName?: string;
  licenseNumber?: string;
  address?: string;
  emergencyContact?: string;
  ambulanceCount?: number;
  facilities?: string[];
  availableBeds?: number;
  operatingHours?: string;
  website?: string;
}

// Discriminated union for User
export type User = UserBase & (
  | { role: 'patient'; patientData?: PatientData }
  | { role: 'doctor'; doctorData?: DoctorData }
  | { role: 'pharmacy'; pharmacyData?: PharmacyData }
  | { role: 'hospital'; hospitalData?: HospitalData }
);

export interface PharmacyOrder {
    pharmacyId: string;
    pharmacyName: string;
    status: 'pending' | 'approved' | 'declined' | 'delivered';
}

export interface Appointment {
  id?: string;
  patientId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  notes?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentType: 'urgent' | 'normal';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: Date;
  timeSlot: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  consultationFee: number;
  meetingLink?: string;
  createdAt: Timestamp;
  consultationNotes?: any;
  prescriptionUploaded?: boolean;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploadedAt: Timestamp;
}

export interface Medicine {
    id: string;
    pharmacyId: string;
    name: string;
    genericName: string;
    brand: string;
    category: string;
    form: string;
    price: number;
    stock: number;
    lowStockThreshold: number;
    expiryDate: Timestamp;
    description: string;
    imageUrl?: string; 
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  pharmacyIds: string[];
  pharmacies: PharmacyOrder[];
  items: any[];
  totalAmount: number;
  deliveryAddress: string;
  orderDate: Timestamp;
  createdAt: Timestamp;
}