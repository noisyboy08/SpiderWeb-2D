// Spiderweb — Master Engine Entry Point (Section 13 & 18 Build Roadmap)
import { saveManager } from './save/saveManager.js';
import { audioManager } from './audio/audioManager.js';
import { LEVEL_DEFINITIONS } from './world/levels/levelData.js';
import { MissionTracker } from './ui/missionTracker.js';
import { HUD } from './ui/hud.js';
import { BossEntity } from './entities/bosses.js';

export class SpiderwebGame {
	constructor() {
		this.saveManager = saveManager;
		this.audioManager = audioManager;
		this.missionTracker = null;
		this.activeLevelId = 1;
		this.activeBoss = null;
	}

	start() {
		console.log("[Spiderweb] Initializing Spiderweb Game Engine...");
		this.audioManager.init();

		this.missionTracker = new MissionTracker(
			(selectedLevelId) => this.startLevel(selectedLevelId),
			() => this.openSettings()
		);

		// Show Mission Tracker Level Select
		this.missionTracker.render();
	}

	startLevel(levelId) {
		console.log(`[Spiderweb] Launching Level ${levelId}...`);
		this.activeLevelId = levelId;
		const lvlDef = LEVEL_DEFINITIONS.find(l => l.levelId === levelId) || LEVEL_DEFINITIONS[0];

		// Instantiate Boss if boss level
		if (lvlDef.isBossLevel && lvlDef.boss) {
			this.activeBoss = new BossEntity(window.game || {}, lvlDef.boss);
		} else {
			this.activeBoss = null;
		}

		if (window.game) {
			window.game.restart();
		}
	}

	openSettings() {
		// BUG1-FIX: Dispatch the proper SPIDERWORLD_SETTINGS event so the styled
		// Settings modal in index.html opens — no more plain browser alert().
		window.dispatchEvent(new CustomEvent('SPIDERWORLD_SETTINGS'));
	}
}

// SUGGESTION16-FIX: Do NOT auto-start here. index.html is the single entry point
// that boots SpidermanGame directly. Having both auto-start causes TWO game
// instances, duplicate event listeners, and conflicting state.
// The SpiderwebGame class above is exported for future modular use.
// window.addEventListener('DOMContentLoaded', ...) intentionally removed.
