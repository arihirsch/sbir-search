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
      setAwardPhaseFilter
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