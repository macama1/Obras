import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { postApi, mensajeServidor } from './api';
import Login from './Login';
import {
  canalOptions, vendedorOptions, tipoConstruccionOptions, normalizar, todasLasComunas, regionDeComuna,
  etapasObra, etapasCortas, estadosEspeciales, esCanalDeObra, aplica,
} from './datos';
import { useUbicacion, pedirPosicion, distanciaMetros, type Posicion } from './ubicacion';
import type { UbicacionVendedor } from './Mapa';
import './radar.css';

// El mapa se carga solo cuando alguien lo abre (Leaflet pesa ~150 kB).
const Mapa = lazy(() => import('./Mapa'));

// ---------- Tipos y utilidades ----------
type Obra = Record<string, unknown>;
interface Cliente { empresa: string; rut: string; }
interface Usuario { vendedor: string; rol: 'vendedor' | 'jefe zonal' | 'jefatura'; correo: string; equipo?: string[]; }

const txt = (o: Obra | null | undefined, k: string) => String(o?.[k] ?? '').trim();
// Para los campos de texto: sin recortar, o los espacios al final se borran mientras se escribe.
const crudo = (o: Obra | null | undefined, k: string) => String(o?.[k] ?? '');
const DIA = 86400000;

function diasDesde(valor: unknown): number | null {
  if (!valor) return null;
  const s = String(valor);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); // 14/1/2026
  const d = m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : new Date(s);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / DIA));
}
function textoDias(d: number | null) {
  if (d === null) return 'Nunca actualizada';
  if (d === 0) return 'Actualizada hoy';
  if (d === 1) return 'Actualizada ayer';
  return `Hace ${d} días`;
}
const claseDias = (d: number | null) => (d === null || d > 90 ? 'bad' : d > 45 ? 'warn' : 'ok');
const formatoDistancia = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);

