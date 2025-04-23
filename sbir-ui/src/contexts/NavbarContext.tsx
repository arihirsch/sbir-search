import React, { createContext, useContext, useState, ReactNode } from 'react';

type NavbarContextType = {
  topicFilter: string;
  setTopicFilter: (filter: string) => void;
  phaseFilter: string;
  setPhaseFilter: (filter: string) => void;
  programFilter: string;
  setProgramFilter: (filter: string) => void;
  agencyFilter: string;
  setAgencyFilter: (filter: string) => void;
  topicYearFilter: string;
  setTopicYearFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  awardAgencyFilter: string;
  setAwardAgencyFilter: (filter: string) => void;
  awardProgramFilter: string;
  setAwardProgramFilter: (filter: string) => void;
  awardPhaseFilter: string;
  setAwardPhaseFilter: (filter: string) => void;
  awardYearFilter: string;
  setAwardYearFilter: (filter: string) => void;
  awardAmountRange: number[];
  setAwardAmountRange: (range: number[]) => void;
  isAmountRangeActive: boolean;
  setIsAmountRangeActive: (active: boolean) => void;
  
  companyStateFilter: string;
  setCompanyStateFilter: (filter: string) => void;
  companyAwardsRange: number[];
  setCompanyAwardsRange: (range: number[]) => void;
  isAwardsRangeActive: boolean;
  setIsAwardsRangeActive: (active: boolean) => void;
  
  currentSection: string;
  setCurrentSection: (section: string) => void;
  resetFilters: () => void;
};

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [phaseFilter, setPhaseFilter] = useState<string>('');
  const [programFilter, setProgramFilter] = useState<string>('');
  const [agencyFilter, setAgencyFilter] = useState<string>('');
  const [topicYearFilter, setTopicYearFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [awardAgencyFilter, setAwardAgencyFilter] = useState<string>('');
  const [awardProgramFilter, setAwardProgramFilter] = useState<string>('');
  const [awardPhaseFilter, setAwardPhaseFilter] = useState<string>('');
  const [awardYearFilter, setAwardYearFilter] = useState<string>('');
  const [awardAmountRange, setAwardAmountRange] = useState<number[]>([0, 2500000]);
  const [isAmountRangeActive, setIsAmountRangeActive] = useState<boolean>(false);
  
  const [companyStateFilter, setCompanyStateFilter] = useState<string>('');
  const [companyAwardsRange, setCompanyAwardsRange] = useState<number[]>([0, 500]);
  const [isAwardsRangeActive, setIsAwardsRangeActive] = useState<boolean>(false);
  
  const [currentSection, setCurrentSection] = useState<string>('');

  const resetFilters = () => {
    setTopicFilter('');
    setPhaseFilter('');
    setProgramFilter('');
    setAgencyFilter('');
    setTopicYearFilter('');
    setSearchTerm('');
    setAwardAgencyFilter('');
    setAwardProgramFilter('');
    setAwardPhaseFilter('');
    setAwardYearFilter('');
    setAwardAmountRange([0, 2500000]);
    setIsAmountRangeActive(false);
    setCompanyStateFilter('');
    setCompanyAwardsRange([0, 500]);
    setIsAwardsRangeActive(false);
    setCurrentSection('');
  };

  return (
    <NavbarContext.Provider value={{ 
      topicFilter, 
      setTopicFilter,
      phaseFilter,
      setPhaseFilter,
      programFilter,
      setProgramFilter,
      agencyFilter,
      setAgencyFilter,
      topicYearFilter,
      setTopicYearFilter,
      searchTerm,
      setSearchTerm,
      
      awardAgencyFilter,
      setAwardAgencyFilter,
      awardProgramFilter,
      setAwardProgramFilter,
      awardPhaseFilter,
      setAwardPhaseFilter,
      awardYearFilter,
      setAwardYearFilter,
      awardAmountRange,
      setAwardAmountRange,
      isAmountRangeActive,
      setIsAmountRangeActive,
      
      companyStateFilter,
      setCompanyStateFilter,
      companyAwardsRange,
      setCompanyAwardsRange,
      isAwardsRangeActive,
      setIsAwardsRangeActive,
      
      currentSection,
      setCurrentSection,
      resetFilters
    }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
} 