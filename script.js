/* ============================================================
   Turnify: landing page
   1) Configuración de Supabase
   2) Medición de hipótesis (H1, H2, H3)
   3) Demo del prototipo
   4) Botones de plan
   5) Formulario con validación
   ============================================================ */

// 1) CONFIGURACIÓN -------------------------------------------
// Pega aquí los datos de tu proyecto (Supabase > Project Settings > API).
// Usa SOLO la clave "anon public". Nunca pongas la service_role en el frontend.
const SUPABASE_URL = "https://dcolnktsfxgqlcsbbyzn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Vkz3z9ehbJY2wVe6xGovsQ_ysWffDKk";

// La consigna pide una sola tabla (registro_beta), así que las métricas extra
// (tabla eventos_landing) vienen APAGADAS. Solo actívalas si creas esa tabla
// con supabase-metricas-opcional.sql.
const ACTIVAR_METRICAS = false;

const supabaseListo =
  !SUPABASE_URL.includes("TU-PROYECTO") && SUPABASE_ANON_KEY !== "TU_ANON_KEY";

// Inserta una fila en una tabla de Supabase usando su API REST.
// "return=minimal" es importante: con RLS solo-INSERT no podemos leer la fila de vuelta.
async function insertar(tabla, datos) {
  const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      // Las claves antiguas "anon" son JWT (empiezan con eyJ) y van también como Bearer.
      // Las claves nuevas "sb_publishable_..." solo van en apikey.
      ...(SUPABASE_ANON_KEY.startsWith("eyJ")
        ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        : {}),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(datos),
    keepalive: true,
  });
  if (!respuesta.ok) throw new Error(`Supabase respondió ${respuesta.status}`);
}

// 2) MEDICIÓN DE HIPÓTESIS -----------------------------------
// H1: visita, tiempo_30s, scroll_completo
// H3: clic_plan (con el plan en "detalle")
// H2: se mide con la tabla registro_beta (cada fila es un registro)
function sesionId() {
  try {
    let id = sessionStorage.getItem("turnify_sesion");
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random();
      sessionStorage.setItem("turnify_sesion", id);
    }
    return id;
  } catch (e) {
    return "sin-sesion";
  }
}

const yaRegistrados = new Set();
function medir(tipo, detalle = "", unaVez = false) {
  if (unaVez) {
    if (yaRegistrados.has(tipo)) return;
    yaRegistrados.add(tipo);
  }
  if (!ACTIVAR_METRICAS || !supabaseListo) return;
  insertar("eventos_landing", { sesion: sesionId(), tipo, detalle }).catch(
    () => {},
  );
}

medir("visita", "", true);
setTimeout(() => medir("tiempo_30s", "", true), 30000);

// "Navegó toda la página": llegó al 90 % del alto del documento.
function revisarScroll() {
  const visto = window.scrollY + window.innerHeight;
  const total = document.documentElement.scrollHeight;
  if (visto / total >= 0.9) {
    medir("scroll_completo", "", true);
    window.removeEventListener("scroll", revisarScroll);
  }
}
window.addEventListener("scroll", revisarScroll, { passive: true });

document.querySelectorAll("[data-evento]").forEach((el) => {
  el.addEventListener("click", () =>
    medir(el.dataset.evento, el.dataset.detalle || ""),
  );
});

