export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
}

export const doctors: Doctor[] = [
  { id: '1', name: 'Dr. Evelyn Reed', specialty: 'Cardiologist', avatar: 'doctor-1' },
  { id: '2', name: 'Dr. Samuel Chen', specialty: 'Pediatrician', avatar: 'doctor-2' },
  { id: '3', name: 'Dr. Aisha Khan', specialty: 'Dermatologist', avatar: 'doctor-3' },
];

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  description: string;
}

export const pharmacyProducts: Product[] = [
  { id: 'prod-1', name: 'Paracetamol 500mg', price: 70, stock: 50, image: 'medicine-1', description: "Effective relief from pain and fever." },
  { id: 'prod-2', name: 'Amoxicillin 250mg Syrup', price: 250, stock: 25, image: 'medicine-2', description: "Antibiotic for bacterial infections." },
  { id: 'prod-3', name: 'Ibuprofen 200mg', price: 120, stock: 4, image: 'medicine-3', description: "Reduces inflammation and pain." },
  { id: 'prod-4', name: 'Vitamin C 1000mg', price: 450, stock: 100, image: 'medicine-4', description: "Supports the immune system." },
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
}

export const appointments: Appointment[] = [
    { id: 'apt-1', patientName: 'Alice Johnson', doctorId: '1', doctorName: 'Dr. Evelyn Reed', date: '2024-08-10', time: '10:00 AM', type: 'Urgent', status: 'booked' },
    { id: 'apt-2', patientName: 'Bob Williams', doctorId: '1', doctorName: 'Dr. Evelyn Reed', date: '2024-08-10', time: '11:30 AM', type: 'Normal', status: 'booked' },
];

export interface Order {
    id: string;
    patientName: string;
    items: { productId: string; name: string; quantity: number }[];
    total: number;
    status: 'pending' | 'approved' | 'declined';
}
