
import { db, auth } from "@/config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
} from "firebase/firestore";
import { User } from "@/types";

// Helper to safely stringify results for the AI model
const safeJsonStringify = (obj: any) => {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        console.error("Failed to stringify object:", error);
        return JSON.stringify({ error: "Result cannot be displayed" });
    }
}

// --- Firestore Query Functions ---

async function searchDoctorsInFirestore(args: {
  specialization?: string;
  minRating?: number;
}) {
  try {
    let q = query(collection(db, "users"), where("role", "==", "doctor"));

    if (args.specialization) {
      q = query(
        q,
        where("doctorData.specialization", "==", args.specialization)
      );
    }
    if (args.minRating) {
      q = query(q, where("doctorData.rating", ">=", args.minRating));
    }

    const querySnapshot = await getDocs(q);
    const doctors: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data() as User;
        doctors.push({
            id: doc.id,
            name: data.name,
            specialization: data.doctorData?.specialization,
            rating: data.doctorData?.rating,
            availability: data.doctorData?.availability,
        });
    });

    return safeJsonStringify({ success: true, doctors });
  } catch (error: any) {
    return safeJsonStringify({ success: false, error: error.message });
  }
}

async function searchMedicinesInFirestore(args: {
  query?: string;
  category?: string;
  maxPrice?: number;
}) {
  try {
    let q = query(collection(db, "medicines"));

    if (args.category) {
      q = query(q, where("category", "==", args.category));
    }
    if (args.maxPrice) {
      q = query(q, where("price", "<=", args.maxPrice));
    }
    // Note: Firestore doesn't support full-text search on its own.
    // The 'query' arg would require a more complex solution (e.g., Algolia/Typesense)
    // For now, we'll filter by name if a query is provided.
    if (args.query) {
        q = query(q, where("name", ">=", args.query), where("name", "<=", args.query + '\uf8ff'));
    }


    const querySnapshot = await getDocs(q);
    const medicines = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return safeJsonStringify({ success: true, medicines });
  } catch (error: any) {
    return safeJsonStringify({ success: false, error: error.message });
  }
}

async function getPatientAppointments(args: {
  filter: "upcoming" | "past" | "all";
  limit?: number;
}) {
  const user = auth.currentUser;
  if (!user) return safeJsonStringify({ success: false, error: "User not authenticated." });

  try {
    let q = query(
      collection(db, "appointments"),
      where("patientId", "==", user.uid)
    );

    const now = new Date().toISOString();
    if (args.filter === "upcoming") {
      q = query(q, where("date", ">=", now), orderBy("date", "asc"));
    } else if (args.filter === "past") {
      q = query(q, where("date", "<", now), orderBy("date", "desc"));
    }

    if (args.limit) {
      q = query(q, limit(args.limit));
    }

    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return safeJsonStringify({ success: true, appointments });
  } catch (error: any) {
    return safeJsonStringify({ success: false, error: error.message });
  }
}

async function getOrderDetails(args: { orderId?: string; totalAmount?: number; status?: string; }) {
    const user = auth.currentUser;
    if (!user) return safeJsonStringify({ success: false, error: "User not authenticated." });

    try {
        let q = query(collection(db, "orders"), where("patientId", "==", user.uid));

        if (args.orderId) {
            q = query(q, where("orderId", "==", args.orderId));
        }
        if (args.totalAmount) {
            q = query(q, where("totalAmount", "==", args.totalAmount));
        }
        if (args.status) {
            q = query(q, where("status", "==", args.status));
        }

        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return safeJsonStringify({ success: true, orders });
    } catch (error: any) {
        return safeJsonStringify({ success: false, error: error.message });
    }
}

async function getMedicalRecords(args: { limit?: number; type?: string; }) {
    const user = auth.currentUser;
    if (!user) return safeJsonStringify({ success: false, error: "User not authenticated." });

    try {
        let q = query(collection(db, "medical_records"), where("patientId", "==", user.uid), orderBy("uploadedAt", "desc"));

        if (args.type) {
            q = query(q, where("type", "==", args.type));
        }
        if (args.limit) {
            q = query(q, limit(args.limit));
        }

        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return safeJsonStringify({ success: true, records });
    } catch (error: any) {
        return safeJsonStringify({ success: false, error: error.message });
    }
}


export async function executePlatformFunction(
  functionName: string,
  args: any
) {
  switch (functionName) {
    case "searchDoctors":
      return await searchDoctorsInFirestore(args);
    case "searchMedicines":
      return await searchMedicinesInFirestore(args);
    case "getAppointments":
      return await getPatientAppointments(args);
    case "getOrderDetails":
        return await getOrderDetails(args);
    case "getMedicalRecords":
        return await getMedicalRecords(args);
    // Note: searchHospitals is not implemented as we don't have a 'hospitals' collection.
    // It would be similar to searchDoctors if the data existed.
    case "searchHospitals":
         return safeJsonStringify({ success: false, error: "Hospital data is not available in the database." });
    default:
      return safeJsonStringify({ error: "Unknown function" });
  }
}
