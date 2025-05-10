import { useEffect, useState } from "react";
import { useEditor } from "../lib/stores/useEditor";
import { useProject } from "../lib/stores/useProject";

export const StatusBar = () => {
  const { hoveredPosition, selectedBlockType, activeTool } = useEditor();
  const { voxels, dimensions, getBlock } = useProject();
  const [blockCount, setBlockCount] = useState(0);
  const [hoveredBlockType, setHoveredBlockType] = useState<string | null>(null);
  
  // Calculate block statistics
  useEffect(() => {
    setBlockCount(Object.keys(voxels).length);
  }, [voxels]);
  
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
  
  return (
    <div className="flex justify-between items-center p-2 bg-card border-t border-border text-sm">
      <div className="flex space-x-4">
        {/* Coordinates */}
        <div className="text-muted-foreground">
          {hoveredPosition ? (
            <>X: {hoveredPosition[0]}, Y: {hoveredPosition[1]}, Z: {hoveredPosition[2]}</>
          ) : (
            <>X: -, Y: -, Z: -</>
          )}
        </div>
        
        {/* Hovered block information */}
        {hoveredBlockType && (
          <div className="text-muted-foreground">
            Block: <span className="text-primary">{formatBlockType(hoveredBlockType)}</span>
          </div>
        )}
        
        {/* Selected Block Type */}
        <div className="text-muted-foreground">
          Selected: <span className="font-medium text-primary">{formatBlockType(selectedBlockType)}</span>
        </div>
        
        {/* Current Tool */}
        <div className="text-muted-foreground">
          Tool: <span className="font-medium text-primary capitalize">{activeTool}</span>
        </div>
      </div>
      
      <div className="flex space-x-4">
        {/* Dimensions */}
        <div className="text-muted-foreground">
          Dimensions: {dimensions[0]} × {dimensions[1]} × {dimensions[2]}
        </div>
        
        {/* Block count */}
        <div className="text-muted-foreground">
          {blockCount} block{blockCount !== 1 ? "s" : ""} placed
        </div>
      </div>
    </div>
  );
};
