import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  icon: LucideIcon;
  onClick?: () => void;
  clickable?: boolean;
  error?: string | null;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon: Icon,
  onClick,
  clickable = false,
  error
}: StatsCardProps) {
  return (
    <div 
      className={cn(
        "bg-white overflow-hidden rounded-lg shadow",
        clickable && !error && "cursor-pointer transition-transform hover:scale-105"
      )}
      onClick={clickable && !error ? onClick : undefined}
    >
      <div className="p-6">
        {error ? (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon className="h-6 w-6 text-brand-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {value}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {description}
              </p>
              {trend && (
                <p className={cn(
                  "mt-2 text-sm",
                  trend.positive ? "text-green-600" : "text-amber-600"
                )}>
                  {trend.value}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}