import { useRef, useState, useEffect } from "react";
import { useProject } from "@/lib/stores/useProject";
import { useEditor } from "@/lib/stores/useEditor";
import { BlockType } from "@/lib/blocks";

// Minecraft chunk size (16x16)
const CHUNK_SIZE = 16;

export const Canvas2D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { voxels, dimensions } = useProject();
  const { 
    currentLayer, 
    activeTool, 
    selectedBlockType,
    showChunks,
    activeChunk,
    setActiveTool,
    setCurrentLayer,
    setActiveChunk
  } = useEditor();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(20); // Pixels per cell
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Pan offset
  const [lastPos, setLastPos] = useState<{ x: number, y: number } | null>(null);

  // Get project functions
  const { setBlock, removeBlock } = useProject();

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        renderCanvas();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Re-render when dependencies change
  useEffect(() => {
    renderCanvas();
  }, [voxels, currentLayer, scale, offset, dimensions]);

  // Render the canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center the grid in the canvas
    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;
    
    const gridWidth = dimensions[0];
    const gridHeight = dimensions[2]; // Z dimension is height in 2D view
    
    // Adjust for drawing from the center
    const startX = centerX - (gridWidth * scale) / 2;
    const startY = centerY - (gridHeight * scale) / 2;

    // Draw grid
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.5;

    // Draw horizontal grid lines
    for (let i = 0; i <= gridHeight; i++) {
      ctx.beginPath();
      ctx.moveTo(startX, startY + i * scale);
      ctx.lineTo(startX + gridWidth * scale, startY + i * scale);
      ctx.stroke();
    }

    // Draw vertical grid lines
    for (let i = 0; i <= gridWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(startX + i * scale, startY);
      ctx.lineTo(startX + i * scale, startY + gridHeight * scale);
      ctx.stroke();
    }
    
    // Draw chunks if enabled
    if (showChunks) {
      // Calculate number of chunks in each dimension
      const chunksX = Math.ceil(gridWidth / CHUNK_SIZE);
      const chunksZ = Math.ceil(gridHeight / CHUNK_SIZE);
      
      // Draw chunk grid
      ctx.strokeStyle = '#5050FF'; // Blue for chunk boundaries
      ctx.lineWidth = 2;
      
      // Horizontal chunk lines
      for (let z = 0; z <= chunksZ; z++) {
        const zPos = z * CHUNK_SIZE;
        if (zPos > gridHeight) continue;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY + zPos * scale);
        ctx.lineTo(startX + gridWidth * scale, startY + zPos * scale);
        ctx.stroke();
      }
      
      // Vertical chunk lines
      for (let x = 0; x <= chunksX; x++) {
        const xPos = x * CHUNK_SIZE;
        if (xPos > gridWidth) continue;
        
        ctx.beginPath();
        ctx.moveTo(startX + xPos * scale, startY);
        ctx.lineTo(startX + xPos * scale, startY + gridHeight * scale);
        ctx.stroke();
      }
      
      // Highlight active chunk if there is one
      if (activeChunk) {
        const [chunkX, chunkZ] = activeChunk;
        const x = chunkX * CHUNK_SIZE;
        const z = chunkZ * CHUNK_SIZE;
        
        // Check if chunk is in bounds
        if (x < gridWidth && z < gridHeight) {
          // Calculate size respecting dimensions
          const sizeX = Math.min(CHUNK_SIZE, gridWidth - x);
          const sizeZ = Math.min(CHUNK_SIZE, gridHeight - z);
          
          // Draw active chunk outline
          ctx.strokeStyle = '#FF2020'; // Red for active chunk
          ctx.lineWidth = 3;
          ctx.strokeRect(
            startX + x * scale, 
            startY + z * scale, 
            sizeX * scale, 
            sizeZ * scale
          );
        }
      }
    }

    // Draw blocks in current layer
    for (const [posKey, blockType] of Object.entries(voxels)) {
      const [x, y, z] = posKey.split(',').map(Number);
      
      // Only draw blocks in the current layer
      if (y === currentLayer) {
        const pixelX = startX + x * scale;
        const pixelY = startY + z * scale; // Z is the vertical axis in the 2D view
        
        // Draw block
        ctx.fillStyle = getBlockColor(blockType);
        ctx.fillRect(pixelX, pixelY, scale, scale);
        
        // Draw block outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, scale, scale);
      }
    }

    // Draw coordinates
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`Layer Y: ${currentLayer}`, 10, 20);
  };

  // Get color for block type
  const getBlockColor = (blockType: BlockType) => {
    const colors: Record<string, string> = {
      "minecraft:stone": "#888888",
      "minecraft:dirt": "#8B4513",
      "minecraft:grass_block": "#567D46",
      "minecraft:oak_planks": "#B8814B",
      "minecraft:oak_log": "#8B4513",
      "minecraft:glass": "#E0FFFF",
      "minecraft:water": "#3333FF",
      "minecraft:lava": "#FF5500",
      "minecraft:sand": "#F0E68C",
      "minecraft:gravel": "#808080",
      "minecraft:gold_block": "#FFD700",
      "minecraft:iron_block": "#C0C0C0",
      "minecraft:diamond_block": "#00FFFF",
      "minecraft:redstone_block": "#FF0000",
      "minecraft:emerald_block": "#00FF00",
      "minecraft:bedrock": "#333333",
    };
    return colors[blockType] || "#FF00FF";
  };

  // Convert mouse position to grid coordinates
  const getGridCoordinates = (mouseX: number, mouseY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Calculate grid dimensions
    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;
    
    const gridWidth = dimensions[0];
    const gridHeight = dimensions[2];
    
    // Adjust for drawing from the center
    const startX = centerX - (gridWidth * scale) / 2;
    const startY = centerY - (gridHeight * scale) / 2;

    // Calculate grid coordinates
    const gridX = Math.floor((mouseX - startX) / scale);
    const gridZ = Math.floor((mouseY - startY) / scale);

    // Check if within bounds
    if (gridX >= 0 && gridX < dimensions[0] && gridZ >= 0 && gridZ < dimensions[2]) {
      return { x: gridX, z: gridZ };
    }
    
    return null;
  };

  // Get chunk coordinates from grid position
  const getChunkCoordinates = (gridX: number, gridZ: number): [number, number] => {
    return [Math.floor(gridX / CHUNK_SIZE), Math.floor(gridZ / CHUNK_SIZE)];
  };
  
  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Middle mouse button for panning
    if (e.button === 1 || e.buttons === 4) {
      setLastPos({ x: mouseX, y: mouseY });
      return;
    }

    // Left mouse button for interaction
    if (e.button === 0) {
      const gridPos = getGridCoordinates(mouseX, mouseY);
      if (gridPos) {
        // If Alt key is pressed, select chunk instead of placing blocks
        if (e.altKey && showChunks) {
          const [chunkX, chunkZ] = getChunkCoordinates(gridPos.x, gridPos.z);
          setActiveChunk([chunkX, chunkZ]);
          return;
        }
        
        setIsDrawing(true);
        
        // Place or remove block based on active tool
        if (activeTool === 'place') {
          setBlock(gridPos.x, currentLayer, gridPos.z, selectedBlockType);
        } else if (activeTool === 'remove') {
          removeBlock(gridPos.x, currentLayer, gridPos.z);
        }
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Panning with middle mouse button
    if (e.buttons === 4 || (e.buttons === 1 && e.button === 1) || lastPos) {
      if (lastPos) {
        const deltaX = mouseX - lastPos.x;
        const deltaY = mouseY - lastPos.y;
        
        setOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        setLastPos({ x: mouseX, y: mouseY });
      }
      return;
    }

    // Drawing with left mouse button
    if (isDrawing && e.buttons === 1) {
      const gridPos = getGridCoordinates(mouseX, mouseY);
      if (gridPos) {
        if (activeTool === 'place') {
          setBlock(gridPos.x, currentLayer, gridPos.z, selectedBlockType);
        } else if (activeTool === 'remove') {
          removeBlock(gridPos.x, currentLayer, gridPos.z);
        }
      }
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  // Handle mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY;
    
    // Zoom in/out
    setScale(prevScale => {
      const newScale = delta > 0 
        ? Math.max(5, prevScale - 1) 
        : Math.min(50, prevScale + 1);
      return newScale;
    });
  };

  // Handle key press for layer navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        // Move one layer up
        setCurrentLayer(Math.min(currentLayer + 1, dimensions[1] - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        // Move one layer down
        setCurrentLayer(Math.max(currentLayer - 1, 0));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLayer, dimensions, setCurrentLayer]);

  // Layer controls component
  const LayerControls = () => {
    return (
      <div className="absolute right-4 top-4 bg-background border border-border rounded-md p-2">
        <div className="text-center mb-2">Layer Y: {currentLayer}</div>
        <input
          type="range"
          min={0}
          max={dimensions[1] - 1}
          value={currentLayer}
          onChange={(e) => setCurrentLayer(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            className="bg-primary text-primary-foreground px-2 py-1 rounded disabled:opacity-50"
            onClick={() => setCurrentLayer(Math.min(currentLayer + 1, dimensions[1] - 1))}
            disabled={currentLayer >= dimensions[1] - 1}
          >
            Up
          </button>
          <button
            className="bg-primary text-primary-foreground px-2 py-1 rounded disabled:opacity-50"
            onClick={() => setCurrentLayer(Math.max(currentLayer - 1, 0))}
            disabled={currentLayer <= 0}
          >
            Down
          </button>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <LayerControls />
    </div>
  );
};
