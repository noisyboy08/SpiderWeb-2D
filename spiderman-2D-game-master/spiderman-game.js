(function(window, document) {
'use strict';

// ─────────────────────────────────────────────────────────────
//  RESOURCES & AUDIO
// ─────────────────────────────────────────────────────────────
var RESOURCES_FOLDER_PATH = "";

var requestAnimationFrame = (function() {
	if (window.requestAnimationFrame) return window.requestAnimationFrame;
	if (window.oRequestAnimationFrame) return window.oRequestAnimationFrame;
	if (window.msRequestAnimationFrame) return window.msRequestAnimationFrame;
	if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame;
	return function(cb) { setTimeout(cb, 1000 / 60); };
})();
window.requestAnimFrame = requestAnimationFrame;

var link = document.createElement("link");
link.setAttribute("rel", "stylesheet");
link.setAttribute("href", RESOURCES_FOLDER_PATH + "css/spiderman-game.css");
document.head.appendChild(link);

var RESOURCES = {
	"JUMP"               : "images/jump.png",
	"RUNNING_CHANGE_STEP": "images/running-change-step.png",
	"RUNNING_LEFT_STEP"  : "images/running-left-step.png",
	"RUNNING_RIGHT_STEP" : "images/running-right-step.png",
	"SHOOT_CHANGE_STEP"  : "images/shoot-change-step.png",
	"SHOOT_JUMP"         : "images/shoot-jump.png",
	"SHOOT_LEFT-STEP"    : "images/shoot-left-step.png",
	"SHOOT_RIGHT-STEP"   : "images/shoot-right-step.png",
	"SHOOT"              : "images/shoot.png",
	"SLIDE"              : "images/slide.png",
	"STANDING"           : "images/standing.png",
	"WEB_PROJECTILE"     : "images/web.png",
	"BACKGROUND"         : "images/background.jpg",
	"ROOF"               : "images/wall.jpg",
	"BUILDING"           : "images/building.png",
	"SPIDER_HEAD"        : "images/spider-head.png",
	"HEART"              : "images/heart.png",
	"VENOM"              : "images/venom.png",
	"THUG"               : "images/thug.png",
	"KNIFE"              : "images/knife.png",
};

var AUDIO_RESOURCES = {
	"AMAZING_SPIDER_MAN_2" : new Audio(RESOURCES_FOLDER_PATH + "audio/amazing-spider-man-2.mp3"),
	"FRIENDLY_SPIDERMAN"   : new Audio(RESOURCES_FOLDER_PATH + "audio/60-theme-song.mp3"),
	"MOVIE_THEME"          : new Audio(RESOURCES_FOLDER_PATH + "audio/old-theme.mp3"),
	"ANIMATED_SERIES"      : new Audio(RESOURCES_FOLDER_PATH + "audio/animated-series-theme.mp3"),
	"SHOOT"                : new Audio(RESOURCES_FOLDER_PATH + "audio/shooting-web.mp3"),
};

var AUDIO_LOOP = ["AMAZING_SPIDER_MAN_2","FRIENDLY_SPIDERMAN","MOVIE_THEME","ANIMATED_SERIES"];

// ─────────────────────────────────────────────────────────────
//  WEB AUDIO SFX SYNTHESIZER (zero-download, no licensing)
// ─────────────────────────────────────────────────────────────
var _audioCtx = null;
function getAudioCtx() {
	if (!_audioCtx) {
		try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
	}
	return _audioCtx;
}

function synthSFX(type, freq, endFreq, duration, volume) {
	var ctx = getAudioCtx();
	if (!ctx) return;
	try {
		var osc = ctx.createOscillator();
		var gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.type = type || 'sine';
		osc.frequency.setValueAtTime(freq || 440, ctx.currentTime);
		if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
		gain.gain.setValueAtTime((volume || 0.3), ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + duration);
	} catch(e){}
}

function sfxWebThwip()       { synthSFX('sawtooth', 800, 200, 0.12, 0.25); }
function sfxHitImpact()      { synthSFX('square', 180, 60, 0.15, 0.35); }
function sfxEnemyDefeat()    { synthSFX('sine', 600, 1200, 0.18, 0.2); }
function sfxBossTelegraph()  { synthSFX('sawtooth', 120, 80, 0.5, 0.4); }
function sfxCheckpoint()     { synthSFX('sine', 523, 784, 0.25, 0.3); }
function sfxLevelComplete()  { synthSFX('sine', 523, 1047, 0.4, 0.4); }
function sfxWebZip()         { synthSFX('triangle', 1200, 400, 0.1, 0.3); }
function sfxWebFail()        { synthSFX('square', 90, 45, 0.08, 0.18); }
function sfxLand()           { synthSFX('sine', 200, 80, 0.1, 0.22); }

// ─────────────────────────────────────────────────────────────
//  PHYSICS CONSTANTS (Section 5.7)
// ─────────────────────────────────────────────────────────────
var PHYSICS = {
	gravityAccel:      1800,
	freeFallGravity:   2200,
	maxFallSpeed:      1400,
	ropeLengthMin:     120,
	ropeLengthMax:     480,
	angularDamping:    0.999,
	pumpTorque:        6.0,
	maxAngularVelocity: 4.5,
	wallKickImpulse:   500,
	wallKickUpward:    700,
	swingStrikeSpeed:  600,   // px/s minimum for a swing-strike kill
	maxWebRange:       520,
	anchorRadiusDesktop: 90,
};

function clampDt(dt) { return Math.min(Math.max(dt, 0.001), 1/30); }

// Anchor auto-snap: score-based magnet targeting (Plan 1, Epic 1)
function findBestAnchor(px, py, vx, vy, anchors) {
	var best = null, maxScore = -Infinity;
	var speed = Math.sqrt(vx*vx + vy*vy);
	var dirX = speed > 0 ? vx/speed : 1;
	var dirY = speed > 0 ? vy/speed : -1;
	// Bias upward if falling straight down
	if (dirY > 0.5 && Math.abs(dirX) < 0.5) { dirX = 1; dirY = -1; }
	for (var i = 0; i < anchors.length; i++) {
		var a = anchors[i];
		var dx = a.x - px, dy = a.y - py;
		var dist = Math.sqrt(dx*dx + dy*dy);
		if (dist > PHYSICS.maxWebRange) continue;
		if (dy > -20) continue;  // must be above player
		var nx = dx/dist, ny = dy/dist;
		var dot = nx*dirX + ny*dirY;
		var score = dot*100 + dist*0.1;
		if (Math.abs(dx) < 30) score -= 50;  // penalize straight-up
		if (score > maxScore) { maxScore = score; best = a; }
	}
	return best;
}

// ─────────────────────────────────────────────────────────────
//  KEY CONSTANTS
// ─────────────────────────────────────────────────────────────
var KEY = {
	ARROW_LEFT: 37, ARROW_UP: 38, ARROW_RIGHT: 39, ARROW_DOWN: 40,
	SPACEBAR: 32, SHIFT: 16,
	A: 65, S: 83, D: 68, W: 87,
	E: 69, F: 70, M: 77, Q: 81, X: 88,
	TAB: 9, ESC: 27,
};
var DIRECTION = { RIGHT: 1, LEFT: -1 };

// ─────────────────────────────────────────────────────────────
//  SPIDERMANGAME — Main controller
// ─────────────────────────────────────────────────────────────
function SpidermanGame(opts) {
	opts = opts || {};
	this.canvas = opts.canvas || "canvas";
	this.score = 0;
	this.muted = opts.muted || false;
	this.soundEffects = opts.soundEffects !== false;
	this.frame = 0;
	this.resources = {};
	this.cameraX = 0;

	// Level config (set by startLevel before restart)
	this.levelConfig = null;
	this.levelWorldLength = Infinity;
	this.worldProgress = 0;
	this.levelCompleted = false;
	this.activeLevelId = 1;
	this.speedMultiplier = 1.0;
	this.isSpiderGirl = false;
	this.swingSpeedMult = 1.0;

	// Checkpoint system
	this.lastCheckpointX = 0;
	this.checkpointsPassed = [];

	// Boss state
	this.activeBoss = null;
	this.bossDefeated = false;

	// Hazard state
	this.windForce = 0;
	this.windTimer = 0;
	this.hazards = [];  // fire zones, cranes, searchlights, crumbling roofs

	// Screen shake
	this.shakeAmount = 0;
	this.reduceShake = false;

	// Hit-stop: physics freeze (ms) triggered on swing-kill
	this.hitStopMs = 0;

	this.scene = { spiderman: null, projectiles: [], roofs: [], enemies: [] };
	this._loopGen = 0;
	this._lastFrameTime = 0;
}

SpidermanGame.prototype.paused       = false;
SpidermanGame.prototype.initialized  = false;
SpidermanGame.prototype.soundEffects = true;
SpidermanGame.prototype.escapeKey    = false;
SpidermanGame.prototype.muted        = false;
SpidermanGame.prototype.slowmotion   = false;
SpidermanGame.prototype.gameIsOver   = false;

SpidermanGame.prototype.fitCanvasToViewport = function() {
	if (!this.canvas) return;
	this.canvas.style.width = '100vw';
	this.canvas.style.height = '100vh';
	this.canvas.style.top = '0';
	this.canvas.style.left = '0';
	this.canvas.style.transform = 'none';
};

SpidermanGame.prototype.load = function() {
	if (this.initialized) return false;
	var self = this;

	this.canvas = document.querySelector(this.canvas);
	if (!this.canvas) { this.canvas = document.createElement("canvas"); document.body.appendChild(this.canvas); }
	this.ctx = this.canvas.getContext("2d");
	this.canvas.width  = 1280;
	this.canvas.height = 720;
	this.fitCanvasToViewport();
	window.addEventListener("resize", function() { self.fitCanvasToViewport(); });

	// Pause menu
	var menu = document.createElement("div");
	menu.innerHTML =
		'<div class="spiderman-game-menu-container">' +
		'<div class="spiderman-game-menu-title">PAUSED</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-resume">RESUME</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-sounds">MUTE SOUNDS</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-music">MUTE MUSIC</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-slowmotion">TOGGLE SLOWMOTION</div>' +
		'</div>';
	menu = menu.firstChild;
	menu.style.display = "none";
	menu.querySelector(".spiderman-game-menu-button-resume").onclick = function() { self.unpause(); };
	menu.querySelector(".spiderman-game-menu-button-mute-sounds").onclick = function() {
		self.soundEffects = !self.soundEffects;
		this.innerHTML = self.soundEffects ? "MUTE SOUNDS" : "UNMUTE SOUNDS";
	};
	menu.querySelector(".spiderman-game-menu-button-mute-music").onclick = function() {
		if (self.muted) { self.unmute(); this.innerHTML = "MUTE MUSIC"; }
		else { self.mute(); this.innerHTML = "UNMUTE MUSIC"; }
	};
	menu.querySelector(".spiderman-game-menu-button-mute-slowmotion").onclick = function() {
		self.setSlowmotion(!self.slowmotion);
	};
	document.body.appendChild(menu);
	this.pauseMenu = menu;

	// Game over menu
	var gameoverMenu = document.createElement("div");
	gameoverMenu.innerHTML =
		'<div class="spiderman-game-menu-container">' +
		'<div class="spiderman-game-menu-title">GAME OVER</div>' +
		'<div class="spiderman-game-menu-title" style="font-size:16px;">FINAL SCORE: <span class="spiderman-game-score">0</span></div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-restart">RETRY</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-tracker">MISSION TRACKER</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-cheat">CHEAT CODE</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-settings">SETTINGS</div>' +
		'</div>';
	gameoverMenu = gameoverMenu.firstChild;
	gameoverMenu.style.display = "none";
	gameoverMenu.querySelector(".spiderman-game-menu-button-restart").onclick = function() {
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_RETRY')); return; }
		self.restart();
	};
	gameoverMenu.querySelector(".spiderman-game-menu-button-tracker").onclick = function() {
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_TRACKER')); return; }
		self.restart();
	};
	gameoverMenu.querySelector(".spiderman-game-menu-button-cheat").onclick = function() {
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_CHEAT')); }
	};
	gameoverMenu.querySelector(".spiderman-game-menu-button-settings").onclick = function() {
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_SETTINGS')); return; }
		self.showPauseMenu();
	};
	document.body.appendChild(gameoverMenu);
	this.gameoverMenu = gameoverMenu;

	var spiderman = new SpiderMan(this);
	this.spiderman = spiderman;

	document.addEventListener("keydown", function(e) {
		var kc = e.keyCode || e.which;
		// Prevent browser default for all game control keys:
		// Spacebar (web shoot), arrow keys (move/aim), Shift (swing), S/A/D/W/X/E (game actions)
		var GAME_KEYS = [
			KEY.SPACEBAR,
			KEY.ARROW_UP, KEY.ARROW_DOWN, KEY.ARROW_LEFT, KEY.ARROW_RIGHT,
			KEY.SHIFT, KEY.X, KEY.E,
			KEY.W, KEY.A, KEY.S, KEY.D
		];
		if (GAME_KEYS.indexOf(kc) > -1 && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
			e.preventDefault();
		}
		if (kc == KEY.ESC && !self.escapeKey) {
			self.escapeKey = true;
			if (self.paused) self.unpause(); else self.pause();
		}
		// Tab / M — open Mission Tracker mid-game
		if ((kc == KEY.TAB || kc == KEY.M) && !window.__swOverlayActive && !self.gameIsOver) {
			e.preventDefault();
			window.dispatchEvent(new CustomEvent('SPIDERWORLD_TRACKER'));
		}
		// F — toggle Fullscreen
		if (kc == KEY.F) {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen().catch(err => {});
			} else {
				document.exitFullscreen();
			}
		}
		self.spiderman.keydown(kc);
	});
	document.addEventListener("keyup", function(e) {
		var kc = e.keyCode || e.which;
		if (kc == KEY.ESC) self.escapeKey = false;
		self.spiderman.keyup(kc);
	});
	window.addEventListener("resize", function() {
		if (self.paused) self.showPauseMenu();
		if (self.gameIsOver) self.showGameoverMenu();
	});

	// Music loop
	for (var i = 0; i < AUDIO_LOOP.length; i++) {
		var snd = AUDIO_RESOURCES[AUDIO_LOOP[i]];
		snd.setAttribute("data-name", AUDIO_LOOP[i]);
		snd.ontimeupdate = (function(nm) {
			return function() {
				if (this.currentTime >= this.duration) {
					var cur = AUDIO_LOOP.indexOf(nm);
					var nxt = (cur + 1) % AUDIO_LOOP.length;
					self.playSound(AUDIO_LOOP[nxt], false, 0);
				}
			};
		})(AUDIO_LOOP[i]);
	}

	this.canvas.style.backgroundColor = "black";
	this.ctx.font = "30px Helvetica";
	this.ctx.textAlign = "center";
	this.ctx.fillStyle = "white";
	this.ctx.fillText("Loading...", this.canvas.width/2, this.canvas.height/2);

	return new Promise(function(resolve) {
		var arr = [];
		for (var r in RESOURCES) arr.push({ name: r, source: RESOURCES_FOLDER_PATH + RESOURCES[r] });
		var idx = 0;
		function loadNext() {
			if (!arr[idx]) {
				var roof = new Roof(self, 0);
				self.scene.spiderman = spiderman;
				self.scene.roofs = [roof];
				self._loopGen = 0;
				self._lastFrameTime = performance.now();
				self.update();
				self.playSound(AUDIO_LOOP[0], false, 0);
				if (self.muted) self.mute();
				return resolve();
			}
			var item = arr[idx];
			var img = new Image();
			img.onload = function() { idx++; self.resources[item.name] = img; loadNext(); };
			img.onerror = function() { idx++; loadNext(); };  // gracefully skip missing images
			img.src = item.source;
		}
		loadNext();
	});
};

SpidermanGame.prototype.setSlowmotion = function(v) {
	this.slowmotion = v;
	window.requestAnimFrame = v ? function(cb){ setTimeout(cb, 1000/10); } : requestAnimationFrame;
	for (var a in AUDIO_RESOURCES) AUDIO_RESOURCES[a].playbackRate = v ? 0.5 : 1;
};
SpidermanGame.prototype.mute = function() {
	this.muted = true;
	for (var a in AUDIO_RESOURCES) AUDIO_RESOURCES[a].volume = 0;
};
SpidermanGame.prototype.unmute = function() {
	this.muted = false;
	for (var a in AUDIO_RESOURCES) AUDIO_RESOURCES[a].volume = 1;
};

SpidermanGame.prototype.showPauseMenu = function() {
	if (window.__swOverlayActive) { if (this.pauseMenu) this.pauseMenu.style.display = "none"; return; }
	if (this.gameoverMenu.style.display == "block") return;
	var r = this.canvas.getBoundingClientRect();
	this.pauseMenu.style.display = "block";
	this.pauseMenu.style.left = (r.left + this.canvas.width/2) + "px";
	this.pauseMenu.style.top  = (r.top  + this.canvas.height/2) + "px";
};
SpidermanGame.prototype.showGameoverMenu = function() {
	this.gameoverMenu.querySelector(".spiderman-game-score").innerHTML = this.score;
	var r = this.canvas.getBoundingClientRect();
	this.gameoverMenu.style.display = "block";
	this.gameoverMenu.style.left = (r.left + this.canvas.width/2) + "px";
	this.gameoverMenu.style.top  = (r.top  + this.canvas.height/2) + "px";
};
SpidermanGame.prototype.pause = function() { this.paused = true; this.showPauseMenu(); };
SpidermanGame.prototype.unpause = function() {
	this.paused = false;
	this.pauseMenu.style.display = "none";
	this._lastFrameTime = performance.now();
	this.update();
};
SpidermanGame.prototype.playSound = function(audio, clone, currentTime) {
	audio = (audio && audio.play) ? audio : AUDIO_RESOURCES[audio];
	if (!audio || !audio.play) return;
	if (clone) audio = audio.cloneNode(true);
	if (currentTime != null) audio.currentTime = currentTime;
	return audio.play().catch(function(){});
};
SpidermanGame.prototype.pauseSound = function(audio) {
	if (audio && audio.pause) return audio.pause();
	if (AUDIO_RESOURCES[audio]) AUDIO_RESOURCES[audio].pause();
};

SpidermanGame.prototype.addShake = function(amount) {
	if (!this.reduceShake) this.shakeAmount = Math.max(this.shakeAmount, amount);
};

// ─────────────────────────────────────────────────────────────
//  MAIN UPDATE LOOP  (delta-time based)
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.update = function() {
	var myGen = this._loopGen;
	var now = performance.now();
	var dt = clampDt((now - this._lastFrameTime) / 1000);
	this._lastFrameTime = now;

	// Screen shake
	var shakeX = 0, shakeY = 0;
	if (this.shakeAmount > 0.5) {
		shakeX = (Math.random()-0.5) * this.shakeAmount;
		shakeY = (Math.random()-0.5) * this.shakeAmount;
		this.shakeAmount *= 0.85;
	} else {
		this.shakeAmount = 0;
	}

	this.ctx.save();
	if (shakeX || shakeY) this.ctx.translate(shakeX, shakeY);
	this.ctx.clearRect(-20, -20, this.canvas.width+40, this.canvas.height+40);
	this.drawBackground();
	this.drawHazardLayers(dt);
	this.drawRoofs(dt);
	this.ctx.restore();

	if (!this.paused && !this.gameIsOver) {
		var scene = this.scene;
		var spider = scene.spiderman;
		var projs  = scene.projectiles;

		this.ctx.save();
		if (shakeX || shakeY) this.ctx.translate(shakeX, shakeY);
		this.drawEnemies(dt);
		this.updateBoss(spider, dt);

		// ── Hit-stop: freeze physics for N ms after swing-kill ────────
		var hitStopped = (this.hitStopMs > 0);
		if (hitStopped) {
			this.hitStopMs -= dt * 1000;
			if (this.hitStopMs < 0) this.hitStopMs = 0;
		} else {
			for (var i = 0; i < projs.length; i++) projs[i].update(dt);
			spider.update(dt);
			this.checkSwingStrike(spider, dt);
			this.checkCheckpoints(spider);
			this.updateHazardEffects(spider, dt);
			this.updateWind(dt);
		}
		this.ctx.restore();

		// projectile collision (after rendering)
		for (var j = projs.length-1; j >= 0; j--) {
			var prj = projs[j];
			var ch = this.isCharacterAtPoint(prj.x, prj.y);
			if (ch) {
				prj.handleHitWithCharacter(ch);
				ch.handleHitWithProjectile(prj);
			}
		}

		// World progress
		if (spider.velocityX > 0) this.worldProgress += spider.velocityX * dt;

		// HUD events
		window.dispatchEvent(new CustomEvent('SPIDERWORLD_HPUPDATE', {
			detail: { hp: spider.health, maxHp: spider.maxHealth }
		}));
		window.dispatchEvent(new CustomEvent('SPIDERWORLD_PROGRESS', {
			detail: { dist: Math.floor(spider.x) }
		}));

		// Level complete check (non-boss levels)
		if (!this.levelCompleted && !this.activeBoss) {
			if (this.levelWorldLength !== Infinity && spider.x >= this.levelWorldLength) {
				this.completeLevelReached();
			}
		}
		// Boss defeated?
		if (this.activeBoss && this.activeBoss.health <= 0 && !this.bossDefeated) {
			this.bossDefeated = true;
			this.completeLevelReached();
		}
	} else if (this.gameIsOver) {
		this.ctx.save();
		if (shakeX || shakeY) this.ctx.translate(shakeX, shakeY);
		this.drawEnemies(dt);
		this.ctx.restore();
		this.showGameoverMenu();
	} else if (this.paused) {
		this.ctx.save();
		if (shakeX || shakeY) this.ctx.translate(shakeX, shakeY);
		this.drawEnemies(dt);
		this.ctx.restore();
		this.showPauseMenu();
	}

	// Score display
	this.ctx.fillStyle = "white";
	this.ctx.font = "20px SpidermanGamePixelFont, Monospace, Helvetica";
	this.ctx.textAlign = "center";
	this.ctx.textBaseline = "top";
	this.ctx.fillText(this.score, this.canvas.width/2, 10);

	// ── Vignette — always the very last draw call ────────────────
	var _vg = this.ctx.createRadialGradient(
		this.canvas.width/2, this.canvas.height/2, 160,
		this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.74
	);
	_vg.addColorStop(0, 'rgba(0,0,0,0)');
	_vg.addColorStop(1, 'rgba(0,0,0,0.7)');
	this.ctx.fillStyle = _vg;
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	var self = this;
	requestAnimFrame(function() {
		if (self._loopGen === myGen) self.update();
	});
};

SpidermanGame.prototype.completeLevelReached = function() {
	if (this.levelCompleted) return;
	this.levelCompleted = true;
	sfxLevelComplete();
	window.dispatchEvent(new CustomEvent('SPIDERWORLD_LEVELCOMPLETE', {
		detail: { levelId: this.activeLevelId }
	}));
};

// ─────────────────────────────────────────────────────────────
//  SWING-STRIKE COMBAT  (Plan 1, Epic 2 + Plan 2 Phase A5)
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.checkSwingStrike = function(spider, dt) {
	var enemies = this.scene.enemies;
	var sw = 36, sh = 60;   // approx player bounds
	var spX = spider.x, spY = spider.y;
	var vx = spider.velocityX, vy = spider.velocityY;
	// Convert frame-based px/frame → px/s for threshold check
	var speed = Math.sqrt(vx*vx + vy*vy) * 60;

	for (var i = enemies.length-1; i >= 0; i--) {
		var e = enemies[i];
		var ew = e.w || 40, eh = e.h || 64;
		if (spX < e.x + ew && spX + sw > e.x && spY < e.y + eh && spY + sh > e.y) {
			if (spider.webState && spider.webState.attached && speed > PHYSICS.swingStrikeSpeed) {
				// Swing-Strike kill
				e.takeDamage(spider.isSpiderGirl ? 0.8 : 1);
				spider.velocityY -= 5 * dt * 60;  // upward bounce
				this.score += 10;
				sfxEnemyDefeat();
				this.addShake(8);
				this.hitStopMs = 65;   // 65 ms freeze — the kill "lands"
				window.dispatchEvent(new CustomEvent('SPIDERWORLD_SCOREUPDATE', { detail: { score: this.score } }));
			} else if (!spider.webState.attached || speed <= PHYSICS.swingStrikeSpeed) {
				// Normal contact — player takes damage (with invincibility frames)
				if (!spider.invincibleFrames || spider.invincibleFrames <= 0) {
					spider.takeDamage(1);
					spider.velocityX = (spX < e.x) ? -8 : 8;
					spider.velocityY = -8;
					if (spider.webState) spider.webState.attached = false;
					spider.addState("FALL");
					sfxHitImpact();
					this.addShake(12);
				}
			}
		}
	}
};

// ─────────────────────────────────────────────────────────────
//  CHECKPOINTS
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.checkCheckpoints = function(spider) {
	if (!this.levelConfig || !this.levelConfig.checkpoints) return;
	var cps = this.levelConfig.checkpoints;
	for (var i = 0; i < cps.length; i++) {
		if (spider.x >= cps[i] && this.checkpointsPassed.indexOf(cps[i]) === -1) {
			this.checkpointsPassed.push(cps[i]);
			this.lastCheckpointX = cps[i];
			sfxCheckpoint();
			// Visual flash
			this.showCheckpointFlash();
		}
	}
};

SpidermanGame.prototype.showCheckpointFlash = function() {
	var ctx = this.ctx;
	var alpha = 0.4;
	var id = setInterval(function() {
		// flash handled by canvas overlay — short green tint
		alpha -= 0.08;
		if (alpha <= 0) clearInterval(id);
	}, 50);
};

// ─────────────────────────────────────────────────────────────
//  BOSS INTEGRATION
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.updateBoss = function(spider, dt) {
	if (!this.activeBoss || this.bossDefeated) return;
	this.activeBoss.update(spider, dt, this.ctx, this.cameraX);
	// Fire boss HP event
	window.dispatchEvent(new CustomEvent('SPIDERWORLD_BOSSUPDATE', {
		detail: {
			hp: this.activeBoss.health,
			maxHp: this.activeBoss.maxHealth,
			name: this.activeBoss.name
		}
	}));
	// Check if boss hit player
	if (this.activeBoss.attackHitbox) {
		var h = this.activeBoss.attackHitbox;
		var sp = spider;
		if (sp.x < h.x+h.w && sp.x+36 > h.x && sp.y < h.y+h.h && sp.y+60 > h.y) {
			if (!sp.invincibleFrames || sp.invincibleFrames <= 0) {
				sp.takeDamage(this.activeBoss.attackDamage || 20);
				sfxHitImpact();
				this.addShake(15);
			}
		}
	}
	// Check if player's swing-strike hits boss
	var vx = spider.velocityX, vy = spider.velocityY;
	var speed = Math.sqrt(vx*vx + vy*vy) * 60;
	if (spider.webState && spider.webState.attached && speed > PHYSICS.swingStrikeSpeed) {
		var b = this.activeBoss;
		var drawX = b.x - this.cameraX;
		if (spider.x - this.cameraX > drawX - 20 && spider.x - this.cameraX < drawX + b.w + 20 &&
			spider.y > b.y - 20 && spider.y < b.y + b.h + 20) {
			if (!b.isInvulnerable && !b._hitCooldown) {
				b.takeDamage(spider.isSpiderGirl ? 8 : 10);
				b._hitCooldown = 0.5;
				sfxHitImpact();
				this.addShake(10);
			}
		}
	}
	if (this.activeBoss._hitCooldown > 0) this.activeBoss._hitCooldown -= dt;
};

// ─────────────────────────────────────────────────────────────
//  HAZARDS
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.initHazards = function() {
	this.hazards = [];
	this.windForce = 0;
	this.windTimer = 0;
	if (!this.levelConfig) return;

	var hz = this.levelConfig.hazards || [];
	var wl = this.levelConfig.worldLength || 4000;

	// Fire zones
	if (hz.indexOf('fire_zones') !== -1) {
		for (var f = 600; f < wl; f += 1200) {
			this.hazards.push({ type: 'fire', x: f + Math.random()*300, w: 120 + Math.random()*80, timer: 0 });
		}
	}
	// Crumbling roofs — flagged on Roof creation
	this.hasCrumblingRoofs = hz.indexOf('crumbling_roofs') !== -1;

	// Moving cranes
	if (hz.indexOf('moving_cranes') !== -1) {
		for (var c = 800; c < wl; c += 1100) {
			this.hazards.push({ type: 'crane', x: c + Math.random()*200, y: 280, phase: Math.random()*Math.PI*2, timer: 0 });
		}
	}
	// Searchlights
	if (hz.indexOf('searchlights') !== -1) {
		for (var s = 500; s < wl; s += 900) {
			this.hazards.push({ type: 'searchlight', x: s, angle: 0, speed: 0.5 + Math.random()*0.5, alertTimer: 0 });
		}
	}
	// Wind is a per-frame effect
	this.hasWind = hz.indexOf('wind') !== -1;
	// Lightning
	this.hasLightning = hz.indexOf('lightning') !== -1;
	this.lightningTimer = 4 + Math.random()*4;
	this.lightningFlash = 0;
};

SpidermanGame.prototype.updateWind = function(dt) {
	if (!this.hasWind) return;
	this.windTimer -= dt;
	if (this.windTimer <= 0) {
		this.windForce = (Math.random()-0.5) * 1.2;   // rad/s^2 push
		this.windTimer = 1.5 + Math.random()*2.5;
	}
};

SpidermanGame.prototype.drawHazardLayers = function(dt) {
	var ctx = this.ctx;
	var hz = this.hazards;
	for (var i = 0; i < hz.length; i++) {
		var h = hz[i];
		if (h.type === 'fire') {
			h.timer += dt;
			var rx = h.x - this.cameraX;
			if (rx < -200 || rx > this.canvas.width + 200) continue;
			// Fire glow
			var alpha = 0.55 + Math.sin(h.timer * 8) * 0.15;
			ctx.fillStyle = 'rgba(255,' + Math.floor(80+Math.sin(h.timer*12)*40) + ',0,' + alpha + ')';
			ctx.fillRect(rx, this.canvas.height - 80, h.w, 80);
			ctx.fillStyle = 'rgba(255,200,0,0.3)';
			ctx.fillRect(rx + 10, this.canvas.height - 100, h.w - 20, 30);
		}
		if (h.type === 'crane') {
			h.timer += dt;
			var craneY = h.y + Math.sin(h.phase + h.timer * 1.2) * 80;
			var craneX = h.x - this.cameraX;
			if (craneX < -200 || craneX > this.canvas.width + 200) continue;
			ctx.fillStyle = '#E59C2A';
			ctx.fillRect(craneX, craneY, 180, 14);
			ctx.strokeStyle = '#C07A10';
			ctx.lineWidth = 2;
			ctx.strokeRect(craneX, craneY, 180, 14);
			ctx.fillStyle = '#888';
			ctx.fillRect(craneX + 80, craneY - 100, 8, 100);
			h._drawY = craneY;
		}
		if (h.type === 'searchlight') {
			h.angle += h.speed * dt;
			var slX = h.x - this.cameraX;
			if (slX < -300 || slX > this.canvas.width + 300) continue;
			var beamAngle = Math.sin(h.angle) * (Math.PI / 4);
			var beamLen = 400;
			var bx = slX + Math.sin(beamAngle) * beamLen;
			var by = this.canvas.height - Math.cos(beamAngle) * beamLen;
			var grad = ctx.createLinearGradient(slX, this.canvas.height, bx, by);
			grad.addColorStop(0, 'rgba(255,255,180,0.5)');
			grad.addColorStop(1, 'rgba(255,255,180,0)');
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(slX, this.canvas.height);
			ctx.lineTo(slX - 40 + Math.sin(beamAngle-0.25)*beamLen, this.canvas.height - Math.cos(beamAngle-0.25)*beamLen);
			ctx.lineTo(slX + 40 + Math.sin(beamAngle+0.25)*beamLen, this.canvas.height - Math.cos(beamAngle+0.25)*beamLen);
			ctx.closePath();
			ctx.fillStyle = grad;
			ctx.fill();
			ctx.restore();
		}
	}
	// Lightning flash
	if (this.hasLightning) {
		this.lightningTimer -= dt;
		if (this.lightningFlash > 0) {
			this.lightningFlash -= dt;
			var reduceFlash = window.__swReduceFlash || false;
			if (!reduceFlash) {
				ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, this.lightningFlash * 3) + ')';
				ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			}
		}
		if (this.lightningTimer <= 0) {
			this.lightningFlash = 0.25;
			this.lightningTimer = 3 + Math.random() * 5;
			this.addShake(10);
		}
	}
};

