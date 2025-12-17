import React, { useState, useEffect } from 'react';

// --- COMPONENTE DE ESTILOS GLOBALES (DISEÑO MEJORADO + HERO + LOGO) ---
const GlobalStyles = () => (
  <style>{`
    /* --- Variables y Reset --- */
    :root {
      --color-primario: #1a1a1a;        /* Negro Natstone */
      --color-secundario: #F97316;      /* Naranja Natstone */
      --color-fondo: #f8fafc;           /* Gris azulado pálido */
      --color-tarjeta: #ffffff;
      --color-borde: #e2e8f0;
      --color-texto: #334155;
      --color-texto-secundario: #64748b;
      --radio-borde: 12px;
      --sombra-suave: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      --sombra-focus: 0 0 0 4px rgba(249, 115, 22, 0.15);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--color-fondo);
      color: var(--color-texto);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* --- Títulos --- */
    h1 {
      text-align: center;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: var(--color-primario);
      margin: 1rem 0 2rem 0;
      text-transform: uppercase;
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-primario);
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-borde);
    }

    /* --- Layout --- */
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 1.5rem 4rem 1.5rem;
    }

    .card {
      background-color: var(--color-tarjeta);
      border-radius: var(--radio-borde);
      box-shadow: var(--sombra-suave);
      border: 1px solid var(--color-borde);
      padding: 2.5rem;
      margin-bottom: 2rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .card.details {
      border-top: 5px solid var(--color-secundario);
    }

    /* --- Estilos para la Pantalla de Bienvenida (Hero) --- */
    .welcome-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      text-align: center;
    }

    .welcome-card {
      background: white;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
      border: 1px solid var(--color-borde);
      position: relative;
      overflow: hidden;
    }

    .welcome-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 6px;
      background: linear-gradient(90deg, var(--color-secundario), #fb923c);
    }

    .hero-icon {
      background-color: #fff7ed;
      color: var(--color-secundario);
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem auto;
    }

    .welcome-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-primario);
      margin-bottom: 0.5rem;
    }

    .welcome-subtitle {
      color: var(--color-texto-secundario);
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }

    /* --- Grillas --- */
    .form-grid, .form-grid-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    /* --- Labels e Inputs --- */
    label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-texto-secundario);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    input, select, textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      font-size: 0.95rem;
      color: var(--color-primario);
      background-color: #fff;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      transition: all 0.2s ease-in-out;
      appearance: none;
    }

    select {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.75rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    textarea {
      min-height: 100px;
      resize: vertical;
      line-height: 1.5;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--color-secundario);
      box-shadow: var(--sombra-focus);
    }

    input:disabled, select:disabled {
      background-color: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
    }

    /* --- Autocomplete --- */
    .autocomplete-container { position: relative; }
    
    .suggestions-list {
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: #fff;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      z-index: 50;
      max-height: 250px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .suggestions-list li {
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-size: 0.95rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .suggestions-list li:hover {
      background-color: #fff7ed;
      color: var(--color-secundario);
    }

    /* --- Botones --- */
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px dashed var(--color-borde);
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.875rem 1.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      background-color: var(--color-secundario);
      color: white;
      box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
    }

    button:hover {
      background-color: #ea580c;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
    }

    button:active { transform: translateY(0); }

    button.secondary-button {
      background-color: white;
      color: var(--color-primario);
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    button.secondary-button:hover {
      background-color: #f8fafc;
      border-color: #94a3b8;
      color: black;
    }
    
    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    /* --- Destacados y Mensajes --- */
    .field-highlight input, .field-highlight select {
      border-color: var(--color-secundario);
      background-color: #fff7ed;
    }
    
    .field-highlight label {
      color: var(--color-secundario);
    }

    .message {
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1.5rem;
      text-align: center;
      font-weight: 500;
    }
    .message[class*="✅"] { background-color: #dcfce7; color: #166534; }
    .message[class*="❌"] { background-color: #fee2e2; color: #991b1b; }
    .loader { text-align: center; color: var(--color-texto-secundario); padding: 2rem; }

    /* --- Responsivo --- */
    @media (max-width: 768px) {
      .form-grid, .form-grid-details { grid-template-columns: 1fr; }
      .card { padding: 1.5rem; }
      .actions { flex-direction: column-reverse; }
      button { width: 100%; }
    }
  `}</style>
);
// --- FIN DEL COMPONENTE DE ESTILOS ---