// 3) DEMO DEL PROTOTIPO --------------------------------------
const pantallas = [
  {
    img: "img/01-carga.png",
    etq: "Inicio",
    tit: "Pantalla de carga",
    desc: "Abres Turnify y estás listo en segundos.",
    alt: "Pantalla de carga de Turnify con el logotipo",
  },
  {
    img: "img/02-bienvenida.png",
    etq: "Inicio",
    tit: "Bienvenida",
    desc: "Inicia sesión o crea tu cuenta con un toque.",
    alt: "Pantalla de bienvenida con los botones Inicio de sesión y Crear cuenta",
  },
  {
    img: "img/03-paso1.png",
    etq: "Paso 1 de 4",
    tit: "Elige qué registrar",
    desc: "Un asistente te guía: registrar una cita o un pedido o reserva.",
    alt: "Paso 1 de 4: elegir entre registrar una cita o un pedido o reserva",
  },
  {
    img: "img/04-paso2.png",
    etq: "Paso 2 de 4",
    tit: "Selecciona al cliente",
    desc: "Busca por nombre y elige a tu cliente.",
    alt: "Paso 2 de 4: barra de búsqueda con el cliente Juan Perez",
  },
  {
    img: "img/05-paso3.png",
    etq: "Paso 3 de 4",
    tit: "Elige fecha y hora",
    desc: "Un calendario mensual y un selector de hora sencillo.",
    alt: "Paso 3 de 4: calendario de octubre de 2026 con el día 11 marcado",
  },
  {
    img: "img/06-paso4.png",
    etq: "Paso 4 de 4",
    tit: "¡Cita agendada!",
    desc: "La cita ya figura en el calendario y puedes ver tus compromisos del día.",
    alt: "Paso 4 de 4: cita agendada para Juan Perez el 11 de octubre a las 17:00",
  },
];

const demoImg = document.getElementById("demo-img");
const demoPasos = document.getElementById("demo-pasos");

pantallas.forEach((p, i) => {
  new Image().src = p.img; // precarga
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "paso-btn";
  boton.innerHTML =
    `<span class="paso-etq">${p.etq}</span>` +
    `<span class="paso-tit">${p.tit}</span>` +
    `<span class="paso-desc">${p.desc}</span>`;
  boton.addEventListener("click", () => mostrarPantalla(i, true));
  demoPasos.appendChild(boton);
});

function mostrarPantalla(i, porClic = false) {
  const p = pantallas[i];
  demoImg.src = p.img;
  demoImg.alt = p.alt;
  [...demoPasos.children].forEach((b, j) => {
    if (j === i) b.setAttribute("aria-current", "step");
    else b.removeAttribute("aria-current");
  });
  if (porClic) medir("demo_pantalla", p.etq + ": " + p.tit);
}
mostrarPantalla(0);

// 4) BOTONES DE PLAN (H3) ------------------------------------
const selectPlan = document.getElementById("plan_interes");
document.querySelectorAll("[data-plan]").forEach((boton) => {
  boton.addEventListener("click", () => {
    selectPlan.value = boton.dataset.plan;
    medir("clic_plan", boton.dataset.plan);
    document.getElementById("registro").scrollIntoView();
    setTimeout(
      () => document.getElementById("nombre").focus({ preventScroll: true }),
      400,
    );
  });
});

// 5) FORMULARIO (H2) -----------------------------------------
const form = document.getElementById("form-beta");
const exito = document.getElementById("exito");
const btnEnviar = document.getElementById("btn-enviar");
const errorGeneral = document.getElementById("error-general");

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function marcarError(id, mensaje) {
  const campo = document.getElementById(id);
  const caja = document.getElementById("error-" + id);
  caja.textContent = mensaje;
  if (mensaje) campo.setAttribute("aria-invalid", "true");
  else campo.removeAttribute("aria-invalid");
  return !mensaje;
}

function validar() {
  const nombre = form.nombre.value.trim();
  const correo = form.correo.value.trim();
  const negocio = form.tipo_negocio.value.trim();

  const resultados = [
    marcarError("nombre", nombre.length < 2 ? "Escribe tu nombre." : ""),
    marcarError(
      "correo",
      !correo
        ? "Escribe tu correo electrónico."
        : !REGEX_CORREO.test(correo)
          ? "Revisa tu correo: debe verse como nombre@ejemplo.com."
          : "",
    ),
    marcarError(
      "tipo_negocio",
      !negocio ? "Cuéntanos a qué se dedica tu negocio." : "",
    ),
    marcarError(
      "terminos",
      !form.terminos.checked ? "Acepta los términos para continuar." : "",
    ),
  ];
  return resultados.every(Boolean);
}

