"use client";

import { useState } from 'react';
import Image from 'next/image';
import { pharmacyProducts, Product } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lowStockAlert } from '@/ai/flows/low-stock-alerts';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.coerce.number().min(0.01, "Price must be positive"),
  stock: z.coerce.number().min(0, "Stock can't be negative"),
});
type ProductFormValues = z.infer<typeof productSchema>;

export function InventoryManagement() {
    const [inventory, setInventory] = useState<Product[]>(pharmacyProducts);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: "", price: 0, stock: 0 },
    });

    const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

    const handleStockUpdate = async (product: Product, newStock: number) => {
        const updatedInventory = inventory.map(p => p.id === product.id ? { ...p, stock: newStock } : p);
        setInventory(updatedInventory);

        if (newStock < 5) {
            try {
                const result = await lowStockAlert({
                    productName: product.name,
                    currentStock: newStock,
                    stockChangeReason: 'Manual stock update',
                });
                if (result.alertMessage) {
                    toast({
                        variant: 'destructive',
                        title: 'Low Stock Warning',
                        description: result.alertMessage,
                    });
                }
            } catch (error) {
                console.error("Error with low stock alert AI:", error);
            }
        }
    }
    
    const handleAddProduct = (data: ProductFormValues) => {
        setIsSubmitting(true);
        const newProduct: Product = {
            id: `prod-${Date.now()}`,
            name: data.name,
            price: data.price,
            stock: data.stock,
            image: 'medicine-1', // default image for new products
            description: 'Newly added product'
        };
        setInventory(prev => [newProduct, ...prev]);
        toast({
            title: 'Product Added',
            description: `${data.name} has been added to inventory.`
        });
        setIsSubmitting(false);
        setIsAddDialogOpen(false);
        form.reset();
    }

    return (
        <Card>
            <CardHeader className='flex-row items-center justify-between'>
                <div>
                    <CardTitle className='font-headline'>Inventory</CardTitle>
                    <CardDescription>Manage your pharmacy's product stock.</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className='mr-2 h-4 w-4'/> Add Product</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className='font-headline'>Add New Product</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddProduct)} className="space-y-4">
                               <FormField control={form.control} name="name" render={({field}) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                               <FormField control={form.control} name="price" render={({field}) => (<FormItem><FormLabel>Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                               <FormField control={form.control} name="stock" render={({field}) => (<FormItem><FormLabel>Initial Stock</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                               <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                   <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Add Product
                                   </Button>
                               </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.map(product => {
                             const image = getImage(product.image);
                             return(
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className='flex items-center gap-4'>
                                        {image && <Image src={image.imageUrl} alt={image.description} data-ai-hint={image.imageHint} width={40} height={40} className='rounded-md'/>}
                                        <span>{product.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>PKR {product.price.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        className="w-20"
                                        value={product.stock}
                                        onChange={(e) => handleStockUpdate(product, parseInt(e.target.value) || 0)}
                                    />
                                </TableCell>
                                <TableCell className='text-right'>
                                    {/* Future actions like Edit/Delete can go here */}
                                    <Button variant="ghost" size="sm">Details</Button>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
