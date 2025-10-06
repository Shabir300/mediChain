"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const OrderManagement = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('incoming');

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'orders'), where('pharmacyIds', 'array-contains', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(fetchedOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const getPharmacyStatus = (order: Order) => {
        if (Array.isArray(order.pharmacies)) {
            return order.pharmacies.find(p => p.pharmacyId === user!.uid)?.status || 'unknown';
        }
        // Fallback for old/corrupted data
        return (order as any).status || 'unknown';
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const status = getPharmacyStatus(order);
            switch (activeTab) {
                case 'incoming': return status === 'pending';
                case 'accepted': return status === 'approved';
                case 'previous': return status === 'delivered';
                case 'cancelled': return status === 'declined';
                default: return true;
            }
        });
    }, [orders, activeTab, user]);

    const handleUpdateStatus = async (order: Order, status: 'approved' | 'declined' | 'delivered') => {
        try {
            // Read the current pharmacies array
            const currentPharmacies = order.pharmacies;

            // Create the new array with the updated status
            const updatedPharmacies = currentPharmacies.map(p => 
                p.pharmacyId === user!.uid ? { ...p, status: status } : p
            );
            
            // Atomically update the entire array
            await updateDoc(doc(db, 'orders', order.id), { pharmacies: updatedPharmacies });

            if (status === 'declined') {
                for (const item of order.items) {
                    if (item.pharmacyId === user!.uid) {
                        await updateDoc(doc(db, 'medicines', item.medicineId), {
                            stock: increment(item.quantity)
                        });
                    }
                }
            }
            toast({ title: 'Success', description: `Order status updated to ${status}.` });
        } catch (error) {
            console.error("Failed to update status: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.' });
        }
    };

    return (
        <Tabs defaultValue="incoming" onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="incoming">Incoming</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="previous">Previous</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
                <div className="mt-4 space-y-4">
                    {loading ? <Skeleton className="h-48 w-full" /> : filteredOrders.map(order => (
                        <Card key={order.id}>
                            <CardHeader>
                                <div className="flex justify-between">
                                    <CardTitle>Order #{order.id.slice(-6).toUpperCase()}</CardTitle>
                                    <Badge>{getPharmacyStatus(order)}</Badge>
                                </div>
                                <CardDescription>
                                    {order.orderDate && format(order.orderDate.toDate(), 'PPP p')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p><strong>Patient:</strong> {order.patientName}</p>
                                <p><strong>Total for your items:</strong> Rs. {order.items.filter(item => item.pharmacyId === user!.uid).reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}</p>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                {getPharmacyStatus(order) === 'pending' && <Button size="sm" onClick={() => handleUpdateStatus(order, 'approved')}>Accept</Button>}
                                {getPharmacyStatus(order) === 'pending' && <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order, 'declined')}>Decline</Button>}
                                {getPharmacyStatus(order) === 'approved' && <Button size="sm" onClick={() => handleUpdateStatus(order, 'delivered')}>Mark as Delivered</Button>}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
};