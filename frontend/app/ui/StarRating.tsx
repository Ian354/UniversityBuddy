import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  label?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  size = 'md',
  readOnly = false,
  label
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const handleClick = (newRating: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const stars = Array.from({ length: maxRating }, (_, index) => {
    const starValue = index + 1;
    const isActive = starValue <= rating;

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleClick(starValue)}
        disabled={readOnly}
        className={`${
          readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
        } transition-transform`}
      >
        <svg
          className={`${sizeClasses[size]} ${
            isActive ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-600 text-gray-600'
          } transition-colors`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    );
  });

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center space-x-1">
          {stars}
        </div>
        {!readOnly && (
          <span className="text-sm text-gray-400">
        {rating > 0 ? `${rating}/${maxRating}` : 'Sin calificar'}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;