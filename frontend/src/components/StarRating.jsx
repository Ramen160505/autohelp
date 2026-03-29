import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 22 }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: size,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= display ? '#f59e0b' : '#374151',
            transition: 'color 0.15s, transform 0.15s',
            transform: !readonly && star <= display ? 'scale(1.15)' : 'scale(1)',
            display: 'inline-block',
          }}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >★</span>
      ))}
    </div>
  );
}
