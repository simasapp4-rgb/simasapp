import React from 'react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('https://i.imgur.com/hgMTKRD.jpeg')" }}
    >
      <div className="max-w-md w-full p-8 bg-slate-800/60 backdrop-blur-sm rounded-xl text-center text-white animate-fade-in">
        <i className="fas fa-exclamation-triangle fa-3x text-yellow-400 mb-4"></i>
        <h2 className="text-2xl font-bold mb-2">Gagal Memuat Aplikasi</h2>
        <p className="text-gray-300 mb-6">
          Terjadi kesalahan saat mencoba memuat data aplikasi.
        </p>
        <div className="bg-red-900/50 border border-red-700 p-3 rounded-lg text-left text-sm mb-6">
          <p className="font-mono">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-200"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Coba Lagi
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;
