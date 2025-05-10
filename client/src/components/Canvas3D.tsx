import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Box, Line } from "@react-three/drei";
import * as THREE from "three";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { BlockType } from "@/lib/blocks";

// Minecraft chunk size (16x16)
const CHUNK_SIZE = 16;

// Helper component to render chunk grid
interface ChunkGridProps {
  dimensions: [number, number, number];
  activeChunk: [number, number] | null;
}

const ChunkGrid = ({ dimensions, activeChunk }: ChunkGridProps) => {
  const setActiveChunk = useEditor(state => state.setActiveChunk);
  
  // Calculate number of chunks in each dimension
  const chunksX = Math.ceil(dimensions[0] / CHUNK_SIZE);
  const chunksZ = Math.ceil(dimensions[2] / CHUNK_SIZE);
  
  // Generate lines for chunk boundaries
  const chunkLines = useMemo(() => {
    const lines: Array<{
      points: [number, number, number][];
      color: string;
      lineWidth: number;
    }> = [];
    
    // Create horizontal chunk lines (along X axis)
    for (let z = 0; z <= chunksZ; z++) {
      const zPos = z * CHUNK_SIZE;
      if (zPos > dimensions[2]) continue; // Skip if outside dimensions
      
      const points: [number, number, number][] = [];
      for (let x = 0; x <= dimensions[0]; x++) {
        points.push([x, 0, zPos]);
      }
      
      lines.push({
        points,
        color: "#5050FF", // Blue for chunk boundaries
        lineWidth: 2,
      });
    }
    
    // Create vertical chunk lines (along Z axis)
    for (let x = 0; x <= chunksX; x++) {
      const xPos = x * CHUNK_SIZE;
      if (xPos > dimensions[0]) continue; // Skip if outside dimensions
      
      const points: [number, number, number][] = [];
      for (let z = 0; z <= dimensions[2]; z++) {
        points.push([xPos, 0, z]);
      }
      
      lines.push({
        points,
        color: "#5050FF", // Blue for chunk boundaries
        lineWidth: 2,
      });
    }
    
    return lines;
  }, [dimensions, chunksX, chunksZ]);
  
  // Render the highlighted active chunk with vertical extensions
  const activeChunkMesh = useMemo(() => {
    if (!activeChunk) return null;
    
    const [chunkX, chunkZ] = activeChunk;
    const x = chunkX * CHUNK_SIZE;
    const z = chunkZ * CHUNK_SIZE;
    
    // Make sure chunk is in bounds
    if (x >= dimensions[0] || z >= dimensions[2]) return null;
    
    // Calculate maximum chunk size based on remaining dimensions
    const sizeX = Math.min(CHUNK_SIZE, dimensions[0] - x);
    const sizeZ = Math.min(CHUNK_SIZE, dimensions[2] - z);
    
    // Max height for vertical lines (Minecraft's max height)
    const MAX_HEIGHT = 319;
    
    // Create points for all the lines
    const lines: [number, number, number][][] = [
      // Bottom perimeter outline
      [
        [x, 0, z],
        [x + sizeX, 0, z],
        [x + sizeX, 0, z + sizeZ],
        [x, 0, z + sizeZ],
        [x, 0, z],
      ],
      // Corner 1: Vertical line going up from the first corner
      [
        [x, 0, z],
        [x, Math.min(MAX_HEIGHT, dimensions[1]), z]
      ],
      // Corner 2: Vertical line going up from the second corner
      [
        [x + sizeX, 0, z],
        [x + sizeX, Math.min(MAX_HEIGHT, dimensions[1]), z]
      ],
      // Corner 3: Vertical line going up from the third corner
      [
        [x + sizeX, 0, z + sizeZ],
        [x + sizeX, Math.min(MAX_HEIGHT, dimensions[1]), z + sizeZ]
      ],
      // Corner 4: Vertical line going up from the fourth corner
      [
        [x, 0, z + sizeZ],
        [x, Math.min(MAX_HEIGHT, dimensions[1]), z + sizeZ]
      ]
    ];
    
    return lines.map((linePoints, index) => (
      <Line
        key={`active-chunk-${index}`}
        points={linePoints}
        color="#FF2020" // Red for active chunk
        lineWidth={3}
      />
    ));
  }, [activeChunk, dimensions]);
  
  // Handle clicking on a chunk
  const handleChunkClick = useCallback((chunkX: number, chunkZ: number) => {
    if (chunkX < 0 || chunkX >= chunksX || chunkZ < 0 || chunkZ >= chunksZ) {
      return; // Out of bounds
    }
    
    setActiveChunk([chunkX, chunkZ]);
  }, [chunksX, chunksZ, setActiveChunk]);
  
  // Create invisible planes for chunk selection
  const chunkPlanes = useMemo(() => {
    const planes: JSX.Element[] = [];
    
    for (let chunkX = 0; chunkX < chunksX; chunkX++) {
      for (let chunkZ = 0; chunkZ < chunksZ; chunkZ++) {
        const x = chunkX * CHUNK_SIZE;
        const z = chunkZ * CHUNK_SIZE;
        
        // Calculate size respecting dimensions
        const sizeX = Math.min(CHUNK_SIZE, dimensions[0] - x);
        const sizeZ = Math.min(CHUNK_SIZE, dimensions[2] - z);
        
        if (sizeX <= 0 || sizeZ <= 0) continue; // Skip if size is invalid
        
        planes.push(
          <mesh
            key={`chunk-${chunkX}-${chunkZ}`}
            position={[x + sizeX / 2, 0, z + sizeZ / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={() => handleChunkClick(chunkX, chunkZ)}
          >
            <planeGeometry args={[sizeX, sizeZ]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        );
      }
    }
    
    return planes;
  }, [dimensions, chunksX, chunksZ, handleChunkClick]);
  
  return (
    <>
      {/* Render chunk grid lines */}
      {chunkLines.map((line, index) => (
        <Line
          key={`chunk-line-${index}`}
          points={line.points}
          color={line.color}
          lineWidth={line.lineWidth}
        />
      ))}
      
      {/* Render active chunk highlight */}
      {activeChunkMesh}
      
      {/* Invisible planes for interaction */}
      {chunkPlanes}
    </>
  );
};

// Helper component to render a single voxel
const Voxel = ({ 
  position, 
  blockType, 
  onClick 
}: { 
  position: [number, number, number]; 
  blockType: BlockType; 
  onClick: () => void 
}) => {
  const [hovered, setHovered] = useState(false);
  const mesh = useRef<THREE.Mesh>(null);
  const selectedBlockType = useEditor(state => state.selectedBlockType);
  const activeTool = useEditor(state => state.activeTool);

  // Generate color based on blockType
  const color = useMemo(() => {
    const colors: Record<string, string> = {
      "minecraft:stone": "#888888",
      "minecraft:dirt": "#8B4513",
      "minecraft:grass_block": "#4CAF50",
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
      "minecraft:granite": "#9D5C5C",
      "minecraft:diorite": "#CCCCCC",
      "minecraft:andesite": "#8A8A8A",
      "minecraft:coal_ore": "#454545",
      "minecraft:cobblestone": "#777777",
      "minecraft:obsidian": "#120458",
      "minecraft:netherrack": "#813937",
      "minecraft:soul_sand": "#6A4830",
      "minecraft:glowstone": "#FFCC00",
      "minecraft:bricks": "#B03F35",
    };
    
    // Fallback to magenta for unknown blocks
    const blockColor = colors[blockType] || "#FF00FF";
    // console.log(`Rendering voxel at [${position.join(',')}] with color ${blockColor} for ${blockType}`);
    
    return blockColor;
  }, [blockType]);

  // Handle hover effect
  useEffect(() => {
    if (mesh.current) {
      document.body.style.cursor = hovered ? "pointer" : "auto";
    }
  }, [hovered]);

  // Debug logging
  useEffect(() => {
    console.log(`Rendering voxel at [${position.join(',')}] with color ${color}`);
  }, [position, color]);

  return (
    <Box
      ref={mesh}
      args={[0.95, 0.95, 0.95]} // Slightly smaller than 1 to see edges
      position={position}
      name="voxel" // Important for raycasting
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial 
        color={color} 
        opacity={hovered ? 0.8 : 1}
        transparent={hovered}
        roughness={0.7}
        metalness={0.2}
      />
    </Box>
  );
};

// Component to handle raycasting and block placement
const BlockInteraction = () => {
  const { camera, raycaster, pointer, scene } = useThree();
  const { 
    activeTool, 
    selectedBlockType, 
    hoveredPosition, 
    setHoveredPosition,
    isShiftPressed,
    setIsShiftPressed,
    isDragging,
    setIsDragging
  } = useEditor();
  const { getBlock, setBlock, removeBlock } = useProject();
  const lastPlacedPosition = useRef<[number, number, number] | null>(null);

  // Monitor shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsShiftPressed]);

  // Update raycaster on pointer move
  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);

    // Calculate intersections with existing blocks
    const blocks = scene.children.filter(child => child.name === "voxel");
    const intersects = raycaster.intersectObjects(blocks);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const normal = intersect.face!.normal.clone();
      const position = intersect.object.position.clone();

      // Convert to normal grid coordinates
      const normalizedPos = position.clone().add(normal).round();
      const newPosition = normalizedPos.toArray() as [number, number, number];
      setHoveredPosition(newPosition);
      
      // Handle continuous placement during drag
      if (isDragging && isShiftPressed) {
        const [x, y, z] = newPosition;
        
        // Avoid placing blocks in the same position multiple times
        if (!lastPlacedPosition.current || 
            lastPlacedPosition.current[0] !== x || 
            lastPlacedPosition.current[1] !== y || 
            lastPlacedPosition.current[2] !== z) {
          
          if (activeTool === "place") {
            setBlock(x, y, z, selectedBlockType);
          } else if (activeTool === "remove") {
            removeBlock(x, y, z);
          }
          
          lastPlacedPosition.current = newPosition;
        }
      }
    } else {
      setHoveredPosition(null);
    }
  });

  // Handle block placement on click
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!hoveredPosition) return;

    const [x, y, z] = hoveredPosition;

    if (activeTool === "place") {
      setBlock(x, y, z, selectedBlockType);
      lastPlacedPosition.current = hoveredPosition;
    } else if (activeTool === "remove") {
      removeBlock(x, y, z);
      lastPlacedPosition.current = hoveredPosition;
    }
    
    // If shift is pressed, start dragging mode
    if (isShiftPressed) {
      setIsDragging(true);
    }
  };
  
  // Handle mouse up to stop dragging
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        lastPlacedPosition.current = null;
      }
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, setIsDragging]);

  return (
    <mesh position={[0, 0, 0]} onClick={handleClick}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
};

