"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { Button, Card, StarRating } from '@/app/ui';

interface UniversityRatingFormProps {
  universityId: string;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

interface RatingFormData {
  overall: number;
  installations: number;
  uniLife: number;
  accommodation: number;
  academicLevel: number;
  activities: number;
  comment: string;
}

const UniversityRatingForm: React.FC<UniversityRatingFormProps> = ({
  universityId,
  onSubmitSuccess,
  onClose
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RatingFormData>({
    overall: 0,
    installations: 0,
    uniLife: 0,
    accommodation: 0,
    academicLevel: 0,
    activities: 0,
    comment: ''
  });

  const handleRatingChange = (field: keyof RatingFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      comment: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const requiredFields = ['overall', 'installations', 'uniLife', 'accommodation', 'academicLevel', 'activities'];
    const unratedFields = requiredFields.filter(field => formData[field as keyof RatingFormData] === 0);

    if (unratedFields.length > 0) {
      setError('Please rate all aspects of the university.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Note: This assumes we have a user ID available. In a real app, this would come from auth context
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Debes estar autenticado para enviar una valoración.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('http://localhost:4000/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      
      if (!response.ok) {
        setError('Error fetching user profile. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      const data = await response.json();
      const userId = data.user.id;

      await axios.post(`${apiUrl}/review`, {
        userId,
        universityId: parseInt(universityId),
        ...formData,
        rating: formData.overall // Backend expects overall rating as 'rating' field too
      });

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error submitting the review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingFields = [
    { key: 'overall' as const, label: 'Overall Rating' },
    { key: 'installations' as const, label: 'Facilities' },
    { key: 'uniLife' as const, label: 'University Life' },
    { key: 'accommodation' as const, label: 'Accommodation' },
    { key: 'academicLevel' as const, label: 'Academic Level' },
    { key: 'activities' as const, label: 'Activities' },
  ];

  return (
    <Card title="Add Rating" className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ratingFields.map(({ key, label }) => (
            <StarRating
              key={key}
              rating={formData[key]}
              onRatingChange={(rating) => handleRatingChange(key, rating)}
              label={label}
              size="md"
            />
          ))}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300 text-center">
            Comment (Optional)
          </label>
          <textarea
            value={formData.comment}
            onChange={handleCommentChange}
            placeholder="Share your experience with this university..."
            rows={4}
            className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          />
        </div>

        <div className="flex justify-end space-x-4">
          {onClose && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UniversityRatingForm;