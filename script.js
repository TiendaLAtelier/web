//---------------------------------------------- Diego ----------------------------------------------
const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const iconoCarrito = document.getElementById('carritoIcon');
const menuCarrito = document.getElementById('carritoMenu');
const contadorCarrito = document.getElementById('contadorCarrito');
const listaCarrito = document.getElementById('listaCarrito');
const totalCarrito = document.getElementById('totalCarrito');
const pagarBtn = document.getElementById('pagarBtn');
const botonCerrar = document.querySelector("#botonCerrar");
let allProductos = [];

document.addEventListener("DOMContentLoaded", function () {
  headerFijo();
  inicializarPagina();
});

function manejarEventos() {
  if (botonCerrar) {
    botonCerrar.addEventListener("click", cerrarCarrito);
  }

  if (iconoCarrito && menuCarrito) {
    iconoCarrito.addEventListener('click', () => {
      menuCarrito.classList.toggle('open');
    });
  }

  const pagarBtn = document.getElementById('pagarBtn');
  if (pagarBtn) {
    pagarBtn.addEventListener('click', pagarCarrito);
  }
}

function manejarBusqueda() {
  const params = new URLSearchParams(window.location.search);
  const termino = params.get("q");

  if (termino) {
    const tituloBusqueda = document.getElementById("titulo-busqueda");
    if (tituloBusqueda) {
      tituloBusqueda.textContent += `${termino}"`;
    }
    buscarYMostrarResultados(termino);
  }
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
  const listaCarrito = document.getElementById('listaCarrito'); // Lista de productos

  let costoEnvioActual = costoEnvio; // Por defecto

  if (carritoVacio) {
    costoEnvioActual = 0;
    envioCarrito.textContent = `${currency(0)}`;

    // Mostrar mensaje de carrito vacío
    if (listaCarrito) {
      listaCarrito.innerHTML = `<li class="producto-carrito"><p>🛒 Tu carrito está vacío.</p></li>`;
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

    // Actualizar listaCarrito de productos
    if (listaCarrito) {
      listaCarrito.innerHTML = carrito.map((item, idx) => `
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

  // Actualizar contadorCarrito
  if (contadorCarrito) {
    const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    contadorCarrito.textContent = totalItems;
    contadorCarrito.style.display = totalItems ? 'inline-block' : 'none';
  }
}

function validarNavegacion() {
  const ruta = window.location.pathname;
  const paginaActual = ruta.substring(ruta.lastIndexOf('/') + 1);
  const links = document.querySelectorAll('.nav__link');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === paginaActual) {
      link.classList.add('active'); // Clase que puedes diseñar en CSS
    }
  });
}

function pagarCarrito() {
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
}

// ===== Inicialización =====
async function inicializarPagina() {
  validarNavegacion();
  manejarEventos();
  manejarBusqueda();
  actualizarCarritoUI();
  configurarBuscador();
  const exito = await cargarTodosLosProductos();

  // Cargar contenido según la página
  if (exito) {
    const destacados = allProductos.filter(row => row.destacado?.toLowerCase() == 'true');
    renderProductos(destacados, 'productosDestacados');
  }

  // if (document.getElementById('listaCarrito-pines')) {
  //   const categoria = window.location.pathname.split('/').pop().split('.')[0].toLowerCase();
  //   const productosFiltrados = allProductos.filter(p => p.categoria?.toLowerCase() === categoria);
  //   renderProductos(productosFiltrados, 'listaCarrito-pines', 'morado');

  //   const tituloCategoria = document.getElementById('titulo-categoria');
  //   if (tituloCategoria) {
  //     tituloCategoria.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
  //   }
  // }

  // if (window.location.pathname.includes('busqueda.html')) {
  //   await mostrarResultadosBusqueda();
  // }
}

async function cargarTodosLosProductos() {
  const listaCarrito = document.getElementById('contenedor-lista-pines');
  if (listaCarrito) listaCarrito.innerHTML = `<div class="loader"><p>🔄 Cargando productos, por favor espera...</p></div>`;

  try {
    const respuesta = await fetch('https://api.sheetbest.com/sheets/b97a4c5b-6caa-426f-8d11-c9ee3269a687');
    allProductos = await respuesta.json();
    let listaPines = allProductos.filter(row => row.categoria?.toLowerCase() == 'pines');
    renderProductos(listaPines, 'contenedor-lista-pines');
    let listaCuadros = allProductos.filter(row => row.categoria?.toLowerCase() == 'cuadros');
    renderProductos(listaCuadros, 'productos-categoria');
    let listaPersonalizados = allProductos.filter(row => row.categoria?.toLowerCase() == 'personalizados');
    renderProductos(listaPersonalizados, 'productos-categoria-personalizados');
    return true;
  } catch (error) {
    console.error('Error cargando productos:', error);
    if (listaCarrito) listaCarrito.innerHTML = `<div class="error-carga"><p>❌ Error cargando productos. Intenta de nuevo más tarde.</p></div>`;
    return false;
  }
}

//Función genérica para renderizar productos
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
        <button class="boton-agregar-carrito boton-agregar-carrito__claro" onclick="irDetalleProducto(${JSON.stringify(p).replace(/"/g, '&quot;')})">Ver detalles</button>
      </div>
    </div>`).join('');
}


function irDetalleProducto(producto) {
  localStorage.setItem('productoSeleccionado', JSON.stringify(producto));
  window.location.href = 'producto.html';
}
//---------------------------------------------- Diego ----------------------------------------------
// ===== Gestión del Carrito =====
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

function modificarCantidad(index, delta) {
  carrito[index].cantidad += delta;
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }
  actualizarCarritoUI();
  localStorage.setItem('carrito', JSON.stringify(carrito));
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
              <button class="btn btn-purple" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">
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

