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
  { id: "3ZnC4DTshc4", duracionTotal: 2215 },
  { id: "9WyEy9Dbrgw", duracionTotal: 662 },
  { id: "oSiOzmTYSPE", duracionTotal: 1369 },
  { id: "UheHTqGdV5A", duracionTotal: 1325 }
];

// Lista de fuentes para el canal de Música (IDs limpios sin parámetros extra de listas)
const fuentesMusica = [
  { id: "0unH11yjklE", duracionTotal: 338 },
  { id: "3g1Tu2Ulrk0", duracionTotal: 321 },
  { id: "OgeR2oqZGTs", duracionTotal: 258 },
  { id: "09839DpTctU", duracionTotal: 404 },
  { id: "vbvyNnw8Qjg", duracionTotal: 144 }
];

// Memoria para el canal aleatorio de Animadas (Toons)
let toonsActiveVideo = null;
let toonsStartTime = null;
let toonsBaseSecond = 0;

// Memoria para el canal aleatorio de Música
let musicActiveVideo = null;
let musicStartTime = null;
let musicBaseSecond = 0;

let ytPlayer = null; // Instancia del reproductor de la API de YouTube
let activeRandomChannel = null; // Identifica qué canal aleatorio está activo ("TOONS" o "MUSIC")

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

  // Identificar el tipo de canal actual
  activeRandomChannel = null;

  if (targetChannel.id === "TOONS_RANDOM") {
    activeRandomChannel = "TOONS";
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

  } else if (targetChannel.id === "MUSIC_RANDOM") {
    activeRandomChannel = "MUSIC";
    const ahora = Date.now();
    
    if (!musicActiveVideo && fuentesMusica.length > 0) {
      musicActiveVideo = fuentesMusica[Math.floor(Math.random() * fuentesMusica.length)];
      musicBaseSecond = Math.floor(Math.random() * musicActiveVideo.duracionTotal);
      musicStartTime = ahora;
    }

    if (musicActiveVideo) {
      const segundosTranscurridos = Math.floor((ahora - musicStartTime) / 1000);
      startSec = musicBaseSecond + segundosTranscurridos;

      if (startSec >= musicActiveVideo.duracionTotal) {
        startSec = startSec % musicActiveVideo.duracionTotal;
        musicStartTime = ahora;
        musicBaseSecond = startSec;
      }
      videoId = musicActiveVideo.id;
    }
  }

  // Si ya existe el reproductor, solo cargamos el nuevo video
  if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById({
      videoId: videoId,
      startSeconds: startSec
    });
  } else {
   // Creamos el reproductor por primera vez
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
        'showinfo': 0,        // Oculta información del video
        'fs': 0,              // Oculta el botón de pantalla completa
        'rel': 0              // Evita recomendaciones ajenas
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
  if (event.data === 0) {
    if (activeRandomChannel === "TOONS") {
      console.log("El video de Toons terminó. Pasando al siguiente...");
      toonsActiveVideo = fuentesAnimadas[Math.floor(Math.random() * fuentesAnimadas.length)];
      toonsBaseSecond = 0;
      toonsStartTime = Date.now();

      ytPlayer.loadVideoById({
        videoId: toonsActiveVideo.id,
        startSeconds: 0
      });
    } else if (activeRandomChannel === "MUSIC" && fuentesMusica.length > 0) {
      console.log("El tema de Música terminó. Pasando al siguiente...");
      musicActiveVideo = fuentesMusica[Math.floor(Math.random() * fuentesMusica.length)];
      musicBaseSecond = 0;
      musicStartTime = Date.now();

      ytPlayer.loadVideoById({
        videoId: musicActiveVideo.id,
        startSeconds: 0
      });
    }
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

  // Zapping por teclado (flechas y tecla R para canal aleatorio)
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      nextChannel();
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      prevChannel();
    } else if (event.key.toLowerCase() === "r") {
      if (channels.length > 0) {
        const randomIndex = Math.floor(Math.random() * channels.length);
        loadChannel(randomIndex);
        console.log("¡Canal al azar sintonizado con la tecla R!");
      }
    }
  });
});
