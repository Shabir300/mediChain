
"use client";

import { useAuth, useCollection, useFirestore } from '@/firebase';
import type { Review } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, StarHalf, Loader2 } from 'lucide-react';
import { collection, query } from 'firebase/firestore';

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex text-amber-400">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} fill="currentColor" className="h-5 w-5" />)}
            {halfStar && <StarHalf key="half" fill="currentColor" className="h-5 w-5" />}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-5 w-5" />)}
        </div>
    );
};

export function Reviews() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const reviewsQuery = firestore && user ? query(collection(firestore, `doctors/${user.uid}/reviews`)) : null;
  const { data: reviews, loading } = useCollection<Review>(reviewsQuery);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Patient Reviews</CardTitle>
        <CardDescription>What your patients are saying about you.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        ) : reviews && reviews.length > 0 ? (
            <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-2">
                    <div className='flex justify-between items-center'>
                        <div className='flex items-center gap-4'>
                            <p className="font-semibold">{review.patientName}</p>
                            {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                    </div>
                <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                </div>
            ))}
            </div>
        ) : (
             <p className="text-center py-8 text-muted-foreground">No reviews yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
