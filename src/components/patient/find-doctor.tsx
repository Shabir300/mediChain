"use client";

import { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { User } from "@/types";
import { DoctorProfileModal } from "./doctor-profile-modal";
import { BookingModal } from "./booking-modal";
import { DoctorCard } from "./doctor-card";

// Haversine formula to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// Mock reviews data as requested
const mockReviews = [
    {
      id: "1",
      patientName: "Ahmad Khan",
      rating: 5,
      comment: "Excellent doctor! Very professional and caring. Highly recommended.",
      date: "2025-01-15"
    },
    {
      id: "2",
      patientName: "Sarah Ahmed",
      rating: 4,
      comment: "Good experience overall. The consultation was thorough.",
      date: "2025-01-10"
    },
    {
      id: "3",
      patientName: "Ali Raza",
      rating: 5,
      comment: "Best cardiologist in town. Very knowledgeable and patient.",
      date: "2025-01-05"
    }
  ];


const FindDoctor = () => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<User[]>([]);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 33.6844, lng: 73.0479 }); // Default to Islamabad
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      const q = query(collection(db, "users"), where("role", "==", "doctor"));
      const querySnapshot = await getDocs(q);
      const doctorsData = querySnapshot.docs
        .map(doc => ({ ...doc.data(), uid: doc.id } as User))
        .map(doctor => ({
            ...doctor,
            doctorData: {
                ...doctor.doctorData,
                location: doctor.doctorData?.location || { lat: 0, lng: 0, address: "N/A" },
                ratings: {
                    average: 4.5,
                    count: mockReviews.length,
                },
                reviews: mockReviews,
            }
        }));

      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
      setLoading(false);
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
        },
        () => {
          console.error("Error getting user location.");
        }
      );
    }
  }, []);

  // Handlers for modals
  const handleViewDetails = (doctor: User) => {
    setSelectedDoctor(doctor);
    setIsProfileModalOpen(true);
  };

  const handleBookAppointment = (doctor: User) => {
    setSelectedDoctor(doctor);
    setIsProfileModalOpen(false);
    setIsBookingModalOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingModalOpen(false);
    setSelectedDoctor(null);
  }

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 h-[400px] lg:h-full rounded-lg overflow-hidden">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={12}
          >
            {userLocation && <Marker position={userLocation} icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} />}
            {filteredDoctors.map(doctor => (
             doctor.doctorData?.location?.lat && doctor.doctorData?.location?.lng &&
              <Marker
                key={doctor.uid}
                position={doctor.doctorData.location}
                onClick={() => {
                    setActiveMarker(doctor.uid);
                    handleViewDetails(doctor);
                }}
              >
                {activeMarker === doctor.uid && (
                  <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                    <div>
                      <h3 className="font-bold">{doctor.name}</h3>
                      <p>{doctor.doctorData.specialization}</p>
                      <Button className="mt-2" size="sm" onClick={() => handleViewDetails(doctor)}>View Details</Button>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            ))}
          </GoogleMap>
        ) : (
          <Skeleton className="w-full h-full" />
        )}
      </div>
      <div className="lg:col-span-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 14rem)'}}>
        <Card>
          <CardHeader>
            <CardTitle>Find a Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input placeholder="Search by location..." />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                  <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                  <SelectItem value="Neurologist">Neurologist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-6 space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </>
              ) : (
                filteredDoctors.map(doctor => (
                  <DoctorCard 
                    key={doctor.uid} 
                    doctor={doctor} 
                    onViewDetails={() => handleViewDetails(doctor)}
                    userLocation={userLocation}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {selectedDoctor && (
        <DoctorProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            doctor={selectedDoctor}
            onBookAppointment={() => handleBookAppointment(selectedDoctor)}
        />
    )}

    {selectedDoctor && (
        <BookingModal
            isOpen={isBookingModalOpen}
            onClose={handleCloseBooking}
            doctor={selectedDoctor}
        />
    )}
    </>
  );
};

export default FindDoctor;