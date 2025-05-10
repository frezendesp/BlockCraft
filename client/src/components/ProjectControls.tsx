import { useState, useRef } from "react";
import { useProject } from "../lib/stores/useProject";
import { exportToMcFunction } from "../lib/exportHelpers";

export const ProjectControls = () => {
  const { 
    initializeProject, 
    loadProject, 
    saveProject,
    dimensions, 
    setDimensions 
  } = useProject();
  
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newDimensions, setNewDimensions] = useState({
    x: dimensions[0],
    y: dimensions[1],
    z: dimensions[2]
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    startX: 0,
    startY: 0,
    startZ: 0,
    filename: "build_plan.mcfunction"
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle New Project
  const handleNewProject = () => {
    initializeProject([newDimensions.x, newDimensions.y, newDimensions.z]);
    setShowNewProjectModal(false);
  };

  // Handle Save Project
  const handleSaveProject = () => {
    const blob = saveProject();
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor to download the file
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blockforge_project.json';
    a.click();
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  };

  // Handle Load Project via file input
  const handleLoadProjectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        loadProject(content);
      } catch (error) {
        console.error("Failed to load project:", error);
        alert("Failed to load project. File may be corrupted or in wrong format.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  };

  // Handle Export to mcfunction
  const handleExport = () => {
    const mcfunction = exportToMcFunction(
      useProject.getState().voxels,
      exportSettings.startX,
      exportSettings.startY,
      exportSettings.startZ
    );
    
    // Create file and download
    const blob = new Blob([mcfunction], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = exportSettings.filename;
    a.click();
    
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  return (
    <div className="flex space-x-2">
      <button
        className="px-3 py-1 bg-card rounded-md hover:bg-card/80 transition-all duration-150"
        onClick={() => setShowNewProjectModal(true)}
      >
        Novo
      </button>
      
      <button
        className="px-3 py-1 bg-card rounded-md hover:bg-card/80 transition-all duration-150"
        onClick={handleSaveProject}
      >
        Salvar
      </button>
      
      <button
        className="px-3 py-1 bg-card rounded-md hover:bg-card/80 transition-all duration-150"
        onClick={handleLoadProjectClick}
      >
        Carregar
      </button>
      
      <button
        className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-150"
        onClick={() => setShowExportModal(true)}
      >
        Exportar
      </button>
      
      {/* Hidden file input for load project */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileSelected}
      />
      
      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-4 rounded-md shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">Novo Projeto</h2>
            
            <div className="mb-4">
              <label className="block mb-1">Largura (X):</label>
              <input
                type="number"
                className="w-full p-2 bg-background border border-border rounded"
                value={newDimensions.x}
                onChange={(e) => setNewDimensions({ ...newDimensions, x: Math.max(1, Math.min(256, parseInt(e.target.value) || 1)) })}
                min="1"
                max="256"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1">Altura (Y):</label>
              <input
                type="number"
                className="w-full p-2 bg-background border border-border rounded"
                value={newDimensions.y}
                onChange={(e) => setNewDimensions({ ...newDimensions, y: Math.max(1, Math.min(256, parseInt(e.target.value) || 1)) })}
                min="1"
                max="256"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1">Profundidade (Z):</label>
              <input
                type="number"
                className="w-full p-2 bg-background border border-border rounded"
                value={newDimensions.z}
                onChange={(e) => setNewDimensions({ ...newDimensions, z: Math.max(1, Math.min(256, parseInt(e.target.value) || 1)) })}
                min="1"
                max="256"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-card rounded-md"
                onClick={() => setShowNewProjectModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md"
                onClick={handleNewProject}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-4 rounded-md shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">Export to Minecraft</h2>
            
            <div className="mb-4">
              <label className="block mb-1">Start X:</label>
              <input
                type="number"
                className="w-full p-2 bg-background border border-border rounded"
                value={exportSettings.startX}
                onChange={(e) => setExportSettings({ ...exportSettings, startX: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1">Start Y:</label>
              <input
                type="number"
                className="w-full p-2 bg-background border border-border rounded"
                value={exportSettings.startY}
                onChange={(e) => setExportSettings({ ...exportSettings, startY: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1">Start Z:</label>
              <input
                type="number"
                className="w-full p-2 bg-background border border-border rounded"
                value={exportSettings.startZ}
                onChange={(e) => setExportSettings({ ...exportSettings, startZ: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1">Filename:</label>
              <input
                type="text"
                className="w-full p-2 bg-background border border-border rounded"
                value={exportSettings.filename}
                onChange={(e) => setExportSettings({ ...exportSettings, filename: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-card rounded-md"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md"
                onClick={handleExport}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
