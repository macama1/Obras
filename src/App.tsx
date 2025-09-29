import React, { useState, useEffect } from 'react';

// --- Contenido de database.ts y App.css movido aquí para resolver el error de compilación ---

// --- Base de Datos Local ---
export const canalOptions = [
  'Constructora Pequeña', 'Constructora Mediana', 'Constructora Grande', 'Ferretería', 'Distribuidor', 'Especialista', 'Distribuidor Grandes Supericies', 'Instalador Eifs', 'E-Commerce', 'Industrial',
];
export const vendedorOptions = [
  "Andrés Pacheco", "Eduardo Arias", "David Fuentealba", "Diego Montenegro", "Jorge Nario", "Leonel Angulo", "Loreto Medina", "Mónica Valencia"
];
export const estadoObraOptions = [
  'Cierre Perimetral', 'Limpieza y Demolición', 'Instalación de Faena', 'Obras Preliminares', 'Movimiento de Tierra', 'Excavaciones', 'Fundaciones', 'Obra Gruesa -20%', 'Obra Gruesa 20% ~ 50%', 'Obra Gruesa +50%', 'Terminaciones -20%', 'Terminaciones 20% ~ 50%', 'Terminaciones +50%', 'Terminada', 'Detenida', 'Post Venta',
];
export const tipoConstruccionOptions = [
  "Residencial", "Edificio Departamentos", "Industrial", "Comercial", "Obras Menores", "Educacional", "Casas", "Deportiva", "Culto"
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


// --- Componente de Estilos (reemplaza App.css) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    :root {
      --font-family: 'Inter', sans-serif;
      --primary-color: #f97316; /* Naranjo Natstone */
      --primary-hover-color: #ea580c;
      --secondary-color: #4b5563; /* Gris oscuro */
      --secondary-hover-color: #374151;
      --background-color: #f3f4f6;
      --card-background: #ffffff;
      --text-color: #1f2937;
      --text-light-color: #6b7280;
      --border-color: #d1d5db;
      --shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      --border-radius: 8px;
    }
    body { margin: 0; font-family: var(--font-family); background-color: var(--background-color); color: var(--text-color); }
    .container { max-width: 1200px; margin: 2rem auto; padding: 1rem; }
    h1, h2 { font-weight: 700; color: var(--text-color); }
    h1 { text-align: center; margin-bottom: 2rem; font-size: 2.25rem; }
    h2 { margin: 0; font-size: 1.5rem; }
    .card { background-color: var(--card-background); border-radius: var(--border-radius); box-shadow: var(--shadow); padding: 2rem; margin-bottom: 2rem; border: 1px solid var(--border-color); }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; align-items: end; }
    .form-grid-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .form-column { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field.full-width { grid-column: 1 / -1; }
    label { font-weight: 500; font-size: 0.9rem; color: var(--text-light-color); }
    input[type="text"], input[type="email"], input[type="tel"], input[type="date"], select, textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); font-size: 1rem; transition: all 0.2s; background-color: #fff; color: var(--text-color); box-sizing: border-box; font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2); }
    input:disabled, textarea:disabled { background-color: #f3f4f6; cursor: not-allowed; color: #9ca3af; }
    .actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; }
    button { padding: 0.75rem 1.5rem; border: none; border-radius: var(--border-radius); font-size: 1rem; font-weight: 500; cursor: pointer; transition: all 0.2s; background-color: var(--primary-color); color: white; }
    button:hover:not(:disabled) { background-color: var(--primary-hover-color); }
    .secondary-button { background-color: var(--secondary-color); }
    .secondary-button:hover:not(:disabled) { background-color: var(--secondary-hover-color); }
    .autocomplete-container { position: relative; }
    .suggestions-list { position: absolute; background-color: white; border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 var(--border-radius) var(--border-radius); width: 100%; max-height: 200px; overflow-y: auto; z-index: 1000; list-style: none; padding: 0; margin-top: -1px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
    .suggestions-list li { padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid var(--border-color); }
    .suggestions-list li:last-child { border-bottom: none; }
    .suggestions-list li:hover { background-color: #f9fafb; }
    .loader { text-align: center; padding: 2rem; font-size: 1.2rem; color: var(--text-light-color); }
    .message { text-align: center; padding: 1rem; margin: 1rem 0; border-radius: var(--border-radius); font-weight: 500; }
    @media (max-width: 992px) { .form-grid-details { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { h1 { font-size: 1.8rem; } .card { padding: 1.5rem; } .form-grid-details { grid-template-columns: 1fr; } .actions { flex-direction: column; } button { width: 100%; } }
  `}</style>
);


const API_URL = "https://script.google.com/macros/s/AKfycbwFurWMyjoIhRfFQmPIVYLdKl0sfkjUbVJWPM6HLG98Cu3G4wfYhgSmEk_pUTPWHhMXgw/exec";

// --- Interfaces ---
interface ObraDetails { [key: string]: any; }

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
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
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
  'Empresa': '', 'Obra / PDV': '', 'Vendedor': '', 'Canal': '', 'Tipo Construcción': '', 'Región': '', 'Comuna': '', 'Dirección': '', 'Estado de Obra': '', 'Les Vendemos?': '', 'Observaciones de Compra': '', 'Descripción de la obra o PDV': '', 'M²': '', 'Nombre Contacto': '', 'Cargo Contacto': '', 'Email Contacto': '', 'Teléfono Contacto': '', 'Contacto Administrador': '', 'Comentarios Última Visita': '', 'Rut Empresa': '', 'Monto Presupuesto': '', 'Fecha Fin Obra': ''
};


export default function App() {
  // --- Estados ---
  const [selectedRegion, setSelectedRegion] = useState('');
  const [allData, setAllData] = useState<ObraDetails[]>([]);
  const [clientList, setClientList] = useState<string[]>([]);
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
  const [newCompanySuggestions, setNewCompanySuggestions] = useState<string[]>([]);

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
    const filtered = clientList.filter(c => c && c.toLowerCase().includes(newCompanyInput.toLowerCase()));
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
      } else { throw new Error(data.message); }
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
        const currentRegion = selectedRegion;
        setSelectedRegion('');
        setTimeout(() => setSelectedRegion(currentRegion), 100);
      } else { throw new Error(result.message); }
    } catch (error) {
      setMessage(`❌ Error al crear la obra: ${error instanceof Error ? error.message : 'Desconocido'}`);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('es-CL');
  };
  
  return (
    <div className="container">
      <GlobalStyles />
      <h1>Cartera Activa</h1>
      <div className="card">
        {!isCreateMode ? (
          <>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>1. Seleccione Región</label>
                <select value={selectedRegion} onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setCompanyInput('');
                  setSelectedCompany('');
                  setSelectedObraId('');
                }}>
                  <option value="">-- Elija una región para comenzar --</option>
                  {regionesYComunas.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
                </select>
              </div>
            </div>
            {selectedRegion && (
              <>
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
              </>
            )}
          </>
        ) : (
          <div>
            <h2>Agregar Nuevo PdV en {selectedRegion}</h2>
            <div className="form-grid-details">
              <div className="form-column">
                <div className="form-field">
                  <label>Empresa</label>
                  <AutocompleteInput 
                    value={newCompanyInput}
                    onChange={(e) => {
                      setNewCompanyInput(e.target.value);
                      setNewObraData(prev => ({...prev, 'Empresa': e.target.value}));
                    }}
                    onSuggestionClick={(suggestion) => {
                      setNewCompanyInput(suggestion);
                      setNewObraData(prev => ({...prev, 'Empresa': suggestion}));
                      setNewCompanySuggestions([]);
                    }}
                    suggestions={newCompanySuggestions}
                    placeholder="Busque o ingrese empresa..."
                    disabled={loading}
                  />
                </div>
                <div className="form-field"><label>Obra / PDV</label><input type="text" name="Obra / PDV" value={newObraData['Obra / PDV']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Vendedor</label><select name="Vendedor" value={newObraData['Vendedor']} onChange={handleNewObraInputChange}><option value="">-- Asignar Vendedor --</option>{vendedorOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                <div className="form-field"><label>Canal</label><select name="Canal" value={newObraData['Canal']} onChange={handleNewObraInputChange}><option value="">-- Elija un canal --</option>{canalOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-field"><label>Tipo Construcción</label><select name="Tipo Construcción" value={newObraData['Tipo Construcción']} onChange={handleNewObraInputChange}><option value="">-- Elija un tipo --</option>{tipoConstruccionOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div className="form-column">
                <div className="form-field"><label>Región</label><input type="text" value={newObraData['Región']} disabled /></div>
                <div className="form-field">
                  <label>Comuna</label>
                  <AutocompleteInput value={comunaInput} onChange={(e) => { setComunaInput(e.target.value); setNewObraData(prev => ({...prev, 'Comuna': e.target.value})); }} onSuggestionClick={(comuna) => { setComunaInput(comuna); setNewObraData(prev => ({...prev, 'Comuna': comuna})); setComunaSuggestions([]); }} suggestions={comunaSuggestions} placeholder="Busque una comuna..." disabled={false} />
                </div>
                <div className="form-field"><label>Dirección</label><input type="text" name="Dirección" value={newObraData['Dirección']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Monto Presupuesto</label><input type="text" name="Monto Presupuesto" value={newObraData['Monto Presupuesto']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Fecha Fin Obra</label><input type="text" name="Fecha Fin Obra" value={newObraData['Fecha Fin Obra']} onChange={handleNewObraInputChange} /></div>
              </div>
              <div className="form-column">
                <div className="form-field"><label>Estado de Obra</label><select name="Estado de Obra" value={newObraData['Estado de Obra']} onChange={handleNewObraInputChange}><option value="">-- Cambiar Estado --</option>{estadoObraOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                <div className="form-field"><label>Les Vendemos?</label><select name="Les Vendemos?" value={newObraData['Les Vendemos?']} onChange={handleNewObraInputChange}><option value="">-- Seleccione --</option>{lesVendemosOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div className="form-field"><label>M²</label><input type="text" name="M²" value={newObraData['M²']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Nombre Contacto</label><input type="text" name="Nombre Contacto" value={newObraData['Nombre Contacto']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Cargo Contacto</label><input type="text" name="Cargo Contacto" value={newObraData['Cargo Contacto']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Email Contacto</label><input type="email" name="Email Contacto" value={newObraData['Email Contacto']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Teléfono Contacto</label><input type="tel" name="Teléfono Contacto" value={newObraData['Teléfono Contacto']} onChange={handleNewObraInputChange} /></div>
              </div>
            </div>
            <div className="actions">
              <button onClick={() => setIsCreateMode(false)} className="secondary-button">Cancelar</button>
              <button onClick={handleCreateObra} disabled={loading}>{loading ? 'Guardando...' : 'Guardar Nueva Obra'}</button>
            </div>
          </div>
        )}
      </div>

      {loading && !selectedRegion && !isCreateMode && <div className="loader"></div>}
      {loading && selectedRegion && !isCreateMode && <div className="loader">Cargando datos de la región...</div>}

      {obraDetails && !loading && !isCreateMode && (
        <div className="card details">
          <h2>Detalles de la Obra</h2>
          <div className="form-grid-details">
            <div className="form-column">
              <div className="form-field"><label>Empresa</label><input type="text" value={obraDetails['Empresa'] || ''} disabled /></div>
              <div className="form-field"><label>Obra / PDV</label><input type="text" name="Obra / PDV" value={obraDetails['Obra / PDV'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Vendedor</label><input type="text" value={obraDetails['Vendedor'] || ''} disabled /></div>
              <div className="form-field"><label>Canal</label><input type="text" value={obraDetails['Canal'] || ''} disabled /></div>
              <div className="form-field"><label>Región</label><input type="text" value={obraDetails['Región'] || ''} disabled /></div>
              <div className="form-field"><label>Comuna</label><input type="text" value={obraDetails['Comuna'] || ''} disabled /></div>
              <div className="form-field"><label>Dirección</label><input type="text" name="Dirección" value={obraDetails['Dirección'] || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="form-column">
              <div className="form-field"><label>Tipo Construcción</label><select name="Tipo Construcción" value={obraDetails['Tipo Construcción'] || ''} onChange={handleInputChange}><option value="">-- Elija un tipo --</option>{tipoConstruccionOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="form-field"><label>Estado de Obra</label><select name="Estado de Obra" value={obraDetails['Estado de Obra'] || ''} onChange={handleInputChange}><option value="">-- Cambiar Estado --</option>{estadoObraOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
              <div className="form-field"><label>Les Vendemos?</label><select name="Les Vendemos?" value={obraDetails['Les Vendemos?']} onChange={handleInputChange}><option value="">-- Seleccione --</option>{lesVendemosOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div className="form-field"><label>Observaciones de Compra</label><textarea name="Observaciones de Compra" value={obraDetails['Observaciones de Compra'] || ''} onChange={handleInputChange} rows={2}></textarea></div>
              <div className="form-field"><label>Monto Presupuesto</label><input type="text" name="Monto Presupuesto" value={obraDetails['Monto Presupuesto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Fecha Fin Obra</label><input type="text" name="Fecha Fin Obra" value={obraDetails['Fecha Fin Obra'] || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="form-column">
              <div className="form-field"><label>Descripción de la obra o PDV</label><textarea name="Descripción de la obra o PDV" value={obraDetails['Descripción de la obra o PDV'] || ''} onChange={handleInputChange} rows={2}></textarea></div>
              <div className="form-field"><label>M²</label><input type="text" name="M²" value={obraDetails['M²'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Nombre Contacto</label><input type="text" name="Nombre Contacto" value={obraDetails['Nombre Contacto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Cargo Contacto</label><input type="text" name="Cargo Contacto" value={obraDetails['Cargo Contacto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Email Contacto</label><input type="email" name="Email Contacto" value={obraDetails['Email Contacto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Teléfono Contacto</label><input type="tel" name="Teléfono Contacto" value={obraDetails['Teléfono Contacto'] || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="form-column" style={{gridColumn: '1 / -1'}}>
              <div className="form-field"><label>Acciones Última Reunion</label><textarea value={obraDetails['Acciones Última Reunion'] || ''} rows={2} disabled></textarea></div>
              <div className="form-field"><label>Comentarios Última Visita</label><textarea name="Comentarios Última Visita" value={obraDetails['Comentarios Última Visita'] || ''} onChange={handleInputChange} rows={4}></textarea></div>
              <div className="form-field"><label>Rut Empresa</label><input type="text" value={obraDetails['Rut Empresa'] || ''} disabled /></div>
              <div className="form-field"><label>Última Actualización</label><input type="text" value={formatDate(obraDetails['Última Actualización'])} disabled /></div>
            </div>
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
