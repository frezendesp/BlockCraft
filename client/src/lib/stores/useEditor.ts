import { create } from "zustand";
import { BlockType, DEFAULT_BLOCK } from "../blocks";

export type ViewMode = "3D" | "2D";
export type ToolType = "place" | "remove" | "select" | "fill";

interface EditorState {
  // View settings
  viewMode: ViewMode;
  showGrid: boolean;
  currentLayer: number;
  
  // Tool settings
  activeTool: ToolType;
  selectedBlockType: BlockType;
  
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
  setCurrentLayer: (layer: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedBlockType: (blockType: BlockType) => void;
  setSelectionStart: (pos: [number, number, number] | null) => void;
  setSelectionEnd: (pos: [number, number, number] | null) => void;
  setHoveredPosition: (pos: [number, number, number] | null) => void;
  undoAction: () => void;
  redoAction: () => void;
  setCanUndo: (canUndo: boolean) => void;
  setCanRedo: (canRedo: boolean) => void;
}

export const useEditor = create<EditorState>((set) => ({
  // Default view settings
  viewMode: "3D",
  showGrid: true,
  currentLayer: 0,
  
  // Default tool settings
  activeTool: "place",
  selectedBlockType: DEFAULT_BLOCK,
  
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
  setCurrentLayer: (layer) => set({ currentLayer: layer }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedBlockType: (blockType) => set({ selectedBlockType: blockType }),
  setSelectionStart: (pos) => set({ selectionStart: pos }),
  setSelectionEnd: (pos) => set({ selectionEnd: pos }),
  setHoveredPosition: (pos) => set({ hoveredPosition: pos }),
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
