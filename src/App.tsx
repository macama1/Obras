import React, { useState, useEffect } from 'react';
import { canalOptions, estadoObraOptions, regionesYComunas, lesVendemosOptions } from './database';
import './App.css';

const API_URL = "https://script.google.com/macros/s/AKfycbwFurWMyjoIhRfFQmPIVYLdKl0sfkjUbVJWPM6HLG98Cu3G4wfYhgSmEk_pUTPWHhMXgw/exec";

// --- Interfaces ---
interface Obra {
  id: string;
  obra: string;
  empresa: string;
}
interface ObraDetails { [key: string]: any; }

// --- Componente de Autocompletado ---
const AutocompleteInput = ({ value, onChange, onSuggestionClick, suggestions, placeholder, disabled }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onSuggestionClick: (suggestion: string) => void; suggestions: string[]; placeholder: string; disabled: boolean; }) => (
  <div className="autocomplete-container">
    <input type="text" value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} autoComplete="off" />
    {suggestions.length > 0 && (
      <ul className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <li key={index} onClick={() => onSuggestionClick(suggestion)}>
            {suggestion}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default function App() {
  // --- Estados ---
  const [allData, setAllData] = useState<ObraDetails[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [obras, setObras] = useState<ObraDetails[]>([]);
  const [selectedObraId, setSelectedObraId] = useState('');
  const [obraDetails, setObraDetails] = useState<ObraDetails | null>(null);
  const [initialObraDetails, setInitialObraDetails] = useState<ObraDetails | null>(null);
  const [comunaInput, setComunaInput] = useState('');
  const [comunaSuggestions, setComunaSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newObraData, setNewObraData] = useState({ empresa: '', obra: '' });

  // --- Carga Inicial de Datos ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getInitialData' }) });
        const data = await response.json();
        if (data.status === 'success') {
          setAllData(data.data);
        }
      } catch (error) {
        setMessage('❌ No se pudieron cargar los datos iniciales.');
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // --- Búsqueda de Empresas (Local) ---
  useEffect(() => {
    if (companyInput.length < 2) {
      setCompanySuggestions([]);
      return;
    }
    const uniqueCompanies = [...new Set(allData.map(item => item.empresa))];
    const filtered = uniqueCompanies.filter(c => c.toLowerCase().includes(companyInput.toLowerCase()));
    setCompanySuggestions(filtered.slice(0, 10));
  }, [companyInput, allData]);

  // --- Búsqueda de Comunas (Local) ---
  useEffect(() => {
    if (comunaInput.length < 2) {
      setComunaSuggestions([]);
      return;
    }
    const allComunas = regionesYComunas.flatMap(r => r.comunas);
    const filtered = allComunas.filter(c => c.toLowerCase().includes(comunaInput.toLowerCase()));
    setComunaSuggestions(filtered.slice(0, 10));
  }, [comunaInput]);

  // --- Filtrar Obras por Empresa (Local) ---
  useEffect(() => {
    if (!selectedCompany) {
      setObras([]);
      setSelectedObraId('');
      return;
    }
    const filteredObras = allData.filter(item => item.empresa === selectedCompany);
    setObras(filteredObras);
  }, [selectedCompany, allData]);

  // --- Obtener Detalles de Obra (Local) ---
  useEffect(() => {
    if (!selectedObraId) {
      setObraDetails(null);
      setInitialObraDetails(null);
      return;
    }
    const details = allData.find(item => item.ID === selectedObraId);
    if (details) {
      setObraDetails(details);
      setInitialObraDetails(details);
      setComunaInput(details['Comuna'] || '');
    }
  }, [selectedObraId, allData]);

  // --- Manejadores de Eventos ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setObraDetails(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleAction = async (updates: ObraDetails | {} = {}) => {
    if (!selectedObraId) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'editObra', id: selectedObraId, updates }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMessage(Object.keys(updates).length > 0 ? '✅ Cambios guardados con éxito.' : '✅ Visita registrada con éxito.');
        // Recargar los datos para ver los cambios reflejados
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getInitialData' }) });
        const newData = await res.json();
        if(newData.status === 'success') setAllData(newData.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`❌ Error: ${error.message}`);
      } else {
        setMessage(`❌ Ocurrió un error desconocido.`);
      }
    }
    setLoading(false);
  };

  const handleSaveChanges = () => {
    if (!obraDetails || !initialObraDetails) return;
    const updates: ObraDetails = {};
    for (const key in obraDetails) {
      if (obraDetails[key] !== initialObraDetails[key]) {
        updates[key] = obraDetails[key];
      }
    }
    handleAction(updates);
  };
  
  const handleCreateObra = async () => {
    if (!newObraData.empresa || !newObraData.obra) {
      setMessage('❌ Por favor, complete los campos de Empresa y Obra.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'createNewObra', data: newObraData }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        setMessage('✅ Nueva obra creada con éxito.');
        setAllData(prevData => [...prevData, result.data]);
        setIsCreateMode(false);
        setNewObraData({ empresa: '', obra: '' });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`❌ Error al crear la obra: ${error.message}`);
      } else {
        setMessage(`❌ Ocurrió un error desconocido.`);
      }
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleString('es-CL');
  };

  return (
    <div className="container">
      <h1>Registro de Visita de Obra</h1>
      
      <div className="card">
        {!isCreateMode ? (
          <>
            <div className="form-grid">
              <div className="form-field">
                <label>1. Empresa</label>
                <AutocompleteInput
                  value={companyInput}
                  onChange={(e) => { setCompanyInput(e.target.value); setSelectedCompany(''); }}
                  onSuggestionClick={(company) => {
                    setCompanyInput(company);
                    setSelectedCompany(company);
                    setCompanySuggestions([]);
                  }}
                  suggestions={companySuggestions}
                  placeholder="Busque una empresa..."
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <label>2. Obra</label>
                <select value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)} disabled={loading || !selectedCompany}>
                  <option value="">-- Seleccione una obra --</option>
                  {obras.map(obra => <option key={obra.ID} value={obra.ID}>{obra.ID} - {obra.Obra}</option>)}
                </select>
              </div>
            </div>
            <div className="actions" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: '1rem' }}>
              <button onClick={() => setIsCreateMode(true)} className="secondary-button">
                Crear Nueva Obra
              </button>
            </div>
          </>
        ) : (
          <div>
            <h2>Crear Nueva Obra</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Nombre de la Empresa</label>
                <input
                  type="text"
                  placeholder="Ej: Constructora XYZ"
                  value={newObraData.empresa}
                  onChange={(e) => setNewObraData({ ...newObraData, empresa: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Nombre de la Obra</label>
                <input
                  type="text"
                  placeholder="Ej: Edificio Central"
                  value={newObraData.obra}
                  onChange={(e) => setNewObraData({ ...newObraData, obra: e.target.value })}
                />
              </div>
            </div>
            <div className="actions">
              <button onClick={() => setIsCreateMode(false)} className="secondary-button">
                Cancelar
              </button>
              <button onClick={handleCreateObra} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Nueva Obra'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && !isCreateMode && <div className="loader">Cargando...</div>}

      {obraDetails && !loading && (
        <div className="card details">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dee2e6', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Detalles de la Obra</h2>
            <button onClick={() => handleAction()} disabled={loading} className="secondary-button">
              Registrar Visita (Sin Cambios)
            </button>
          </div>

          <div className="form-grid-details">
            {/* Columna 1 */}
            <div className="form-column">
              <div className="form-field"><label>Vendedor</label><input type="text" name="Vendedor" value={obraDetails['Vendedor'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Canal</label><select name="Canal" value={obraDetails['Canal'] || ''} onChange={handleInputChange}><option value="">-- Elija un canal --</option>{canalOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-field"><label>Tipo Construcción</label><input type="text" name="Tipo Construcción" value={obraDetails['Tipo Construcción'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Región</label><select name="Región" value={obraDetails['Región'] || ''} onChange={handleInputChange}><option value="">-- Elija una región --</option>{regionesYComunas.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}</select></div>
              <div className="form-field">
                <label>Comuna</label>
                <AutocompleteInput
                  value={comunaInput}
                  onChange={(e) => {
                    setComunaInput(e.target.value);
                    handleInputChange(e);
                  }}
                  onSuggestionClick={(comuna) => {
                    setComunaInput(comuna);
                    setObraDetails(prev => ({...prev, 'Comuna': comuna}));
                    setComunaSuggestions([]);
                  }}
                  suggestions={comunaSuggestions}
                  placeholder="Busque una comuna..."
                  disabled={loading}
                />
              </div>
              <div className="form-field"><label>Dirección</label><input type="text" name="Dirección" value={obraDetails['Dirección'] || ''} onChange={handleInputChange} /></div>
            </div>
            {/* Columna 2 */}
            <div className="form-column">
              <div className="form-field"><label>Estado de Obra</label><select name="Estado de Obra" value={obraDetails['Estado de Obra'] || ''} onChange={handleInputChange}><option value="">-- Cambiar Estado --</option>{estadoObraOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
              <div className="form-field"><label>¿Les Vendemos?</label><select name="¿Les Vendemos?" value={obraDetails['¿Les Vendemos?'] || ''} onChange={handleInputChange}><option value="">-- Seleccione --</option>{lesVendemosOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div className="form-field"><label>Observaciones de Compra</label><textarea name="Observaciones de Compra" value={obraDetails['Observaciones de Compra'] || ''} onChange={handleInputChange} rows={2}></textarea></div>
              <div className="form-field"><label>M²</label><input type="text" name="M²" value={obraDetails['M²'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Nombre Contacto</label><input type="text" name="Nombre Contacto" value={obraDetails['Nombre Contacto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Cargo Contacto</label><input type="text" name="Cargo Contacto" value={obraDetails['Cargo Contacto'] || ''} onChange={handleInputChange} /></div>
            </div>
            {/* Columna 3 */}
            <div className="form-column">
              <div className="form-field"><label>Email Contacto</label><input type="email" name="Email Contacto" value={obraDetails['Email Contacto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Teléfono Contacto</label><input type="tel" name="Teléfono Contacto" value={obraDetails['Teléfono Contacto'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Contacto Administrador</label><input type="text" name="Contacto Administrador" value={obraDetails['Contacto Administrador'] || ''} onChange={handleInputChange} /></div>
              <div className="form-field"><label>Fecha Última Visita</label><input type="text" value={formatDate(obraDetails['Fecha Última Visita'])} disabled /></div>
              <div className="form-field full-width"><label>Comentarios Última Visita</label><textarea name="Comentarios Última Visita" value={obraDetails['Comentarios Última Visita'] || ''} onChange={handleInputChange} rows={4}></textarea></div>
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