// Limpia el error de un campo apenas la persona lo corrige.
["nombre", "correo", "tipo_negocio", "terminos"].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener(id === "terminos" ? "change" : "input", () =>
    marcarError(id, ""),
  );
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorGeneral.textContent = "";

  if (!validar()) {
    const primero = form.querySelector('[aria-invalid="true"]');
    if (primero) primero.focus();
    return;
  }

  if (!supabaseListo) {
    errorGeneral.textContent =
      "Falta conectar Supabase: completa SUPABASE_URL y SUPABASE_ANON_KEY en script.js.";
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    try {
      const backendUrl = obtenerBackendUrl();
      const planTxt = form.plan_interes.value;
      let planId = 1;
      if (planTxt.indexOf("Pro") !== -1) planId = 2;
      else if (planTxt.indexOf("Business") !== -1) planId = 3;
      await fetch(backendUrl + "/api/Subscripciones/inscribir?correoElectronico=" + encodeURIComponent(form.correo.value.trim()) + "&planId=" + planId, { method: "POST" });
    } catch (e) { console.warn("Backend no alcanzable para autoinscribir:", e); }

    await insertar("registro_beta", {
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim().toLowerCase(),
      tipo_negocio: form.tipo_negocio.value.trim(),
      necesidad_principal: form.necesidad_principal.value.trim() || null,
      plan_interes: form.plan_interes.value,
    });
    form.hidden = true;
    exito.hidden = false;
    exito.focus();
    form.reset();
  } catch (err) {
    errorGeneral.textContent =
      "No pudimos guardar tu registro. Revisa tu conexión e inténtalo de nuevo.";
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Quiero acceso a la beta";
  }
});

// Diálogo de términos
const dialogo = document.getElementById("terminos-dialogo");
document
  .getElementById("abrir-terminos")
  .addEventListener("click", () => dialogo.showModal());
document
  .getElementById("cerrar-terminos")
  .addEventListener("click", () => dialogo.close());

// ============================================================
// PUNTO 1: ACCION PUT DESDE LANDING PAGE (TAREA FINAL)
// ============================================================
function obtenerBackendUrl() {
  const el = document.getElementById("url-backend");
  return (el && el.value ? el.value.trim() : "http://localhost:5039").replace(/\/+$/, "");
}

function mostrarAlertaAtencion(mensaje, tipo) {
  tipo = tipo || "info";
  const alerta = document.getElementById("alerta-atencion");
  if (!alerta) return;
  alerta.className = "alerta-msg alerta-" + tipo;
  alerta.textContent = mensaje;
  alerta.hidden = false;
}

function renderFichaSuscripcion(sub, codigoHttp) {
  const vacia = document.getElementById("ficha-vacia");
  const datos = document.getElementById("ficha-datos");
  if (vacia) vacia.hidden = true;
  if (datos) datos.hidden = false;
  document.getElementById("dato-contacto").textContent = sub.correoElectronico || sub.correo || sub.telefono || sub.identificador || "-";
  document.getElementById("dato-plan").textContent = sub.plan || "Free";
  const badge = document.getElementById("dato-estado");
  const est = sub.estado || sub.estadoActual || "Desconocido";
  badge.textContent = est;
  badge.className = "badge-estado badge-" + est.toLowerCase();
  const fIns = sub.fechaInscripcion ? new Date(sub.fechaInscripcion).toLocaleString("es-BO") : "-";
  const fAten = sub.fechaAtencion ? new Date(sub.fechaAtencion).toLocaleString("es-BO") : "(Pendiente de atencion)";
  document.getElementById("dato-fecha-ins").textContent = fIns;
  document.getElementById("dato-fecha-aten").textContent = fAten;
  document.getElementById("dato-http").textContent = codigoHttp;
}

