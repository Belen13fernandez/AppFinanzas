// Constantes y variables globales
let CATEGORIAS = [
    { id: 'playstation', nombre: 'PlayStation', tipo: 'ingreso' },
    { id: 'diseno', nombre: 'Diseño Gráfico', tipo: 'ingreso' },
    { id: 'programacion', nombre: 'Programación web', tipo: 'ingreso' },
    { id: 'kiosko', nombre: 'Kiosko', tipo: 'ingreso' },
    { id: 'informatica', nombre: 'Informática', tipo: 'ingreso' },
    { id: 'otros-ingreso', nombre: 'Otros', tipo: 'ingreso' },
    { id: 'playstation-egreso', nombre: 'PlayStation', tipo: 'egreso' },
    { id: 'diseno-egreso', nombre: 'Diseño Gráfico', tipo: 'egreso' },
    { id: 'programacion-egreso', nombre: 'Programación web', tipo: 'egreso' },
    { id: 'kiosko-egreso', nombre: 'Kiosko', tipo: 'egreso' },
    { id: 'informatica-egreso', nombre: 'Informática', tipo: 'egreso' },
    { id: 'impuestos', nombre: 'Impuestos', tipo: 'egreso' },
    { id: 'otros-egreso', nombre: 'Otros', tipo: 'egreso' }
];

let movimientos = [];
let editarModal = null;
let graficoComparacion = null;
let graficoCategorias = null;
let graficoEvolucion = null;

// Funciones de utilidad
function obtenerFechaActual() {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(valor);
}

function formatearFecha(fecha) {
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-AR', opciones);
}

