
import React, { useState } from 'react';
import { Category, Product } from '../types';
import { Search, Plus, AlertCircle, Map as MapIcon, Navigation, ArrowRight, Zap, Info } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const CATEGORIES: Category[] = ['Arquitectura Efímera', 'Mobiliario', 'Electrónica', 'Decoración', 'Servicios'];

export const Catalog: React.FC<CatalogProps> = ({ products, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for the mini-map planner in the Services section
  const [origin, setOrigin] = useState('Bogotá, Colombia');
  const [dest, setDest] = useState('');
  const [showMap, setShowMap] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const mapKey = process.env.API_KEY || '';
  const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${mapKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&mode=driving`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos y Servicios</h2>
          <p className="text-gray-500">Seleccione los artículos para su evento.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-900 shadow-sm text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        <button
          onClick={() => setSelectedCategory('Todos')}
          className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'Todos' 
              ? 'bg-brand-900 text-white shadow-lg' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center ${
              selectedCategory === cat 
                ? 'bg-brand-900 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            {cat === 'Servicios' && <MapIcon size={14} className="mr-2" />}
            {cat}
          </button>
        ))}
      </div>

      {/* Special "Transport Area" Map - Appears when Services is selected */}
      {selectedCategory === 'Servicios' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-6 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <MapIcon className="mr-2 text-brand-500" /> Planificador de Transporte Nacional
                    </h3>
                    <p className="text-sm text-gray-500">Calcule su ruta de despacho antes de agregar el servicio.</p>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Ciudad de Destino..." 
                        value={dest}
                        onChange={(e) => setDest(e.target.value)}
                        className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-900 outline-none min-w-[200px]"
                    />
                    <button 
                        onClick={() => setShowMap(dest.length > 2)}
                        className="bg-brand-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center hover:bg-brand-800 transition-all active:scale-95"
                    >
                        <Zap size={16} className="mr-2" /> Trazar Ruta
                    </button>
                </div>
            </div>
            
            <div className={`transition-all duration-700 overflow-hidden ${showMap ? 'h-80 opacity-100' : 'h-0 opacity-0'}`}>
                {showMap && (
                    <div className="relative h-full">
                        <iframe
                            title="Catalog Route Planner"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={mapUrl}
                        ></iframe>
                        <div className="absolute bottom-4 left-4 bg-brand-900/90 backdrop-blur text-white p-3 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black text-brand-300 uppercase tracking-widest block">Origen</span>
                                <span className="text-xs font-bold">Bogotá</span>
                            </div>
                            <ArrowRight size={14} className="text-brand-300" />
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black text-brand-300 uppercase tracking-widest block">Evento</span>
                                <span className="text-xs font-bold">{dest}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {!showMap && (
                <div className="p-12 flex flex-col items-center justify-center text-center bg-gray-50/30">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border mb-4">
                        <Navigation size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Ingrese un destino para ver el mapa de servicios de transporte.</p>
                </div>
            )}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const isOutOfStock = product.stock <= 0;
          const isTransport = product.id === 'serv-2';
          
          return (
            <div key={product.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border overflow-hidden flex flex-col group ${isOutOfStock ? 'opacity-80' : ''}`}>
              <div className="h-52 overflow-hidden relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className={`w-full h-full object-cover transform transition-transform duration-700 ${isOutOfStock ? 'grayscale' : 'group-hover:scale-110'}`}
                />
                
                {/* Visual badge for Special Services */}
                {isTransport && (
                    <div className="absolute top-0 left-0 w-full p-2 bg-brand-900/10 backdrop-blur-[2px] border-b border-brand-900/20">
                         <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest flex items-center">
                            <MapIcon size={12} className="mr-1" /> Mapa de Ruta Incluido
                         </span>
                    </div>
                )}

                <div className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-[10px] font-black shadow-lg backdrop-blur uppercase tracking-widest ${
                    isOutOfStock 
                      ? 'bg-red-500 text-white' 
                      : product.stock < 5 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white/90 text-brand-900 border border-brand-900/10'
                }`}>
                  {isOutOfStock ? 'AGOTADO' : `Stock: ${product.stock}`}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-brand-500 font-black uppercase tracking-widest">
                        {product.category}
                    </span>
                    {isTransport && <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase border border-brand-200">Logística 24/7</span>}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-brand-800 transition-colors">{product.name}</h3>
                <p className="text-gray-500 text-xs mb-6 flex-1 line-clamp-2 leading-relaxed">{product.description}</p>
                
                <button 
                  onClick={() => onAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md ${
                    isOutOfStock 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-brand-900 text-white hover:bg-brand-800 hover:shadow-xl'
                  }`}
                >
                  {isOutOfStock ? (
                    <>
                      <AlertCircle size={14} />
                      <span>Sin Disponibilidad</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Agregar al Pedido</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed flex flex-col items-center">
          <Info className="text-gray-300 mb-4" size={40} />
          <p className="text-gray-500 font-medium">No se encontraron resultados para "{searchTerm}"</p>
          <button onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}} className="mt-4 text-brand-600 text-sm font-bold hover:underline">Ver todo el catálogo</button>
        </div>
      )}
    </div>
  );
};
