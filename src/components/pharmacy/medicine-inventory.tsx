"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { db, storage } from '@/config/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Medicine } from '@/types';
import { Loader2, PlusCircle, Edit, Trash2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Image from 'next/image';

const medicineSchema = z.object({
    name: z.string().min(1, "Medicine name is required"),
    brand: z.string().min(1, "Brand name is required"),
    category: z.string().min(1, "Category is required"),
    price: z.coerce.number().min(0.01, "Price must be greater than 0"),
    stock: z.coerce.number().min(0, "Stock cannot be negative"),
    expiryDate: z.date({ required_error: "Expiry date is required"}),
    genericName: z.string().optional(),
    form: z.string().optional(),
    lowStockThreshold: z.coerce.number().min(0).optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
});

export const MedicineInventory = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof medicineSchema>>({
        resolver: zodResolver(medicineSchema),
    });

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'medicines'), where('pharmacyId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medicine));
            setMedicines(meds);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDialogOpen = (medicine: Medicine | null) => {
        setEditingMedicine(medicine);
        setImageFile(null);
        setImagePreview(medicine?.imageUrl || null);
        form.reset(medicine ? { ...medicine, expiryDate: medicine.expiryDate.toDate() } : {});
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: z.infer<typeof medicineSchema>) => {
        setIsSubmitting(true);
        try {
            if (editingMedicine) { // Editing existing medicine
                let imageUrl = editingMedicine.imageUrl;
                if (imageFile) {
                    const uploadResult = await uploadMedicineImage(imageFile, user!.uid, editingMedicine.id);
                    imageUrl = uploadResult.fileUrl;
                }
                await updateDoc(doc(db, 'medicines', editingMedicine.id), { ...data, imageUrl, updatedAt: serverTimestamp() });
                toast({ title: "Success", description: "Medicine updated." });
            } else { // Adding new medicine
                const newMedicineRef = doc(collection(db, 'medicines'));
                const medicineId = newMedicineRef.id;
                let imageUrl = '';
                if (imageFile) {
                    const uploadResult = await uploadMedicineImage(imageFile, user!.uid, medicineId);
                    imageUrl = uploadResult.fileUrl;
                }
                await setDoc(newMedicineRef, { ...data, pharmacyId: user!.uid, imageUrl, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                toast({ title: "Success", description: "Medicine added." });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save medicine." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const uploadMedicineImage = async (file: File, pharmacyId: string, medicineId: string) => {
        const storagePath = `medicine_images/${pharmacyId}/${medicineId}/image.jpg`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);
        await uploadTask;
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        return { fileUrl: downloadURL };
    };
    
    const handleDelete = async (medicine: Medicine) => {
        try {
            if (medicine.imageUrl) {
                const imageRef = ref(storage, `medicine_images/${user!.uid}/${medicine.id}/image.jpg`);
                await deleteObject(imageRef);
            }
            await deleteDoc(doc(db, 'medicines', medicine.id));
            toast({ title: "Success", description: "Medicine deleted." });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete medicine." });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Medicine Inventory</CardTitle>
                <CardDescription>Manage your available medicines.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => handleDialogOpen(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add Medicine</Button>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? <Loader2 className="animate-spin" /> : medicines.map(med => (
                        <Card key={med.id}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                {med.imageUrl ? (
                                    <Image src={med.imageUrl} alt={med.name} width={80} height={80} className="rounded-md object-cover" />
                                ) : (
                                    <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center">
                                        <ImageIcon className="h-10 w-10 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <CardTitle>{med.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">Brand: {med.brand}</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p>Stock: {med.stock}</p>
                                <p>Price: Rs. {med.price}</p>
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" size="sm" onClick={() => handleDialogOpen(med)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(med)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingMedicine ? "Edit" : "Add"} Medicine</DialogTitle></DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormItem>
                                <FormLabel>Medicine Image</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
                                </FormControl>
                                {imagePreview && <Image src={imagePreview} alt="preview" width={150} height={150} className="rounded-md mt-2 object-cover" />}
                            </FormItem>
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Medicine Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="expiryDate" render={({ field }) => (<FormItem><FormLabel>Expiry Date</FormLabel><FormControl><DatePicker selected={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select Category"/></SelectTrigger></FormControl><SelectContent><SelectItem value="Painkiller">Painkiller</SelectItem><SelectItem value="Antibiotic">Antibiotic</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </Card>
    );
};