SpidermanGame.prototype.updateHazardEffects = function(spider, dt) {
	var hz = this.hazards;
	for (var i = 0; i < hz.length; i++) {
		var h = hz[i];
		if (h.type === 'fire') {
			// Damage if player stands on fire zone
			if (spider.x > h.x - 20 && spider.x < h.x + h.w + 20 &&
				spider.y > this.canvas.height - 150) {
				if (!h._dmgTimer) h._dmgTimer = 0;
				h._dmgTimer += dt;
				if (h._dmgTimer > 1.0) { spider.takeDamage(1); h._dmgTimer = 0; sfxHitImpact(); }
			} else {
				h._dmgTimer = 0;
			}
		}
		if (h.type === 'crane') {
			// Damage if player contacts crane
			var craneX = h.x;
			var craneY = h._drawY || h.y;
			if (spider.x > craneX - 10 && spider.x < craneX + 190 &&
				spider.y + 30 > craneY && spider.y < craneY + 14) {
				if (!spider.invincibleFrames || spider.invincibleFrames <= 0) {
					spider.takeDamage(1);
					spider.velocityY = -10;
					if (spider.webState) spider.webState.attached = false;
					spider.addState("FALL");
					sfxHitImpact();
					this.addShake(8);
				}
			}
		}
		if (h.type === 'searchlight') {
			// If player is in searchlight beam — aggro nearby enemies
			var slAngle = Math.sin(h.angle) * (Math.PI/4);
			var beamDirX = Math.sin(slAngle), beamDirY = -Math.cos(slAngle);
			var toSpX = spider.x - h.x, toSpY = spider.y - this.canvas.height;
			var distS = Math.sqrt(toSpX*toSpX + toSpY*toSpY);
			var dot = (toSpX*beamDirX + toSpY*beamDirY) / (distS || 1);
			if (dot > 0.92 && distS < 500) {
				// Player spotted — aggro all visible enemies
				var enemies = this.scene.enemies;
				for (var ei = 0; ei < enemies.length; ei++) {
					if (enemies[ei].aggro !== undefined) enemies[ei].aggro = true;
				}
			}
		}
	}
};

