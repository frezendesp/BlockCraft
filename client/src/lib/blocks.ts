// Define supported Minecraft block types
export type BlockType = 
  | "minecraft:stone"
  | "minecraft:granite"
  | "minecraft:polished_granite"
  | "minecraft:diorite"
  | "minecraft:polished_diorite"
  | "minecraft:andesite"
  | "minecraft:polished_andesite"
  | "minecraft:grass_block"
  | "minecraft:dirt"
  | "minecraft:coarse_dirt"
  | "minecraft:podzol"
  | "minecraft:cobblestone"
  | "minecraft:oak_planks"
  | "minecraft:spruce_planks"
  | "minecraft:birch_planks"
  | "minecraft:jungle_planks"
  | "minecraft:acacia_planks"
  | "minecraft:dark_oak_planks"
  | "minecraft:oak_log"
  | "minecraft:spruce_log"
  | "minecraft:birch_log"
  | "minecraft:jungle_log"
  | "minecraft:acacia_log"
  | "minecraft:dark_oak_log"
  | "minecraft:sand"
  | "minecraft:red_sand"
  | "minecraft:gravel"
  | "minecraft:gold_ore"
  | "minecraft:iron_ore"
  | "minecraft:coal_ore"
  | "minecraft:oak_wood"
  | "minecraft:spruce_wood"
  | "minecraft:birch_wood"
  | "minecraft:jungle_wood"
  | "minecraft:acacia_wood"
  | "minecraft:dark_oak_wood"
  | "minecraft:oak_leaves"
  | "minecraft:spruce_leaves"
  | "minecraft:birch_leaves"
  | "minecraft:jungle_leaves"
  | "minecraft:acacia_leaves"
  | "minecraft:dark_oak_leaves"
  | "minecraft:sponge"
  | "minecraft:wet_sponge"
  | "minecraft:glass"
  | "minecraft:lapis_ore"
  | "minecraft:lapis_block"
  | "minecraft:sandstone"
  | "minecraft:chiseled_sandstone"
  | "minecraft:cut_sandstone"
  | "minecraft:white_wool"
  | "minecraft:orange_wool"
  | "minecraft:magenta_wool"
  | "minecraft:light_blue_wool"
  | "minecraft:yellow_wool"
  | "minecraft:lime_wool"
  | "minecraft:pink_wool"
  | "minecraft:gray_wool"
  | "minecraft:light_gray_wool"
  | "minecraft:cyan_wool"
  | "minecraft:purple_wool"
  | "minecraft:blue_wool"
  | "minecraft:brown_wool"
  | "minecraft:green_wool"
  | "minecraft:red_wool"
  | "minecraft:black_wool"
  | "minecraft:gold_block"
  | "minecraft:iron_block"
  | "minecraft:bricks"
  | "minecraft:tnt"
  | "minecraft:bookshelf"
  | "minecraft:mossy_cobblestone"
  | "minecraft:obsidian"
  | "minecraft:diamond_ore"
  | "minecraft:diamond_block"
  | "minecraft:crafting_table"
  | "minecraft:furnace"
  | "minecraft:redstone_ore"
  | "minecraft:ice"
  | "minecraft:snow_block"
  | "minecraft:clay"
  | "minecraft:pumpkin"
  | "minecraft:netherrack"
  | "minecraft:soul_sand"
  | "minecraft:glowstone"
  | "minecraft:jack_o_lantern"
  | "minecraft:white_stained_glass"
  | "minecraft:orange_stained_glass"
  | "minecraft:magenta_stained_glass"
  | "minecraft:light_blue_stained_glass"
  | "minecraft:yellow_stained_glass"
  | "minecraft:lime_stained_glass"
  | "minecraft:pink_stained_glass"
  | "minecraft:gray_stained_glass"
  | "minecraft:light_gray_stained_glass"
  | "minecraft:cyan_stained_glass"
  | "minecraft:purple_stained_glass"
  | "minecraft:blue_stained_glass"
  | "minecraft:brown_stained_glass"
  | "minecraft:green_stained_glass"
  | "minecraft:red_stained_glass"
  | "minecraft:black_stained_glass"
  | "minecraft:stone_bricks"
  | "minecraft:mossy_stone_bricks"
  | "minecraft:cracked_stone_bricks"
  | "minecraft:chiseled_stone_bricks"
  | "minecraft:melon"
  | "minecraft:mycelium"
  | "minecraft:nether_bricks"
  | "minecraft:end_stone"
  | "minecraft:redstone_lamp"
  | "minecraft:emerald_ore"
  | "minecraft:emerald_block"
  | "minecraft:command_block"
  | "minecraft:beacon"
  | "minecraft:redstone_block"
  | "minecraft:quartz_ore"
  | "minecraft:quartz_block"
  | "minecraft:chiseled_quartz_block"
  | "minecraft:quartz_pillar"
  | "minecraft:terracotta"
  | "minecraft:hay_block"
  | "minecraft:coal_block"
  | "minecraft:packed_ice"
  | "minecraft:slime_block"
  | "minecraft:barrier"
  | "minecraft:prismarine"
  | "minecraft:prismarine_bricks"
  | "minecraft:dark_prismarine"
  | "minecraft:sea_lantern"
  | "minecraft:water"
  | "minecraft:lava"
  | "minecraft:bedrock"
  | "minecraft:air";

// Default block to use
export const DEFAULT_BLOCK: BlockType = "minecraft:stone";