const btnConsultar = document.getElementById("btn-consultar-antes");
if (btnConsultar) {
  btnConsultar.addEventListener("click", async function() {
    const id = document.getElementById("identificador-atender").value.trim();
    if (!id) {
      mostrarAlertaAtencion("Escribe un correo o telefono para consultar.", "error");
      return;
    }
    mostrarAlertaAtencion("Consultando estado en base de datos...", "info");
    const url = obtenerBackendUrl() + "/api/Subscripciones/consultar?identificador=" + encodeURIComponent(id);
    try {
      const resp = await fetch(url);
      const data = await resp.json().catch(function() { return {}; });
      if (resp.status === 200 && data.coincidencias && data.coincidencias.length > 0) {
        const sub = data.coincidencias[0];
        renderFichaSuscripcion(sub, "200 OK (" + data.coincidencias.length + " coincidencia)");
        mostrarAlertaAtencion("Inscripcion encontrada con estado '" + sub.estado + "'. Lista para ser atendida con el boton PUT.", "info");
      } else if (resp.status === 404) {
        mostrarAlertaAtencion("Error 404 (Not Found): No existe ninguna inscripcion registrada con '" + id + "'.", "error");
        document.getElementById("dato-http").textContent = "404 Not Found";
      } else if (resp.status === 409) {
        mostrarAlertaAtencion("Error 409 (Conflict): Existen multiples coincidencias para '" + id + "'.", "error");
        document.getElementById("dato-http").textContent = "409 Conflict";
      } else {
        mostrarAlertaAtencion("Respuesta del servidor (" + resp.status + "): " + (data.mensaje || "Error al consultar."), "error");
      }
    } catch (err) {
      mostrarAlertaAtencion("Error de conexion con el backend (" + obtenerBackendUrl() + "). Asegurate de que el microservicio este corriendo.", "error");
    }
  });
}

const btnPut = document.getElementById("btn-ejecutar-put");
if (btnPut) {
  btnPut.addEventListener("click", async function() {
    const id = document.getElementById("identificador-atender").value.trim();
    if (!id) {
      mostrarAlertaAtencion("Escribe un correo o telefono para atender.", "error");
      return;
    }
    mostrarAlertaAtencion("Invocando endpoint PUT /api/Subscripciones/atender...", "info");
    const url = obtenerBackendUrl() + "/api/Subscripciones/atender?identificador=" + encodeURIComponent(id);
    try {
      const resp = await fetch(url, { method: "PUT" });
      const data = await resp.json().catch(function() { return {}; });
      if (resp.status === 200) {
        renderFichaSuscripcion({
          identificador: id,
          correo: data.correo || id,
          telefono: data.telefono,
          plan: data.plan,
          estado: data.estadoActual || "Atendida",
          fechaInscripcion: data.fechaInscripcion || new Date().toISOString(),
          fechaAtencion: data.fechaAtencion || new Date().toISOString()
        }, "200 OK (PUT Ejecutado)");
        mostrarAlertaAtencion("Inscripcion Atendida con exito! Estado actualizado: " + (data.estadoAnterior || "Inscrita") + " -> " + (data.estadoActual || "Atendida") + ".", "exito");
      } else if (resp.status === 404) {
        mostrarAlertaAtencion("Error 404 (Not Found): No se encontro la inscripcion '" + id + "'. El metodo no afecto a ningun otro registro.", "error");
        const datos = document.getElementById("ficha-datos");
        if (datos) document.getElementById("dato-http").textContent = "404 Not Found";
      } else if (resp.status === 409) {
        mostrarAlertaAtencion("Error 409 (Conflict): " + (data.mensaje || "Existen multiples coincidencias o estado incompatible."), "error");
        const datos = document.getElementById("ficha-datos");
        if (datos) document.getElementById("dato-http").textContent = "409 Conflict";
      } else {
        mostrarAlertaAtencion("Error (" + resp.status + "): " + (data.mensaje || "No se pudo atender la inscripcion."), "error");
      }
    } catch (err) {
      mostrarAlertaAtencion("Error de conexion con el backend (" + obtenerBackendUrl() + "). Asegurate de que el microservicio este corriendo.", "error");
    }
  });
}

const btn404 = document.getElementById("btn-probar-404");
if (btn404) {
  btn404.addEventListener("click", function() {
    document.getElementById("identificador-atender").value = "inexistente.demo@turnify.com";
    if (btnPut) btnPut.click();
  });
}
