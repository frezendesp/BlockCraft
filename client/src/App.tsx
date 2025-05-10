import { useState, useEffect } from "react";
import { Canvas3D } from "./components/Canvas3D";
import { Canvas2D } from "./components/Canvas2D"; 
import { BlockPalette } from "./components/BlockPalette";
import { ToolBar } from "./components/ToolBar";
import { ProjectControls } from "./components/ProjectControls";
import { StatusBar } from "./components/StatusBar";
import { useEditor } from "./lib/stores/useEditor";
import { useProject } from "./lib/stores/useProject";

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const viewMode = useEditor((state) => state.viewMode);
  const initializeProject = useProject((state) => state.initializeProject);

  // Initialize the project with default settings
  useEffect(() => {
    initializeProject();
    setIsLoaded(true);
  }, [initializeProject]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-xl font-semibold">Loading BlockForge...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Top bar with tools and controls */}
      <div className="flex justify-between items-center p-2 border-b border-border bg-card">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-4">BlockForge</h1>
          <ToolBar />
        </div>
        <ProjectControls />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: block palette */}
        <BlockPalette />

        {/* Main canvas area */}
        <div className="flex-1 relative">
          {viewMode === "3D" ? <Canvas3D /> : <Canvas2D />}
        </div>
      </div>

      {/* Status bar at the bottom */}
      <StatusBar />
    </div>
  );
}

export default App;
