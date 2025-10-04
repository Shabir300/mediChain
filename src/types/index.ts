
import { Timestamp } from 'firebase/firestore';

// Base types
export type Role = 'patient' | 'doctor' | 'pharmacy' | 'hospital';

// Role-specific data structures
export interface PatientData {
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: string;
  address?: string;
  location?: { lat: number; lng: number };
  profileImage?: string;
}

export interface DoctorData {
  specialization?: string;
  experience?: number;
  qualification?: string;
  hospitalAffiliation?: string;
  consultationFee?: number;
  availableOnline?: boolean;
  location?: { lat: number; lng: number; address: string };
  ratings?: { average: number; count: number };
  earnings?: number;
  profileImage?: string;
  bio?: string;
}

export interface PharmacyData {
  pharmacyName?: string;
  licenseNumber?: string;
  address?: string;
  location?: { lat: number; lng: number };
  operatingHours?: string;
  contactNumber?: string;
  profileImage?: string;
}

export interface HospitalData {
  hospitalName?: string;
  licenseNumber?: string;
  address?: string;
  location?: { lat: number; lng: number };
  emergencyContact?: string;
  ambulanceCount?: number;
  facilities?: string[];
  availableBeds?: number;
  operatingHours?: string;
  website?: string;
  profileImage?: string;
}

// Base User Interface
interface BaseUser {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Discriminated Union for User Type
export type User = BaseUser & (
  | { role: 'patient'; patientData?: PatientData }
  | { role: 'doctor'; doctorData?: DoctorData }
  | { role: 'pharmacy'; pharmacyData?: PharmacyData }
  | { role: 'hospital'; hospitalData?: HospitalData }
);


// Other existing types
export interface Appointment {
  id?: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Timestamp;
  reason: string;
  status: 'scheduled' | 'completed' | 'canceled';
}

export interface MedicalRecord {
  id?: string;
  patientId: string;
  fileName: string;
  downloadURL: string;
  uploadedAt: Timestamp;
}

export interface Medicine {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  pharmacyId: string;
}

export interface Order {
  id?: string;
  patientId: string;
  pharmacyId: string;
  items: { medicineId: string; quantity: number }[];
  totalPrice: number;
  orderDate: Timestamp;
  status: 'pending' | 'completed' | 'canceled';
}

export interface Notification {
  id?: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}
