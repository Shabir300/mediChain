"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/data';
import { useDataStore } from '@/hooks/use-data-store';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lowStockAlert } from '@/ai/flows/low-stock-alerts';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be positive"),
  stock: z.coerce.number().min(0, "Stock can't be negative"),
  image: z.any().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

export function InventoryManagement() {
    const { pharmacyProducts, updateProductStock, addProduct } = useDataStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: "", price: 0, stock: 0, description: "" },
    });

    const getImage = (id: string) => {
        if (id.startsWith('data:image')) {
            return id;
        }
        const placeholder = PlaceHolderImages.find(img => img.id === id);
        return placeholder?.imageUrl;
    };

    const handleStockUpdate = async (product: Product, newStock: number) => {
        updateProductStock(product.id, newStock);

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
        addProduct({
            name: data.name,
            price: data.price,
            stock: data.stock,
            description: data.description,
            image: imagePreview || '',
        });
        toast({
            title: 'Product Added',
            description: `${data.name} has been added to inventory.`
        });
        setIsSubmitting(false);
        setIsAddDialogOpen(false);
        form.reset();
        setImagePreview(null);
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


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
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-24 w-24 rounded-md">
                                        {imagePreview && <AvatarImage src={imagePreview} alt="Product Preview" className='rounded-md object-cover' />}
                                        <AvatarFallback className='rounded-md'>
                                            <Upload />
                                        </AvatarFallback>
                                    </Avatar>
                                     <FormField
                                        control={form.control}
                                        name="image"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Product Image</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Button asChild variant="outline">
                                                        <label htmlFor="product-image-upload" className="cursor-pointer">
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Upload
                                                        </label>
                                                    </Button>
                                                    <Input 
                                                        id="product-image-upload"
                                                        type="file" 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                               <FormField control={form.control} name="name" render={({field}) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                               <FormField control={form.control} name="description" render={({field}) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage/></FormItem>)}/>
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
                        {pharmacyProducts.map(product => {
                             const imageUrl = getImage(product.image);
                             return(
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className='flex items-center gap-4'>
                                        {imageUrl && <Image src={imageUrl} alt={product.name} width={40} height={40} className='rounded-md'/>}
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