function validarFecha(fecha) {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? new Date() : date;
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const alertasContainer = document.getElementById('alertas-container');
    if (!alertasContainer) return;
    
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} position-fixed top-0 start-50 translate-middle-x mt-3`;
    alerta.style.zIndex = '1060';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertasContainer.appendChild(alerta);
    
    // Auto-eliminar la alerta después de 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Inicialización de la aplicación
function inicializarApp() {
    try {
        // Configurar modal de edición
        const modalElement = document.getElementById('editarModal');
        if (modalElement) {
            editarModal = new bootstrap.Modal(modalElement);
        }
        
        // Configurar pestañas
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                cambiarPestana(this);
            });
        });
        
        // Cargar datos y configurar formularios
        cargarDatos();
        configurarFormularios();
        inicializarFiltros();
        
        // Establecer fecha actual en el formulario
        const fechaInput = document.getElementById('fecha-movimiento');
        if (fechaInput) {
            fechaInput.value = obtenerFechaActual();
        }
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        mostrarAlerta('Error al cargar la aplicación. Por favor recarga la página.', 'danger');
    }
}

function cambiarPestana(tab) {
    const tabId = tab.getAttribute('data-tab');
    
    // Actualizar pestañas activas
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    tab.classList.add('active');
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Actualizar reportes si es necesario
    if (tabId === 'reportes') {
        actualizarReportes();
    }
    
    // Actualizar categorías si es necesario
    if (tabId === 'categorias') {
        mostrarCategorias();
    }
}

function configurarFormularios() {
    // Formulario de registro
    const formMovimiento = document.getElementById('form-movimiento');
    if (formMovimiento) {
        formMovimiento.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarMovimiento();
        });
    }
    
    // Formulario de edición
    const guardarBtn = document.getElementById('guardar-cambios-btn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarCambios);
    }
    
    const eliminarBtn = document.getElementById('eliminar-btn');
    if (eliminarBtn) {
        eliminarBtn.addEventListener('click', eliminarMovimiento);
    }
    
    // Radio buttons para cambiar categorías
    document.querySelectorAll('[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', cargarCategorias);
    });
    
    document.querySelectorAll('[name="editar-tipo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            cargarCategoriasEdicion(this.value);
        });
    });
    
    // Formulario de categorías
    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) {
        formCategoria.addEventListener('submit', function(e) {
            e.preventDefault();
            agregarCategoria();
        });
    }
    
    // Filtro de categorías
    const filtroTipoCategoria = document.getElementById('filtro-tipo-categoria');
    if (filtroTipoCategoria) {
        filtroTipoCategoria.addEventListener('change', mostrarCategorias);
    }
    
    // Cargar categorías iniciales
    cargarCategorias();
}

function cargarDatos() {
    try {
        const datosGuardados = localStorage.getItem('finanzas_data');
        const categoriasGuardadas = localStorage.getItem('finanzas_categorias');
        
        // Cargar categorías personalizadas
        if (categoriasGuardadas) {
            CATEGORIAS = JSON.parse(categoriasGuardadas);
        } else {
            guardarCategorias();
        }
        
        if (datosGuardados) {
            movimientos = JSON.parse(datosGuardados).map(m => ({
                ...m,
                fecha: validarFecha(m.fecha)
            }));
        } else {
            // Datos de ejemplo
            const hoy = new Date();
            movimientos = [
                {
                    id: Date.now(),
                    fecha: hoy,
                    tipo: 'ingreso',
                    categoria: 'playstation',
                    descripcion: 'Alquiler PS4',
                    monto: 5000
                },
                {
                    id: Date.now() + 1,
                    fecha: hoy,
                    tipo: 'egreso',
                    categoria: 'impuestos',
                    descripcion: 'Pago de impuestos',
                    monto: 3500
                }
            ];
            guardarDatos();
        }
        
        actualizarUI();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarAlerta('Error al cargar los datos. Se reiniciará con datos de ejemplo.', 'warning');
        movimientos = [];
        guardarDatos();
    }
}

function guardarDatos() {
    try {
        localStorage.setItem('finanzas_data', JSON.stringify(movimientos));
    } catch (error) {
        console.error('Error al guardar datos:', error);
        mostrarAlerta('No se pudieron guardar los datos. El almacenamiento local puede estar lleno.', 'danger');
    }
}

function guardarCategorias() {
    try {
        localStorage.setItem('finanzas_categorias', JSON.stringify(CATEGORIAS));
    } catch (error) {
        console.error('Error al guardar categorías:', error);
        mostrarAlerta('No se pudieron guardar las categorías.', 'danger');
    }
}

// Funciones para categorías
function cargarCategorias() {
    const tipoRadio = document.querySelector('[name="tipo"]:checked');
    if (!tipoRadio) return;
    
    const tipo = tipoRadio.value;
    const categoriasFiltradas = CATEGORIAS.filter(c => c.tipo === tipo);
    
    const select = document.getElementById('categoria-movimiento');
    if (!select) return;
    
    select.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        select.appendChild(option);
    });
}

function cargarCategoriasEdicion(tipo, categoriaSeleccionada = '') {
    const categoriasFiltradas = CATEGORIAS.filter(c => c.tipo === tipo);
    
    const select = document.getElementById('editar-categoria');
    if (!select) return;
    
    select.innerHTML = '<option value="" disabled>Seleccionar...</option>';
    
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        if (categoria.id === categoriaSeleccionada) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// Funciones para filtros
function inicializarFiltros() {
    inicializarFiltroAnios();
    inicializarFiltroMeses();
    inicializarFiltroCategorias();
    
    // Event listeners para los filtros
    const filtroPeriodo = document.getElementById('filtro-periodo');
    if (filtroPeriodo) {
        filtroPeriodo.addEventListener('change', actualizarReportes);
    }
    
    const filtroAnio = document.getElementById('filtro-anio');
    if (filtroAnio) {
        filtroAnio.addEventListener('change', actualizarReportes);
    }
    
    const filtroMes = document.getElementById('filtro-mes');
    if (filtroMes) {
        filtroMes.addEventListener('change', actualizarReportes);
    }
    
    const filtroTipo = document.getElementById('filtro-tipo');
    if (filtroTipo) {
        filtroTipo.addEventListener('change', actualizarReportes);
    }
    
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', actualizarReportes);
    }
    
    // Event listeners para exportación/importación
    const exportarBtn = document.getElementById('exportar-btn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', exportarAExcel);
    }
    
    const exportarJsonBtn = document.getElementById('exportar-json-btn');
    if (exportarJsonBtn) {
        exportarJsonBtn.addEventListener('click', exportarAJSON);
    }
    
    const importarBtn = document.getElementById('importar-btn');
    if (importarBtn) {
        importarBtn.addEventListener('click', () => {
            const importarInput = document.getElementById('importar-input');
            if (importarInput) {
                importarInput.click();
            }
        });
    }
    
    const importarInput = document.getElementById('importar-input');
    if (importarInput) {
        importarInput.addEventListener('change', importarDatos);
    }
    
    // Inicializar búsqueda avanzada
    inicializarBusquedaAvanzada();
}

function inicializarFiltroAnios() {
    const select = document.getElementById('filtro-anio');
    if (!select) return;
    
    select.innerHTML = '<option value="todos" selected>Todos los años</option>';
    
    const añosUnicos = [...new Set(movimientos.map(m => new Date(m.fecha).getFullYear()))].sort((a, b) => b - a);
    
    añosUnicos.forEach(año => {
        const option = document.createElement('option');
        option.value = año;
        option.textContent = año;
        select.appendChild(option);
    });
}

function inicializarFiltroMeses() {
    const select = document.getElementById('filtro-mes');
    if (!select) return;
    
    select.innerHTML = '<option value="todos" selected>Todos los meses</option>';
    
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = mes;
        select.appendChild(option);
    });
}

function inicializarFiltroCategorias() {
    const select = document.getElementById('filtro-categoria');
    if (!select) return;
    
    select.innerHTML = '<option value="todas" selected>Todas las categorías</option>';
    
    const categoriasUnicas = {};
    CATEGORIAS.forEach(cat => {
        if (!categoriasUnicas[cat.nombre]) {
            categoriasUnicas[cat.nombre] = cat;
        }
    });
    
    Object.values(categoriasUnicas)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.nombre;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
}

function inicializarBusquedaAvanzada() {
    // Cargar categorías en el filtro de búsqueda
    cargarCategoriasBusqueda();
    
    // Event listeners para búsqueda
    const ejecutarBtn = document.getElementById('ejecutar-busqueda');
    if (ejecutarBtn) {
        ejecutarBtn.addEventListener('click', ejecutarBusquedaAvanzada);
    }
    
    const limpiarBtn = document.getElementById('limpiar-busqueda');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarBusquedaAvanzada);
    }
    
    // Permitir buscar con Enter
    const camposBusqueda = [
        'buscar-descripcion', 'buscar-monto-min', 'buscar-monto-max',
        'buscar-fecha-desde', 'buscar-fecha-hasta'
    ];
    
    camposBusqueda.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    ejecutarBusquedaAvanzada();
                }
            });
        }
    });
}

function cargarCategoriasBusqueda() {
    const selectCategoria = document.getElementById('buscar-categoria');
    if (!selectCategoria) return;
    
    selectCategoria.innerHTML = '<option value="todas">Todas las categorías</option>';
    
    const categoriasUnicas = {};
    CATEGORIAS.forEach(cat => {
        if (!categoriasUnicas[cat.nombre]) {
            categoriasUnicas[cat.nombre] = cat;
        }
    });
    
    Object.values(categoriasUnicas)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.nombre;
            option.textContent = cat.nombre;
            selectCategoria.appendChild(option);
        });
}

function ejecutarBusquedaAvanzada() {
    const descripcion = document.getElementById('buscar-descripcion')?.value.toLowerCase() || '';
    const montoMin = parseFloat(document.getElementById('buscar-monto-min')?.value) || 0;
    const montoMax = parseFloat(document.getElementById('buscar-monto-max')?.value) || Infinity;
    const fechaDesde = document.getElementById('buscar-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('buscar-fecha-hasta')?.value || '';
    const tipo = document.getElementById('buscar-tipo')?.value || 'todos';
    const categoria = document.getElementById('buscar-categoria')?.value || 'todas';
    
    // Filtrar movimientos
    let resultados = movimientos.filter(mov => {
        // Filtro por descripción
        if (descripcion && !mov.descripcion.toLowerCase().includes(descripcion)) {
            return false;
        }
        
        // Filtro por monto
        if (mov.monto < montoMin || mov.monto > montoMax) {
            return false;
        }
        
        // Filtro por fecha desde
        if (fechaDesde && new Date(mov.fecha) < new Date(fechaDesde)) {
            return false;
        }
        
        // Filtro por fecha hasta
        if (fechaHasta && new Date(mov.fecha) > new Date(fechaHasta)) {
            return false;
        }
        
        // Filtro por tipo
        if (tipo !== 'todos' && mov.tipo !== tipo) {
            return false;
        }
        
        // Filtro por categoría
        if (categoria !== 'todas') {
            const categoriaMovimiento = CATEGORIAS.find(c => c.id === mov.categoria);
            if (!categoriaMovimiento || categoriaMovimiento.nombre !== categoria) {
                return false;
            }
        }
        
        return true;
    });
    
    // Mostrar resultados
    mostrarResultadosBusqueda(resultados);
}

function mostrarResultadosBusqueda(resultados) {
    const contenedorResultados = document.getElementById('resultados-busqueda');
    const contadorResultados = document.getElementById('contador-resultados');
    const listaResultados = document.getElementById('lista-resultados');
    
    if (!contenedorResultados || !contadorResultados || !listaResultados) return;
    
    // Mostrar el contenedor
    contenedorResultados.style.display = 'block';
    
    // Actualizar contador
    contadorResultados.textContent = `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''}`;
    
    // Limpiar lista anterior
    listaResultados.innerHTML = '';
    
    if (resultados.length === 0) {
        listaResultados.innerHTML = '<div class="text-center text-muted p-3">No se encontraron movimientos que coincidan con los criterios.</div>';
        return;
    }
    
    // Mostrar resultados
    resultados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    resultados.forEach(movimiento => {
        const categoria = CATEGORIAS.find(c => c.id === movimiento.categoria);
        const categoriaNombre = categoria ? categoria.nombre : 'Sin categoría';
        
        const item = document.createElement('div');
        item.className = `list-group-item ${movimiento.tipo}`;
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="d-flex align-items-center mb-1">
                        <span class="categoria-chip ${movimiento.tipo}-chip">${categoriaNombre}</span>
                        <small class="text-muted">${formatearFecha(movimiento.fecha)}</small>
                    </div>
                    <div class="fw-bold">${movimiento.descripcion || 'Sin descripción'}</div>
                </div>
                <div class="text-end">
                    <div class="h6 mb-0 text-${movimiento.tipo === 'ingreso' ? 'success' : 'danger'}-feminine">
                        ${movimiento.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(movimiento.monto)}
                    </div>
                    <button class="btn btn-sm editar-btn" onclick="abrirEdicion('${movimiento.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
        listaResultados.appendChild(item);
    });
}

function limpiarBusquedaAvanzada() {
    // Limpiar todos los campos
    document.getElementById('buscar-descripcion').value = '';
    document.getElementById('buscar-monto-min').value = '';
    document.getElementById('buscar-monto-max').value = '';
    document.getElementById('buscar-fecha-desde').value = '';
    document.getElementById('buscar-fecha-hasta').value = '';
    document.getElementById('buscar-tipo').value = 'todos';
    document.getElementById('buscar-categoria').value = 'todas';
    
    // Ocultar resultados
    const contenedorResultados = document.getElementById('resultados-busqueda');
    if (contenedorResultados) {
        contenedorResultados.style.display = 'none';
    }
}

// Funciones de movimientos
function guardarMovimiento() {
    try {
        const form = document.getElementById('form-movimiento');
        const formData = new FormData(form);
        
        const nuevoMovimiento = {
            id: Date.now().toString(),
            fecha: new Date(formData.get('fecha')),
            tipo: formData.get('tipo'),
            categoria: formData.get('categoria'),
            descripcion: formData.get('descripcion') || '',
            monto: parseFloat(formData.get('monto'))
        };
        
        // Validaciones
        if (!nuevoMovimiento.categoria) {
            mostrarAlerta('Por favor selecciona una categoría', 'warning');
            return;
        }
        
        if (!nuevoMovimiento.monto || nuevoMovimiento.monto <= 0) {
            mostrarAlerta('Por favor ingresa un monto válido', 'warning');
            return;
        }
        
        movimientos.push(nuevoMovimiento);
        guardarDatos();
        actualizarUI();
        
        // Limpiar formulario
        form.reset();
        document.getElementById('fecha-movimiento').value = obtenerFechaActual();
        cargarCategorias();
        
        mostrarAlerta('Movimiento guardado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al guardar movimiento:', error);
        mostrarAlerta('Error al guardar el movimiento', 'danger');
    }
}

function abrirEdicion(id) {
    const movimiento = movimientos.find(m => m.id.toString() === id.toString());
    if (!movimiento) return;
    
    // Llenar formulario de edición
    document.getElementById('editar-id').value = movimiento.id;
    
    // Seleccionar tipo
    document.getElementById(`editar-${movimiento.tipo}-radio`).checked = true;
    
    // Cargar categorías para el tipo seleccionado
    cargarCategoriasEdicion(movimiento.tipo, movimiento.categoria);
    
    document.getElementById('editar-descripcion').value = movimiento.descripcion;
    document.getElementById('editar-monto').value = movimiento.monto;
    document.getElementById('editar-fecha').value = new Date(movimiento.fecha).toISOString().split('T')[0];
    
    editarModal.show();
}

function guardarCambios() {
    try {
        const id = document.getElementById('editar-id').value;
        const tipo = document.querySelector('[name="editar-tipo"]:checked').value;
        const categoria = document.getElementById('editar-categoria').value;
        const descripcion = document.getElementById('editar-descripcion').value;
        const monto = parseFloat(document.getElementById('editar-monto').value);
        const fecha = new Date(document.getElementById('editar-fecha').value);
        
        // Validaciones
        if (!categoria) {
            mostrarAlerta('Por favor selecciona una categoría', 'warning');
            return;
        }
        
        if (!monto || monto <= 0) {
            mostrarAlerta('Por favor ingresa un monto válido', 'warning');
            return;
        }
        
        // Buscar y actualizar movimiento
        const index = movimientos.findIndex(m => m.id.toString() === id.toString());
        if (index !== -1) {
            movimientos[index] = {
                ...movimientos[index],
                tipo,
                categoria,
                descripcion,
                monto,
                fecha
            };
            
            guardarDatos();
            actualizarUI();
            editarModal.hide();
            
            mostrarAlerta('Movimiento actualizado exitosamente', 'success');
        }
        
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarAlerta('Error al guardar los cambios', 'danger');
    }
}

function eliminarMovimiento() {
    const id = document.getElementById('editar-id').value;
    
    if (confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
        const index = movimientos.findIndex(m => m.id.toString() === id.toString());
        if (index !== -1) {
            movimientos.splice(index, 1);
            guardarDatos();
            actualizarUI();
            editarModal.hide();
            
            mostrarAlerta('Movimiento eliminado exitosamente', 'success');
        }
    }
}

// Funciones de actualización de UI
function actualizarUI() {
    actualizarResumen();
    actualizarUltimosMovimientos();
    actualizarCategoriasResumen();
    
    // Actualizar filtros
    inicializarFiltroAnios();
    inicializarFiltroCategorias();
    cargarCategoriasBusqueda();
    
    // Si estamos en la pestaña de reportes, actualizar
    const tabReportes = document.querySelector('[data-tab="reportes"]');
    if (tabReportes && tabReportes.classList.contains('active')) {
        actualizarReportes();
    }
}

function actualizarResumen() {
    const totalIngresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const totalEgresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const balance = totalIngresos - totalEgresos;
    
    // Actualizar elementos
    const ingresosElement = document.getElementById('total-ingresos');
    const egresosElement = document.getElementById('total-egresos');
    const balanceElement = document.getElementById('balance-total');
    
    if (ingresosElement) ingresosElement.textContent = formatearMoneda(totalIngresos);
    if (egresosElement) egresosElement.textContent = formatearMoneda(totalEgresos);
    if (balanceElement) {
        balanceElement.textContent = formatearMoneda(balance);
        balanceElement.className = `feminine-balance ${balance >= 0 ? 'text-success-feminine' : 'text-danger-feminine'}`;
    }
}

function actualizarUltimosMovimientos() {
    const container = document.getElementById('ultimos-movimientos');
    if (!container) return;
    
    const ultimosMovimientos = [...movimientos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
    
    container.innerHTML = '';
    
    if (ultimosMovimientos.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-3">No hay movimientos registrados</div>';
        return;
    }
    
    ultimosMovimientos.forEach(movimiento => {
        const categoria = CATEGORIAS.find(c => c.id === movimiento.categoria);
        const categoriaNombre = categoria ? categoria.nombre : 'Sin categoría';
        
        const item = document.createElement('div');
        item.className = `list-group-item ${movimiento.tipo}`;
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="d-flex align-items-center mb-1">
                        <span class="categoria-chip ${movimiento.tipo}-chip">${categoriaNombre}</span>
                        <small class="text-muted ms-2">${formatearFecha(movimiento.fecha)}</small>
                    </div>
                    <div class="fw-bold">${movimiento.descripcion || 'Sin descripción'}</div>
                </div>
                <div class="text-end">
                    <div class="h6 mb-0 text-${movimiento.tipo === 'ingreso' ? 'success' : 'danger'}-feminine">
                        ${movimiento.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(movimiento.monto)}
                    </div>
                    <button class="btn btn-sm editar-btn" onclick="abrirEdicion('${movimiento.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function actualizarCategoriasResumen() {
    const container = document.getElementById('categorias-container');
    if (!container) return;
    
    // Agrupar movimientos por categoría
    const categoriasTotales = {};
    
    movimientos.forEach(movimiento => {
        const categoria = CATEGORIAS.find(c => c.id === movimiento.categoria);
        const categoriaNombre = categoria ? categoria.nombre : 'Sin categoría';
        const key = `${categoriaNombre}-${movimiento.tipo}`;
        
        if (!categoriasTotales[key]) {
            categoriasTotales[key] = {
                nombre: categoriaNombre,
                tipo: movimiento.tipo,
                total: 0
            };
        }
        
        categoriasTotales[key].total += movimiento.monto;
    });
    
    container.innerHTML = '';
    
    // Mostrar categorías ordenadas por total
    Object.values(categoriasTotales)
        .sort((a, b) => b.total - a.total)
        .slice(0, 6) // Mostrar solo las 6 principales
        .forEach(categoria => {
            const chip = document.createElement('span');
            chip.className = `categoria-chip ${categoria.tipo}-chip`;
            chip.innerHTML = `${categoria.nombre}: ${formatearMoneda(categoria.total)}`;
            container.appendChild(chip);
        });
}

// Funciones de reportes
function actualizarReportes() {
    const movimientosFiltrados = filtrarMovimientos();
    actualizarGraficos(movimientosFiltrados);
    actualizarResumenReporte(movimientosFiltrados);
    actualizarListaReportes(movimientosFiltrados);
}

function filtrarMovimientos() {
    const periodo = document.getElementById('filtro-periodo')?.value || 'todos';
    const anio = document.getElementById('filtro-anio')?.value || 'todos';
    const mes = document.getElementById('filtro-mes')?.value || 'todos';
    const tipo = document.getElementById('filtro-tipo')?.value || 'todos';
    const categoria = document.getElementById('filtro-categoria')?.value || 'todas';
    
    let movimientosFiltrados = [...movimientos];
    const ahora = new Date();
    
    // Filtro por período
    if (periodo !== 'todos') {
        const fechaLimite = new Date();
        
        switch (periodo) {
            case 'semana':
                fechaLimite.setDate(ahora.getDate() - 7);
                break;
            case 'mes':
                fechaLimite.setMonth(ahora.getMonth() - 1);
                break;
            case 'anio':
                fechaLimite.setFullYear(ahora.getFullYear() - 1);
                break;
        }
        
        movimientosFiltrados = movimientosFiltrados.filter(m => 
            new Date(m.fecha) >= fechaLimite
        );
    }
    
    // Filtro por año
    if (anio !== 'todos') {
        movimientosFiltrados = movimientosFiltrados.filter(m => 
            new Date(m.fecha).getFullYear() === parseInt(anio)
        );
    }
    
    // Filtro por mes
    if (mes !== 'todos') {
        movimientosFiltrados = movimientosFiltrados.filter(m => 
            new Date(m.fecha).getMonth() + 1 === parseInt(mes)
        );
    }
    
    // Filtro por tipo
    if (tipo !== 'todos') {
        movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === tipo);
    }
    
    // Filtro por categoría
    if (categoria !== 'todas') {
        movimientosFiltrados = movimientosFiltrados.filter(m => {
            const cat = CATEGORIAS.find(c => c.id === m.categoria);
            return cat && cat.nombre === categoria;
        });
    }
    
    return movimientosFiltrados;
}

function actualizarGraficos(movimientos) {
    actualizarGraficoComparacion(movimientos);
    actualizarGraficoCategorias(movimientos);
    actualizarGraficoEvolucion(movimientos);
}

function actualizarGraficoComparacion(movimientos) {
    const ctx = document.getElementById('graficoComparacion');
    if (!ctx) return;
    
    const totalIngresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const totalEgresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    if (graficoComparacion) {
        graficoComparacion.destroy();
    }
    
    graficoComparacion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ingresos', 'Egresos'],
            datasets: [{
                data: [totalIngresos, totalEgresos],
                backgroundColor: [
                    'rgba(152, 217, 130, 0.8)',
                    'rgba(247, 140, 160, 0.8)'
                ],
                borderColor: [
                    '#98d982',
                    '#f78ca0'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Ingresos vs Egresos'
                }
            }
        }
    });
}

function actualizarGraficoCategorias(movimientos) {
    const ctx = document.getElementById('graficoCategorias');
    if (!ctx) return;
    
    // Agrupar por categoría
    const categorias = {};
    movimientos.forEach(m => {
        const cat = CATEGORIAS.find(c => c.id === m.categoria);
        const nombre = cat ? cat.nombre : 'Sin categoría';
        
        if (!categorias[nombre]) {
            categorias[nombre] = 0;
        }
        categorias[nombre] += m.monto;
    });
    
    const labels = Object.keys(categorias);
    const data = Object.values(categorias);
    
    if (graficoCategorias) {
        graficoCategorias.destroy();
    }
    
    graficoCategorias = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#ff69b4', '#dda0dd', '#ffb6c1', '#e6e6fa',
                    '#f0fff0', '#ffe4e1', '#e8b4b8', '#ffcccb'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Distribución por Categorías'
                }
            }
        }
    });
}

function actualizarGraficoEvolucion(movimientos) {
    const ctx = document.getElementById('graficoEvolucion');
    if (!ctx) return;
    
    // Agrupar por mes
    const meses = {};
    movimientos.forEach(m => {
        const fecha = new Date(m.fecha);
        const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        
        if (!meses[clave]) {
            meses[clave] = { ingresos: 0, egresos: 0 };
        }
        
        if (m.tipo === 'ingreso') {
            meses[clave].ingresos += m.monto;
        } else {
            meses[clave].egresos += m.monto;
        }
    });
    
    const labels = Object.keys(meses).sort();
    const ingresos = labels.map(label => meses[label].ingresos);
    const egresos = labels.map(label => meses[label].egresos);
    
    if (graficoEvolucion) {
        graficoEvolucion.destroy();
    }
    
    graficoEvolucion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos',
                data: ingresos,
                borderColor: '#98d982',
                backgroundColor: 'rgba(152, 217, 130, 0.1)',
                tension: 0.4
            }, {
                label: 'Egresos',
                data: egresos,
                borderColor: '#f78ca0',
                backgroundColor: 'rgba(247, 140, 160, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Evolución Mensual'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function actualizarResumenReporte(movimientos) {
    const container = document.getElementById('resumen-reporte');
    if (!container) return;
    
    const totalIngresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const totalEgresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const balance = totalIngresos - totalEgresos;
    const promedioPorMovimiento = movimientos.length > 0 ? 
        (totalIngresos + totalEgresos) / movimientos.length : 0;
    
    container.innerHTML = `
        <div class="col-md-3">
            <div class="text-center">
                <div class="h4 text-success-feminine">${formatearMoneda(totalIngresos)}</div>
                <div class="text-muted">Total Ingresos</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="text-center">
                <div class="h4 text-danger-feminine">${formatearMoneda(totalEgresos)}</div>
                <div class="text-muted">Total Egresos</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="text-center">
                <div class="h4 ${balance >= 0 ? 'text-success-feminine' : 'text-danger-feminine'}">
                    ${formatearMoneda(balance)}
                </div>
                <div class="text-muted">Balance</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="text-center">
                <div class="h4 text-info-feminine">${movimientos.length}</div>
                <div class="text-muted">Movimientos</div>
            </div>
        </div>
    `;
}

function actualizarListaReportes(movimientos) {
    const container = document.getElementById('lista-movimientos-reporte');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (movimientos.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-3">No hay movimientos para mostrar</div>';
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const movimientosOrdenados = [...movimientos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    movimientosOrdenados.forEach(movimiento => {
        const categoria = CATEGORIAS.find(c => c.id === movimiento.categoria);
        const categoriaNombre = categoria ? categoria.nombre : 'Sin categoría';
        
        const item = document.createElement('div');
        item.className = `list-group-item ${movimiento.tipo}`;
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="d-flex align-items-center mb-1">
                        <span class="categoria-chip ${movimiento.tipo}-chip">${categoriaNombre}</span>
                        <small class="text-muted ms-2">${formatearFecha(movimiento.fecha)}</small>
                    </div>
                    <div class="fw-bold">${movimiento.descripcion || 'Sin descripción'}</div>
                </div>
                <div class="text-end">
                    <div class="h6 mb-0 text-${movimiento.tipo === 'ingreso' ? 'success' : 'danger'}-feminine">
                        ${movimiento.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(movimiento.monto)}
                    </div>
                    <button class="btn btn-sm editar-btn" onclick="abrirEdicion('${movimiento.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Funciones de exportación e importación
function exportarAExcel() {
    try {
        const datos = movimientos.map(m => {
            const categoria = CATEGORIAS.find(c => c.id === m.categoria);
            return {
                'Fecha': formatearFecha(m.fecha),
                'Tipo': m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1),
                'Categoría': categoria ? categoria.nombre : 'Sin categoría',
                'Descripción': m.descripcion || '',
                'Monto': m.monto
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
        
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `finanzas_${fecha}.xlsx`);
        
        mostrarAlerta('Datos exportados exitosamente', 'success');
    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarAlerta('Error al exportar los datos', 'danger');
    }
}

function exportarAJSON() {
    try {
        const datos = {
            movimientos: movimientos,
            categorias: CATEGORIAS,
            fechaExportacion: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        mostrarAlerta('Datos exportados exitosamente', 'success');
    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarAlerta('Error al exportar los datos', 'danger');
    }
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (extension === 'json') {
                const datos = JSON.parse(e.target.result);
                importarJSON(datos);
            } else if (extension === 'csv') {
                importarCSV(e.target.result);
            } else if (extension === 'xlsx') {
                importarExcel(e.target.result);
            } else {
                mostrarAlerta('Formato de archivo no soportado', 'warning');
            }
        } catch (error) {
            console.error('Error al importar:', error);
            mostrarAlerta('Error al procesar el archivo', 'danger');
        }
    };
    
    if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
    
    // Limpiar input
    event.target.value = '';
}

function importarJSON(datos) {
    if (datos.movimientos && Array.isArray(datos.movimientos)) {
        movimientos.push(...datos.movimientos.map(m => ({
            ...m,
            id: Date.now() + Math.random(),
            fecha: new Date(m.fecha)
        })));
        
        if (datos.categorias && Array.isArray(datos.categorias)) {
            // Agregar categorías nuevas
            datos.categorias.forEach(cat => {
                if (!CATEGORIAS.find(c => c.id === cat.id)) {
                    CATEGORIAS.push(cat);
                }
            });
            guardarCategorias();
        }
        
        guardarDatos();
        actualizarUI();
        mostrarAlerta('Datos importados exitosamente', 'success');
    } else {
        mostrarAlerta('Formato JSON inválido', 'warning');
    }
}

function importarCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            const movimiento = {
                id: Date.now() + Math.random(),
                fecha: new Date(values[0]),
                tipo: values[1].toLowerCase(),
                categoria: values[2] || 'otros-ingreso',
                descripcion: values[3] || '',
                monto: parseFloat(values[4]) || 0
            };
            
            if (movimiento.monto > 0) {
                movimientos.push(movimiento);
            }
        }
    }
    
    guardarDatos();
    actualizarUI();
    mostrarAlerta('CSV importado exitosamente', 'success');
}

function importarExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    data.forEach(row => {
        const movimiento = {
            id: Date.now() + Math.random(),
            fecha: new Date(row.Fecha || row.fecha),
            tipo: (row.Tipo || row.tipo || '').toLowerCase(),
            categoria: row.Categoría || row.categoria || 'otros-ingreso',
            descripcion: row.Descripción || row.descripcion || '',
            monto: parseFloat(row.Monto || row.monto) || 0
        };
        
        if (movimiento.monto > 0 && (movimiento.tipo === 'ingreso' || movimiento.tipo === 'egreso')) {
            movimientos.push(movimiento);
        }
    });
    
    guardarDatos();
    actualizarUI();
    mostrarAlerta('Excel importado exitosamente', 'success');
}

// Funciones de categorías
function agregarCategoria() {
    try {
        const nombre = document.getElementById('nombre-categoria').value.trim();
        const tipoRadio = document.querySelector('[name="tipo-categoria"]:checked');
        
        if (!nombre) {
            mostrarAlerta('Por favor ingresa el nombre de la categoría', 'warning');
            return;
        }
        
        if (!tipoRadio) {
            mostrarAlerta('Por favor selecciona el tipo de categoría', 'warning');
            return;
        }
        
        const tipo = tipoRadio.value;
        
        // Verificar si ya existe
        const yaExiste = CATEGORIAS.some(c => 
            c.nombre.toLowerCase() === nombre.toLowerCase() && c.tipo === tipo
        );
        
        if (yaExiste) {
            mostrarAlerta('Ya existe una categoría con ese nombre y tipo', 'warning');
            return;
        }
        
        const nuevaCategoria = {
            id: `${tipo}-${Date.now()}`,
            nombre: nombre,
            tipo: tipo
        };
        
        CATEGORIAS.push(nuevaCategoria);
        guardarCategorias();
        
        // Limpiar formulario
        document.getElementById('form-categoria').reset();
        // Volver a seleccionar el primer radio button
        document.getElementById('ingreso-categoria').checked = true;
        
        // Actualizar UI
        mostrarCategorias();
        inicializarFiltroCategorias();
        cargarCategoriasBusqueda();
        cargarCategorias(); // Actualizar las categorías del formulario principal
        
        mostrarAlerta('Categoría agregada exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al agregar categoría:', error);
        mostrarAlerta('Error al agregar la categoría', 'danger');
    }
}

function eliminarCategoria(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
        // Verificar si hay movimientos con esta categoría
        const movimientosConCategoria = movimientos.filter(m => m.categoria === id);
        
        if (movimientosConCategoria.length > 0) {
            if (!confirm(`Hay ${movimientosConCategoria.length} movimientos usando esta categoría. ¿Continuar eliminando? Los movimientos mantendrán la referencia pero la categoría desaparecerá.`)) {
                return;
            }
        }
        
        const index = CATEGORIAS.findIndex(c => c.id === id);
        if (index !== -1) {
            CATEGORIAS.splice(index, 1);
            guardarCategorias();
            mostrarCategorias();
            inicializarFiltroCategorias();
            cargarCategoriasBusqueda();
            cargarCategorias(); // Actualizar formulario principal
            
            // Si estamos en la pestaña de reportes, actualizar también
            const tabReportes = document.querySelector('[data-tab="reportes"]');
            if (tabReportes && tabReportes.classList.contains('active')) {
                actualizarReportes();
            }
            
            mostrarAlerta('Categoría eliminada exitosamente', 'success');
        }
    }
}

function mostrarCategorias() {
    const container = document.getElementById('lista-categorias');
    if (!container) return;
    
    const filtro = document.getElementById('filtro-tipo-categoria')?.value || 'todas';
    
    let categoriasFiltradas = CATEGORIAS;
    if (filtro !== 'todas') {
        categoriasFiltradas = CATEGORIAS.filter(c => c.tipo === filtro);
    }
    
    container.innerHTML = '';
    
    if (categoriasFiltradas.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-3">No hay categorías para mostrar</div>';
        return;
    }
    
    categoriasFiltradas
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(categoria => {
            const puedeEliminar = !['playstation', 'diseno', 'programacion', 'kiosko', 'informatica', 
                                  'otros-ingreso', 'playstation-egreso', 'diseno-egreso', 
                                  'programacion-egreso', 'kiosko-egreso', 'informatica-egreso', 
                                  'impuestos', 'otros-egreso'].includes(categoria.id);
            
            const item = crearItemCategoria(categoria, puedeEliminar);
            container.appendChild(item);
        });
}

function crearItemCategoria(categoria, puedeEliminar) {
    const item = document.createElement('div');
    item.className = `categoria-item ${categoria.tipo}`;
    
    item.innerHTML = `
        <div class="categoria-nombre">${categoria.nombre}</div>
        <div class="d-flex align-items-center">
            <span class="categoria-tipo ${categoria.tipo}">${categoria.tipo.charAt(0).toUpperCase() + categoria.tipo.slice(1)}</span>
            <button class="btn btn-sm btn-eliminar-categoria" onclick="eliminarCategoria('${categoria.id}')">
                <i class="bi bi-trash"></i> Eliminar
            </button>
        </div>
    `;
    
    return item;
}

// Función de debounce para optimizar búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function crearItemCategoria(categoria, puedeEliminar) {
    const item = document.createElement('div');
    item.className = `categoria-item ${categoria.tipo}`;
    
    item.innerHTML = `
        <div class="categoria-nombre">${categoria.nombre}</div>
        <div class="d-flex align-items-center">
            <span class="categoria-tipo ${categoria.tipo}">${categoria.tipo.charAt(0).toUpperCase() + categoria.tipo.slice(1)}</span>
            <button class="btn btn-sm editar-btn me-2" onclick="editarCategoria('${categoria.id}')">
                <i class="bi bi-pencil"></i> Editar
            </button>
            <button class="btn btn-sm btn-eliminar-categoria" onclick="eliminarCategoria('${categoria.id}')">
                <i class="bi bi-trash"></i> Eliminar
            </button>
        </div>
    `;
    
    return item;
}

function editarCategoria(id) {
    const categoria = CATEGORIAS.find(c => c.id === id);
    if (!categoria) return;
    
    const nuevoNombre = prompt("Editar nombre de categoría:", categoria.nombre);
    if (nuevoNombre && nuevoNombre.trim() !== categoria.nombre) {
        categoria.nombre = nuevoNombre.trim();
        guardarCategorias();
        mostrarCategorias();
        actualizarUI();
        mostrarAlerta('Categoría actualizada exitosamente', 'success');
    }
}