'use client';

import { LucideIcon, LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Re-export commonly used icons for easy access
export {
  // Navigation
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  
  // Actions
  Key,
  Download,
  Upload,
  Copy,
  Check,
  Plus,
  Minus,
  Edit,
  Trash2,
  Search,
  Settings,
  RefreshCw,
  LogOut,
  LogIn,
  
  // Status
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Loader2,
  
  // Social
  MessageCircle,
  Users,
  User,
  UserPlus,
  
  // Gaming/Script related
  Gamepad2,
  Code,
  Terminal,
  Cpu,
  Zap,
  Shield,
  Lock,
  Unlock,
  Crown,
  Star,
  
  // UI
  Sun,
  Moon,
  Eye,
  EyeOff,
  Bell,
  Heart,
  Clock,
  Calendar,
  
  // Misc
  Github,
  Globe,
  Mail,
  Phone,
  MapPin,
  Link,
  
} from 'lucide-react';

// Icon wrapper component with consistent sizing
interface IconProps extends LucideProps {
  name?: keyof typeof LucideIcons;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function Icon({ name, size = 'md', className = '', ...props }: IconProps) {
  if (!name) return null;
  
  const IconComponent = LucideIcons[name] as LucideIcon;
  if (!IconComponent) return null;
  
  return (
    <IconComponent
      size={sizeMap[size]}
      className={`shrink-0 ${className}`}
      {...props}
    />
  );
}

// Icon box - icon with background
interface IconBoxProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const iconBoxSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconBoxVariants = {
  default: 'bg-[var(--background-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
  primary: 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20',
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export function IconBox({ icon, size = 'md', variant = 'default', className = '' }: IconBoxProps) {
  return (
    <div
      className={`
        inline-flex items-center justify-center
        rounded-[var(--radius-sm)]
        ${iconBoxSizes[size]}
        ${iconBoxVariants[variant]}
        ${className}
      `}
    >
      {icon}
    </div>
  );
}

export default Icon;
