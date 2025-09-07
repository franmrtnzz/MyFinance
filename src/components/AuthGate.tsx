import React from 'react';

// Modo dispositivo: no hay login
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
