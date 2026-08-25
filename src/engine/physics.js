// Spiderweb — Pendulum Physics & Math Engine (Section 5 Spec)

export const PHYSICS_CONSTANTS = {
	gravityAccel: 1800,        // px/s^2 - pendulum restoring force
	freeFallGravity: 2200,     // px/s^2 - free fall gravity
	maxFallSpeed: 1400,        // px/s - terminal velocity cap
	ropeLengthMin: 120,        // px
	ropeLengthMax: 480,        // px
	angularDamping: 0.999,     // damping factor per frame @60fps
	pumpTorque: 6.0,           // rad/s^2 - player torque
	maxAngularVelocity: 4.5,   // rad/s - angular speed cap
	wallKickImpulse: 500,      // px/s horizontal launch
	wallKickUpwardImpulse: 700,// px/s vertical launch
	swingStrikeSpeedThreshold: 600, // px/s min speed for collision damage
	anchorSearchRadiusDesktop: 90,  // px
	anchorSearchRadiusTouch: 130,   // px
	maxWebRange: 520             // px
};

export class PhysicsEngine {
	static clampDeltaTime(dt) {
		// Section 5.8: clamp delta-time to avoid physics spiral of death
		return Math.min(Math.max(dt, 0.001), 1 / 30);
	}

	static findBestAnchor(playerPos, playerVelocity, anchors) {
		let bestAnchor = null;
		let maxScore = -Infinity;

		// Calculate player's movement direction (normalized)
		// If standing still, default to looking slightly up and forward (assuming facing right if 0)
		let vx = playerVelocity.x;
		let vy = playerVelocity.y;
		let speed = Math.sqrt(vx*vx + vy*vy);
		let dirX = speed > 0 ? vx / speed : 1;
		let dirY = speed > 0 ? vy / speed : -1;

		// If falling mostly straight down, bias direction forward and up so we can swing out
		if (dirY > 0.5 && Math.abs(dirX) < 0.5) {
			dirX = playerVelocity.lastDirX || 1; 
			dirY = -1;
		}

		for (const anchor of anchors) {
			const dx = anchor.x - playerPos.x;
			const dy = anchor.y - playerPos.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			// Must be within max web range
			if (dist > PHYSICS_CONSTANTS.maxWebRange) continue;
			
			// Must be ABOVE the player to swing (dy is negative when anchor is above player)
			if (dy > -20) continue; 

			// Normalize direction to anchor
			const normX = dx / dist;
			const normY = dy / dist;

			// Dot product to see how well it aligns with our current velocity/intent
			const dot = (normX * dirX) + (normY * dirY);

			// Score: Heavily weight alignment (dot product) and slight preference for being a bit further away (better swing arcs)
			let score = (dot * 100) + (dist * 0.1);

			// Penalty if the anchor is almost directly overhead (makes for a boring straight up/down swing)
			if (Math.abs(dx) < 30) score -= 50;

			if (score > maxScore) {
				maxScore = score;
				bestAnchor = anchor;
			}
		}

		return bestAnchor;
	}

	static updatePendulumSwing(entity, dt, pumpDirection = 0) {
		dt = this.clampDeltaTime(dt);

		const { anchor, ropeLength } = entity.webState;
		let { theta, angularVelocity } = entity.webState;

		// Pendulum restoring force: angularAccel = -(gravityAccel / ropeLength) * sin(theta)
		let angularAccel = -(PHYSICS_CONSTANTS.gravityAccel / ropeLength) * Math.sin(theta);

		// Player pumping torque
		if (pumpDirection !== 0) {
			angularAccel += pumpDirection * PHYSICS_CONSTANTS.pumpTorque;
		}

		angularVelocity += angularAccel * dt;
		angularVelocity *= Math.pow(PHYSICS_CONSTANTS.angularDamping, dt * 60);
		angularVelocity = Math.max(-PHYSICS_CONSTANTS.maxAngularVelocity, Math.min(PHYSICS_CONSTANTS.maxAngularVelocity, angularVelocity));

		theta += angularVelocity * dt;

		// Calculate updated entity position
		entity.x = anchor.x + ropeLength * Math.sin(theta);
		entity.y = anchor.y + ropeLength * Math.cos(theta);

		entity.webState.theta = theta;
		entity.webState.angularVelocity = angularVelocity;

		// Update tangential velocities for release projection
		entity.velocityX = ropeLength * Math.cos(theta) * angularVelocity;
		entity.velocityY = -ropeLength * Math.sin(theta) * angularVelocity;
	}

	static updateFreeFall(entity, dt) {
		dt = this.clampDeltaTime(dt);
		entity.velocityY += PHYSICS_CONSTANTS.freeFallGravity * dt;
		entity.velocityY = Math.min(entity.velocityY, PHYSICS_CONSTANTS.maxFallSpeed);

		entity.x += entity.velocityX * dt;
		entity.y += entity.velocityY * dt;
	}
}
