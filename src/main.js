const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

let plateInputEl;
let seriesInputEl;
let motorInputEl;
let keyInputEl;
let msgEl;

// Variable en memoria para almacenar la llave
let currentKey = "";

const razonDesplazamientoNumeros = 5;
const razonDesplazamientoLetras = 7;

async function searchData() {
  const plate = plateInputEl.value;
  const series = seriesInputEl.value;
  const motor = motorInputEl.value;

  if (!currentKey) {
    msgEl.textContent = "Por favor, ingresa la llave y presiona 'Desbloquear' primero.";
    return;
  }

  if (!plate && !series && !motor) {
    msgEl.textContent = "Por favor, ingresa al menos una placa, serie o motor.";
    return;
  }

  try {
    const encryptedPlate = encryptCaesar(plate, razonDesplazamientoNumeros, razonDesplazamientoLetras);
    const encryptedSeries = encryptCaesar(series, razonDesplazamientoNumeros, razonDesplazamientoLetras);
    const encryptedMotor = encryptCaesar(motor, razonDesplazamientoNumeros, razonDesplazamientoLetras);

    // Indicador de que inició la búsqueda
    msgEl.innerHTML = `<em>Buscando coincidencias...</em>`;

    let resultsCount = 0;
    let resultsHtml = ""; // Variable para ir acumulando las cards

    // Empezamos a escuchar los eventos provenientes del backend
    const unlisten = await listen("search-result", (event) => {
      resultsCount++;
      const item = event.payload;
      console.log(item)
      // Desciframos el objeto que acaba de llegar
      const decryptedItem = {
        ...item,
        placa: decryptCaesar(item.placa, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        ci: decryptCaesar(item.ci, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        serie: decryptCaesar(item.serie, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        motor: decryptCaesar(item.motor, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        tipo: decryptCaesar(item.tipo, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        marca: decryptCaesar(item.marca, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        color: decryptCaesar(item.color, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        modelo: decryptCaesar(item.modelo, razonDesplazamientoNumeros, razonDesplazamientoLetras),
        base: item.base,
        status: item.status
      };

      // Construimos el HTML de la card accediendo a los apartados del JSON
      const cardHtml = `
        <div class="result-card">
          <div class="card-field"><span class="card-label">Placa</span><span class="card-value">${decryptedItem.placa || '-'}</span></div>
          <div class="card-field"><span class="card-label">CI</span><span class="card-value">${decryptedItem.ci || '-'}</span></div>
          <div class="card-field"><span class="card-label">Serie</span><span class="card-value">${decryptedItem.serie || '-'}</span></div>
          <div class="card-field"><span class="card-label">Motor</span><span class="card-value">${decryptedItem.motor || '-'}</span></div>
          <div class="card-field"><span class="card-label">Tipo</span><span class="card-value">${decryptedItem.tipo || '-'}</span></div>
          <div class="card-field"><span class="card-label">Marca</span><span class="card-value">${decryptedItem.marca || '-'}</span></div>
          <div class="card-field"><span class="card-label">Color</span><span class="card-value">${decryptedItem.color || '-'}</span></div>
          <div class="card-field"><span class="card-label">Modelo</span><span class="card-value">${decryptedItem.modelo || '-'}</span></div>
          <div class="card-field"><span class="card-label">Base</span><span class="card-value">${decryptedItem.base || '-'}</span></div>
          <div class="card-field"><span class="card-label">Status</span><span class="card-value">${decryptedItem.status || '-'}</span></div>
        </div>
      `;
      resultsHtml += cardHtml;
      // Actualizamos la UI inmediatamente tras cada llegada
      msgEl.innerHTML = `<div class="results-container">${resultsHtml}</div>`;
    });

    // Ejecutamos la búsqueda. El await terminará solo cuando inspeccione todas las DBs.
    await invoke("search_sqlcipher", {
      dbDir: "../dbs",
      key: currentKey,
      placa: encryptedPlate,
      serie: encryptedSeries,
      motor: encryptedMotor
    });

    // Ya terminó de iterar las bases de datos.
    unlisten(); // Dejamos de escuchar eventos para ahorrar memoria.

    if (resultsCount === 0) {
      msgEl.textContent = "Búsqueda finalizada: No se encontraron resultados.";
    }
  } catch (e) {
    msgEl.textContent = "Error: " + e;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  plateInputEl = document.querySelector("#data-vc-input-plate");
  seriesInputEl = document.querySelector("#data-vc-input-series");
  motorInputEl = document.querySelector("#data-vc-input-motor");
  keyInputEl = document.querySelector("#data-vc-input-key");
  msgEl = document.querySelector("#data-vc-msg");

  document.querySelector("#data-vc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    searchData();
  });

  // Listener para el botón de desbloquear
  document.querySelector("#data-vc-btn-unlock").addEventListener("click", () => {
    if (keyInputEl.value.trim() !== "") {
      currentKey = keyInputEl.value; // Guardamos en memoria
      msgEl.textContent = "Llave guardada en memoria. Base de datos lista para consultar.";
      keyInputEl.value = ""; // Borramos el campo por seguridad visual
    } else {
      msgEl.textContent = "Por favor, ingresa una llave antes de desbloquear.";
    }
  });

  document.querySelector("#data-vc-btn-clear").addEventListener("click", () => {
    plateInputEl.value = "";
    seriesInputEl.value = "";
    motorInputEl.value = "";
  })
});

// Función auxiliar para aplicar el cifrado César
function encryptCaesar(str, shiftNumbers, shiftLetters) {
  if (!str) return str;
  let result = "";

  for (let i = 0; i < str.length; i++) {
    let c = str[i];
    if (c.match(/[a-z]/)) {
      let code = ((str.charCodeAt(i) - 97 + shiftLetters) % 26);
      result += String.fromCharCode(code + 97);
    } else if (c.match(/[A-Z]/)) {
      let code = ((str.charCodeAt(i) - 65 + shiftLetters) % 26);
      result += String.fromCharCode(code + 65);
    } else if (c.match(/[0-9]/)) {
      let code = ((str.charCodeAt(i) - 48 + shiftNumbers) % 10);
      result += String.fromCharCode(code + 48);
    } else {
      result += c; // Los demás caracteres (guiones, espacios) se quedan igual
    }
  }
  return result;
}

// Función auxiliar para revertir el cifrado César
function decryptCaesar(str, shiftNumbers, shiftLetters) {
  if (!str) return str;
  let result = "";

  for (let i = 0; i < str.length; i++) {
    let c = str[i];
    if (c.match(/[a-z]/)) {
      let code = ((str.charCodeAt(i) - 97 - shiftLetters) % 26);
      result += String.fromCharCode((code < 0 ? code + 26 : code) + 97);
    } else if (c.match(/[A-Z]/)) {
      let code = ((str.charCodeAt(i) - 65 - shiftLetters) % 26);
      result += String.fromCharCode((code < 0 ? code + 26 : code) + 65);
    } else if (c.match(/[0-9]/)) {
      let code = ((str.charCodeAt(i) - 48 - shiftNumbers) % 10);
      result += String.fromCharCode((code < 0 ? code + 10 : code) + 48);
    } else {
      result += c; // Los demás caracteres (guiones, espacios) se quedan igual
    }
  }
  return result;
}

function revealResults(results, shiftNumbers, shiftLetters) {
  return results.map(item => ({
    ...item,
    placa: decryptCaesar(item.placa, shiftNumbers, shiftLetters),
    serie: decryptCaesar(item.serie, shiftNumbers, shiftLetters),
    motor: decryptCaesar(item.motor, shiftNumbers, shiftLetters)
  }));
}