// Scene component to render all voxels
const Scene = () => {
  // Use selectors to avoid infinite loops
  const voxels = useProject(state => state.voxels);
  const dimensions = useProject(state => state.dimensions);
  const showGrid = useEditor(state => state.showGrid);

  // Convert voxels Map to array for rendering
  const voxelsArray = useMemo(() => {
    // Create an explicit array of blocks from the voxels object
    const result = Object.entries(voxels).map(([key, blockType]) => {
      const [x, y, z] = key.split(',').map(Number);
      
      // Skip "air" blocks - they don't need to be rendered
      if (blockType === "minecraft:air") return null;
      
      return { 
        position: [x, y, z] as [number, number, number], 
        blockType 
      };
    }).filter(Boolean); // Remove null values
    
    // For explicit debug
    if (result.length === 0) {
      console.log("Warning: No blocks to render in 3D view");
      
      // Add a single red test block at origin if nothing to render
      result.push({
        position: [25, 50, 25] as [number, number, number],
        blockType: "minecraft:redstone_block"
      });
    }
    
    // Log for debugging
    console.log(`Canvas3D: Rendering ${result.length} voxels:`, result);
    
    return result;
  }, [voxels]);

  // Handle voxel click events
  const handleVoxelClick = useCallback((position: [number, number, number]) => {
    const [x, y, z] = position;
    const { activeTool, selectedBlockType } = useEditor.getState();
    const { setBlock, removeBlock } = useProject.getState();

    if (activeTool === "remove") {
      removeBlock(x, y, z);
    } else if (activeTool === "place") {
      // For placement, we actually need to check adjacency
      // which is handled in the BlockInteraction component
    }
  }, []);

  return (
    <>
      {/* Grid visualization - only horizontal grid (no Y-axis grid) */}
      {showGrid && (
        <Grid 
          position={[0, 0, 0]} 
          args={[dimensions[0] * 2, dimensions[2] * 2]} 
          cellSize={1}
          cellThickness={0.5}
          cellColor="#666666"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#888888"
          fadeDistance={dimensions[0] * 2}
          infiniteGrid={false}
        />
      )}
      
      {/* Chunk visualization */}
      {useEditor(state => state.showChunks) && (
        <ChunkGrid 
          dimensions={dimensions as [number, number, number]}
          activeChunk={useEditor(state => state.activeChunk)}
        />
      )}

      {/* Render all voxels */}
      {voxelsArray.map((voxel, index) => {
        // TypeScript safety check
        if (!voxel) return null;
        
        return (
          <Voxel
            key={`voxel-${voxel.position.join(',')}`}
            position={voxel.position as [number, number, number]}
            blockType={voxel.blockType}
            onClick={() => handleVoxelClick(voxel.position as [number, number, number])}
          />
        );
      })}

      {/* Handle block interaction */}
      <BlockInteraction />
    </>
  );
};

// Ghost block preview
const GhostBlock = () => {
  const hoveredPosition = useEditor(state => state.hoveredPosition);
  const selectedBlockType = useEditor(state => state.selectedBlockType);
  const activeTool = useEditor(state => state.activeTool);

  if (!hoveredPosition || activeTool !== 'place') return null;

  return (
    <Box
      args={[1, 1, 1]}
      position={hoveredPosition}
    >
      <meshStandardMaterial
        color={selectedBlockType === "minecraft:stone" ? "#888888" : "#FF00FF"}
        opacity={0.5}
        transparent={true}
      />
    </Box>
  );
};

// Main Canvas3D component
export const Canvas3D = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [25, 60, 25], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.7} />
        
        {/* Scene content */}
        <Scene />
        
        {/* Ghost block preview */}
        <GhostBlock />
        
        {/* Debug placeholders removed */}
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          dampingFactor={0.1}
          rotateSpeed={0.7}
          target={[10, 10, 10]} // Center view on the test blocks
        />
      </Canvas>
    </div>
  );
};
