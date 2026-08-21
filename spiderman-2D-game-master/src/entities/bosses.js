// Spiderweb — Boss AI State Machines (The Enforcer, Thread, Stinger) - Section 4, 7.3, 9 Spec
import { audioManager } from '../audio/audioManager.js';
import { PHYSICS_CONSTANTS } from '../engine/physics.js';

export class BossEntity {
	constructor(game, config) {
		this.game = game;
		this.ctx = game.ctx;
		this.name = config.name || "Boss";
		this.type = config.type;
		this.maxHealth = config.health || 100;
		this.health = this.maxHealth;
		this.x = 2200;
		this.y = 350;
		this.width = 60;
		this.height = 90;
		this.phase = 1;
		this.state = "TRACK"; // TRACK, TELEGRAPH, EXECUTE, COOLDOWN, ARMOR_PHASE
		this.stateTimer = 0;
		this.currentAttack = null;
		this.isInvulnerable = false;
	}

	update(player, dt) {
		this.stateTimer += dt * 1000;

		switch (this.state) {
			case "TRACK":
				this.updateTrack(player, dt);
				break;
			case "TELEGRAPH":
				if (this.stateTimer >= (this.currentAttack?.telegraphMs || 600)) {
					this.state = "EXECUTE";
					this.stateTimer = 0;
					this.executeAttack(player);
				}
				break;
			case "EXECUTE":
				if (this.stateTimer >= 400) {
					this.state = "COOLDOWN";
					this.stateTimer = 0;
				}
				break;
			case "COOLDOWN":
				if (this.stateTimer >= (this.currentAttack?.cooldownMs || 1500)) {
					this.state = "TRACK";
					this.stateTimer = 0;
				}
				break;
			case "ARMOR_PHASE":
				if (this.stateTimer >= 3000) {
					this.isInvulnerable = false;
					this.state = "TRACK";
					this.stateTimer = 0;
				}
				break;
		}

		// Phase transition check for Stinger
		if (this.type === "stinger" && this.phase === 1 && this.health <= 50) {
			this.phase = 2;
			this.state = "ARMOR_PHASE";
			this.stateTimer = 0;
			this.isInvulnerable = true;
			console.log("[Spiderweb Boss] Stinger entered Phase 2 Armor Phase!");
		}

		this.draw();
	}

	updateTrack(player, dt) {
		const dx = player.x - this.x;
		if (Math.abs(dx) > 80) {
			this.x += Math.sign(dx) * 120 * dt;
		} else {
			// Trigger attack
			this.startTelegraph();
		}
	}

	startTelegraph() {
		this.state = "TELEGRAPH";
		this.stateTimer = 0;
		this.currentAttack = { name: "attack", telegraphMs: 600, cooldownMs: 1500 };
		audioManager.playTelegraphWarning();
	}

	executeAttack(player) {
		audioManager.playHitImpact();
		// Deal damage if player in range
		const dx = Math.abs(player.x - this.x);
		const dy = Math.abs(player.y - this.y);
		if (dx < 90 && dy < 90) {
			player.takeDamage(20);
		}
	}

	takeDamage(amount) {
		if (this.isInvulnerable) return;
		this.health = Math.max(0, this.health - amount);
		audioManager.playHitImpact();
		if (this.health <= 0) {
			console.log(`[Spiderweb Boss] ${this.name} Defeated!`);
		}
	}

	draw() {
		const ctx = this.ctx;
		const camX = this.game.cameraX || 0;
		const drawX = this.x - camX;

		ctx.save();

		// Telegraph indicator
		if (this.state === "TELEGRAPH") {
			ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
			ctx.beginPath();
			ctx.arc(drawX + this.width / 2, this.y - 20, 20, 0, Math.PI * 2);
			ctx.fill();
		}

		// Color tinting per boss type & invulnerability
		let color = "#7A5230"; // Dark Bronze (Stinger)
		if (this.type === "the_enforcer") color = "#4A5568"; // Grey/Red
		if (this.type === "thread") color = "#5B2A86"; // Purple

		if (this.isInvulnerable) color = "#E2E8F0"; // Armor Phase tint

		ctx.fillStyle = color;
		ctx.fillRect(drawX, this.y, this.width, this.height);
		ctx.strokeStyle = "#030712";
		ctx.strokeRect(drawX, this.y, this.width, this.height);

		// Boss Name Tag above head
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold 12px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(this.name, drawX + this.width / 2, this.y - 10);

		ctx.restore();
	}
}
