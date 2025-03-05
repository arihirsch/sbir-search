// Import the logo images
import dodLogo from '@/assets/agency-logos/dod.png';
import dotLogo from '@/assets/agency-logos/dot.svg';
import nsfLogo from '@/assets/agency-logos/nsf.png';
import hhsLogo from '@/assets/agency-logos/hhs.svg';
import armyLogo from '@/assets/agency-logos/army.svg';

// Map agency names to their imported logo files
const agencyLogoMap: Record<string, string> = {
  'HHS': hhsLogo,
  'DOD': dodLogo,
  'NSF': nsfLogo,
  'DOT': dotLogo,
  'ARMY': armyLogo,
};

// Function to get the logo path for a given agency
export function getAgencyLogo(agency: string | undefined | null): string | null {
  if (!agency) return null;
  
  // Normalize agency name (uppercase and trim)
  const normalizedAgency = agency.trim().toUpperCase();
  
  // Return the logo path or null if not found
  return agencyLogoMap[normalizedAgency] || null;
}

// Export the map for direct access if needed
export { agencyLogoMap }; 