// Block categories for organization
export const blockCategories = [
  "Building",
  "Decoration",
  "Redstone", 
  "Natural",
  "Ores",
  "Liquids",
  "Special"
];

// Blocks organized by category
export const blocksByCategory: Record<string, BlockType[]> = {
  "Building": [
    "minecraft:stone",
    "minecraft:granite",
    "minecraft:polished_granite",
    "minecraft:diorite",
    "minecraft:polished_diorite",
    "minecraft:andesite",
    "minecraft:polished_andesite",
    "minecraft:cobblestone",
    "minecraft:oak_planks",
    "minecraft:spruce_planks",
    "minecraft:birch_planks",
    "minecraft:jungle_planks",
    "minecraft:acacia_planks",
    "minecraft:dark_oak_planks",
    "minecraft:bricks",
    "minecraft:stone_bricks",
    "minecraft:mossy_stone_bricks",
    "minecraft:cracked_stone_bricks",
    "minecraft:chiseled_stone_bricks",
    "minecraft:sandstone",
    "minecraft:chiseled_sandstone",
    "minecraft:cut_sandstone",
    "minecraft:nether_bricks",
    "minecraft:quartz_block",
    "minecraft:chiseled_quartz_block",
    "minecraft:quartz_pillar",
    "minecraft:terracotta",
    "minecraft:prismarine",
    "minecraft:prismarine_bricks",
    "minecraft:dark_prismarine"
  ],
  "Decoration": [
    "minecraft:white_wool",
    "minecraft:orange_wool",
    "minecraft:magenta_wool",
    "minecraft:light_blue_wool",
    "minecraft:yellow_wool",
    "minecraft:lime_wool",
    "minecraft:pink_wool",
    "minecraft:gray_wool",
    "minecraft:light_gray_wool",
    "minecraft:cyan_wool",
    "minecraft:purple_wool",
    "minecraft:blue_wool",
    "minecraft:brown_wool",
    "minecraft:green_wool",
    "minecraft:red_wool",
    "minecraft:black_wool",
    "minecraft:glass",
    "minecraft:white_stained_glass",
    "minecraft:orange_stained_glass",
    "minecraft:magenta_stained_glass",
    "minecraft:light_blue_stained_glass",
    "minecraft:yellow_stained_glass",
    "minecraft:lime_stained_glass",
    "minecraft:pink_stained_glass",
    "minecraft:gray_stained_glass",
    "minecraft:light_gray_stained_glass",
    "minecraft:cyan_stained_glass",
    "minecraft:purple_stained_glass",
    "minecraft:blue_stained_glass",
    "minecraft:brown_stained_glass",
    "minecraft:green_stained_glass",
    "minecraft:red_stained_glass",
    "minecraft:black_stained_glass",
    "minecraft:bookshelf",
    "minecraft:crafting_table",
    "minecraft:furnace",
    "minecraft:jack_o_lantern",
    "minecraft:sea_lantern",
    "minecraft:hay_block"
  ],
  "Redstone": [
    "minecraft:redstone_ore",
    "minecraft:redstone_block",
    "minecraft:redstone_lamp",
    "minecraft:tnt",
    "minecraft:command_block"
  ],
  "Natural": [
    "minecraft:grass_block",
    "minecraft:dirt",
    "minecraft:coarse_dirt",
    "minecraft:podzol",
    "minecraft:sand",
    "minecraft:red_sand",
    "minecraft:gravel",
    "minecraft:oak_log",
    "minecraft:spruce_log",
    "minecraft:birch_log",
    "minecraft:jungle_log",
    "minecraft:acacia_log",
    "minecraft:dark_oak_log",
    "minecraft:oak_wood",
    "minecraft:spruce_wood",
    "minecraft:birch_wood",
    "minecraft:jungle_wood",
    "minecraft:acacia_wood",
    "minecraft:dark_oak_wood",
    "minecraft:oak_leaves",
    "minecraft:spruce_leaves",
    "minecraft:birch_leaves",
    "minecraft:jungle_leaves",
    "minecraft:acacia_leaves",
    "minecraft:dark_oak_leaves",
    "minecraft:snow_block",
    "minecraft:ice",
    "minecraft:packed_ice",
    "minecraft:clay",
    "minecraft:pumpkin",
    "minecraft:melon",
    "minecraft:mycelium",
    "minecraft:netherrack",
    "minecraft:soul_sand",
    "minecraft:end_stone",
    "minecraft:sponge",
    "minecraft:wet_sponge",
    "minecraft:mossy_cobblestone"
  ],
  "Ores": [
    "minecraft:coal_ore",
    "minecraft:iron_ore",
    "minecraft:gold_ore",
    "minecraft:lapis_ore",
    "minecraft:diamond_ore",
    "minecraft:emerald_ore",
    "minecraft:quartz_ore"
  ],
  "Liquids": [
    "minecraft:water",
    "minecraft:lava"
  ],
  "Special": [
    "minecraft:gold_block",
    "minecraft:iron_block",
    "minecraft:diamond_block",
    "minecraft:emerald_block",
    "minecraft:lapis_block",
    "minecraft:coal_block",
    "minecraft:obsidian",
    "minecraft:glowstone",
    "minecraft:beacon",
    "minecraft:slime_block",
    "minecraft:barrier",
    "minecraft:bedrock",
    "minecraft:air"
  ]
};
