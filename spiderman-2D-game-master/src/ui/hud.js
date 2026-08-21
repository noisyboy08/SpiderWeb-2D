// Spiderweb — In-Level HUD Overlay (Section 10.1 Spec)
import { saveManager } from '../save/saveManager.js';

export class HUD {
	constructor(game) {
		this.game = game;
		this.ctx = game.ctx;
	}

	draw(player, level, boss = null) {
		const ctx = this.ctx;
		const width = this.game.canvas.width;
		const height = this.game.canvas.height;
		const isSpiderGirl = (saveManager.data.selectedCharacter === 'spidergirl');

		ctx.save();

		// --- 1. Top-Left: Player Health Bar ---
		const hpX = 20;
		const hpY = 20;
		const hpW = 200;
		const hpH = 20;

		const maxHp = player.maxHealth || 100;
		const curHp = Math.max(0, player.health || 0);
		const hpRatio = curHp / maxHp;

		// Health Bar Container
		ctx.fillStyle = "rgba(11, 25, 44, 0.85)";
		ctx.fillRect(hpX, hpY, hpW, hpH);
		ctx.strokeStyle = isSpiderGirl ? "#FF3D8A" : "#00F2FE";
		ctx.lineWidth = 2;
		ctx.strokeRect(hpX, hpY, hpW, hpH);

		// Health Fill Bar
		const fillW = Math.max(0, hpW * hpRatio);
		ctx.fillStyle = isSpiderGirl ? "#FF3D8A" : "#00F2FE";
		ctx.fillRect(hpX, hpY, fillW, hpH);

		// Health Label Text
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold 12px SpidermanGamePixelFont, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(`${isSpiderGirl ? 'SPIDERGIRL' : 'SPIDERWEB'} HP: ${Math.round(curHp)}/${maxHp}`, hpX + 6, hpY + 14);

		// --- 2. Top-Center: Boss Health Bar (if active boss level) ---
		if (boss && boss.health > 0) {
			const bossW = 340;
			const bossH = 22;
			const bossX = (width - bossW) / 2;
			const bossY = 20;

			const bMaxHp = boss.maxHealth || 100;
			const bCurHp = Math.max(0, boss.health);
			const bRatio = bCurHp / bMaxHp;

			ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
			ctx.fillRect(bossX, bossY, bossW, bossH);
			ctx.strokeStyle = "#FF3D8A";
			ctx.lineWidth = 2;
			ctx.strokeRect(bossX, bossY, bossW, bossH);

			ctx.fillStyle = "#FF3D8A";
			ctx.fillRect(bossX, bossY, bossW * bRatio, bossH);

			ctx.fillStyle = "#FFFFFF";
			ctx.font = "bold 13px SpidermanGamePixelFont, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(`${boss.name.toUpperCase()} - ${Math.round(bCurHp)}/${bMaxHp}`, width / 2, bossY + 16);
		}

		// --- 3. Top-Right: Level Distance Counter ---
		if (level) {
			const dist = Math.round(Math.max(0, player.x || 0));
			const totalDist = level.worldLength || 4000;

			ctx.fillStyle = "#FFFFFF";
			ctx.font = "bold 14px SpidermanGamePixelFont, sans-serif";
			ctx.textAlign = "right";
			ctx.fillText(`DIST: ${dist}m / ${totalDist}m`, width - 20, 35);
		}

		ctx.restore();
	}
}
