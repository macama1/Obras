// Listas fijas del radar: canales, vendedores, estados, tipos y regiones/comunas de Chile.
export const canalOptions = [
  'Constructora Pequeña', 'Constructora Mediana', 'Constructora Grande', 'Ferretería', 'Distribuidor', 'Especialista', 'Distribuidor Grandes Supericies', 'Instalador', 'Particular', 'Industrial',
];
export const vendedorOptions = [
  "Andres Pacheco", "Cristian Maldonado", "Eduardo Arias", "Jorge Nario", "Lissett Santana", "Manuel Urzúa", "Mauricio Carvajal", "Mónica Valencia", "Vendedor General CA", "Vendedor General Peg&Mort (RH)"
];
export const estadoObraOptions = [
  'No Aplica', 'Sin Información', 'No Iniciada', 'Obras Preliminares', 'Fundaciones', 'Obra Gruesa', 'Terminaciones', 'Terminada', 'Detenida',
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
    { region: 'Metropolitana de Santiago', comunas: ['Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Santiago', 'Vitacura', 'Padre Hurtado', 'Peñaflor', 'Talagante', 'El Monte', 'Isla de Maipo', 'Colina', 'Lampa', 'Tiltil', 'San José de Maipo', 'Pirque', 'Puente Alto', 'San Bernardo', 'Buin', 'Calera de Tango', 'Paine', 'Melipilla', 'Curacaví', 'Alhué', 'María Pinto', 'San Pedro']},
    { region: "Libertador General Bernardo O'Higgins", comunas: ['Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras', 'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Vicente', 'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue', 'Navidad', 'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua', 'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz']},
    { region: 'Maule', comunas: ['Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue', 'Río Claro', 'San Clemente', 'San Rafael', 'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó', 'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno', 'Vichuquén', 'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier', 'Villa Alegre', 'Yerbas Buenas']},
    { region: 'Ñuble', comunas: ['Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Quirihue', 'Ránquil', 'Treguaco', 'Bulnes', 'Chillán Viejo', 'Chillán', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón', 'San Ignacio', 'Yungay', 'Coihueco', 'Ñiquén', 'San Carlos', 'San Fabián', 'San Nicolás']},
    { region: 'Biobío', comunas: ['Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco', 'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco', 'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa', 'Los Ángeles', 'Antuco', 'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío']},
    { region: 'La Araucanía', comunas: ['Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Loncoche', 'Melipeuco', 'Nueva Imperial', 'Padre las Casas', 'Perquenco', 'Pitrufquén', 'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Cholchol', 'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco', 'Purén', 'Renaico', 'Traiguén', 'Victoria', 'Lautaro']},
    { region: 'Los Ríos', comunas: ['Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli', 'La Unión', 'Futrono', 'Lago Ranco', 'Río Bueno']},
    { region: 'Los Lagos', comunas: ['Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue', 'Maullín', 'Puerto Varas', 'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Osorno', 'Puerto Octay', 'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén', 'Futaleufú', 'Hualaihué', 'Palena']},
    // FIX: el Sheet guarda esta región como "Aysén"; con el nombre largo la búsqueda
    // por región volvía vacía y sus obras no aparecían en la app.
    { region: 'Aysén', comunas: ['Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins", 'Tortel', 'Chile Chico', 'Río Ibáñez']},
    { region: 'Magallanes y de la Antártica Chilena', comunas: ['Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos (Ex Navarino)', 'Antártica', 'Porvenir', 'Primavera', 'Timaukel', 'Natales', 'Torres del Paine']},
];

export const normalizar = (t: unknown) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// Comuna -> región, para que el vendedor solo elija la comuna.
export const todasLasComunas = regionesYComunas.flatMap(r => r.comunas.map(c => ({ comuna: c, region: r.region })));
export const regionDeComuna = (comuna: string) =>
  todasLasComunas.find(c => normalizar(c.comuna) === normalizar(comuna))?.region || '';

// Etapas de una obra en orden: es la barra de avance que se toca para cambiar el estado.
export const etapasObra = ['No Iniciada', 'Obras Preliminares', 'Fundaciones', 'Obra Gruesa', 'Terminaciones', 'Terminada'];
export const etapasCortas: Record<string, string> = {
  'No Iniciada': 'No iniciada', 'Obras Preliminares': 'Preliminares', 'Fundaciones': 'Fundaciones',
  'Obra Gruesa': 'Obra gruesa', 'Terminaciones': 'Terminaciones', 'Terminada': 'Terminada',
};
// Estados fuera de la secuencia.
export const estadosEspeciales = ['Detenida', 'Sin Información', 'No Aplica'];

// Canales que son obras (tienen etapas). Los demás son puntos de venta: ferreterías, distribuidores, etc.
export const esCanalDeObra = (canal: string) => /constructora|contratista/.test(normalizar(canal));
