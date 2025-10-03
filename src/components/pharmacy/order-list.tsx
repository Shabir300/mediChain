
"use client";

import { useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Order } from '../patient/my-orders';

export function OrderList() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Query for all orders across all patients where pharmacyId matches the current user's UID.
    const ordersQuery = firestore && user 
        ? query(collectionGroup(firestore, 'orders'), where('pharmacyId', '==', user.uid), where('status', '==', 'pending'))
        : null;
        
    // A trick to get around collectionGroup queries needing a composite index.
    // This is not ideal for production but works for this MVP.
    // A better approach would be to create a root-level 'orders' collection.
    const allPatientOrdersQuery = firestore ? query(collectionGroup(firestore, 'orders')) : null;
    const { data: allOrders, loading: ordersLoading } = useCollection<Order>(allPatientOrdersQuery);

    const pendingOrders = allOrders?.filter(o => o.pharmacyId === user?.uid && o.status === 'pending');


    const handleUpdateStatus = async (order: Order, status: 'approved' | 'declined') => {
        if (!firestore) return;
        
        // The path to the order is /patients/{patientId}/orders/{orderId}
        const orderRef = doc(firestore, 'patients', order.patientId, 'orders', order.id);
        
        try {
            await updateDoc(orderRef, { status: status });
            toast({
                title: `Order ${status}`,
                description: `Order has been ${status}.`
            });
        } catch (error) {
            console.error("Error updating order status: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update order status.'
            });
        }
    };
    

    if (ordersLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Incoming Orders</CardTitle>
                    <CardDescription>Review and process new orders from patients.</CardDescription>
                </CardHeader>
                <CardContent className='flex justify-center items-center h-40'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Incoming Orders</CardTitle>
                <CardDescription>Review and process new orders from patients.</CardDescription>
            </CardHeader>
            <CardContent>
                {pendingOrders?.length === 0 ? (
                    <p className='text-center text-muted-foreground py-8'>No pending orders.</p>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {pendingOrders?.map(order => (
                            <AccordionItem value={order.id} key={order.id}>
                                <AccordionTrigger>
                                    <div className='flex justify-between w-full pr-4'>
                                        <div className='text-left'>
                                            <p className='font-semibold'>Order #{order.id.slice(-5)}</p>
                                            {/* In a real app, you might fetch patient details here */}
                                            <p className='text-sm text-muted-foreground'>Patient ID: {order.patientId.slice(0, 5)}...</p>
                                        </div>
                                        <div className='flex items-center gap-4'>
                                            <span className='font-bold'>PKR {order.total.toFixed(2)}</span>
                                            <Badge>{order.items.length} items</Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className='p-4 bg-muted/50 rounded-md'>
                                        <ul className='space-y-2 mb-4'>
                                            {order.items.map(item => (
                                                <li key={item.productId} className='flex justify-between'>
                                                    <span>{item.name}</span>
                                                    <span className='text-muted-foreground'>Qty: {item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className='flex gap-2 justify-end'>
                                            <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(order, 'declined')}>Decline</Button>
                                            <Button variant="default" size="sm" onClick={() => handleUpdateStatus(order, 'approved')}>Approve</Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}

// Helper for collectionGroup query - requires an index in Firestore
function collectionGroup(firestore: any, collectionId: string) {
    return (window as any).firebase.firestore.collectionGroup(firestore, collectionId);
}

    