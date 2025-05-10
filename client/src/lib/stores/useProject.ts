import { create } from "zustand";
import { BlockType } from "../blocks";
import { useEditor } from "./useEditor";

// Define the structure of a history action
type HistoryAction = {
  type: "set" | "remove" | "batch";
  positions?: string[]; // For batch operations
  position?: string;    // For single operations
  blockType?: BlockType; // Only for set operations
  affectedBlocks?: Record<string, BlockType | null>; // For batch (stores previous state)
};

interface ProjectState {
  // Project settings
  dimensions: [number, number, number]; // [width, height, depth] (x, y, z)
  
  // Voxel data - using a sparse structure to save memory
  // Key is a string in the format "x,y,z", value is the block type
  voxels: Record<string, BlockType>;
  
  // History for undo/redo
  history: HistoryAction[];
  historyIndex: number;
  
  // Actions
  initializeProject: (dimensions?: [number, number, number]) => void;
  setBlock: (x: number, y: number, z: number, blockType: BlockType) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  getBlock: (x: number, y: number, z: number) => BlockType | null;
  fillArea: (
    start: [number, number, number], 
    end: [number, number, number], 
    blockType: BlockType
  ) => void;
  clearArea: (start: [number, number, number], end: [number, number, number]) => void;
  undo: () => void;
  redo: () => void;
  saveProject: () => Blob;
  loadProject: (jsonData: string) => void;
}

