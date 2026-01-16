
import React, { useState, useEffect } from 'react';
import { Order, WorkflowStageKey, StageData, Signature } from '../types';
import { Check, PenTool, Camera, Upload, X, MessageSquare, Map as MapIcon, Navigation, Ruler, Clock, CreditCard, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { SignaturePad } from './SignaturePad';

interface TrackingProps {
  orders: Order[];
  onUpdateStage: (orderId: string, stageKey: WorkflowStageKey, data: StageData) => void;
}

const STAGES: { key: WorkflowStageKey; label: string; description: string }[] = [
  { key: 'bodega_check', label: '1. Jefe de Bodega', description: 'Verificación inicial de salida' },
  { key: 'bodega_to_coord', label: '2. Bodega -> Coord', description: 'Entrega a Coordinador' },
  { key: 'coord_to_client', label: '3. Coord -> Cliente', description: 'Entrega en sitio' },
  { key: 'client_to_coord', label: '4. Cliente -> Coord', description: 'Recogida del evento' },
  { key: 'coord_to_bodega', label: '5. Coord -> Bodega', description: 'Retorno a bodega' },
];

export const Tracking: React.FC<TrackingProps> = ({ orders, onUpdateStage }) => {
  const { id } = useParams<{ id: string }>();
  const order = orders.find(o => o.id === id);
  
  const [activeStageKey, setActiveStageKey] = useState<WorkflowStageKey>('bodega_check');
  const [tempStageData, setTempStageData] = useState<StageData | null>(null);
  const [activeSigningField, setActiveSigningField] = useState<'signature' | 'receivedBy' | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [signatureSuccess, setSignatureSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (order && order.workflow) {
      const data = order.workflow[activeStageKey];
      setTempStageData(data ? JSON.parse(JSON.stringify(data)) : null);
      setActiveSigningField(null);
      setSignatureSuccess(null);
    }
  }, [order, activeStageKey]);

  if (!order || !order.workflow) {
    return <div className="p-8 text-center text-gray-500">Pedido no encontrado o estructura inválida</div>;
  }

  const handleItemCheck = (productId: string, checked: boolean) => {
    if (!tempStageData) return;
    setTempStageData({
      ...tempStageData,
      itemChecks: {
        ...tempStageData.itemChecks,
        [productId]: { ...(tempStageData.itemChecks[productId] || { notes: '' }), verified: checked }
      }
    });
  };

  const handleItemNote = (productId: string, note: string) => {
    if (!tempStageData) return;
    setTempStageData({
      ...tempStageData,
      itemChecks: {
        ...tempStageData.itemChecks,
        [productId]: { ...(tempStageData.itemChecks[productId] || { verified: false }), notes: note }
      }
    });
  };

  const handleGeneralNotesChange = (notes: string) => {
    if (!tempStageData) return;
    setTempStageData({ ...tempStageData, generalNotes: notes });
  };

  const saveSignature = (field: 'signature' | 'receivedBy', sig: Signature) => {
    if (!tempStageData) return;
    
    // Set descriptive success message
    setSignatureSuccess(`Firma de ${sig.name} guardada correctamente en ${sig.location}`);
    
    // Update data immediately but hold the modal open for visibility
    const updatedData = { ...tempStageData, [field]: sig };
    setTempStageData(updatedData);

    // Wait 2 seconds to show the message before closing the modal
    setTimeout(() => {
      setActiveSigningField(null);
      setSignatureSuccess(null);
    }, 2000);
  };

  const handleCompleteStage = () => {
    if (!tempStageData) return;
    if (!tempStageData.signature) {
        alert("Falta la firma de 'Entregado por / Autorizado'.");
        return;
    }
    const needsReceiver = ['coord_to_client', 'client_to_coord', 'coord_to_bodega'].includes(activeStageKey);
    if (needsReceiver && !tempStageData.receivedBy) {
        alert("Falta la firma de 'Recibido por'.");
        return;
    }
    const finalData: StageData = {
        ...tempStageData,
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    onUpdateStage(order.id, activeStageKey, finalData);
  };

  const isCompleted = order.workflow[activeStageKey]?.status === 'completed';
  const showReceivedBy = ['coord_to_client', 'client_to_coord', 'coord_to_bodega'].includes(activeStageKey);

  // Map settings
  const mapKey = process.env.API_KEY || '';
  const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${mapKey}&origin=${encodeURIComponent(order.originLocation)}&destination=${encodeURIComponent(order.destinationLocation)}&mode=driving`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start mb-4">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Seguimiento Logístico</h1>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded mr-3">#{order.id}</span>
                  <div className="flex items-center font-medium">
                    <ArrowRight size={14} className="mx-2 text-brand-500" />
                    <span>{order.destinationLocation}</span>
                  </div>
                </div>
             </div>
             <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                  ${order.status === 'Entregado' ? 'bg-purple-100 text-purple-800' : ''}
                  ${order.status === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                `}>
                    {order.status}
                </span>
                <button 
                  onClick={() => setShowMap(!showMap)}
                  className="text-xs font-bold text-brand-500 hover:text-brand-800 flex items-center"
                >
                  <MapIcon size={12} className="mr-1" />
                  {showMap ? 'Ocultar Mapa' : 'Ver Mapa de Ruta'}
                </button>
             </div>
        </div>
      </div>

      {/* Logistics Route Map */}
      {showMap && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
           <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border overflow-hidden h-64 md:h-80 relative">
              <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-[10px] font-bold flex items-center border">
                <Navigation size={12} className="mr-2 text-brand-500" /> RUTA ESTIMADA: {order.originLocation} → {order.destinationLocation}
              </div>
              <iframe
                title="Logistics Route"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={mapUrl}
              ></iframe>
           </div>
           <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-2">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Ruta Nacional</p>
                <p className="text-xs font-medium text-blue-600 truncate">{order.destinationLocation}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-center">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Peajes Estimados</p>
                <p className="text-xs font-medium text-gray-900">$75.000 COP aprox.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-center">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tiempo de Tránsito</p>
                <p className="text-xs font-medium text-gray-900">8h 30m est.</p>
              </div>
           </div>
        </div>
      )}

      {/* Workflow Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {STAGES.map((stage, idx) => {
            const stageData = order.workflow[stage.key];
            const isDone = stageData?.status === 'completed';
            const isActive = activeStageKey === stage.key;
            const prevStageKey = idx > 0 ? STAGES[idx-1].key : null;
            const isPrevDone = prevStageKey ? order.workflow[prevStageKey]?.status === 'completed' : true;
            const isDisabled = !isPrevDone && !isDone;

            return (
                <button
                    key={stage.key}
                    onClick={() => !isDisabled && setActiveStageKey(stage.key)}
                    disabled={isDisabled}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                        isActive 
                            ? 'bg-brand-900 text-white border-brand-900 shadow-md ring-2 ring-brand-500 ring-offset-2' 
                            : isDone
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : isDisabled
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                    }`}
                >
                    <div className="text-xs font-bold mb-1">{stage.label}</div>
                    <div className="flex items-center justify-center">
                        {isDone ? <Check size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                    </div>
                </button>
            );
        })}
      </div>

      {/* Stage Detail Form */}
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-brand-900">
                {STAGES.find(s => s.key === activeStageKey)?.label}
            </h2>
            <p className="text-gray-500 text-sm">
                {STAGES.find(s => s.key === activeStageKey)?.description}
            </p>
        </div>
        
        {tempStageData && (
            <div className="p-6 space-y-8">
                {/* Checklist Section */}
                <section>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <Check className="mr-2" size={20} /> Verificación de Artículos
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left w-12 text-center">OK</th>
                                    <th className="p-3 text-left">Producto</th>
                                    <th className="p-3 text-left">Cant</th>
                                    <th className="p-3 text-left">Notas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {order.items.map(item => {
                                    const check = tempStageData.itemChecks[item.id] || { verified: false, notes: '' };
                                    return (
                                        <tr key={item.id} className={check.verified ? 'bg-blue-50/30' : ''}>
                                            <td className="p-3 text-center">
                                                <input 
                                                    type="checkbox"
                                                    disabled={isCompleted}
                                                    checked={check.verified}
                                                    onChange={(e) => handleItemCheck(item.id, e.target.checked)}
                                                    className="w-5 h-5 text-brand-900 rounded border-gray-300 focus:ring-brand-900"
                                                />
                                            </td>
                                            <td className="p-3 font-medium">{item.name}</td>
                                            <td className="p-3">{item.quantity}</td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    disabled={isCompleted}
                                                    placeholder="Sin novedad..."
                                                    value={check.notes}
                                                    onChange={(e) => handleItemNote(item.id, e.target.value)}
                                                    className="w-full border rounded px-2 py-1 text-xs focus:border-brand-900 outline-none bg-transparent"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Notes Section */}
                <section>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <MessageSquare className="mr-2" size={20} /> Notas Generales de la Etapa
                    </h3>
                    <textarea 
                        disabled={isCompleted}
                        value={tempStageData.generalNotes || ''}
                        onChange={(e) => handleGeneralNotesChange(e.target.value)}
                        placeholder="Ingrese comentarios adicionales sobre esta etapa del proceso..."
                        className="w-full min-h-[80px] border rounded-lg p-4 text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent outline-none bg-gray-50 transition-all resize-y"
                    />
                </section>

                {/* Signatures Section */}
                <section className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                            <PenTool className="mr-2" size={20} /> Entregado / Autorizado
                        </h3>
                        {tempStageData.signature ? (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <img src={tempStageData.signature.dataUrl} alt="Firma" className="h-20 mb-2 border-b border-gray-300 mix-blend-multiply" />
                                <div className="text-sm font-bold">{tempStageData.signature.name}</div>
                                <div className="text-xs text-gray-500">{tempStageData.signature.location}</div>
                            </div>
                        ) : (
                            !isCompleted && (
                                <button onClick={() => setActiveSigningField('signature')} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors">
                                    <PenTool className="mr-2" /> Firmar Entrega
                                </button>
                            )
                        )}
                    </div>

                    {showReceivedBy && (
                        <div>
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                <PenTool className="mr-2" size={20} /> Recibido por
                            </h3>
                            {tempStageData.receivedBy ? (
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <img src={tempStageData.receivedBy.dataUrl} alt="Firma" className="h-20 mb-2 border-b border-gray-300 mix-blend-multiply" />
                                    <div className="text-sm font-bold">{tempStageData.receivedBy.name}</div>
                                    <div className="text-xs text-gray-500">{tempStageData.receivedBy.location}</div>
                                </div>
                            ) : (
                                !isCompleted && (
                                    <button onClick={() => setActiveSigningField('receivedBy')} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors">
                                        <PenTool className="mr-2" /> Firmar Recibido
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </section>
                
                {!isCompleted && (
                    <div className="pt-6 border-t flex justify-end">
                        <button 
                            onClick={handleCompleteStage}
                            className="bg-brand-900 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-brand-800 font-bold flex items-center transition-all active:scale-95"
                        >
                            <Check className="mr-2" /> Completar Etapa
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Signature Modal */}
      {activeSigningField && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transition-all">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Captura de Firma Digital</h3>
                      <button onClick={() => { setActiveSigningField(null); setSignatureSuccess(null); }} className="p-1 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 relative">
                      {signatureSuccess && (
                          <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95">
                              <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                              <h4 className="text-lg font-bold text-gray-900 mb-2">¡Firma Registrada!</h4>
                              <p className="text-sm text-gray-600 font-medium">{signatureSuccess}</p>
                              <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                                  Actualizando sistema...
                              </div>
                          </div>
                      )}
                      <SignaturePad 
                          label={activeSigningField === 'signature' ? 'Autorizado / Entregado por' : 'Recibido por'} 
                          onSave={(sig) => saveSignature(activeSigningField, sig)}
                          onCancel={() => setActiveSigningField(null)}
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
