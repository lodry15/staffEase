import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, InputProps } from './input';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export function PasswordInput({
  className,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2',
          'text-gray-500 hover:text-gray-700',
          'focus:outline-none focus:text-gray-700'
        )}
        aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}