
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { medicalRecords } from './firestore';
import { Timestamp } from 'firebase/firestore';

export const uploadMedicalRecord = async (userId: string, file: File): Promise<string | null> => {
  try {
    const storageRef = ref(storage, `medical_records/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    await medicalRecords.add({
      patientId: userId,
      fileName: file.name,
      downloadURL,
      uploadedAt: Timestamp.now(),
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading medical record:', error);
    return null;
  }
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string | null> => {
    try {
      const storageRef = ref(storage, `profile_images/${userId}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return null;
    }
  };
