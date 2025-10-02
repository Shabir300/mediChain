
"use client";

import { useDataStore } from '@/hooks/use-data-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function OrderList() {
    const { orders, updateOrderStatus } = useDataStore();
    const { toast } = useToast();

    const handleUpdateStatus = (orderId: string, status: 'approved' | 'declined') => {
        updateOrderStatus(orderId, status);
        toast({
            title: `Order ${status}`,
            description: `Order #${orderId.slice(-5)} has been ${status}.`
        });
    };
    
    const pendingOrders = orders.filter(o => o.status === 'pending');

    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Incoming Orders</CardTitle>
                <CardDescription>Review and process new orders from patients.</CardDescription>
            </CardHeader>
            <CardContent>
                {pendingOrders.length === 0 ? (
                    <p className='text-center text-muted-foreground py-8'>No pending orders.</p>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {pendingOrders.map(order => (
                            <AccordionItem value={order.id} key={order.id}>
                                <AccordionTrigger>
                                    <div className='flex justify-between w-full pr-4'>
                                        <div className='text-left'>
                                            <p className='font-semibold'>Order #{order.id.slice(-5)}</p>
                                            <p className='text-sm text-muted-foreground'>{order.patientName}</p>
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
                                            <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(order.id, 'declined')}>Decline</Button>
                                            <Button variant="default" size="sm" onClick={() => handleUpdateStatus(order.id, 'approved')}>Approve</Button>
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
