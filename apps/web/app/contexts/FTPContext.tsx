"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface FTPContextType {
  ftp: number;
  setFTP: (ftp: number) => void;
}

const FTPContext = createContext<FTPContextType | undefined>(undefined);

export function FTPProvider({ children }: { children: ReactNode }) {
  const [ftp, setFTPState] = useState<number>(() => {
    // Try to get from localStorage, default to 250
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userFTP");
      return saved ? parseInt(saved, 10) : 250;
    }
    return 250;
  });

  const setFTP = (value: number) => {
    setFTPState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("userFTP", value.toString());
    }
  };

  return (
    <FTPContext.Provider value={{ ftp, setFTP }}>
      {children}
    </FTPContext.Provider>
  );
}

export function useFTPContext() {
  const context = useContext(FTPContext);
  if (context === undefined) {
    throw new Error("useFTPContext must be used within a FTPProvider");
  }
  return context;
}
