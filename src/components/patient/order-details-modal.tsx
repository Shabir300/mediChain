"use client";

import { Order as OrderType } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X } from 'lucide-react';
import Image from 'next/image';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderType | null;
}

export const OrderDetailsModal = ({ isOpen, onClose, order }: OrderDetailsModalProps) => {
    if (!order) return null;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'secondary';
            case 'declined': return 'destructive';
            default: return 'secondary';
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Order #{order.id.slice(-6).toUpperCase()}</DialogTitle>
                    <DialogClose asChild><Button variant="ghost" size="icon" className="rounded-full"><X className="h-4 w-4" /></Button></DialogClose>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Order Summary</h4>
                        <p className="text-sm text-muted-foreground">
                            Date: {order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleString() : "Processing..."}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Total: Rs. {order.totalAmount.toFixed(2)}
                        </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold">Items</h4>
                        <div className="space-y-2 mt-2">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <Image src={item.imageUrl} alt={item.medicineName} width={64} height={64} className="rounded-md object-cover" />
                                    <div>
                                        <p className="font-medium">{item.medicineName} (x{item.quantity})</p>
                                        <p className="text-sm text-muted-foreground">Rs. {item.subtotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold">Pharmacies</h4>
                        {order.pharmacies.map((pharmacy, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <p>{pharmacy.pharmacyName}</p>
                                <Badge variant={getStatusVariant(pharmacy.status)}>{pharmacy.status}</Badge>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold">Delivery Address</h4>
                        <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};