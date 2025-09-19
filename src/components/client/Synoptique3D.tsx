// src/components/client/Synoptique3D.tsx
import React, { useState, useRef, useEffect } from 'react';

// 🖼️ Assets techniques
const ASSETS = {
  panneau: "/admin-panel/images/panneau-solaire-iso.png",
  batterie: "/admin-panel/images/batterie-iso.png",
  ge: "/admin-panel/images/groupe-electrogene-iso.png",
  jirama: "/admin-panel/images/haute-ligne.png",
  transformateur: "/admin-panel/images/transformateur-iso.png",
  usine: "/admin-panel/images/usine-iso.png",
  house: "/admin-panel/images/house-iso.png",
  batiment: "/admin-panel/images/batiment-iso.png",
};

// 🖼️ Image de repli
const FALLBACK_IMAGE = "image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f87171'/%3E%3Ctext x='40' y='45' font-size='12' fill='white' text-anchor='middle'%3E⚠️%3C/text%3E%3C/svg%3E";

// ✅ TYPES ÉTENDUS
type SiteType = 
  | 'solaire_batterie' 
  | 'solaire_ge_batterie' 
  | 'solaire_groupe_jirama'
  | 'solaire_transformateur_usine'
  | 'solaire_transformateur_batiment'
  | 'solaire_transformateur_house';

interface ElementPosition {
  id: string;
  type: 'panneau' | 'batterie' | 'ge' | 'jirama' | 'transformateur' | 'usine' | 'house' | 'batiment';
  x: number;
  y: number;
  connections?: string[];
  metrics?: {
    production?: number;
    voltage?: number;
    charge?: number;
    status?: 'ON' | 'OFF';
  };
}

// 🗺️ CONFIGURATIONS
const SITE_LAYOUTS: Record<SiteType, ElementPosition[]> = {
  solaire_batterie: [
    { id: 'p1', type: 'panneau', x: 300, y: 100, metrics: { production: 2.4, voltage: 48.2, status: 'ON' } },
    { id: 'b1', type: 'batterie', x: 500, y: 300, connections: ['p1'], metrics: { charge: 87, voltage: 47.8, status: 'ON' } },
  ],
  solaire_ge_batterie: [
    { id: 'p1', type: 'panneau', x: 200, y: 80, metrics: { production: 3.1, voltage: 48.5, status: 'ON' } },
    { id: 'ge1', type: 'ge', x: 450, y: 200, connections: ['p1'], metrics: { production: 0, voltage: 0, status: 'OFF' } },
    { id: 'b1', type: 'batterie', x: 600, y: 350, connections: ['ge1'], metrics: { charge: 92, voltage: 48.1, status: 'ON' } },
  ],
  solaire_groupe_jirama: [
    { id: 'p1', type: 'panneau', x: 150, y: 60, metrics: { production: 1.8, voltage: 47.9, status: 'ON' } },
    { id: 'ge1', type: 'ge', x: 400, y: 180, connections: ['p1'], metrics: { production: 5.5, voltage: 230, status: 'ON' } },
    { id: 'j1', type: 'jirama', x: 650, y: 320, connections: ['ge1'], metrics: { production: 12.3, voltage: 220, status: 'ON' } },
  ],
  solaire_transformateur_usine: [
    { id: 'p1', type: 'panneau', x: 100, y: 60, metrics: { production: 2.1, voltage: 48.0, status: 'ON' } },
    { id: 'ge1', type: 'ge', x: 300, y: 180, connections: ['p1'], metrics: { production: 8.2, voltage: 230, status: 'ON' } },
    { id: 't1', type: 'transformateur', x: 500, y: 180, connections: ['ge1'], metrics: { voltage: 380, status: 'ON' } },
    { id: 'u1', type: 'usine', x: 700, y: 180, connections: ['t1'], metrics: { production: 15.7, voltage: 380, status: 'ON' } },
  ],
  solaire_transformateur_batiment: [
    { id: 'p1', type: 'panneau', x: 100, y: 60, metrics: { production: 1.5, voltage: 48.0, status: 'ON' } },
    { id: 'ge1', type: 'ge', x: 300, y: 180, connections: ['p1'], metrics: { production: 6.8, voltage: 230, status: 'ON' } },
    { id: 't1', type: 'transformateur', x: 500, y: 180, connections: ['ge1'], metrics: { voltage: 220, status: 'ON' } },
    { id: 'b1', type: 'batiment', x: 700, y: 180, connections: ['t1'], metrics: { production: 9.3, voltage: 220, status: 'ON' } },
  ],
  solaire_transformateur_house: [
    { id: 'p1', type: 'panneau', x: 100, y: 60, metrics: { production: 0.8, voltage: 48.0, status: 'ON' } },
    { id: 'ge1', type: 'ge', x: 300, y: 180, connections: ['p1'], metrics: { production: 3.2, voltage: 230, status: 'ON' } },
    { id: 't1', type: 'transformateur', x: 500, y: 180, connections: ['ge1'], metrics: { voltage: 220, status: 'ON' } },
    { id: 'h1', type: 'house', x: 700, y: 180, connections: ['t1'], metrics: { production: 4.1, voltage: 220, status: 'ON' } },
  ],
};

