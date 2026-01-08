
import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { Trash2, Calendar, CheckCircle, MapPin, Navigation, Map as MapIcon, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface CartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onCheckout: (startDate: string, endDate: string, destination: string) => void;
}

export const Cart: React.FC<CartProps> = ({ items, onRemove, onUpdateQuantity, onCheckout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there's a pre-filled destination from navigation state
  const prefilledDestination = (location.state as any)?.prefilledDestination || '';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState(prefilledDestination);
  const [showPreviewMap, setShowPreviewMap] = useState(!!prefilledDestination);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination.length > 3) {
        setShowPreviewMap(true);
      } else {
        setShowPreviewMap(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [destination]);

  const handleCheckout = () => {
    if (!startDate || !endDate || !destination.trim()) {
      alert("Por favor complete todos los campos: Fechas y Ubicación del Evento");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert("La fecha de inicio no puede ser posterior a la fecha de fin");
        return;
    }
    onCheckout(startDate, endDate, destination);
    navigate('/orders');
  };

  const mapKey = process.env.API_KEY || '';
  const mapPreviewUrl = `https://www.google.com/maps/embed/v1/directions?key=${mapKey}&origin=Bogota,Colombia&destination=${encodeURIComponent(destination)}&mode=driving`;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Calendar size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Su pedido está vacío</h2>
        <p className="text-gray-500 mb-6">Seleccione productos del catálogo para comenzar su reserva.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-brand-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
        >
          Ir al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configuración de su Pedido</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Items and Map */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cart Items List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center">
                <CheckCircle size={18} className="mr-2 text-brand-500" /> Artículos Seleccionados
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-center">Cantidad</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={item.image} alt={item.name} className="h-10 w-10 rounded object-cover mr-3 border shadow-sm" />
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-brand-900 hover:text-white flex items-center justify-center text-gray-600 transition-all"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-brand-900 hover:text-white flex items-center justify-center text-gray-600 transition-all"
                        >
                          +
                        </button>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="text-red-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Map Preview as an "Item" in the order flow */}
          <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-500 ${showPreviewMap ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale pointer-events-none'}`}>
             <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex justify-between items-center">
                <div className="flex items-center">
                    <MapIcon size={18} className="mr-2 text-brand-500" /> Plan de Despacho Logístico
                </div>
                {showPreviewMap && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Ruta Detectada</span>
                )}
             </div>
             <div className="relative h-64 bg-gray-100">
                {showPreviewMap ? (
                    <iframe
                        title="Checkout Route Preview"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={mapPreviewUrl}
                    ></iframe>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <Navigation size={40} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">Ingrese un destino para previsualizar la ruta de transporte.</p>
                    </div>
                )}
             </div>
             {showPreviewMap && (
                 <div className="p-4 bg-brand-900 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-wider">
                        <div className="flex items-center"><MapPin size={14} className="mr-1 text-brand-300"/> Bogotá</div>
                        <ArrowRight size={14} className="text-brand-300" />
                        <div className="flex items-center"><Navigation size={14} className="mr-1 text-brand-300"/> {destination}</div>
                    </div>
                    <div className="text-[10px] opacity-70 italic font-medium">Servicio de transporte incluido en el pedido</div>
                 </div>
             )}
          </div>
        </div>

        {/* Right Column: Reservation Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-lg border p-6 sticky top-8">
            <h3 className="font-bold text-lg mb-6 flex items-center text-brand-900 border-b pb-4">
              <Calendar className="mr-2" size={20} />
              Confirmar Reserva
            </h3>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destino del Evento</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ciudad (Ej: Cali, Valle)"
                    className="w-full border-2 border-gray-100 rounded-lg pl-10 pr-3 py-3 focus:ring-2 focus:ring-brand-900 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha de Montaje</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-900 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha de Desmonte</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-900 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-8 space-y-3 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Artículos:</span>
                <span className="font-bold text-brand-900">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Transporte:</span>
                <span className={`text-xs font-bold uppercase ${showPreviewMap ? 'text-green-600' : 'text-gray-400'}`}>
                    {showPreviewMap ? 'Asignado' : 'Pendiente'}
                </span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={!startDate || !endDate || !destination}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xl ${
                startDate && endDate && destination
                  ? 'bg-brand-900 text-white hover:bg-brand-800' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle size={20} />
              <span>Confirmar Pedido</span>
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed px-4">
                Al confirmar, se iniciará el flujo de verificación en bodega para despacho nacional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
