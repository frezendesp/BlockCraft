import { useState } from "react";
import { useEditor } from "../lib/stores/useEditor";
import { blockCategories, blocksByCategory, BlockType } from "../lib/blocks";
import { GroupControls } from "./GroupControls";

export const BlockPalette = () => {
  const { selectedBlockType, setSelectedBlockType } = useEditor();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCustomBlockInput, setShowCustomBlockInput] = useState(false);
  const [customBlockId, setCustomBlockId] = useState("");

  // Filter blocks based on search term and category
  const filteredBlocks = () => {
    let blocks: BlockType[] = [];
    
    if (selectedCategory === "All") {
      // Get all blocks from all categories
      Object.values(blocksByCategory).forEach(categoryBlocks => {
        blocks = [...blocks, ...categoryBlocks];
      });
    } else {
      // Get blocks from selected category
      blocks = blocksByCategory[selectedCategory] || [];
    }
    
    // Filter by search term
    if (searchTerm) {
      return blocks.filter(block => 
        block.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return blocks;
  };

  // Handle block selection
  const handleBlockSelect = (blockType: BlockType) => {
    setSelectedBlockType(blockType);
  };

  // Handle custom block add
  const handleAddCustomBlock = () => {
    if (customBlockId.trim() && customBlockId.startsWith("minecraft:")) {
      // Set as selected block and reset input
      setSelectedBlockType(customBlockId as BlockType);
      setCustomBlockId("");
      setShowCustomBlockInput(false);
    }
  };

  // Get color for a block (for visual representation)
  const getBlockColor = (blockType: string) => {
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
    return colors[blockType] || "#FF00FF"; // Default to pink for unknown blocks
  };

  return (
    <div className="w-64 h-full bg-sidebar overflow-hidden flex flex-col border-r border-border">
      <div className="p-3 border-b border-border">
        <h2 className="text-lg font-bold mb-2">Block Palette</h2>
        
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search blocks..."
            className="w-full p-2 bg-background border border-border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Category tabs */}
      <div className="overflow-x-auto flex p-2 border-b border-border">
        <button
          className={`px-3 py-1 mr-1 text-sm rounded-md whitespace-nowrap ${
            selectedCategory === "All" ? "bg-primary text-primary-foreground" : "bg-card"
          }`}
          onClick={() => setSelectedCategory("All")}
        >
          All
        </button>
        {blockCategories.map(category => (
          <button
            key={category}
            className={`px-3 py-1 mr-1 text-sm rounded-md whitespace-nowrap ${
              selectedCategory === category ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-1">
          {filteredBlocks().map(blockType => (
            <button
              key={blockType}
              className={`p-2 rounded border flex items-center ${
                selectedBlockType === blockType ? "border-primary" : "border-border"
              }`}
              onClick={() => handleBlockSelect(blockType)}
            >
              <div
                className="w-6 h-6 mr-2 border border-gray-800"
                style={{ backgroundColor: getBlockColor(blockType) }}
              />
              <span className="text-xs truncate">{blockType.replace("minecraft:", "")}</span>
            </button>
          ))}
        </div>
        
        {/* If no blocks match search */}
        {filteredBlocks().length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No blocks found.
          </div>
        )}
      </div>
      
      {/* Group controls section */}
      <GroupControls />
      
      {/* Custom block input */}
      <div className="p-2 border-t border-border">
        {showCustomBlockInput ? (
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              placeholder="minecraft:block_id"
              className="p-2 bg-background border border-border rounded"
              value={customBlockId}
              onChange={(e) => setCustomBlockId(e.target.value)}
            />
            <div className="flex space-x-2">
              <button
                className="flex-1 bg-primary text-primary-foreground rounded p-1 text-sm"
                onClick={handleAddCustomBlock}
              >
                Add
              </button>
              <button
                className="flex-1 bg-card text-foreground rounded p-1 text-sm"
                onClick={() => setShowCustomBlockInput(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full bg-card hover:bg-opacity-90 rounded p-2 flex items-center justify-center"
            onClick={() => setShowCustomBlockInput(true)}
          >
            <span className="mr-1">+</span> Custom Block
          </button>
        )}
      </div>
    </div>
  );
};
