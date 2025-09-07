import React from 'react';

function isMobile() {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}

export const MobileOnlyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isMobile()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Solo disponible en móvil</h2>
          <p className="text-gray-600">
            Instala la app en tu teléfono y úsala desde allí. Esta versión de escritorio está
            deshabilitada por tu preferencia.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
