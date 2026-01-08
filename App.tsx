
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Product, CartItem, Order, OrderStatus, WorkflowStageKey, StageData } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Catalog } from './components/Catalog';
import { Cart } from './components/Cart';
import { Tracking } from './components/Tracking';
import { AdminDashboard } from './components/AdminDashboard';
import { ServiceMap } from './components/ServiceMap';
import { PRODUCTS } from './constants';
import { Package, MapPin, Navigation, ArrowRight, Map as MapIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Admin Data States
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [users, setUsers] = useState<User[]>([
    { email: 'admin@absolute.com', name: 'Administrador Principal', role: 'admin' },
    { email: 'logistics@absolute.com', name: 'Encargado Logística', role: 'logistics' },
    { email: 'user@absolute.com', name: 'Usuario Demo', role: 'user' }
  ]);

  // --- Auth Handlers ---
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setUsers(prev => {
        if (!prev.find(u => u.email === loggedInUser.email)) {
            return [...prev, loggedInUser];
        }
        return prev;
    });
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
  };

  // --- Cart Handlers ---
  const addToCart = (product: Product) => {
    const currentProduct = products.find(p => p.id === product.id);
    if (!currentProduct || currentProduct.stock <= 0) {
      alert("No hay más stock disponible de este producto.");
      return;
    }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: p.stock - 1 } : p));
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...currentProduct, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    const itemToRemove = cart.find(item => item.id === id);
    if (!itemToRemove) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock + itemToRemove.quantity } : p));
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const diff = qty - item.quantity;
    if (diff === 0) return;
    if (diff > 0) {
      const currentProduct = products.find(p => p.id === id);
      if (!currentProduct || currentProduct.stock < diff) {
        alert("No hay suficiente stock disponible.");
        return;
      }
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock - diff } : p));
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const createOrder = (startDate: string, endDate: string, destination: string) => {
    if (!user) return;
    const emptyStage: StageData = { status: 'pending', itemChecks: {}, photos: [], files: [] };
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: [...cart],
      userEmail: user.email,
      status: 'Pendiente',
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
      originLocation: 'Bogotá, Colombia',
      destinationLocation: destination,
      workflow: {
        'bodega_check': { ...emptyStage },
        'bodega_to_coord': { ...emptyStage },
        'coord_to_client': { ...emptyStage },
        'client_to_coord': { ...emptyStage },
        'coord_to_bodega': { ...emptyStage },
      }
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
  };

  const handleUpdateStage = (orderId: string, stageKey: WorkflowStageKey, data: StageData) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedWorkflow = { ...order.workflow, [stageKey]: data };
        let newStatus: OrderStatus = 'En Proceso';
        if (updatedWorkflow.coord_to_bodega.status === 'completed') {
          newStatus = 'Finalizado';
        } else if (updatedWorkflow.coord_to_client.status === 'completed') {
          newStatus = 'Entregado';
        }
        return {
          ...order,
          workflow: updatedWorkflow,
          status: order.status === 'Pendiente' ? 'En Proceso' : (newStatus === 'Finalizado' ? 'Finalizado' : newStatus)
        };
      }
      return order;
    }));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleAddProduct = (product: Product) => setProducts(prev => [...prev, product]);
  const handleUpdateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  const handleDeleteProduct = (id: string) => {
    if(window.confirm('¿Está seguro de eliminar este producto?')) {
        setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleUpdateOrderDates = (id: string, start: string, end: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, startDate: start, endDate: end } : o));
  };

  const handleApproveOrder = (id: string) => updateOrderStatus(id, 'En Proceso');
  const handleChangeUserRole = (email: string, role: 'admin' | 'user' | 'logistics') => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, role } : u));
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout user={user} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={user.role === 'logistics' ? <Navigate to="/admin" /> : <Catalog products={products} onAddToCart={addToCart} />} />
          <Route path="/cart" element={<Cart items={cart} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} onCheckout={createOrder} />} />
          <Route path="/orders" element={<OrdersList orders={orders} />} />
          <Route path="/orders/:id" element={<Tracking orders={orders} onUpdateStage={handleUpdateStage} />} />
          {['admin', 'logistics'].includes(user.role) && (
             <>
               <Route path="/admin" element={
                  <AdminDashboard 
                      currentUser={user} products={products} orders={orders} users={users}
                      onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct}
                      onUpdateOrderDates={handleUpdateOrderDates} onApproveOrder={handleApproveOrder} onToggleUserRole={() => {}} 
                      // @ts-ignore
                      onChangeUserRole={handleChangeUserRole} onUpdateStage={handleUpdateStage}
                  />
               } />
               <Route path="/logistics-map" element={<ServiceMap />} />
             </>
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const OrdersList: React.FC<{ orders: Order[] }> = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No tienes pedidos recientes</h3>
        <p className="mt-1 text-sm text-gray-500">Comienza agregando productos del catálogo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map(order => {
          const mapKey = process.env.API_KEY || '';
          const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${mapKey}&origin=Bogota,Colombia&destination=${encodeURIComponent(order.destinationLocation)}&mode=driving`;
          
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl transition-all group flex flex-col">
              {/* Header */}
              <div className="p-5 border-b bg-gray-50/50 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Orden de Despacho</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm bg-white border px-2 py-0.5 rounded font-bold">#{order.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider
                        ${order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.status === 'En Proceso' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.status === 'Entregado' ? 'bg-purple-100 text-purple-800' : ''}
                        ${order.status === 'Finalizado' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                        {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">{order.startDate}</p>
                  <p className="text-[10px] text-gray-500">{order.endDate}</p>
                </div>
              </div>

              {/* Map Item - The map as a distinct part of the order preview */}
              <div className="h-44 relative bg-gray-100 overflow-hidden border-b">
                 <iframe
                    title={`Map preview for ${order.id}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={mapUrl}
                    className="grayscale group-hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100"
                 ></iframe>
                 <div className="absolute bottom-2 left-2 bg-brand-900/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center">
                    <Navigation size={10} className="mr-1" />
                    BOG <ArrowRight size={8} className="mx-1 opacity-50" /> {order.destinationLocation.substring(0, 15)}...
                 </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Responsable</p>
                    <p className="text-sm font-medium text-gray-900">{order.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Artículos</p>
                    <p className="text-sm font-bold text-brand-900">{order.items.reduce((a, b) => a + b.quantity, 0)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg border border-dashed">
                  <Package size={12} className="text-brand-500" />
                  <p className="truncate">{order.items.map(i => i.name).join(', ')}</p>
                </div>

                <div className="flex gap-2">
                    <a 
                        href={`#/orders/${order.id}`}
                        className="flex-1 bg-brand-900 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-lg text-center hover:bg-brand-800 transition shadow-lg active:scale-95 flex items-center justify-center"
                    >
                        Gestionar Flujo
                    </a>
                    <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/Bogota,Colombia/${encodeURIComponent(order.destinationLocation)}`, '_blank')}
                        className="bg-gray-100 text-gray-600 p-3 rounded-lg hover:bg-gray-200 transition"
                        title="Ver en Google Maps"
                    >
                        <MapIcon size={16} />
                    </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
