
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Upload, X, PackageOpen } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be positive"),
  stock: z.coerce.number().min(0, "Stock can't be negative"),
  images: z.any().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

export function InventoryManagement() {
    const { pharmacyProducts, updateProductStock, addProduct } = useDataStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: "", price: 0, stock: 0, description: "" },
    });

    const getImage = (imageIdentifier: string) => {
        if (imageIdentifier.startsWith('data:image')) {
            return imageIdentifier;
        }
        const placeholder = PlaceHolderImages.find(img => img.id === imageIdentifier);
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
            images: imagePreviews, // Always pass as an array
        });
        toast({
            title: 'Product Added',
            description: `${data.name} has been added to inventory.`
        });
        setIsSubmitting(false);
        setIsAddDialogOpen(false);
        form.reset();
        setImagePreviews([]);
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const currentPreviews = Array.from(files).slice(0, 6 - imagePreviews.length);
            const newPreviews: string[] = [];

            currentPreviews.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    if (newPreviews.length === currentPreviews.length) {
                        setImagePreviews(prev => [...prev, ...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImagePreviews(previews => previews.filter((_, i) => i !== index));
    };


    return (
        <>
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
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className='font-headline'>Add New Product</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleAddProduct)} className="space-y-4">
                                    
                                    <FormField
                                        control={form.control}
                                        name="images"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Product Images (up to 6)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Button asChild variant="outline" disabled={imagePreviews.length >= 6}>
                                                        <label htmlFor="product-image-upload" className="cursor-pointer">
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Upload Images
                                                        </label>
                                                    </Button>
                                                    <Input 
                                                        id="product-image-upload"
                                                        type="file" 
                                                        multiple
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        disabled={imagePreviews.length >= 6}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                            {imagePreviews.map((src, index) => (
                                                <div key={index} className="relative">
                                                    <Image src={src} alt={`Preview ${index + 1}`} width={100} height={100} className="w-full h-24 object-cover rounded-md" />
                                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}


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
                                const imageUrl = product.images && product.images.length > 0 ? getImage(product.images[0]) : null;
                                return(
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className='flex items-center gap-4'>
                                            {imageUrl ? <Image src={imageUrl} alt={product.name} width={40} height={40} className='rounded-md'/> : <div className='h-10 w-10 bg-muted rounded-md' />}
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
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(product)}>Details</Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <p className='text-xs text-muted-foreground'>Total products: {pharmacyProducts.length}</p>
                </CardFooter>
            </Card>

            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-2xl">
                     {selectedProduct && (
                        <>
                            <DialogHeader>
                                <DialogTitle className='font-headline flex items-center gap-2'><PackageOpen/>{selectedProduct.name}</DialogTitle>
                                <DialogDescription>{selectedProduct.description}</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <Carousel className="w-full">
                                    <CarouselContent>
                                        {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                            selectedProduct.images.map((img, index) => {
                                                const imageUrl = getImage(img);
                                                return imageUrl ? (
                                                    <CarouselItem key={index}>
                                                        <Image src={imageUrl} alt={`${selectedProduct.name} - image ${index + 1}`} width={400} height={400} className='w-full h-64 object-cover rounded-lg border'/>
                                                    </CarouselItem>
                                                ) : null
                                            })
                                        ) : (
                                            <CarouselItem>
                                                <div className='w-full h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground'>No Image</div>
                                            </CarouselItem>
                                        )}
                                    </CarouselContent>
                                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                                        <>
                                            <CarouselPrevious />
                                            <CarouselNext />
                                        </>
                                    )}
                                </Carousel>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Price</h4>
                                        <p className="text-lg font-bold">PKR {selectedProduct.price.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Current Stock</h4>
                                        <p className="text-lg font-bold">{selectedProduct.stock} units</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Product ID</h4>
                                        <p className="text-xs text-muted-foreground font-mono">{selectedProduct.id}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                     )}
                </DialogContent>
            </Dialog>
        </>
    );
}


    