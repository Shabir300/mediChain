export const EMERGENCY_KEYWORDS = [
    'cant breathe', 'difficulty breathing', 'chest pain severe',
    'unconscious', 'heavy bleeding', 'suicide', 'overdose',
    'severe allergic reaction', 'heart attack', 'stroke'
  ];
  
  export function detectEmergency(message: string): boolean {
    const lowerCaseMessage = message.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));
  }
  
  export function assessSymptomSeverity(symptoms: string[]): 'mild' | 'moderate' | 'severe' {
    // This is a simplified assessment. A real-world application would use a more sophisticated model.
    if (symptoms.some(symptom => detectEmergency(symptom))) {
      return 'severe';
    }
    if (symptoms.length > 3) {
      return 'moderate';
    }
    return 'mild';
  }
  
  export function determineRecommendationType(assessment: 'mild' | 'moderate' | 'severe'): 'doctor' | 'medicine' {
    if (assessment === 'severe' || assessment === 'moderate') {
      return 'doctor';
    }
    return 'medicine';
  }
  
  export function formatMedicineGuidance(medicine: any): string {
    return `
      **${medicine.name}**
      *For:* ${medicine.description}
      *Dosage:* ${medicine.dosage}
      *Price:* ${medicine.price}
    `;
  }
  
  export function formatDoctorCard(doctor: any): string {
    return `
      **${doctor.name}**
      *${doctor.specialty}*
      *Rating:* ${doctor.rating}
      *Location:* ${doctor.location}
    `;
  }
  
  export function calculateDistance(userLat: number, userLng: number, targetLat: number, targetLng: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(targetLat - userLat);
    const dLon = deg2rad(targetLng - userLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(targetLat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
  