// Spiderweb — Save & Settings Manager (Section 11.2 Schema)

const SAVE_KEY = 'SPIDERWEB_SAVE_DATA_V1';

const DEFAULT_SAVE_DATA = {
	version: 1,
	unlockedLevel: 1,
	spiderGirlUnlocked: false,
	selectedCharacter: 'jax', // 'jax' or 'spidergirl'
	levels: {
		1: { completed: false, bestTimeMs: null, flawless: false },
		2: { completed: false, bestTimeMs: null, flawless: false },
		3: { completed: false, bestTimeMs: null, flawless: false },
		4: { completed: false, bestTimeMs: null, flawless: false },
		5: { completed: false, bestTimeMs: null, flawless: false },
		6: { completed: false, bestTimeMs: null, flawless: false },
		7: { completed: false, bestTimeMs: null, flawless: false },
		8: { completed: false, bestTimeMs: null, flawless: false },
		9: { completed: false, bestTimeMs: null, flawless: false },
		10: { completed: false, bestTimeMs: null, flawless: false },
		11: { completed: false, bestTimeMs: null, flawless: false },
		12: { completed: false, bestTimeMs: null, flawless: false }
	},
	collectibles: { found: 0, total: 24 },
	settings: {
		reduceFlash: false,
		reduceShake: false,
		sfxVolume: 0.8,
		musicVolume: 0.6,
		soundEffects: true,
		music: true
	}
};

export class SaveManager {
	constructor() {
		this.data = this.load();
	}

	load() {
		try {
			const raw = localStorage.getItem(SAVE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				return { ...DEFAULT_SAVE_DATA, ...parsed, settings: { ...DEFAULT_SAVE_DATA.settings, ...(parsed.settings || {}) } };
			}
		} catch (e) {
			console.warn('[Spiderweb SaveManager] Failed to load from localStorage:', e);
		}
		return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
	}

	save() {
		try {
			localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
		} catch (e) {
			console.error('[Spiderweb SaveManager] Failed to save to localStorage:', e);
		}
	}

	completeLevel(levelId, timeMs, tookDamage) {
		const lvl = this.data.levels[levelId] || { completed: false, bestTimeMs: null, flawless: false };
		lvl.completed = true;
		if (lvl.bestTimeMs === null || timeMs < lvl.bestTimeMs) {
			lvl.bestTimeMs = timeMs;
		}
		if (!tookDamage) {
			lvl.flawless = true;
		}
		this.data.levels[levelId] = lvl;

		if (levelId >= this.data.unlockedLevel && levelId < 12) {
			this.data.unlockedLevel = levelId + 1;
		}

		if (levelId === 12) {
			this.data.spiderGirlUnlocked = true;
		}

		this.save();
	}

	unlockSpiderGirl() {
		this.data.spiderGirlUnlocked = true;
		this.save();
	}

	setSelectedCharacter(charId) {
		if (charId === 'spidergirl' && !this.data.spiderGirlUnlocked) return;
		this.data.selectedCharacter = charId;
		this.save();
	}

	updateSettings(newSettings) {
		this.data.settings = { ...this.data.settings, ...newSettings };
		this.save();
	}

	resetProgress() {
		this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
		this.save();
	}
}

export const saveManager = new SaveManager();
