interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'error' | 'pdf' | 'prompt' | 'pptx' | 'img' | 'default';
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-fixed text-on-primary-fixed',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed',
  success: 'bg-primary-fixed text-on-primary-fixed',
  error: 'bg-error-container text-on-error-container',
  pdf: 'bg-primary-fixed text-on-primary-fixed',
  prompt: 'bg-primary-fixed text-on-primary-fixed',
  pptx: 'bg-secondary-container text-on-secondary-container',
  img: 'bg-primary-fixed text-on-primary-fixed',
  default: 'bg-surface-container-high text-on-surface-variant',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm font-bold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
