let channels = [];
let currentChannelIndex = 0;

// Lista de fuentes animadas con sus duraciones exactas en segundos
const fuentesAnimadas = [
  { id: "AMq-HkKA7s0", duracionTotal: 4401 },
  { id: "5PEpenrJbdo", duracionTotal: 9211 },
  { id: "vXz2bt8NPTE", duracionTotal: 3826 },
  { id: "bk_g8zadLd8", duracionTotal: 13621 },
  { id: "lQnMBKcBDbs", duracionTotal: 1327 },
  { id: "j9_uXGNky1A", duracionTotal: 11313 },
  { id: "U2oliAFLDwU", duracionTotal: 3636 },
  { id: "3ZnC4DTshc4", duracionTotal: 2215 },
  { id: "9WyEy9Dbrgw", duracionTotal: 662 },
  { id: "oSiOzmTYSPE", duracionTotal: 1369 },
  { id: "UheHTqGdV5A", duracionTotal: 1325 },
  { id: "7_QLQPI90OY", duracionTotal: 1188 },
  { id: "8RTMDHCLhZ8", duracionTotal: 905 },
  { id: "1W2QGaf-R68", duracionTotal: 1368 },
  { id: "fZkeiSX9rW0", duracionTotal: 1310 },
  { id: "0PKqa8iWjKk", duracionTotal: 1366 },
  { id: "Cq_WaMuB3TY", duracionTotal: 660 }  
];

// Lista de fuentes para el canal de Música (con tus nuevas fuentes agregadas)
const fuentesMusica = [

  { id: "0unH11yjklE", duracionTotal: 338 }, //Pearl Jam - Alive (From the BBC)
  { id: "3g1Tu2Ulrk0", duracionTotal: 321 }, //Pearl Jam - Jeremy (Live) - MTV Unplugged 
  { id: "OgeR2oqZGTs", duracionTotal: 258 }, //Nirvana - The Man Who Sold The World (Live On MTV Unplugged, 1993 / Unedited)
  { id: "qv96yJYhk3M", duracionTotal: 221 }, //Nirvana - You Know You're Right (LP Version)
  { id: "09839DpTctU", duracionTotal: 404 }, //Eagles - Hotel California (Live 1977)
  { id: "vbvyNnw8Qjg", duracionTotal: 144 }, //Queen - Bohemian Rhapsody (Live Aid 1985)
  { id: "h0ffIJ7ZO4U", duracionTotal: 266 }, //Dire Straits - Sultans Of Swing
  { id: "xwtdhWltSIg", duracionTotal: 293 }, //REM - Losing My Religion
  { id: "NUTGr5t3MoY", duracionTotal: 194 }, //Green Day - Basket Case
  { id: "i8dh9gDzmz8", duracionTotal: 179 }, //Green Day - When I Come Around
  { id: "eBG7P-K-r1Y", duracionTotal: 291 }, //Foo Fighters - Everlong
  { id: "SBjQ9tuuTJQ", duracionTotal: 270 }, //Foo Fighters - The Pretender
  { id: "NMNgbISmF4I", duracionTotal: 373 }, //Aerosmith - Crazy
  { id: "3mbBbFH9fAg", duracionTotal: 320 }, //Soundgarden - Black Hole Sun
  { id: "7QU1nvuxaMA", duracionTotal: 301 }, //Audioslave - Like a Stone 
  { id: "Abrn8aVQ76Q", duracionTotal: 265 }  //The Offspring - Self Esteem

];

// Memoria para el canal aleatorio de Animadas (Toons)
let toonsActiveVideo = null;
let toonsStartTime = null;
let toonsBaseSecond = 0;
let historialToons = [];

// Memoria para el canal aleatorio de Música
let musicActiveVideo = null;
let musicStartTime = null;
let musicBaseSecond = 0;
let historialMusica = [];

const MAX_HISTORIAL = 5;

let ytPlayer = null; // Instancia del reproductor de la API de YouTube
let activeRandomChannel = null; // Identifica qué canal aleatorio está activo ("TOONS" o "MUSIC")
let subtitlesEnabled = false;   // Estado de los subtítulos

const channelName = document.getElementById("channel-name");
const channelDesc = document.getElementById("channel-desc");
const channelListContainer = document.getElementById("channel-list-container");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnFullscreen = document.getElementById("btn-fullscreen"); // Referencia al botón de pantalla completa
const btnSubtitles = document.getElementById("btn-subtitles");   // Referencia al botón de subtítulos

// Elige un elemento al azar evitando repetir los últimos MAX_HISTORIAL IDs
function elegirAleatorioSinRepetirRecientes(lista, historial) {
  if (!lista || lista.length === 0) return null;
  if (lista.length === 1) return lista[0];

  const candidatos = lista.filter((item) => !historial.includes(item.id));

  let pool = candidatos;
  if (pool.length === 0) {
    const ultimoId = historial[historial.length - 1];
    pool = ultimoId ? lista.filter((item) => item.id !== ultimoId) : lista;
  }

  const elegido = pool[Math.floor(Math.random() * pool.length)];

  historial.push(elegido.id);
  if (historial.length > MAX_HISTORIAL) {
    historial.shift();
  }

  return elegido;
}

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
      toonsActiveVideo = elegirAleatorioSinRepetirRecientes(fuentesAnimadas, historialToons);
      toonsBaseSecond = Math.floor(Math.random() * toonsActiveVideo.duracionTotal);
      toonsStartTime = ahora; // <-- Corregido aquí
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
      musicActiveVideo = elegirAleatorioSinRepetirRecientes(fuentesMusica, historialMusica);
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
          // Aplicar subtítulos por defecto si ya estaban activados
          if (subtitlesEnabled && typeof ytPlayer.loadModule === 'function') {
            ytPlayer.loadModule("captions");
            ytPlayer.setOption("captions", "track", { languageCode: "es" });
          }
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
      toonsActiveVideo = elegirAleatorioSinRepetirRecientes(fuentesAnimadas, historialToons);
      toonsBaseSecond = 0;
      toonsStartTime = Date.now();

      ytPlayer.loadVideoById({
        videoId: toonsActiveVideo.id,
        startSeconds: 0
      });
    } else if (activeRandomChannel === "MUSIC" && fuentesMusica.length > 0) {
      console.log("El tema de Música terminó. Pasando al siguiente...");
      musicActiveVideo = elegirAleatorioSinRepetirRecientes(fuentesMusica, historialMusica);
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
  if (window.
