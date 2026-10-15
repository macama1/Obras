import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export const API_URL = "https://script.google.com/macros/s/AKfycbwFurWMyjoIhRfFQmPIVYLdKl0sfkjUbVJWPM6HLG98Cu3G4wfYhgSmEk_pUTPWHhMXgw/exec";

export type ApiResponse<T = unknown> = { status: 'success' | 'error'; data?: T; message?: string };

// Toda llamada al Apps Script lleva el token de la sesión: el servidor decide qué obras
// puede ver y editar cada persona. Si la sesión ya no es válida, se cierra.
export async function postApi<T = unknown>(body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : undefined;
  const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ ...body, idToken }) });
  const data = (await response.json()) as ApiResponse<T>;
  if (data.status === 'error' && String(data.message || '').includes('NO_AUTORIZADO')) {
    await signOut(auth);
  }
  return data;
}

// Quita el prefijo técnico de los mensajes del servidor antes de mostrarlos.
export function mensajeServidor(message?: string) {
  return String(message || 'Error del servidor').replace(/^Error:\s*/, '').replace(/^NO_AUTORIZADO:\s*/, '');
}
