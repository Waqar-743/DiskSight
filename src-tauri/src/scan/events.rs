use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::scan::model::{NodeId, ScanSummary, TreeNodeDelta};

pub const EVENT_STARTED: &str = "scan://started";
pub const EVENT_PROGRESS: &str = "scan://progress";
pub const EVENT_PARTIAL_TREE: &str = "scan://partial-tree";
pub const EVENT_FINISHED: &str = "scan://finished";
pub const EVENT_ERROR: &str = "scan://error";
pub const EVENT_CANCELED: &str = "scan://canceled";

#[derive(Clone, Debug, Serialize)]
pub struct StartedPayload {
    pub scan_id: String,
    pub root_path: String,
    pub started_at: u64,
}

#[derive(Clone, Debug, Serialize)]
pub struct ProgressPayload {
    pub scan_id: String,
    pub visited_entries: u64,
    pub visited_bytes_approx: u64,
    pub current_path: String,
    pub phase: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct PartialTreePayload {
    pub scan_id: String,
    pub nodes: Vec<TreeNodeDelta>,
    pub updated_at: u64,
}

#[derive(Clone, Debug, Serialize)]
pub struct FinishedPayload {
    pub scan_id: String,
    pub summary: ScanSummary,
    pub root_node_id: NodeId,
    pub finished_at: u64,
}

#[derive(Clone, Debug, Serialize)]
pub struct ErrorPayload {
    pub scan_id: String,
    pub message: String,
    pub path: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct CanceledPayload {
    pub scan_id: String,
}

pub fn emit_started(handle: &AppHandle, payload: StartedPayload) {
    let _ = handle.emit(EVENT_STARTED, payload);
}

pub fn emit_progress(handle: &AppHandle, payload: ProgressPayload) {
    let _ = handle.emit(EVENT_PROGRESS, payload);
}

pub fn emit_partial_tree(handle: &AppHandle, payload: PartialTreePayload) {
    let _ = handle.emit(EVENT_PARTIAL_TREE, payload);
}

pub fn emit_finished(handle: &AppHandle, payload: FinishedPayload) {
    let _ = handle.emit(EVENT_FINISHED, payload);
}

pub fn emit_error(handle: &AppHandle, payload: ErrorPayload) {
    let _ = handle.emit(EVENT_ERROR, payload);
}

pub fn emit_canceled(handle: &AppHandle, payload: CanceledPayload) {
    let _ = handle.emit(EVENT_CANCELED, payload);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scan::model::{ExtensionStat, ScanSummary};

    #[test]
    fn payloads_serialize() {
        let started = StartedPayload {
            scan_id: "scan-1".to_string(),
            root_path: "C:/".to_string(),
            started_at: 123,
        };
        let progress = ProgressPayload {
            scan_id: "scan-1".to_string(),
            visited_entries: 10,
            visited_bytes_approx: 1024,
            current_path: "C:/".to_string(),
            phase: "walking".to_string(),
        };
        let partial = PartialTreePayload {
            scan_id: "scan-1".to_string(),
            nodes: Vec::new(),
            updated_at: 456,
        };
        let finished = FinishedPayload {
            scan_id: "scan-1".to_string(),
            summary: ScanSummary {
                total_bytes: 1024,
                total_files: 1,
                total_dirs: 1,
                extension_stats: vec![ExtensionStat {
                    ext: "txt".to_string(),
                    bytes: 1024,
                    count: 1,
                }],
            },
            root_node_id: 1,
            finished_at: 789,
        };
        let error = ErrorPayload {
            scan_id: "scan-1".to_string(),
            message: "oops".to_string(),
            path: None,
        };
        let canceled = CanceledPayload {
            scan_id: "scan-1".to_string(),
        };

        let _ = serde_json::to_string(&started).expect("started serialize");
        let _ = serde_json::to_string(&progress).expect("progress serialize");
        let _ = serde_json::to_string(&partial).expect("partial serialize");
        let _ = serde_json::to_string(&finished).expect("finished serialize");
        let _ = serde_json::to_string(&error).expect("error serialize");
        let _ = serde_json::to_string(&canceled).expect("canceled serialize");
    }
}
