import { cn } from '@/lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <table
        className={cn(
          "w-full text-sm text-left text-gray-500 min-w-[640px]",
          "border-collapse bg-white",
          className
        )}
        {...props}
      />
    </div>
  );
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead 
      className={cn(
        "text-xs uppercase bg-gray-50 text-gray-700",
        "border-b border-slate-200",
        className
      )} 
      {...props} 
    />
  );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody 
      className={cn(
        "divide-y divide-slate-200 bg-white",
        "[&>tr:nth-child(even)]:bg-gray-50/50",
        className
      )} 
      {...props} 
    />
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr 
      className={cn(
        "transition-colors duration-200",
        "hover:bg-gray-100/75",
        className
      )} 
      {...props} 
    />
  );
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-gray-900",
        "whitespace-nowrap tracking-wider text-sm",
        "first:rounded-tl-lg last:rounded-tr-lg",
        className
      )}
      {...props}
    />
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableDataCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td 
      className={cn(
        "px-4 py-3 whitespace-nowrap align-middle",
        "transition-colors duration-200",
        "first:rounded-bl-lg last:rounded-br-lg",
        className
      )} 
      {...props} 
    />
  );
}