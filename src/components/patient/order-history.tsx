"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Order as OrderType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '../ui/button';
import { OrderDetailsModal } from './order-details-modal';

export function OrderHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    const q = query(collection(db, 'orders'), where('patientId', '==', user.uid), orderBy('orderDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderType[];
      setOrders(fetchedOrders);
      setLoadingOrders(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.items.some(item => 
                item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.brand.toLowerCase().includes(searchTerm.toLowerCase())
            ) ||
            order.pharmacies.some(p => p.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    switch (activeTab) {
        case 'pending': return filtered.filter(o => o.pharmacies.some(p => p.status === 'pending'));
        case 'accepted': return filtered.filter(o => o.pharmacies.every(p => p.status === 'approved' || p.status === 'delivered'));
        case 'declined': return filtered.filter(o => o.pharmacies.some(p => p.status === 'declined'));
        default: return filtered;
    }
  }, [orders, searchTerm, activeTab]);

  const handleViewDetails = (order: OrderType) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <>
    <div className='space-y-8'>
       <Card>
            <CardHeader>
                <CardTitle className="font-headline">Order History</CardTitle>
                <CardDescription>View and track all your medicine orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative mb-6">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                   <Input
                        placeholder="Search by medicine, brand, or pharmacy..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>

                <Tabs defaultValue="pending" onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="accepted">Accepted</TabsTrigger>
                        <TabsTrigger value="declined">Declined</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activeTab}>
                    {loadingOrders ? (
                        <div className="space-y-4 mt-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                        </div>
                   ) : filteredOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-4">No orders found.</p>
                   ) : (
                   <div className="space-y-4 mt-4">
                       {filteredOrders.map((order) => (
                       <Card key={order.id}>
                           <CardHeader>
                               <div className='flex justify-between items-start'>
                                   <div>
                                       <CardTitle className='text-lg'>Order #{order.id.slice(-6).toUpperCase()}</CardTitle>
                                       <CardDescription>
                                           Total: Rs. {order.totalAmount.toFixed(2)} | Date: {order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : "Processing..."}
                                       </CardDescription>
                                   </div>
                                   <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>View Details</Button>
                               </div>
                           </CardHeader>
                       </Card>
                       ))}
                   </div>
                   )}
                    </TabsContent>
                </Tabs>
           </CardContent>
       </Card>
   </div>
   <OrderDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} order={selectedOrder} />
   </>
 );
}