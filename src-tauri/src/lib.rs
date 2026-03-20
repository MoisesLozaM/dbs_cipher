use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Emitter; // Necesario para poder usar window.emit()

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SearchResult {
    pub placa: String,
    pub ci: String,
    pub serie: String,
    pub motor: String,
    pub tipo: String,
    pub marca: String,
    pub color: String,
    pub modelo: String,
    pub base: String,
    pub status: String,
}

#[tauri::command]
async fn search_sqlite(
    window: tauri::Window,
    db_dir: String,
    placa: String,
    serie: String,
    motor: String,
) -> Result<(), String> {
    let entries = fs::read_dir(&db_dir).map_err(|e| format!("Error leyendo el directorio: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if ext == "db" || ext == "sqlite" || ext == "sqlite3" {
                    let conn = match Connection::open(&path) {
                        Ok(c) => c,
                        Err(_) => continue, // Ignora si no se puede abrir el archivo
                    };

                    let mut query = String::from("SELECT * FROM datosT WHERE 1=1");
                    let mut params = Vec::new();

                    if !placa.trim().is_empty() {
                        query.push_str(" AND placa LIKE ?");
                        params.push(format!("%{}%", placa.trim()));
                    }
                    if !serie.trim().is_empty() {
                        query.push_str(" AND serie LIKE ?");
                        params.push(format!("%{}%", serie.trim()));
                    }
                    if !motor.trim().is_empty() {
                        query.push_str(" AND motor LIKE ?");
                        params.push(format!("%{}%", motor.trim()));
                    }

                    let mut stmt = match conn.prepare(&query) {
                        Ok(s) => s,
                        Err(_) => continue, // Ignora si la base de datos no tiene la tabla
                    };

                    if let Ok(rows) = stmt.query_map(rusqlite::params_from_iter(params), |row| {
                        Ok(SearchResult {
                            placa: row.get(0).unwrap_or_default(),
                            ci:    row.get(1).unwrap_or_default(),
                            serie: row.get(2).unwrap_or_default(),
                            motor: row.get(3).unwrap_or_default(),
                            tipo:  row.get(4).unwrap_or_default(),
                            marca: row.get(5).unwrap_or_default(),
                            color: row.get(6).unwrap_or_default(),
                            modelo: row.get(7).unwrap_or_default(),
                            base: row.get(11).unwrap_or_default(),
                            status: row.get(12).unwrap_or_default(),
                        })
                    }) {
                        for r in rows {
                            if let Ok(v) = r {
                                // Emitimos el resultado en tiempo real al frontend
                                let _ = window.emit("search-result", &v);
                            }
                        }
                    };
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
async fn search_sqlcipher(
    window: tauri::Window,
    db_dir: String,
    key: String,
    placa: String,
    serie: String,
    motor: String,

) -> Result<(), String> {
    let entries = fs::read_dir(&db_dir).map_err(|e| format!("Error leyendo el directorio: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if ext == "db" || ext == "sqlite" || ext == "sqlite3" {
                    let conn = match Connection::open(&path) {
                        Ok(c) => c,
                        Err(_) => continue,
                    };

                    if conn.pragma_update(None, "key", &key).is_err() {
                        continue; // Ignorar si la contraseña es inválida
                    }

                    let mut query = String::from("SELECT * FROM datosT WHERE 1=1");
                    let mut params = Vec::new();

                    if !placa.trim().is_empty() {
                        query.push_str(" AND placa LIKE ?");
                        params.push(format!("%{}%", placa.trim()));
                    }
                    if !serie.trim().is_empty() {
                        query.push_str(" AND serie LIKE ?");
                        params.push(format!("%{}%", serie.trim()));
                    }
                    if !motor.trim().is_empty() {
                        query.push_str(" AND motor LIKE ?");
                        params.push(format!("%{}%", motor.trim()));
                    }

                    let mut stmt = match conn.prepare(&query) {
                        Ok(s) => s,
                        Err(_) => continue,
                    };

                    if let Ok(rows) = stmt.query_map(rusqlite::params_from_iter(params), |row| {
                        Ok(SearchResult {
                            placa: row.get(0).unwrap_or_default(),
                            ci:    row.get(1).unwrap_or_default(),
                            serie: row.get(2).unwrap_or_default(),
                            motor: row.get(3).unwrap_or_default(),
                            tipo:  row.get(4).unwrap_or_default(),
                            marca: row.get(5).unwrap_or_default(),
                            color: row.get(6).unwrap_or_default(),
                            modelo: row.get(7).unwrap_or_default(),
                            base: row.get(11).unwrap_or_default(),
                            status: row.get(12).unwrap_or_default(),
                        })
                    }) {
                        for r in rows {
                            if let Ok(v) = r {
                                // Emitimos el resultado cifrado individual
                                let _ = window.emit("search-result", &v);
                            }
                        }
                    };
                }
            }
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![search_sqlite, search_sqlcipher])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
