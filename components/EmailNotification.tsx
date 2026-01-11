
import React from 'react';
import { Mail, CheckCircle, X, ExternalLink, Loader2 } from 'lucide-react';

interface EmailNotificationProps {
  email: {
    to: string;
    subject: string;
    body: string;
    stage: string;
  } | null;
  onClose: () => void;
}

export const EmailNotification: React.FC<EmailNotificationProps> = ({ email, onClose }) => {
  if (!email) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-8 duration-500">
      <div className="bg-brand-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 max-w-sm w-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Mail size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Notificación Enviada</p>
              <p className="text-xs font-bold truncate">Confirmación Etapa: {email.stage}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="bg-white/5 rounded-xl p-3 mb-4">
          <p className="text-[10px] text-white/60 mb-1">Destinatario:</p>
          <p className="text-xs font-mono truncate">{email.to}</p>
        </div>

        <button 
          onClick={() => {
            const win = window.open('', '_blank');
            if (win) {
              win.document.write(`
                <html>
                  <head>
                    <title>ABSOLUTE - Previsualización de Correo</title>
                    <style>
                      body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                      .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
                      .logo { color: #0f172a; font-weight: 900; font-size: 24px; text-transform: uppercase; }
                      .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                  </head>
                  <body>
                    <div class="header"><div class="logo">ABSOLUTE</div></div>
                    <h3>${email.subject}</h3>
                    <div style="white-space: pre-wrap;">${email.body}</div>
                    <div class="footer">Este es un correo automático del sistema logístico de ABSOLUTE COMPANY.</div>
                  </body>
                </html>
              `);
            }
          }}
          className="w-full bg-white text-brand-900 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-brand-50 transition-all active:scale-95"
        >
          <ExternalLink size={14} />
          <span>Ver Contenido del Correo</span>
        </button>
      </div>
    </div>
  );
};
