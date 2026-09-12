/**
 * Servicio de emails (Resend) — SOLO ESTRUCTURA.
 * Las plantillas y disparadores se implementarán en una fase posterior.
 * Si RESEND_API_KEY no está configurada, los envíos se loguean y no se envían.
 */
const { Resend } = require('resend');
const env = require('../config/environment');

const configured = Boolean(env.resend.apiKey && env.resend.apiKey !== 'your_resend_key');
const resend = configured ? new Resend(env.resend.apiKey) : null;

const send = async ({ to, subject, html, text }) => {
  if (!configured) {
    console.log(`📧 [email simulado] to=${to} subject="${subject}"`);
    return { simulated: true };
  }
  const { data, error } = await resend.emails.send({ from: env.resend.from, to, subject, html, text });
  if (error) throw new Error(`Resend: ${error.message}`);
  return data;
};

// ---------- Plantillas (TODO: diseñar HTML definitivo) ----------

/** Confirmación de operación (venta / alquiler) al cliente y/o propietario. */
const enviarConfirmacionOperacion = ({ to, propiedad, tipoOperacion }) =>
  send({
    to,
    subject: `Confirmación de ${tipoOperacion} - ${propiedad.direccion}`,
    html: `<p>Se registró la operación de <b>${tipoOperacion}</b> para la propiedad <b>${propiedad.direccion}</b>.</p>`,
  });

/** Recordatorio de seguimiento de un lead para el agente asignado. */
const enviarRecordatorioSeguimiento = ({ to, lead }) =>
  send({
    to,
    subject: `Recordatorio: seguimiento de ${lead.nombre}`,
    html: `<p>Tenés pendiente el seguimiento de <b>${lead.nombre}</b> (${lead.zona_interes || 'sin zona'}) para el ${lead.proximo_seguimiento}.</p>`,
  });

/** Notificación genérica interna. */
const enviarNotificacion = ({ to, titulo, mensaje }) =>
  send({ to, subject: titulo, html: `<p>${mensaje}</p>` });

module.exports = { configured, send, enviarConfirmacionOperacion, enviarRecordatorioSeguimiento, enviarNotificacion };
