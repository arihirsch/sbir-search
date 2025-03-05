import { getAgencyLogo } from "@/utils/agencyLogos";

interface AgencyLogoProps {
  agency: string | undefined | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AgencyLogo({ agency, className = "", size = 'md' }: AgencyLogoProps) {
  const logoPath = getAgencyLogo(agency);
  
  if (!logoPath) return null;
  
  // Size classes with both min and max dimensions
  const sizeClasses = {
    sm: 'w-6 h-6 min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px]',
    md: 'w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px]',
    lg: 'w-24 h-24 min-w-[96px] min-h-[96px] max-w-[96px] max-h-[96px]',
    xl: 'w-48 h-48 min-w-[192px] min-h-[192px] max-w-[192px] max-h-[192px]'
  };
  
  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <img 
        src={logoPath} 
        alt={`${agency} logo`} 
        className="w-full h-full object-contain"
      />
    </div>
  );
} 