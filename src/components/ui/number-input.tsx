import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, error, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Remove leading zeros
      if (value.length > 1 && value.startsWith('0')) {
        e.target.value = value.replace(/^0+/, '');
      }
      onChange?.(e);
    };

    return (
      <div>
        <input
          type="number"
          className={cn(
            'block w-full rounded-md border border-gray-300',
            'py-2 px-3 text-base placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };