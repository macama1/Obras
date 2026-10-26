import { useEffect, useRef, useState } from 'react';
import { postApi } from './api';

// Ubicación del vendedor mientras usa la app.
// - Solo se comparte después de que la persona lee el aviso y acepta el permiso del navegador.
// - Solo en horario laboral (lunes a sábado, 8:00 a 20:00, hora del teléfono).
// - Solo con la app abierta y visible: una página web no puede seguir a nadie en segundo plano.
// - Se envía al radar como máximo cada 5 minutos si se movió más de 150 m, o cada 15 minutos.

export interface Posicion { lat: number; lng: number; precision: number; hora: number; }

const CLAVE_AVISO = 'radar-aviso-ubicacion-v1';
const leerAviso = () => { try { return localStorage.getItem(CLAVE_AVISO) === 'ok'; } catch { return false; } };
const guardarAviso = () => { try { localStorage.setItem(CLAVE_AVISO, 'ok'); } catch { /* sin almacenamiento */ } };

export const enHorarioLaboral = (d = new Date()) => d.getDay() >= 1 && d.getDay() <= 6 && d.getHours() >= 8 && d.getHours() < 20;

export function distanciaMetros(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const aPosicion = (p: GeolocationPosition): Posicion =>
  ({ lat: p.coords.latitude, lng: p.coords.longitude, precision: Math.round(p.coords.accuracy), hora: Date.now() });

// Pide la posición una vez (para "Estoy en la obra" o al registrar una visita).
export function pedirPosicion(timeoutMs = 10000): Promise<Posicion> {
  return new Promise((ok, mal) => {
    if (!('geolocation' in navigator)) { mal(new Error('Este teléfono no permite obtener la ubicación.')); return; }
    navigator.geolocation.getCurrentPosition(p => ok(aPosicion(p)), e => mal(new Error(
      e.code === e.PERMISSION_DENIED
        ? 'No diste permiso de ubicación. Actívalo en la configuración del navegador para este sitio.'
        : 'No se pudo obtener tu ubicación. Prueba al aire libre o con el GPS activado.')),
    { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 });
  });
}

export function useUbicacion(comparte: boolean) {
  const [aceptado, setAceptado] = useState(leerAviso);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [error, setError] = useState('');
  const ultimoEnvio = useRef<Posicion | null>(null);

  useEffect(() => {
    if (!comparte || !aceptado || !('geolocation' in navigator)) return;
    let watch: number | null = null;

    const enviar = (p: Posicion) => {
      if (!enHorarioLaboral()) return;
      const u = ultimoEnvio.current;
      const pasaron = u ? p.hora - u.hora : Infinity;
      const movio = u ? distanciaMetros(u, p) : Infinity;
      if (pasaron < 5 * 60000 || (movio < 150 && pasaron < 15 * 60000)) return;
      ultimoEnvio.current = p;
      postApi({ action: 'reportarUbicacion', ubicacion: { lat: p.lat, lng: p.lng, precision: p.precision } }).catch(() => {});
    };
    const iniciar = () => {
      if (watch !== null || document.visibilityState !== 'visible') return;
      watch = navigator.geolocation.watchPosition(
        g => { const p = aPosicion(g); setPosicion(p); setError(''); enviar(p); },
        e => { if (e.code === e.PERMISSION_DENIED) setError('Sin permiso de ubicación.'); },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 });
    };
    const detener = () => { if (watch !== null) { navigator.geolocation.clearWatch(watch); watch = null; } };
    const alCambiarVisibilidad = () => (document.visibilityState === 'visible' ? iniciar() : detener());

    iniciar();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => { detener(); document.removeEventListener('visibilitychange', alCambiarVisibilidad); };
  }, [comparte, aceptado]);

  const aceptar = () => { guardarAviso(); setAceptado(true); };
  return { aceptado, aceptar, posicion, error };
}
