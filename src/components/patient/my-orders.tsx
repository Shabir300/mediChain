
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Product, Order } from '@/lib/data';
import { useDataStore } from '@/hooks/use-data-store';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

interface CartItem extends Product {
  quantity: number;
}

interface PatientStock extends Product {
    patientStock: number;
}

export function MyOrders() {
  const { pharmacyProducts, orders, addOrder } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [patientInventory, setPatientInventory] = useState<PatientStock[]>(() => [
    { ...pharmacyProducts[0], patientStock: 5 }, // Start with 5 Paracetamol
    { ...pharmacyProducts[2], patientStock: 3 }, // And 3 Ibuprofen
  ]);

  const { toast } = useToast();

  const filteredProducts = pharmacyProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

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
  
  const handleCheckout = () => {
    if(cart.length === 0) return;
    addOrder({
        items: cart.map(item => ({ productId: item.id, name: item.name, quantity: item.quantity })),
        total: cartTotal,
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
    });

    // Add ordered items to patient inventory
    setPatientInventory(prevInventory => {
        const newInventory = [...prevInventory];
        cart.forEach(cartItem => {
            const inventoryItem = newInventory.find(invItem => invItem.id === cartItem.id);
            if (inventoryItem) {
                inventoryItem.patientStock += cartItem.quantity;
            } else {
                newInventory.push({ ...cartItem, patientStock: cartItem.quantity });
            }
        });
        return newInventory;
    });

    setCart([]);
    setIsCartOpen(false);
    toast({
        title: 'Order Placed!',
        description: 'Your order has been sent to the pharmacy for approval.'
    })
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
                        <CardDescription>Search for medicine and add to your cart.</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => {
                        const image = product.images && product.images.length > 0 ? getImage(product.images[0]) : null;
                        return (
                            <Card key={product.id} className="flex flex-col">
                                <CardHeader className='p-0'>
                                {image && <Image src={image.imageUrl} alt={image.description} data-ai-hint={image.imageHint} width={400} height={300} className='w-full h-40 object-cover rounded-t-lg'/>}
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold">{product.name}</h3>
                                    </div>
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
                </div>
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
       
        {orders.length > 0 && (
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Order History</CardTitle>
                <CardDescription>Track the status of your recent medicine orders.</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
                ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                    <Card key={order.id}>
                        <CardHeader>
                            <div className='flex justify-between items-start'>
                                <div>
                                    <CardTitle className='text-lg'>Order #{order.id.split('-')[1]}</CardTitle>
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
                )}
            </CardContent>
            </Card>
        )}
    </div>
  );
}
