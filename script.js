// ===== Carrito de Compras =====
const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const icono = document.getElementById('carritoIcon');
const menu = document.getElementById('carritoMenu');
const contador = document.getElementById('contadorCarrito');
const lista = document.getElementById('listaCarrito');
const totalSpan = document.getElementById('totalCarrito');
const pagarBtn = document.getElementById('pagarBtn');

document.addEventListener("DOMContentLoaded", function () {
  headerFijo();
  inicializarPagina();
  document.querySelector("#botonCerrar").addEventListener("click", cerrarCarrito);

  const params = new URLSearchParams(window.location.search);
  const termino = params.get("q");

  if (termino) {
    document.getElementById(
      "titulo-busqueda"
    ).textContent += `${termino}"`;
    buscarYMostrarResultados(termino);
  }
});

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
  const costoEnvio = 12000;
  const valorMinimoGratis = 70000;

  // Calcular subtotal
  const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

  // Mostrar subtotal
  document.getElementById('subtotalCarrito').textContent = `${currency(subtotal)}`;

  // Determinar si el carrito está vacío
  const carritoVacio = carrito.length === 0;
  const envioCarrito = document.getElementById('envioCarrito');
  const pagarBtn = document.getElementById('pagarBtn'); // Referencia al botón de pago
  const lista = document.getElementById('listaCarrito'); // Lista de productos

  let costoEnvioActual = costoEnvio; // Por defecto

  if (carritoVacio) {
    costoEnvioActual = 0;
    envioCarrito.textContent = `${currency(0)}`;

    // Mostrar mensaje de carrito vacío
    if (lista) {
      lista.innerHTML = `<li class="producto-carrito"><p>🛒 Tu carrito está vacío.</p></li>`;
    }

    // Desactivar botón de pagar
    if (pagarBtn) {
      pagarBtn.disabled = true;
      pagarBtn.classList.add('btn-disabled');
    }

  } else {
    const envioGratis = subtotal >= valorMinimoGratis;
    if (envioGratis) {
      envioCarrito.innerHTML = `<span class="text-decoration-line-through">${currency(costoEnvio)}</span> <span class="text-success">GRATIS</span>`;
      costoEnvioActual = 0;
    } else {
      envioCarrito.textContent = `${currency(costoEnvio)}`;
    }

    // Actualizar lista de productos
    if (lista) {
      lista.innerHTML = carrito.map((item, idx) => `
        <li class="producto-carrito">
          <p>${item.nombre} x ${item.cantidad} - ${currency(item.precio * item.cantidad)}</p>
          <div class="producto-iconos">
            <i class="fas fa-minus btn-eliminar" role="button" onclick="modificarCantidad(${idx}, -1)"></i>
            <i class="fas fa-plus btn-editar" role="button" onclick="modificarCantidad(${idx}, 1)"></i>
            <i class="fas fa-trash btn-eliminar" role="button" onclick="eliminarProducto(${idx})"></i>
          </div>
        </li>
      `).join('');
    }

    // Activar botón de pagar
    if (pagarBtn) {
      pagarBtn.disabled = false;
      pagarBtn.classList.remove('btn-disabled');
    }
  }

  // Calcular total
  const total = subtotal + costoEnvioActual;
  document.getElementById('totalCarrito').textContent = `${currency(total)}`;

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

    const costoEnvio = 12000;
    const valorMinimoGratis = 70000;
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const envioGratis = subtotal >= valorMinimoGratis;
    const total = envioGratis ? subtotal : subtotal + costoEnvio;

    let mensaje = carrito.map(p =>
      `• ${p.nombre} x${p.cantidad} = ${currency(p.precio * p.cantidad)}`
    ).join('%0A');

    mensaje += `%0A%0ASubtotal: ${currency(subtotal)}`;
    mensaje += envioGratis
      ? `%0AEnv%C3%ADo: GRATIS (Compra mayor a $70.000)`
      : `%0AEnv%C3%ADo: $12.000`;
    mensaje += `%0ATotal: ${currency(total)}`;

    window.open(`https://wa.me/573113812334?text=Hola!%20Quiero%20comprar:%0A${mensaje}`, '_blank');
  });
}

// ===== Sistema de Productos =====
let allProductos = [];

async function cargarTodosLosProductos() {
  const lista = document.getElementById('listaProductos');
  if (lista) {
    lista.innerHTML = `
      <div class="loader">
        <p>🔄 Cargando productos, por favor espera...</p>
      </div>
    `;
  }

  try {
    const res = await fetch('https://api.sheetbest.com/sheets/b97a4c5b-6caa-426f-8d11-c9ee3269a687');
    allProductos = await res.json();
    renderizarProductos(allProductos);
  } catch (error) {
    console.error('Error cargando productos:', error);

    if (lista) {
      lista.innerHTML = `
        <div class="error-carga">
          <p>❌ Error cargando productos. Intenta de nuevo más tarde.</p>
        </div>
      `;
    }
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

  if (document.getElementById('lista-pines')) {
    const categoria = window.location.pathname.split('/').pop().split('.')[0].toLowerCase();
    const productosFiltrados = allProductos.filter(p => p.categoria?.toLowerCase() === categoria);
    renderProductos(productosFiltrados, 'lista-pines', 'morado');

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
function renderProductos(productos, contenedorId, clasePersonalizada = '') {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = productos.map(p => `
    <div class="card-productos h-100 card-productos__${clasePersonalizada}">
      <img class="imagen-card" src="${p.imagen}" alt="${p.nombre}">
      <div class="card-informacion">
        <h4 class="texto-card-fluido">${p.nombre}</h4>
        <p class="texto-precio-card">${currency(p.precio)}</p>
        <button class="boton-agregar-carrito boton-agregar-carrito__${clasePersonalizada}" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">
          <i class="fas fa-cart-plus"></i> Añadir al carrito
        </button>
        <button class="boton-agregar-carrito boton-agregar-carrito__claro" onclick="irADetalle(${JSON.stringify(p).replace(/"/g, '&quot;')})">Ver detalles</button>
      </div>
    </div>`).join('');
}

function irADetalle(producto) {
  localStorage.setItem('productoSeleccionado', JSON.stringify(producto));
  window.location.href = 'producto.html';
}

const currency = function (number) {
  return new Intl.NumberFormat("es-co", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(number);
};

function cerrarCarrito() {
  let carritoMenu = document.querySelector("#carritoMenu");
  carritoMenu.classList.remove('open');
}

function headerFijo() {
  const header = document.querySelector(".contenedor-navegacion");
  const navegacion = document.querySelector("#nav");
  window.addEventListener("scroll", function () {
    navegacion.classList.toggle("sticky", window.scrollY > 0);
    header.classList.toggle("sticky", window.scrollY > 0);
  });
}

