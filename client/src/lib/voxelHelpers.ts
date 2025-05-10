import { BlockType } from "./blocks";

// Helper to get a unique key for a voxel position
export const getVoxelKey = (x: number, y: number, z: number): string => {
  return `${x},${y},${z}`;
};

// Helper to parse a voxel key back to coordinates
export const parseVoxelKey = (key: string): [number, number, number] => {
  const [x, y, z] = key.split(',').map(Number);
  return [x, y, z];
};

// Helper to check if a position is within the dimension bounds
export const isWithinBounds = (
  x: number, 
  y: number, 
  z: number, 
  dimensions: [number, number, number]
): boolean => {
  return (
    x >= 0 && x < dimensions[0] &&
    y >= 0 && y < dimensions[1] &&
    z >= 0 && z < dimensions[2]
  );
};

// Helper to get adjacent positions
export const getAdjacentPositions = (
  x: number,
  y: number,
  z: number
): [number, number, number][] => {
  return [
    [x + 1, y, z],
    [x - 1, y, z],
    [x, y + 1, z],
    [x, y - 1, z],
    [x, y, z + 1],
    [x, y, z - 1]
  ];
};

// Helper for flood fill algorithm (used by bucket fill tool)
export const floodFill = (
  x: number,
  y: number,
  z: number,
  targetType: BlockType | null,
  replacementType: BlockType,
  dimensions: [number, number, number],
  getBlock: (x: number, y: number, z: number) => BlockType | null,
  setBlock: (x: number, y: number, z: number, blockType: BlockType) => void
): void => {
  // If target is already the replacement or out of bounds, return
  if (
    !isWithinBounds(x, y, z, dimensions) ||
    getBlock(x, y, z) !== targetType ||
    targetType === replacementType
  ) {
    return;
  }
  
  // Use a queue to avoid stack overflow for large fills
  const queue: [number, number, number][] = [[x, y, z]];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const [cx, cy, cz] = queue.shift()!;
    const key = getVoxelKey(cx, cy, cz);
    
    // Skip if already visited
    if (visited.has(key)) {
      continue;
    }
    
    // Mark as visited
    visited.add(key);
    
    // If current position has the target type, fill it
    if (
      isWithinBounds(cx, cy, cz, dimensions) &&
      getBlock(cx, cy, cz) === targetType
    ) {
      setBlock(cx, cy, cz, replacementType);
      
      // Add adjacent positions to queue
      getAdjacentPositions(cx, cy, cz).forEach(([nx, ny, nz]) => {
        queue.push([nx, ny, nz]);
      });
    }
  }
};

// Helper to optimize a group of voxels into contiguous regions
// (Used for mcfunction export to generate optimized /fill commands)
export interface FillRegion {
  start: [number, number, number];
  end: [number, number, number];
  blockType: BlockType;
}

export const optimizeVoxelRegions = (
  voxels: Record<string, BlockType>,
  dimensions: [number, number, number]
): FillRegion[] => {
  // Convert voxels to a 3D array for easier processing
  const grid: (BlockType | null)[][][] = Array(dimensions[0])
    .fill(null)
    .map(() => 
      Array(dimensions[1])
        .fill(null)
        .map(() => Array(dimensions[2]).fill(null))
    );
  
  // Fill the grid with block data
  for (const [key, blockType] of Object.entries(voxels)) {
    const [x, y, z] = parseVoxelKey(key);
    if (isWithinBounds(x, y, z, dimensions)) {
      grid[x][y][z] = blockType;
    }
  }
  
  // Keep track of processed voxels
  const processed = new Set<string>();
  const regions: FillRegion[] = [];
  
  // Process each voxel
  for (let x = 0; x < dimensions[0]; x++) {
    for (let y = 0; y < dimensions[1]; y++) {
      for (let z = 0; z < dimensions[2]; z++) {
        const blockType = grid[x][y][z];
        const key = getVoxelKey(x, y, z);
        
        // Skip if empty or already processed
        if (blockType === null || processed.has(key)) {
          continue;
        }
        
        // Try to expand in all directions as much as possible
        let endX = x;
        let endY = y;
        let endZ = z;
        
        // Expand in X direction
        while (
          endX + 1 < dimensions[0] &&
          grid[endX + 1][y][z] === blockType &&
          !processed.has(getVoxelKey(endX + 1, y, z))
        ) {
          endX++;
        }
        
        // Expand in Y direction
        let canExpandY = true;
        while (canExpandY && endY + 1 < dimensions[1]) {
          // Check if the entire X range has same block type
          for (let ix = x; ix <= endX; ix++) {
            if (
              grid[ix][endY + 1][z] !== blockType ||
              processed.has(getVoxelKey(ix, endY + 1, z))
            ) {
              canExpandY = false;
              break;
            }
          }
          
          if (canExpandY) {
            endY++;
          }
        }
        
        // Expand in Z direction
        let canExpandZ = true;
        while (canExpandZ && endZ + 1 < dimensions[2]) {
          // Check if the entire X-Y plane has same block type
          for (let ix = x; ix <= endX; ix++) {
            for (let iy = y; iy <= endY; iy++) {
              if (
                grid[ix][iy][endZ + 1] !== blockType ||
                processed.has(getVoxelKey(ix, iy, endZ + 1))
              ) {
                canExpandZ = false;
                break;
              }
            }
            if (!canExpandZ) break;
          }
          
          if (canExpandZ) {
            endZ++;
          }
        }
        
        // Mark all voxels in the region as processed
        for (let ix = x; ix <= endX; ix++) {
          for (let iy = y; iy <= endY; iy++) {
            for (let iz = z; iz <= endZ; iz++) {
              processed.add(getVoxelKey(ix, iy, iz));
            }
          }
        }
        
        // Add the region
        regions.push({
          start: [x, y, z],
          end: [endX, endY, endZ],
          blockType
        });
      }
    }
  }
  
  return regions;
};
