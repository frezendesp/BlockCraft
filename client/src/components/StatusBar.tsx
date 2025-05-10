import { useEffect, useState } from "react";
import { useEditor } from "../lib/stores/useEditor";
import { useProject } from "../lib/stores/useProject";

export const StatusBar = () => {
  const { hoveredPosition, selectedBlockType, activeTool } = useEditor();
  const { voxels, dimensions, getBlock, groups, activeGroupId, getGroupById } = useProject();
  const [blockCount, setBlockCount] = useState(0);
  const [hoveredBlockType, setHoveredBlockType] = useState<string | null>(null);
  const [groupBlockCount, setGroupBlockCount] = useState(0);
  
  // Get the active group, if any
  const activeGroup = activeGroupId ? getGroupById(activeGroupId) : null;
  
  // Selection state from editor
  const selectionStart = useEditor(state => state.selectionStart);
  const selectionEnd = useEditor(state => state.selectionEnd);
  
  // Check if there's an active selection
  const hasActiveSelection = !!(selectionStart && selectionEnd);
  
  // Handle creating a group from current selection
  const handleCreateGroup = () => {
    if (selectionStart && selectionEnd) {
      const { createGroup } = useProject.getState();
      const groupId = createGroup(selectionStart, selectionEnd, "Novo Grupo");
      
      if (groupId) {
        // Clear selection after creating group in the editor state
        useEditor.setState({ 
          selectionStart: null, 
          selectionEnd: null 
        });
      }
    }
  };
  
  // Calculate block statistics
  useEffect(() => {
    setBlockCount(Object.keys(voxels).length);
  }, [voxels]);
  
  // Calculate active group statistics
  useEffect(() => {
    if (activeGroup) {
      setGroupBlockCount(Object.keys(activeGroup.blocks).length);
    } else {
      setGroupBlockCount(0);
    }
  }, [activeGroup]);
  
  // Get block type at hovered position
  useEffect(() => {
    if (hoveredPosition) {
      const [x, y, z] = hoveredPosition;
      const block = getBlock(x, y, z);
      setHoveredBlockType(block || null);
    } else {
      setHoveredBlockType(null);
    }
  }, [hoveredPosition, getBlock]);
  
  // Format block type for display (remove minecraft: prefix)
  const formatBlockType = (blockType: string) => {
    return blockType.replace('minecraft:', '').replace(/_/g, ' ');
  };
  
  // Minecraft height limits for visual indication
  const MIN_HEIGHT = -64;
  const MAX_HEIGHT = 319;
  
  // Get height level indicator color
  const getHeightIndicatorColor = (y: number) => {
    if (y >= 256) return "text-blue-500"; // High altitude
    if (y >= 192) return "text-cyan-500"; // Very high
    if (y >= 128) return "text-green-500"; // High
    if (y >= 64) return "text-lime-500"; // Ground level
    if (y >= 0) return "text-yellow-500"; // Underground
    if (y >= -32) return "text-orange-500"; // Deep underground
    return "text-red-500"; // Deepslate level
  };
  
  return (
    <div className="flex justify-between items-center p-2 bg-card border-t border-border text-sm">
      <div className="flex space-x-4">
        {/* Coordinates with height indicator */}
        <div className="text-muted-foreground flex items-center">
          {hoveredPosition ? (
            <>
              <span>X: {hoveredPosition[0]},</span>
              <span className={`mx-1 ${getHeightIndicatorColor(hoveredPosition[1])}`}>
                Y: {hoveredPosition[1]}
              </span>
              <span>, Z: {hoveredPosition[2]}</span>
            </>
          ) : (
            <>X: -, Y: -, Z: -</>
          )}
        </div>
        
        {/* Hovered block information */}
        {hoveredBlockType && (
          <div className="text-muted-foreground">
            Bloco: <span className="text-primary">{formatBlockType(hoveredBlockType)}</span>
          </div>
        )}
        
        {/* Selected Block Type */}
        <div className="text-muted-foreground">
          Selecionado: <span className="font-medium text-primary">{formatBlockType(selectedBlockType)}</span>
        </div>
        
        {/* Current Tool */}
        <div className="text-muted-foreground">
          Ferramenta: <span className="font-medium text-primary capitalize">
            {activeTool === 'place' ? 'colocar' : 
             activeTool === 'remove' ? 'remover' : 
             activeTool === 'fill' ? 'preencher' : 
             activeTool === 'select' ? 'selecionar' : 
             activeTool === 'group' ? 'agrupar' : activeTool}
          </span>
        </div>
        
        {/* Quick action for active selection */}
        {hasActiveSelection && (
          <button
            className="text-sm px-2 py-0.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            onClick={handleCreateGroup}
          >
            Criar Grupo
          </button>
        )}
      </div>
      
      <div className="flex space-x-4">
        {/* Height range */}
        <div className="text-muted-foreground">
          Altura: <span className="text-primary">{MIN_HEIGHT}</span> a <span className="text-primary">{MAX_HEIGHT}</span>
        </div>
        
        {/* Block count */}
        <div className="text-muted-foreground">
          {blockCount} bloco{blockCount !== 1 ? "s" : ""} colocado{blockCount !== 1 ? "s" : ""}
        </div>
        
        {/* Active group information */}
        {activeGroup && (
          <div className="text-muted-foreground flex items-center">
            <span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5"></span>
            Grupo ativo: <span className="font-medium text-amber-500 mx-1">{activeGroup.name}</span>
            ({groupBlockCount} bloco{groupBlockCount !== 1 ? "s" : ""})
          </div>
        )}
      </div>
    </div>
  );
};
