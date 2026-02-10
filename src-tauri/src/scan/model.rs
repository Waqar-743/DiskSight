use serde::{Deserialize, Serialize};

pub type NodeId = u64;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScanOptions {
    #[serde(default)]
    pub follow_symlinks: bool,
    #[serde(default)]
    pub one_file_system: bool,
    #[serde(default)]
    pub max_depth: Option<u32>,
    #[serde(default)]
    pub exclude_patterns: Vec<String>,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            follow_symlinks: false,
            one_file_system: false,
            max_depth: None,
            exclude_patterns: Vec::new(),
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NodeKind {
    File,
    Dir,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TreeNode {
    pub id: NodeId,
    pub parent: Option<NodeId>,
    pub name: String,
    pub path: String,
    pub kind: NodeKind,
    pub size_bytes: u64,
    pub file_ext: Option<String>,
    pub children: Vec<NodeId>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TreeNodeDelta {
    pub id: NodeId,
    pub parent: Option<NodeId>,
    pub name: String,
    pub path: String,
    pub kind: NodeKind,
    pub size_bytes: u64,
    pub file_ext: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ExtensionStat {
    pub ext: String,
    pub bytes: u64,
    pub count: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub scan_id: String,
    pub root_id: NodeId,
    pub total_bytes: u64,
    pub total_files: u64,
    pub total_dirs: u64,
    pub extension_stats: Vec<ExtensionStat>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScanSummary {
    pub total_bytes: u64,
    pub total_files: u64,
    pub total_dirs: u64,
    pub extension_stats: Vec<ExtensionStat>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScanHandle {
    pub scan_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RootEntry {
    pub name: String,
    pub path: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
}
