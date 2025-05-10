import { create } from "zustand";
import { BlockType } from "../blocks";
import { useEditor } from "./useEditor";

// Define Block Group structure
export interface BlockGroup {
  id: string;
  name: string;
  blocks: Record<string, BlockType>; // Key is position string "x,y,z", value is block type
  origin: [number, number, number]; // Reference point for the group
}

// Define the structure of a history action
type HistoryAction = {
  type: "set" | "remove" | "batch" | "group" | "ungroup" | "moveGroup";
  positions?: string[]; // For batch operations
  position?: string;    // For single operations
  blockType?: BlockType; // Only for set operations
  affectedBlocks?: Record<string, BlockType | null>; // For batch (stores previous state)
  groupId?: string; // For group operations
  group?: BlockGroup; // For group creation/modification
  oldPosition?: [number, number, number]; // For group movement
  newPosition?: [number, number, number]; // For group movement
};

interface ProjectState {
  // Project settings
  dimensions: [number, number, number]; // [width, height, depth] (x, y, z)
  
  // Voxel data - using a sparse structure to save memory
  // Key is a string in the format "x,y,z", value is the block type
  voxels: Record<string, BlockType>;
  
  // Block groups
  groups: Record<string, BlockGroup>;
  activeGroupId: string | null;
  
  // History for undo/redo
  history: HistoryAction[];
  historyIndex: number;
  
  // Actions - Block Operations
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
  
  // Actions - Group Operations
  createGroup: (start: [number, number, number], end: [number, number, number], name?: string) => string;
  removeGroup: (groupId: string) => void;
  getGroupById: (groupId: string) => BlockGroup | null;
  moveGroup: (groupId: string, offset: [number, number, number]) => void;
  rotateGroup: (groupId: string, axis: 'x' | 'y' | 'z', degrees: number) => void;
  setActiveGroup: (groupId: string | null) => void;
  
  // Actions - History
  undo: () => void;
  redo: () => void;
  
  // Actions - File Operations
  saveProject: () => Blob;
  loadProject: (jsonData: string) => void;
}

// Minecraft height constants
const MIN_HEIGHT = -64;
const MAX_HEIGHT = 319;
const TOTAL_HEIGHT = MAX_HEIGHT - MIN_HEIGHT + 1; // 384 blocks total height

