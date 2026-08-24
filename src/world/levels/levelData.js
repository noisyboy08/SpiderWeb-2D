// Spiderweb — All 12 Levels Data Definitions (Section 8 Schema)

export const LEVEL_DEFINITIONS = [
	{
		levelId: 1,
		name: "No Warm-Up",
		worldLength: 4000,
		buildingGapRange: [150, 220],
		buildingHeightRange: [220, 520],
		checkpoints: [1400, 2800],
		enemies: [
			{ type: "drone", x: 1200, y: 250, patrolRangeX: [1000, 1400] },
			{ type: "drone", x: 2600, y: 220, patrolRangeX: [2400, 2800] }
		],
		hazards: [],
		isBossLevel: false
	},
	{
		levelId: 2,
		name: "Wind Corridor",
		worldLength: 4500,
		buildingGapRange: [170, 240],
		buildingHeightRange: [240, 500],
		checkpoints: [1500, 3000],
		enemies: [
			{ type: "drone", x: 1000, y: 240, patrolRangeX: [850, 1150] },
			{ type: "drone", x: 1800, y: 200, patrolRangeX: [1650, 1950] },
			{ type: "drone", x: 2700, y: 250, patrolRangeX: [2550, 2850] },
			{ type: "drone", x: 3600, y: 220, patrolRangeX: [3450, 3750] }
		],
		hazards: ["wind"],
		isBossLevel: false
	},
	{
		levelId: 3,
		name: "Turf War",
		worldLength: 5000,
		buildingGapRange: [160, 230],
		buildingHeightRange: [220, 530],
		checkpoints: [1600, 3200],
		enemies: [
			{ type: "merc", x: 1100, y: 300 },
			{ type: "merc", x: 1400, y: 320 },
			{ type: "merc", x: 2200, y: 280 },
			{ type: "merc", x: 2500, y: 300 },
			{ type: "drone", x: 3400, y: 220, patrolRangeX: [3200, 3600] }
		],
		hazards: ["crumbling_roofs"],
		isBossLevel: false
	},
	{
		levelId: 4,
		name: "Crossfire",
		worldLength: 5200,
		buildingGapRange: [170, 240],
		buildingHeightRange: [250, 520],
		checkpoints: [1700, 3400],
		enemies: [
			{ type: "sniper", x: 1200, y: 260 },
			{ type: "merc", x: 1800, y: 300 },
			{ type: "drone", x: 2400, y: 220, patrolRangeX: [2200, 2600] },
			{ type: "sniper", x: 3600, y: 250 }
		],
		hazards: ["fire_zones"],
		isBossLevel: false
	},
	{
		levelId: 5,
		name: "Construction Chaos",
		worldLength: 5500,
		buildingGapRange: [180, 250],
		buildingHeightRange: [240, 540],
		checkpoints: [1800, 3600],
		enemies: [
			{ type: "elite_merc", x: 1400, y: 300 },
			{ type: "merc", x: 2200, y: 320 },
			{ type: "drone", x: 3100, y: 240, patrolRangeX: [2900, 3300] },
			{ type: "elite_merc", x: 4200, y: 280 }
		],
		hazards: ["moving_cranes"],
		isBossLevel: false
	},
	{
		levelId: 6,
		name: "The Enforcer (Mini-Boss)",
		worldLength: 2500,
		buildingGapRange: [100, 150],
		buildingHeightRange: [300, 450],
		checkpoints: [800],
		enemies: [],
		isBossLevel: true,
		boss: {
			type: "the_enforcer",
			name: "The Enforcer",
			health: 60,
			attacks: [
				{ name: "charge_slam", telegraphMs: 1000, cooldownMs: 2500 },
				{ name: "ground_pound", telegraphMs: 500, cooldownMs: 2000 }
			]
		}
	},
	{
		levelId: 7,
		name: "Night Ops",
		worldLength: 5800,
		buildingGapRange: [190, 260],
		buildingHeightRange: [250, 550],
		checkpoints: [1900, 3800],
		enemies: [
			{ type: "elite_merc", x: 1300, y: 300 },
			{ type: "drone", x: 2100, y: 200, patrolRangeX: [1900, 2300] },
			{ type: "sniper", x: 3000, y: 260 },
			{ type: "elite_merc", x: 4500, y: 290 }
		],
		hazards: ["searchlights"],
		isBossLevel: false
	},
	{
		levelId: 8,
		name: "Static in the Signal",
		worldLength: 6000,
		buildingGapRange: [200, 270],
		buildingHeightRange: [260, 560],
		checkpoints: [2000, 4000],
		enemies: [
			{ type: "elite_merc", x: 1500, y: 310 },
			{ type: "sniper", x: 2600, y: 250 },
			{ type: "drone", x: 3800, y: 220, patrolRangeX: [3600, 4000] },
			{ type: "elite_merc", x: 5000, y: 280 }
		],
		hazards: ["flickering_billboards"],
		isBossLevel: false
	},
	{
		levelId: 9,
		name: "Rooftop Siege",
		worldLength: 6200,
		buildingGapRange: [200, 280],
		buildingHeightRange: [250, 570],
		checkpoints: [2000, 4200],
		enemies: [
			{ type: "merc", x: 1200, y: 320 },
			{ type: "elite_merc", x: 2200, y: 300 },
			{ type: "sniper", x: 3400, y: 260 },
			{ type: "drone", x: 4400, y: 220, patrolRangeX: [4200, 4600] },
			{ type: "elite_merc", x: 5300, y: 290 }
		],
		hazards: ["crumbling_roofs", "fire_zones", "moving_cranes"],
		isBossLevel: false
	},
	{
		levelId: 10,
		name: "Thread (Mini-Boss)",
		worldLength: 2500,
		buildingGapRange: [120, 160],
		buildingHeightRange: [300, 450],
		checkpoints: [800],
		enemies: [],
		isBossLevel: true,
		boss: {
			type: "thread",
			name: "Thread",
			health: 70,
			attacks: [
				{ name: "web_snare", telegraphMs: 300, cooldownMs: 1800 },
				{ name: "aerial_dive", telegraphMs: 400, cooldownMs: 2200 }
			]
		}
	},
	{
		levelId: 11,
		name: "The Approach",
		worldLength: 6500,
		buildingGapRange: [210, 290],
		buildingHeightRange: [260, 580],
		checkpoints: [2100, 4400],
		enemies: [
			{ type: "drone", x: 1200, y: 200, patrolRangeX: [1000, 1400] },
			{ type: "elite_merc", x: 2400, y: 300 },
			{ type: "sniper", x: 3600, y: 250 },
			{ type: "drone", x: 4800, y: 220, patrolRangeX: [4600, 5000] },
			{ type: "elite_merc", x: 5700, y: 280 }
		],
		hazards: ["wind", "lightning"],
		isBossLevel: false
	},
	{
		levelId: 12,
		name: "Stinger Showdown (Final Boss)",
		worldLength: 3000,
		buildingGapRange: [100, 150],
		buildingHeightRange: [320, 460],
		checkpoints: [1000],
		enemies: [],
		isBossLevel: true,
		boss: {
			type: "stinger",
			name: "Stinger",
			health: 100,
			phases: 2,
			attacks: [
				{ name: "tail_lash", telegraphMs: 600, cooldownMs: 2000 },
				{ name: "poison_lunge", telegraphMs: 400, cooldownMs: 1800 },
				{ name: "armor_phase", durationMs: 3000, cooldownMs: 6000 }
			]
		}
	}
];
