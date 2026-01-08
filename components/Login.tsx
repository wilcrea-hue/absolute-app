import React, { useState } from 'react';
import { User } from '../types';
import { LOGO_URL } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    if (email && password) {
      if (email.includes('admin')) {
        onLogin({ email, name: 'Administrador', role: 'admin' });
      } else if (email.includes('logis')) {
        onLogin({ email, name: 'Encargado Logística', role: 'logistics' });
      } else {
        onLogin({ email, name: 'Usuario', role: 'user' });
      }
    } else {
      setError('Por favor ingrese credenciales válidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={LOGO_URL} alt="ABSOLUTE Logo" className="h-24 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-brand-900 tracking-tighter">ABSOLUTE</h1>
          <p className="text-gray-500 mt-2">Gestión de Eventos y Promociones</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-900 focus:border-transparent outline-none transition"
              placeholder="usuario@absolute.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-900 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-900 text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition duration-300 shadow-lg"
          >
            Ingresar
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ABSOLUTE App. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};