// ─────────────────────────────────────────────────────────────
//  DRAW METHODS
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.drawBackground = function() {
	var ctx = this.ctx;
	var W = this.canvas.width, H = this.canvas.height;

	// ── Level-based sky gradient ──────────────────────────────────
	var skyPalettes = [
		['#0E1A2B','#1A3050'],   // Lvl 1-3  dusk navy
		['#1A0828','#2D0840'],   // Lvl 4-6  storm purple
		['#050E1A','#0A1E38'],   // Lvl 7-9  deep midnight
		['#1A1005','#2E1A08'],   // Lvl 10-11 ember
		['#1A0508','#380810'],   // Lvl 12   crimson
	];
	var _ci = Math.min(Math.floor(((this.activeLevelId||1) - 1) / 3), skyPalettes.length-1);
	var _sg = ctx.createLinearGradient(0, 0, 0, H);
	_sg.addColorStop(0, skyPalettes[_ci][0]);
	_sg.addColorStop(1, skyPalettes[_ci][1]);
	ctx.fillStyle = _sg;
	ctx.fillRect(0, 0, W, H);

	// ── Deterministic parallax skyline helper ─────────────────────
	var _drawSkyline = function(camX, speed, minH, maxH, fillA, fillB, winW) {
		var rx = (camX * speed) % W;
		for (var _copy = 0; _copy < 3; _copy++) {
			var _seed = 0x9E3779B9;
			var _bx = -rx + _copy * W * 1.65;
			while (_bx < W + 250) {
				_seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
				var _bw = 36 + (_seed % 90);
				_seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
				var _bh = minH + (_seed % (maxH - minH));
				ctx.fillStyle = fillA;
				ctx.fillRect(_bx, H - _bh, _bw, _bh);
				if (winW && fillB) {
					ctx.fillStyle = fillB;
					for (var _wy = H - _bh + 10; _wy < H - 10; _wy += 14) {
						for (var _wx = _bx + 5; _wx < _bx + _bw - 5; _wx += 10) {
							_seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
							if (_seed % 3 !== 0) continue;
							ctx.fillRect(_wx, _wy, winW, 4);
						}
					}
				}
				_bx += _bw + 4 + (_seed % 22);
			}
		}
	};

	// Layer 0 — far silhouette (very slow, solid dark)
	_drawSkyline(this.cameraX, 0.018, 90, 290, 'rgba(3,6,14,0.9)', null, null);

	// Layer 1 — mid buildings (moderate speed, lit windows)
	_drawSkyline(this.cameraX * 1.4, 0.052, 55, 190, 'rgba(6,12,26,0.75)', 'rgba(255,230,100,0.18)', 3);

	// Layer 2 — main background image at 30% alpha blend
	var _bg = this.resources.BACKGROUND;
	if (_bg) {
		var _ratio = _bg.width / _bg.height;
		var _bgx = (this.cameraX / 5 * -1) % Math.min(_bg.width, W);
		ctx.globalAlpha = 0.48;
		ctx.drawImage(_bg, _bgx, 0, H*_ratio, H);
		ctx.drawImage(_bg, _bgx + H*_ratio, 0, H*_ratio, H);
		ctx.globalAlpha = 1.0;
	}
};

