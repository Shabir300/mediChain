
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

export const doctors: Doctor[] = [
  { 
    id: '1', 
    name: 'Dr. Evelyn Reed', 
    specialty: 'Cardiologist', 
    avatar: 'https://images.unsplash.com/photo-1642541724244-83d49288a86b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxkb2N0b3IlMjBwb3J0cmFpdHxlbnwwfHx8fDE3NTkzMzA0OTF8MA&ixlib=rb-4.1.0&q=80&w=1080', 
    location: 'Nearby', 
    availability: 'Online', 
    rating: 4.8,
    bio: 'Dr. Reed is a board-certified cardiologist with over 15 years of experience in treating complex heart conditions. She is dedicated to providing compassionate and comprehensive care.',
    education: "MD in Cardiology, Stanford University",
    clinicName: "HeartCare Center",
    address: "123 Health St., Medville, USA",
    previousExperience: "10 years at General Hospital"
  },
  { 
    id: '2', 
    name: 'Dr. Samuel Chen', 
    specialty: 'Pediatrician', 
    avatar: 'https://images.unsplash.com/photo-1758127139306-8f35edd4c4f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxkb2N0b3IlMjBzbWlsaW5nfGVufDB8fHx8MTc1OTM4MzAwOXww&ixlib=rb-4.1.0&q=80&w=1080', 
    location: 'In City', 
    availability: 'Online', 
    rating: 4.9,
    bio: 'Dr. Chen is a friendly and experienced pediatrician committed to the health and well-being of children from infancy through adolescence.',
    education: "Pediatrics Residency, Johns Hopkins",
    clinicName: "KidsHealth Clinic",
    address: "456 Wellness Ave., Medville, USA",
    previousExperience: "5 years at City Pediatrics"
  },
  { 
    id: '3', 
    name: 'Dr. Aisha Khan', 
    specialty: 'Dermatologist', 
    avatar: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHx3b21hbiUyMGRvY3RvcnxlbnwwfHx8fDE3NTkzNTMzOTd8MA&ixlib=rb-4.1.0&q=80&w=1080', 
    location: 'Nearby', 
    availability: 'Offline', 
    rating: 4.7,
    bio: 'Dr. Khan specializes in both medical and cosmetic dermatology, offering a wide range of treatments to help you achieve healthy, beautiful skin.',
    education: "Dermatology, Mayo Clinic",
    clinicName: "The Skin Institute",
    address: "789 Derma Rd., Medville, USA",
    previousExperience: "Lead Dermatologist at Radiant Skin"
  },
];

export interface Patient {
    id: string;
    name: string;
    lastVisit: string;
    avatar: string;
}

export const patients: Patient[] = [
    { id: 'pat-1', name: 'Alice Johnson', lastVisit: '2024-08-10', avatar: 'patient-1' },
    { id: 'pat-2', name: 'Bob Williams', lastVisit: '2024-08-10', avatar: 'patient-2' },
    { id: 'pat-3', name: 'Charlie Brown', lastVisit: '2024-07-20', avatar: 'patient-3' },
]

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  description: string;
}

export const pharmacyProducts: Product[] = [
  { id: 'prod-1', name: 'Paracetamol 500mg', price: 70, stock: 50, images: ['medicine-1'], description: "Effective relief from pain and fever." },
  { id: 'prod-2', name: 'Amoxicillin 250mg Syrup', price: 250, stock: 25, images: ['medicine-2'], description: "Antibiotic for bacterial infections." },
  { id: 'prod-3', name: 'Ibuprofen 200mg', price: 120, stock: 4, images: ['medicine-3'], description: "Reduces inflammation and pain." },
  { id: 'prod-4', name: 'Vitamin C 1000mg', price: 450, stock: 100, images: ['medicine-4'], description: "Supports the immune system." },
];

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export const reviews: Review[] = [
    { id: '1', patientName: 'John D.', rating: 5, comment: 'Very attentive and thorough. Explained everything clearly.', date: '2024-07-15' },
    { id: '2', patientName: 'Jane S.', rating: 4, comment: 'Good experience, but the wait time was a bit long.', date: '2024-07-12' },
    { id: '3', patientName: 'Mike P.', rating: 5, comment: 'One of the best doctors I have ever visited. Highly recommended!', date: '2024-07-10' },
];

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

export const appointments: Appointment[] = [];

export interface Order {
    id: string;
    patientName: string;
    items: { productId: string; name: string; quantity: number }[];
    total: number;
    status: 'pending' | 'approved' | 'declined';
    date?: string;
}

export const orders: Order[] = [
     {
        id: 'ord-1694523600000',
        patientName: 'Demo Patient',
        items: [
            { productId: 'prod-1', name: 'Paracetamol 500mg', quantity: 2 },
            { productId: 'prod-3', name: 'Ibuprofen 200mg', quantity: 1 }
        ],
        total: 260,
        status: 'approved',
        date: '2024-07-18'
    },
    {
        id: 'ord-1694523700000',
        patientName: 'Demo Patient',
        items: [
            { productId: 'prod-4', name: 'Vitamin C 1000mg', quantity: 1 }
        ],
        total: 450,
        status: 'approved',
        date: '2024-06-25'
    }
];

export interface MedicalRecord {
    id: string;
    fileName: string;
    uploadDate: string;
    type: 'Lab Report' | 'Prescription' | 'Imaging';
}

export const medicalRecords: MedicalRecord[] = [
    { id: 'rec-1', fileName: 'blood_test_results.pdf', uploadDate: '2024-07-10', type: 'Lab Report' },
    { id: 'rec-2', fileName: 'chest_xray.pdf', uploadDate: '2024-06-22', type: 'Imaging' },
];

// Functions below are now deprecated in favor of useDataStore actions
// They are kept for reference during refactoring but should not be used in new code.

export const addAppointment = (appointment: Omit<Appointment, 'id' | 'status' | 'patientName'>) => {
    console.warn("`addAppointment` from `data.ts` is deprecated. Use `useDataStore` hook instead.");
    return null;
};

    
