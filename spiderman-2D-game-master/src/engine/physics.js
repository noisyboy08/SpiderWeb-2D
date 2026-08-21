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

	static findBestAnchor(playerPos, aimWorldPos, anchors, isTouch = false) {
		const searchRadius = isTouch ? PHYSICS_CONSTANTS.anchorSearchRadiusTouch : PHYSICS_CONSTANTS.anchorSearchRadiusDesktop;
		let bestAnchor = null;
		let minDistance = Infinity;

		for (const anchor of anchors) {
			// Distance from aim target
			const dxAim = anchor.x - aimWorldPos.x;
			const dyAim = anchor.y - aimWorldPos.y;
			const distAim = Math.sqrt(dxAim * dxAim + dyAim * dyAim);

			// Distance from player
			const dxPlayer = anchor.x - playerPos.x;
			const dyPlayer = anchor.y - playerPos.y;
			const distPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);

			if (distAim <= searchRadius && distPlayer <= PHYSICS_CONSTANTS.maxWebRange) {
				if (distAim < minDistance) {
					minDistance = distAim;
					bestAnchor = anchor;
				}
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
