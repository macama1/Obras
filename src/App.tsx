import React, { useState, useEffect } from 'react';

// --- COMPONENTE DE ESTILOS GLOBALES ---
const GlobalStyles = () => (
  <style>{`
    /* --- Estilos Globales --- */
    :root {
      --color-primario: #1a1a1a; /* <-- CAMBIADO A NEGRO NATSTONE */
      --color-secundario: #F97316; /* <-- CAMBIADO A NARANJA NATSTONE (tipo Tailwind Orange 500) */
      --color-fondo: #f4f7f6;
      --color-tarjeta: #ffffff;
      --color-borde: #dfe6e9;
      --color-texto: #333;
      --color-texto-secundario: #555;
      --color-error: #e74c3c;
      --color-exito: #2ecc71;
      --sombra: 0 4px 12px rgba(0, 0, 0, 0.05);
      --radio-borde: 8px;
      /* --- AÑADIDO: Colores Natstone --- */
      --color-natstone-orange: #F97316;
      --color-natstone-black: #1a1a1a;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--color-fondo);
      color: var(--color-texto);
      line-height: 1.6;
    }

    h1, h2 {
      color: var(--color-primario);
      margin-bottom: 1rem;
    }

    h1 {
      text-align: center;
      font-size: 2rem;
      padding: 1rem 0;
    }

    h2 {
      font-size: 1.5rem;
      border-bottom: 2px solid var(--color-borde);
      padding-bottom: 0.5rem;
    }

    /* --- Contenedor y Tarjetas --- */
    .container {
      max-width: 1000px;
      margin: 20px auto;
      padding: 0 20px;
    }

    .card {
      background-color: var(--color-tarjeta);
      border-radius: var(--radio-borde);
      box-shadow: var(--sombra);
      padding: 1.5rem 2rem;
      margin-bottom: 1.5rem;
    }

    .card.details {
      border-top: 4px solid var(--color-secundario); /* <-- Ahora será naranja */
    }

    /* --- Formularios --- */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-grid-details {
      display: grid;
      /* --- MODIFICADO --- */
      /* Forzamos 2 columnas limpias en escritorio */
      grid-template-columns: 1fr 1fr; 
      /* --- FIN MODIFICACIÓN --- */
      gap: 1.5rem 2rem;
    }

    .form-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: var(--color-texto-secundario);
      text-transform: uppercase;
    }

    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="number"],
    input[type="date"],
    select,
    textarea {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-borde);
      background-color: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:disabled, select:disabled, textarea:disabled {
      background-color: var(--color-fondo);
      color: var(--color-texto-secundario);
      cursor: not-allowed;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--color-secundario);
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2); /* Sombra naranja al enfocar */
    }

    textarea {
      resize: vertical;
      min-height: 60px;
    }

    /* --- Autocompletado --- */
    .autocomplete-container {
      position: relative;
    }

    .suggestions-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background-color: #fff;
      border: 1px solid var(--color-borde);
      border-top: none;
      border-radius: 0 0 var(--radio-borde) var(--radio-borde);
      box-shadow: var(--sombra);
      list-style: none;
      margin: 0;
      padding: 0;
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
    }

    .suggestions-list li {
      padding: 0.75rem 1rem;
      cursor: pointer;
    }

    .suggestions-list li:hover {
      background-color: var(--color-fondo);
    }

    /* --- Botones y Acciones --- */
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1.5rem;
      margin-top: 1.5rem;
      border-top: 1px solid var(--color-borde);
    }

    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: var(--radio-borde);
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      background-color: var(--color-secundario); /* <-- Ahora será naranja */
      color: white;
    }

    button:hover {
      background-color: #EA580C; /* <-- Naranja más oscuro */
    }

    button:active {
      transform: translateY(1px);
    }

    button:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

    button.secondary-button {
      background-color: var(--color-natstone-black); /* <-- CAMBIADO A NEGRO */
      color: white;
    }

    button.secondary-button:hover {
      background-color: #333; /* <-- Negro más claro */
    }

    /* --- Mensajes y Carga --- */
    .loader {
      text-align: center;
      padding: 2rem;
      font-weight: 600;
      color: var(--color-texto-secundario);
    }

    .message {
      text-align: center;
      font-weight: 600;
      padding: 1rem;
      border-radius: var(--radio-borde);
      margin-top: 1rem;
    }

    .message:empty {
      display: none;
    }

    .message[class*="✅"] { /* Si contiene emoji de éxito */
      background-color: #eafaf1;
      color: #2ecc71;
    }

    .message[class*="❌"] { /* Si contiene emoji de error */
      background-color: #fbeae9;
      color: #e74c3c;
    }

    /* --- AÑADIDO: Estilo para campos destacados --- */
    .field-highlight label {
      color: var(--color-natstone-orange); /* Label naranja */
      font-weight: 700; /* Más destacado */
      font-size: 0.9rem;
    }
    
    .field-highlight input[type="text"],
    .field-highlight select {
      border-width: 2px; /* Borde más grueso */
      border-color: var(--color-natstone-orange); /* Borde naranja */
    }

    /* También anular el color de foco */
    .field-highlight input:focus,
    .field-highlight select:focus {
        border-color: var(--color-natstone-orange);
        box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3); /* Sombra naranja */
    }
    /* --- FIN DE ESTILOS AÑADIDOS --- */

    /* --- AÑADIDO: Bloque de Contacto --- */
    .contact-block {
      /* --- MODIFICADO --- */
      /* Ya no necesita margen ni borde superior, será parte del grid */
      /* margin-top: 2rem; */
      /* padding-top: 1.5rem; */
      /* border-top: 1px solid var(--color-borde); */
      /* --- FIN MODIFICACIÓN --- */
    }
    
    .contact-title { /* Es un <h3> pero lo estilizamos */
      font-size: 1.25rem;
      color: var(--color-primario);
      margin-bottom: 1rem;
      font-weight: 600;
    }
    /* --- FIN DE ESTILOS AÑADIDOS --- */

    /* --- Responsivo --- */
    @media (max-width: 1024px) { /* Tablet landscape */
      /* --- ELIMINADO --- */
      /* Ya no es necesario, el default es 2 columnas */
      /* .form-grid-details {
        grid-template-columns: 1fr 1fr; 
      } */
      /* --- FIN ELIMINADO --- */
    }

    @media (max-width: 768px) { /* Tablet portrait / Móvil */
      .form-grid {
        grid-template-columns: 1fr;
      }
      .form-grid-details {
        grid-template-columns: 1fr; /* Pasa a 1 columna */
      }
      .actions {
        flex-direction: column;
      }
      button {
        width: 100%;
      }
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
  "No Aplica", "Residencial", "Edificio Departamentos", "Industrial", "Comercial", "Obras Menores", "Educacional", "Casas", "Deportiva", "Culto"
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


const API_URL = "https://script.google.com/macros/s/AKfycbwFurWMyjoIhRfFQmPIVYLdKl0sfkjUbVJWPM6HLG98Cu3G4wfYhgSmEk_pUTPWHhMXgw/exec"; // <--- ⚠️ ¡RECUERDA REEMPLAZAR ESTA URL CON LA NUEVA!

// --- Interfaces ---
interface ObraDetails { [key: string]: any; }
interface ClientInfo { empresa: string; rut: string; } // <-- AÑADIDO

// --- Componente de Autocompletado (Corregido) ---
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
  // --- CAMPOS DE CONTACTO MODIFICADOS ---
  // 'Nombre Contacto': '', 'Cargo Contacto': '', 'Email Contacto': '', 'Teléfono Contacto': '', 'Contacto Administrador': '', // <-- Eliminados
  'Contacto': '', // <-- Añadido
  // --- FIN DE LA MODIFICACIÓN ---
  'Comentarios Última Visita': '', 'Rut Empresa': '', 'Monto Presupuesto': '', 'Fecha Fin Obra': ''
};


export default function App() {
  // --- Estados ---
  const [selectedRegion, setSelectedRegion] = useState('');
  const [allData, setAllData] = useState<ObraDetails[]>([]);
  const [clientList, setClientList] = useState<ClientInfo[]>([]); // <-- CAMBIADO DE string[]
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
  const [newCompanySuggestions, setNewCompanySuggestions] = useState<ClientInfo[]>([]); // <-- CAMBIADO DE string[]

  // --- Carga Inicial de Clientes ---
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getClientList' }) });
        const data = await response.json();
        if (data.status === 'success') {
          setClientList(data.data); // <-- Esto ahora recibe [{empresa, rut}, ...]
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
    // AHORA FILTRA OBJETOS BASADO EN LA PROPIEDAD 'empresa'
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
    // Maneja formato AAAA-MM-DD del input date
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateString.split('-');
      // new Date(year, monthIndex, day)
      const utcDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      return utcDate.toLocaleDateString('es-CL', { timeZone: 'UTC' });
    }
    const date = new Date(dateString);
    // --- AQUÍ ESTÁ LA CORRECCIÓN ---
    // Se cambió de toLocaleString a toLocaleDateString y se añadió timeZone: 'UTC' para consistencia
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('es-CL', { timeZone: 'UTC' });
    // --- FIN DE LA CORRECCIÓN ---
  };
  
  // Función para formatear la fecha para el input type="date"
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="container">
      <GlobalStyles /> {/* <-- ESTILOS INYECTADOS AQUÍ */}
      <h1>RADAR COMERCIAL</h1>
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
            {/* --- MODIFICADO: Se eliminaron los divs "form-column" --- */}
            <div className="form-grid-details">
              {/* Todos los campos ahora son hijos directos del grid */}
              <div className="form-field">
                <label>Empresa</label>
                  <AutocompleteInput 
                    value={newCompanyInput}
                    onChange={(e) => {
                      setNewCompanyInput(e.target.value);
                      // Borra el RUT si el usuario escribe manually
                      setNewObraData(prev => ({...prev, 'Empresa': e.target.value, 'Rut Empresa': ''}));
                    }}
                    onSuggestionClick={(suggestion) => {
                      // --- LÓGICA DE AUTOCOMPLETADO DE RUT ---
                      const foundClient = clientList.find(c => c.empresa === suggestion);
                      const clientRut = foundClient ? foundClient.rut : '';

                      setNewCompanyInput(suggestion);
                      // Setea AMBOS, Empresa y Rut Empresa
                      setNewObraData(prev => ({...prev, 'Empresa': suggestion, 'Rut Empresa': clientRut }));
                      setNewCompanySuggestions([]);
                      // --- FIN DE LA LÓGICA ---
                    }}
                    // Mapea los objetos a strings para el componente
                    suggestions={newCompanySuggestions.map(c => c.empresa)}
                    placeholder="Busque o ingrese empresa..."
                    disabled={loading}
                  />
              </div>
              <div className="form-field"><label>Rut Empresa</label><input type="text" name="Rut Empresa" value={newObraData['Rut Empresa']} onChange={handleNewObraInputChange} /></div>
              {/* --- CAMPO DESTACADO --- */}
                <div className="form-field field-highlight"><label>Obra / PDV</label><input type="text" name="Obra / PDV" value={newObraData['Obra / PDV']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Vendedor</label><select name="Vendedor" value={newObraData['Vendedor']} onChange={handleNewObraInputChange}><option value="">-- Asignar Vendedor --</option>{vendedorOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                <div className="form-field"><label>Canal</label><select name="Canal" value={newObraData['Canal']} onChange={handleNewObraInputChange}><option value="">-- Elija un canal --</option>{canalOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              
              <div className="form-field"><label>Región</label><input type="text" value={newObraData['Región']} disabled /></div>
              <div className="form-field">
                  <label>Comuna</label>
                  <AutocompleteInput value={comunaInput} onChange={(e) => { setComunaInput(e.target.value); setNewObraData(prev => ({...prev, 'Comuna': e.target.value})); }} onSuggestionClick={(comuna) => { setComunaInput(comuna); setNewObraData(prev => ({...prev, 'Comuna': comuna})); setComunaSuggestions([]); }} suggestions={comunaSuggestions} placeholder="Busque una comuna..." disabled={false} />
                </div>
                <div className="form-field"><label>Dirección</label><input type="text" name="Dirección" value={newObraData['Dirección']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Monto Presupuesto</label><input type="number" name="Monto Presupuesto" value={newObraData['Monto Presupuesto']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Fecha Fin Obra</label><input type="date" name="Fecha Fin Obra" value={newObraData['Fecha Fin Obra']} onChange={handleNewObraInputChange} /></div>
                <div className="form-field"><label>Observaciones de Compra</label><textarea name="Observaciones de Compra" value={newObraData['Observaciones de Compra']} onChange={handleNewObraInputChange} rows={2}></textarea></div>
              
              <div className="form-field"><label>Tipo Construcción</label><select name="Tipo Construcción" value={newObraData['Tipo Construcción']} onChange={handleNewObraInputChange}><option value="">-- Elija un tipo --</option>{tipoConstruccionOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}</select></div>
              {/* --- CAMPO DESTACADO --- */}
                <div className="form-field field-highlight"><label>*ESTADO DE LA OBRA*</label><select name="Estado de Obra" value={newObraData['Estado de Obra']} onChange={handleNewObraInputChange}><option value="">-- Cambiar Estado --</option>{estadoObraOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                <div className="form-field"><label>Les Vendemos?</label><select name="Les Vendemos?" value={newObraData['Les Vendemos?']} onChange={handleNewObraInputChange}><option value="">-- Seleccione --</option>{lesVendemosOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div className="form-field"><label>M²</label><input type="number" name="M²" value={newObraData['M²']} onChange={handleNewObraInputChange} /></div>
              <div className="form-field"><label>Descripción de la obra o PDV</label><textarea name="Descripción de la obra o PDV" value={newObraData['Descripción de la obra o PDV']} onChange={handleNewObraInputChange} rows={2}></textarea></div>
              
              {/* --- BLOQUE DE CONTACTO MODIFICADO (ahora parte del grid) --- */}
              <div className="form-field">
                <label>Contacto</label>
                <textarea 
                  name="Contacto" 
                  value={newObraData['Contacto']} 
                  onChange={handleNewObraInputChange} 
                  rows={4} // Un poco más de espacio
                  placeholder="Ingrese información de contacto (nombre, email, teléfono, cargo, etc.)"
                />
              </div>
              {/* --- FIN DEL BLOQUE MODIFICADO --- */}

              {/* --- Comentarios ahora es parte del grid --- */}
              {/* --- CORRECCIÓN DE ERROR DE TIPEADO --- */}
              <div className="form-field">
              {/* --- FIN DE LA CORRECCIÓN --- */}
                <label>Comentarios Iniciales (Opcional)</label>
                <textarea name="Comentarios Última Visita" value={newObraData['Comentarios Última Visita']} onChange={handleNewObraInputChange} rows={3}></textarea>
              </div>

            </div> {/* Fin de form-grid-details */}
            
            {/* <div className="form-field full-width" style={{ marginTop: '1.5rem' }}> ... </div> */} {/* Esto se movió arriba */}
            
            <div className="actions">
              <button onClick={() => setIsCreateMode(false)} className="secondary-button">Cancelar</button>
              <button onClick={handleCreateObra} disabled={loading}>{loading ? 'Guardando...' : 'Guardar Nuevo PdV'}</button>
            </div>
          </div>
        )}
      </div>

      {loading && !selectedRegion && !isCreateMode && <div className="loader"></div>}
      {loading && selectedRegion && !isCreateMode && <div className="loader">Cargando datos de la región...</div>}

      {obraDetails && !loading && !isCreateMode && (
        <div className="card details">
          <h2>Detalles de la Obra</h2>
          {/* --- MODIFICADO: Se eliminaron los divs "form-column" --- */}
          <div className="form-grid-details">
            {/* Todos los campos ahora son hijos directos del grid */}
            <div className="form-field"><label>Empresa</label><input type="text" value={obraDetails['Empresa'] || ''} disabled /></div>
            {/* --- CAMPO DESTACADO --- */}
              <div className="form-field field-highlight"><label>Obra / PDV</label><input type="text" name="Obra / PDV" value={obraDetails['Obra / PDV'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Vendedor</label><input type="text" value={obraDetails['Vendedor'] || ''} disabled /></div>
              <div className="form-field"><label>Canal</label><input type="text" value={obraDetails['Canal'] || ''} disabled /></div>
              <div className="form-field"><label>Región</label><input type="text" value={obraDetails['Región'] || ''} disabled /></div>
              <div className="form-field"><label>Comuna</label><input type="text" value={obraDetails['Comuna'] || ''} disabled /></div>
              <div className="form-field"><label>*DIRECCIÓN*</label><input type="text" name="Dirección" value={obraDetails['Dirección'] || ''} onChange={handleInputChange} /></div>
            
            <div className="form-field"><label>Tipo Construcción</label><select name="Tipo Construcción" value={obraDetails['Tipo Construcción'] || ''} onChange={handleInputChange}><option value="">-- Elija un tipo --</option>{tipoConstruccionOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}</select></div>
            {/* --- CAMPO DESTACADO --- */}
              <div className="form-field field-highlight"><label>Estado de Obra</label><select name="Estado de Obra" value={obraDetails['Estado de Obra'] || ''} onChange={handleInputChange}><option value="">-- Cambiar Estado --</option>{estadoObraOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
              <div className="form-field"><label>Les Vendemos?</label><select name="Les Vendemos?" value={obraDetails['Les Vendemos?']} onChange={handleInputChange}><option value="">-- Seleccione --</option>{lesVendemosOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div className="form-field"><label>Observaciones de Compra</label><textarea name="Observaciones de Compra" value={obraDetails['Observaciones de Compra'] || ''} onChange={handleInputChange} rows={2}></textarea></div>
              <div className="form-field"><label>Monto Presupuesto</label><input type="number" name="Monto Presupuesto" value={obraDetails['Monto Presupuesto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Fecha Fin Obra</label><input type="date" name="Fecha Fin Obra" value={formatDateForInput(obraDetails['Fecha Fin Obra'])} onChange={handleInputChange} /></div>
            
            <div className="form-field"><label>Descripción de la obra o PDV</label><textarea name="Descripción de la obra o PDV" value={obraDetails['Descripción de la obra o PDV'] || ''} onChange={handleInputChange} rows={2}></textarea></div>
            <div className="form-field"><label>M²</label><input type="number" name="M²" value={obraDetails['M²'] || ''} onChange={handleInputChange} /></div>
           
            {/* --- BLOQUE DE CONTACTO MODIFICADO (ahora parte del grid) --- */}
            <div className="form-field">
              <label>Contacto</label>
              <textarea 
                name="Contacto" 
                value={obraDetails['Contacto'] || ''} 
                onChange={handleInputChange} 
                rows={4} // Un poco más de espacio
              />
            </div>
            {/* --- FIN DEL BLOQUE MODIFICADO --- */}

            {/* --- Campos del final ahora son parte del grid --- */}
            <div className="form-field"><label>Acciones Última Reunion</label><textarea value={obraDetails['Acciones Última Reunion'] || ''} rows={2} disabled></textarea></div>
            <div className="form-field"><label>Comentarios Última Visita</label><textarea name="Comentarios Última Visita" value={obraDetails['Comentarios Última Visita'] || ''} onChange={handleInputChange} rows={4}></textarea></div>
            <div className="form-field"><label>Rut Empresa</label><textarea name="Rut Empresa" value={obraDetails['Rut Empresa'] || ''} onChange={handleInputChange} rows={1}></textarea></div>
            <div className="form-field"><label>Última Actualización</label><input type="text" value={formatDate(obraDetails['Última Actualización'])} disabled /></div>
          
          </div> {/* Fin de form-grid-details */}

          {/* <div className="contact-block"> ... </div> */} {/* Eliminado de aquí */}
          {/* <div className="form-column" ...> ... </div> */} {/* Eliminado de aquí */}

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
