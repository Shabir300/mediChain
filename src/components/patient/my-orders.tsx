
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { collectionGroup, query, where, addDoc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Minus, Plus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import type { Product, Order } from '@/lib/types';


interface CartItem extends Product {
  quantity: number;
}

export function MyOrders() {
  const { user } = useAuth();
  const firestore = useFirestore();
  
  // Query for all products across all pharmacies
  const allProductsQuery = firestore ? query(collectionGroup(firestore, 'products')) : null;
  const { data: allProducts, loading: productsLoading } = useCollection<Product>(allProductsQuery);

  // Query for orders for the current patient
  const patientOrdersQuery = firestore && user ? query(collection(firestore, `patients/${user.uid}/orders`)) : null;
  const { data: orders, loading: ordersLoading } = useCollection<Order>(patientOrdersQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { toast } = useToast();

  const filteredProducts = allProducts?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImage = (imageIdentifier: string) => {
    if (imageIdentifier.startsWith('data:image')) {
        return imageIdentifier;
    }
    return imageIdentifier;
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    toast({ description: `${product.name} added to cart.` });
  };
  
  const updateQuantity = (productId: string, amount: number) => {
    setCart(cart => cart.map(item => 
      item.id === productId ? {...item, quantity: Math.max(1, item.quantity + amount)} : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
      setCart(cart => cart.filter(item => item.id !== productId));
  }
  
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  
  const handleCheckout = async () => {
    if(cart.length === 0 || !firestore || !user) return;

    // Group cart items by pharmacy
    const ordersByPharmacy = cart.reduce((acc, item) => {
        (acc[item.pharmacyId] = acc[item.pharmacyId] || []).push(item);
        return acc;
    }, {} as Record<string, CartItem[]>);

    toast({ title: 'Placing Orders...', description: 'Please wait.'});

    try {
        for (const pharmacyId in ordersByPharmacy) {
            const items = ordersByPharmacy[pharmacyId];
            const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            const orderData = {
                patientId: user.uid,
                pharmacyId: pharmacyId,
                items: items.map(item => ({ productId: item.id, name: item.name, quantity: item.quantity })),
                total: total,
                status: 'pending' as const,
                date: new Date().toISOString().split('T')[0],
            };

            // Add order to the patient's order subcollection
            await addDoc(collection(firestore, `patients/${user.uid}/orders`), orderData);
        }

        setCart([]);
        setIsCartOpen(false);
        toast({
            title: 'Orders Placed!',
            description: 'Your orders have been sent to the respective pharmacies for approval.'
        })
    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not place your orders.' });
    }
  }
  
    const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
        switch(status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'declined': return 'destructive';
            default: return 'secondary';
        }
    }

  return (
    <div className='space-y-8'>
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <Card>
                 <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline">Order Medicine</CardTitle>
                        <CardDescription>Search for medicine from all pharmacies and add to your cart.</CardDescription>
                    </div>
                     <SheetTrigger asChild>
                        <Button variant="outline" className="shrink-0">
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
                    placeholder="Search for medicine..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {productsLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts?.map((product) => {
                            const imageUrl = product.images && product.images.length > 0 ? getImage(product.images[0]) : null;
                            return (
                                <Card key={product.id} className="flex flex-col">
                                    <CardHeader className='p-0'>
                                        {imageUrl ? <Image src={imageUrl} alt={product.name} width={400} height={300} className='w-full h-40 object-cover rounded-t-lg'/> : <div className='w-full h-40 bg-muted rounded-t-lg'/>}
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold">{product.name}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{product.pharmacyName}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                        <p className="font-bold mt-2">PKR {product.price.toFixed(2)}</p>
                                    </CardContent>
                                    <CardFooter className="p-4">
                                        <Button className="w-full" onClick={() => addToCart(product)} disabled={product.stock === 0}>
                                            <ShoppingCart className="mr-2 h-4 w-4" /> {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                         {filteredProducts?.length === 0 && (
                            <p className="text-center py-8 text-muted-foreground col-span-full">No products match your search.</p>
                        )}
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
                        <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">PKR {item.price.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground/80">{item.pharmacyName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className='h-6 w-6' onClick={() => updateQuantity(item.id, -1)}><Minus className='h-4 w-4'/></Button>
                                        <span>{item.quantity}</span>
                                        <Button size="icon" variant="ghost" className='h-6 w-6' onClick={() => updateQuantity(item.id, 1)}><Plus className='h-4 w-4'/></Button>
                                        <Button size="icon" variant="ghost" className='h-6 w-6 text-destructive' onClick={() => removeFromCart(item.id)}><X className='h-4 w-4'/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="border-t pt-4">
                        <Separator className="mb-4" />
                        <div className='flex justify-between font-bold text-lg'>
                            <span>Total</span>
                            <span>PKR {cartTotal.toFixed(2)}</span>
                        </div>
                        <Button className="w-full mt-4" onClick={handleCheckout}>Checkout</Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
       
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">My Order History</CardTitle>
            <CardDescription>Track the status of your recent medicine orders.</CardDescription>
        </CardHeader>
        <CardContent>
            {ordersLoading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
                {orders.map((order) => (
                <Card key={order.id}>
                    <CardHeader>
                        <div className='flex justify-between items-start'>
                            <div>
                                <CardTitle className='text-lg'>Order #{order.id.substring(0, 5)}</CardTitle>
                                <CardDescription>Total: PKR {order.total.toFixed(2)} | Date: {order.date}</CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className='text-sm space-y-1 text-muted-foreground'>
                            {order.items.map(item => <li key={item.productId}>{item.name} (x{item.quantity})</li>)}
                        </ul>
                    </CardContent>
                </Card>
                ))}
            </div>
            ) : (
                <p className="text-sm text-center text-muted-foreground py-8">You haven't placed any orders yet.</p>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
    

    