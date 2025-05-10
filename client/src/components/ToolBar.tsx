import { useEditor } from "../lib/stores/useEditor";

export const ToolBar = () => {
  const { 
    activeTool, 
    viewMode, 
    showGrid,
    showChunks,
    setActiveTool, 
    setViewMode, 
    toggleGrid,
    toggleChunks,
    undoAction,
    redoAction,
    canUndo,
    canRedo
  } = useEditor();

  // Tool definitions
  const tools = [
    { id: "place", label: "Colocar Bloco", icon: "🧱" },
    { id: "remove", label: "Remover Bloco", icon: "🧹" },
    { id: "fill", label: "Preencher Área", icon: "🪣" },
    { id: "select", label: "Selecionar", icon: "📏" },
  ] as const;

  return (
    <div className="flex space-x-2">
      {/* View mode toggle */}
      <button
        className={`px-3 py-1 rounded-md transition-all duration-150 ${
          viewMode === "3D" 
            ? "bg-primary text-primary-foreground shadow-md scale-105" 
            : "bg-card hover:bg-card/80 hover:scale-102"
        }`}
        onClick={() => setViewMode(viewMode === "3D" ? "2D" : "3D")}
        title={viewMode === "3D" ? "Switch to 2D view" : "Switch to 3D view"}
      >
        <span className="font-medium">{viewMode === "3D" ? "3D" : "2D"}</span>
      </button>

      {/* Tool buttons */}
      <div className="flex space-x-1 border-l border-border pl-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`px-3 py-1 rounded-md transition-all duration-150 flex items-center ${
              activeTool === tool.id 
                ? "bg-primary text-primary-foreground shadow-md scale-105 font-medium border-b-2 border-primary-foreground" 
                : "bg-card hover:bg-card/80 hover:translate-y-[-2px]"
            }`}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
          >
            <span className="mr-2 text-lg">{tool.icon}</span>
            <span>{tool.label}</span>
            {activeTool === tool.id && <span className="ml-1.5 text-xs">✓</span>}
          </button>
        ))}
      </div>

      {/* Grid toggle */}
      <button
        className={`px-3 py-1 rounded-md transition-all duration-150 ${
          showGrid 
            ? "bg-primary text-primary-foreground shadow-md font-medium" 
            : "bg-card hover:bg-card/80"
        }`}
        onClick={toggleGrid}
        title={showGrid ? "Hide Grid" : "Show Grid"}
      >
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
               className="mr-1.5">
            <path d="M3 3h18v18H3z"></path>
            <path d="M3 9h18"></path>
            <path d="M3 15h18"></path>
            <path d="M9 3v18"></path>
            <path d="M15 3v18"></path>
          </svg>
          Grade{showGrid && <span className="ml-1 text-xs">✓</span>}
        </span>
      </button>
      
      {/* Chunks toggle */}
      <button
        className={`px-3 py-1 rounded-md transition-all duration-150 ${
          showChunks 
            ? "bg-primary text-primary-foreground shadow-md font-medium" 
            : "bg-card hover:bg-card/80"
        }`}
        onClick={toggleChunks}
        title={showChunks ? "Hide Chunks" : "Show Chunks"}
      >
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
               className="mr-1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="3" height="3"></rect>
            <rect x="14" y="7" width="3" height="3"></rect>
            <rect x="7" y="14" width="3" height="3"></rect>
            <rect x="14" y="14" width="3" height="3"></rect>
          </svg>
          Chunks{showChunks && <span className="ml-1 text-xs">✓</span>}
        </span>
      </button>

      {/* Undo/Redo buttons */}
      <div className="flex space-x-1 border-l border-border pl-2">
        <button
          className="px-3 py-1 rounded-md bg-card disabled:opacity-50 transition-all duration-150 flex items-center hover:bg-card/80 disabled:hover:bg-card"
          onClick={undoAction}
          disabled={!canUndo}
          title="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
               className="mr-1.5">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
          </svg>
          Desfazer
        </button>
        <button
          className="px-3 py-1 rounded-md bg-card disabled:opacity-50 transition-all duration-150 flex items-center hover:bg-card/80 disabled:hover:bg-card"
          onClick={redoAction}
          disabled={!canRedo}
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
               className="mr-1.5">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>
          </svg>
          Refazer
        </button>
      </div>
    </div>
  );
};
