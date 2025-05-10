import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Box } from "@react-three/drei";
import * as THREE from "three";
import { useEditor } from "@/lib/stores/useEditor";
import { useProject } from "@/lib/stores/useProject";
import { BlockType } from "@/lib/blocks";

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
      "minecraft:grass_block": "#567D46",
      "minecraft:oak_planks": "#B8814B",
      "minecraft:oak_log": "#B8814B",
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
    return colors[blockType] || "#FF00FF"; // Default to pink if unknown
  }, [blockType]);

  // Handle hover effect
  useEffect(() => {
    if (mesh.current) {
      document.body.style.cursor = hovered ? "pointer" : "auto";
    }
  }, [hovered]);

  return (
    <Box
      ref={mesh}
      args={[0.95, 0.95, 0.95]} // Slightly smaller than 1 to see edges
      position={position}
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
      />
    </Box>
  );
};

// Component to handle raycasting and block placement
const BlockInteraction = () => {
  const { camera, raycaster, pointer, scene } = useThree();
  const { activeTool, selectedBlockType, hoveredPosition, setHoveredPosition } = useEditor();
  const { getBlock, setBlock, removeBlock } = useProject();

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
      setHoveredPosition(normalizedPos.toArray() as [number, number, number]);
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
    } else if (activeTool === "remove") {
      removeBlock(x, y, z);
    }
  };

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
    return Object.entries(voxels).map(([key, blockType]) => {
      const [x, y, z] = key.split(',').map(Number);
      return { 
        position: [x, y, z] as [number, number, number], 
        blockType 
      };
    });
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
      {/* Grid visualization */}
      {showGrid && (
        <>
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
          <Grid 
            rotation={[Math.PI / 2, 0, 0]} 
            position={[0, dimensions[1] / 2, 0]} 
            args={[dimensions[0] * 2, dimensions[1] * 2]} 
            cellSize={1}
            cellThickness={0.5}
            cellColor="#666666"
            fadeDistance={dimensions[0] * 2}
            infiniteGrid={false}
          />
          <Grid 
            rotation={[0, Math.PI / 2, 0]} 
            position={[0, 0, 0]} 
            args={[dimensions[2] * 2, dimensions[1] * 2]} 
            cellSize={1}
            cellThickness={0.5}
            cellColor="#666666"
            fadeDistance={dimensions[2] * 2}
            infiniteGrid={false}
          />
        </>
      )}

      {/* Render all voxels */}
      {voxelsArray.map((voxel, index) => (
        <Voxel
          key={`${voxel.position.join(',')}`}
          position={voxel.position as [number, number, number]}
          blockType={voxel.blockType}
          onClick={() => handleVoxelClick(voxel.position as [number, number, number])}
        />
      ))}

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
        camera={{ position: [10, 10, 10], fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        {/* Scene content */}
        <Scene />
        
        {/* Ghost block preview */}
        <GhostBlock />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
};