SpidermanGame.prototype.drawRoofs = function(dt) {
	var roofs = this.scene.roofs;
	for (var i = 0; i < roofs.length; i++) roofs[i].update(dt);

	if (roofs.length < 3) {
		var last = roofs[roofs.length-1];
		var cfg  = this.levelConfig;
		var gMin = cfg && cfg.buildingGapRange ? cfg.buildingGapRange[0] : 100;
		var gMax = cfg && cfg.buildingGapRange ? cfg.buildingGapRange[1] : 150;
		var gap  = Math.round(Math.random()*(gMax-gMin)) + gMin;
		var roof = new Roof(this, last.x + last.fullWidth + gap);
		this.addRoof(roof);
		roofs[0].update(dt);
	}
};

SpidermanGame.prototype.drawEnemies = function(dt) {
	var enemies = this.scene.enemies;
	for (var i = 0; i < enemies.length; i++) enemies[i].update(dt);
};

// ─────────────────────────────────────────────────────────────
//  SCENE HELPERS
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.addProjectile = function(p) { if (p instanceof Projectile) this.scene.projectiles.push(p); };
SpidermanGame.prototype.removeProjectile = function(p) {
	var i = this.scene.projectiles.indexOf(p);
	if (i > -1) this.scene.projectiles.splice(i, 1);
};
SpidermanGame.prototype.addEnemy = function(e) { if (e instanceof Enemy) this.scene.enemies.push(e); };
SpidermanGame.prototype.removeEnemy = function(e) {
	var i = this.scene.enemies.indexOf(e);
	if (i > -1) this.scene.enemies.splice(i, 1);
};
SpidermanGame.prototype.addRoof = function(r) { if (r instanceof Roof) this.scene.roofs.push(r); };
SpidermanGame.prototype.removeRoof = function(r) {
	var i = this.scene.roofs.indexOf(r);
	if (i > -1) this.scene.roofs.splice(i, 1);
};

SpidermanGame.prototype.isRoofAtPoint = function(x, y) {
	x -= this.cameraX;
	for (var i = 0; i < this.scene.roofs.length; i++) {
		var r = this.scene.roofs[i];
		var rx = r.x - this.cameraX;
		if (rx <= x && rx + r.fullWidth >= x && y >= r.y) return r;
	}
	return false;
};
SpidermanGame.prototype.isCharacterAtPoint = function(x, y) {
	var chars = this.scene.enemies.concat(this.spiderman);
	x -= this.cameraX;
	for (var i = 0; i < chars.length; i++) {
		var c = chars[i];
		var img = c.stateImg || {};
		var l = c.x - this.cameraX;
		var t = c.y;
		var ri = l + (img.width || 40) * c.scale;
		var b  = t + (img.height || 64) * c.scale;
		if (l <= x && t <= y && ri >= x && b >= y) return c;
	}
	return false;
};

// ─────────────────────────────────────────────────────────────
//  RESTART
// ─────────────────────────────────────────────────────────────
SpidermanGame.prototype.restart = function() {
	this._loopGen = (this._loopGen || 0) + 1;

	// Apply level config
	if (this.levelConfig) {
		this.levelWorldLength = this.levelConfig.worldLength || Infinity;
	} else {
		this.levelWorldLength = Infinity;
	}
	this.worldProgress = 0;
	this.levelCompleted = false;
	this.bossDefeated = false;
	this.activeBoss = null;
	this.lastCheckpointX = 0;
	this.checkpointsPassed = [];
	this.hazards = [];
	this.windForce = 0;
	this.shakeAmount = 0;

	// Init hazards
	this.initHazards();

	// Spawn level-specific enemies from config
	var startEnemies = [];
	if (this.levelConfig && this.levelConfig.enemies) {
		startEnemies = this.levelConfig.enemies;
	}

	var roof = new Roof(this, 0);
	this.spiderman = new SpiderMan(this);
	this.scene.spiderman = this.spiderman;
	this.scene.projectiles = [];
	this.scene.roofs = [roof];
	this.scene.enemies = [];
	this.cameraX = 0;
	this.score = 0;

	// Spawn enemies from level data
	for (var i = 0; i < startEnemies.length; i++) {
		var ed = startEnemies[i];
		var enemy = createEnemyFromData(this, ed);
		if (enemy) this.addEnemy(enemy);
	}

	this.paused = false;
	this.gameIsOver = false;

	if (this.gameoverMenu) this.gameoverMenu.style.display = "none";
	if (this.pauseMenu)    this.pauseMenu.style.display    = "none";

	this._lastFrameTime = performance.now();
	this.update();
};

SpidermanGame.prototype.gameover = function() {
	if (!this.gameIsOver) {
		console.log("[Spiderweb] Game Over triggered");
		this.gameIsOver = true;
		window.dispatchEvent(new CustomEvent('SPIDERWORLD_GAMEOVER', { detail: { score: this.score } }));
	}
	if (!window.__swOverlayActive) this.showGameoverMenu();
};

// ─────────────────────────────────────────────────────────────
//  ENEMY FACTORY
// ─────────────────────────────────────────────────────────────
function createEnemyFromData(game, data) {
	var type = (data.type || 'thug').toLowerCase();
	var x = data.x || 500;
	var y = data.y || 300;
	var patrol = data.patrolRangeX || null;

	if (type === 'drone') {
		return new Drone(game, x, y, patrol);
	} else if (type === 'merc') {
		return new Merc(game, x, y);
	} else if (type === 'sniper') {
		return new Sniper(game, x, y);
	} else if (type === 'elite_merc') {
		return new EliteMerc(game, x, y);
	} else {
		return new Enemy(game, { x: x, y: y });
	}
}

// ─────────────────────────────────────────────────────────────
//  SPIDERMAN PLAYER
// ─────────────────────────────────────────────────────────────
function SpiderMan(game) {
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;
	this.name = "SPIDER_MAN";
	this.x = 0;
	this.y = 0;
	this.states = ["STANDING"];
	this.scale = 0.5;
	this.keydowns = [];

	// SpiderGirl modifiers (Plan 1, Epic 3)
	this.isSpiderGirl = !!game.isSpiderGirl;
	this.maxHealth = this.isSpiderGirl ? 80 : 100;
	this.health = this.maxHealth;

	this.web = 100;
	this.webState = { anchor: null, ropeLength: 0, theta: 0, angularVelocity: 0, attached: false };

	this.velocityX = 0;
	this.velocityY = 0;

	this.regenerationSpeed = 1200;
	this.frame = 0;

	this.runningFrames = ["RUNNING_RIGHT_STEP","RUNNING_CHANGE_STEP","RUNNING_LEFT_STEP","RUNNING_CHANGE_STEP"];
	this.runningShootingFrames = ["SHOOT_RIGHT-STEP","SHOOT_CHANGE_STEP","SHOOT_LEFT-STEP","SHOOT_CHANGE_STEP"];
	this.runningFrame = 0;

	this.gravityForce = 0.7;
	this.runningDirection = DIRECTION.RIGHT;
	var speedMult = (game && game.speedMultiplier) ? game.speedMultiplier : 1.0;
	this.runningSpeed = 5 * speedMult * (this.isSpiderGirl ? 1.2 : 1.0);

	this.shootingFrame = 0;
	this.wasDamagedOnPreviousFrame = false;
	this.invincibleFrames = 0;

	// SpiderGirl web-zip dash
	this.webZipCooldown = 0;
	this.webZipActive = 0;

	// Crumbling roof timer
	this.standingOnRoof = null;
	this.crumbleTimer = 0;

	// Game Feel / Juice timers
	this.coyoteTimer = 0;
	this.jumpBufferTimer = 0;
	this.landingSquash = 0;
}

SpiderMan.prototype.keyIsDown = function(kc) { return this.keydowns.indexOf(kc) > -1; };
SpiderMan.prototype.hasState  = function(s)  { return this.states.indexOf(s) > -1; };
SpiderMan.prototype.addState  = function(s)  { if (!this.hasState(s)) this.states.push(s); };
SpiderMan.prototype.removeState = function(s) {
	if (s instanceof Array) { for (var i=0;i<s.length;i++) this.removeState(s[i]); return; }
	if (this.hasState(s)) this.states.splice(this.states.indexOf(s), 1);
};
SpiderMan.prototype.hasStates = function(ss) {
	ss = ss.split(" ");
	for (var i=0;i<ss.length;i++) if (!this.hasState(ss[i])) return false;
	return true;
};

SpiderMan.prototype.takeDamage = function(amount) {
	this.health -= amount;
	this.wasDamagedOnPreviousFrame = true;
	this.invincibleFrames = 60;  // ~1 second invincibility
	window.dispatchEvent(new CustomEvent('SPIDERWORLD_PLAYERDAMAGED'));
};

SpiderMan.prototype.handleHitWithProjectile = function(p) {
	if (p.name !== "WEB") this.takeDamage(p.damage || 1);
};

SpiderMan.prototype.stateImage = function() {
	var state = "STANDING";
	if (this.hasState("JUMP")) {
		state = "JUMP";
		if (this.velocityY == 0) this.velocityY = -15;
	}
	if (this.velocityY >= 0) this.removeState("JUMP");
	if (this.hasState("RUNNING")) {
		state = this.runningFrames[this.runningFrame];
		if (this.hasState("SHOOT")) state = this.runningShootingFrames[this.runningFrame];
		if (this.frame % 10 === 0) {
			this.runningFrame++;
			this.runningFrame %= this.runningFrames.length - 1;
		}
		this.velocityX = this.runningDirection * this.runningSpeed;
	} else {
		if (!this.webState.attached) {
			if (this.hasState("FALL") || this.hasState("JUMP")) {
				this.velocityX *= 0.98; // Air drag instead of instant stop
			} else {
				this.velocityX = 0;
			}
		}
	}
	if (this.hasState("SHOOT")) {
		if (!this.hasState("RUNNING")) state = "SHOOT";
		if (this.shootingFrame % 20 === 0) {
			this.shoot(this.game.resources.SHOOT);
			sfxWebThwip();
		}
		this.shootingFrame++;
	}
	var img = this.game.resources[state] || this.game.resources["STANDING"];
	this.stateImg = img;
	return img;
};

SpiderMan.prototype.keydown = function(kc) { this.keydowns.push(kc); };
SpiderMan.prototype.keyup = function(kc) {
	this.runningFrame = 0;
	if (kc==KEY.ARROW_RIGHT||kc==KEY.ARROW_LEFT||kc==KEY.D||kc==KEY.A) this.removeState("RUNNING");
	if (kc==KEY.ARROW_UP||kc==KEY.W) {
		// Variable jump height
		if (this.velocityY < 0 && !this.webState.attached) {
			this.velocityY *= 0.5;
		}
	}
	if (kc==KEY.X) {
		this.removeState("SHOOT");
		this.shootingFrame = 0;
	}
	if (kc==KEY.SPACEBAR) {
		// Release web on spacebar up
		if (this.webState.attached) {
			this.webState.attached = false;
			this.addState("FALL");
			// Momentum conservation + snap boost
			this.velocityX *= 1.25;
			this.velocityY *= 1.15;
		}
	}
	while (this.keydowns.indexOf(kc) > -1) this.keydowns.splice(this.keydowns.indexOf(kc), 1);
};

SpiderMan.prototype.regenerate = function() {
	if (this.frame % this.regenerationSpeed === 0 && this.health < this.maxHealth) {
		this.health = Math.min(this.maxHealth, this.health + 1);
	}
};

