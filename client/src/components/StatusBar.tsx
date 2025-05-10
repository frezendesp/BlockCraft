import { useEffect, useState } from "react";
import { useEditor } from "../lib/stores/useEditor";
import { useProject } from "../lib/stores/useProject";

export const StatusBar = () => {
  const { hoveredPosition } = useEditor();
  const { voxels, dimensions } = useProject();
  const [blockCount, setBlockCount] = useState(0);
  
  // Calculate block statistics
  useEffect(() => {
    setBlockCount(Object.keys(voxels).length);
  }, [voxels]);
  
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
        
        {/* Dimensions */}
        <div className="text-muted-foreground">
          Dimensions: {dimensions[0]} × {dimensions[1]} × {dimensions[2]}
        </div>
      </div>
      
      {/* Block count */}
      <div className="flex space-x-4">
        <div className="text-muted-foreground">
          {blockCount} block{blockCount !== 1 ? "s" : ""} placed
        </div>
      </div>
    </div>
  );
};
