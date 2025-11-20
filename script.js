// URL del Apps Script de Google
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRklOYJ2jS__V-PmWeGEf7szqKY1XyhoPrLzQdOS65-51Fi8nitrm6Yktkjm-uYZgf/exec';

// Tabla de precios
const PRECIOS = {
    'Pollo': 8,
    'Cerdo': 8,
    'Gallina': 12,
    'Costillas': 12,
    'Picante': 0,
    'Pasas': 0.5,
    'Aceituna': 0.5,
    'Ciruela': 0.5
};

// --- Variables y Estado Global ---
let tamales = []; // Almacena temporalmente los items de tamal
let tamalCounter = 0; // Contador único para IDs de tamales

// --- Referencias DOM ---
const $customerFormSection = document.getElementById('customer-form-section');
const $summarySection = document.getElementById('summary-section');
const $successSection = document.getElementById('success-section');
const $tamalList = document.getElementById('tamal-list');
const $messageArea = document.getElementById('message-area');

// --- Función para calcular precio de un tamal ---
function calcularPrecioTamal(tamal) {
    let precioBase = PRECIOS[tamal.carne] || 0;
    let precioExtras = 0;
    
    tamal.extras.forEach(extra => {
        precioExtras += PRECIOS[extra] || 0;
    });
    
    let subtotal = (precioBase + precioExtras) * tamal.cantidad;
    
    // Redondear de 0.5 a 1
    if (subtotal % 1 !== 0) {
        subtotal = Math.ceil(subtotal);
    }
    
    return subtotal;
}

// --- Función para calcular total del pedido ---
function calcularTotalPedido() {
    return tamales.reduce((total, tamal) => {
        return total + calcularPrecioTamal(tamal);
    }, 0);
}

// --- Función de Utilidad: Mostrar Mensajes ---
function showMessage(type, message) {
    let color = '';
    if (type === 'success') color = 'bg-green-100 border-green-500 text-green-700';
    else if (type === 'error') color = 'bg-red-100 border-red-500 text-red-700';
    else if (type === 'info') color = 'bg-blue-100 border-blue-500 text-blue-700';

    $messageArea.innerHTML = `
        <div class="p-4 mb-4 border-l-4 ${color} rounded-lg text-left" role="alert">
            <p class="font-bold">${type === 'error' ? 'Error' : 'Aviso'}</p>
            <p>${message}</p>
        </div>
    `;
    setTimeout(() => $messageArea.innerHTML = '', 7000); // Borrar después de 7 segundos
}

// --- Función para Obtener Datos del Cliente ---
function getCustomerData() {
    return {
        nombre: document.getElementById('nombre').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        referencia: document.getElementById('referencia').value.trim(),
        gps: document.getElementById('gps-coords').value.trim()
    };
}

// --- Función para Validar Datos del Cliente ---
function validateCustomerData(data) {
    if (!data.nombre || data.nombre.length < 3) return "Por favor, ingresa tu Nombre completo.";
    if (!data.telefono || data.telefono.length < 7) return "Por favor, ingresa un número de Teléfono válido.";
    if (!data.direccion || data.direccion.length < 5) return "Por favor, ingresa una Dirección de entrega válida.";
    if (tamales.length === 0) return "Debes agregar al menos un tamal al pedido.";
    return null; // Retorna null si la validación es exitosa
}

// --- Función para Capturar Ubicación GPS ---
document.getElementById('capture-gps-btn').addEventListener('click', () => {
    const $gpsInput = document.getElementById('gps-coords');
    $gpsInput.value = 'Obteniendo ubicación...';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lon = position.coords.longitude.toFixed(6);
                $gpsInput.value = `${lat}, ${lon}`;
                showMessage('success', 'Ubicación GPS capturada con éxito.');
            },
            (error) => {
                $gpsInput.value = 'Error al obtener GPS';
                showMessage('error', 'No se pudo obtener la ubicación GPS. Por favor, asegúrate de tener el GPS activado y de dar permiso a la página.');
                console.error("Geolocation Error:", error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        $gpsInput.value = 'GPS no soportado';
        showMessage('error', 'Tu navegador no soporta la función de Geolocalización.');
    }
});