SpiderMan.prototype.shoot = function(img) {
	if (this.web <= 0) return;
	var direction = this.runningDirection || 1;
	var web = new Projectile(this.game);
	web.name = "WEB";
	web.damage = 2;
	var w = img ? img.width * this.scale : 20;
	var h = img ? img.height * this.scale : 32;
	web.x = this.x + (direction > 0 ? w + 1 : -1);
	web.y = this.y + h / 2;
	var self = this;
	web.update = function() {
		var rx = this.x - this.game.cameraX;
		if (direction === DIRECTION.LEFT) rx -= 20;
		var webImg = this.game.resources["WEB_PROJECTILE"];
		if (webImg) this.ctx.drawImage(webImg, rx, this.y - 10, 20, 20);
		this.x += direction * 10;
		if (this.x - this.game.cameraX >= this.canvas.width || this.x <= 0) this.remove();
	};
	web.handleHitWithCharacter = function(c) { if (c.name !== "SPIDER_MAN") this.remove(); };
	this.game.addProjectile(web);
	if (this.game.soundEffects) this.game.playSound("SHOOT", true, 0);
	this.web--;
};

SpiderMan.prototype.update = function(dt) {
	dt = clampDt(dt || 1/60);

	// Invincibility countdown
	if (this.invincibleFrames > 0) this.invincibleFrames--;

	// Web-zip cooldown (SpiderGirl special)
	if (this.webZipCooldown > 0) this.webZipCooldown -= dt;
	if (this.webZipActive > 0) { this.webZipActive -= dt; }

	// Game feel timers
	if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
	if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
	if (this.landingSquash > 0) {
		this.landingSquash -= dt * 1.5;
		if (this.landingSquash < 0) this.landingSquash = 0;
	}

	// Key input
	if ((this.keyIsDown(KEY.ARROW_UP)||this.keyIsDown(KEY.W))) {
		if (!this.hasState("FALL") || this.coyoteTimer > 0) {
			this.addState("JUMP");
			this.coyoteTimer = 0;
		} else {
			// Jump buffering
			this.jumpBufferTimer = 0.15;
		}
	}
	if (this.keyIsDown(KEY.ARROW_RIGHT)||this.keyIsDown(KEY.D)) {
		this.addState("RUNNING"); this.runningDirection = DIRECTION.RIGHT;
	}
	if (this.keyIsDown(KEY.ARROW_LEFT)||this.keyIsDown(KEY.A)) {
		this.addState("RUNNING"); this.runningDirection = DIRECTION.LEFT;
	}
	if (this.keyIsDown(KEY.X)) {
		this.addState("SHOOT");
	}
	if (this.keyIsDown(KEY.SPACEBAR)) {
		// Attempt web attach when airborne
		if (!this.webState.attached && this.web > 0 && (this.hasState("FALL") || this.hasState("JUMP"))) {
			this._tryAttachWeb();
		}
	}

	// SpiderGirl web-zip dash (E key or Shift)
	if (this.isSpiderGirl && (this.keyIsDown(KEY.SHIFT)||this.keyIsDown(KEY.E)) && this.webZipCooldown <= 0) {
		this.velocityX = this.runningDirection * 14;
		this.velocityY = -6;
		this.webZipCooldown = 2.0;
		this.webZipActive = 0.15;
		sfxWebZip();
	}

	// Death check
	if (this.y >= this.canvas.height + 150 || this.health <= 0 || this.web <= 0) {
		this.game.gameover();
	}

	var img = this.stateImage();

	// Physics
	if (this.webState.attached) {
		this._updatePendulum(dt);
	} else {
		this.velocityY += this.gravityForce;
		this.velocityY = Math.min(this.velocityY, 23);  // terminal velocity (frame-based)
		this.y += this.velocityY;
		this.x += this.velocityX;
	}

	// Camera
	if (this.x - this.game.cameraX < 0) this.x = this.game.cameraX;
	if (this.x - this.game.cameraX > 150) this.game.cameraX += this.velocityX;

	// Roof collision
	var imgW = img ? img.width * this.scale : 20;
	var imgH = img ? img.height * this.scale : 32;
	var roofL = this.game.isRoofAtPoint(this.x - this.velocityX, this.y + imgH + 1);
	var roofR = this.game.isRoofAtPoint(this.x + imgW - this.velocityX, this.y + imgH + 1);

	if (roofL || roofR) {
		var roof = roofL || roofR;
		if (roof.y + this.velocityY <= this.y) {
			// Hit a wall while in air — wall kick if W/Up pressed
			if ((this.keyIsDown(KEY.ARROW_UP)||this.keyIsDown(KEY.W)) && this.hasState("FALL")) {
				var kickDir = (this.runningDirection === DIRECTION.LEFT) ? 1 : -1;
				this.velocityX = kickDir * 8;
				this.velocityY = -14;
				this.runningDirection = kickDir;
				this.addState("FALL");
				this.webState.attached = false;
			} else {
				this.x -= this.velocityX;
				this.velocityX = 0;
			}
		} else {
			// Landing squash
			if (this.velocityY > 12) {
				this.landingSquash = 0.3;
				sfxLand();
			}
			this.y = this.canvas.height - roof.height - imgH;
			this.velocityY = 0;
			this.removeState("FALL");
			this.coyoteTimer = 0.1;  // 6 frames of coyote time on ground
			// Jump buffer execution
			if (this.jumpBufferTimer > 0) {
				this.addState("JUMP");
				this.jumpBufferTimer = 0;
				this.coyoteTimer = 0;
			}

			this.webState.attached = false;
			// Crumbling roof logic
			if (roof.crumbling && !roof.crumbled) {
				this.crumbleTimer += dt;
				if (this.crumbleTimer > 1.5) {
					roof.startCrumble();
					this.crumbleTimer = 0;
				}
			} else {
				this.crumbleTimer = 0;
			}
		}
	} else if (!this.webState.attached) {
		if (this.velocityY > 0) this.addState("FALL");
	}

	var drawX = this.x - this.game.cameraX;

	// Draw web rope
	if (this.webState.attached && this.webState.anchor) {
		var ax = this.webState.anchor.x - this.game.cameraX;
		var ay = this.webState.anchor.y;
		var pcx = drawX + imgW/2;
		var pcy = this.y + imgH*0.2;
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(pcx, pcy);
		this.ctx.lineTo(ax, ay);
		this.ctx.strokeStyle = 'rgba(200,230,255,0.85)';
		this.ctx.lineWidth = 2;
		this.ctx.setLineDash([6,3]);
		this.ctx.stroke();
		this.ctx.setLineDash([]);
		this.ctx.beginPath();
		this.ctx.arc(ax, ay, 5, 0, Math.PI*2);
		this.ctx.fillStyle = '#00F2FE';
		this.ctx.fill();
		this.ctx.strokeStyle = 'white'; this.ctx.lineWidth = 1.5;
		this.ctx.stroke();
		this.ctx.restore();
	}

	// Web-zip trail (SpiderGirl)
	if (this.webZipActive > 0) {
		this.ctx.save();
		this.ctx.fillStyle = 'rgba(255,61,138,' + (this.webZipActive*4) + ')';
		this.ctx.fillRect(drawX - 10, this.y, imgW + 20, imgH);
		this.ctx.restore();
	}

	// Draw sprite
	this.ctx.save();
	this.drawCharacterSprite(this.ctx, drawX, this.y, imgW, imgH, img);
	this.ctx.restore();

	// Damage flash
	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(255,0,0,0.25)";
		this.ctx.fillRect(drawX, this.y, imgW, imgH);
	}

	// Invincibility blink
	if (this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 6) % 2 === 0) {
		this.ctx.fillStyle = "rgba(255,255,255,0.15)";
		this.ctx.fillRect(drawX, this.y, imgW, imgH);
	}

	this.regenerate();
	this.drawHealthbar();
	this.drawWebbar();
	this.frame++;
};

SpiderMan.prototype._tryAttachWeb = function() {
	var anchors = [];
	var roofs = this.game.scene.roofs;
	for (var i = 0; i < roofs.length; i++) {
		var r = roofs[i];
		anchors.push({ x: r.x,              y: r.y });
		anchors.push({ x: r.x + r.fullWidth/2, y: r.y });
		anchors.push({ x: r.x + r.fullWidth,   y: r.y });
	}
	// Also add building corners from hazards (cranes etc.)

	var dir = this.runningDirection || 1;
	var vxPxS = this.velocityX * 60, vyPxS = this.velocityY * 60;
	var best = findBestAnchor(this.x, this.y, vxPxS, vyPxS, anchors);
	if (best) {
		this.webState.attached = true;
		this.webState.anchor = best;
		var dx = this.x - best.x, dy = this.y - best.y;
		var rope = Math.max(PHYSICS.ropeLengthMin, Math.sqrt(dx*dx+dy*dy));
		rope = Math.min(rope, PHYSICS.ropeLengthMax);
		this.webState.ropeLength = rope;
		this.webState.theta = Math.atan2(dx, dy);
		var vt = vxPxS * Math.cos(this.webState.theta) - vyPxS * Math.sin(this.webState.theta);
		this.webState.angularVelocity = vt / rope;
		this.web--;
	} else {
		// Open sky web fail
		sfxWebFail();
	}
};

SpiderMan.prototype._updatePendulum = function(dt) {
	var g = PHYSICS.gravityAccel;
	var ws = this.webState;
	var swingMult = this.game.swingSpeedMult || (this.isSpiderGirl ? 1.2 : 1.0);
	var pump = 0;
	if (this.keyIsDown(KEY.ARROW_RIGHT)||this.keyIsDown(KEY.D)) pump =  1;
	if (this.keyIsDown(KEY.ARROW_LEFT) ||this.keyIsDown(KEY.A)) pump = -1;

	var angularAccel = -(g / ws.ropeLength) * Math.sin(ws.theta);
	angularAccel += pump * PHYSICS.pumpTorque * swingMult;
	// Apply wind
	if (this.game.hasWind && this.game.windForce) {
		angularAccel += this.game.windForce;
	}
	ws.angularVelocity += angularAccel * dt;
	ws.angularVelocity *= Math.pow(PHYSICS.angularDamping, dt * 60);
	ws.angularVelocity = Math.max(-PHYSICS.maxAngularVelocity * swingMult,
		Math.min(PHYSICS.maxAngularVelocity * swingMult, ws.angularVelocity));
	ws.theta += ws.angularVelocity * dt;

	this.x = ws.anchor.x + ws.ropeLength * Math.sin(ws.theta);
	this.y = ws.anchor.y + ws.ropeLength * Math.cos(ws.theta);

	// Convert to frame-based velocity for collision/strike checks
	var vxSI = ws.ropeLength * Math.cos(ws.theta) * ws.angularVelocity;
	var vySI = -ws.ropeLength * Math.sin(ws.theta) * ws.angularVelocity;
	this.velocityX = vxSI / 60;
	this.velocityY = vySI / 60;

	// Web Reel-in: Shorten rope to gain height/momentum
	if (this.keyIsDown(KEY.ARROW_UP)||this.keyIsDown(KEY.W)) {
		ws.ropeLength = Math.max(PHYSICS.ropeLengthMin, ws.ropeLength - 120 * dt);
	}
	if (this.keyIsDown(KEY.ARROW_DOWN)||this.keyIsDown(KEY.S)) {
		ws.ropeLength = Math.min(PHYSICS.ropeLengthMax, ws.ropeLength + 120 * dt);
	}
};

SpiderMan.prototype.drawHealthbar = function() {
	var hpPct = Math.max(0, this.health / this.maxHealth);
	var barW = 160, barH = 14;
	var x = 16, y = 16;
	this.ctx.fillStyle = "rgba(0,0,0,0.5)";
	this.ctx.fillRect(x, y, barW, barH);
	var fillColor = this.isSpiderGirl ? '#FF3D8A' : '#00F2FE';
	this.ctx.fillStyle = fillColor;
	this.ctx.fillRect(x, y, barW * hpPct, barH);
	this.ctx.strokeStyle = this.isSpiderGirl ? '#FF3D8A' : '#00F2FE';
	this.ctx.lineWidth = 2;
	this.ctx.strokeRect(x, y, barW, barH);
	this.ctx.fillStyle = "#fff";
	this.ctx.font = "bold 10px monospace";
	this.ctx.textAlign = "left";
	this.ctx.textBaseline = "top";
	this.ctx.fillText((this.isSpiderGirl ? 'SPIDERGIRL' : 'JAX') + ' HP: ' + Math.round(this.health), x + 4, y + 1);
};

SpiderMan.prototype.drawWebbar = function() {
	var img = this.game.resources.WEB_PROJECTILE;
	var str = "WEB: " + this.web;
	this.ctx.fillStyle = "white";
	this.ctx.font = "12px SpidermanGamePixelFont, Monospace, Arial";
	this.ctx.textAlign = "right";
	this.ctx.textBaseline = "top";
	this.ctx.fillText(str, this.canvas.width - 16, 16);
};

