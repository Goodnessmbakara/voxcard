import { Link } from 'react-router-dom';

interface VoxCardLogoProps {
  variant?: 'full' | 'mark' | 'word';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkTo?: string;
}

export const VoxCardLogo = ({
  variant = 'full',
  size = 'md',
  className = '',
  linkTo,
}: VoxCardLogoProps) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };
  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };
  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const LogoMark = () => (
    <img 
      src="/voxcard-logo.png" 
      alt="VoxCard Logo" 
      className={`object-contain ${sizeClasses[size]}`}
    />
  );

  const LogoText = () => (
    <div className="flex flex-col justify-center">
      <span className={`font-heading font-bold text-vox-secondary leading-tight ${textSizes[size]}`}>VoxCard</span>
      <span className={`font-sans text-vox-secondary/70 italic ${taglineSizes[size]}`}>Save Safe, Win Sure.</span>
    </div>
  );

  const content = (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LogoMark />
      <LogoText />
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
}; 