const { invoke } = window.__TAURI__.core;

let plateInputEl;
let seriesInputEl;
let motorInputEl;
let keyInputEl;
let msgEl;

// Variable en memoria para almacenar la llave
let currentKey = "";

async function searchData() {
  const plate = plateInputEl.value;
  const series = seriesInputEl.value;
  const motor = motorInputEl.value;

  // Validamos si ya se desbloqueó la base de datos
  if (!currentKey) {
    msgEl.textContent = "Por favor, ingresa la llave y presiona 'Desbloquear' primero.";
    return;
  }

  try {
    // Puedes cambiar a "search_sqlcipher" pasándole 'key: "tuclavesecreta"' si tu base es cifrada
    // Reemplaza "/ruta/a/tu/base.db" por la ruta real a tu base de datos
    const results = await invoke("search_sqlcipher", {
      dbPath: "../dbs/base_sac.db",
      key: currentKey,
      placa: plate,
      serie: series,
      motor: motor
    });

    // Mostramos resultados de forma simple, aquí puedes iterar sobre "results" y crear HTML
    msgEl.innerHTML = `<pre>${JSON.stringify(results, null, 2)}</pre>`;
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
