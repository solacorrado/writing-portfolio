"use client";

import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { WritingPiece } from "./page";

export default function CanvasWrapper({ initialPieces }: { initialPieces: WritingPiece[] }) {
  const [selectedPiece, setSelectedPiece] = useState<WritingPiece | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImageUrl = (fileName: string) => {
    if (!fileName) return "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500";
    if (fileName.startsWith("http")) return fileName;
    return `https://tecqzfbtwnesrzgoerxn.supabase.co/storage/v1/object/public/portfolio_images/${fileName}`;
  };

  // Group essays by their theme so we can draw constellation strings within thematic clusters
  const piecesByTheme = initialPieces.reduce((acc, piece) => {
    const theme = piece.theme_label || "Uncategorized";
    if (!acc[theme]) acc[theme] = [];
    acc[theme].push(piece);
    return acc;
  }, {} as Record<string, WritingPiece[]>);

  return (
    <>
      <TransformWrapper 
        initialScale={0.3} 
        minScale={0.1} 
        maxScale={2} 
        centerOnInit={true}
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.001 }}   
      >
        <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }}>
          <div 
            className="relative w-[4000px] h-[4000px] bg-slate-950 transition-transform duration-300 ease-out"
            style={{
              backgroundImage: "radial-gradient(rgba(51, 65, 85, 0.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          >
            
            {/* THE CLUSTERED CONSTELLATION LAYER */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
              {Object.entries(piecesByTheme).map(([theme, clusterPieces]) => {
                return clusterPieces.map((piece, index) => {
                  // Connects the piece only to the next piece INSIDE its specific cluster
                  if (clusterPieces.length <= 1) return null;
                  const nextPiece = clusterPieces[(index + 1) % clusterPieces.length];

                  return (
                    <line
                      key={`line-${piece.id}-${nextPiece.id}`}
                      x1={piece.x}
                      y1={piece.y}
                      x2={nextPiece.x}
                      y2={nextPiece.y}
                      className="stroke-slate-500/30"
                      strokeWidth="1.2"
                      strokeDasharray="4 6"
                    />
                  );
                });
              })}
            </svg>

            {/* CARDS LAYER */}
            {initialPieces.map((piece) => (
              <div 
                key={piece.id}
                onClick={() => setSelectedPiece(piece)}
                className="absolute group transition-transform duration-500 ease-out hover:z-30 cursor-pointer"
                style={{ left: `${piece.x}px`, top: `${piece.y}px`, transform: "translate(-50%, -50%)" }}
              >
                {/* Visual Label for Themes */}
                <div className="text-center mb-2">
                  <span className="text-[9px] font-mono tracking-[0.2em] text-slate-500 uppercase bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/40">
                    {piece.theme_label || "Thinking"}
                  </span>
                </div>

                <div className="relative w-52 h-72 rounded-lg bg-slate-900 border border-slate-800/60 shadow-2xl overflow-hidden group-hover:border-slate-400/50 transition-all duration-300">
                  <img 
                    src={getImageUrl(piece.image_url)} 
                    alt={piece.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-10 transition-opacity duration-500" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500";
                    }}
                  />
                  <div className="absolute inset-0 p-5 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-slate-950/90 backdrop-blur-sm">
                    <p className="text-xs text-slate-200 italic text-center font-serif leading-relaxed">
                      "{piece.quote || 'Click to step inside...'}"
                    </p>
                    <span className="text-[10px] mt-4 uppercase tracking-widest text-slate-500 font-mono">Click to read</span>
                  </div>
                </div>

                <h2 className="text-center font-serif text-sm tracking-wide text-slate-400 group-hover:text-slate-100 transition-colors duration-300 mt-3 w-52 px-2 break-words line-clamp-2">
                  {piece.title}
                </h2>
              </div>
            ))}
            
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Reading Sliding Panel Overlay */}
      <div 
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end transition-opacity duration-500 ease-in-out ${
          selectedPiece ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex-1" onClick={() => setSelectedPiece(null)} />
        
        <div 
          className={`w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 p-8 md:p-12 overflow-y-auto shadow-2xl flex flex-col transition-transform duration-500 ease-in-out transform ${
            selectedPiece ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button 
            onClick={() => setSelectedPiece(null)}
            className="text-slate-500 hover:text-slate-200 self-end font-mono text-sm uppercase tracking-wider mb-8"
          >
            [ Close × ]
          </button>
          
          <article className="prose prose-invert max-w-none flex-1">
            <div className="mb-2">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
                Theme // {selectedPiece?.theme_label}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-100 mb-1 leading-tight">
              {selectedPiece?.title}
            </h1>
            
            <p className="text-xs font-mono tracking-wider text-slate-400 uppercase mb-4">
              {formatDate(selectedPiece?.date_published)}
            </p>

            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-6 italic">
              "{selectedPiece?.quote}"
            </p>
            <hr className="border-slate-800 mb-8" />
            <div className="text-slate-300 font-serif leading-relaxed text-base whitespace-pre-line space-y-6">
              {selectedPiece?.content}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}