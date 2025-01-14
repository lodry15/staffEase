import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  className?: string;
}

export function Tooltip({ content, className }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      <HelpCircle 
        className={cn(
          "h-4 w-4 text-gray-400 hover:text-gray-500 cursor-help",
          className
        )} 
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 min-w-[200px]">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}