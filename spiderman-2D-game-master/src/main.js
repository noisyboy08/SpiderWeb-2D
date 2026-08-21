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
		alert(`Spiderweb Settings:\n- Reduce Flash: ${saveManager.data.settings.reduceFlash ? 'ON' : 'OFF'}\n- Reduce Shake: ${saveManager.data.settings.reduceShake ? 'ON' : 'OFF'}\n- Sound Effects: ${saveManager.data.settings.soundEffects ? 'ON' : 'OFF'}`);
	}
}

// Auto-start Spiderweb Game instance on page load
window.addEventListener('DOMContentLoaded', () => {
	const spiderweb = new SpiderwebGame();
	window.spiderwebEngine = spiderweb;
	spiderweb.start();
});
