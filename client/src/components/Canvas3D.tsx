import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Box, Line } from "@react-three/drei";
import * as THREE from "three";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { useAudio } from "@/lib/stores/useAudio";
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
  const currentLayer = useEditor(state => state.currentLayer); // Get current layer for proper positioning
  
  // Unlimited chunks in XZ plane
  // We'll display a reasonable number of chunks around the center (0,0)
  const visibleChunksRadius = 10; // Show 20x20 chunks (10 in each direction from center)
  
  // Calculate visible chunk boundaries
  const minChunkX = -visibleChunksRadius;
  const maxChunkX = visibleChunksRadius;
  const minChunkZ = -visibleChunksRadius;
  const maxChunkZ = visibleChunksRadius;
  
  // Generate lines for chunk boundaries in current layer
  const chunkLines = useMemo(() => {
    const lines: Array<{
      points: [number, number, number][];
      color: string;
      lineWidth: number;
    }> = [];
    
    // Create horizontal chunk lines (along X axis)
    for (let z = minChunkZ; z <= maxChunkZ; z++) {
      const zPos = z * CHUNK_SIZE;
      
      const points: [number, number, number][] = [];
      for (let x = minChunkX * CHUNK_SIZE; x <= maxChunkX * CHUNK_SIZE; x++) {
        points.push([x, currentLayer, zPos]);
      }
      
      lines.push({
        points,
        color: "#5050FF", // Blue for chunk boundaries
        lineWidth: 1.5, // Slightly thinner for subtle appearance
      });
    }
    
    // Create vertical chunk lines (along Z axis)
    for (let x = minChunkX; x <= maxChunkX; x++) {
      const xPos = x * CHUNK_SIZE;
      
      const points: [number, number, number][] = [];
      for (let z = minChunkZ * CHUNK_SIZE; z <= maxChunkZ * CHUNK_SIZE; z++) {
        points.push([xPos, currentLayer, z]);
      }
      
      lines.push({
        points,
        color: "#5050FF", // Blue for chunk boundaries
        lineWidth: 1.5, // Slightly thinner for subtle appearance
      });
    }
    
    return lines;
  }, [currentLayer, minChunkX, maxChunkX, minChunkZ, maxChunkZ]);
  
  // Render the highlighted active chunk with vertical extensions
  const activeChunkMesh = useMemo(() => {
    if (!activeChunk) return null;
    
    const [chunkX, chunkZ] = activeChunk;
    const x = chunkX * CHUNK_SIZE;
    const z = chunkZ * CHUNK_SIZE;
    
    // Max height for vertical lines (Minecraft's max height)
    const MIN_HEIGHT = -64; // Minecraft's lowest point
    const MAX_HEIGHT = 319; // Minecraft's highest point
    
    // Create points for all the lines
    const lines: [number, number, number][][] = [
      // Bottom perimeter outline at current layer
      [
        [x, currentLayer, z],
        [x + CHUNK_SIZE, currentLayer, z],
        [x + CHUNK_SIZE, currentLayer, z + CHUNK_SIZE],
        [x, currentLayer, z + CHUNK_SIZE],
        [x, currentLayer, z],
      ],
      // Corner 1: Vertical line
      [
        [x, MIN_HEIGHT, z],
        [x, MAX_HEIGHT, z]
      ],
      // Corner 2: Vertical line
      [
        [x + CHUNK_SIZE, MIN_HEIGHT, z],
        [x + CHUNK_SIZE, MAX_HEIGHT, z]
      ],
      // Corner 3: Vertical line
      [
        [x + CHUNK_SIZE, MIN_HEIGHT, z + CHUNK_SIZE],
        [x + CHUNK_SIZE, MAX_HEIGHT, z + CHUNK_SIZE]
      ],
      // Corner 4: Vertical line
      [
        [x, MIN_HEIGHT, z + CHUNK_SIZE],
        [x, MAX_HEIGHT, z + CHUNK_SIZE]
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
  }, [activeChunk, currentLayer]);
  
  // Handle clicking on a chunk
  const handleChunkClick = useCallback((chunkX: number, chunkZ: number) => {
    // In the unlimited XZ system, we don't need bounds checking the same way
    setActiveChunk([chunkX, chunkZ]);
  }, [setActiveChunk]);
  
  // Create invisible planes for chunk selection
  const chunkPlanes = useMemo(() => {
    const planes: JSX.Element[] = [];
    
    // Create clickable planes for visible chunks
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
      for (let chunkZ = minChunkZ; chunkZ <= maxChunkZ; chunkZ++) {
        const x = chunkX * CHUNK_SIZE;
        const z = chunkZ * CHUNK_SIZE;
        
        planes.push(
          <mesh
            key={`chunk-${chunkX}-${chunkZ}`}
            position={[x + CHUNK_SIZE / 2, currentLayer, z + CHUNK_SIZE / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={() => handleChunkClick(chunkX, chunkZ)}
          >
            <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        );
      }
    }
    
    return planes;
  }, [minChunkX, maxChunkX, minChunkZ, maxChunkZ, currentLayer, handleChunkClick]);
  
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

// ActiveGroupHighlight component to highlight the active group
const ActiveGroupHighlight = () => {
  const activeGroupId = useProject(state => state.activeGroupId);
  const groups = useProject(state => state.groups);
  
  // Return null if no group is active
  if (!activeGroupId || !groups[activeGroupId]) return null;
  
  const activeGroup = groups[activeGroupId];
  
  // Get the bounds of the group
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  // Find min/max boundaries from all blocks in the group
  Object.keys(activeGroup.blocks).forEach(posKey => {
    const [x, y, z] = posKey.split(',').map(Number);
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  });
  
  // Calculate dimensions
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const depth = maxZ - minZ + 1;
  
  // Calculate center for positioning
  const centerX = minX + width / 2 - 0.5;
  const centerY = minY + height / 2 - 0.5;
  const centerZ = minZ + depth / 2 - 0.5;
  
  console.log(`Highlighting group ${activeGroup.name} with bounds [${minX},${minY},${minZ}] to [${maxX},${maxY},${maxZ}]`);
  
  return (
    <group position={[centerX, centerY, centerZ]}>
      {/* Group volume */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial 
          color="#FF9900" 
          opacity={0.15} 
          transparent={true} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Group wireframe */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial 
          color="#FF9900" 
          wireframe={true} 
          opacity={0.8}
          transparent={true}
        />
      </mesh>
    </group>
  );
};

// SelectionBox component to visualize selected area
const SelectionBox = () => {
  const selectionStart = useEditor(state => state.selectionStart);
  const selectionEnd = useEditor(state => state.selectionEnd);
  
  // Return null if no selection is active
  if (!selectionStart || !selectionEnd) return null;
  
  // Normalize coordinates to get width, height, depth
  const [x1, y1, z1] = selectionStart;
  const [x2, y2, z2] = selectionEnd;
  
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const minZ = Math.min(z1, z2);
  const maxZ = Math.max(z1, z2);
  
  // Calculate box dimensions and center position
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const depth = maxZ - minZ + 1;
  
  // Position center
  const centerX = minX + width / 2 - 0.5;
  const centerY = minY + height / 2 - 0.5;
  const centerZ = minZ + depth / 2 - 0.5;
  
  console.log(`Rendering selection box from [${minX},${minY},${minZ}] to [${maxX},${maxY},${maxZ}]`);
  console.log(`Box dimensions: ${width} x ${height} x ${depth}`);
  
  return (
    <group position={[centerX, centerY, centerZ]}>
      {/* Selection volume */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial 
          color="#4488FF" 
          opacity={0.2} 
          transparent={true} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Selection wireframe */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial 
          color="#FFFFFF" 
          wireframe={true} 
          opacity={0.8}
          transparent={true}
        />
      </mesh>
    </group>
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
    <group position={position}>
      {/* Main block */}
      <Box
        ref={mesh}
        args={[0.96, 0.96, 0.96]} // Block with outline effect
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
          roughness={0.5}
          metalness={0.1}
        />
      </Box>
      
      {/* Outline wireframe */}
      <Box args={[1.001, 1.001, 1.001]}>
        <meshBasicMaterial 
          color="black" 
          wireframe={true} 
          opacity={0.2} 
          transparent={true}
        />
      </Box>
    </group>
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
    } else if (activeTool === "select") {
      // Selection tool behavior
      const { selectionStart } = useEditor.getState();
      
      if (!selectionStart) {
        // Start new selection
        console.log(`Selection start: [${x}, ${y}, ${z}]`);
        useEditor.setState({ selectionStart: [x, y, z] });
      } else {
        // Complete selection
        console.log(`Selection end: [${x}, ${y}, ${z}]`);
        useEditor.setState({ selectionEnd: [x, y, z] });
      }
      return; // Don't start dragging in selection mode
    } else if (activeTool === "fill") {
      // Fill tool requires both start and end points
      const { selectionStart, selectionEnd } = useEditor.getState();
      
      if (selectionStart && selectionEnd) {
        // Execute fill with selected block type
        const { fillArea } = useProject.getState();
        fillArea(selectionStart, selectionEnd, selectedBlockType);
        
        // Clear selection after filling
        useEditor.setState({ 
          selectionStart: null, 
          selectionEnd: null 
        });
        console.log(`Filled area from [${selectionStart}] to [${selectionEnd}] with ${selectedBlockType}`);
      } else {
        console.log("Select an area first before using fill tool");
      }
      return;
    } else if (activeTool === "group") {
      // Group creation requires both start and end points
      const { selectionStart, selectionEnd } = useEditor.getState();
      
      if (selectionStart && selectionEnd) {
        // Create a group from the selection
        const { createGroup } = useProject.getState();
        const groupId = createGroup(selectionStart, selectionEnd, "Novo Grupo");
        
        if (groupId) {
          console.log(`Created group with ID: ${groupId}`);
          
          // Clear selection after creating group
          useEditor.setState({ 
            selectionStart: null, 
            selectionEnd: null 
          });
        } else {
          console.log("Failed to create group: No blocks found in selection");
        }
      } else {
        console.log("Select an area first before creating a group");
      }
      return;
    }
    
    // If shift is pressed, start dragging mode (for place and remove tools)
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
  const showChunks = useEditor(state => state.showChunks);
  const currentLayer = useEditor(state => state.currentLayer); // Get current layer for grid rendering

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
        position: [0, 0, 0] as [number, number, number],
        blockType: "minecraft:redstone_block"
      });
    }
    
    // Log for debugging
    console.log(`Canvas3D: Rendering ${result.length} voxels:`, result);
    
    return result;
  }, [voxels]);

  // Handle voxel click events
  const handleVoxelClick = useCallback((position: [number, number, number], faceNormal?: [number, number, number]) => {
    const [x, y, z] = position;
    const { activeTool, selectedBlockType } = useEditor.getState();
    const { setBlock, removeBlock } = useProject.getState();

    if (activeTool === "remove") {
      removeBlock(x, y, z);
      // Play sound effect for block break
      const { playHit } = useAudio.getState();
      playHit();
    } else if (activeTool === "place" && faceNormal) {
      // Place block adjacent to the clicked face
      const [nx, ny, nz] = faceNormal;
      const newX = x + nx;
      const newY = y + ny;
      const newZ = z + nz;
      
      // Check if within valid Y range for Minecraft (-64 to 319)
      if (newY >= -64 && newY <= 319) {
        setBlock(newX, newY, newZ, selectedBlockType);
        // Play sound effect for block place
        const { playHit } = useAudio.getState();
        playHit();
      }
    }
  }, []);
  
  // Grid size should be large enough for realistic work
  const gridSize = 1000; // 1000x1000 grid around the center

  return (
    <>
      {/* Grid visualization - only at current layer */}
      {showGrid && (
        <>
          {/* Main grid at current layer level - fixed position to prevent shaking */}
          <mesh
            position={[0, currentLayer, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[gridSize, gridSize]} />
            <meshBasicMaterial 
              color="#333333" 
              opacity={0.2} 
              transparent={true}
              wireframe={true}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Chunk grid overlay - simplified stable approach */}
          {showChunks && (
            <group>
              <gridHelper 
                args={[gridSize, gridSize / 16, '#5050FF', '#5050FF']} 
                position={[0, currentLayer, 0]} 
              />
            </group>
          )}
          
          {/* Subtle reference indicators for Minecraft height limits */}
          {currentLayer === -64 && (
            <mesh position={[0, -64, 0]}>
              <planeGeometry args={[gridSize, gridSize]} />
              <meshBasicMaterial color="#FF5555" opacity={0.1} transparent={true} side={THREE.DoubleSide} />
            </mesh>
          )}
          
          {currentLayer === 319 && (
            <mesh position={[0, 319, 0]}>
              <planeGeometry args={[gridSize, gridSize]} />
              <meshBasicMaterial color="#5555FF" opacity={0.1} transparent={true} side={THREE.DoubleSide} />
            </mesh>
          )}
        </>
      )}
      
      {/* Chunk visualization */}
      {(() => {
        const showChunks = useEditor(state => state.showChunks);
        const activeChunk = useEditor(state => state.activeChunk);
        
        return showChunks ? (
          <ChunkGrid 
            dimensions={dimensions as [number, number, number]}
            activeChunk={activeChunk}
          />
        ) : null;
      })()}

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

  // Get color based on block type (similar to the Voxel component)
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
    };
    
    // Fallback to magenta for unknown blocks
    return colors[selectedBlockType] || "#FF00FF";
  }, [selectedBlockType]);

  return (
    <group position={hoveredPosition}>
      {/* Ghost block */}
      <Box args={[0.95, 0.95, 0.95]}>
        <meshStandardMaterial
          color={color}
          opacity={0.6}
          transparent={true}
        />
      </Box>
      
      {/* Wireframe outline */}
      <Box args={[1.01, 1.01, 1.01]}>
        <meshBasicMaterial
          color="white"
          wireframe={true}
          opacity={0.8}
          transparent={true}
        />
      </Box>
    </group>
  );
};

// Main Canvas3D component
export const Canvas3D = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [20, 20, 20], fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.7} />
        
        {/* Scene content */}
        <Scene />
        
        {/* Selection box visualization */}
        <SelectionBox />
        
        {/* Active group highlight */}
        <ActiveGroupHighlight />
        
        {/* Ghost block preview */}
        <GhostBlock />
        
        {/* Debug placeholders removed */}
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={500}
          dampingFactor={0.1}
          rotateSpeed={0.7}
          target={[0, 0, 0]} // Center view on origin
          makeDefault
        />
      </Canvas>
    </div>
  );
};
