"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Medicine, Order as OrderType, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Minus, Plus, X, Package, Loader2, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Skeleton } from '../ui/skeleton';

interface CartItem {
  medicineId: string;
  pharmacyId: string;
  name: string;
  brand: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  maxStock: number;
}

export function MyOrders() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Map<string, User>>(new Map());
  const [cart, setCart] = useState<CartItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchPharmaciesAndMedicines = async () => {
      try {
        const pharmacyQuery = query(collection(db, 'users'), where('role', '==', 'pharmacy'));
        const pharmacySnapshot = await getDocs(pharmacyQuery);
        const pharmacyMap = new Map<string, User>();
        pharmacySnapshot.docs.forEach(doc => {
            pharmacyMap.set(doc.id, { uid: doc.id, ...doc.data() } as User);
        });
        setPharmacies(pharmacyMap);

        const medicinesRef = collection(db, 'medicines');
        const q = query(medicinesRef, where('stock', '>', 0));
        const snapshot = await getDocs(q);
        const fetchedMedicines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Medicine[];
        setMedicines(fetchedMedicines);

      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch data.', variant: 'destructive' });
      } finally {
        setLoadingMedicines(false);
      }
    };
    fetchPharmaciesAndMedicines();
  }, [toast]);

  const filteredMedicines = useMemo(() =>
    medicines.filter((med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.brand.toLowerCase().includes(searchTerm.toLowerCase())
    ), [medicines, searchTerm]);

  // --- Cart Management & Checkout ---
  const addToCart = (medicine: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === medicine.id);
      if (existing) {
        if (existing.quantity >= medicine.stock) {
          toast({ description: `Only ${medicine.stock} units available.`, variant: 'destructive' });
          return prev;
        }
        return prev.map((item) => item.medicineId === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        medicineId: medicine.id,
        pharmacyId: medicine.pharmacyId,
        name: medicine.name,
        brand: medicine.brand,
        price: medicine.price,
        imageUrl: medicine.imageUrl,
        quantity: 1,
        maxStock: medicine.stock,
      }];
    });
    toast({ description: `${medicine.name} added to cart.` });
  };

  const updateQuantity = (medicineId: string, amount: number) => {
    setCart(cart => cart.map(item => {
      if (item.medicineId === medicineId) {
        const newQuantity = item.quantity + amount;
        if (newQuantity > item.maxStock) {
          toast({ description: `Only ${item.maxStock} units available.`, variant: 'destructive' });
          return item;
        }
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (medicineId: string) => setCart(cart => cart.filter(item => item.medicineId !== medicineId));

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const handleCheckout = async () => {
    if (!user || cart.length === 0) return;
    setIsCheckingOut(true);
    try {
        const pharmacyIds = [...new Set(cart.map(item => item.pharmacyId))];
        const pharmaciesData = pharmacyIds.map(id => {
            const pharmacy = pharmacies.get(id);
            return {
                pharmacyId: id,
                pharmacyName: pharmacy?.pharmacyData?.pharmacyName || 'Unknown Pharmacy',
                status: 'pending'
            };
        });

        const orderData = {
            patientId: user.uid,
            patientName: user.name,
            patientEmail: user.email,
            pharmacyIds,
            pharmacies: pharmaciesData,
            items: cart.map(item => ({
                medicineId: item.medicineId,
                medicineName: item.name,
                brand: item.brand,
                pharmacyId: item.pharmacyId,
                quantity: item.quantity,
                pricePerUnit: item.price,
                subtotal: item.price * item.quantity,
                imageUrl: item.imageUrl || ''
            })),
            totalAmount: cartTotal,
            deliveryAddress: (user as any).patientData?.address || 'Not specified',
            orderDate: serverTimestamp(),
            createdAt: serverTimestamp(),
        };

        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        for (const item of cart) {
            await updateDoc(doc(db, 'medicines', item.medicineId), { stock: increment(-item.quantity) });
        }
        
        await addDoc(collection(db, 'notifications'), {
            userId: user.uid,
            type: 'order_placed',
            title: 'Order Placed!',
            message: `Your order #${orderRef.id.slice(-6)} has been placed.`,
            read: false,
            createdAt: serverTimestamp(),
        });

        setCart([]);
        setIsCartOpen(false);
        toast({ title: 'Order Placed!', description: 'Your order is pending pharmacy approval.' });
    } catch (error) {
        console.error("Checkout error:", error);
        toast({ title: 'Order Failed', description: 'Could not place your order.', variant: 'destructive' });
    } finally {
        setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Order Medicine</CardTitle>
                    <CardDescription>Search for medicine and add to your cart.</CardDescription>
                </div>
                 <SheetTrigger asChild>
                    <Button variant="outline">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        View Cart
                       {cartItemCount > 0 && <Badge className="ml-2">{cartItemCount}</Badge>}
                   </Button>
               </SheetTrigger>
           </CardHeader>
           <CardContent>
           <div className="relative mb-6">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input
               placeholder="Search by medicine or brand..."
               className="pl-10"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               />
           </div>
           {loadingMedicines ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
               </div>
           ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedicines.map((med) => {
                    const pharmacy = pharmacies.get(med.pharmacyId);
                    return (
                    <Card key={med.id} className="flex flex-col">
                        {med.imageUrl ? (
                            <Image src={med.imageUrl} alt={med.name} width={400} height={300} className='w-full h-40 object-cover rounded-t-lg'/>
                        ) : (
                            <div className="h-40 w-full bg-gray-100 rounded-t-lg flex items-center justify-center">
                                <Package className="h-16 w-16 text-gray-400" />
                            </div>
                        )}
                        <CardContent className="p-4 flex-grow space-y-2">
                            <h3 className="font-bold text-lg">{med.name}</h3>
                            <p className="text-sm text-muted-foreground">Brand: {med.brand}</p>
                            <p className="font-bold text-lg">Rs. {med.price.toFixed(2)}</p>
                            {pharmacy && (
                                <div className="pt-2 text-xs text-muted-foreground border-t">
                                    <p className="font-semibold flex items-center"><Store className="h-3 w-3 mr-1"/> {pharmacy.pharmacyData?.pharmacyName}</p>
                                    <p>{pharmacy.pharmacyData?.address}</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-4">
                            <Button className="w-full" onClick={() => addToCart(med)} disabled={med.stock === 0}>
                                {med.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </Button>
                        </CardFooter>
                    </Card>
                )})}
            </div>
           )}
           </CardContent>
       </Card>

        <SheetContent className="flex flex-col">
           <SheetHeader>
               <SheetTitle className="font-headline flex items-center"><ShoppingCart className="mr-2 h-6 w-6"/> Your Cart</SheetTitle>
           </SheetHeader>
           <div className="flex-1 overflow-y-auto pr-4 -mr-6">
               {cart.length === 0 ? (
                   <div className="flex h-full items-center justify-center"><p>Your cart is empty.</p></div>
               ) : (
                   <div className="space-y-4">
                       {cart.map(item => (
                           <div key={item.medicineId} className="flex justify-between items-center">
                               <div>
                                   <p className="font-medium">{item.name}</p>
                                   <p className="text-sm text-muted-foreground">Rs. {item.price.toFixed(2)}</p>
                               </div>
                               <div className="flex items-center gap-2">
                                   <Button size="icon" variant="ghost" className='h-6 w-6' onClick={() => updateQuantity(item.medicineId, -1)}><Minus className='h-4 w-4'/></Button>
                                   <span>{item.quantity}</span>
                                   <Button size="icon" variant="ghost" className='h-6 w-6' onClick={() => updateQuantity(item.medicineId, 1)} disabled={item.quantity >= item.maxStock}><Plus className='h-4 w-4'/></Button>
                                   <Button size="icon" variant="ghost" className='h-6 w-6 text-destructive' onClick={() => removeFromCart(item.medicineId)}><X className='h-4 w-4'/></Button>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
           {cart.length > 0 && (
               <div className="border-t pt-4">
                   <div className='flex justify-between font-bold text-lg'>
                       <span>Total</span>
                       <span>Rs. {cartTotal.toFixed(2)}</span>
                   </div>
                   <Button className="w-full mt-4" onClick={handleCheckout} disabled={isCheckingOut}>
                       {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       Checkout
                   </Button>
               </div>
           )}
       </SheetContent>
   </Sheet>
 );
}