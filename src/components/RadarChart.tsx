import React from 'react';

interface RadarChartProps {
  metrics: {
    speed: number;
    agility: number;
    ballControl: number;
    technical: number;
    physical: number;
    consistency: number;
  };
  tier?: 'GOLD' | 'SILVER' | 'BRONZE' | 'UNRANKED';
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  metrics,
  tier = 'GOLD',
  size = 300
}) => {
  const center = size / 2;
  const radius = (size / 2) - 45; // Margin for labels

  const axes = [
    { key: 'speed', label: 'Speed', value: metrics.speed },
    { key: 'agility', label: 'Agility', value: metrics.agility },
    { key: 'ballControl', label: 'Control', value: metrics.ballControl },
    { key: 'technical', label: 'Technical', value: metrics.technical },
    { key: 'physical', label: 'Power', value: metrics.physical },
    { key: 'consistency', label: 'Consistency', value: metrics.consistency },
  ];

  const angleStep = (2 * Math.PI) / axes.length;

  // Calculate coordinates for a given index and value (0 - 100)
  const getCoordinates = (index: number, val: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top vertex
    const distance = (val / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Generate grid concentric polygons (at 25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];
  const gridPolygons = gridLevels.map((level) => {
    const points = axes.map((_, i) => {
      const { x, y } = getCoordinates(i, level);
      return `${x},${y}`;
    }).join(' ');
    return { level, points };
  });

  // Calculate player data polygon points
  const playerPoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(i, axis.value);
    return `${x},${y}`;
  }).join(' ');

  // Colors based on Tier
  const strokeColor = tier === 'GOLD' ? '#f59e0b' : tier === 'SILVER' ? '#e2e8f0' : '#10b981';
  const fillColor = tier === 'GOLD' ? 'rgba(245, 158, 11, 0.25)' : tier === 'SILVER' ? 'rgba(226, 232, 240, 0.25)' : 'rgba(16, 185, 129, 0.25)';

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Lines & Polygons */}
        {gridPolygons.map((grid, idx) => (
          <polygon
            key={idx}
            points={grid.points}
            fill="none"
            stroke="#334155"
            strokeWidth={grid.level === 100 ? "1.5" : "1"}
            strokeDasharray={grid.level === 100 ? undefined : "3,3"}
          />
        ))}

        {/* Axis Spokes from center to vertices */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#334155"
              strokeWidth="1"
            />
          );
        })}

        {/* Player Metric Polygon */}
        <polygon
          points={playerPoints}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* Vertex Data Nodes */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, axis.value);
          return (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={strokeColor}
                stroke="#0f172a"
                strokeWidth="2"
                className="transition-all transform hover:scale-125"
              />
            </g>
          );
        })}

        {/* Axis Labels & Numerical Values */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, 118); // Push slightly further out for text
          const isTop = i === 0;
          const isBottom = i === 3;
          const isRight = i === 1 || i === 2;

          let textAnchor = 'middle';
          if (isRight) textAnchor = 'start';
          else if (!isTop && !isBottom) textAnchor = 'end';

          return (
            <text
              key={i}
              x={x}
              y={y + (isTop ? -4 : isBottom ? 8 : 4)}
              textAnchor={textAnchor}
              className="text-[11px] font-extrabold fill-slate-300 tracking-tight"
            >
              {axis.label} <tspan className="fill-amber-400 font-black">({axis.value})</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
};
