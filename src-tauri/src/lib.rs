use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchResult {
    pub placa: String,
    pub serie: String,
    pub motor: String,
}

#[tauri::command]
fn search_sqlite(
    db_path: &str,
    placa: &str,
    serie: &str,
    motor: &str,
) -> Result<Vec<SearchResult>, String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Asume que tienes una tabla llamada "vehicles", cambialo de acuerdo a tu esquema real
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

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params), |row| {
            Ok(SearchResult {
                placa: row.get(0).unwrap_or_default(),
                serie: row.get(2).unwrap_or_default(),
                motor: row.get(3).unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for r in rows {
        if let Ok(v) = r {
            results.push(v);
        }
    }
    Ok(results)
}

#[tauri::command]
fn search_sqlcipher(
    db_path: &str,
    key: &str,
    placa: &str,
    serie: &str,
    motor: &str,
) -> Result<Vec<SearchResult>, String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let _ = conn
        .pragma_update(None, "key", &key)
        .map_err(|e| e.to_string())?;

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

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params), |row| {
            Ok(SearchResult {
                placa: row.get(0).unwrap_or_default(),
                serie: row.get(2).unwrap_or_default(),
                motor: row.get(3).unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for r in rows {
        if let Ok(v) = r {
            results.push(v);
        }
    }
    Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![search_sqlite, search_sqlcipher])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
