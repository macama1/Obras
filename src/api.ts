import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export const API_URL = "https://script.google.com/macros/s/AKfycbwFurWMyjoIhRfFQmPIVYLdKl0sfkjUbVJWPM6HLG98Cu3G4wfYhgSmEk_pUTPWHhMXgw/exec";

export type ApiResponse<T = unknown> = { status: 'success' | 'error'; data?: T; message?: string };

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));

// Toda llamada al Apps Script lleva el token de la sesión: el servidor decide qué obras
// puede ver y editar cada persona. Si la sesión ya no es válida, se cierra.
// Google a veces responde con una página de error en vez de los datos (falla pasajera):
// se reintenta hasta 3 veces antes de rendirse.
export async function postApi<T = unknown>(body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const user = auth.currentUser;
  let ultimoError = '';
  for (let intento = 0; intento < 3; intento++) {
    if (intento > 0) await esperar(1200 * intento);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ ...body, idToken }) });
      const texto = await response.text();
      let data: ApiResponse<T>;
      try {
        data = JSON.parse(texto) as ApiResponse<T>;
      } catch {
        ultimoError = `respuesta inválida de Google (HTTP ${response.status})`;
        continue;
      }
      if (data.status === 'error' && String(data.message || '').includes('NO_AUTORIZADO')) {
        await signOut(auth);
      }
      return data;
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(ultimoError || 'sin respuesta');
}

// Quita el prefijo técnico de los mensajes del servidor antes de mostrarlos.
export function mensajeServidor(message?: string) {
  return String(message || 'Error del servidor').replace(/^Error:\s*/, '').replace(/^NO_AUTORIZADO:\s*/, '');
}
