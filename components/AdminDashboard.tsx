
import React, { useState, useEffect } from 'react';
import { Product, Order, User, WorkflowStageKey, StageData, Signature, OrderStatus } from '../types';
import { Package, Users, ClipboardList, Plus, Edit2, Trash2, Check, Calendar, ChevronDown, ChevronUp, Clock, User as UserIcon, Camera, X, PenTool, Eye, CheckCircle, Info, Lock } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { UserManagement } from './UserManagement';

interface AdminDashboardProps {
  currentUser: User;
  products: Product[];
  orders: Order[];
  users: User[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderDates: (id: string, start: string, end: string) => void;
  onApproveOrder: (id: string) => void;
  onToggleUserRole: (email: string) => void;
  onChangeUserRole?: (email: string, newRole: User['role']) => void;
  onUpdateStage: (orderId: string, stageKey: WorkflowStageKey, data: StageData) => void;
}

const WORKFLOW_STEPS: { key: WorkflowStageKey; label: string }[] = [
  { key: 'bodega_check', label: '1. Bodega' },
  { key: 'bodega_to_coord', label: '2. Entrega Coord' },
  { key: 'coord_to_client', label: '3. Entrega Cliente' },
  { key: 'client_to_coord', label: '4. Recogida' },
  { key: 'coord_to_bodega', label: '5. Retorno Bodega' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  products,
  orders,
  users,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderDates,
  onApproveOrder,
  onToggleUserRole,
  onChangeUserRole,
  onUpdateStage,
}) => {
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'logistics' || currentUser.role === 'coordinator';
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'users'>(
    currentUser.role === 'user' ? 'inventory' : 'orders'
  );
  
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [editingStage, setEditingStage] = useState<{orderId: string, stageKey: WorkflowStageKey, readOnly: boolean} | null>(null);
  const [tempStageData, setTempStageData] = useState<StageData | null>(null);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState<'signature' | 'receivedBy' | null>(null);

  const canManageStage = (order: Order, stageKey: WorkflowStageKey): boolean => {
    // 1. Admin can manage ALL stages IF it's their own order
    if (currentUser.role === 'admin' && order.userEmail === currentUser.email) return true;
    
    // 2. Logistics manages stages 1 and 5
    if (currentUser.role === 'logistics') {
      return stageKey === 'bodega_check' || stageKey === 'coord_to_bodega';
    }
    
    // 3. Coordinator manages stages 2, 3 and 4
    if (currentUser.role === 'coordinator') {
      return stageKey === 'bodega_to_coord' || stageKey === 'coord_to_client' || stageKey === 'client_to_coord';
    }
    
    return false;
  };

  const startEdit = (product?: Product) => {
    if (product) {
      setIsEditingProduct(product.id);
      setEditForm(product);
    } else {
      setIsEditingProduct('new');
      setEditForm({ name: '', category: 'Arquitectura Efímera', description: '', image: '', stock: 10 });
    }
  };

  useEffect(() => {
    if (editingStage) {
        const order = orders.find(o => o.id === editingStage.orderId);
        if (order) setTempStageData(JSON.parse(JSON.stringify(order.workflow[editingStage.stageKey])));
    } else {
        setTempStageData(null);
        setIsSignaturePadOpen(null);
    }
  }, [editingStage, orders]);

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const saveProduct = () => {
    if (isEditingProduct === 'new') onAddProduct({ ...editForm, id: Math.random().toString(36).substr(2, 9) } as Product);
    else onUpdateProduct(editForm as Product);
    setIsEditingProduct(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!tempStageData || !e.target.files || editingStage?.readOnly) return;
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setTempStageData({ ...tempStageData, photos: [...tempStageData.photos, reader.result as string] });
      reader.readAsDataURL(file);
  };

  const handleSaveSignature = (sig: Signature) => {
      if (!tempStageData || !isSignaturePadOpen || editingStage?.readOnly) return;
      setTempStageData({ ...tempStageData, [isSignaturePadOpen]: sig });
      setIsSignaturePadOpen(null);
  };

  const handleSaveStage = () => {
      if (editingStage && tempStageData && !editingStage.readOnly) {
          onUpdateStage(editingStage.orderId, editingStage.stageKey, tempStageData);
          setEditingStage(null);
      }
  };

  const handleCompleteStage = () => {
      if (editingStage && tempStageData && !editingStage.readOnly) {
          onUpdateStage(editingStage.orderId, editingStage.stageKey, { ...tempStageData, status: 'completed', timestamp: new Date().toISOString() });
          setEditingStage(null);
      }
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
           <h2 className="text-2xl font-black text-brand-900 uppercase tracking-tight">Panel de Operaciones</h2>
           <p className="text-xs text-slate-500 font-medium">Control corporativo de flujos y recursos.</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-[1.5rem] w-fit border border-slate-200 shadow-inner">
          {isAdmin && <button onClick={() => setActiveTab('inventory')} className={`px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-[#000033] text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-white/50'}`}>Inventario</button>}
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-[#000033] text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-white/50'}`}>Gestión de Pedidos ({orders.length})</button>
          {isAdmin && <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-[#000033] text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-white/50'}`}>Usuarios</button>}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 min-h-[500px]">
        {activeTab === 'inventory' && isAdmin && (
          <div>
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black text-brand-900 uppercase tracking-widest flex items-center"><Package size={18} className="mr-2 text-brand-400" /> Stock Global</h3>
                <button onClick={() => startEdit()} className="bg-brand-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 flex items-center shadow-lg"><Plus size={16} className="mr-2" /> Nuevo Ítem</button>
             </div>
             {/* Listado de Inventario resumido para brevedad */}
             <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr className="border-b border-slate-100">
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Artículo</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {products.map(p => (
                            <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                                            <img src={p.image} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <span className="font-bold text-sm text-slate-900">{p.name}</span>
                                    </div>
                                </td>
                                <td className="p-5"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">{p.category}</span></td>
                                <td className="p-5 text-center font-black text-brand-900">{p.stock}</td>
                                <td className="p-5 text-right space-x-3">
                                    <button onClick={() => startEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={18} /></button>
                                    <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
            <div>
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-brand-900 uppercase tracking-widest flex items-center"><ClipboardList size={18} className="mr-2 text-brand-400" /> Cola de Operaciones</h3>
                 </div>
                 <div className="space-y-4">
                    {orders.length === 0 && <div className="p-12 text-center text-slate-400 text-sm font-bold">No hay pedidos en curso.</div>}
                    {orders.map(order => {
                      const isExpanded = expandedOrders.has(order.id);
                      
                      return (
                        <div key={order.id} className="border border-slate-100 rounded-[2rem] bg-white hover:shadow-2xl transition-all overflow-hidden group">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 cursor-pointer" onClick={() => toggleOrderExpanded(order.id)}>
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-brand-900 border border-slate-100 group-hover:bg-brand-900 group-hover:text-white transition-colors">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Ord</p>
                                        <p className="font-black text-xs">#{order.id.split('-')[1]}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{order.destinationLocation}</p>
                                        <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mt-1">{order.userEmail}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border
                                        ${order.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-brand-50 text-brand-900 border-brand-200'}
                                    `}>{order.status}</div>
                                    
                                    {order.status === 'Pendiente' && isAdmin && (
                                        <button onClick={(e) => { e.stopPropagation(); onApproveOrder(order.id); }} className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center"><Check size={14} className="mr-2" /> Aprobar</button>
                                    )}
                                    <div className="p-2 rounded-full bg-slate-50 text-slate-400 group-hover:bg-brand-400 group-hover:text-brand-900 transition-colors">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/30 p-8 animate-in slide-in-from-top-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-1"><Package size={14} className="mr-2" /> Carga Planificada</h4>
                                            <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden">
                                                <ul className="divide-y divide-slate-50">
                                                    {order.items.map((item, i) => (
                                                        <li key={i} className="px-5 py-3 flex justify-between items-center text-xs">
                                                            <span className="font-bold text-slate-700">{item.name}</span>
                                                            <span className="font-black text-brand-900 bg-brand-50 px-2.5 py-1 rounded-lg">x{item.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-1"><Calendar size={14} className="mr-2" /> Fechas Operativas</h4>
                                            <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 flex flex-col justify-center space-y-4">
                                                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salida</span><span className="text-xs font-black text-slate-900">{order.startDate}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retorno</span><span className="text-xs font-black text-slate-900">{order.endDate}</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-200">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center"><CheckCircle size={14} className="mr-2" /> Seguimiento de Hitos</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {WORKFLOW_STEPS.map((step) => {
                                                const stepData = order.workflow[step.key];
                                                const isCompleted = stepData?.status === 'completed';
                                                const manageable = canManageStage(order, step.key);

                                                return (
                                                    <div 
                                                        key={step.key} 
                                                        onClick={() => setEditingStage({ orderId: order.id, stageKey: step.key, readOnly: !manageable })} 
                                                        className={`p-5 rounded-[1.5rem] border-2 text-[10px] flex flex-col justify-between min-h-[120px] transition-all cursor-pointer hover:scale-105 ${isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                          <div className="font-black text-slate-900 uppercase tracking-widest leading-tight">{step.label}</div>
                                                          {!manageable && <Lock size={12} className="text-slate-300" />}
                                                        </div>
                                                        <div className={`mt-4 flex items-center font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                          {isCompleted ? <Check size={14} className="mr-1.5" /> : null}
                                                          {isCompleted ? 'OK' : 'PDTE'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                      );
                    })}
                 </div>
            </div>
        )}

        {activeTab === 'users' && isAdmin && (
            <UserManagement users={users} currentUser={currentUser} onChangeUserRole={onChangeUserRole || ((email, role) => onToggleUserRole(email))} />
        )}
      </div>

      {editingStage && tempStageData && (
          <div className="fixed inset-0 bg-brand-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h3 className="text-sm font-black text-brand-900 uppercase tracking-widest">{editingStage.readOnly ? 'Detalle Supervisor' : 'Validación de Etapa'}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{WORKFLOW_STEPS.find(s => s.key === editingStage.stageKey)?.label}</p>
                      </div>
                      <button onClick={() => setEditingStage(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X size={24} className="text-slate-400" /></button>
                  </div>
                  
                  <div className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar">
                      {editingStage.readOnly && (
                        <div className="bg-brand-50 border border-brand-100 p-4 rounded-2xl flex items-center space-x-3">
                          <Info size={18} className="text-brand-900" />
                          <p className="text-[10px] text-brand-900 font-black uppercase tracking-tight">
                            Modo Solo Lectura: Esta etapa corresponde al área de {editingStage.stageKey === 'bodega_check' || editingStage.stageKey === 'coord_to_bodega' ? 'Logística' : 'Coordinación'}.
                          </p>
                        </div>
                      )}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center ml-1"><Camera className="mr-2" size={14} /> Evidencias</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {tempStageData.photos.map((photo, i) => <div key={i} className="relative group rounded-2xl overflow-hidden border border-slate-100 h-24 shadow-sm"><img src={photo} className="w-full h-full object-cover" alt="" /></div>)}
                          {!editingStage.readOnly && <label className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-slate-50 transition-colors"><Plus className="text-slate-300" size={24} /><input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></label>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center ml-1"><PenTool className="mr-2" size={14} /> Protocolo de Firma</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="border-2 border-slate-100 p-6 rounded-[1.5rem] bg-slate-50/30 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Autorizado por</p>
                            {tempStageData.signature ? (
                              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <img src={tempStageData.signature.dataUrl} className="h-16 w-auto mx-auto mb-2 mix-blend-multiply" alt="" />
                                <p className="text-[10px] font-black text-brand-900 uppercase tracking-widest">{tempStageData.signature.name}</p>
                              </div>
                            ) : !editingStage.readOnly ? (
                              <button onClick={() => setIsSignaturePadOpen('signature')} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-brand-900 hover:text-brand-900 transition-all">+ Agregar Firma</button>
                            ) : (
                              <p className="text-[10px] italic text-slate-300 py-4 uppercase font-black">Sin registro</p>
                            )}
                          </div>
                          <div className="border-2 border-slate-100 p-6 rounded-[1.5rem] bg-slate-50/30 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Recibido por</p>
                            {tempStageData.receivedBy ? (
                              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <img src={tempStageData.receivedBy.dataUrl} className="h-16 w-auto mx-auto mb-2 mix-blend-multiply" alt="" />
                                <p className="text-[10px] font-black text-brand-900 uppercase tracking-widest">{tempStageData.receivedBy.name}</p>
                              </div>
                            ) : !editingStage.readOnly ? (
                              <button onClick={() => setIsSignaturePadOpen('receivedBy')} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-brand-900 hover:text-brand-900 transition-all">+ Agregar Firma</button>
                            ) : (
                              <p className="text-[10px] italic text-slate-300 py-4 uppercase font-black">Sin registro</p>
                            )}
                          </div>
                        </div>
                      </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {tempStageData.status === 'completed' ? <span className="text-emerald-500 flex items-center"><CheckCircle size={14} className="mr-1.5" /> Etapa Completada</span> : <span className="text-slate-400">Estado: Proceso Pendiente</span>}
                      </div>
                      <div className="flex space-x-3 w-full md:w-auto">
                        {!editingStage.readOnly ? (
                          <>
                            <button onClick={handleSaveStage} className="flex-1 md:flex-none px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Guardar Datos</button>
                            <button onClick={handleCompleteStage} className="flex-1 md:flex-none px-8 py-4 bg-[#000033] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95">Validar y Cerrar</button>
                          </>
                        ) : (
                          <button onClick={() => setEditingStage(null)} className="w-full md:w-auto px-10 py-4 bg-[#000033] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">Cerrar Visualización</button>
                        )}
                      </div>
                  </div>
              </div>

              {isSignaturePadOpen && <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-lg w-full border border-slate-100"><SignaturePad label={isSignaturePadOpen === 'signature' ? 'Autorización Digital' : 'Constancia de Recepción'} onSave={handleSaveSignature} onCancel={() => setIsSignaturePadOpen(null)} /></div></div>}
          </div>
      )}
    </div>
  );
};
