// ===== Carrito de Compras =====
const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const icono = document.getElementById('carritoIcon');
const menu = document.getElementById('carritoMenu');
const contador = document.getElementById('contadorCarrito');
const lista = document.getElementById('listaCarrito');
const totalSpan = document.getElementById('totalCarrito');
const pagarBtn = document.getElementById('pagarBtn');

// ===== Gestión del Carrito =====
if (icono && menu) {
  icono.addEventListener('click', () => menu.classList.toggle('open'));
}

function agregarAlCarrito(nombre, precio, cantidad = 1) {
  const existente = carrito.find(item => item.nombre === nombre);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ 
      nombre, 
      precio: parseFloat(precio), 
      cantidad: parseInt(cantidad) || 1
    });
  }
  actualizarCarritoUI();
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function eliminarProducto(index) {
  carrito.splice(index, 1);
  actualizarCarritoUI();
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarCarritoUI() {
  const ENVIO = 12000;
  const MINIMO_ENVIO_GRATIS = 70000;

  // Calcular subtotal
  const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  
  // Mostrar subtotal
  document.getElementById('subtotalCarrito').textContent = `$${subtotal.toFixed(2)}`;
  
  // Determinar si el envío es gratis
  const envioGratis = subtotal >= MINIMO_ENVIO_GRATIS;
  const envioCarrito = document.getElementById('envioCarrito');
  
  if (envioGratis) {
    envioCarrito.innerHTML = `<span class="text-decoration-line-through">$${ENVIO.toLocaleString()}</span> <span class="text-success">GRATIS</span>`;
  } else {
    envioCarrito.textContent = `$${ENVIO.toLocaleString()}`;
  }
  
  // Calcular total
  const total = envioGratis ? subtotal : subtotal + ENVIO;
  document.getElementById('totalCarrito').textContent = `$${total.toFixed(2)}`;
  
  // Actualizar lista de productos
  const lista = document.getElementById('listaCarrito');
  if (lista) {
    lista.innerHTML = carrito.map((item, idx) => `
      <li class="mb-2 pb-2 border-bottom">
        <div class="d-flex justify-content-between">
          <span>${item.nombre} x${item.cantidad}</span>
          <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
        </div>
        <div class="d-flex justify-content-end mt-1">
          <button class="btn btn-sm btn-outline-secondary me-2" 
                  onclick="modificarCantidad(${idx}, -1)">
            <i class="fas fa-minus"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary" 
                  onclick="modificarCantidad(${idx}, 1)">
            <i class="fas fa-plus"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger ms-2" 
                  onclick="eliminarProducto(${idx})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
  
  // Actualizar contador
  if (contador) {
    const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    contador.textContent = totalItems;
    contador.style.display = totalItems ? 'inline-block' : 'none';
  }
}

function modificarCantidad(index, delta) {
  carrito[index].cantidad += delta;
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }
  actualizarCarritoUI();
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

if (pagarBtn) {
  pagarBtn.addEventListener('click', () => {
    if (!carrito.length) return alert('Tu carrito está vacío.');
    
    const ENVIO = 12000;
    const MINIMO_ENVIO_GRATIS = 70000;
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const envioGratis = subtotal >= MINIMO_ENVIO_GRATIS;
    const total = envioGratis ? subtotal : subtotal + ENVIO;
    
    let mensaje = carrito.map(p => 
      `• ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toFixed(2)}`
    ).join('%0A');
    
    mensaje += `%0A%0ASubtotal: $${subtotal.toFixed(2)}`;
    mensaje += envioGratis 
      ? `%0AEnv%C3%ADo: GRATIS (Compra mayor a $70,000)` 
      : `%0AEnv%C3%ADo: $12,000`;
    mensaje += `%0ATotal: $${total.toFixed(2)}`;
    
    window.open(`https://wa.me/573113812334?text=Hola!%20Quiero%20comprar:%0A${mensaje}`, '_blank');
  });
}

// ===== Sistema de Productos =====
let allProductos = [];

