import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { grupoDe, nombreGrupo, colorGrupo, etapasCortas, type Grupo } from './datos';
import { pedirPosicion, type Posicion } from './ubicacion';

type Obra = Record<string, unknown>;
export interface UbicacionVendedor { vendedor: string; lat: number; lng: number; precision: number; fecha: string; origen: string; obra: string; }

const txt = (o: Obra, k: string) => String(o?.[k] ?? '').trim();
const num = (v: unknown) => { const n = Number(String(v ?? '').replace(',', '.')); return isFinite(n) && n !== 0 ? n : null; };
const CHILE: L.LatLngBoundsExpression = [[-55.9, -75.8], [-17.4, -66.4]];
const ORDEN_GRUPOS: Grupo[] = ['activa', 'no-iniciada', 'sin-info', 'detenida', 'terminada', 'no-aplica'];

function haceCuanto(iso: string) {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}
const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

function el<K extends keyof HTMLElementTagNameMap>(tag: K, clase: string, texto?: string) {
  const e = document.createElement(tag);
  e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

export default function Mapa({ obras, veVendedor, ubicaciones, miPosicion, onAbrir }: {
  obras: Obra[]; veVendedor: boolean; ubicaciones: UbicacionVendedor[] | null;
  miPosicion: Posicion | null; onAbrir: (o: Obra) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capaObras = useRef<L.MarkerClusterGroup | null>(null);
  const capaVendedores = useRef<L.LayerGroup | null>(null);
  const capaYo = useRef<L.LayerGroup | null>(null);
  const encuadrado = useRef('');
  const [ocultos, setOcultos] = useState<Set<Grupo>>(new Set());
  const [yo, setYo] = useState<Posicion | null>(miPosicion);
  const [buscandoYo, setBuscandoYo] = useState(false);
  const [avisoYo, setAvisoYo] = useState('');
  const abrir = useRef(onAbrir);
  useEffect(() => { abrir.current = onAbrir; }, [onAbrir]);
  useEffect(() => { if (miPosicion) setYo(miPosicion); }, [miPosicion]);

  // Obras con coordenadas, agrupadas por etapa.
  const { ubicadas, sinUbicar, porGrupo } = useMemo(() => {
    const ubicadas: { o: Obra; lat: number; lng: number; g: Grupo; aprox: boolean }[] = [];
    const porGrupo = {} as Record<Grupo, number>;
    let sinUbicar = 0;
    for (const o of obras) {
      const lat = num(o['Latitud']), lng = num(o['Longitud']);
      const g = grupoDe(txt(o, 'Estado de Obra'));
      if (lat === null || lng === null) { sinUbicar++; continue; }
      porGrupo[g] = (porGrupo[g] || 0) + 1;
      ubicadas.push({ o, lat, lng, g, aprox: txt(o, 'Ubicación en mapa').startsWith('Comuna') });
    }
    return { ubicadas, sinUbicar, porGrupo };
  }, [obras]);

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!caja.current || mapa.current) return;
    const m = L.map(caja.current, { zoomControl: true, attributionControl: true });
    // Fondo de OpenStreetMap: gratis y sin clave (CARTO empezó a exigir una y marcaba el mapa).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.fitBounds(CHILE);
    capaObras.current = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 48, spiderfyOnMaxZoom: true, chunkedLoading: true,
      iconCreateFunction: c => {
        const n = c.getChildCount();
        const tam = n < 10 ? 34 : n < 100 ? 40 : 48;
        return L.divIcon({ html: `<span>${n}</span>`, className: 'mk-cluster', iconSize: [tam, tam] });
      },
    }).addTo(m);
    capaVendedores.current = L.layerGroup().addTo(m);
    capaYo.current = L.layerGroup().addTo(m);
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; };
  }, []);

  // Dibujar las obras.
  useEffect(() => {
    const capa = capaObras.current, m = mapa.current;
    if (!capa || !m) return;
    capa.clearLayers();
    const visibles = ubicadas.filter(u => !ocultos.has(u.g));
    const marcas = visibles.map(({ o, lat, lng, g, aprox }) => {
      const mk = L.circleMarker([lat, lng], {
        radius: 8, color: aprox ? colorGrupo[g] : '#ffffff', weight: aprox ? 2 : 2, dashArray: aprox ? '3 3' : undefined,
        fillColor: colorGrupo[g], fillOpacity: aprox ? 0.45 : 0.95,
      });
      mk.bindPopup(() => {
        const d = el('div', 'mk-pop');
        d.append(el('strong', 'mk-pop-t', txt(o, 'Obra / PDV') || 'Sin nombre'));
        d.append(el('div', 'mk-pop-e', txt(o, 'Empresa')));
        const estado = txt(o, 'Estado de Obra');
        const linea = [etapasCortas[estado] || estado, txt(o, 'Comuna'), veVendedor ? txt(o, 'Vendedor') : ''].filter(Boolean).join(' · ');
        d.append(el('div', 'mk-pop-m', linea));
        if (aprox) d.append(el('div', 'mk-pop-a', 'Ubicación aproximada: centro de la comuna'));
        const b = el('button', 'btn btn-dark btn-small', 'Abrir ficha');
        b.type = 'button';
        b.addEventListener('click', () => abrir.current(o));
        d.append(b);
        return d;
      }, { closeButton: true, minWidth: 220 });
      return mk;
    });
    capa.addLayers(marcas);

    // Encuadrar cuando cambia el conjunto de obras (no al ocultar etapas).
    const firma = `${obras.length}|${ubicadas.length}`;
    if (encuadrado.current !== firma && ubicadas.length) {
      encuadrado.current = firma;
      m.fitBounds(L.latLngBounds(ubicadas.map(u => [u.lat, u.lng] as [number, number])), { padding: [30, 30], maxZoom: 15 });
    }
  }, [ubicadas, ocultos, obras.length, veVendedor]);

  // Vendedores (jefatura y jefe zonal).
  useEffect(() => {
    const capa = capaVendedores.current;
    if (!capa) return;
    capa.clearLayers();
    for (const u of ubicaciones || []) {
      const lat = num(u.lat), lng = num(u.lng);
      if (lat === null || lng === null) continue;
      const horas = (Date.now() - new Date(u.fecha).getTime()) / 3600000;
      const icono = L.divIcon({
        html: `<span>${iniciales(u.vendedor)}</span>`, className: `mk-vend${horas > 4 ? ' viejo' : ''}`, iconSize: [36, 36],
      });
      const detalle = [haceCuanto(u.fecha), u.origen === 'Visita' && u.obra ? `visita en ${u.obra}` : ''].filter(Boolean).join(' · ');
      L.marker([lat, lng], { icon: icono, zIndexOffset: 1000, keyboard: true, title: u.vendedor })
        .bindTooltip(`<strong>${u.vendedor.replace(/</g, '&lt;')}</strong><br>${detalle.replace(/</g, '&lt;')}`, { direction: 'top', offset: [0, -16] })
        .addTo(capa);
    }
  }, [ubicaciones]);

  // Mi posición.
  useEffect(() => {
    const capa = capaYo.current;
    if (!capa) return;
    capa.clearLayers();
    if (!yo) return;
    L.circle([yo.lat, yo.lng], { radius: yo.precision, color: '#2f6db3', weight: 1, fillOpacity: 0.08, interactive: false }).addTo(capa);
    L.circleMarker([yo.lat, yo.lng], { radius: 7, color: '#fff', weight: 3, fillColor: '#2f6db3', fillOpacity: 1 })
      .bindTooltip('Estás aquí').addTo(capa);
  }, [yo]);

  const irAMi = async () => {
    setBuscandoYo(true); setAvisoYo('');
    try {
      const p = await pedirPosicion();
      setYo(p);
      mapa.current?.setView([p.lat, p.lng], 14);
    } catch (e) {
      setAvisoYo(e instanceof Error ? e.message : 'No se pudo obtener tu ubicación.');
    }
    setBuscandoYo(false);
  };

  // Obras más cercanas a mí (para planificar visitas).
  const cercanas = useMemo(() => {
    if (!yo) return [];
    const rad = Math.PI / 180;
    return ubicadas
      .filter(u => !ocultos.has(u.g))
      .map(u => {
        const dLat = (u.lat - yo.lat) * rad, dLng = (u.lng - yo.lng) * rad;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(yo.lat * rad) * Math.cos(u.lat * rad) * Math.sin(dLng / 2) ** 2;
        return { ...u, km: 12742 * Math.asin(Math.sqrt(h)) };
      })
      .sort((a, b) => a.km - b.km).slice(0, 5);
  }, [yo, ubicadas, ocultos]);

  const alternar = (g: Grupo) => setOcultos(s => { const n = new Set(s); if (n.has(g)) n.delete(g); else n.add(g); return n; });

  return (
    <div className="mapa-wrap">
      <div className="mapa-leyenda" role="group" aria-label="Mostrar en el mapa">
        {ORDEN_GRUPOS.filter(g => porGrupo[g]).map(g => (
          <button key={g} type="button" className="chip chip-sm ley" aria-pressed={!ocultos.has(g)} onClick={() => alternar(g)}>
            <i style={{ background: colorGrupo[g] }} />{nombreGrupo[g]} <b>{porGrupo[g]}</b>
          </button>
        ))}
      </div>
      <div className="mapa-caja">
        <div ref={caja} className="mapa" aria-label="Mapa de obras" />
        <button type="button" className="mapa-yo" onClick={irAMi} disabled={buscandoYo} title="Ir a mi ubicación">
          {buscandoYo ? '…' : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>}
          <span>Dónde estoy</span>
        </button>
      </div>
      <p className="mapa-nota">
        {ubicadas.length} en el mapa
        {sinUbicar > 0 && <> · {sinUbicar} aún sin ubicar (se ubican solas cada hora a partir de su dirección)</>}
        {ubicaciones && ubicaciones.length > 0 && <> · <span className="mk-vend-mini">AP</span> = vendedor, última vez que abrió el radar</>}
      </p>
      {avisoYo && <p className="notice">{avisoYo}</p>}
      {cercanas.length > 0 && (
        <div className="cercanas">
          <p className="q-title">Más cerca de ti</p>
          {cercanas.map(c => (
            <button key={txt(c.o, 'ID')} className="rc-row rc-row-sm" onClick={() => onAbrir(c.o)}>
              <span>
                <span className="rc-row-name">{txt(c.o, 'Obra / PDV') || 'Sin nombre'}</span><br />
                <span className="rc-row-company">{txt(c.o, 'Empresa')}</span>
              </span>
              <span className="rc-row-side"><span className="dist">{c.km < 1 ? `${Math.round(c.km * 1000)} m` : `${c.km.toFixed(1)} km`}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
