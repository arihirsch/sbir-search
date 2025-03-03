import React, { createContext, useContext, useState, ReactNode } from 'react';

type NavbarContextType = {
  topicFilter: string;
  setTopicFilter: (filter: string) => void;
};

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [topicFilter, setTopicFilter] = useState<string>('');

  return (
    <NavbarContext.Provider value={{ topicFilter, setTopicFilter }}>
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