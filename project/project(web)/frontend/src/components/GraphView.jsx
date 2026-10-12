import React, { useState, useMemo } from 'react';
import { Zap, Info } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

export default function GraphView({
  nodes = [],
  edges = [],
  criticalEdges = [],
  criticalPath = []
}) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Compute layered layout (DAG levels)
  const layout = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return { positions: {}, width: 600, height: 300, levels: [] };
    }

    // Map of nodeId -> node
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Calculate level (depth) for each node based on predecessors
    const levels = new Map();
    const successorsMap = new Map();
    const predecessorsMap = new Map();

    nodes.forEach(n => {
      successorsMap.set(n.id, []);
      predecessorsMap.set(n.id, []);
    });

    edges.forEach(e => {
      if (successorsMap.has(e.from)) successorsMap.get(e.from).push(e.to);
      if (predecessorsMap.has(e.to)) predecessorsMap.get(e.to).push(e.from);
    });

    // Compute level using longest distance from any source
    function computeDepth(id, visited = new Set()) {
      if (levels.has(id)) return levels.get(id);
      if (visited.has(id)) return 0; // prevent cycle hang
      visited.add(id);

      const preds = predecessorsMap.get(id) || [];
      if (preds.length === 0) {
        levels.set(id, 0);
        return 0;
      }

      let maxPredDepth = 0;
      preds.forEach(pId => {
        maxPredDepth = Math.max(maxPredDepth, computeDepth(pId, visited) + 1);
      });

      levels.set(id, maxPredDepth);
      return maxPredDepth;
    }

    nodes.forEach(n => computeDepth(n.id));

    // Group nodes by level
    const maxLevel = Math.max(0, ...Array.from(levels.values()));
    const levelBuckets = Array.from({ length: maxLevel + 1 }, () => []);

    nodes.forEach(n => {
      const lvl = levels.get(n.id) || 0;
      levelBuckets[lvl].push(n);
    });

    // Compute (x, y) coordinates
    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 64;
    const LEVEL_SPACING = 240;
    const ROW_SPACING = 90;
    const PADDING_X = 60;
    const PADDING_Y = 60;

    let maxNodesInLevel = 1;
    levelBuckets.forEach(b => {
      if (b.length > maxNodesInLevel) maxNodesInLevel = b.length;
    });

    const totalWidth = Math.max(780, (maxLevel + 1) * LEVEL_SPACING + PADDING_X * 2);
    const totalHeight = Math.max(380, maxNodesInLevel * ROW_SPACING + PADDING_Y * 2);

    const positions = {};

    levelBuckets.forEach((bucket, levelIdx) => {
      const x = PADDING_X + levelIdx * LEVEL_SPACING;
      const count = bucket.length;
      const totalColHeight = count * ROW_SPACING;
      const startY = (totalHeight - totalColHeight) / 2 + ROW_SPACING / 2;

      bucket.forEach((node, rowIdx) => {
        const y = startY + rowIdx * ROW_SPACING;
        positions[node.id] = { x, y, level: levelIdx };
      });
    });

    return {
      positions,
      width: totalWidth,
      height: totalHeight,
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT
    };
  }, [nodes, edges]);

  // Set of critical edge keys: "fromId->toId"
  const criticalEdgeSet = useMemo(() => {
    const set = new Set();
    criticalEdges.forEach(e => set.add(`${e.from}->${e.to}`));
    edges.forEach(e => {
      if (e.isCritical) set.add(`${e.from}->${e.to}`);
    });
    return set;
  }, [criticalEdges, edges]);

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No tasks to visualize. Add tasks and dependencies to see the directed graph.
      </div>
    );
  }

  const { positions, width, height, nodeWidth, nodeHeight } = layout;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Graph Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '20px', height: '3px', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontWeight: 600, color: 'var(--critical-red)' }}>Critical Path (Zero Slack)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '20px', height: '2px', background: '#94a3b8', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>Standard Dependency</span>
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Hover over nodes to inspect Earliest Start (ES), Earliest Finish (EF), and Slack
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        className="graph-container"
        style={{ overflowX: 'auto', overflowY: 'hidden', padding: '1rem' }}
      >
        <svg
          width={width}
          height={height}
          style={{ display: 'block', minWidth: '100%' }}
        >
          <defs>
            {/* Standard Arrow Marker */}
            <marker
              id="arrow-standard"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <polygon points="0 1, 8 4, 0 7" fill="#94a3b8" />
            </marker>

            {/* Critical Arrow Marker */}
            <marker
              id="arrow-critical"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <polygon points="0 1.5, 9 4.5, 0 7.5" fill="#ef4444" />
            </marker>

            {/* Glowing filter for critical elements */}
            <filter id="critical-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Directed Edges */}
          {edges.map((edge) => {
            const pFrom = positions[edge.from];
            const pTo = positions[edge.to];
            if (!pFrom || !pTo) return null;

            const isCritical = criticalEdgeSet.has(`${edge.from}->${edge.to}`);

            // Start from right center of 'from' node, end at left center of 'to' node
            const startX = pFrom.x + nodeWidth;
            const startY = pFrom.y;
            const endX = pTo.x;
            const endY = pTo.y;

            // Curved cubic bezier
            const controlOffsetX = Math.max(40, (endX - startX) / 2);
            const pathData = `M ${startX} ${startY} C ${startX + controlOffsetX} ${startY}, ${endX - controlOffsetX} ${endY}, ${endX} ${endY}`;

            return (
              <path
                key={edge.id || `${edge.from}-${edge.to}`}
                d={pathData}
                fill="none"
                stroke={isCritical ? '#ef4444' : '#94a3b8'}
                strokeWidth={isCritical ? '3' : '2'}
                strokeDasharray={isCritical ? 'none' : 'none'}
                markerEnd={isCritical ? 'url(#arrow-critical)' : 'url(#arrow-standard)'}
                filter={isCritical ? 'url(#critical-glow)' : 'none'}
                style={{ transition: 'stroke 0.2s ease' }}
              />
            );
          })}

          {/* Vertex Nodes */}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;

            const isCritical = node.isCritical;
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y - nodeHeight / 2})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Box */}
                <rect
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="10"
                  fill={isCritical ? '#ffffff' : '#ffffff'}
                  stroke={isCritical ? '#ef4444' : '#cbd5e1'}
                  strokeWidth={isCritical ? '2.5' : '1.5'}
                  filter={isCritical ? 'url(#critical-glow)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))'}
                />

                {/* Critical indicator badge */}
                {isCritical && (
                  <circle
                    cx={nodeWidth - 12}
                    cy={12}
                    r="5"
                    fill="#ef4444"
                  />
                )}

                {/* Task Name */}
                <text
                  x="14"
                  y="26"
                  fontSize="12.5"
                  fontWeight="700"
                  fill="#0f172a"
                  style={{ fontFamily: 'var(--font-main)' }}
                >
                  {node.name?.length > 15 ? node.name.substring(0, 14) + '...' : node.name}
                </text>

                {/* Duration & ES */}
                <text
                  x="14"
                  y="46"
                  fontSize="10.5"
                  fontWeight="500"
                  fill="#64748b"
                  style={{ fontFamily: 'var(--font-main)' }}
                >
                  {formatDuration(node.duration)} • Day {node.earliestStart || 0}→{node.earliestFinish || node.duration}
                </text>

                {/* Hover Tooltip card overlay */}
                {isHovered && (
                  <g transform={`translate(0, ${nodeHeight + 8})`} style={{ pointerEvents: 'none' }}>
                    <rect
                      width="180"
                      height="80"
                      rx="6"
                      fill="#0f172a"
                      opacity="0.95"
                    />
                    <text x="10" y="20" fill="#ffffff" fontSize="11" fontWeight="700">
                      {node.name}
                    </text>
                    <text x="10" y="38" fill="#94a3b8" fontSize="10">
                      Duration: {formatDuration(node.duration)}
                    </text>
                    <text x="10" y="52" fill="#94a3b8" fontSize="10">
                      ES: Day {node.earliestStart || 0} | EF: Day {node.earliestFinish || 0}
                    </text>
                    <text x="10" y="66" fill={isCritical ? '#f87171' : '#38bdf8'} fontSize="10" fontWeight="600">
                      {isCritical ? '⚡ Critical Task (Slack = 0)' : `Slack: ${node.slack || 0} days`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
