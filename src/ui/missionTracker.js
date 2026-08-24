// Spiderweb — Mission Tracker (Level Select) Screen (Section 10.2 Spec)
import { saveManager } from '../save/saveManager.js';
import { audioManager } from '../audio/audioManager.js';
import { LEVEL_DEFINITIONS } from '../world/levels/levelData.js';

export class MissionTracker {
	constructor(onSelectLevel, onOpenSettings) {
		this.onSelectLevel = onSelectLevel;
		this.onOpenSettings = onOpenSettings;
		this.container = null;
		this.selectedLevelId = 1;
	}

	render() {
		if (this.container) {
			this.container.style.display = 'flex';
			this.updateNodes();
			return;
		}

		const el = document.createElement('div');
		el.className = 'mission-tracker-overlay';
		el.innerHTML = `
			<div class="tracker-bezel">
				<!-- Top Bar -->
				<div class="tracker-top-bar">
					<div class="tracker-title">SPIDERWEB: MISSION TRACKER</div>
					<div class="tracker-top-actions">
						<button id="btn-char-toggle" class="tracker-icon-btn" title="Character Select">
							<span id="char-badge">HERO</span>
						</button>
						<button id="btn-settings-toggle" class="tracker-icon-btn" title="Settings">⚙️</button>
					</div>
				</div>

				<!-- Main Skyline Area -->
				<div class="tracker-main-area">
					<svg class="tracker-web-canvas" width="100%" height="100%">
						<path id="web-path-line" d="" stroke="#00F2FE" stroke-width="3" fill="none" stroke-dasharray="6,6"/>
					</svg>
					<div id="nodes-container" class="tracker-nodes-container"></div>

					<!-- Level Info Modal Popup -->
					<div id="level-info-modal" class="tracker-info-modal" style="display:none;">
						<h3 id="info-level-name">Level 1: No Warm-Up</h3>
						<div id="info-level-details">Best Time: -- | Flawless: ❌</div>
						<button id="btn-deploy" class="btn-deploy">DEPLOY</button>
					</div>
				</div>

				<!-- Bottom Ticker Bar -->
				<div class="tracker-ticker-bar">
					<div class="ticker-content">
						Rooftop chaos reported downtown — witnesses describe a masked figure in navy and teal. • Security firm denies any connection to last night's rooftop incident. • Who is he? City records show no match for the vigilante's description.
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(el);
		this.container = el;

		// Inject tracker CSS styles dynamically
		this.injectCSS();

		// Event handlers
		el.querySelector('#btn-settings-toggle').onclick = () => {
			audioManager.playUIClick();
			if (this.onOpenSettings) this.onOpenSettings();
		};

		const charBtn = el.querySelector('#btn-char-toggle');
		charBtn.onclick = () => {
			audioManager.playUIClick();
			if (!saveManager.data.spiderGirlUnlocked) {
				alert("SpiderGirl Unlocks after defeating Stinger in Level 12!");
				return;
			}
			const nextChar = (saveManager.data.selectedCharacter === 'spidergirl') ? 'jax' : 'spidergirl';
			saveManager.setSelectedCharacter(nextChar);
			this.updateCharacterBadge();
		};

		el.querySelector('#btn-deploy').onclick = () => {
			audioManager.playUIClick();
			this.hide();
			if (this.onSelectLevel) this.onSelectLevel(this.selectedLevelId);
		};

		this.updateNodes();
		this.updateCharacterBadge();
	}

	updateCharacterBadge() {
		const charBadge = this.container.querySelector('#char-badge');
		if (saveManager.data.selectedCharacter === 'spidergirl') {
			charBadge.innerText = "SPIDERGIRL";
			charBadge.style.color = "#FF3D8A";
		} else {
			charBadge.innerText = "SPIDERWEB";
			charBadge.style.color = "#00F2FE";
		}
	}

	updateNodes() {
		const nodesContainer = this.container.querySelector('#nodes-container');
		nodesContainer.innerHTML = '';

		const unlocked = saveManager.data.unlockedLevel || 1;
		const levelsData = saveManager.data.levels || {};

		// Grid layout for 12 nodes across 4 columns x 3 rows
		LEVEL_DEFINITIONS.forEach((lvl, index) => {
			const col = index % 4;
			const row = Math.floor(index / 4);

			const posX = 15 + col * 24; // %
			const posY = 20 + row * 28; // %

			const isUnlocked = lvl.levelId <= unlocked;
			const isCompleted = levelsData[lvl.levelId]?.completed;
			const isCurrent = lvl.levelId === unlocked;

			const node = document.createElement('div');
			node.className = `tracker-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''} ${lvl.isBossLevel ? 'boss' : ''}`;
			node.style.left = `${posX}%`;
			node.style.top = `${posY}%`;

			let icon = lvl.levelId;
			if (lvl.levelId === 6) icon = '⚔️'; // Enforcer
			else if (lvl.levelId === 10) icon = '🕸️'; // Thread
			else if (lvl.levelId === 12) icon = '🦂'; // Stinger

			node.innerHTML = `<span class="node-icon">${isUnlocked ? icon : '🔒'}</span>`;

			node.onclick = () => {
				audioManager.playUIClick();
				if (!isUnlocked) return;
				this.selectedLevelId = lvl.levelId;
				this.showInfoModal(lvl, levelsData[lvl.levelId]);
			};

			nodesContainer.appendChild(node);
		});
	}

	showInfoModal(lvl, record) {
		const modal = this.container.querySelector('#level-info-modal');
		const title = this.container.querySelector('#info-level-name');
		const details = this.container.querySelector('#info-level-details');

		title.innerText = `Level ${lvl.levelId}: ${lvl.name}`;
		const bestSec = record?.bestTimeMs ? (record.bestTimeMs / 1000).toFixed(1) + 's' : '--';
		const flawless = record?.flawless ? '🏆 YES' : '❌ NO';
		details.innerText = `Best Time: ${bestSec}  |  Flawless: ${flawless}`;

		modal.style.display = 'block';
	}

	hide() {
		if (this.container) this.container.style.display = 'none';
	}

	injectCSS() {
		if (document.getElementById('tracker-styles')) return;
		const style = document.createElement('style');
		style.id = 'tracker-styles';
		style.innerHTML = `
			.mission-tracker-overlay {
				position: fixed;
				top: 0; left: 0; width: 100vw; height: 100vh;
				background: rgba(5, 11, 20, 0.95);
				z-index: 10000;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.tracker-bezel {
				width: 90vw; height: 85vh;
				max-width: 1100px; max-height: 650px;
				background: #0B192C;
				border: 4px solid #00F2FE;
				border-radius: 12px;
				box-shadow: 0 0 35px rgba(0, 242, 254, 0.4);
				display: flex;
				flex-direction: column;
				position: relative;
				overflow: hidden;
			}
			.tracker-top-bar {
				height: 50px;
				background: #162A45;
				border-bottom: 2px solid #00F2FE;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 0 20px;
			}
			.tracker-title {
				color: #00F2FE;
				font-size: 18px;
				font-weight: bold;
				letter-spacing: 1px;
			}
			.tracker-top-actions { display: flex; gap: 10px; }
			.tracker-icon-btn {
				background: #0B192C; border: 1px solid #00F2FE; color: white;
				padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;
			}
			.tracker-main-area {
				flex: 1;
				position: relative;
				background: radial-gradient(circle at center, #10243E 0%, #060D18 100%);
			}
			.tracker-nodes-container {
				position: absolute; top: 0; left: 0; width: 100%; height: 100%;
			}
			.tracker-node {
				position: absolute; width: 54px; height: 54px;
				border-radius: 50%; background: #162A45; border: 2px solid #555;
				display: flex; align-items: center; justify-content: center;
				color: white; font-weight: bold; cursor: pointer;
				transition: transform 0.2s, box-shadow 0.2s;
			}
			.tracker-node.completed { border-color: #00F2FE; background: #0B3C5D; box-shadow: 0 0 10px rgba(0,242,254,0.4); }
			.tracker-node.current { border-color: #FFD700; background: #1E3A8A; box-shadow: 0 0 18px #FFD700; transform: scale(1.1); }
			.tracker-node.boss { border-color: #FF3D8A; }
			.tracker-node.locked { opacity: 0.5; cursor: not-allowed; }
			.tracker-node:hover:not(.locked) { transform: scale(1.15); }
			.tracker-info-modal {
				position: absolute; bottom: 20px; right: 20px;
				background: rgba(11, 25, 44, 0.95); border: 2px solid #00F2FE;
				border-radius: 8px; padding: 16px 24px; color: white; min-width: 280px;
			}
			.btn-deploy {
				margin-top: 10px; width: 100%; padding: 8px;
				background: #00F2FE; border: none; color: #0B192C;
				font-weight: bold; border-radius: 4px; cursor: pointer;
			}
			.tracker-ticker-bar {
				height: 36px; background: #050B14; border-top: 1px solid #162A45;
				display: flex; align-items: center; overflow: hidden; color: #00F2FE; font-size: 13px;
			}
			.ticker-content {
				white-space: nowrap; animation: tickerScroll 25s linear infinite; padding-left: 100%;
			}
			@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
		`;
		document.head.appendChild(style);
	}
}
