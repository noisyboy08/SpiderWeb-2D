// Spiderweb — Web Audio API Synthesizer (Section 12 & 16.3)
import { saveManager } from '../save/saveManager.js';

export class AudioManager {
	constructor() {
		this.ctx = null;
		this.initialized = false;
	}

	init() {
		if (this.initialized) return;
		try {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (AudioCtx) {
				this.ctx = new AudioCtx();
				this.initialized = true;
			}
		} catch (e) {
			console.warn('[Spiderweb AudioManager] AudioContext init error:', e);
		}
	}

	playTone(freq, type, duration, startVol = 0.3, endVol = 0.01) {
		if (!this.initialized || !saveManager.data.settings.soundEffects) return;
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
		try {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			const now = this.ctx.currentTime;

			osc.type = type;
			osc.frequency.setValueAtTime(freq, now);

			gain.gain.setValueAtTime(startVol * saveManager.data.settings.sfxVolume, now);
			gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), now + duration);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(now);
			osc.stop(now + duration);
		} catch (e) {}
	}

	playWebThwip() {
		// High to low frequency sweep (web thwip sound)
		if (!this.initialized || !saveManager.data.settings.soundEffects) return;
		if (this.ctx.state === 'suspended') this.ctx.resume();
		try {
			const now = this.ctx.currentTime;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'triangle';
			osc.frequency.setValueAtTime(1200, now);
			osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

			gain.gain.setValueAtTime(0.4 * saveManager.data.settings.sfxVolume, now);
			gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(now);
			osc.stop(now + 0.08);
		} catch (e) {}
	}

	playHitImpact() {
		this.playTone(150, 'sawtooth', 0.12, 0.5, 0.01);
	}

	playJump() {
		this.playTone(320, 'sine', 0.1, 0.3, 0.01);
	}

	playLand() {
		this.playTone(100, 'square', 0.08, 0.2, 0.01);
	}

	playTelegraphWarning() {
		// Double pulse warning beep for boss telegraph
		this.playTone(880, 'sine', 0.06, 0.4, 0.01);
		setTimeout(() => this.playTone(880, 'sine', 0.06, 0.4, 0.01), 100);
	}

	playEnemyDefeat() {
		this.playTone(440, 'triangle', 0.15, 0.4, 0.01);
	}

	playUIClick() {
		this.playTone(600, 'sine', 0.04, 0.2, 0.01);
	}

	playLevelWin() {
		if (!this.initialized) return;
		this.playTone(523.25, 'triangle', 0.1, 0.4, 0.01); // C5
		setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.4, 0.01), 120); // E5
		setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.5, 0.01), 240); // G5
	}
}

export const audioManager = new AudioManager();
