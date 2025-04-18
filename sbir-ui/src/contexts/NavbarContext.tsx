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
  
  const [awardAgencyFilter, setAwardAgencyFilter] = useState<string>('');
  const [awardProgramFilter, setAwardProgramFilter] = useState<string>('');
  const [awardPhaseFilter, setAwardPhaseFilter] = useState<string>('');
  const [awardYearFilter, setAwardYearFilter] = useState<string>('');
  const [awardAmountRange, setAwardAmountRange] = useState<number[]>([0, 2500000]);
  const [isAmountRangeActive, setIsAmountRangeActive] = useState<boolean>(false);
  
  const [currentSection, setCurrentSection] = useState<string>('');

  const resetFilters = () => {
    setTopicFilter('');
    setPhaseFilter('');
    setProgramFilter('');
    setAgencyFilter('');
    setAwardAgencyFilter('');
    setAwardProgramFilter('');
    setAwardPhaseFilter('');
    setAwardYearFilter('');
    setAwardAmountRange([0, 2500000]);
    setIsAmountRangeActive(false);
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