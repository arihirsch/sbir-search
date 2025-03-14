// Import the logo images
import dotLogo from '@/assets/agency-logos/dot.svg';
import nsfLogo from '@/assets/agency-logos/nsf.png';

import hhsLogo from '@/assets/agency-logos/hhs.svg';
import nihLogo from '@/assets/agency-logos/nih.png';
import cdcLogo from '@/assets/agency-logos/cdc.png';
import aclLogo from '@/assets/agency-logos/acl.png';

import dodLogo from '@/assets/agency-logos/dod.png';
import armyLogo from '@/assets/agency-logos/army.svg';
import navyLogo from '@/assets/agency-logos/navy.png';
import usafLogo from '@/assets/agency-logos/usaf.png';
import darpaLogo from '@/assets/agency-logos/darpa.png';
import mdaLogo from '@/assets/agency-logos/mda.png';
import socomLogo from '@/assets/agency-logos/socom.png';
import dlaLogo from '@/assets/agency-logos/dla.png';
import dtraLogo from '@/assets/agency-logos/dtra.png';
import dhaLogo from '@/assets/agency-logos/dha.png';
import cbdLogo from '@/assets/agency-logos/cbd.png';
import dmeaLogo from '@/assets/agency-logos/dmea.png';
import osdLogo from '@/assets/agency-logos/osd.png';
import nasaLogo from '@/assets/agency-logos/nasa.png';

import usdaLogo from '@/assets/agency-logos/usda.png';
import nifaLogo from '@/assets/agency-logos/nifa.png';

import epaLogo from '@/assets/agency-logos/epa.png';

import edLogo from '@/assets/agency-logos/ed.png';
import iesLogo from '@/assets/agency-logos/ies.png';

import dhsLogo from '@/assets/agency-logos/dhs.png';
import stLogo from '@/assets/agency-logos/S&T.png';
import cwmdLogo from '@/assets/agency-logos/cwmd.png';
import dndoLogo from '@/assets/agency-logos/dndo.png';

import doeLogo from '@/assets/agency-logos/doe.png';
import ocedLogo from '@/assets/agency-logos/oced.png';
import arpa_eLogo from '@/assets/agency-logos/arpa-e.png';

import docLogo from '@/assets/agency-logos/doc.png';
import nistLogo from '@/assets/agency-logos/nist.png';
import noaaLogo from '@/assets/agency-logos/noaa.png';


// Map agency names to their imported logo files
const agencyLogoMap: Record<string, string> = {
  'HHS': hhsLogo,
  'DOD': dodLogo,
  'NSF': nsfLogo,
  'DOT': dotLogo,
  'ARMY': armyLogo,
  'DARPA': darpaLogo,
  'MDA': mdaLogo,
  'NAVY': navyLogo,
  'USAF': usafLogo,
  'SOCOM': socomLogo,
  'NIH': nihLogo,
  'CDC': cdcLogo,
  'ACL': aclLogo,
  'DLA': dlaLogo,
  'DTRA': dtraLogo,
  'DHA': dhaLogo,
  'CBD': cbdLogo,
  'DMEA': dmeaLogo,
  'OSD': osdLogo,
  'NASA': nasaLogo,
  'NIFA': nifaLogo,
  'USDA': usdaLogo,
  'EPA': epaLogo,
  'IES': iesLogo,
  'ED': edLogo,
  'DHS': dhsLogo,
  'S&T': stLogo,
  'CWMD': cwmdLogo,
  'DNDO': dndoLogo,
  'DOE': doeLogo,
  'OCED': ocedLogo,
  'ARPA-E': arpa_eLogo,
  'DOC': docLogo,
  'NIST': nistLogo,
  'NOAA': noaaLogo,
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