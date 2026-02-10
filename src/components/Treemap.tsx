import React, { useMemo, useState, useCallback } from 'react';
import type { TreeNodeDelta, NodeId } from '../types';
import { FORMAT_SIZE } from '../constants';

interface TreeNodeMap {
  [id: number]: TreeNodeDelta & { children: NodeId[] };
}

interface TreemapProps {
  treeNodes: TreeNodeMap;
  rootNodeId: NodeId | null;
  totalBytes: number;
  width: number;
  height: number;
  onNodeClick?: (node: TreeNodeDelta & { children: NodeId[] }) => void;
  onNodeRightClick?: (node: TreeNodeDelta & { children: NodeId[] }, e: React.MouseEvent) => void;
  highlightExtension?: string | null;
}

interface TreemapNode {
  id: NodeId;
  name: string;
  path: string;
  size: number;
  kind: 'file' | 'dir';
  ext: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  children: TreemapNode[];
}

// Color palette for extensions
const EXTENSION_COLORS: Record<string, string> = {
  // Video
  mp4: '#a855f7', mkv: '#a855f7', avi: '#a855f7', mov: '#a855f7', wmv: '#a855f7', flv: '#a855f7',
  // Audio
  mp3: '#ec4899', wav: '#ec4899', flac: '#ec4899', aac: '#ec4899', ogg: '#ec4899', m4a: '#ec4899',
  // Images
  jpg: '#3b82f6', jpeg: '#3b82f6', png: '#3b82f6', gif: '#3b82f6', webp: '#3b82f6', bmp: '#3b82f6', svg: '#3b82f6',
  // Documents
  pdf: '#f59e0b', doc: '#f59e0b', docx: '#f59e0b', xls: '#f59e0b', xlsx: '#f59e0b', ppt: '#f59e0b', pptx: '#f59e0b', txt: '#f59e0b',
  // Archives
  zip: '#22c55e', rar: '#22c55e', '7z': '#22c55e', tar: '#22c55e', gz: '#22c55e',
  // Code
  js: '#06b6d4', ts: '#06b6d4', jsx: '#06b6d4', tsx: '#06b6d4', py: '#06b6d4', rs: '#06b6d4', go: '#06b6d4', java: '#06b6d4', cpp: '#06b6d4', c: '#06b6d4', cs: '#06b6d4',
  // Executables
  exe: '#ef4444', dll: '#ef4444', msi: '#ef4444', bat: '#ef4444', sh: '#ef4444',
  // Data
  json: '#8b5cf6', xml: '#8b5cf6', csv: '#8b5cf6', sql: '#8b5cf6', db: '#8b5cf6',
};

const getColorForExtension = (ext: string | null): string => {
  if (!ext) return '#64748b';
  const normalizedExt = ext.toLowerCase().replace(/^\./, '');
  return EXTENSION_COLORS[normalizedExt] || '#64748b';
};

const getColorForFolder = (depth: number): string => {
  const colors = ['#1e40af', '#1e3a8a', '#172554', '#0c4a6e', '#164e63'];
  return colors[depth % colors.length];
};

