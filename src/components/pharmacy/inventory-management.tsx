
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import { lowStockAlert } from '@/ai/flows/low-stock-alerts';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Upload, X, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


// This should match the backend.json entity
export interface Product {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
}


const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be positive"),
  stock: z.coerce.number().min(0, "Stock can't be negative"),
  images: z.array(z.string()).optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

export function InventoryManagement() {
    const { user, userData } = useAuth();
    const firestore = useFirestore();

    const productsCollectionRef = firestore && user ? collection(firestore, 'pharmacies', user.uid, 'products') : null;
    const { data: pharmacyProducts, loading: productsLoading } = useCollection<Product>(productsCollectionRef);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const addForm = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: "", price: 0, stock: 0, description: "", images: [] },
    });

    const editForm = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
    });

    useEffect(() => {
        if (editingProduct) {
            editForm.reset({
                name: editingProduct.name,
                description: editingProduct.description,
                price: editingProduct.price,
                stock: editingProduct.stock,
                images: editingProduct.images || [],
            });
            setImagePreviews(editingProduct.images || []);
        } else {
            editForm.reset();
            setImagePreviews([]);
        }
    }, [editingProduct, editForm]);


    const getImage = (imageIdentifier: string) => {
        if (imageIdentifier.startsWith('data:image')) {
            return imageIdentifier;
        }
        return imageIdentifier;
    };

    const handleStockUpdate = async (product: Product, newStock: number) => {
        if (!firestore || !user) return;
        const productRef = doc(firestore, 'pharmacies', user.uid, 'products', product.id);
        await updateDoc(productRef, { stock: newStock });

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
    
    const handleAddProduct = async (data: ProductFormValues) => {
        if (!firestore || !user || !userData?.pharmacyName) {
            toast({ variant: 'destructive', title: 'Error', description: 'User or pharmacy data not found.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'pharmacies', user.uid, 'products'), {
                pharmacyId: user.uid,
                pharmacyName: userData.pharmacyName,
                name: data.name,
                price: data.price,
                stock: data.stock,
                description: data.description,
                images: imagePreviews,
            });
            toast({
                title: 'Product Added',
                description: `${data.name} has been added to inventory.`
            });
            setIsAddDialogOpen(false);
            addForm.reset();
            setImagePreviews([]);
        } catch (error) {
            console.error("Error adding product: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add product.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleEditProduct = async (data: ProductFormValues) => {
        if (!editingProduct || !firestore || !user) return;
        setIsSubmitting(true);
        try {
            const productRef = doc(firestore, 'pharmacies', user.uid, 'products', editingProduct.id);
            await updateDoc(productRef, {
                ...data,
                images: imagePreviews,
            });
            toast({
                title: 'Product Updated',
                description: `${data.name} has been successfully updated.`
            });
            setEditingProduct(null);
        } catch (error) {
            console.error("Error updating product: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update product.' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleDeleteProduct = async (productId: string) => {
        if (!firestore || !user) return;
        try {
            await deleteDoc(doc(firestore, 'pharmacies', user.uid, 'products', productId));
            toast({
                title: 'Product Deleted',
                description: `The product has been removed from your inventory.`
            });
        } catch (error) {
            console.error("Error deleting product: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete product.' });
        }
    };

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
                    <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
                        setIsAddDialogOpen(isOpen);
                        if (!isOpen) {
                            addForm.reset();
                            setImagePreviews([]);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button><Plus className='mr-2 h-4 w-4'/> Add Product</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className='font-headline'>Add New Product</DialogTitle>
                            </DialogHeader>
                            <Form {...addForm}>
                                <form onSubmit={addForm.handleSubmit(handleAddProduct)} className="space-y-4">
                                    <FormField
                                        control={addForm.control}
                                        name="images"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Product Images (up to 6)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Button type="button" asChild variant="outline" disabled={imagePreviews.length >= 6}>
                                                        <label htmlFor="product-image-upload-add" className="cursor-pointer">
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Upload Images
                                                        </label>
                                                    </Button>
                                                    <Input 
                                                        id="product-image-upload-add"
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


                                <FormField control={addForm.control} name="name" render={({field}) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={addForm.control} name="description" render={({field}) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={addForm.control} name="price" render={({field}) => (<FormItem><FormLabel>Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={addForm.control} name="stock" render={({field}) => (<FormItem><FormLabel>Initial Stock</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
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
                   {productsLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                   ) : (
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
                            {pharmacyProducts?.map(product => {
                                const imageUrl = product.images && product.images.length > 0 ? getImage(product.images[0]) : null;
                                return(
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className='flex items-center gap-4'>
                                            {imageUrl ? <Image src={imageUrl} alt={product.name} width={40} height={40} className='rounded-md object-cover'/> : <div className='h-10 w-10 bg-muted rounded-md' />}
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
                                        <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>Edit</Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                   )}
                </CardContent>
                 <CardFooter>
                    <p className='text-xs text-muted-foreground'>Total products: {pharmacyProducts?.length || 0}</p>
                </CardFooter>
            </Card>

            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-2xl">
                     <DialogHeader>
                        <DialogTitle className='font-headline'>Edit Product</DialogTitle>
                        <DialogDescription>Update the details for {editingProduct?.name}.</DialogDescription>
                    </DialogHeader>
                    {editingProduct && (
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleEditProduct)} className="space-y-4">
                                
                                <FormField
                                    control={editForm.control}
                                    name="images"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Product Images (up to 6)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Button type="button" asChild variant="outline" disabled={imagePreviews.length >= 6}>
                                                    <label htmlFor="product-image-upload-edit" className="cursor-pointer">
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        Upload Images
                                                    </label>
                                                </Button>
                                                <Input 
                                                    id="product-image-upload-edit"
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
                                        {imagePreviews.map((src, index) => {
                                            const imageUrl = getImage(src);
                                            return (
                                            <div key={index} className="relative">
                                                {imageUrl && <Image src={imageUrl} alt={`Preview ${index + 1}`} width={100} height={100} className="w-full h-24 object-cover rounded-md" />}
                                                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )})}
                                    </div>
                                )}


                            <FormField control={editForm.control} name="name" render={({field}) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                            <FormField control={editForm.control} name="description" render={({field}) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage/></FormItem>)}/>
                            <FormField control={editForm.control} name="price" render={({field}) => (<FormItem><FormLabel>Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                            <FormField control={editForm.control} name="stock" render={({field}) => (<FormItem><FormLabel>Current Stock</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                            <DialogFooter className="justify-between sm:justify-between w-full">
                                <div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button type="button" variant="destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the product from your inventory.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => {
                                                    handleDeleteProduct(editingProduct.id);
                                                    setEditingProduct(null);
                                                }}>
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className='flex gap-2'>
                                    <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Save Changes
                                    </Button>
                                </div>
                            </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

    