SpiderMan.prototype.drawCharacterSprite = function(ctx, x, y, w, h, img) {
	// Landing squash scale
	var sqX = 1.0 + this.landingSquash;
	var sqY = 1.0 - this.landingSquash * 0.5;

	ctx.save();
	ctx.translate(x + w/2, y + h);
	ctx.scale(sqX, sqY);
	
	// Use sprite image if valid
	if (img && img.complete && img.naturalWidth > 0 && img.naturalWidth !== 32) {
		ctx.drawImage(img, -w/2, -h, w, h);
		ctx.restore();
		return;
	}
	// Procedural draw
	var isFacingLeft = (this.runningDirection === DIRECTION.LEFT);
	var state = "STANDING";
	if (this.velocityY > 2) state = "FALLING";
	else if (this.velocityY < -2) state = "JUMPING";
	else if (this.hasState("RUNNING")) state = "RUNNING";
	else if (this.hasState("SHOOT")) state = "SHOOTING";

	var cW = 40, cH = 64;
	var pX = -cW/2;
	var pY = -cH;

	// SpiderGirl color scheme
	var primary = this.isSpiderGirl ? '#FF3D8A' : '#0B192C';
	var accent  = this.isSpiderGirl ? '#F5F5F5' : '#00F2FE';
	var torso   = this.isSpiderGirl ? '#C42060' : '#162A45';

	if (isFacingLeft) { ctx.scale(-1,1); }

	// Shadow
	ctx.fillStyle = "rgba(0,0,0,0.35)";
	ctx.beginPath();
	ctx.ellipse(pX+cW/2, pY+cH, cW/2, 6, 0, 0, Math.PI*2);
	ctx.fill();

	// Legs
	ctx.fillStyle = primary; ctx.strokeStyle = "#030712"; ctx.lineWidth = 1.5;
	if (state === "RUNNING") {
		var lo = (this.frame % 10 < 5) ? 4 : -4;
		ctx.fillRect(pX+10+lo, pY+36, 8, 24); ctx.strokeRect(pX+10+lo, pY+36, 8, 24);
		ctx.fillRect(pX+22-lo, pY+36, 8, 24); ctx.strokeRect(pX+22-lo, pY+36, 8, 24);
	} else if (state === "JUMPING" || state === "FALLING") {
		ctx.fillRect(pX+6,  pY+34, 11, 18); ctx.strokeRect(pX+6,  pY+34, 11, 18);
		ctx.fillRect(pX+23, pY+34, 11, 18); ctx.strokeRect(pX+23, pY+34, 11, 18);
	} else {
		ctx.fillRect(pX+10, pY+36, 9, 26); ctx.strokeRect(pX+10, pY+36, 9, 26);
		ctx.fillRect(pX+21, pY+36, 9, 26); ctx.strokeRect(pX+21, pY+36, 9, 26);
	}
	// Boots
	ctx.fillStyle = accent;
	ctx.fillRect(pX+10, pY+54, 9, 8); ctx.fillRect(pX+21, pY+54, 9, 8);
	// Torso
	ctx.fillStyle = torso;
	ctx.fillRect(pX+8, pY+16, 24, 22); ctx.strokeRect(pX+8, pY+16, 24, 22);
	// Chest emblem
	ctx.fillStyle = accent;
	ctx.beginPath();
	ctx.moveTo(pX+20,pY+18); ctx.lineTo(pX+26,pY+24);
	ctx.lineTo(pX+20,pY+30); ctx.lineTo(pX+14,pY+24);
	ctx.closePath(); ctx.fill();
	ctx.fillRect(pX+8, pY+34, 24, 3); // belt
	// Arms
	ctx.fillStyle = primary;
	if (state === "SHOOTING") {
		ctx.fillRect(pX+28,pY+18,14,8); ctx.strokeRect(pX+28,pY+18,14,8);
		ctx.fillStyle = accent; ctx.fillRect(pX+38,pY+18,4,8);
	} else {
		ctx.fillRect(pX+2, pY+18, 7, 18); ctx.strokeRect(pX+2, pY+18, 7, 18);
		ctx.fillRect(pX+31,pY+18, 7, 18); ctx.strokeRect(pX+31,pY+18, 7, 18);
	}
	// Head
	ctx.fillStyle = primary;
	ctx.beginPath(); ctx.arc(pX+20, pY+10, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
	// Eyes
	ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = accent; ctx.lineWidth = 1;
	ctx.beginPath(); ctx.ellipse(pX+15,pY+9, 4,3, Math.PI/6,  0, Math.PI*2); ctx.fill(); ctx.stroke();
	ctx.beginPath(); ctx.ellipse(pX+25,pY+9, 4,3,-Math.PI/6, 0, Math.PI*2); ctx.fill(); ctx.stroke();

	ctx.restore();
};

// ─────────────────────────────────────────────────────────────
//  PROJECTILE
// ─────────────────────────────────────────────────────────────
function Projectile(game) {
	this.x = 0; this.y = 0; this.damage = 0; this.name = "UNKNOWN";
	this.canvas = game.canvas; this.ctx = game.ctx; this.game = game;
}
Projectile.prototype.update = function(dt) {};
Projectile.prototype.remove = function() { this.game.removeProjectile(this); };
Projectile.prototype.handleHitWithCharacter = function() { this.remove(); };

// ─────────────────────────────────────────────────────────────
//  ROOF
// ─────────────────────────────────────────────────────────────
function Roof(game, x) {
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;

	var cfg = game.levelConfig;
	var minH = (cfg && cfg.buildingHeightRange) ? cfg.buildingHeightRange[0] : 100;
	var maxH = (cfg && cfg.buildingHeightRange) ? cfg.buildingHeightRange[1] : 150;
	var hRange = maxH - minH;

	var maxBW = (game.resources.BUILDING && game.resources.BUILDING.width) || 600;
	this.width = Math.round(Math.random()*(maxBW-200)) + 200;
	this.height = Math.round(Math.random()*hRange) + minH;
	this.fullWidth = this.width + 15;
	this.x = x || 0;
	this.y = this.canvas.height - this.height;

	// Crumbling roof flag (hazard driven)
	this.crumbling = !!(game.hasCrumblingRoofs && Math.random() < 0.35);
	this.crumbled  = false;
	this.crumblePhase = 0;  // 0=solid, 1=shaking, 2=gone

	// 70% chance random enemy spawn (on top of level-data enemies)
	var shouldSpawn = Math.round(Math.random()*100) >= 30;
	if (shouldSpawn && game.resources.THUG) {
		var e = new Enemy(game, { x: this.x + this.width/2 });
		var si = game.resources.THUG;
		e.y = this.y - 1 - si.height * e.scale;
		game.addEnemy(e);
		this.enemy = e;
	}
}

Roof.prototype.startCrumble = function() {
	if (this.crumbled) return;
	this.crumbling = true;
	this.crumblePhase = 1;
	var self = this;
	setTimeout(function() { self.crumblePhase = 2; self.crumbled = true; }, 800);
};

Roof.prototype.update = function(dt) {
	var renderX = this.x - this.game.cameraX;
	var roof = this.game.resources.BUILDING;
	if (!roof) return;

	// Crumble shake
	var offX = 0, offY = 0;
	if (this.crumblePhase === 1) {
		offX = (Math.random()-0.5)*6;
		offY = (Math.random()-0.5)*4;
		this.ctx.globalAlpha = 0.7;
	} else if (this.crumblePhase === 2) {
		this.ctx.globalAlpha = 0; // fully gone
	}

	this.ctx.drawImage(roof, 0, 0, this.width, this.height, renderX+offX, this.y+offY, this.width, this.height);
	this.ctx.drawImage(roof, this.width, 0, 15, 26, renderX+offX+this.width, this.y+offY, 15, 26);
	this.ctx.globalAlpha = 1;

	if (renderX + this.width <= 0) {
		this.game.removeRoof(this);
		if (this.enemy) this.game.removeEnemy(this.enemy);
	}
};

// ─────────────────────────────────────────────────────────────
//  ENEMY — Base class
// ─────────────────────────────────────────────────────────────
function Enemy(game, opts) {
	opts = opts || {};
	this.game = game; this.canvas = game.canvas; this.ctx = game.ctx;
	this.health = opts.health || 4;
	this.maxHealth = opts.maxHealth || this.health;
	this.name = opts.name || "THUG";
	this.x = opts.x || this.canvas.width - 50;
	this.y = opts.y || 0;
	this.scale = 0.5;
	this.stateImg = this.game.resources[this.name] || this.game.resources["THUG"];
	this.w = this.stateImg ? this.stateImg.width * this.scale : 40;
	this.h = this.stateImg ? this.stateImg.height * this.scale : 64;
	this.wasDamagedOnPreviousFrame = false;
	this.frame = 0;
	this.aggro = false;
}

Enemy.prototype.takeDamage = function(amount) {
	this.health -= amount;
	this.wasDamagedOnPreviousFrame = true;
	if (this.health <= 0) { this.remove(); }
};
Enemy.prototype.shoot = function() {
	var self = this;
	var knife = this.game.resources.KNIFE;
	if (!knife) return;
	var p = new Projectile(this.game);
	p.name = "KNIFE"; p.damage = 1;
	p.x = this.x - knife.width * this.scale / 2;
	p.y = this.y + (this.stateImg ? this.stateImg.height * this.scale / 2 : 32);
	var speedMult = this.game.speedMultiplier || 1.0;
	p.update = function() {
		if (knife) this.ctx.drawImage(knife, this.x - this.game.cameraX, this.y, knife.width*self.scale/2, knife.height*self.scale/2);
		this.x -= 10 * speedMult;
		if (this.x < this.game.cameraX - 200) this.remove();
	};
	this.game.addProjectile(p);
};
Enemy.prototype.drawHealthbar = function() {
	if (this.health >= this.maxHealth) return; // don't show full bar
	var bw = 60, bh = 5;
	var bx = this.x - this.game.cameraX - bw/2 + this.w/2;
	var by = this.y - 12;
	this.ctx.fillStyle = "#333"; this.ctx.fillRect(bx, by, bw, bh);
	this.ctx.fillStyle = "#FF3D8A";
	this.ctx.fillRect(bx, by, bw * Math.max(0, this.health/this.maxHealth), bh);
};
Enemy.prototype.update = function(dt) {
	dt = clampDt(dt || 1/60);
	var img = this.game.resources[this.name] || this.game.resources["THUG"];
	this.stateImg = img;
	if (!img) return;
	if (this.health <= 0) { this.remove(); return; }
	this.drawHealthbar();
	var x = this.x - this.game.cameraX;
	var width = img.width * this.scale, height = img.height * this.scale;
	this.w = width; this.h = height;
	this.ctx.save();
	this.ctx.scale(-1,1);
	this.ctx.drawImage(img, -(x+width), this.y, width, height);
	this.ctx.restore();
	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(255,0,0,0.2)";
		this.ctx.fillRect(x, this.y, width, height);
	}
	var isInScreen = (x >= -100 && x <= this.canvas.width + 100);
	if (this.frame % 100 === 0 && isInScreen) this.shoot();
	this.frame++;
};
Enemy.prototype.remove = function() {
	this.game.score++;
	if (this.game.spiderman) this.game.spiderman.web += 2;
	this.game.removeEnemy(this);
};
Enemy.prototype.handleHitWithProjectile = function(p) {
	if (p.name === "WEB") { this.health -= p.damage; this.wasDamagedOnPreviousFrame = true; }
};

// ─────────────────────────────────────────────────────────────
//  DRONE — Patrols air lane, fires slow shots
// ─────────────────────────────────────────────────────────────
function Drone(game, x, y, patrol) {
	this.game = game; this.canvas = game.canvas; this.ctx = game.ctx;
	this.name = "DRONE";
	this.x = x || 500; this.y = y || 200;
	this.health = 1; this.maxHealth = 1;
	this.w = 36; this.h = 20;
	this.scale = 1.0;
	this.stateImg = game.resources["THUG"] || null;  // placeholder
	this.patrolMin = patrol ? patrol[0] : this.x - 200;
	this.patrolMax = patrol ? patrol[1] : this.x + 200;
	this.dirX = 1;
	this.speed = 60;  // px/s
	this.shootTimer = 2 + Math.random()*2;
	this.frame = 0;
	this.wasDamagedOnPreviousFrame = false;
	this.aggro = false;
}