// --- Renderizar un Nuevo Item de Tamal ---
function renderNewTamalItem(tamal = null) {
    const id = tamal ? tamal.id : ++tamalCounter;
    const isEdit = tamal !== null;
    
    // Calcular precio si es edición
    const subtotal = tamal ? calcularPrecioTamal(tamal) : 0;
    
    const itemHTML = `
        <div id="tamal-item-${id}" class="tamal-item p-4 sm:p-6 border border-gray-300 rounded-xl bg-gray-50 space-y-3">
            <div class="flex justify-between items-start">
                <h4 class="text-xl font-bold text-tamal-green">Tamal #${id}</h4>
                <button type="button" data-id="${id}" class="remove-tamal-btn text-tamal-red text-xl font-bold p-1 rounded-full hover:bg-red-100 transition duration-150">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <input type="number" data-field="cantidad" data-id="${id}" value="${tamal ? tamal.cantidad : 1}" min="1" class="input-lg text-center" required>
                </div>
                <div class="col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Elegir Masa</label>
                    <select data-field="masa" data-id="${id}" class="select-lg" required>
                        <option value="" disabled ${!isEdit ? 'selected' : ''}>Selecciona...</option>
                        <option value="Maíz" ${tamal && tamal.masa === 'Maíz' ? 'selected' : ''}>Maíz</option>
                        <option value="Arroz" ${tamal && tamal.masa === 'Arroz' ? 'selected' : ''}>Arroz</option>
                    </select>
                </div>
                <div class="col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Elegir Carne</label>
                    <select data-field="carne" data-id="${id}" class="select-lg" required>
                        <option value="" disabled ${!isEdit ? 'selected' : ''}>Selecciona...</option>
                        <option value="Pollo" ${tamal && tamal.carne === 'Pollo' ? 'selected' : ''}>Pollo</option>
                        <option value="Cerdo" ${tamal && tamal.carne === 'Cerdo' ? 'selected' : ''}>Cerdo</option>
                        <option value="Gallina" ${tamal && tamal.carne === 'Gallina' ? 'selected' : ''}>Gallina</option>
                        <option value="Costillas" ${tamal && tamal.carne === 'Costillas' ? 'selected' : ''}>Costillas</option>
                    </select>
                </div>
            </div>
            
            <div class="pt-2">
                <label class="block text-lg font-medium text-gray-700 mb-2">Extras:</label>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    ${['Picante', 'Aceituna', 'Pasas','Ciruela'].map((extra, index) => {
                        const checked = tamal && tamal.extras.includes(extra) ? 'checked' : '';
                        return `
                            <label class="flex items-center space-x-2 text-base font-medium text-gray-800 cursor-pointer">
                                <input type="checkbox" data-extra="${extra}" data-id="${id}" class="h-5 w-5 text-tamal-green rounded focus:ring-tamal-green" ${checked}>
                                <span>${extra}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="pt-3 border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold text-gray-700">Subtotal:</span>
                    <span class="text-xl font-bold text-tamal-green">Q<span id="subtotal-${id}">${subtotal}</span></span>
                </div>
            </div>
        </div>
    `;
    
    if (isEdit) {
        document.getElementById(`tamal-item-${id}`).outerHTML = itemHTML;
    } else {
        $tamalList.insertAdjacentHTML('beforeend', itemHTML);
        tamales.push({
            id: id,
            cantidad: 1,
            masa: '',
            carne: '',
            extras: []
        });
    }
    
    // Re-adjuntar listeners después de renderizar/actualizar
    attachTamalListeners();
}

// --- Lógica para Agregar Tamal ---
document.getElementById('add-tamal-btn').addEventListener('click', () => {
    renderNewTamalItem();
});

// --- Lógica para Adjuntar Listeners a los Items de Tamal ---
function attachTamalListeners() {
    // Remover Tamal
    document.querySelectorAll('.remove-tamal-btn').forEach(button => {
        button.onclick = (e) => {
            const idToRemove = parseInt(e.currentTarget.dataset.id);
            tamales = tamales.filter(t => t.id !== idToRemove);
            document.getElementById(`tamal-item-${idToRemove}`).remove();
            if (tamales.length === 0) {
                showMessage('info', 'No has añadido tamales. Por favor, agrega al menos uno.');
            }
        };
    });

    // Actualizar Campos de Tamal
    document.querySelectorAll('.tamal-item input[type="number"], .tamal-item select').forEach(input => {
        input.onchange = (e) => {
            const id = parseInt(e.target.dataset.id);
            const field = e.target.dataset.field;
            const value = field === 'cantidad' ? parseInt(e.target.value) : e.target.value;
            const tamal = tamales.find(t => t.id === id);
            if (tamal) {
                tamal[field] = value;
                // Actualizar precio
                const subtotal = calcularPrecioTamal(tamal);
                document.getElementById(`subtotal-${id}`).textContent = subtotal;
            }
        };
    });

    // Actualizar Extras (Checkboxes)
    document.querySelectorAll('.tamal-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.onchange = (e) => {
            const id = parseInt(e.target.dataset.id);
            const extra = e.target.dataset.extra;
            const tamal = tamales.find(t => t.id === id);
            if (tamal) {
                if (e.target.checked) {
                    if (!tamal.extras.includes(extra)) tamal.extras.push(extra);
                } else {
                    tamal.extras = tamal.extras.filter(ex => ex !== extra);
                }
                // Actualizar precio
                const subtotal = calcularPrecioTamal(tamal);
                document.getElementById(`subtotal-${id}`).textContent = subtotal;
            }
        };
    });
}

// --- Lógica de Navegación: Formulario a Resumen ---
document.getElementById('next-step-btn').addEventListener('click', () => {
    const customerData = getCustomerData();
    const validationError = validateCustomerData(customerData);
    
    if (validationError) {
        showMessage('error', validationError);
        return;
    }

    // Validar que todos los tamales tengan masa y carne seleccionadas
    const incompleteTamal = tamales.find(t => !t.masa || !t.carne);
    if (incompleteTamal) {
        showMessage('error', `El Tamal #${incompleteTamal.id} necesita que selecciones la Masa y la Carne.`);
        return;
    }
    
    // Ocultar Formulario, Mostrar Resumen
    $customerFormSection.classList.add('hidden');
    $summarySection.classList.remove('hidden');
    
    // Rellenar Resumen de Datos de Cliente
    document.getElementById('summary-nombre').textContent = customerData.nombre;
    document.getElementById('summary-telefono').textContent = customerData.telefono;
    document.getElementById('summary-direccion').textContent = customerData.direccion;
    document.getElementById('summary-referencia').textContent = customerData.referencia || 'No especificado';
    document.getElementById('summary-gps').textContent = customerData.gps || 'No capturado';
    
    // Generar Tabla de Tamales con precios
    let tableHTML = `
        <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead class="bg-gray-200">
                <tr>
                    <th class="p-3 text-left text-sm font-semibold text-gray-600">#</th>
                    <th class="p-3 text-left text-sm font-semibold text-gray-600">Cant.</th>
                    <th class="p-3 text-left text-sm font-semibold text-gray-600">Masa</th>
                    <th class="p-3 text-left text-sm font-semibold text-gray-600">Carne</th>
                    <th class="p-3 text-left text-sm font-semibold text-gray-600">Extras</th>
                    <th class="p-3 text-left text-sm font-semibold text-gray-600">Subtotal</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let totalPedido = 0;
    
    tamales.forEach((t, index) => {
        const extrasText = t.extras.length > 0 ? t.extras.join(', ') : 'Ninguno';
        const subtotal = calcularPrecioTamal(t);
        totalPedido += subtotal;
        
        tableHTML += `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 text-base">${index + 1}</td>
                <td class="p-3 text-base font-bold">${t.cantidad}</td>
                <td class="p-3 text-base">${t.masa}</td>
                <td class="p-3 text-base">${t.carne}</td>
                <td class="p-3 text-sm">${extrasText}</td>
                <td class="p-3 text-base font-bold text-tamal-green">Q${subtotal}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
        <div class="mt-4 p-4 bg-tamal-green text-white rounded-lg">
            <div class="flex justify-between items-center text-xl font-bold">
                <span>TOTAL DEL PEDIDO:</span>
                <span>Q${totalPedido}</span>
            </div>
        </div>
    `;
    
    document.getElementById('summary-tamales-table').innerHTML = tableHTML;
});

// --- Lógica de Navegación: Resumen a Formulario (Modificar) ---
document.getElementById('modify-order-btn').addEventListener('click', () => {
    $summarySection.classList.add('hidden');
    $customerFormSection.classList.remove('hidden');
    $messageArea.innerHTML = ''; // Limpiar mensajes
});

// --- Lógica de Envío de Datos a Google Apps Script (SOLUCIÓN CORS MEJORADA) ---
document.getElementById('confirm-send-btn').addEventListener('click', async () => {
    
    const customerData = getCustomerData();
    const totalPedido = calcularTotalPedido();
    
    // **SOLUCIÓN CORS MEJORADA: Enviar datos con estructura simple**
    const formData = new URLSearchParams();
    formData.append('nombre', customerData.nombre);
    formData.append('telefono', customerData.telefono);
    formData.append('direccion', customerData.direccion);
    formData.append('referencia', customerData.referencia);
    formData.append('gps', customerData.gps);
    formData.append('total_pedido', totalPedido);
    
    // Agregar cada tamal con estructura simple
    tamales.forEach((tamal, index) => {
        formData.append(`tamal_${index}_cantidad`, tamal.cantidad);
        formData.append(`tamal_${index}_masa`, tamal.masa);
        formData.append(`tamal_${index}_carne`, tamal.carne);
        formData.append(`tamal_${index}_picante`, tamal.extras.includes('Picante') ? 'SI' : 'NO');
        formData.append(`tamal_${index}_aceituna`, tamal.extras.includes('Aceituna') ? 'SI' : 'NO');
        formData.append(`tamal_${index}_pasas`, tamal.extras.includes('Pasas') ? 'SI' : 'NO');
        formData.append(`tamal_${index}_ciruela`, tamal.extras.includes('Ciruela') ? 'SI' : 'NO');
        formData.append(`tamal_${index}_subtotal`, calcularPrecioTamal(tamal));
    });

    $messageArea.innerHTML = '<div class="p-4 mb-4 border-l-4 border-blue-500 bg-blue-100 text-blue-700 rounded-lg">Enviando pedido... Por favor, espera.</div>';
    
    try {
        // Fetch con POST usando URLSearchParams
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.text();
            
            if (result.includes('Success')) {
                $summarySection.classList.add('hidden');
                $successSection.classList.remove('hidden');
                $messageArea.innerHTML = '';
            } else {
                showMessage('error', `Error al procesar el pedido: ${result}`);
            }
        } else {
            throw new Error('Error del servidor: ' + response.status);
        }

    } catch (error) {
        console.error("Error en la solicitud:", error);
        showMessage('error', `No se pudo conectar con el servicio de pedidos. Detalles: ${error.message}`);
    }
});

// --- Lógica de Navegación: Éxito a Nuevo Pedido ---
document.getElementById('new-order-btn').addEventListener('click', () => {
    // Recargar la página para un inicio limpio
    window.location.reload();
});

// --- Inicialización ---
window.onload = () => {
    renderNewTamalItem(); // Inicia con un tamal por defecto
};