// Squarified treemap layout algorithm
function squarify(
  nodes: { id: NodeId; size: number; data: TreeNodeDelta & { children: NodeId[] } }[],
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number
): TreemapNode[] {
  if (nodes.length === 0) return [];

  const totalSize = nodes.reduce((sum, n) => sum + n.size, 0);
  if (totalSize === 0) return [];

  const result: TreemapNode[] = [];
  let currentRow: typeof nodes = [];
  let currentX = x;
  let currentY = y;
  let remainingWidth = width;
  let remainingHeight = height;

  const aspect = (row: typeof nodes, w: number, h: number): number => {
    const rowSize = row.reduce((sum, n) => sum + n.size, 0);
    const totalArea = w * h;
    const rowArea = (rowSize / totalSize) * totalArea;
    const rowWidth = rowArea / (h || 1);
    
    let worst = 0;
    for (const node of row) {
      const nodeArea = (node.size / totalSize) * totalArea;
      const nodeHeight = nodeArea / (rowWidth || 1);
      const ratio = Math.max(rowWidth / (nodeHeight || 1), (nodeHeight || 1) / rowWidth);
      worst = Math.max(worst, ratio);
    }
    return worst;
  };

  for (const node of nodes) {
    const testRow = [...currentRow, node];
    const isHorizontal = remainingWidth >= remainingHeight;
    const currentAspect = currentRow.length > 0 ? aspect(currentRow, remainingWidth, remainingHeight) : Infinity;
    const newAspect = aspect(testRow, remainingWidth, remainingHeight);

    if (currentRow.length === 0 || newAspect <= currentAspect) {
      currentRow.push(node);
    } else {
      // Layout current row
      const rowSize = currentRow.reduce((sum, n) => sum + n.size, 0);
      const rowRatio = rowSize / totalSize;

      if (isHorizontal) {
        const rowWidth = remainingWidth * rowRatio;
        let nodeY = currentY;
        for (const rowNode of currentRow) {
          const nodeRatio = rowNode.size / rowSize;
          const nodeHeight = remainingHeight * nodeRatio;
          result.push({
            id: rowNode.id,
            name: rowNode.data.name,
            path: rowNode.data.path,
            size: rowNode.size,
            kind: rowNode.data.kind,
            ext: rowNode.data.file_ext,
            x: currentX,
            y: nodeY,
            width: rowWidth,
            height: nodeHeight,
            depth,
            children: [],
          });
          nodeY += nodeHeight;
        }
        currentX += rowWidth;
        remainingWidth -= rowWidth;
      } else {
        const rowHeight = remainingHeight * rowRatio;
        let nodeX = currentX;
        for (const rowNode of currentRow) {
          const nodeRatio = rowNode.size / rowSize;
          const nodeWidth = remainingWidth * nodeRatio;
          result.push({
            id: rowNode.id,
            name: rowNode.data.name,
            path: rowNode.data.path,
            size: rowNode.size,
            kind: rowNode.data.kind,
            ext: rowNode.data.file_ext,
            x: nodeX,
            y: currentY,
            width: nodeWidth,
            height: rowHeight,
            depth,
            children: [],
          });
          nodeX += nodeWidth;
        }
        currentY += rowHeight;
        remainingHeight -= rowHeight;
      }

      currentRow = [node];
    }
  }

  // Layout remaining row
  if (currentRow.length > 0) {
    const rowSize = currentRow.reduce((sum, n) => sum + n.size, 0);
    const isHorizontal = remainingWidth >= remainingHeight;

    if (isHorizontal) {
      let nodeY = currentY;
      for (const rowNode of currentRow) {
        const nodeRatio = rowNode.size / rowSize;
        const nodeHeight = remainingHeight * nodeRatio;
        result.push({
          id: rowNode.id,
          name: rowNode.data.name,
          path: rowNode.data.path,
          size: rowNode.size,
          kind: rowNode.data.kind,
          ext: rowNode.data.file_ext,
          x: currentX,
          y: nodeY,
          width: remainingWidth,
          height: nodeHeight,
          depth,
          children: [],
        });
        nodeY += nodeHeight;
      }
    } else {
      let nodeX = currentX;
      for (const rowNode of currentRow) {
        const nodeRatio = rowNode.size / rowSize;
        const nodeWidth = remainingWidth * nodeRatio;
        result.push({
          id: rowNode.id,
          name: rowNode.data.name,
          path: rowNode.data.path,
          size: rowNode.size,
          kind: rowNode.data.kind,
          ext: rowNode.data.file_ext,
          x: nodeX,
          y: currentY,
          width: nodeWidth,
          height: remainingHeight,
          depth,
          children: [],
        });
        nodeX += nodeWidth;
      }
    }
  }

  return result;
}