export const useProject = create<ProjectState>((set, get) => ({
  // Default dimensions [width(X), height(Y), depth(Z)]
  // Using Minecraft dimensions: X/Z (horizontal plane) 100x100, Y (vertical) from -64 to 319 = 384 total
  dimensions: [100, 384, 100],
  
  // Start with an empty voxel space
  voxels: {},
  
  // Empty history
  history: [],
  historyIndex: -1,
  
  // Initialize a new project
  initializeProject: (dimensions = [100, 100, 100]) => {
    set({
      dimensions,
      voxels: {},
      history: [],
      historyIndex: -1
    });
    
    // Update editor state
    useEditor.setState({
      currentLayer: 50, // Default Y level at 50 (Minecraft standard ground level)
      canUndo: false,
      canRedo: false
    });
  },
  
  // Set a block at a specific position
  setBlock: (x, y, z, blockType) => {
    const { voxels, dimensions, history, historyIndex } = get();
    
    // Debug information
    console.log(`Attempting to place block at [${x}, ${y}, ${z}] of type ${blockType}`);
    console.log(`Current dimensions: ${dimensions.join(' x ')}`);
    
    // Check if coordinates are valid (allowing Y to be between -64 and 319 for Minecraft)
    if (
      x < 0 || x >= dimensions[0] ||
      y < -64 || y > 319 || // Minecraft Y range: -64 to 319
      z < 0 || z >= dimensions[2]
    ) {
      console.warn(`Block placement out of bounds: [${x}, ${y}, ${z}]`);
      return;
    }
    
    const posKey = `${x},${y},${z}`;
    const existingBlock = voxels[posKey];
    
    // Check for duplicate block
    if (existingBlock === blockType) {
      console.log(`Skipping duplicate block at [${x}, ${y}, ${z}]`);
      return;
    }
    
    // Create new history entry
    const newAction: HistoryAction = {
      type: "set",
      position: posKey,
      blockType
    };
    
    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Debug log
    console.log(`Setting block at [${x},${y},${z}], type: ${blockType}`);
    
    // Update state
    const newVoxels = { ...voxels, [posKey]: blockType };
    
    // Debug: Count blocks
    console.log(`Total blocks after adding: ${Object.keys(newVoxels).length}`);
    
    set({
      voxels: newVoxels,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state for undo/redo buttons
    useEditor.setState({
      canUndo: true,
      canRedo: false
    });
  },
  
  // Remove a block at a specific position
  removeBlock: (x, y, z) => {
    const { voxels, dimensions, history, historyIndex } = get();
    
    // Check if coordinates are valid (allowing Y to be between -64 and 319 for Minecraft)
    if (
      x < 0 || x >= dimensions[0] ||
      y < -64 || y > 319 || // Minecraft Y range: -64 to 319
      z < 0 || z >= dimensions[2]
    ) {
      return;
    }
    
    const posKey = `${x},${y},${z}`;
    
    // Don't do anything if there's no block
    if (!voxels[posKey]) {
      return;
    }
    
    // Create new history entry
    const newAction: HistoryAction = {
      type: "remove",
      position: posKey,
      blockType: voxels[posKey]
    };
    
    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Create a new voxels object without the removed block
    const newVoxels = { ...voxels };
    delete newVoxels[posKey];
    
    // Update state
    set({
      voxels: newVoxels,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state for undo/redo buttons
    useEditor.setState({
      canUndo: true,
      canRedo: false
    });
  },
  
  // Get a block at a specific position
  getBlock: (x, y, z) => {
    const { voxels, dimensions } = get();
    
    // Check if coordinates are valid (allowing Y to be between -64 and 319 for Minecraft)
    if (
      x < 0 || x >= dimensions[0] ||
      y < -64 || y > 319 || // Minecraft Y range: -64 to 319
      z < 0 || z >= dimensions[2]
    ) {
      return null;
    }
    
    const posKey = `${x},${y},${z}`;
    return voxels[posKey] || null;
  },
  
  // Fill an area with a specific block type
  fillArea: (start, end, blockType) => {
    const { voxels, dimensions, history, historyIndex } = get();
    const newVoxels = { ...voxels };
    const affectedBlocks: Record<string, BlockType | null> = {};
    
    // Normalize coordinates
    const [x1, y1, z1] = start;
    const [x2, y2, z2] = end;
    
    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(dimensions[0] - 1, Math.max(x1, x2));
    const minY = Math.max(-64, Math.min(y1, y2)); // Minecraft Y range: -64 to 319
    const maxY = Math.min(319, Math.max(y1, y2)); // Minecraft Y range: -64 to 319
    const minZ = Math.max(0, Math.min(z1, z2));
    const maxZ = Math.min(dimensions[2] - 1, Math.max(z1, z2));
    
    // Fill the area
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const posKey = `${x},${y},${z}`;
          affectedBlocks[posKey] = voxels[posKey] || null;
          newVoxels[posKey] = blockType;
        }
      }
    }
    
    // Create a batch history action
    const newAction: HistoryAction = {
      type: "batch",
      affectedBlocks
    };
    
    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Update state
    set({
      voxels: newVoxels,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state for undo/redo buttons
    useEditor.setState({
      canUndo: true,
      canRedo: false
    });
  },
  
  // Clear an area
  clearArea: (start, end) => {
    const { voxels, dimensions, history, historyIndex } = get();
    const newVoxels = { ...voxels };
    const affectedBlocks: Record<string, BlockType | null> = {};
    
    // Normalize coordinates
    const [x1, y1, z1] = start;
    const [x2, y2, z2] = end;
    
    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(dimensions[0] - 1, Math.max(x1, x2));
    const minY = Math.max(-64, Math.min(y1, y2)); // Minecraft Y range: -64 to 319
    const maxY = Math.min(319, Math.max(y1, y2)); // Minecraft Y range: -64 to 319
    const minZ = Math.max(0, Math.min(z1, z2));
    const maxZ = Math.min(dimensions[2] - 1, Math.max(z1, z2));
    
    // Clear the area
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const posKey = `${x},${y},${z}`;
          if (voxels[posKey]) {
            affectedBlocks[posKey] = voxels[posKey];
            delete newVoxels[posKey];
          }
        }
      }
    }
    
    // Create a batch history action
    const newAction: HistoryAction = {
      type: "batch",
      affectedBlocks
    };
    
    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Update state
    set({
      voxels: newVoxels,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state for undo/redo buttons
    useEditor.setState({
      canUndo: true,
      canRedo: false
    });
  },
  
  // Undo the last action
  undo: () => {
    const { history, historyIndex, voxels } = get();
    
    // Check if there's anything to undo
    if (historyIndex < 0) {
      return;
    }
    
    // Get the action to undo
    const action = history[historyIndex];
    let newVoxels = { ...voxels };
    
    // Apply the undo based on the action type
    if (action.type === "set" && action.position) {
      // If it was a set, we need to revert to the previous state
      // If there was no previous block, remove it
      delete newVoxels[action.position];
    } else if (action.type === "remove" && action.position && action.blockType) {
      // If it was a removal, we need to restore the block
      newVoxels[action.position] = action.blockType;
    } else if (action.type === "batch" && action.affectedBlocks) {
      // For batch operations, restore all affected blocks
      for (const [posKey, prevBlock] of Object.entries(action.affectedBlocks)) {
        if (prevBlock === null) {
          delete newVoxels[posKey];
        } else {
          newVoxels[posKey] = prevBlock;
        }
      }
    }
    
    // Update state
    set({
      voxels: newVoxels,
      historyIndex: historyIndex - 1
    });
    
    // Update editor state for undo/redo buttons
    useEditor.setState({
      canUndo: historyIndex - 1 >= 0,
      canRedo: true
    });
  },
  
  // Redo an undone action
  redo: () => {
    const { history, historyIndex, voxels } = get();
    
    // Check if there's anything to redo
    if (historyIndex >= history.length - 1) {
      return;
    }
    
    // Get the action to redo
    const action = history[historyIndex + 1];
    let newVoxels = { ...voxels };
    
    // Apply the redo based on the action type
    if (action.type === "set" && action.position && action.blockType) {
      // If it was a set, set the block again
      newVoxels[action.position] = action.blockType;
    } else if (action.type === "remove" && action.position) {
      // If it was a removal, remove the block again
      delete newVoxels[action.position];
    } else if (action.type === "batch" && action.affectedBlocks) {
      // For batch operations, we need to apply the opposite of the previous state
      for (const [posKey, prevBlock] of Object.entries(action.affectedBlocks)) {
        if (prevBlock === null) {
          // If there was no block before, set the new block (which we don't know)
          // Let's look at the next state
          const nextState = history[historyIndex + 2];
          if (nextState?.type === "batch" && nextState.affectedBlocks) {
            // Find the block that would be there after the operation
            const keys = Object.keys(nextState.affectedBlocks);
            const blockTypeKey = keys.find(key => key === posKey);
            if (blockTypeKey && voxels[blockTypeKey]) {
              newVoxels[posKey] = voxels[blockTypeKey];
            }
          }
        } else {
          // If there was a block before, remove it
          delete newVoxels[posKey];
        }
      }
    }
    
    // Update state
    set({
      voxels: newVoxels,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state for undo/redo buttons
    useEditor.setState({
      canUndo: true,
      canRedo: historyIndex + 1 < history.length - 1
    });
  },
  
  // Save the project as a JSON file
  saveProject: () => {
    const { voxels, dimensions } = get();
    
    // Create the project data
    const projectData = {
      version: "1.0.0",
      dimensions,
      voxels
    };
    
    // Convert to JSON and create a blob
    const jsonData = JSON.stringify(projectData, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  },
  
  // Load a project from a JSON file
  loadProject: (jsonData) => {
    try {
      // Parse the JSON data
      const projectData = JSON.parse(jsonData);
      
      // Validate the data
      if (!projectData.dimensions || !projectData.voxels) {
        throw new Error("Invalid project file");
      }
      
      // Update state
      set({
        dimensions: projectData.dimensions,
        voxels: projectData.voxels,
        history: [],
        historyIndex: -1
      });
      
      // Update editor state
      useEditor.setState({
        currentLayer: 50, // Default Y level at 50 (Minecraft standard ground level)
        canUndo: false,
        canRedo: false
      });
    } catch (error) {
      console.error("Failed to load project:", error);
      throw new Error("Failed to load project. File may be corrupted or in wrong format.");
    }
  }
}));