// 🧭 LIGNES COURBÉES
const ConnectionLine = ({ from, to }: { from: ElementPosition; to: ElementPosition }) => {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const controlX = midX + 50;
  const controlY = Math.min(from.y, to.y) - 30;

  return (
    <path
      d={`M ${from.x + 40} ${from.y + 40} Q ${controlX} ${controlY} ${to.x + 40} ${to.y + 40}`}
      stroke="#FBBF24"
      strokeWidth="3"
      fill="none"
      strokeDasharray="6,4"
      className="drop-shadow-sm"
      style={{ 
        animation: 'flow 2s linear infinite',
        filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.8))'
      }}
    />
  );
};

// 📊 Composant de métrique animé
const MetricBadge = ({ label, value, unit, color = "text-blue-600" }: { label: string; value: number; unit: string; color?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`text-xs font-bold ${color} bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 rounded shadow`}>
      {label}: {displayValue.toFixed(1)} {unit}
    </div>
  );
};

// 📈 Diagramme circulaire 3D FLOTTANT
const FloatingCircularGauge = ({ value, max = 100, color = "#3b82f6", label }: { value: number; max?: number; color?: string; label: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-black/5 rounded-full blur-sm"></div>
      <svg className="w-28 h-28 transform -rotate-90" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>
        <circle cx="56" cy="56" r={radius} stroke="#e5e7eb" strokeWidth="6" fill="transparent" className="dark:stroke-gray-700" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (displayValue / max) * circumference}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-800 dark:text-white">{Math.round(displayValue)}%</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
      </div>
    </div>
  );
};

