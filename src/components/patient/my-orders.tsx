"use client";

import { useState } from 'react';
import Image from 'next/image';
import { pharmacyProducts, Product, Order } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface CartItem extends Product {
  quantity: number;
}

function Pharmacy() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
  
  const handleCheckout = () => {
    if(cart.length === 0) return;
    const newOrder: Order = {
        id: `ord-${Date.now()}`,
        patientName: 'Demo Patient',
        items: cart.map(item => ({ productId: item.id, name: item.name, quantity: item.quantity })),
        total: cartTotal,
        status: 'pending'
    };
    setOrders(prev => [...prev, newOrder]);
    setCart([]);
    toast({
        title: 'Order Placed!',
        description: 'Your order has been sent to the pharmacy for approval.'
    })
  }

  return (
    <div className='grid lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Order Medicine</CardTitle>
                <CardDescription>Search for medicine and add to your cart.</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProducts.map((product) => {
                        const image = getImage(product.image);
                        return (
                            <Card key={product.id} className="flex flex-col">
                                <CardHeader className='p-0'>
                                {image && <Image src={image.imageUrl} alt={image.description} data-ai-hint={image.imageHint} width={400} height={300} className='w-full h-40 object-cover rounded-t-lg'/>}
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <h3 className="font-bold">{product.name}</h3>
                                    <p className="text-sm text-muted-foreground">{product.description}</p>
                                    <p className="font-bold mt-2">${product.price.toFixed(2)}</p>
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
        </div>
        <div>
            <Card className="sticky top-20">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><ShoppingCart className="mr-2 h-6 w-6"/> Your Cart</CardTitle>
                </CardHeader>
                <CardContent>
                    {cart.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className='h-6 w-6' onClick={() => updateQuantity(item.id, -1)}><Minus className='h-4 w-4'/></Button>
                                        <span>{item.quantity}</span>
                                        <Button size="icon" variant="ghost" className='h-6 w-6' onClick={() => updateQuantity(item.id, 1)}><Plus className='h-4 w-4'/></Button>
                                        <Button size="icon" variant="ghost" className='h-6 w-6 text-destructive' onClick={() => removeFromCart(item.id)}><X className='h-4 w-4'/></Button>
                                    </div>
                                </div>
                            ))}
                             <Separator />
                            <div className='flex justify-between font-bold text-lg'>
                                <span>Total</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <Button className="w-full" onClick={handleCheckout}>Checkout</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        {orders.length > 0 && (
            <div className="lg:col-span-3 mt-8">
                <MyOrders orders={orders} />
            </div>
        )}
    </div>
  );
}


export function MyOrders({ orders: initialOrders }: { orders?: Order[] }) {
    // In a real app, orders would come from a global state/db
    const [orders, setOrders] = useState<Order[]>(initialOrders || []);

    const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
        switch(status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'declined': return 'destructive';
            default: return 'secondary';
        }
    }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">My Pharmacy Orders</CardTitle>
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
                            <CardDescription>Total: ${order.total.toFixed(2)}</CardDescription>
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
  );
}