Drone.prototype.takeDamage = Enemy.prototype.takeDamage;
Drone.prototype.remove = Enemy.prototype.remove;
Drone.prototype.handleHitWithProjectile = Enemy.prototype.handleHitWithProjectile;
Drone.prototype.drawHealthbar = function() {};  // 1-hit; no bar needed

Drone.prototype.update = function(dt) {
	dt = clampDt(dt || 1/60);
	if (this.health <= 0) { this.remove(); return; }

	// Patrol
	this.x += this.dirX * this.speed * dt;
	if (this.x > this.patrolMax) { this.x = this.patrolMax; this.dirX = -1; }
	if (this.x < this.patrolMin) { this.x = this.patrolMin; this.dirX =  1; }

	// Shoot timer
	this.shootTimer -= dt;
	if (this.shootTimer <= 0) {
		this.shootDrone();
		this.shootTimer = 2 + Math.random()*2;
	}

	var drawX = this.x - this.game.cameraX;
	if (drawX < -100 || drawX > this.canvas.width + 100) { this.frame++; return; }

	var ctx = this.ctx;
	ctx.save();
	// Draw drone body
	ctx.fillStyle = '#444';
	ctx.fillRect(drawX, this.y, this.w, this.h);
	ctx.fillStyle = '#E53';
	ctx.beginPath();
	ctx.arc(drawX + this.w/2, this.y + this.h/2, 5, 0, Math.PI*2);
	ctx.fill();
	// Propellers
	ctx.fillStyle = '#888';
	ctx.fillRect(drawX - 10, this.y + 2, 10, 4);
	ctx.fillRect(drawX + this.w, this.y + 2, 10, 4);
	// Telegraph flash before shooting
	if (this.shootTimer < 0.5) {
		ctx.fillStyle = 'rgba(255,80,0,0.4)';
		ctx.beginPath();
		ctx.arc(drawX + this.w/2, this.y - 10, 8, 0, Math.PI*2);
		ctx.fill();
	}
	ctx.restore();

	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		ctx.fillStyle = 'rgba(255,0,0,0.3)';
		ctx.fillRect(drawX, this.y, this.w, this.h);
	}
	this.frame++;
};

Drone.prototype.shootDrone = function() {
	var self = this;
	var p = new Projectile(this.game);
	p.name = "DRONE_SHOT"; p.damage = 10;
	p.x = this.x; p.y = this.y + this.h/2;
	var target = this.game.spiderman;
	var vx = target ? (target.x - this.x) * 0.3 : -60;
	var vy = target ? (target.y - this.y) * 0.3 : 0;
	var spd = Math.sqrt(vx*vx+vy*vy) || 1;
	var nx = vx/spd * 120, ny = vy/spd * 120;
	p.update = function() {
		var rx = this.x - this.game.cameraX;
		this.ctx.fillStyle = '#FF8C00';
		this.ctx.beginPath();
		this.ctx.arc(rx, this.y, 6, 0, Math.PI*2);
		this.ctx.fill();
		this.x += nx * (1/60);
		this.y += ny * (1/60);
		if (this.x < this.game.cameraX-200 || this.x > this.game.cameraX+1480) this.remove();
	};
	p.handleHitWithCharacter = function(c) {
		if (c.name !== "SPIDER_MAN") return;
		this.remove();
	};
	this.game.addProjectile(p);
};

// ─────────────────────────────────────────────────────────────
//  MERC — Stands on roof, melee on contact
// ─────────────────────────────────────────────────────────────
function Merc(game, x, y) {
	this.game = game; this.canvas = game.canvas; this.ctx = game.ctx;
	this.name = "MERC";
	this.x = x || 500; this.y = y || 300;
	this.health = 1; this.maxHealth = 1;
	this.w = 30; this.h = 56;
	this.scale = 1.0;
	this.stateImg = game.resources["THUG"] || null;
	this.frame = 0;
	this.wasDamagedOnPreviousFrame = false;
	this.aggro = false;
}
Merc.prototype.takeDamage = Enemy.prototype.takeDamage;
Merc.prototype.remove = Enemy.prototype.remove;
Merc.prototype.handleHitWithProjectile = Enemy.prototype.handleHitWithProjectile;
Merc.prototype.drawHealthbar = function() {};

Merc.prototype.update = function(dt) {
	dt = clampDt(dt || 1/60);
	if (this.health <= 0) { this.remove(); return; }
	var drawX = this.x - this.game.cameraX;
	if (drawX < -100 || drawX > this.canvas.width + 100) { this.frame++; return; }
	var ctx = this.ctx;
	ctx.save();
	// Draw merc procedurally
	var pX = drawX, pY = this.y;
	// Body
	ctx.fillStyle = '#2D3748'; ctx.fillRect(pX+5, pY+16, 20, 28);
	// Head
	ctx.fillStyle = '#C68642'; ctx.beginPath(); ctx.arc(pX+15, pY+10, 9, 0, Math.PI*2); ctx.fill();
	// Legs
	ctx.fillStyle = '#2D3748';
	var legSwing = Math.sin(this.frame * 0.08) * (this.aggro ? 4 : 0);
	ctx.fillRect(pX+6,  pY+44, 7, 12 + legSwing);
	ctx.fillRect(pX+17, pY+44, 7, 12 - legSwing);
	// Weapon
	ctx.fillStyle = '#888'; ctx.fillRect(pX+22, pY+22, 12, 5);
	// Alert indicator if aggroed
	if (this.aggro) {
		ctx.fillStyle = 'rgba(255,50,50,0.85)';
		ctx.font = 'bold 12px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('!', pX+15, pY-4);
	}
	ctx.restore();
	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		ctx.fillStyle = 'rgba(255,0,0,0.3)';
		ctx.fillRect(drawX, this.y, this.w, this.h);
	}
	this.frame++;
};

// ─────────────────────────────────────────────────────────────
//  SNIPER MERC — Stationary, laser-line telegraph, precise shot
// ─────────────────────────────────────────────────────────────
function Sniper(game, x, y) {
	this.game = game; this.canvas = game.canvas; this.ctx = game.ctx;
	this.name = "SNIPER";
	this.x = x || 600; this.y = y || 280;
	this.health = 1; this.maxHealth = 1;
	this.w = 30; this.h = 56;
	this.scale = 1.0;
	this.stateImg = game.resources["THUG"] || null;
	this.frame = 0;
	this.wasDamagedOnPreviousFrame = false;
	this.shootTimer = 3 + Math.random()*2;
	this.telegraphTimer = 0;
	this.isTelegraphing = false;
	this.aggro = false;
}
Sniper.prototype.takeDamage = Enemy.prototype.takeDamage;
Sniper.prototype.remove = Enemy.prototype.remove;
Sniper.prototype.handleHitWithProjectile = Enemy.prototype.handleHitWithProjectile;
Sniper.prototype.drawHealthbar = function() {};

Sniper.prototype.update = function(dt) {
	dt = clampDt(dt || 1/60);
	if (this.health <= 0) { this.remove(); return; }
	var drawX = this.x - this.game.cameraX;
	if (drawX < -200 || drawX > this.canvas.width + 200) { this.frame++; return; }

	var spider = this.game.spiderman;
	this.shootTimer -= dt;
	if (!this.isTelegraphing && this.shootTimer <= 0.8) {
		this.isTelegraphing = true;
		sfxBossTelegraph();
	}
	if (this.shootTimer <= 0) {
		this.fireSniper(spider);
		this.shootTimer = 3 + Math.random()*2;
		this.isTelegraphing = false;
	}

	var ctx = this.ctx;
	ctx.save();
	// Body
	ctx.fillStyle = '#1A2A1A'; ctx.fillRect(drawX+5, this.y+16, 20, 28);
	// Head with helmet
	ctx.fillStyle = '#2D4A2D'; ctx.beginPath(); ctx.arc(drawX+15, this.y+10, 10, 0, Math.PI*2); ctx.fill();
	// Visor
	ctx.fillStyle = 'rgba(0,200,80,0.7)'; ctx.fillRect(drawX+7, this.y+6, 16, 6);
	// Sniper rifle
	ctx.fillStyle = '#555'; ctx.fillRect(drawX+20, this.y+20, 22, 4);
	ctx.fillStyle = '#333'; ctx.fillRect(drawX+38, this.y+19, 4, 6);
	// Legs
	ctx.fillStyle = '#1A2A1A';
	ctx.fillRect(drawX+6, this.y+44, 7, 14);
	ctx.fillRect(drawX+17, this.y+44, 7, 14);

	// Telegraph laser line
	if (this.isTelegraphing && spider) {
		var alpha = 0.5 + Math.sin(this.frame * 0.3) * 0.3;
		ctx.beginPath();
		ctx.moveTo(drawX+38, this.y+22);
		ctx.lineTo(spider.x - this.game.cameraX + 15, spider.y + 30);
		ctx.strokeStyle = 'rgba(255,50,50,' + alpha + ')';
		ctx.lineWidth = 1.5;
		ctx.setLineDash([4,4]);
		ctx.stroke();
		ctx.setLineDash([]);
		// Dot on target
		ctx.fillStyle = 'rgba(255,0,0,' + alpha + ')';
		ctx.beginPath();
		ctx.arc(spider.x - this.game.cameraX + 15, spider.y + 30, 4, 0, Math.PI*2);
		ctx.fill();
	}
	ctx.restore();
	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		ctx.fillStyle = 'rgba(255,0,0,0.3)';
		ctx.fillRect(drawX, this.y, this.w, this.h);
	}
	this.frame++;
};

Sniper.prototype.fireSniper = function(spider) {
	if (!spider) return;
	var p = new Projectile(this.game);
	p.name = "SNIPER_SHOT"; p.damage = 20;
	p.x = this.x + 30; p.y = this.y + 22;
	var tx = spider.x + 15, ty = spider.y + 30;
	var dx = tx - p.x, dy = ty - p.y;
	var spd = Math.sqrt(dx*dx+dy*dy) || 1;
	var nx = dx/spd * 500, ny = dy/spd * 500;
	p.update = function() {
		var rx = this.x - this.game.cameraX;
		this.ctx.fillStyle = '#FFD700';
		this.ctx.fillRect(rx-3, this.y-1, 10, 3);
		this.x += nx * (1/60);
		this.y += ny * (1/60);
		if (this.x < this.game.cameraX-200 || this.x > this.game.cameraX+1480 ||
			this.y < -100 || this.y > this.canvas.height+100) this.remove();
	};
	p.handleHitWithCharacter = function(c) { if (c.name !== "SPIDER_MAN") return; this.remove(); };
	this.game.addProjectile(p);
};

// ─────────────────────────────────────────────────────────────
//  ELITE MERC — 2 hits to kill, short aggro dash
// ─────────────────────────────────────────────────────────────
function EliteMerc(game, x, y) {
	this.game = game; this.canvas = game.canvas; this.ctx = game.ctx;
	this.name = "ELITE_MERC";
	this.x = x || 600; this.y = y || 300;
	this.health = 2; this.maxHealth = 2;
	this.w = 36; this.h = 64;
	this.scale = 1.0;
	this.stateImg = game.resources["VENOM"] || game.resources["THUG"] || null;
	this.frame = 0;
	this.wasDamagedOnPreviousFrame = false;
	this.dashTimer = 0;
	this.dashVx = 0;
	this.aggroDist = 300;
	this.aggro = false;
	this.telegraphTimer = 0;
}
EliteMerc.prototype.takeDamage = function(amount) {
	this.health -= amount;
	this.wasDamagedOnPreviousFrame = true;
	if (this.health <= 0) this.remove();
};
EliteMerc.prototype.remove = Enemy.prototype.remove;
EliteMerc.prototype.handleHitWithProjectile = Enemy.prototype.handleHitWithProjectile;
EliteMerc.prototype.drawHealthbar = function() {
	var bw = 40, bh = 4;
	var bx = this.x - this.game.cameraX - bw/2 + this.w/2;
	var by = this.y - 10;
	this.ctx.fillStyle = "#222"; this.ctx.fillRect(bx, by, bw, bh);
	this.ctx.fillStyle = "#FF3D8A";
	this.ctx.fillRect(bx, by, bw * Math.max(0,this.health/this.maxHealth), bh);
	// Segmented: two segments
	this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 1;
	this.ctx.strokeRect(bx + bw/2, by, 1, bh);
};