export function Synoptique3D({ siteType = 'solaire_batterie' }: { siteType?: SiteType }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState<ElementPosition | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = SITE_LAYOUTS[siteType];

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.8, Math.min(2.5, prev + delta)));
    };

    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });
    return () => container?.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      e.currentTarget.style.userSelect = 'none';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.userSelect = 'auto';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <h3 className="text-lg font-bold text-white">
          {siteType === 'solaire_batterie' && 'Panneau Solaire → Batterie'}
          {siteType === 'solaire_ge_batterie' && 'Panneau Solaire → GE → Batterie'}
          {siteType === 'solaire_groupe_jirama' && 'Panneau Solaire → Groupe → JIRAMA'}
          {siteType === 'solaire_transformateur_usine' && 'Panneau → GE → Transformateur → Usine'}
          {siteType === 'solaire_transformateur_batiment' && 'Panneau → GE → Transformateur → Bâtiment'}
          {siteType === 'solaire_transformateur_house' && 'Panneau → GE → Transformateur → Maison'}
        </h3>
        <p className="text-blue-100 text-sm">Vue isométrique interactive</p>
      </div>

      {/* 🖼️ CANVAS SVG — ✅ KEY DYNAMIQUE ICI — FORCER LE RE-RENDER */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] overflow-hidden cursor-grab active:cursor-grabbing bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none' }}
      >
        <svg
          key={siteType} // ✅ MAGIC KEY — FORCER LE RE-RENDER COMPLET
          width="100%"
          height="100%"
          style={{
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center',
          }}
        >
          {/* 🔌 Lignes */}
          {layout.map((element) =>
            element.connections?.map((targetId) => {
              const target = layout.find((el) => el.id === targetId);
              if (!target) return null;
              return <ConnectionLine key={`${element.id}-${targetId}`} from={element} to={target} />;
            })
          )}

          {/* ⚙️ ÉLÉMENTS */}
          {layout.map((element) => {
            const imgSrc = ASSETS[element.type] || FALLBACK_IMAGE;

            return (
              <g 
                key={element.id} 
                transform={`translate(${element.x}, ${element.y})`}
                onClick={() => setSelectedElement(element)}
                onMouseEnter={() => setHoveredElement(element)}
                onMouseLeave={() => setHoveredElement(null)}
                className="cursor-pointer"
              >
                <image
                  href={imgSrc}
                  x="0"
                  y="0"
                  width="80"
                  height="80"
                  className="transition-all duration-500 ease-out"
                  style={{ 
                    filter: 'brightness(1.1) saturate(1.05)',
                    transform: hoveredElement?.id === element.id ? 'translateY(-3px)' : 'translateY(0)',
                  }}
                  onError={(e) => {
                    const target = e.target as SVGImageElement;
                    target.href.baseVal = FALLBACK_IMAGE;
                    console.warn(`Image manquante pour : ${element.type}`, ASSETS[element.type]);
                  }}
                />
                
                <circle
                  cx="72"
                  cy="12"
                  r="6"
                  fill={element.metrics?.status === 'ON' ? '#10B981' : '#EF4444'}
                  className={element.metrics?.status === 'ON' ? 'animate-pulse' : ''}
                  stroke={element.metrics?.status === 'ON' ? '#059669' : '#DC2626'}
                  strokeWidth="1"
                />
                
                <foreignObject x="0" y="85" width="80" height="60">
                  <div className="flex flex-col gap-0.5 text-xs">
                    {element.metrics?.production !== undefined && (
                      <MetricBadge label="P" value={element.metrics.production} unit="kW" color="text-green-600" />
                    )}
                    {element.metrics?.voltage !== undefined && (
                      <MetricBadge label="V" value={element.metrics.voltage} unit="V" color="text-blue-600" />
                    )}
                    {element.metrics?.charge !== undefined && (
                      <MetricBadge label="%" value={element.metrics.charge} unit="" color="text-yellow-600" />
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* 📈 Diagramme au survol */}
        {hoveredElement && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: hoveredElement.x + 100 + offset.x * zoom,
              top: hoveredElement.y - 60 + offset.y * zoom,
              transform: `scale(${zoom})`,
              zIndex: 100,
            }}
          >
            <FloatingCircularGauge 
              value={hoveredElement.metrics?.charge || (hoveredElement.metrics?.production ? (hoveredElement.metrics.production / 20) * 100 : 0)}
              color={
                hoveredElement.type === 'batterie' ? '#f59e0b' :
                hoveredElement.type === 'usine' ? '#ef4444' :
                hoveredElement.type === 'batiment' ? '#8b5cf6' :
                hoveredElement.type === 'house' ? '#10b981' :
                '#10b981'
              }
              label={
                hoveredElement.type === 'batterie' ? 'Charge' :
                hoveredElement.type === 'usine' ? 'Production Usine' :
                hoveredElement.type === 'batiment' ? 'Consommation Bâtiment' :
                hoveredElement.type === 'house' ? 'Consommation Maison' :
                'Production'
              }
            />
          </div>
        )}
      </div>

      {/* 📊 Légende */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-gray-700 dark:text-gray-300">Production Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-700 dark:text-gray-300">Charge Batterie</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-700 dark:text-gray-300">Usine</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-700 dark:text-gray-300">Bâtiment</span>
        </div>
      </div>

      {/* 📋 MODAL DE DÉTAIL */}
      {selectedElement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedElement(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                {selectedElement.type === 'panneau' && 'Panneau Solaire'}
                {selectedElement.type === 'batterie' && 'Batterie'}
                {selectedElement.type === 'ge' && 'Groupe Électrogène'}
                {selectedElement.type === 'jirama' && 'JIRAMA'}
                {selectedElement.type === 'transformateur' && 'Transformateur'}
                {selectedElement.type === 'usine' && 'Usine'}
                {selectedElement.type === 'batiment' && 'Bâtiment'}
                {selectedElement.type === 'house' && 'Maison'}
              </h4>
              <button onClick={() => setSelectedElement(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">✕</button>
            </div>
            
            <div className="space-y-4">
              {selectedElement.metrics?.production !== undefined && (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20">
                    <FloatingCircularGauge 
                      value={(selectedElement.metrics.production / 20) * 100} 
                      color={
                        selectedElement.type === 'usine' ? '#ef4444' :
                        selectedElement.type === 'batiment' ? '#8b5cf6' :
                        selectedElement.type === 'house' ? '#10b981' :
                        '#10b981'
                      } 
                      label="Production"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Production</div>
                    <div className="text-lg font-bold text-green-600">{selectedElement.metrics.production} kW</div>
                  </div>
                </div>
              )}
              
              {selectedElement.metrics?.charge !== undefined && (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20">
                    <FloatingCircularGauge value={selectedElement.metrics.charge} color="#f59e0b" label="Charge" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Charge</div>
                    <div className="text-lg font-bold text-yellow-600">{selectedElement.metrics.charge}%</div>
                  </div>
                </div>
              )}
              
              {selectedElement.metrics?.voltage !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tension :</span>
                  <span className="font-bold text-blue-600">{selectedElement.metrics.voltage} V</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">État :</span>
                <span className={`font-bold ${selectedElement.metrics?.status === 'ON' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedElement.metrics?.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -10; }
        }
      `}</style>
    </div>
  );
}