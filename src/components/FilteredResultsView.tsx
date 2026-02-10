import React from 'react';
import type { TreeNodeDelta, NodeId, ScanSummary } from '../types';
import { FORMAT_SIZE } from '../constants';

interface TreeNodeMap {
  [id: number]: TreeNodeDelta & { children: NodeId[] };
}

interface FilteredResultsViewProps {
  extension: string;
  onClearFilter: () => void;
  treeNodes: TreeNodeMap;
  summary: ScanSummary | null;
}

const FilteredResultsView: React.FC<FilteredResultsViewProps> = ({ extension, onClearFilter, treeNodes, summary: _summary }) => {
  // Filter files by extension
  const filteredFiles = React.useMemo(() => {
    const normalizedExt = extension.replace(/^\./, '').toLowerCase();
    return Object.values(treeNodes)
      .filter(node => node.kind === 'file' && node.file_ext?.toLowerCase() === normalizedExt)
      .sort((a, b) => b.size_bytes - a.size_bytes);
  }, [treeNodes, extension]);

  const totalSize = filteredFiles.reduce((sum, file) => sum + file.size_bytes, 0);
  const fileCount = filteredFiles.length;

  // Calculate category distribution (mock for now based on paths)
  const categories = React.useMemo(() => {
    const active = filteredFiles.filter(f => f.path.toLowerCase().includes('project') || f.path.toLowerCase().includes('work'));
    const archive = filteredFiles.filter(f => f.path.toLowerCase().includes('archive') || f.path.toLowerCase().includes('backup') || f.path.toLowerCase().includes('old'));
    const other = filteredFiles.filter(f => !active.includes(f) && !archive.includes(f));
    
    const activeSize = active.reduce((sum, f) => sum + f.size_bytes, 0);
    const archiveSize = archive.reduce((sum, f) => sum + f.size_bytes, 0);
    const otherSize = other.reduce((sum, f) => sum + f.size_bytes, 0);
    const total = totalSize || 1;
    
    return [
      { label: 'Active Projects', val: FORMAT_SIZE(activeSize), p: Math.round((activeSize / total) * 100) },
      { label: 'Archive/Legacy', val: FORMAT_SIZE(archiveSize), p: Math.round((archiveSize / total) * 100) },
      { label: 'Other Files', val: FORMAT_SIZE(otherSize), p: Math.round((otherSize / total) * 100) },
    ];
  }, [filteredFiles, totalSize]);

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark p-8 overflow-auto min-h-screen">
      <div className="max-w-[1400px] mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span className="hover:text-secondary cursor-pointer transition-colors">Workspace</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="hover:text-secondary cursor-pointer transition-colors">Media Library</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-secondary">.{extension.replace(/^\./, '')} Registry</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Filtered Assets: .{extension.replace(/^\./, '')}</h1>
            <p className="text-slate-500 font-medium">Isolating <span className="text-slate-900 dark:text-white font-bold">{fileCount.toLocaleString()} objects</span> representing <span className="text-secondary font-black">{FORMAT_SIZE(totalSize)}</span> of storage volume.</p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={onClearFilter} className="h-11 px-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">filter_list_off</span>
              Reset Filter
            </button>
            <button className="h-11 px-6 rounded-xl bg-secondary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-secondary/30 hover:brightness-110 transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">delete_forever</span>
              Purge Extension
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-panel-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center justify-between">
                Category Distribution
                <span className="material-symbols-outlined text-base">info</span>
              </h3>
              <div className="space-y-4">
                {categories.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="text-slate-400 font-mono">{item.val}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary transition-all" style={{ width: `${item.p}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-panel-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                 <span className="material-symbols-outlined text-3xl">security</span>
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">Storage Health Index</h4>
                <p className="text-slate-400 text-xs mt-1">This extension is optimally distributed across nodes.</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
             <div className="bg-white dark:bg-panel-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
               <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/10">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Matched Object Registry</h3>
               </div>
               <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="px-8 py-4">Filename</th>
                      <th className="px-8 py-4">Metric</th>
                      <th className="px-8 py-4">Path</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFiles.slice(0, 50).map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default">
                        <td className="px-8 py-5 flex items-center gap-4">
                          <span className="material-symbols-outlined text-secondary opacity-60 group-hover:opacity-100 transition-opacity">description</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate max-w-[200px]">{file.name}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">{FORMAT_SIZE(file.size_bytes)}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[11px] font-mono text-slate-400 truncate block max-w-[200px]">{file.path}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="material-symbols-outlined text-slate-300 hover:text-red-500 transition-colors">delete</button>
                        </td>
                      </tr>
                    ))}
                    {filteredFiles.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                          No files found with .{extension.replace(/^\./, '')} extension
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
               </div>
               {filteredFiles.length > 50 && (
                 <div className="px-8 py-4 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-slate-800 text-center">
                   <span className="text-xs text-slate-500">Showing first 50 of {filteredFiles.length} files</span>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilteredResultsView;