EliteMerc.prototype.update = function(dt) {
	dt = clampDt(dt || 1/60);
	if (this.health <= 0) { this.remove(); return; }
	var drawX = this.x - this.game.cameraX;
	if (drawX < -150 || drawX > this.canvas.width + 150) { this.frame++; return; }

	var spider = this.game.spiderman;
	// Aggro check
	if (spider && Math.abs(spider.x - this.x) < this.aggroDist) {
		this.aggro = true;
	}
	// Dash toward player when aggroed
	if (this.aggro && spider) {
		if (this.dashTimer <= 0 && Math.abs(spider.x - this.x) > 60) {
			// Telegraph for 0.4s, then dash
			this.telegraphTimer = 0.4;
			this.dashTimer = this.telegraphTimer + 0.4;
			this.dashVx = Math.sign(spider.x - this.x) * 220;
		}
		if (this.dashTimer > 0) {
			this.dashTimer -= dt;
			if (this.telegraphTimer > 0) {
				this.telegraphTimer -= dt;
			} else {
				this.x += this.dashVx * dt;
			}
			if (this.dashTimer <= 0) { this.dashVx = 0; }
		}
	}

	var ctx = this.ctx;
	ctx.save();
	// Elite Merc — heavier, darker armor
	var pX = drawX, pY = this.y;
	ctx.fillStyle = '#4A1A1A'; ctx.fillRect(pX+4, pY+14, 28, 32); // body
	ctx.fillStyle = '#8B1A1A'; ctx.fillRect(pX+4, pY+14, 28, 8);  // shoulder pad
	ctx.fillStyle = '#C68642'; ctx.beginPath(); ctx.arc(pX+18, pY+9, 10, 0, Math.PI*2); ctx.fill(); // head
	ctx.fillStyle = '#333';    ctx.fillRect(pX+8, pY+5, 20, 7); // helmet visor
	ctx.fillStyle = '#4A1A1A';
	ctx.fillRect(pX+7,  pY+46, 9, 16);
	ctx.fillRect(pX+20, pY+46, 9, 16);
	ctx.fillStyle = '#C00';    ctx.fillRect(pX+3, pY+20, 5, 18); // arm armor
	ctx.fillRect(pX+28, pY+20, 5, 18);
	// Telegraph glow
	if (this.telegraphTimer > 0) {
		ctx.fillStyle = 'rgba(255,0,0,0.4)';
		ctx.beginPath(); ctx.arc(pX+18, pY-8, 10, 0, Math.PI*2); ctx.fill();
	}
	// HP indicator badge
	if (this.health === 1) {
		ctx.fillStyle = 'rgba(255,150,0,0.8)';
		ctx.font = '10px monospace'; ctx.textAlign = 'center';
		ctx.fillText('★', pX+18, pY+5);
	}
	ctx.restore();
	this.drawHealthbar();
	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		ctx.fillStyle = 'rgba(255,0,0,0.3)';
		ctx.fillRect(drawX, this.y, this.w, this.h);
	}
	this.frame++;
};

// ─────────────────────────────────────────────────────────────
//  BOSS ENTITY (inline, full AI for all 3 bosses)
// ─────────────────────────────────────────────────────────────
function BossEntity(game, config) {
	this.game = game;
	this.name = config.name || "Boss";
	this.type = config.type || "generic";
	this.maxHealth = config.health || 100;
	this.health = this.maxHealth;
	this.x = 1800;
	this.y = 320;
	this.w = 70; this.h = 100;
	this.phase = 1;
	this.state = "TRACK";
	this.stateTimer = 0;
	this.currentAttack = null;
	this.isInvulnerable = false;
	this.attackHitbox = null;
	this.attackDamage = 20;
	this._hitCooldown = 0;
	this.attacks = config.attacks || [];
	this.attackIndex = 0;
	this._phase2Triggered = false;
}

BossEntity.prototype.takeDamage = function(amount) {
	if (this.isInvulnerable) return;
	this.health = Math.max(0, this.health - amount);
	this.game.addShake && this.game.addShake(6);
};

BossEntity.prototype.update = function(player, dt, ctx, cameraX) {
	dt = clampDt(dt || 1/60);
	this.stateTimer += dt * 1000;
	this.attackHitbox = null;

	// Stinger phase 2 trigger
	if (this.type === "stinger" && !this._phase2Triggered && this.health <= this.maxHealth * 0.5) {
		this._phase2Triggered = true;
		this.phase = 2;
		this.state = "ARMOR_PHASE";
		this.stateTimer = 0;
		this.isInvulnerable = true;
	}

	switch (this.state) {
		case "TRACK":
			var dx = player.x - this.x;
			if (Math.abs(dx) > 100) {
				var speed = (this.phase === 2) ? 160 : 110;
				this.x += Math.sign(dx) * speed * dt;
			} else {
				this._startTelegraph();
			}
			break;
		case "TELEGRAPH":
			var telegraphMs = this.currentAttack ? this.currentAttack.telegraphMs : 600;
			if (this.stateTimer >= telegraphMs) {
				this.state = "EXECUTE";
				this.stateTimer = 0;
				this._executeAttack(player);
			}
			break;
		case "EXECUTE":
			if (this.stateTimer >= 500) {
				this.state = "COOLDOWN";
				this.stateTimer = 0;
				this.attackHitbox = null;
			}
			break;
		case "COOLDOWN":
			var cooldownMs = this.currentAttack ? this.currentAttack.cooldownMs : 1500;
			if (this.phase === 2) cooldownMs *= 0.7;
			if (this.stateTimer >= cooldownMs) {
				this.state = "TRACK";
				this.stateTimer = 0;
				// Advance to next attack pattern
				this.attackIndex = (this.attackIndex + 1) % Math.max(1, this.attacks.filter(function(a){ return a.name !== 'armor_phase'; }).length);
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

	this._draw(ctx, cameraX);
};

BossEntity.prototype._startTelegraph = function() {
	var realAttacks = this.attacks.filter(function(a) { return a.name !== 'armor_phase'; });
	if (!realAttacks.length) return;
	this.currentAttack = realAttacks[this.attackIndex % realAttacks.length];
	this.state = "TELEGRAPH";
	this.stateTimer = 0;
	sfxBossTelegraph();
};

BossEntity.prototype._executeAttack = function(player) {
	if (!this.currentAttack) return;
	var atk = this.currentAttack.name;
	var self = this;

	if (atk === "charge_slam") {
		// Wide horizontal attack
		this.attackHitbox = { x: this.x - 80, y: this.y + 40, w: this.w + 160, h: 80 };
		this.attackDamage = 25;
	} else if (atk === "ground_pound") {
		// Radial hitbox below boss
		this.attackHitbox = { x: this.x - 100, y: this.y + 60, w: this.w + 200, h: 60 };
		this.attackDamage = 20;
		this.game.addShake && this.game.addShake(18);
	} else if (atk === "web_snare") {
		// Web projectile toward player
		this._spawnBossProjectile(player, "WEB_SNARE", 300, 15, 8);
	} else if (atk === "aerial_dive") {
		// Wide swoop hitbox
		this.attackHitbox = { x: player.x - 100, y: this.y, w: 200, h: this.h + 80 };
		this.attackDamage = 20;
	} else if (atk === "tail_lash") {
		// Wide sweep left/right
		this.attackHitbox = { x: this.x - 120, y: this.y + 20, w: this.w + 240, h: 60 };
		this.attackDamage = 20;
	} else if (atk === "poison_lunge") {
		// Fast dash + hitbox
		this.x = player.x - this.w/2;
		this.attackHitbox = { x: this.x - 40, y: this.y, w: this.w + 80, h: this.h };
		this.attackDamage = 25;
	}
};

BossEntity.prototype._spawnBossProjectile = function(player, name, speed, dmg, radius) {
	var p = new Projectile(this.game);
	p.name = name; p.damage = dmg;
	p.x = this.x + this.w/2; p.y = this.y + this.h/2;
	var tx = player.x + 15, ty = player.y + 30;
	var dx = tx - p.x, dy = ty - p.y;
	var dist = Math.sqrt(dx*dx+dy*dy) || 1;
	var nx = dx/dist*speed, ny = dy/dist*speed;
	var rad = radius || 10;
	p.update = function() {
		var rx = this.x - this.game.cameraX;
		this.ctx.fillStyle = '#8B2FC9';
		this.ctx.beginPath(); this.ctx.arc(rx, this.y, rad, 0, Math.PI*2); this.ctx.fill();
		this.x += nx * (1/60); this.y += ny * (1/60);
		if (this.x < this.game.cameraX-300 || this.x > this.game.cameraX+1580 || this.y < -100 || this.y > this.canvas.height+100) this.remove();
	};
	p.handleHitWithCharacter = function(c) { if (c.name !== "SPIDER_MAN") return; this.remove(); };
	this.game.addProjectile(p);
};

BossEntity.prototype._draw = function(ctx, cameraX) {
	var drawX = this.x - cameraX;
	if (drawX < -200 || drawX > 1480) return;
	ctx.save();

	// Color by type and state
	var color = '#7A5230';  // Stinger default
	if (this.type === "the_enforcer") color = '#4A5568';
	if (this.type === "thread")       color = '#5B2A86';
	if (this.isInvulnerable)          color = '#E8E8E8';  // Armor phase white

	// Boss body
	ctx.fillStyle = color;
	ctx.fillRect(drawX, this.y, this.w, this.h);
	ctx.strokeStyle = '#030712'; ctx.lineWidth = 2;
	ctx.strokeRect(drawX, this.y, this.w, this.h);

	// Type-specific details
	if (this.type === "the_enforcer") {
		// Enforcer: heavy plated torso
		ctx.fillStyle = '#D00'; ctx.fillRect(drawX+8, this.y+20, this.w-16, 20);
		ctx.fillStyle = '#888'; ctx.fillRect(drawX+5, this.y+10, this.w-10, 12);
	} else if (this.type === "thread") {
		// Thread: web-pattern details
		ctx.strokeStyle = '#9B59B6'; ctx.lineWidth = 1.5;
		ctx.beginPath(); ctx.moveTo(drawX, this.y+20); ctx.lineTo(drawX+this.w, this.y+20); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(drawX, this.y+50); ctx.lineTo(drawX+this.w, this.y+50); ctx.stroke();
	} else if (this.type === "stinger") {
		// Stinger: scorpion tail
		ctx.fillStyle = '#5A3010';
		ctx.beginPath();
		ctx.moveTo(drawX + this.w, this.y + 30);
		ctx.quadraticCurveTo(drawX+this.w+50, this.y-40, drawX+this.w+30, this.y-60);
		ctx.lineWidth = 8; ctx.strokeStyle = '#7A5230'; ctx.stroke();
		// Stinger tip
		ctx.fillStyle = '#FF6B35';
		ctx.beginPath(); ctx.arc(drawX+this.w+30, this.y-60, 6, 0, Math.PI*2); ctx.fill();
		// Phase 2 indicator
		if (this.phase === 2) {
			ctx.fillStyle = 'rgba(255,100,0,0.3)';
			ctx.fillRect(drawX-5, this.y-5, this.w+10, this.h+10);
		}
	}

	// Telegraph red indicator above head
	if (this.state === "TELEGRAPH") {
		var prog = Math.min(1, this.stateTimer / (this.currentAttack ? this.currentAttack.telegraphMs : 600));
		var flashAlpha = 0.3 + Math.sin(prog * Math.PI * 10) * 0.25;
		ctx.fillStyle = 'rgba(255,0,0,' + flashAlpha + ')';
		ctx.beginPath(); ctx.arc(drawX + this.w/2, this.y - 22, 14, 0, Math.PI*2); ctx.fill();
		ctx.fillStyle = '#FFF'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
		ctx.fillText('!', drawX + this.w/2, this.y - 17);
	}

	// Attack hitbox visualization (debug/feedback)
	if (this.attackHitbox) {
		var h = this.attackHitbox;
		ctx.fillStyle = 'rgba(255,0,0,0.2)';
		ctx.fillRect(h.x - cameraX, h.y, h.w, h.h);
		ctx.strokeStyle = 'rgba(255,50,50,0.8)'; ctx.lineWidth = 2;
		ctx.strokeRect(h.x - cameraX, h.y, h.w, h.h);
	}

	// Name tag
	ctx.fillStyle = '#FFF'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
	ctx.fillText(this.name.toUpperCase(), drawX + this.w/2, this.y - 36);

	ctx.restore();
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────
window.SpidermanGame = SpidermanGame;
window.Projectile    = Projectile;
window.SpiderMan     = SpiderMan;
window.Enemy         = Enemy;
window.Roof          = Roof;
window.Drone         = Drone;
window.Merc          = Merc;
window.Sniper        = Sniper;
window.EliteMerc     = EliteMerc;
window.BossEntity    = BossEntity;
window.createEnemyFromData = createEnemyFromData;

})(window, document);