const Treemap: React.FC<TreemapProps> = ({
  treeNodes,
  rootNodeId,
  totalBytes: _totalBytes,
  width,
  height,
  onNodeClick,
  onNodeRightClick,
  highlightExtension,
}) => {
  const [hoveredNode, setHoveredNode] = useState<TreemapNode | null>(null);
  const [currentRoot, setCurrentRoot] = useState<NodeId | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: NodeId; name: string }[]>([]);

  const effectiveRoot = currentRoot ?? rootNodeId;

  // Build treemap layout
  const treemapNodes = useMemo(() => {
    if (!effectiveRoot || !treeNodes[effectiveRoot]) return [];

    const rootNode = treeNodes[effectiveRoot];
    const children = rootNode.children
      .map(id => treeNodes[id])
      .filter(Boolean)
      .sort((a, b) => b.size_bytes - a.size_bytes)
      .slice(0, 100); // Limit for performance

    const nodes = children.map(child => ({
      id: child.id,
      size: child.size_bytes,
      data: child,
    }));

    return squarify(nodes, 0, 0, width, height, 0);
  }, [effectiveRoot, treeNodes, width, height]);

  const handleNodeClick = useCallback((node: TreemapNode) => {
    const treeNode = treeNodes[node.id];
    if (!treeNode) return;

    if (treeNode.kind === 'dir' && treeNode.children.length > 0) {
      // Drill down into directory
      setBreadcrumbs(prev => [...prev, { id: node.id, name: node.name }]);
      setCurrentRoot(node.id);
    } else if (onNodeClick) {
      onNodeClick(treeNode);
    }
  }, [treeNodes, onNodeClick]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index === -1) {
      // Go to root
      setCurrentRoot(null);
      setBreadcrumbs([]);
    } else {
      const crumb = breadcrumbs[index];
      setCurrentRoot(crumb.id);
      setBreadcrumbs(prev => prev.slice(0, index + 1));
    }
  }, [breadcrumbs]);

  const getNodeOpacity = (node: TreemapNode): number => {
    if (!highlightExtension) return 1;
    const normalizedHighlight = highlightExtension.toLowerCase().replace(/^\./, '');
    const normalizedExt = node.ext?.toLowerCase().replace(/^\./, '') || '';
    return normalizedExt === normalizedHighlight ? 1 : 0.2;
  };

  return (
    <div className="relative w-full h-full">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 text-xs bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-white/70 hover:text-white transition-colors"
          >
            Root
          </button>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.id}>
              <span className="text-white/40">/</span>
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className={`transition-colors ${i === breadcrumbs.length - 1 ? 'text-secondary font-bold' : 'text-white/70 hover:text-white'}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {hoveredNode && (
        <div 
          className="absolute z-30 pointer-events-none bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm max-w-xs"
          style={{
            left: Math.min(hoveredNode.x + hoveredNode.width / 2, width - 200),
            top: Math.min(hoveredNode.y + hoveredNode.height / 2, height - 80),
          }}
        >
          <div className="font-bold truncate">{hoveredNode.name}</div>
          <div className="text-white/70 text-xs mt-1">{FORMAT_SIZE(hoveredNode.size)}</div>
          <div className="text-white/50 text-xs mt-0.5 truncate">{hoveredNode.path}</div>
          {hoveredNode.kind === 'dir' && (
            <div className="text-secondary text-xs mt-1">Click to drill down</div>
          )}
        </div>
      )}

      {/* Treemap nodes */}
      <svg width={width} height={height} className="rounded-lg overflow-hidden">
        {treemapNodes.map(node => {
          const color = node.kind === 'dir' 
            ? getColorForFolder(node.depth) 
            : getColorForExtension(node.ext);
          const opacity = getNodeOpacity(node);
          const isHovered = hoveredNode?.id === node.id;
          const minDimension = Math.min(node.width, node.height);
          const showLabel = minDimension > 30;
          const showSize = minDimension > 50;

          return (
            <g key={node.id}>
              <rect
                x={node.x + 1}
                y={node.y + 1}
                width={Math.max(0, node.width - 2)}
                height={Math.max(0, node.height - 2)}
                fill={color}
                opacity={opacity}
                rx={4}
                className="cursor-pointer transition-all duration-150"
                style={{
                  filter: isHovered ? 'brightness(1.2)' : undefined,
                  stroke: isHovered ? '#fff' : 'transparent',
                  strokeWidth: isHovered ? 2 : 0,
                }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const treeNode = treeNodes[node.id];
                  if (treeNode && onNodeRightClick) {
                    onNodeRightClick(treeNode, e);
                  }
                }}
              />
              {showLabel && (
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 - (showSize ? 6 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={Math.min(12, node.width / 8)}
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {node.name.length > 20 ? node.name.slice(0, 17) + '...' : node.name}
                </text>
              )}
              {showSize && (
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.7)"
                  fontSize={Math.min(10, node.width / 10)}
                  className="pointer-events-none select-none"
                >
                  {FORMAT_SIZE(node.size)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Empty state */}
      {treemapNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2">folder_off</span>
            <p>No data to display</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treemap;
