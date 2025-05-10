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
    { id: "place", label: "Place Block", icon: "🧱" },
    { id: "remove", label: "Remove Block", icon: "🧹" },
    { id: "fill", label: "Fill Area", icon: "🪣" },
    { id: "select", label: "Select", icon: "📏" },
  ] as const;

  return (
    <div className="flex space-x-2">
      {/* View mode toggle */}
      <button
        className={`px-3 py-1 rounded-md ${
          viewMode === "3D" ? "bg-primary text-primary-foreground" : "bg-card"
        }`}
        onClick={() => setViewMode(viewMode === "3D" ? "2D" : "3D")}
        title={viewMode === "3D" ? "Switch to 2D view" : "Switch to 3D view"}
      >
        {viewMode === "3D" ? "3D" : "2D"}
      </button>

      {/* Tool buttons */}
      <div className="flex space-x-1 border-l border-border pl-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`px-3 py-1 rounded-md ${
              activeTool === tool.id ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
          >
            <span className="mr-1">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Grid toggle */}
      <button
        className={`px-3 py-1 rounded-md ${
          showGrid ? "bg-primary text-primary-foreground" : "bg-card"
        }`}
        onClick={toggleGrid}
        title={showGrid ? "Hide Grid" : "Show Grid"}
      >
        Grid
      </button>
      
      {/* Chunks toggle */}
      <button
        className={`px-3 py-1 rounded-md ${
          showChunks ? "bg-primary text-primary-foreground" : "bg-card"
        }`}
        onClick={toggleChunks}
        title={showChunks ? "Hide Chunks" : "Show Chunks"}
      >
        Chunks
      </button>

      {/* Undo/Redo buttons */}
      <div className="flex space-x-1 border-l border-border pl-2">
        <button
          className="px-3 py-1 rounded-md bg-card disabled:opacity-50"
          onClick={undoAction}
          disabled={!canUndo}
          title="Undo"
        >
          ↩ Undo
        </button>
        <button
          className="px-3 py-1 rounded-md bg-card disabled:opacity-50"
          onClick={redoAction}
          disabled={!canRedo}
          title="Redo"
        >
          ↪ Redo
        </button>
      </div>
    </div>
  );
};