export const useProject = create<ProjectState>((set, get) => ({
  // Default dimensions [width(X), height(Y), depth(Z)]
  // Using Minecraft dimensions: X/Z effectively unlimited, Y from -64 to 319 = 384 total
  // Note: Although X/Z are unlimited in theory, we still set a dimension for rendering boundaries
  dimensions: [1000, TOTAL_HEIGHT, 1000],
  
  // Start with a few demonstration blocks at Y=0 (new origin for better visibility)
  voxels: {
    '-1,0,-1': 'minecraft:grass_block',
    '0,0,-1': 'minecraft:oak_log',
    '-1,0,0': 'minecraft:glass',
    '0,0,0': 'minecraft:gold_block',
    '-1,1,-1': 'minecraft:diamond_block',
    '0,1,-1': 'minecraft:emerald_block',
    '-1,1,0': 'minecraft:redstone_block',
    '0,1,0': 'minecraft:iron_block',
  },

  // Initialize empty groups and active group
  groups: {},
  activeGroupId: null,
  
  // Empty history
  history: [],
  historyIndex: -1,
  
  // Initialize a new project
  initializeProject: (dimensions = [1000, TOTAL_HEIGHT, 1000]) => {
    // Always ensure the Y dimension respects Minecraft's height limits
    const validDimensions: [number, number, number] = [
      dimensions[0], 
      TOTAL_HEIGHT, // Force correct height
      dimensions[2]
    ];
    
    set({
      dimensions: validDimensions,
      voxels: {},
      history: [],
      historyIndex: -1
    });
    
    // Update editor state
    useEditor.setState({
      currentLayer: 0, // Default Y level at 0 (new origin point)
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
  
  // Group Management Functions
  
  // Create a group from blocks in the specified area
  createGroup: (start, end, name = "Grupo") => {
    const { voxels, groups, history, historyIndex } = get();
    
    // Generate a unique ID
    const groupId = `group_${Date.now()}_${Object.keys(groups).length}`;
    
    // Normalize coordinates
    const [x1, y1, z1] = start;
    const [x2, y2, z2] = end;
    
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.max(-64, Math.min(y1, y2)); // Respect Minecraft Y limits
    const maxY = Math.min(319, Math.max(y1, y2)); // Respect Minecraft Y limits
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    
    // Extract blocks in the selection area
    const groupBlocks: Record<string, BlockType> = {};
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const posKey = `${x},${y},${z}`;
          
          // Only include existing blocks
          if (voxels[posKey]) {
            groupBlocks[posKey] = voxels[posKey];
          }
        }
      }
    }
    
    // Skip if no blocks found
    if (Object.keys(groupBlocks).length === 0) {
      console.warn("No blocks found in selection for group creation");
      return "";
    }
    
    // Create the group
    const newGroup: BlockGroup = {
      id: groupId,
      name: name,
      blocks: groupBlocks,
      origin: [minX, minY, minZ] // Use minimum corner as origin
    };
    
    // Add to groups
    const newGroups = { ...groups, [groupId]: newGroup };
    
    // Create a history action
    const newAction: HistoryAction = {
      type: "group",
      groupId,
      group: newGroup
    };
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Update state
    set({
      groups: newGroups,
      activeGroupId: groupId,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state
    useEditor.setState({
      canUndo: true,
      canRedo: false,
      // Clear selection after creating a group
      selectionStart: null,
      selectionEnd: null
    });
    
    console.log(`Created group '${name}' with ${Object.keys(groupBlocks).length} blocks`);
    return groupId;
  },
  
  // Get a group by ID
  getGroupById: (groupId) => {
    const { groups } = get();
    return groups[groupId] || null;
  },
  
  // Set the active group
  setActiveGroup: (groupId) => {
    set({ activeGroupId: groupId });
  },
  
  // Remove a group (doesn't remove the blocks)
  removeGroup: (groupId) => {
    const { groups, activeGroupId, history, historyIndex } = get();
    
    // Check if group exists
    if (!groups[groupId]) {
      console.error(`Group ${groupId} not found`);
      return;
    }
    
    // Store group for history
    const removedGroup = groups[groupId];
    
    // Create a copy of groups without the removed one
    const newGroups = { ...groups };
    delete newGroups[groupId];
    
    // Create a history action
    const newAction: HistoryAction = {
      type: "ungroup",
      groupId,
      group: removedGroup
    };
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Update state
    set({
      groups: newGroups,
      activeGroupId: activeGroupId === groupId ? null : activeGroupId,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state
    useEditor.setState({
      canUndo: true,
      canRedo: false
    });
    
    console.log(`Removed group ${removedGroup.name}`);
  },
  
  // Move a group by the specified offset
  moveGroup: (groupId, offset) => {
    const { groups, voxels, history, historyIndex } = get();
    
    // Check if group exists
    if (!groups[groupId]) {
      console.error(`Group ${groupId} not found`);
      return;
    }
    
    // Get group and validate offset
    const group = groups[groupId];
    const [offsetX, offsetY, offsetZ] = offset;
    
    if (offsetX === 0 && offsetY === 0 && offsetZ === 0) {
      return; // No movement needed
    }
    
    // Track affected blocks for history
    const affectedBlocks: Record<string, BlockType | null> = {};
    
    // Create a copy of voxels
    const newVoxels = { ...voxels };
    
    // First remove all blocks from their current positions
    for (const [posKey, blockType] of Object.entries(group.blocks)) {
      const [x, y, z] = posKey.split(',').map(Number);
      
      // Record original state
      affectedBlocks[posKey] = blockType;
      
      // Remove from current position
      delete newVoxels[posKey];
    }
    
    // Create the updated blocks for the group
    const newGroupBlocks: Record<string, BlockType> = {};
    
    // Then place them at their new positions
    for (const [posKey, blockType] of Object.entries(group.blocks)) {
      const [x, y, z] = posKey.split(',').map(Number);
      
      // Calculate new position
      const newX = x + offsetX;
      const newY = y + offsetY;
      const newZ = z + offsetZ;
      
      // Check if new position is valid (within Minecraft's height limits)
      if (newY < -64 || newY > 319) {
        console.warn(`Position [${newX}, ${newY}, ${newZ}] out of Minecraft height range`);
        continue;
      }
      
      const newPosKey = `${newX},${newY},${newZ}`;
      
      // Record target state for history
      affectedBlocks[newPosKey] = voxels[newPosKey] || null;
      
      // Place at new position
      newVoxels[newPosKey] = blockType;
      
      // Add to new group blocks
      newGroupBlocks[newPosKey] = blockType;
    }
    
    // Update the group with new positions and origin
    const newGroup: BlockGroup = {
      ...group,
      blocks: newGroupBlocks,
      origin: [
        group.origin[0] + offsetX,
        group.origin[1] + offsetY,
        group.origin[2] + offsetZ
      ]
    };
    
    // Update groups
    const newGroups = { 
      ...groups, 
      [groupId]: newGroup 
    };
    
    // Create a history action
    const newAction: HistoryAction = {
      type: "moveGroup",
      groupId,
      group: group, // Original group
      oldPosition: group.origin,
      newPosition: newGroup.origin,
      affectedBlocks
    };
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Update state
    set({
      voxels: newVoxels,
      groups: newGroups,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state
    useEditor.setState({
      canUndo: true,
      canRedo: false
    });
    
    console.log(`Moved group ${group.name} by [${offsetX}, ${offsetY}, ${offsetZ}]`);
  },
  
  // Rotate a group around an axis
  rotateGroup: (groupId, axis, degrees) => {
    const { groups, voxels, history, historyIndex } = get();
    
    // Check if group exists
    if (!groups[groupId]) {
      console.error(`Group ${groupId} not found`);
      return;
    }
    
    // Get group
    const group = groups[groupId];
    
    // Calculate rotation in radians
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // Track affected blocks for history
    const affectedBlocks: Record<string, BlockType | null> = {};
    
    // Create a copy of voxels
    const newVoxels = { ...voxels };
    
    // Reference point (origin of the group)
    const [originX, originY, originZ] = group.origin;
    
    // First remove all blocks from their current positions
    for (const [posKey, blockType] of Object.entries(group.blocks)) {
      // Record original state
      affectedBlocks[posKey] = blockType;
      
      // Remove from current position
      delete newVoxels[posKey];
    }
    
    // Create new group blocks
    const newGroupBlocks: Record<string, BlockType> = {};
    
    // Rotate and place blocks at their new positions
    for (const [posKey, blockType] of Object.entries(group.blocks)) {
      const [x, y, z] = posKey.split(',').map(Number);
      
      // Calculate position relative to origin
      const relX = x - originX;
      const relY = y - originY;
      const relZ = z - originZ;
      
      // Apply rotation based on axis
      let newRelX = relX, newRelY = relY, newRelZ = relZ;
      
      if (axis === 'x') {
        // Rotate around X axis
        newRelY = Math.round(relY * cos - relZ * sin);
        newRelZ = Math.round(relY * sin + relZ * cos);
      } else if (axis === 'y') {
        // Rotate around Y axis
        newRelX = Math.round(relX * cos + relZ * sin);
        newRelZ = Math.round(-relX * sin + relZ * cos);
      } else if (axis === 'z') {
        // Rotate around Z axis
        newRelX = Math.round(relX * cos - relY * sin);
        newRelY = Math.round(relX * sin + relY * cos);
      }
      
      // Convert back to world coordinates
      const newX = originX + newRelX;
      const newY = originY + newRelY;
      const newZ = originZ + newRelZ;
      
      // Check if new position is valid (within Minecraft's height limits)
      if (newY < -64 || newY > 319) {
        console.warn(`Position [${newX}, ${newY}, ${newZ}] out of Minecraft height range`);
        continue;
      }
      
      const newPosKey = `${newX},${newY},${newZ}`;
      
      // Record target state for history
      affectedBlocks[newPosKey] = voxels[newPosKey] || null;
      
      // Place at new position
      newVoxels[newPosKey] = blockType;
      
      // Add to new group blocks
      newGroupBlocks[newPosKey] = blockType;
    }
    
    // Update the group with new positions
    const newGroup: BlockGroup = {
      ...group,
      blocks: newGroupBlocks
    };
    
    // Update groups
    const newGroups = { 
      ...groups, 
      [groupId]: newGroup 
    };
    
    // Create a history action
    const newAction: HistoryAction = {
      type: "batch", // Use batch for rotation
      groupId,
      affectedBlocks
    };
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Update state
    set({
      voxels: newVoxels,
      groups: newGroups,
      history: newHistory,
      historyIndex: historyIndex + 1
    });
    
    // Update editor state
    useEditor.setState({
      canUndo: true,
      canRedo: false
    });
    
    console.log(`Rotated group ${group.name} around ${axis} axis by ${degrees} degrees`);
  },
  
  // Save the project as a JSON file
  saveProject: () => {
    const { voxels, dimensions, groups } = get();
    
    // Create the project data
    const projectData = {
      version: "1.0.0",
      dimensions,
      voxels,
      groups
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
      
      // Update state with groups support
      set({
        dimensions: projectData.dimensions,
        voxels: projectData.voxels,
        // If file has groups, load them, otherwise initialize empty
        groups: projectData.groups || {},
        activeGroupId: null,
        history: [],
        historyIndex: -1
      });
      
      // Update editor state
      useEditor.setState({
        currentLayer: 0, // Default Y level at 0 (Our new origin point)
        canUndo: false,
        canRedo: false
      });
    } catch (error) {
      console.error("Failed to load project:", error);
      throw new Error("Failed to load project. File may be corrupted or in wrong format.");
    }
  }
}));
