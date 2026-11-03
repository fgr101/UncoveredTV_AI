let channels = [];
let currentChannelIndex = 0;

// Lista de fuentes animadas con sus duraciones exactas en segundos
const fuentesAnimadas = [
  { id: "AMq-HkKA7s0", duracionTotal: 4401 },
  { id: "5PEpenrJbdo", duracionTotal: 9211 },
  { id: "vXz2bt8NPTE", duracionTotal: 3826 },
  { id: "bk_g8zadLd8", duracionTotal: 13621 },
  { id: "lQnMBKcBDbs&t=74s", duracionTotal: 1327 },
  { id: "j9_uXGNky1A", duracionTotal: 11313 },
  { id: "U2oliAFLDwU", duracionTotal: 3636 },
  { id: "3ZnC4DTshc4", duracionTotal: 2215 }
];

// Memoria para el canal aleatorio
let toonsActiveVideo = null;
let toonsStartTime = null;
let toonsBaseSecond = 0;

let ytPlayer = null; // Instancia del reproductor de la API de YouTube
let isToonsActive = false; // Bandera para saber si estamos viendo el canal aleatorio

const channelName = document.getElementById("channel-name");
const channelDesc = document.getElementById("channel-desc");
const channelListContainer = document.getElementById("channel-list-container");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");

// Cargar la API de YouTube de forma dinámica si no está cargada
function loadYouTubeAPI() {
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

// Esta función la llama automáticamente YouTube cuando la API está lista
window.onYouTubeIframeAPIReady = function() {
  initPlayer();
};

function initPlayer() {
  if (channels.length === 0) return;
  const targetChannel = channels[currentChannelIndex];
  let videoId = targetChannel.id;
  let startSec = 0;

  isToonsActive = (targetChannel.id === "TOONS_RANDOM");

  if (isToonsActive) {
    const ahora = Date.now();
    
    if (!toonsActiveVideo) {
      toonsActiveVideo = fuentesAnimadas[Math.floor(Math.random() * fuentesAnimadas.length)];
      toonsBaseSecond = Math.floor(Math.random() * toonsActiveVideo.duracionTotal);
      toonsStartTime = ahora;
    }

    const segundosTranscurridos = Math.floor((ahora - toonsStartTime) / 1000);
    startSec = toonsBaseSecond + segundosTranscurridos;

    if (startSec >= toonsActiveVideo.duracionTotal) {
      startSec = startSec % toonsActiveVideo.duracionTotal;
      toonsStartTime = ahora;
      toonsBaseSecond = startSec;
    }
    videoId = toonsActiveVideo.id;
  }

  // Si ya existe el reproductor, solo cargamos el nuevo video
  if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById({
      videoId: videoId,
      startSeconds: startSec
    });
  } else {
   // Creamos el reproductor por primera vez con los controles y títulos ocultos
    ytPlayer = new YT.Player('tv-player', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'enablejsapi': 1,
        'start': startSec,
        'controls': 0,        // Oculta los controles inferiores
        'disablekb': 1,       // Desactiva atajos de teclado
        'modestbranding': 1,  // Minimiza el logo
        'iv_load_policy': 3,  // Oculta anotaciones y elementos interactivos
        'showinfo': 0,        // Oculta información del video (según compatibilidad)
        'fs': 0,              // Oculta el botón de pantalla completa
        'rel': 0             // <--- ESTE ES CLAVE: Evita recomendaciones ajenas / "More videos"
      },
      events: {
        'onReady': (event) => {
          event.target.playVideo();
        },
        'onStateChange': onPlayerStateChange
      }
    });
  }

  // Actualizar información en pantalla
  channelName.textContent = targetChannel.name;
  channelDesc.textContent = targetChannel.desc;

  // Actualizar clase activa en la lista de botones
  const channelButtons = document.querySelectorAll(".channel-btn");
  channelButtons.forEach((btn, i) => {
    btn.classList.toggle("active", i === currentChannelIndex);
  });
}

// Evento que se dispara cuando cambia el estado del video de YouTube
function onPlayerStateChange(event) {
  // El estado 0 significa que el video terminó (YT.PlayerState.ENDED)
  if (event.data === 0 && isToonsActive) {
    console.log("El video de Toons terminó. Pasando al siguiente automáticamente...");
    
    // Elegimos un NUEVO video al azar de la lista
    toonsActiveVideo = fuentesAnimadas[Math.floor(Math.random() * fuentesAnimadas.length)];
    toonsBaseSecond = 0; // Arranca desde el principio
    toonsStartTime = Date.now();

    // Cargamos el nuevo video en el reproductor
    ytPlayer.loadVideoById({
      videoId: toonsActiveVideo.id,
      startSeconds: 0
    });
  }
}

// Cargar canal según el índice
function loadChannel(index) {
  if (channels.length === 0) return;
  currentChannelIndex = index;

  // Si la API ya está lista, reutilizamos el reproductor
  if (window.YT && window.YT.Player && ytPlayer) {
    initPlayer();
  } else {
    // Si recién arranca la app, cargamos la API
    loadYouTubeAPI();
  }
}

function nextChannel() {
  if (channels.length === 0) return;
  let nextIndex = (currentChannelIndex + 1) % channels.length;
  loadChannel(nextIndex);
}

function prevChannel() {
  if (channels.length === 0) return;
  let prevIndex = (currentChannelIndex - 1 + channels.length) % channels.length;
  loadChannel(prevIndex);
}

// Renderizar dinámicamente los botones en la lista de navegación
function renderChannelList() {
  channelListContainer.innerHTML = "";

  channels.forEach((channel, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    
    button.classList.add("channel-btn");
    button.textContent = channel.name;
    button.addEventListener("click", () => loadChannel(index));

    li.appendChild(button);
    channelListContainer.appendChild(li);
  });
}

// Obtener datos desde el archivo externo JSON
async function initApp() {
  try {
    const response = await fetch("canales.json");
    if (!response.ok) {
      throw new Error(`Error al cargar canales: ${response.status}`);
    }
    channels = await response.json();

    if (channels.length > 0) {
      renderChannelList();
      loadChannel(0); // Cargar el primer canal por defecto
    } else {
      channelName.textContent = "No hay canales disponibles";
    }
  } catch (error) {
    console.error("Error al inicializar la lista de canales:", error);
    channelName.textContent = "Error al cargar canales";
    channelDesc.textContent = "Verifica que el archivo canales.json exista y sea válido.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();

  // Controles de botones físicos / interfaz
  btnNext.addEventListener("click", nextChannel);
  btnPrev.addEventListener("click", prevChannel);

  // Zapping por teclado (flechas)
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      nextChannel();
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      prevChannel();
    }
  });
});
