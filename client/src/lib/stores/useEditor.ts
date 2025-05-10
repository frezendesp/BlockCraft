import { create } from "zustand";
import { BlockType, DEFAULT_BLOCK } from "../blocks";

export type ViewMode = "3D" | "2D";
export type ToolType = "place" | "remove" | "select" | "fill";

interface EditorState {
  // View settings
  viewMode: ViewMode;
  showGrid: boolean;
  showChunks: boolean;
  currentLayer: number;
  activeChunk: [number, number] | null; // [chunkX, chunkZ]
  
  // Tool settings
  activeTool: ToolType;
  selectedBlockType: BlockType;
  isDragging: boolean;
  isShiftPressed: boolean;
  
  // Selection state
  selectionStart: [number, number, number] | null;
  selectionEnd: [number, number, number] | null;
  
  // Hover state (for highlighting)
  hoveredPosition: [number, number, number] | null;
  
  // History for undo/redo
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  toggleGrid: () => void;
  toggleChunks: () => void;
  setCurrentLayer: (layer: number) => void;
  setActiveChunk: (chunk: [number, number] | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedBlockType: (blockType: BlockType) => void;
  setSelectionStart: (pos: [number, number, number] | null) => void;
  setSelectionEnd: (pos: [number, number, number] | null) => void;
  setHoveredPosition: (pos: [number, number, number] | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsShiftPressed: (isShiftPressed: boolean) => void;
  undoAction: () => void;
  redoAction: () => void;
  setCanUndo: (canUndo: boolean) => void;
  setCanRedo: (canRedo: boolean) => void;
}

export const useEditor = create<EditorState>((set) => ({
  // Default view settings
  viewMode: "3D",
  showGrid: true,
  showChunks: true,
  currentLayer: 50, // Default Y level at 50 (as per Minecraft standard ground level)
  activeChunk: null,
  
  // Default tool settings
  activeTool: "place",
  selectedBlockType: DEFAULT_BLOCK,
  isDragging: false,
  isShiftPressed: false,
  
  // Default selection state
  selectionStart: null,
  selectionEnd: null,
  
  // Default hover state
  hoveredPosition: null,
  
  // History state
  canUndo: false,
  canRedo: false,
  
  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleChunks: () => set((state) => ({ showChunks: !state.showChunks })),
  setCurrentLayer: (layer) => set({ currentLayer: layer }),
  setActiveChunk: (chunk) => set({ activeChunk: chunk }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedBlockType: (blockType) => set({ selectedBlockType: blockType }),
  setSelectionStart: (pos) => set({ selectionStart: pos }),
  setSelectionEnd: (pos) => set({ selectionEnd: pos }),
  setHoveredPosition: (pos) => set({ hoveredPosition: pos }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsShiftPressed: (isShiftPressed) => set({ isShiftPressed }),
  undoAction: () => {
    // Trigger undo in the project store
    const { undo } = require("./useProject").useProject.getState();
    undo();
  },
  redoAction: () => {
    // Trigger redo in the project store
    const { redo } = require("./useProject").useProject.getState();
    redo();
  },
  setCanUndo: (canUndo) => set({ canUndo }),
  setCanRedo: (canRedo) => set({ canRedo }),
}));
