import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    searchDoctorsInFirestore,
    searchMedicinesInFirestore,
    getPatientAppointments,
    getOrderFromFirestore,
    searchHospitalsInFirestore,
    getPatientMedicalRecords
} from "./firestore-queries";

// Use the correct environment variable for Next.js
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);

const FUNCTIONS = [
    {
      name: "searchDoctors",
      description: "Search for doctors by specialization, location, availability, and ratings",
      parameters: {
        type: "object",
        properties: {
          specialization: { type: "string", description: "Doctor's specialization (e.g., cardiologist, neurologist)" },
          maxDistance: { type: "number", description: "Maximum distance in km" },
          minRating: { type: "number", description: "Minimum rating (0-5)" },
          availableToday: { type: "boolean", description: "Filter for doctors available today" }
        },
        required: ["specialization"]
      }
    },
    {
      name: "searchMedicines",
      description: "Search for medicines by name, category, or condition",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (medicine name or condition)" },
          category: { type: "string", description: "Medicine category" },
          maxPrice: { type: "number", description: "Maximum price budget" },
          sortBy: { type: "string", enum: ["price", "name", "relevance"], description: "Sort order" }
        },
        required: ["query"]
      }
    },
    {
      name: "getAppointments",
      description: "Get patient's appointments (upcoming, past, or specific)",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", enum: ["upcoming", "past", "today", "all"], description: "Filter type" },
          limit: { type: "number", description: "Number of results to return" }
        },
        required: ["filter"]
      }
    },
    {
      name: "getOrderDetails",
      description: "Get details of a specific order or search orders",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Specific order ID" },
          totalAmount: { type: "number", description: "Search by total amount" },
          status: { type: "string", description: "Order status" }
        }
      }
    },
    {
      name: "searchHospitals",
      description: "Search hospitals by facilities, distance, or emergency services",
      parameters: {
        type: "object",
        properties: {
          facilities: { type: "array", items: { type: "string" }, description: "Required facilities (ICU, Emergency, etc.)" },
          maxDistance: { type: "number", description: "Maximum distance in km" },
          ambulanceAvailable: { type: "boolean", description: "Filter for ambulance availability" }
        }
      }
    },
    {
      name: "getMedicalRecords",
      description: "Get patient's uploaded medical records",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of records to return" },
          type: { type: "string", description: "Record type (prescription, lab report, etc.)" }
        }
      }
    }
  ];
  

export async function sendMessage(conversationHistory: any[], userMessage: string) {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", // Changed to the stable and generally available model
      tools: [{ functionDeclarations: FUNCTIONS }]
    });
  
    const chat = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
  
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
  
    if (response.functionCalls()) {
      const functionCall = response.functionCalls()[0];
      
      const functionResult = await executePlatformFunction(
        functionCall.name,
        functionCall.args
      );
      
      const followUp = await chat.sendMessage([{
        functionResponse: {
          name: functionCall.name,
          response: functionResult
        }
      }]);
      
      return followUp.response.text();
    }
    
    return response.text();
}

async function executePlatformFunction(functionName: string, args: any) {
    switch(functionName) {
      case "searchDoctors":
        return await searchDoctorsInFirestore(args);
      case "searchMedicines":
        return await searchMedicinesInFirestore(args.query, args);
      case "getAppointments":
        // Assuming you have the current user's ID
        return await getPatientAppointments("currentUserId", args.filter);
      case "getOrderDetails":
        return await getOrderFromFirestore("currentUserId", args.orderId, args.totalAmount);
      case "searchHospitals":
        return await searchHospitalsInFirestore(args);
      case "getMedicalRecords":
        return await getPatientMedicalRecords("currentUserId");
      default:
        return { error: "Unknown function" };
    }
  }