// ---------- Piezas reutilizables ----------
function Chips({ opciones, valor, onCambio, etiqueta, chico }: {
  opciones: string[]; valor: string; onCambio: (v: string) => void; etiqueta: string; chico?: boolean;
}) {
  return (
    <div className="chips" role="group" aria-label={etiqueta}>
      {opciones.map(o => (
        <button key={o} type="button" className={`chip${chico ? ' chip-sm' : ''}`}
          aria-pressed={normalizar(valor) === normalizar(o)}
          onClick={() => onCambio(normalizar(valor) === normalizar(o) ? '' : o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

// Barra de etapas: se toca la etapa en que está la obra.
function BarraEtapas({ estado, onCambio }: { estado: string; onCambio: (v: string) => void }) {
  const idx = etapasObra.findIndex(e => normalizar(e) === normalizar(estado));
  return (
    <>
      <div className="track track-big" role="radiogroup" aria-label="Etapa de la obra">
        {etapasObra.map((e, i) => (
          <button key={e} type="button" role="radio" aria-checked={i === idx}
            className={i === idx ? 'now' : i < idx ? 'on' : ''} onClick={() => onCambio(e)}>
            <span className="bar" />
            <span className="lbl">{etapasCortas[e]}</span>
          </button>
        ))}
      </div>
      <div className="track-extra">
        {estadosEspeciales.filter(e => e !== 'No Aplica').map(e => (
          <button key={e} type="button" className="chip chip-sm" aria-pressed={normalizar(estado) === normalizar(e)}
            onClick={() => onCambio(e)}>{e === 'Sin Información' ? 'No sé en qué etapa está' : e}</button>
        ))}
      </div>
    </>
  );
}

function MiniEtapas({ estado }: { estado: string }) {
  const idx = etapasObra.findIndex(e => normalizar(e) === normalizar(estado));
  if (idx === -1) {
    return normalizar(estado) === 'detenida' ? <span className="track-tag">Detenida</span> : null;
  }
  return (
    <span className="track track-mini" aria-label={`Etapa: ${etapasCortas[etapasObra[idx]]}`} title={etapasCortas[etapasObra[idx]]}>
      {etapasObra.map((e, i) => <span key={e} className={i === idx ? 'now' : i < idx ? 'on' : ''} />)}
    </span>
  );
}

function Autocompletar({ id, valor, onTexto, onElegir, opciones, placeholder }: {
  id: string; valor: string; onTexto: (v: string) => void; onElegir: (o: { label: string; sub?: string }) => void;
  opciones: { label: string; sub?: string }[]; placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const visibles = abierto && valor.trim().length >= 2 ? opciones.slice(0, 8) : [];
  const elegir = (o: { label: string; sub?: string }) => { onElegir(o); setAbierto(false); };
  return (
    <div className="ac">
      <input id={id} className="input" value={valor} placeholder={placeholder} autoComplete="off"
        role="combobox" aria-expanded={visibles.length > 0} aria-controls={`${id}-lista`}
        onChange={e => { onTexto(e.target.value); setAbierto(true); setActivo(0); }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        onKeyDown={e => {
          if (!visibles.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActivo(a => Math.min(a + 1, visibles.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActivo(a => Math.max(a - 1, 0)); }
          if (e.key === 'Enter') { e.preventDefault(); elegir(visibles[activo]); }
          if (e.key === 'Escape') setAbierto(false);
        }} />
      {visibles.length > 0 && (
        <ul className="ac-list" id={`${id}-lista`} role="listbox">
          {visibles.map((o, i) => (
            <li key={o.label + (o.sub || '')} role="option" aria-selected={i === activo} onMouseDown={() => elegir(o)}>
              {o.label}{o.sub && <small>{o.sub}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const IconoBuscar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
  </svg>
);

// ---------- Pantalla 1: mis obras ----------
// Resumen de una cartera, ordenado por lo que más importa para vender:
// obra gruesa y fundaciones primero; después preliminares (aún temprano) y terminaciones (ya tarde).
const ETAPAS_RESUMEN: { etapa: string; nombre: string; clave?: boolean }[] = [
  { etapa: 'Obra Gruesa', nombre: 'Obra gruesa', clave: true },
  { etapa: 'Fundaciones', nombre: 'Fundaciones', clave: true },
  { etapa: 'Obras Preliminares', nombre: 'Obras preliminares' },
  { etapa: 'Terminaciones', nombre: 'Terminaciones' },
];

function ResumenVendedor({ nombre, obras }: { nombre: string; obras: Obra[] }) {
  const porEtapa = new Map<string, number>();
  let compran = 0, atrasadas = 0, nObras = 0;
  for (const o of obras) {
    const e = normalizar(txt(o, 'Estado de Obra'));
    porEtapa.set(e, (porEtapa.get(e) || 0) + 1);
    if (aplica(txt(o, 'Estado de Obra'))) nObras++;
    if (normalizar(txt(o, 'Les Vendemos?')) === 'si') compran++;
    const d = diasDesde(o['Última Actualización']);
    if (d === null || d > 45) atrasadas++;
  }
  return (
    <div className="resumen" aria-live="polite">
      <p className="resumen-t"><strong>{nombre}</strong> tiene <strong>{obras.length}</strong> {obras.length === 1 ? 'punto de venta' : 'puntos de venta'}; <strong>{nObras}</strong> {nObras === 1 ? 'es obra' : 'son obras'}</p>
      <div className="resumen-g">
        {ETAPAS_RESUMEN.map(x => (
          <div key={x.etapa} className={x.clave ? 'clave' : ''}><b>{porEtapa.get(normalizar(x.etapa)) || 0}</b><span>{x.nombre}</span></div>
        ))}
        <div className="sep"><b>{compran}</b><span>Nos compran</span></div>
        <div><b>{atrasadas}</b><span>Más de 45 días sin actualizar</span></div>
      </div>
    </div>
  );
}

function MisObras({ usuario, obras, cargando, error, posicion, onAbrir, onNueva }: {
  usuario: Usuario; obras: Obra[]; cargando: boolean; error: string; posicion: Posicion | null;
  onAbrir: (o: Obra) => void; onNueva: (texto: string) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [orden, setOrden] = useState<'pendientes' | 'recientes'>('pendientes');
  const [limite, setLimite] = useState(40);
  const [modo, setModo] = useState<'lista' | 'mapa'>(() => { try { return localStorage.getItem('radar-modo') === 'mapa' ? 'mapa' : 'lista'; } catch { return 'lista'; } });
  const [ubicaciones, setUbicaciones] = useState<UbicacionVendedor[] | null>(null);
  const [verVendedores, setVerVendedores] = useState(true);
  const veVarias = usuario.rol !== 'vendedor';
  const cambiarModo = (m: 'lista' | 'mapa') => { setModo(m); try { localStorage.setItem('radar-modo', m); } catch { /* sin almacenamiento */ } };

  // Cantidad de obras de cada vendedor, para los botones del filtro.
  const conteo = useMemo(() => {
    const c = new Map<string, number>();
    if (veVarias) for (const o of obras) { const v = txt(o, 'Vendedor'); if (v) c.set(v, (c.get(v) || 0) + 1); }
    return c;
  }, [obras, veVarias]);
  const vendedores = useMemo(() => [...conteo.keys()].sort(), [conteo]);

  // Jefatura y jefes zonales ven dónde está cada vendedor (se actualiza cada 2 minutos con el mapa abierto).
  useEffect(() => {
    if (!veVarias || modo !== 'mapa') return;
    let vivo = true;
    const cargar = () => postApi<UbicacionVendedor[]>({ action: 'getUbicaciones' })
      .then(r => { if (vivo && r.status === 'success') setUbicaciones(r.data || []); }).catch(() => {});
    cargar();
    const t = setInterval(cargar, 120000);
    return () => { vivo = false; clearInterval(t); };
  }, [veVarias, modo]);

  const lista = useMemo(() => {
    const q = normalizar(busqueda);
    const filtradas = obras.filter(o => {
      if (vendedor && normalizar(txt(o, 'Vendedor')) !== normalizar(vendedor)) return false;
      if (!q) return true;
      return ['Empresa', 'Obra / PDV', 'Comuna', 'ID', 'Dirección'].some(k => normalizar(txt(o, k)).includes(q));
    });
    const dias = (o: Obra) => diasDesde(o['Última Actualización']);
    return filtradas.sort((a, b) => {
      const da = dias(a) ?? 99999, db = dias(b) ?? 99999;
      return orden === 'pendientes' ? db - da : da - db;
    });
  }, [obras, busqueda, vendedor, orden]);

  const atrasadas = useMemo(() => obras.filter(o => { const d = diasDesde(o['Última Actualización']); return d === null || d > 45; }).length, [obras]);
  const titulo = usuario.rol === 'jefatura' ? 'Todo el radar' : usuario.rol === 'jefe zonal' ? 'Tus obras y las de tu equipo' : 'Tus obras';

  return (
    <>
      <h1 className="rc-title">{titulo}</h1>
      <p className="rc-sub">
        {cargando ? 'Cargando obras…' : `${obras.length} puntos de venta (${obras.filter(o => aplica(txt(o, 'Estado de Obra'))).length} son obras). ${atrasadas} llevan más de 45 días sin actualizar.`}
      </p>

      <div className="rc-actions">
        <div>
          <label className="rc-search">
            <IconoBuscar />
            <input type="search" value={busqueda} onChange={e => { setBusqueda(e.target.value); setLimite(40); }}
              placeholder="Buscar obra para actualizarla" aria-label="Buscar obra para actualizarla" disabled={cargando} />
          </label>
          <p className="rc-search-hint">Por empresa, nombre de obra, comuna o dirección.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNueva(busqueda)} disabled={cargando}>
          + Agregar al radar
        </button>
      </div>

      <div className="rc-filters">
        <div className="seg" role="tablist" aria-label="Ver como">
          <button role="tab" aria-selected={modo === 'lista'} onClick={() => cambiarModo('lista')}>Lista</button>
          <button role="tab" aria-selected={modo === 'mapa'} onClick={() => cambiarModo('mapa')}>Mapa</button>
        </div>
        {modo === 'lista' && <>
          <span className="label">Ordenar:</span>
          <button className="chip chip-sm" aria-pressed={orden === 'pendientes'} onClick={() => setOrden('pendientes')}>Más atrasadas primero</button>
          <button className="chip chip-sm" aria-pressed={orden === 'recientes'} onClick={() => setOrden('recientes')}>Recién actualizadas</button>
        </>}
        {modo === 'mapa' && veVarias && (
          <button className="chip chip-sm" aria-pressed={verVendedores} onClick={() => setVerVendedores(v => !v)}>Mostrar vendedores</button>
        )}
      </div>
      {veVarias && vendedores.length > 1 && (
        <div className="rc-filters">
          <span className="label">Vendedor:</span>
          <button className="chip chip-sm" aria-pressed={!vendedor} onClick={() => setVendedor('')}>Todos <span className="n">{obras.length}</span></button>
          {vendedores.map(v => (
            <button key={v} className="chip chip-sm" aria-pressed={vendedor === v} onClick={() => setVendedor(vendedor === v ? '' : v)}>
              {v} <span className="n">{conteo.get(v)}</span>
            </button>
          ))}
        </div>
      )}
      {veVarias && vendedor && !cargando && (
        <ResumenVendedor nombre={vendedor} obras={obras.filter(o => normalizar(txt(o, 'Vendedor')) === normalizar(vendedor))} />
      )}

      {error && <p className="notice">{error}</p>}
      {cargando && <div className="loading">Cargando tus obras…</div>}

      {!cargando && !error && modo === 'mapa' && (
        <Suspense fallback={<div className="loading">Cargando mapa…</div>}>
          <Mapa obras={lista} veVendedor={veVarias} onAbrir={onAbrir} miPosicion={posicion}
            ubicaciones={veVarias && verVendedores ? (ubicaciones || []).filter(u => !vendedor || normalizar(u.vendedor) === normalizar(vendedor)) : null} />
        </Suspense>
      )}

      {!cargando && !error && modo === 'lista' && (
        <div className="rc-list">
          {lista.length === 0 ? (
            <div className="empty">
              {busqueda
                ? <><p>No hay obras que coincidan con “{busqueda}”.</p><p>Si es nueva, agrégala al radar.</p></>
                : <p>Todavía no tienes obras en el radar.</p>}
              <button className="btn btn-primary" onClick={() => onNueva(busqueda)}>+ Agregar al radar</button>
            </div>
          ) : (
            <>
              {lista.slice(0, limite).map(o => {
                const d = diasDesde(o['Última Actualización']);
                return (
                  <button key={txt(o, 'ID')} className="rc-row" onClick={() => onAbrir(o)}>
                    <span>
                      <span className="rc-row-name">{txt(o, 'Obra / PDV') || 'Sin nombre'}</span><br />
                      <span className="rc-row-company">{txt(o, 'Empresa')}</span>
                    </span>
                    <span className="rc-row-side"><span className={`fresh ${claseDias(d)}`}>{textoDias(d)}</span></span>
                    <span className="rc-row-meta">
                      <span>{[txt(o, 'Comuna'), usuario.rol === 'jefatura' ? txt(o, 'ID') : ''].filter(Boolean).join(', ')}</span>
                      {veVarias && <span>{txt(o, 'Vendedor')}</span>}
                      <MiniEtapas estado={txt(o, 'Estado de Obra')} />
                    </span>
                  </button>
                );
              })}
              {lista.length > limite && (
                <div className="rc-more">
                  <button className="btn btn-ghost btn-small" onClick={() => setLimite(l => l + 40)}>
                    Mostrar 40 más (quedan {lista.length - limite})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

// ---------- Pantalla 2: actualizar una obra ----------
// Texto que explica cómo está ubicada la obra en el mapa.
function textoUbicacion(o: Obra) {
  const est = txt(o, 'Ubicación en mapa');
  if (!txt(o, 'Latitud')) {
    if (est === 'No encontrada') return 'No se encontró su dirección en el mapa.';
    return txt(o, 'ID') ? 'Todavía no está en el mapa; se ubicará sola por su dirección.' : 'Se ubicará por la dirección al agregarla.';
  }
  if (est === 'GPS en obra') return 'Marcada con el GPS estando en la obra.';
  if (est.startsWith('Comuna')) return 'Ubicación aproximada: centro de la comuna.';
  return 'Ubicada por su dirección.';
}

// Botón "Estoy en la obra": guarda la posición del teléfono como ubicación de la obra.
// Comuna con autocompletado: al elegirla, la región se completa sola.
function CampoComuna({ id, comuna, onElegir }: { id: string; comuna: string; onElegir: (comuna: string, region: string) => void }) {
  const [texto, setTexto] = useState(comuna);
  const opciones = useMemo(() => {
    const q = normalizar(texto);
    return q.length < 2 ? [] : todasLasComunas.filter(c => normalizar(c.comuna).includes(q))
      .sort((a, b) => Number(!normalizar(a.comuna).startsWith(q)) - Number(!normalizar(b.comuna).startsWith(q)))
      .map(c => ({ label: c.comuna, sub: c.region }));
  }, [texto]);
  return (
    <Autocompletar id={id} valor={texto} placeholder="Escribe la comuna" opciones={opciones}
      onTexto={setTexto} onElegir={o => { setTexto(o.label); onElegir(o.label, regionDeComuna(o.label)); }} />
  );
}

// Actores de la obra: además de la empresa a la que le vendemos (la constructora).
const ACTORES = [
  { k: 'Mandante / Inmobiliaria', ayuda: 'dueño del proyecto; aparece en el permiso de edificación' },
  { k: 'Arquitecto', ayuda: 'oficina o profesional; decide qué se especifica' },
];

function MarcarEnObra({ datos, onMarcar }: { datos: Obra; onMarcar: (p: Posicion) => void }) {
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const marcar = async () => {
    setBuscando(true); setError('');
    try { onMarcar(await pedirPosicion()); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo obtener tu ubicación.'); }
    setBuscando(false);
  };
  return (
    <div className="ubic">
      <p className="ubic-t"><b>En el mapa:</b> {textoUbicacion(datos)}</p>
      <button type="button" className="btn btn-ghost btn-small" onClick={marcar} disabled={buscando}>
        {buscando ? 'Buscando tu ubicación…' : 'Estoy en la obra: marcarla aquí'}
      </button>
      {error && <p className="auto-note aviso">{error}</p>}
    </div>
  );
}
const conPosicion = (p: Posicion) => ({ 'Latitud': String(p.lat), 'Longitud': String(p.lng), 'Ubicación en mapa': 'GPS en obra' });

function FichaObra({ usuario, obra, posicion, onVolver, onGuardada, avisar }: {
  usuario: Usuario; obra: Obra; posicion: Posicion | null;
  onVolver: () => void; onGuardada: (o: Obra) => void; avisar: (m: string, error?: boolean) => void;
}) {
  const [datos, setDatos] = useState<Obra>(obra);
  const [guardando, setGuardando] = useState(false);
  const set = (k: string, v: string) => setDatos(d => ({ ...d, [k]: v }));
  // Se pregunta la etapa salvo que sea un punto de venta marcado "No Aplica".
  const estadoActual = normalizar(txt(obra, 'Estado de Obra'));
  const esObra = estadoActual ? estadoActual !== 'no aplica' : esCanalDeObra(txt(obra, 'Canal'));

  const cambios = useMemo(() => {
    const c: Record<string, string> = {};
    for (const k of Object.keys(datos)) if (txt(datos, k) !== txt(obra, k)) c[k] = txt(datos, k);
    return c;
  }, [datos, obra]);
  const hayCambios = Object.keys(cambios).length > 0;
  const d = diasDesde(obra['Última Actualización']);

  const guardar = async () => {
    setGuardando(true);
    try {
      const r = await postApi<{ row?: Obra }>({
        action: 'editObra', id: txt(obra, 'ID'), updates: cambios,
      });
      if (r.status !== 'success') throw new Error(mensajeServidor(r.message));
      onGuardada(r.data?.row || { ...obra, ...cambios });
      avisar(hayCambios ? 'Cambios guardados y visita registrada.' : 'Visita registrada.');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo guardar.', true);
    }
    setGuardando(false);
  };

  return (
    <>
      <button className="btn-link back" onClick={onVolver}>‹ Volver a la lista</button>
      <div className="sheet sheet-head">
        <div className="company">{txt(obra, 'Empresa')}</div>
        <h1 className="rc-title">{txt(obra, 'Obra / PDV') || 'Sin nombre'}</h1>
        <div className="meta">
          {usuario.rol === 'jefatura' && <span>Código {txt(obra, 'ID')}</span>}
          <span>{[txt(obra, 'Dirección'), txt(obra, 'Comuna')].filter(Boolean).join(', ')}</span>
          {usuario.rol !== 'vendedor' && <span>{txt(obra, 'Vendedor')}</span>}
        </div>
        {posicion && txt(obra, 'Latitud') && (
          <p className="dist-ficha">A {formatoDistancia(distanciaMetros(posicion, { lat: Number(txt(obra, 'Latitud')), lng: Number(txt(obra, 'Longitud')) }))} de ti</p>
        )}
        <p className={`fresh ${claseDias(d)}`} style={{ margin: '6px 0 12px' }}>
          {d === null ? 'Nunca se ha actualizado' : `Última actualización: ${textoDias(d).toLowerCase()}`}
        </p>
      </div>

      <div className="sheet">
        {esObra && (
          <div className="q">
            <p className="q-title">¿En qué etapa está la obra?</p>
            <BarraEtapas estado={txt(datos, 'Estado de Obra')} onCambio={v => set('Estado de Obra', v)} />
          </div>
        )}
        <div className="q">
          <p className="q-title">¿Nos compran?</p>
          <Chips etiqueta="¿Nos compran?" opciones={['Sí', 'No']} valor={txt(datos, 'Les Vendemos?')} onCambio={v => set('Les Vendemos?', v)} />
        </div>
        <div className="q">
          <p className="q-title">Ubicación</p>
          <label className="field"><span>Dirección</span>
            <input className="input" value={crudo(datos, 'Dirección')} placeholder="Calle y número" onChange={e => set('Dirección', e.target.value)} /></label>
          <label className="field" htmlFor="ficha-comuna"><span>Comuna {txt(datos, 'Región') && <small>{txt(datos, 'Región')}</small>}</span></label>
          <CampoComuna id="ficha-comuna" comuna={txt(obra, 'Comuna')} onElegir={(c, r) => setDatos(x => ({ ...x, 'Comuna': c, 'Región': r || txt(x, 'Región') }))} />
          {(cambios['Dirección'] !== undefined || cambios['Comuna'] !== undefined) && cambios['Latitud'] === undefined && (
            <p className="auto-note">Al guardar, la obra se vuelve a ubicar en el mapa con la nueva dirección.</p>
          )}
          <MarcarEnObra datos={datos} onMarcar={p => {
            setDatos(d => ({ ...d, ...conPosicion(p) }));
            avisar(`Ubicación marcada (precisión ${p.precision} m). Guarda para confirmarla.`, p.precision > 100);
          }} />
        </div>
        <div className="q">
          <label className="field">
            <span>Próximos pasos</span>
            <textarea className="textarea" value={crudo(datos, 'Próximos Pasos')} placeholder="Qué quedó pendiente y para cuándo"
              onChange={e => set('Próximos Pasos', e.target.value)} />
          </label>
          <label className="field">
            <span>Contacto <small>nombre, cargo, teléfono o correo</small></span>
            <textarea className="textarea" value={crudo(datos, 'Contacto')} onChange={e => set('Contacto', e.target.value)} />
          </label>
        </div>
        <details className="more">
          <summary>Datos de la obra</summary>
          <label className="field"><span>Nombre de la obra o punto de venta</span>
            <input className="input" value={crudo(datos, 'Obra / PDV')} onChange={e => set('Obra / PDV', e.target.value)} /></label>
          <label className="field"><span>RUT de la empresa</span>
            <input className="input" value={crudo(datos, 'Rut Empresa')} onChange={e => set('Rut Empresa', e.target.value)} /></label>
          {esObra && <>
            <div className="field"><span>Tipo de construcción</span>
              <Chips chico etiqueta="Tipo de construcción" opciones={tipoConstruccionOptions.filter(t => t !== 'No Aplica')}
                valor={txt(datos, 'Tipo Construcción')} onCambio={v => set('Tipo Construcción', v)} /></div>
            <label className="field"><span>N° de pisos / casas</span>
              <input className="input" inputMode="numeric" value={crudo(datos, 'Pisos')} onChange={e => set('Pisos', e.target.value)} /></label>
          </>}
          <label className="field"><span>Descripción</span>
            <textarea className="textarea" value={crudo(datos, 'Descripción de la obra o PDV')} onChange={e => set('Descripción de la obra o PDV', e.target.value)} /></label>
          {esObra && ACTORES.map(a => (
            <label key={a.k} className="field"><span>{a.k} <small>{a.ayuda}</small></span>
              <input className="input" value={crudo(datos, a.k)} onChange={e => set(a.k, e.target.value)} /></label>
          ))}
          {txt(obra, 'Acciones Última Reunion') && (
            <p className="q-help">Acciones de la última reunión: {txt(obra, 'Acciones Última Reunion')}</p>
          )}
        </details>
      </div>

      <div className="dock">
        <div className="dock-inner">
          <span className="dock-note">{hayCambios ? `${Object.keys(cambios).length} cambio(s) sin guardar` : 'Sin cambios'}</span>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : hayCambios ? 'Guardar y registrar visita' : 'Registrar visita'}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- Pantalla 3: agregar al radar (3 pasos) ----------
// RUT chileno: 7 u 8 dígitos (con o sin puntos), guion opcional y dígito verificador.
const pareceRut = (v: string) => /^\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]$/.test(v.trim());
const nuevaVacia = (): Record<string, string> => ({
  'Empresa': '', 'Rut Empresa': '', 'Canal': '', 'Vendedor': '', 'Obra / PDV': '', 'Comuna': '', 'Región': '',
  'Dirección': '', 'Estado de Obra': '', 'Tipo Construcción': '', 'Les Vendemos?': '', 'Próximos Pasos': '',
  'Contacto': '', 'Pisos': '', 'Descripción de la obra o PDV': '', 'Mandante / Inmobiliaria': '', 'Arquitecto': '',
});

function NuevaObra({ usuario, obras, clientes, textoInicial, onVolver, onCreada, avisar }: {
  usuario: Usuario; obras: Obra[]; clientes: Cliente[]; textoInicial: string;
  onVolver: () => void; onCreada: (o: Obra) => void; avisar: (m: string, error?: boolean) => void;
}) {
  const [paso, setPaso] = useState(1);
  const [d, setD] = useState<Record<string, string>>(() => ({ ...nuevaVacia(), 'Empresa': textoInicial, 'Vendedor': usuario.rol === 'jefatura' ? '' : usuario.vendedor }));
  const [comunaTexto, setComunaTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState<Obra | null>(null);
  const [autoNota, setAutoNota] = useState('');
  const set = (k: string, v: string) => setD(x => ({ ...x, [k]: v }));
  const asignables = usuario.rol === 'jefatura' ? vendedorOptions : [usuario.vendedor, ...(usuario.equipo || [])];
  const esObra = esCanalDeObra(d['Canal']);
  const arriba = useRef<HTMLDivElement>(null);
  useEffect(() => { arriba.current?.scrollIntoView({ block: 'start' }); }, [paso]);

  // Empresas conocidas: las de la hoja Clientes y las de sus propias obras.
  const empresas = useMemo(() => {
    const m = new Map<string, string>();
    clientes.forEach(c => c.empresa && m.set(normalizar(c.empresa), `${c.empresa}|${c.rut || ''}`));
    obras.forEach(o => { const e = txt(o, 'Empresa'); if (e && !m.has(normalizar(e))) m.set(normalizar(e), `${e}|${txt(o, 'Rut Empresa')}`); });
    return [...m.values()].map(v => { const [label, rut] = v.split('|'); return { label, sub: rut ? `RUT ${rut}` : undefined, rut }; });
  }, [clientes, obras]);
  const sugerenciasEmpresa = useMemo(() => {
    const q = normalizar(d['Empresa']);
    return q.length < 2 ? [] : empresas.filter(e => normalizar(e.label).includes(q));
  }, [empresas, d]);
  const sugerenciasComuna = useMemo(() => {
    const q = normalizar(comunaTexto);
    return q.length < 2 ? [] : todasLasComunas.filter(c => normalizar(c.comuna).includes(q))
      .sort((a, b) => Number(!normalizar(a.comuna).startsWith(q)) - Number(!normalizar(b.comuna).startsWith(q)))
      .map(c => ({ label: c.comuna, sub: c.region }));
  }, [comunaTexto]);

  const elegirEmpresa = (label: string) => {
    const e = empresas.find(x => x.label === label);
    // El canal se copia de otras obras de la misma empresa, si existen.
    const otra = obras.find(o => normalizar(txt(o, 'Empresa')) === normalizar(label) && txt(o, 'Canal'));
    setD(x => ({ ...x, 'Empresa': label, 'Rut Empresa': e?.rut || x['Rut Empresa'], 'Canal': x['Canal'] || txt(otra, 'Canal') }));
    const notas = [otra && 'el tipo de cliente', e?.rut && 'el RUT (lo ves en Más detalles)'].filter(Boolean);
    setAutoNota(notas.length ? `Completamos ${notas.join(' y ')} con lo que ya está en el radar.` : '');
  };
  const elegirComuna = (comuna: string) => {
    setComunaTexto(comuna);
    setD(x => ({ ...x, 'Comuna': comuna, 'Región': regionDeComuna(comuna) }));
  };

  const paso1Listo = d['Empresa'].trim() && d['Canal'] && d['Vendedor'];
  const paso2Listo = d['Obra / PDV'].trim() && d['Comuna'] && d['Región'];

  const guardar = async () => {
    if (!paso1Listo) { setPaso(1); return; }
    if (!paso2Listo) { setPaso(2); return; }
    setGuardando(true);
    const data = { ...d };
    if (!esObra) { data['Estado de Obra'] = data['Estado de Obra'] || 'No Aplica'; data['Tipo Construcción'] = data['Tipo Construcción'] || 'No Aplica'; }
    else if (!data['Estado de Obra']) data['Estado de Obra'] = 'Sin Información';
    try {
      const r = await postApi<Obra>({ action: 'createNewObra', data });
      if (r.status !== 'success' || !r.data) throw new Error(mensajeServidor(r.message));
      onCreada(r.data);
      setCreada(r.data);
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo agregar.', true);
    }
    setGuardando(false);
  };

  if (creada) {
    return (
      <div className="sheet done-box">
        <p>Quedó agregada al radar</p>
        {usuario.rol === 'jefatura' && <span className="code">{txt(creada, 'ID')}</span>}
        <p style={{ color: 'var(--muted)' }}>{txt(creada, 'Obra / PDV')}, {txt(creada, 'Empresa')}</p>
        <div className="chips" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => { setCreada(null); setPaso(1); setD({ ...nuevaVacia(), 'Vendedor': usuario.rol === 'jefatura' ? '' : usuario.vendedor }); setComunaTexto(''); setAutoNota(''); }}>Agregar otra</button>
          <button className="btn btn-ghost" onClick={onVolver}>Volver a la lista</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={arriba}>
      <button className="btn-link back" onClick={onVolver}>‹ Cancelar</button>
      <h1 className="rc-title">Agregar al radar</h1>
      <p className="rc-sub">Una obra nueva o un punto de venta (ferretería, distribuidor, casa matriz).</p>
      <div className="steps" aria-label={`Paso ${paso} de 3`}>
        {['Empresa', 'Ubicación', 'Más detalles (opcional)'].map((s, i) => (
          <div key={s} className={i + 1 === paso ? 'now' : i + 1 < paso ? 'done' : ''}>{s}</div>
        ))}
      </div>

      {paso === 1 && (
        <div className="sheet">
          <div className="q">
            <label className="field" htmlFor="empresa"><span>Empresa</span></label>
            <Autocompletar id="empresa" valor={d['Empresa']} placeholder="Escribe el nombre de la empresa"
              onTexto={v => set('Empresa', v)} onElegir={o => elegirEmpresa(o.label)} opciones={sugerenciasEmpresa} />
            {autoNota && <p className="auto-note">{autoNota}</p>}
          </div>
          <div className="q">
            <p className="q-title">¿Qué tipo de cliente es?</p>
            <Chips etiqueta="Canal" opciones={canalOptions} valor={d['Canal']} onCambio={v => set('Canal', v)} />
          </div>
          {usuario.rol !== 'vendedor' && (
            <div className="q">
              <p className="q-title">¿A quién se asigna?</p>
              <Chips etiqueta="Vendedor" opciones={asignables} valor={d['Vendedor']} onCambio={v => set('Vendedor', v)} />
            </div>
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="sheet">
          <div className="q">
            <label className="field"><span>{esObra ? 'Nombre de la obra' : 'Nombre del punto de venta'}</span>
              <input className="input" value={d['Obra / PDV']} autoFocus
                placeholder={esObra ? 'Ej.: Edificio Los Almendros' : 'Ej.: Casa matriz, Sucursal Maipú'}
                onChange={e => set('Obra / PDV', e.target.value)} /></label>
            <label className="field" htmlFor="comuna"><span>Comuna</span></label>
            <Autocompletar id="comuna" valor={comunaTexto} placeholder="Escribe la comuna"
              onTexto={v => { setComunaTexto(v); setD(x => ({ ...x, 'Comuna': '', 'Región': '' })); }}
              onElegir={o => elegirComuna(o.label)} opciones={sugerenciasComuna} />
            {d['Región'] && <p className="auto-note">Región: {d['Región']}</p>}
            <label className="field" style={{ marginTop: 14 }}><span>Dirección</span>
              <input className="input" value={d['Dirección']} placeholder="Calle y número" onChange={e => set('Dirección', e.target.value)} /></label>
            <MarcarEnObra datos={d} onMarcar={p => { setD(x => ({ ...x, ...conPosicion(p) })); avisar(`Ubicación marcada (precisión ${p.precision} m).`, p.precision > 100); }} />
          </div>
          {esObra && (
            <div className="q">
              <p className="q-title">¿En qué etapa está?</p>
              <BarraEtapas estado={d['Estado de Obra']} onCambio={v => set('Estado de Obra', v)} />
            </div>
          )}
        </div>
      )}

      {paso === 3 && (
        <div className="sheet">
          <p className="opcional-nota">Todo lo de este paso es opcional. Puedes agregar al radar ahora y completarlo después.</p>
          <div className="q">
            <label className="field"><span>RUT de la empresa <small>dato legal, necesario para venderle</small></span>
              <input className="input" value={d['Rut Empresa']} placeholder="76.123.456-7" inputMode="text"
                onChange={e => set('Rut Empresa', e.target.value)} /></label>
            {d['Rut Empresa'].trim() && !pareceRut(d['Rut Empresa']) && (
              <p className="auto-note aviso">No parece un RUT. Debe ser como 76.123.456-7.</p>
            )}
          </div>
          <div className="q">
            <p className="q-title">¿Nos compran?</p>
            <Chips etiqueta="¿Nos compran?" opciones={['Sí', 'No']} valor={d['Les Vendemos?']} onCambio={v => set('Les Vendemos?', v)} />
          </div>
          {esObra && (
            <div className="q">
              <p className="q-title">Tipo de construcción</p>
              <Chips chico etiqueta="Tipo de construcción" opciones={tipoConstruccionOptions.filter(t => t !== 'No Aplica')}
                valor={d['Tipo Construcción']} onCambio={v => set('Tipo Construcción', v)} />
              <label className="field" style={{ marginTop: 14 }}><span>N° de pisos / casas</span>
                <input className="input" inputMode="numeric" value={d['Pisos']} onChange={e => set('Pisos', e.target.value)} /></label>
              {ACTORES.map(x => (
                <label key={x.k} className="field" style={{ marginTop: 14 }}><span>{x.k} <small>{x.ayuda}</small></span>
                  <input className="input" value={d[x.k] || ''} onChange={e => set(x.k, e.target.value)} /></label>
              ))}
            </div>
          )}
          <div className="q">
            <label className="field"><span>Contacto <small>nombre, cargo, teléfono o correo</small></span>
              <textarea className="textarea" value={d['Contacto']} onChange={e => set('Contacto', e.target.value)} /></label>
            <label className="field"><span>Próximos pasos</span>
              <textarea className="textarea" value={d['Próximos Pasos']} placeholder="Qué quedó pendiente y para cuándo" onChange={e => set('Próximos Pasos', e.target.value)} /></label>
            <label className="field"><span>Descripción</span>
              <textarea className="textarea" value={d['Descripción de la obra o PDV']} onChange={e => set('Descripción de la obra o PDV', e.target.value)} /></label>
          </div>
        </div>
      )}

      <div className="dock">
        <div className="dock-inner">
          {paso > 1
            ? <button className="btn btn-ghost" onClick={() => setPaso(p => p - 1)}>Atrás</button>
            : <span className="dock-note">Paso 1 de 3</span>}
          {paso === 1 && <button className="btn btn-dark" disabled={!paso1Listo} onClick={() => setPaso(2)}>Siguiente</button>}
          {paso === 2 && <button className="btn btn-dark" disabled={!paso2Listo} onClick={() => setPaso(3)}>Siguiente</button>}
          {paso === 3 && <button className="btn btn-primary" disabled={guardando} onClick={guardar}>{guardando ? 'Agregando…' : 'Agregar al radar'}</button>}
        </div>
      </div>
    </div>
  );
}

// ---------- Radar: estado compartido entre pantallas ----------
function Radar({ usuario }: { usuario: Usuario }) {
  // Jefatura no comparte su ubicación; vendedores y jefes zonales sí, después de leer el aviso.
  const comparte = usuario.rol !== 'jefatura';
  const ubic = useUbicacion(comparte);
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState<{ tipo: 'lista' } | { tipo: 'obra'; id: string } | { tipo: 'nueva'; texto: string }>({ tipo: 'lista' });
  const [toast, setToast] = useState<{ m: string; error?: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await postApi<Obra[]>({ action: 'getAllData' });
        if (r.status !== 'success') throw new Error(mensajeServidor(r.message));
        setObras(r.data || []);
      } catch (e) {
        setError(e instanceof Error ? `No se pudieron cargar las obras: ${e.message}` : 'No se pudieron cargar las obras.');
      }
      setCargando(false);
    })();
    postApi<Cliente[]>({ action: 'getClientList' }).then(r => { if (r.status === 'success') setClientes(r.data || []); }).catch(() => {});
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [vista.tipo]);
  const avisar = (m: string, err?: boolean) => { setToast({ m, error: err }); setTimeout(() => setToast(null), err ? 7000 : 3500); };
  const obraAbierta = vista.tipo === 'obra' ? obras.find(o => txt(o, 'ID') === vista.id) : null;

  return (
    <>
      {comparte && !ubic.aceptado && (
        <div className="aviso-ubic" role="region" aria-label="Aviso de ubicación">
          <p><strong>El radar usa tu ubicación</strong> para geolocalizarte en el mapa.</p>
          <button className="btn btn-dark btn-small" onClick={ubic.aceptar}>Entendido, activar</button>
        </div>
      )}
      {vista.tipo === 'lista' && (
        <MisObras usuario={usuario} obras={obras} cargando={cargando} error={error} posicion={ubic.posicion}
          onAbrir={o => setVista({ tipo: 'obra', id: txt(o, 'ID') })} onNueva={t => setVista({ tipo: 'nueva', texto: t })} />
      )}
      {vista.tipo === 'obra' && obraAbierta && (
        <FichaObra key={txt(obraAbierta, 'ID') + txt(obraAbierta, 'Última Actualización')} usuario={usuario} obra={obraAbierta} avisar={avisar}
          posicion={ubic.posicion}
          onVolver={() => setVista({ tipo: 'lista' })}
          onGuardada={o => setObras(prev => prev.map(x => txt(x, 'ID') === txt(o, 'ID') ? o : x))} />
      )}
      {vista.tipo === 'nueva' && (
        <NuevaObra usuario={usuario} obras={obras} clientes={clientes} textoInicial={vista.texto} avisar={avisar}
          onVolver={() => setVista({ tipo: 'lista' })} onCreada={o => setObras(prev => [...prev, o])} />
      )}
      {toast && <div className={`toast${toast.error ? ' error' : ''}`} role="status">{toast.m}</div>}
    </>
  );
}

// ---------- Sesión ----------
export default function App() {
  const [estado, setEstado] = useState<'cargando' | 'fuera' | 'dentro'>('cargando');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setUsuario(null); setEstado('fuera'); return; }
    setEstado('cargando');
    try {
      const r = await postApi<Usuario>({ action: 'whoami' });
      if (r.status === 'success' && r.data && r.data.vendedor) {
        setAviso(''); setUsuario(r.data); setEstado('dentro');
      } else {
        setAviso(r.status === 'success' ? 'Tu cuenta aún no está habilitada en el radar. Pide a jefatura que te agregue.' : mensajeServidor(r.message));
        await signOut(auth);
      }
    } catch (e) {
      setAviso(`No se pudo conectar con el radar (${e instanceof Error ? e.message : 'error desconocido'}). Intenta de nuevo en unos segundos.`);
      await signOut(auth);
    }
  }), []);

  if (estado === 'fuera') return <Login aviso={aviso} />;

  return (
    <>
      <header className="rc-top">
        <div className="rc-top-inner">
          <div className="marcas"><img src="/logo-natstone-h.png" alt="Natstone" className="m-nat" /><span className="m-sep" aria-hidden="true" /><img src="/logo-pietra.png" alt="Pietra" className="m-pie" /></div>
          {usuario && (
            <div className="rc-who">
              <span><strong>{usuario.vendedor}</strong><span className="rol">{usuario.rol === 'jefatura' ? 'Jefatura' : usuario.rol === 'jefe zonal' ? 'Jefe zonal' : 'Radar Comercial'}</span></span>
              <button className="btn btn-ghost btn-small" onClick={() => signOut(auth)}>Salir</button>
            </div>
          )}
        </div>
      </header>
      <main className="rc-main">
        {estado === 'cargando' && <div className="loading">Cargando…</div>}
        {estado === 'dentro' && usuario && <Radar key={usuario.correo} usuario={usuario} />}
      </main>
    </>
  );
}