async function cargarTodosLosProductos() {
  try {
    const res = await fetch('https://api.sheetbest.com/sheets/b97a4c5b-6caa-426f-8d11-c9ee3269a687');
    allProductos = await res.json();
  } catch (error) {
    console.error('Error cargando productos:', error);
  }
}

// ===== Búsqueda =====
function configurarBuscador() {
  document.querySelectorAll('form#searchForm').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="search"]');
      const termino = input.value.trim();
      
      if (termino) {
        // Redirigir a página de resultados
        window.location.href = `busqueda.html?q=${encodeURIComponent(termino)}`;
      }
    });
  });
}

// ===== Página de Resultados =====
async function mostrarResultadosBusqueda() {
  const params = new URLSearchParams(window.location.search);
  const termino = params.get('q');
  const contenedor = document.getElementById('resultados-busqueda');
  const titulo = document.getElementById('titulo-busqueda');

  if (!termino || !contenedor) return;

  await cargarTodosLosProductos();
  
  const resultados = allProductos.filter(p => {
    const campos = [
      p.nombre?.toLowerCase(),
      p.descripcion?.toLowerCase(),
      p.categoria?.toLowerCase(),
      p.etiquetas?.toLowerCase()
    ].join(' ');
    
    return campos.includes(termino.toLowerCase());
  });

  titulo.textContent = `Resultados para: "${termino}"`;
  
  contenedor.innerHTML = resultados.length > 0 
    ? resultados.map(p => `
        <div class="col-6 col-md-3 mb-4">
          <div class="card h-100 shadow">
            <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}">
            <div class="card-body text-center">
              <h5 class="card-title text-purple">${p.nombre}</h5>
              <p class="text-muted">$${p.precio}</p>
              <button class="btn btn-purple" 
                      onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">
                <i class="fas fa-cart-plus"></i> Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      `).join('')
    : `<div class="col-12 text-center py-5">
         <h4>¡No encontramos resultados para "${termino}"!</h4>
       </div>`;
}

// ===== Inicialización =====
async function inicializarPagina() {
  await cargarTodosLosProductos();
  
  // Cargar contenido según la página
  if (document.getElementById('productosDestacados')) {
    const destacados = allProductos.filter(p => p.destacado?.toUpperCase() === 'TRUE');
    renderProductos(destacados, 'productosDestacados');
  }
  
  if (document.getElementById('productos-categoria')) {
    const categoria = window.location.pathname.split('/').pop().split('.')[0].toLowerCase();
    const productosFiltrados = allProductos.filter(p => p.categoria?.toLowerCase() === categoria);
    renderProductos(productosFiltrados, 'productos-categoria');
    
    const tituloCategoria = document.getElementById('titulo-categoria');
    if (tituloCategoria) {
      tituloCategoria.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    }
  }
  
  if (window.location.pathname.includes('busqueda.html')) {
    await mostrarResultadosBusqueda();
  }
  
  actualizarCarritoUI();
  configurarBuscador();
}

// Función genérica para renderizar productos
function renderProductos(productos, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = productos.map(p => `
    <div class="col-6 col-lg-3 mb-4"> 
      <div class="card h-100 shadow">
        <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}" style="cursor:pointer" onclick="irADetalle(${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <div class="card-body text-center">
          <h5 class="card-title text-purple" style="cursor:pointer" onclick="irADetalle(${JSON.stringify(p).replace(/"/g, '&quot;')})">${p.nombre}</h5>
          <p class="text-muted">$${p.precio}</p>
          <button class="btn btn-purple" 
                  onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">
            <i class="fas fa-cart-plus"></i> Añadir al carrito
          </button>
          <button class="btn btn-outline-secondary mt-2" 
                  onclick="irADetalle(${JSON.stringify(p).replace(/"/g, '&quot;')})">
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarPagina);


function irADetalle(producto) {
  localStorage.setItem('productoSeleccionado', JSON.stringify(producto));
  window.location.href = 'producto.html';
}
