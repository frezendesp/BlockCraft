import { useState } from "react";
import { useProject } from "@/lib/stores/useProject";
import { BlockGroup } from "@/lib/stores/useProject";
import { useEditor } from "@/lib/stores/useEditor";

export const GroupControls = () => {
  const { groups, activeGroupId, setActiveGroup, removeGroup, moveGroup, rotateGroup } = useProject();
  const [showPanel, setShowPanel] = useState(false);
  const [rotationAxis, setRotationAxis] = useState<'x' | 'y' | 'z'>('y');
  const [rotationDegrees, setRotationDegrees] = useState(90);
  const [moveOffset, setMoveOffset] = useState<[number, number, number]>([0, 0, 0]);
  
  // Get the active group, if any
  const activeGroup = activeGroupId ? groups[activeGroupId] : null;
  
  // If there are no groups, don't show anything
  if (Object.keys(groups).length === 0) {
    return null;
  }
  
  // Handle group selection
  const handleSelectGroup = (groupId: string) => {
    setActiveGroup(groupId);
    // Always show panel when a group is selected
    setShowPanel(true);
  };
  
  // Handle group deletion
  const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting when clicking delete
    removeGroup(groupId);
  };
  
  // Handle moving the active group
  const handleMoveGroup = () => {
    if (activeGroupId) {
      moveGroup(activeGroupId, moveOffset);
      // Reset the offset after moving
      setMoveOffset([0, 0, 0]);
    }
  };
  
  // Handle rotating the active group
  const handleRotateGroup = () => {
    if (activeGroupId) {
      rotateGroup(activeGroupId, rotationAxis, rotationDegrees);
    }
  };
  
  // Update offset value
  const updateOffset = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseInt(value) || 0;
    const newOffset = [...moveOffset] as [number, number, number];
    
    if (axis === 'x') newOffset[0] = numValue;
    else if (axis === 'y') newOffset[1] = numValue;
    else if (axis === 'z') newOffset[2] = numValue;
    
    setMoveOffset(newOffset);
  };
  
  return (
    <div className="bg-card rounded-md p-2 mt-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Grupos</h3>
        <button 
          className="text-sm px-2 py-1 rounded-md bg-muted hover:bg-muted/80"
          onClick={() => setShowPanel(!showPanel)}
        >
          {showPanel ? 'Esconder' : 'Mostrar'}
        </button>
      </div>
      
      {showPanel && (
        <div className="mt-2 space-y-4">
          {/* Group list */}
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            <h4 className="text-sm font-medium">Grupos Disponíveis:</h4>
            {Object.entries(groups).map(([groupId, group]) => (
              <div 
                key={groupId}
                className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${
                  activeGroupId === groupId ? 'bg-primary/20 border-l-2 border-primary' : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => handleSelectGroup(groupId)}
              >
                <div>
                  <div className="font-medium">{group.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {Object.keys(group.blocks).length} blocos
                  </div>
                </div>
                <button
                  className="text-sm px-2 py-1 rounded-md bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                  onClick={(e) => handleDeleteGroup(groupId, e)}
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
          
          {/* Group operations - only show if a group is active */}
          {activeGroup && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium">Manipular Grupo: {activeGroup.name}</h4>
              
              {/* Move controls */}
              <div className="space-y-2">
                <div className="text-sm">Mover Grupo:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs">X:</label>
                    <input 
                      type="number" 
                      className="w-full p-1 bg-background border rounded"
                      value={moveOffset[0]}
                      onChange={(e) => updateOffset('x', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs">Y:</label>
                    <input 
                      type="number" 
                      className="w-full p-1 bg-background border rounded"
                      value={moveOffset[1]}
                      onChange={(e) => updateOffset('y', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs">Z:</label>
                    <input 
                      type="number" 
                      className="w-full p-1 bg-background border rounded"
                      value={moveOffset[2]}
                      onChange={(e) => updateOffset('z', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  className="w-full text-sm px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleMoveGroup}
                >
                  Mover
                </button>
              </div>
              
              {/* Rotation controls */}
              <div className="space-y-2">
                <div className="text-sm">Girar Grupo:</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs">Eixo:</label>
                    <select
                      className="w-full p-1 bg-background border rounded"
                      value={rotationAxis}
                      onChange={(e) => setRotationAxis(e.target.value as 'x' | 'y' | 'z')}
                    >
                      <option value="x">X</option>
                      <option value="y">Y</option>
                      <option value="z">Z</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs">Graus:</label>
                    <select
                      className="w-full p-1 bg-background border rounded"
                      value={rotationDegrees}
                      onChange={(e) => setRotationDegrees(parseInt(e.target.value))}
                    >
                      <option value="90">90°</option>
                      <option value="180">180°</option>
                      <option value="270">270°</option>
                    </select>
                  </div>
                </div>
                <button
                  className="w-full text-sm px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleRotateGroup}
                >
                  Girar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};