// --- Base de Datos Local ---
export const canalOptions = [
  'Constructora Pequeña', 'Constructora Mediana', 'Constructora Grande', 'Ferretería', 'Distribuidor', 'Especialista', 'Distribuidor Grandes Supericies', 'Instalador', 'E-Commerce', 'Industrial',
];
export const vendedorOptions = [
  "Andrés Pacheco", "Eduardo Arias", "David Fuentealba", "Diego Montenegro", "Jorge Nario", "Loreto Medina", "Mauricio Carvajal", "Mónica Valencia", "Vendedor General CA"
];
export const estadoObraOptions = [
  'No Aplica','Cierre Perimetral', 'Limpieza y Demolición', 'Instalación de Faena', 'Obras Preliminares', 'Movimiento de Tierra', 'Excavaciones', 'Fundaciones', 'Obra Gruesa -20%', 'Obra Gruesa 20% ~ 50%', 'Obra Gruesa +50%', 'Terminaciones -20%', 'Terminaciones 20% ~ 50%', 'Terminaciones +50%', 'Terminada', 'Detenida', 'Post Venta',
];
export const tipoConstruccionOptions = [
  "No Aplica", "Residencial", "Edificio Departamentos", "Industrial", "Comercial", "Obras Menores", "Educacional", "Casas", "Deportiva", "Culto", "Salud"
];
export const lesVendemosOptions = ['Sí', 'No'];
export const regionesYComunas = [
    { region: 'Arica y Parinacota', comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos']},
    { region: 'Tarapacá', comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica']},
    { region: 'Antofagasta', comunas: ['Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollagüe', 'San Pedro de Atacama', 'Tocopilla', 'María Elena']},
    { region: 'Atacama', comunas: ['Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar', 'Alto del Carmen', 'Freirina', 'Huasco']},
    { region: 'Coquimbo', comunas: ['La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paiguano', 'Vicuña', 'Illapel', 'Canela', 'Los Vilos', 'Salamanca', 'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui', 'Río Hurtado']},
    { region: 'Valparaíso', comunas: ['Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Viña del Mar', 'Isla de Pascua', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban', 'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar', 'Quillota', 'Calera', 'Hijuelas', 'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo', 'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María', 'Quilpué', 'Limache', 'Olmué', 'Villa Alemana']},
    { region: 'Metropolitana de Santiago', comunas: ['Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Santiago', 'Vitacura', 'Padre Hurtado', 'Peñaflor', 'Talagante', 'El Monte', 'Isla de Maipo', 'Colina', 'Lampa', 'Tiltil', 'San José de Maipo', 'Pirque', 'Puente Alto', 'San Bernardo', 'Buin', 'Calera de Tango', 'Paine']},
    { region: "Libertador General Bernardo O'Higgins", comunas: ['Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras', 'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Vicente', 'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue', 'Navidad', 'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua', 'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz']},
    { region: 'Maule', comunas: ['Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue', 'Río Claro', 'San Clemente', 'San Rafael', 'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó', 'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno', 'Vichuquén', 'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier', 'Villa Alegre', 'Yerbas Buenas']},
    { region: 'Ñuble', comunas: ['Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Quirihue', 'Ránquil', 'Treguaco', 'Bulnes', 'Chillán Viejo', 'Chillán', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón', 'San Ignacio', 'Yungay', 'Coihueco', 'Ñiquén', 'San Carlos', 'San Fabián', 'San Nicolás']},
    { region: 'Biobío', comunas: ['Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco', 'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco', 'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa', 'Los Ángeles', 'Antuco', 'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío']},
    { region: 'La Araucanía', comunas: ['Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Loncoche', 'Melipeuco', 'Nueva Imperial', 'Padre las Casas', 'Perquenco', 'Pitrufquén', 'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Cholchol', 'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco', 'Purén', 'Renaico', 'Traiguén', 'Victoria']},
    { region: 'Los Ríos', comunas: ['Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli', 'La Unión', 'Futrono', 'Lago Ranco', 'Río Bueno']},
    { region: 'Los Lagos', comunas: ['Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue', 'Maullín', 'Puerto Varas', 'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Osorno', 'Puerto Octay', 'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén', 'Futaleufú', 'Hualaihué', 'Palena']},
    { region: 'Aysén del General Carlos Ibáñez del Campo', comunas: ['Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins", 'Tortel', 'Chile Chico', 'Río Ibáñez']},
    { region: 'Magallanes y de la Antártica Chilena', comunas: ['Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos (Ex Navarino)', 'Antártica', 'Porvenir', 'Primavera', 'Timaukel', 'Natales', 'Torres del Paine']},
];


const API_URL = "https://script.google.com/macros/s/AKfycbwFurWMyjoIhRfFQmPIVYLdKl0sfkjUbVJWPM6HLG98Cu3G4wfYhgSmEk_pUTPWHhMXgw/exec"; 

// --- Interfaces ---
interface ObraDetails { [key: string]: any; }
interface ClientInfo { empresa: string; rut: string; }

// --- Componente de Autocompletado ---
const AutocompleteInput = ({ value, onChange, onSuggestionClick, suggestions, placeholder, disabled }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onSuggestionClick: (suggestion: string) => void; suggestions: string[]; placeholder: string; disabled: boolean; }) => {
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    setShowSuggestions(true);
  }, [value]);

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    onSuggestionClick(suggestion);
  };
  
  return (
    <div className="autocomplete-container">
      <input 
        type="text" 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        disabled={disabled} 
        autoComplete="off" 
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li key={index} onMouseDown={() => handleSuggestionClick(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


// --- Estado Inicial para una Nueva Obra ---
const initialNewObraState = {
  'Empresa': '', 'Obra / PDV': '', 'Vendedor': '', 'Canal': '', 'Tipo Construcción': '', 'Región': '', 'Comuna': '', 'Dirección': '', 'Estado de Obra': '', 'Les Vendemos?': '', 'Observaciones de Compra': '', 'Descripción de la obra o PDV': '', 'M²': '', 
  'Contacto': '', 
  'Comentarios Última Visita': '', 'Rut Empresa': '', 'Monto Presupuesto': '', 'Fecha Fin Obra': ''
};


export default function App() {
  // --- Estados ---
  const [selectedRegion, setSelectedRegion] = useState('');
  const [allData, setAllData] = useState<ObraDetails[]>([]);
  const [clientList, setClientList] = useState<ClientInfo[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [obras, setObras] = useState<ObraDetails[]>([]);
  const [selectedObraId, setSelectedObraId] = useState('');
  const [obraDetails, setObraDetails] = useState<ObraDetails | null>(null);
  const [initialObraDetails, setInitialObraDetails] = useState<ObraDetails | null>(null);
  const [comunaInput, setComunaInput] = useState('');
  const [comunaSuggestions, setComunaSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newObraData, setNewObraData] = useState<ObraDetails>(initialNewObraState);
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [newCompanySuggestions, setNewCompanySuggestions] = useState<ClientInfo[]>([]);

  // --- Carga Inicial de Clientes ---
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getClientList' }) });
        const data = await response.json();
        if (data.status === 'success') {
          setClientList(data.data);
        }
      } catch (error) {
        console.error('No se pudo cargar la lista de clientes.');
      }
    };
    fetchClients();
  }, []);

  // --- Carga de Datos por Región ---
  useEffect(() => {
    if (!selectedRegion) {
      setAllData([]);
      return;
    }
    const fetchDataByRegion = async () => {
      setLoading(true);
      setMessage('');
      try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getDataByRegion', region: selectedRegion }) });
        const data = await response.json();
        if (data.status === 'success') {
          setAllData(data.data);
        } else { throw new Error(data.message || 'Error del servidor'); }
      } catch (error) {
        setMessage('❌ No se pudieron cargar los datos para la región seleccionada.');
        setAllData([]);
      }
      setLoading(false);
    };
    fetchDataByRegion();
  }, [selectedRegion]);

  // --- Búsqueda y Filtrado (Local) ---
  useEffect(() => {
    if (companyInput.length < 2) { setCompanySuggestions([]); return; }
    const uniqueCompanies = [...new Set(allData.map(item => item.Empresa))];
    const filtered = uniqueCompanies.filter(c => c && c.toLowerCase().includes(companyInput.toLowerCase()));
    setCompanySuggestions(filtered.slice(0, 10));
  }, [companyInput, allData]);
  
  useEffect(() => {
    if (newCompanyInput.length < 2) { setNewCompanySuggestions([]); return; }
    const filtered = clientList.filter(c => c.empresa && c.empresa.toLowerCase().includes(newCompanyInput.toLowerCase()));
    setNewCompanySuggestions(filtered.slice(0, 10));
  }, [newCompanyInput, clientList]);


  useEffect(() => {
    if (comunaInput.length < 2) { setComunaSuggestions([]); return; }
    const comunasDeRegion = regionesYComunas.find(r => r.region === (isCreateMode ? newObraData['Región'] : obraDetails?.['Región']))?.comunas || [];
    const filtered = comunasDeRegion.filter(c => c.toLowerCase().includes(comunaInput.toLowerCase()));
    setComunaSuggestions(filtered.slice(0, 10));
  }, [comunaInput, selectedRegion, isCreateMode, newObraData, obraDetails]);

  useEffect(() => {
    if (!selectedCompany) { setObras([]); setSelectedObraId(''); return; }
    const filteredObras = allData.filter(item => item.Empresa === selectedCompany);
    setObras(filteredObras);
  }, [selectedCompany, allData]);

  useEffect(() => {
    if (!selectedObraId) {
      if (!isCreateMode) { setObraDetails(null); setInitialObraDetails(null); }
      return;
    }
    const details = allData.find(item => item.ID === selectedObraId);
    if (details) {
      setObraDetails(details);
      setInitialObraDetails(details);
      setComunaInput(details['Comuna'] || '');
    }
  }, [selectedObraId, allData, isCreateMode]);

// --- Manejadores de Eventos ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setObraDetails(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleNewObraInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewObraData(prev => ({ ...prev, [name]: value }));
  };

  const handleAction = async (updates: ObraDetails | {} = {}) => {
    if (!selectedObraId) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'editObra', id: selectedObraId, updates }) });
      const data = await response.json();
      if (data.status === 'success') {
        setMessage(Object.keys(updates).length > 0 ? '✅ Cambios guardados.' : '✅ Visita registrada.');
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getDataByRegion', region: selectedRegion }) });
        const newData = await res.json();
        if(newData.status === 'success') {
          setAllData(newData.data);
        }
      } else { throw new Error(data.message || 'Error del servidor'); }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
    }
    setLoading(false);
  };

  const handleSaveChanges = () => {
    if (!obraDetails || !initialObraDetails) return;
    const updates: ObraDetails = {};
    for (const key in obraDetails) {
      if (obraDetails[key] !== initialObraDetails[key]) { updates[key] = obraDetails[key]; }
    }
    handleAction(updates);
  };
  
  const handleCreateObra = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'createNewObra', data: newObraData }) });
      const result = await response.json();
      if (result.status === 'success') {
        setMessage('✅ Nueva obra creada con éxito.');
        setAllData(prevData => [...prevData, result.data]);
        setIsCreateMode(false);
        setNewObraData(initialNewObraState);
      } else { throw new Error(result.message || 'Error del servidor'); }
    } catch (error) {
      setMessage(`❌ Error al crear la obra: ${error instanceof Error ? error.message : 'Desconocido'}`);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateString.split('-');
      const utcDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      return utcDate.toLocaleDateString('es-CL', { timeZone: 'UTC' });
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('es-CL', { timeZone: 'UTC' });
  };
  
  return (
    <div className="container">
      <GlobalStyles />
      
      {/* --- LOGO DE LA EMPRESA --- */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', marginTop: '2rem' }}>
        <img 
          src="/logo-natstone.png" 
          alt="NatStone Logo" 
          style={{ maxWidth: '250px', height: 'auto' }} 
        />
      </div>
      
      <h1>RADAR COMERCIAL</h1>
      
      {!isCreateMode ? (
        <>
          {/* CASO 1: PANTALLA DE INICIO (HERO SECTION) */}
          {!selectedRegion ? (
             <div className="welcome-wrapper">
               <div className="welcome-card">
                 {/* Icono decorativo */}
                 <div className="hero-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5V21"/>
                   </svg>
                 </div>
                 
                 <h1 className="welcome-title">Bienvenido</h1>
                 <p className="welcome-subtitle">Selecciona una región para gestionar obras y puntos de venta.</p>

                 <div className="form-field">
                    <label style={{textAlign: 'left'}}>Seleccione Región</label>
                    <select 
                      value={selectedRegion} 
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setCompanyInput('');
                        setSelectedCompany('');
                        setSelectedObraId('');
                      }}
                      style={{ padding: '1rem' }}
                    >
                      <option value="">-- Buscar zona geográfica --</option>
                      {regionesYComunas.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
                    </select>
                 </div>
               </div>
               
               <p style={{marginTop: '2rem', fontSize: '0.8rem', color: '#94a3b8'}}>
                 © {new Date().getFullYear()} Natstone - Sistema de Gestión
               </p>
             </div>
          ) : (
            /* CASO 2: YA SELECCIONÓ REGIÓN (Buscador de empresas) */
            <div className="card">
                <div className="form-grid">
                  <div className="form-field full-width">
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                        <label>Región Seleccionada</label>
                        <button 
                          className="secondary-button" 
                          onClick={() => setSelectedRegion('')}
                          style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}
                        >
                          ← Cambiar Región
                        </button>
                     </div>
                     <div style={{fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primario)'}}>
                        {selectedRegion}
                     </div>
                  </div>
                </div>

                <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                  <div className="form-field">
                    <label>2. Empresa</label>
                    <AutocompleteInput value={companyInput} onChange={(e) => { setCompanyInput(e.target.value); setSelectedCompany(''); }} onSuggestionClick={(company) => { setCompanyInput(company); setSelectedCompany(company); setCompanySuggestions([]); }} suggestions={companySuggestions} placeholder="Busque una empresa..." disabled={loading || !selectedRegion} />
                  </div>
                  <div className="form-field">
                    <label>3. Obra / PDV</label>
                    <select value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)} disabled={loading || !selectedCompany}>
                      <option value="">-- Seleccione un PdV --</option>
                      {obras.map(obra => <option key={obra.ID} value={obra.ID}>{obra.ID} - {obra['Obra / PDV']}</option>)}
                    </select>
                  </div>
                </div>
                {!selectedObraId && (
                  <div className="actions" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: '1rem' }}>
                    <button onClick={() => { setIsCreateMode(true); setComunaInput(''); setNewCompanyInput(''); setNewObraData({ ...initialNewObraState, 'Región': selectedRegion }); }} className="secondary-button">Agregar Nuevo Punto de Venta</button>
                  </div>
                )}
            </div>
          )}
        </>
      ) : (
        /* CASO 3: MODO CREAR NUEVA OBRA */
        <div className="card">
            <h2>Agregar Nuevo PdV en {selectedRegion}</h2>
            <div className="form-grid-details">
              <div className="form-field">
                <label>Empresa</label>
                  <AutocompleteInput 
                    value={newCompanyInput}
                    onChange={(e) => {
                      setNewCompanyInput(e.target.value);
                      setNewObraData(prev => ({...prev, 'Empresa': e.target.value, 'Rut Empresa': ''}));
                    }}
                    onSuggestionClick={(suggestion) => {
                      const foundClient = clientList.find(c => c.empresa === suggestion);
                      const clientRut = foundClient ? foundClient.rut : '';
                      setNewCompanyInput(suggestion);
                      setNewObraData(prev => ({...prev, 'Empresa': suggestion, 'Rut Empresa': clientRut }));
                      setNewCompanySuggestions([]);
                    }}
                    suggestions={newCompanySuggestions.map(c => c.empresa)}
                    placeholder="Busque o ingrese empresa..."
                    disabled={loading}
                  />
              </div>
              <div className="form-field"><label>Rut Empresa</label><input type="text" name="Rut Empresa" value={newObraData['Rut Empresa']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field field-highlight"><label>Obra / PDV</label><input type="text" name="Obra / PDV" value={newObraData['Obra / PDV']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Vendedor</label><select name="Vendedor" value={newObraData['Vendedor']} onChange={handleNewObraInputChange}><option value="">-- Asignar Vendedor --</option>{vendedorOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                <div className="form-field"><label>Canal</label><select name="Canal" value={newObraData['Canal']} onChange={handleNewObraInputChange}><option value="">-- Elija un canal --</option>{canalOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              
              <div className="form-field"><label>Región</label><input type="text" value={newObraData['Región']} disabled /></div>
              <div className="form-field">
                  <label>Comuna</label>
                  <AutocompleteInput value={comunaInput} onChange={(e) => { setComunaInput(e.target.value); setNewObraData(prev => ({...prev, 'Comuna': e.target.value})); }} onSuggestionClick={(comuna) => { setComunaInput(comuna); setNewObraData(prev => ({...prev, 'Comuna': comuna})); setComunaSuggestions([]); }} suggestions={comunaSuggestions} placeholder="Busque una comuna..." disabled={false} />
                </div>
                <div className="form-field"><label>Dirección</label><input type="text" name="Dirección" value={newObraData['Dirección']} onChange={handleNewObraInputChange} /></div>
                
                {/* CAMPOS BORRADOS: Monto Presupuesto y Fecha Fin */}
                
                <div className="form-field"><label>Observaciones de Compra</label><textarea name="Observaciones de Compra" value={newObraData['Observaciones de Compra']} onChange={handleNewObraInputChange} rows={2}></textarea></div>
              
              <div className="form-field"><label>Tipo Construcción</label><select name="Tipo Construcción" value={newObraData['Tipo Construcción']} onChange={handleNewObraInputChange}><option value="">-- Elija un tipo --</option>{tipoConstruccionOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}</select></div>
              
                <div className="form-field field-highlight"><label>*ESTADO DE LA OBRA*</label><select name="Estado de Obra" value={newObraData['Estado de Obra']} onChange={handleNewObraInputChange}><option value="">-- Cambiar Estado --</option>{estadoObraOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                <div className="form-field"><label>Les Vendemos?</label><select name="Les Vendemos?" value={newObraData['Les Vendemos?']} onChange={handleNewObraInputChange}><option value="">-- Seleccione --</option>{lesVendemosOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div className="form-field"><label>M²</label><input type="number" name="M²" value={newObraData['M²']} onChange={handleNewObraInputChange} /></div>
              <div className="form-field"><label>Descripción de la obra o PDV</label><textarea name="Descripción de la obra o PDV" value={newObraData['Descripción de la obra o PDV']} onChange={handleNewObraInputChange} rows={2}></textarea></div>
              
              <div className="form-field">
                <label>Contacto</label>
                <textarea 
                  name="Contacto" 
                  value={newObraData['Contacto']} 
                  onChange={handleNewObraInputChange} 
                  rows={4} 
                  placeholder="Ingrese información de contacto (nombre, email, teléfono, cargo, etc.)"
                />
              </div>

              {/* CAMPO BORRADO: Comentarios Iniciales */}

            </div> 
            
            <div className="actions">
              <button onClick={() => setIsCreateMode(false)} className="secondary-button">Cancelar</button>
              <button onClick={handleCreateObra} disabled={loading}>{loading ? 'Guardando...' : 'Guardar Nuevo PdV'}</button>
            </div>
        </div>
      )}

      {loading && !selectedRegion && !isCreateMode && <div className="loader"></div>}
      {loading && selectedRegion && !isCreateMode && <div className="loader">Cargando datos de la región...</div>}

      {/* CASO 4: DETALLES DE OBRA EXISTENTE */}
      {obraDetails && !loading && !isCreateMode && (
        <div className="card details">
          <h2>Detalles de la Obra</h2>
          <div className="form-grid-details">
            <div className="form-field"><label>Empresa</label><input type="text" value={obraDetails['Empresa'] || ''} disabled /></div>
              <div className="form-field field-highlight"><label>Obra / PDV</label><input type="text" name="Obra / PDV" value={obraDetails['Obra / PDV'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Vendedor</label><input type="text" value={obraDetails['Vendedor'] || ''} disabled /></div>
              <div className="form-field"><label>Canal</label><input type="text" value={obraDetails['Canal'] || ''} disabled /></div>
              <div className="form-field"><label>Región</label><input type="text" value={obraDetails['Región'] || ''} disabled /></div>
              <div className="form-field"><label>Comuna</label><input type="text" value={obraDetails['Comuna'] || ''} disabled /></div>
              <div className="form-field"><label>*DIRECCIÓN*</label><input type="text" name="Dirección" value={obraDetails['Dirección'] || ''} onChange={handleInputChange} /></div>
            
            <div className="form-field"><label>Tipo Construcción</label><select name="Tipo Construcción" value={obraDetails['Tipo Construcción'] || ''} onChange={handleInputChange}><option value="">-- Elija un tipo --</option>{tipoConstruccionOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="form-field field-highlight"><label>Estado de Obra</label><select name="Estado de Obra" value={obraDetails['Estado de Obra'] || ''} onChange={handleInputChange}><option value="">-- Cambiar Estado --</option>{estadoObraOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
              <div className="form-field"><label>Les Vendemos?</label><select name="Les Vendemos?" value={obraDetails['Les Vendemos?']} onChange={handleInputChange}><option value="">-- Seleccione --</option>{lesVendemosOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div className="form-field"><label>Observaciones de Compra</label><textarea name="Observaciones de Compra" value={obraDetails['Observaciones de Compra'] || ''} onChange={handleInputChange} rows={2}></textarea></div>
              
              {/* CAMPOS BORRADOS: Monto y Fecha Fin */}
            
            <div className="form-field"><label>Descripción de la obra o PDV</label><textarea name="Descripción de la obra o PDV" value={obraDetails['Descripción de la obra o PDV'] || ''} onChange={handleInputChange} rows={2}></textarea></div>
            <div className="form-field"><label>M²</label><input type="number" name="M²" value={obraDetails['M²'] || ''} onChange={handleInputChange} /></div>
           
            <div className="form-field">
              <label>Contacto</label>
              <textarea 
                name="Contacto" 
                value={obraDetails['Contacto'] || ''} 
                onChange={handleInputChange} 
                rows={4} 
              />
            </div>

            <div className="form-field"><label>Acciones Última Reunion</label><textarea value={obraDetails['Acciones Última Reunion'] || ''} rows={2} disabled></textarea></div>
            <div className="form-field"><label>Comentarios Última Visita</label><textarea name="Comentarios Última Visita" value={obraDetails['Comentarios Última Visita'] || ''} onChange={handleInputChange} rows={4}></textarea></div>
            <div className="form-field"><label>Rut Empresa</label><textarea name="Rut Empresa" value={obraDetails['Rut Empresa'] || ''} onChange={handleInputChange} rows={1}></textarea></div>
            <div className="form-field"><label>Última Actualización</label><input type="text" value={formatDate(obraDetails['Última Actualización'])} disabled /></div>
          
          </div> 

          <div className="actions">
            <button onClick={handleSaveChanges} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios y Registrar Visita'}
            </button>
          </div>
        </div>
      )}
      
      {message && <p className="message">{message}</p>}
    </div>
  );
}
