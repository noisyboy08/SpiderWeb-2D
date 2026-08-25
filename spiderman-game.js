import { PhysicsEngine } from './src/engine/physics.js';

// change this to relative path (relative to script) or to absolute path
// where the audio, fonts and images folders are located
// (include a slash at the end)
var RESOURCES_FOLDER_PATH = "";

var requestAnimationFrame = (function() {
	if (window.requestAnimationFrame) return window.requestAnimationFrame;
	if (window.oRequestAnimationFrame) return window.oRequestAnimationFrame;
	if (window.msRequestAnimationFrame) return window.msRequestAnimationFrame;
	if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame;
	return function(callback) {
		setTimeout(callback, 1000 / 60);
	}
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

var AUDIO_LOOP = [
	"AMAZING_SPIDER_MAN_2",
	"FRIENDLY_SPIDERMAN",
	"MOVIE_THEME",
	"ANIMATED_SERIES",
];

var KEY = {
	ARROW_LEFT: 37,
	ARROW_UP: 38,
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40,
	SPACEBAR: 32,
	A: 65,
	S: 83,
	D: 68,
	W: 87,
	X: 88,
	F: 70,
	ESC: 27,
};

var DIRECTION = {
	RIGHT: 1,
	LEFT: -1,
}

function SpidermanGame(opts) {
	var options = {
		canvas: "canvas",
		score: 0,
		muted: false,
		soundEffects: true,
	};

	opts = opts || {};

	for (var option in options) {
		if (opts.hasOwnProperty(option)) {
			options[option] = opts[option];
		}

		this[option] = options[option];
	}

	// how many frames have passed
	this.frame = 0;
	this.resources = {};

	this.cameraX = 0;
	this.score = this.score || 0;

	// Level config — set by startLevel() before restart()
	this.levelConfig = null;
	this.levelWorldLength = Infinity; // default: endless
	this.worldProgress = 0;           // cumulative distance player has moved right
	this.levelCompleted = false;

	this.scene = {
		spiderman: null,
		projectiles: [],
		roofs: [],
		enemies: [],
	};
}

SpidermanGame.prototype.paused             = false;
SpidermanGame.prototype.initialized        = false;
SpidermanGame.prototype.soundEffects       = true;
SpidermanGame.prototype.escapeKey          = false;
SpidermanGame.prototype.muted              = false;
SpidermanGame.prototype.slowmotion         = false;
SpidermanGame.prototype._loopGen           = 0;

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
	if (!this.canvas) {
		this.canvas = document.createElement("canvas");
		document.body.appendChild(this.canvas);
	}
	this.ctx = this.canvas.getContext("2d");
	this.canvas.width = 1280;
	this.canvas.height = 720;

	this.fitCanvasToViewport();
	window.addEventListener("resize", function() {
		self.fitCanvasToViewport();
	});

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
	menu.querySelector(".spiderman-game-menu-button-resume").onclick = function() {
		self.unpause();
	}

	menu.querySelector(".spiderman-game-menu-button-mute-sounds").onclick = function() {
		if (self.soundEffects) {
			self.soundEffects = false;
			this.innerHTML = "UNMUTE SOUNDS";
		} else {
			self.soundEffects = true;
			this.innerHTML = "MUTE SOUNDS";
		}
	}

	menu.querySelector(".spiderman-game-menu-button-mute-music").onclick = function() {
		if (self.muted) {
			self.unmute();
			this.innerHTML = "MUTE MUSIC";
		} else {
			self.mute();
			this.innerHTML = "UNMUTE MUSIC";
		}
	}

	menu.querySelector(".spiderman-game-menu-button-mute-slowmotion").onclick = function() {
		if (self.slowmotion) {
			self.setSlowmotion(false);
		} else {
			self.setSlowmotion(true);
		}
	}
	document.body.appendChild(menu);
	this.pauseMenu = menu;

	var gameoverMenu = document.createElement("div");
	gameoverMenu.innerHTML = 
	'<div class="spiderman-game-menu-container">' +
		'<div class="spiderman-game-menu-title">GAME OVER</div>' +
		'<div class="spiderman-game-menu-title" style="font-size: 16px;">FINAL SCORE: <span class="spiderman-game-score">0</span></div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-restart">RETRY</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-tracker">MISSION TRACKER</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-cheat">CHEAT CODE</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-settings">SETTINGS</div>' +
	'</div>';
	gameoverMenu = gameoverMenu.firstChild;
	gameoverMenu.style.display = "none";

	gameoverMenu.querySelector(".spiderman-game-menu-button-restart").onclick = function() {
		console.log("[Spiderweb] Retry clicked");
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_RETRY')); return; }
		self.restart();
	}
	gameoverMenu.querySelector(".spiderman-game-menu-button-tracker").onclick = function() {
		console.log("[Spiderweb] Mission Tracker clicked");
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_TRACKER')); return; }
		self.restart();
	}
	gameoverMenu.querySelector(".spiderman-game-menu-button-cheat").onclick = function() {
		console.log("[Spiderweb] Cheat Code clicked");
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_CHEAT')); return; }
	}
	gameoverMenu.querySelector(".spiderman-game-menu-button-settings").onclick = function() {
		console.log("[Spiderweb] Settings clicked");
		if (window.__swOverlayActive) { window.dispatchEvent(new CustomEvent('SPIDERWORLD_SETTINGS')); return; }
		self.showPauseMenu();
	}

	document.body.appendChild(gameoverMenu);
	this.gameoverMenu = gameoverMenu;


	var spiderman = new SpiderMan(this);
	this.spiderman = spiderman;

	document.addEventListener("keydown", function(e) {
		var keyCode = e.keyCode || e.which;

		// fire this on the FIRST keydown callback
		if (keyCode == KEY.ESC && !self.escapeKey) {
			self.escapeKey = true;
			if (self.paused) {
				self.unpause();
			} else {
				self.pause();
			}
		}

		self.spiderman.keydown(e.keyCode || e.which);
	});

	document.addEventListener("keyup", function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode == KEY.ESC) {
			self.escapeKey = false;
		}

		self.spiderman.keyup(keyCode);
	});

	window.addEventListener("resize", function() {
		// resizing might change the canvas position, re position the menu if it is visible
		if (self.paused) {
			self.showPauseMenu();
		}
		if (self.gameIsOver) {
			self.showGameoverMenu();
		}
	});

	for (var i = 0; i < AUDIO_LOOP.length; i++) {
		var soundName = AUDIO_LOOP[i];
		var sound = AUDIO_RESOURCES[soundName];
		sound.setAttribute("data-name", soundName);
		sound.onended = function() {
			var current = AUDIO_LOOP.indexOf(this.getAttribute("data-name"));
			var next = (current + 1) % (AUDIO_LOOP.length);
			
			self.playSound(AUDIO_LOOP[next], false, 0);
		}
	}

	// to show that canvas is here, but is being loaded
	this.canvas.style.backgroundColor = "black";
	this.ctx.font = "30px Helvetica";
	this.ctx.textAlign = "center";
	this.ctx.fillStyle = "white";
	this.ctx.fillText("Loading...", this.canvas.width / 2, this.canvas.height / 2);

	return new Promise(function(resolve, reject) {
		var reourcesArray = [];

		for (var resource in RESOURCES) {
			reourcesArray.push({
				name: resource,
				source: RESOURCES_FOLDER_PATH + RESOURCES[resource],
			});
		}

		var index = 0;

		function loadNext() {
			if (!reourcesArray[index]) {
				var roof = new Roof(self, 0);

				self.scene.spiderman = spiderman;
				self.scene.roofs = [roof];
				self._loopGen = 0;  // fresh loop generation
				self.update();
				self.playSound(AUDIO_LOOP[0], false, 0);

				// if game was muted in initial options
				if (self.muted) self.mute();

				return resolve();
			}

			var resource = reourcesArray[index];
			var img = new Image();

			img.onload = function() {
				index++;
				self.resources[resource.name] = img;
				loadNext();
			}
			img.src = resource.source;
		}

		loadNext();
	});
}

SpidermanGame.prototype.setSlowmotion = function(slowmo) {
	if (slowmo) {
		this.slowmotion = true;

		window.requestAnimFrame = function(callback) {
			setTimeout(callback, 1000 / 10);
		}

		for (var audio in AUDIO_RESOURCES) {
			AUDIO_RESOURCES[audio].playbackRate = 0.5;
		}
	} else {
		this.slowmotion = false;

		window.requestAnimFrame = requestAnimationFrame;

		for (var audio in AUDIO_RESOURCES) {
			AUDIO_RESOURCES[audio].playbackRate = 1;
		}
	}
}

SpidermanGame.prototype.mute = function() {
	this.muted = true;

	for (var audio in AUDIO_RESOURCES) {
		AUDIO_RESOURCES[audio].volume = 0;
	}
}

SpidermanGame.prototype.unmute = function() {
	this.muted = false;

	for (var audio in AUDIO_RESOURCES) {
		AUDIO_RESOURCES[audio].volume = 1;
	}
}

SpidermanGame.prototype.showPauseMenu = function() {
	if (window.__swOverlayActive) {
		if (this.pauseMenu) this.pauseMenu.style.display = "none";
		return;
	}
	if (this.gameoverMenu.style.display == "block") return;
	var pauseMenu = this.pauseMenu;

	var canvasRect = this.canvas.getBoundingClientRect(); // includes CSS translations
	var left = canvasRect.left;
	var top = canvasRect.top;

	this.pauseMenu.style.display = "block";
	this.pauseMenu.style.left = (left + this.canvas.width / 2) + "px";
	this.pauseMenu.style.top = (top + this.canvas.height / 2) + "px";
}

SpidermanGame.prototype.showGameoverMenu = function() {
	var gameoverMenu = this.gameoverMenu;
	this.gameoverMenu.querySelector(".spiderman-game-score").innerHTML = this.score;

	var canvasRect = this.canvas.getBoundingClientRect(); // includes CSS translations
	var left = canvasRect.left;
	var top = canvasRect.top;

	this.gameoverMenu.style.display = "block";
	this.gameoverMenu.style.left = (left + this.canvas.width / 2) + "px";
	this.gameoverMenu.style.top = (top + this.canvas.height / 2) + "px";
}

SpidermanGame.prototype.pause = function() {
	this.paused = true;
	this.showPauseMenu();
};

SpidermanGame.prototype.unpause = function() {
	this.paused = false;

	this.pauseMenu.style.display = "none";

	this.update();
}

SpidermanGame.prototype.playSound = function(audio, clone, currentTime) {
	audio = audio && audio.play ? audio : AUDIO_RESOURCES[audio];

	if (audio && audio.play) {
		if (clone) {
			audio = audio.cloneNode(true);
		}

		if (currentTime != undefined) {
			audio.currentTime = currentTime;
		}

		return audio.play();
	}
};

SpidermanGame.prototype.pauseSound = function(audio) {
	if (audio && audio.pause) {
		return audio.pause();
	}

	if (AUDIO_RESOURCES[audio]) {
		AUDIO_RESOURCES[audio].pause();
	}
}

SpidermanGame.prototype.drawBackground = function() {
	var background = this.resources.BACKGROUND;
	var backgroundWidth = background.width;
	var backgroundHeight = background.height;

	var x = this.cameraX / 5 * -1;
	var y = 0;

	x %= Math.min(background.width, this.canvas.width);

	var ratio = backgroundWidth / backgroundHeight;
	this.ctx.drawImage(background, x, y, this.canvas.height * ratio, this.canvas.height);
	this.ctx.drawImage(background, x + this.canvas.height * ratio, y, this.canvas.height * ratio, this.canvas.height);
}

SpidermanGame.prototype.drawRoofs = function() {
	var roofs = this.scene.roofs;

	for (var i = 0; i < roofs.length; i++) {
		roofs[i].update();
	}

	// if roof left the frame and was removed, add another one
	if (roofs.length < 3) {
		var lastRoof = roofs[roofs.length - 1];
		var gapMin = (this.levelConfig && this.levelConfig.buildingGapRange) ? this.levelConfig.buildingGapRange[0] : 100;
		var gapMax = (this.levelConfig && this.levelConfig.buildingGapRange) ? this.levelConfig.buildingGapRange[1] : 150;
		var gap = Math.round(Math.random() * (gapMax - gapMin)) + gapMin;
		var x = lastRoof.x + lastRoof.fullWidth + gap;

		var roof = new Roof(this, x, this.levelConfig);
		this.addRoof(roof);
		roofs[0].update();
	}
}

SpidermanGame.prototype.drawEnemies = function() {
	var enemies = this.scene.enemies;

	for (var i = 0; i < enemies.length; i++) {
		enemies[i].update();
	}
}

SpidermanGame.prototype.update = function() {
	// Guard: each loop generation captures its ID at creation.
	// When restart() increments _loopGen, all old loops detect the
	// mismatch and stop themselves — preventing speed accumulation.
	var myGen = this._loopGen;

	// Always clear the canvas for redrawing
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.drawBackground();
	this.drawRoofs();

	if (!this.paused && !this.gameIsOver) {
		var scene = this.scene;
		var spiderman = scene.spiderman;
		var projectiles = scene.projectiles;

		this.drawEnemies();

		for (var i = 0; i < projectiles.length; i++) {
			projectiles[i].update();
		}

		spiderman.update();

		// Epic 2: Spiderman vs Enemy Collision (Swing-Strike Combat)
		var enemies = this.scene.enemies;
		for (var i = enemies.length - 1; i >= 0; i--) {
			var enemy = enemies[i];
			var ex = enemy.x, ey = enemy.y;
			var ew = enemy.stateImg ? enemy.stateImg.width * enemy.scale : 40;
			var eh = enemy.stateImg ? enemy.stateImg.height * enemy.scale : 64;

			var sx = spiderman.x, sy = spiderman.y;
			var sw = 40, sh = 64; // Spiderman approx bounds

			// Simple AABB collision
			if (sx < ex + ew && sx + sw > ex && sy < ey + eh && sy + sh > ey) {
				// We have a collision!
				var speedPxPerFrame = Math.sqrt(spiderman.velocityX * spiderman.velocityX + spiderman.velocityY * spiderman.velocityY);
				// Speed threshold (600 px/s is approx 10 px/frame)
				if (spiderman.webState.attached && speedPxPerFrame > 9.5) {
					// Swing-Strike: Enemy dies, player bounces slightly and maintains momentum
					enemy.health = 0;
					// Add a little upward bounce (feels good)
					spiderman.velocityY -= 5;
					this.score += 10;
					window.dispatchEvent(new CustomEvent('SPIDERWORLD_SCOREUPDATE', { detail: { score: this.score } }));
				} else {
					// Normal collision: Player takes damage (if not recently damaged)
					if (!spiderman.wasDamagedOnPreviousFrame) {
						spiderman.health -= 1;
						spiderman.wasDamagedOnPreviousFrame = true;
						// Knockback
						spiderman.velocityX = (sx < ex) ? -10 : 10;
						spiderman.velocityY = -8;
						spiderman.webState.attached = false;
						spiderman.addState("FALL");
					}
				}
			}
		}

		// Track world progress (cumulative rightward movement)
		if (spiderman.velocityX > 0) this.worldProgress += spiderman.velocityX;

		// Update HUD HP bar via custom event
		window.dispatchEvent(new CustomEvent('SPIDERWORLD_HPUPDATE', {
			detail: { hp: spiderman.health, maxHp: spiderman.maxHealth }
		}));
		// Update HUD distance
		window.dispatchEvent(new CustomEvent('SPIDERWORLD_PROGRESS', {
			detail: { dist: Math.floor(this.cameraX / 10) }
		}));

		// Check level completion
		if (!this.levelCompleted && this.worldProgress >= this.levelWorldLength) {
			this.levelCompleted = true;
			window.dispatchEvent(new CustomEvent('SPIDERWORLD_LEVELCOMPLETE', {
				detail: { levelId: this.activeLevelId || 1 }
			}));
		}

		for (var i = 0; i < projectiles.length; i++) {
			var projectile = projectiles[i];
			var x = projectile.x;
			var y = projectile.y;

			var character = this.isCharacterAtPoint(x, y);
			if (character) {
				projectile.handleHitWithCharacter(character);
				character.handleHitWithProjectile(projectile);
			}
		}
	} else if (this.gameIsOver) {
		// Freeze the scene — just draw, no physics updates
		this.drawEnemies();
		this.showGameoverMenu();
	} else if (this.paused) {
		this.drawEnemies();
		this.showPauseMenu();
	}

	this.ctx.fillStyle = "white";
	this.ctx.font = "20px SpidermanGamePixelFont, Monospace, Helvetica";
	this.ctx.textAlign = "center";
	this.ctx.textBaseline = "top";
	this.ctx.fillText(this.score, this.canvas.width / 2, 10);

	// Only schedule next frame if this loop is still the active one
	var self = this;
	requestAnimFrame(function() {
		if (self._loopGen === myGen) self.update();
	});
}


SpidermanGame.prototype.addProjectile = function(projectile) {
	if (projectile instanceof Projectile) {
		this.scene.projectiles.push(projectile);
	}
}

SpidermanGame.prototype.removeProjectile = function(projectile) {
	var projectiles = this.scene.projectiles;
	if (projectiles.indexOf(projectile) > -1) {
		projectiles.splice(projectiles.indexOf(projectile), 1);
	}
}

SpidermanGame.prototype.addEnemy = function(enemy) {
	if (enemy instanceof Enemy) {
		this.scene.enemies.push(enemy);
	}
}

SpidermanGame.prototype.removeEnemy = function(enemy) {
	var enemies = this.scene.enemies;
	if (enemies.indexOf(enemy) > -1) {
		enemies.splice(enemies.indexOf(enemy), 1);
	}
}

SpidermanGame.prototype.addRoof = function(roof) {
	if (roof instanceof Roof) {
		this.scene.roofs.push(roof);
	}
}

SpidermanGame.prototype.removeRoof = function(roof) {
	var roofs = this.scene.roofs;
	if (roofs.indexOf(roof) > -1) {
		roofs.splice(roofs.indexOf(roof), 1);
	}
}

// checks if given point is roof
SpidermanGame.prototype.isRoofAtPoint = function(x, y) {
	x -= this.cameraX; // to move point relative to canvas
	for (var i = 0; i < this.scene.roofs.length; i++) {
		var roof = this.scene.roofs[i];

		// since character is relative to the camera, calculate X of roof relative to camera as well
		var roofX = roof.x - this.cameraX;

		if (roofX <= x && roofX + roof.fullWidth >= x && y >= roof.y) return roof;
	}

	return false;
}

SpidermanGame.prototype.isCharacterAtPoint = function(x, y) {
	// enemies + spiderman
	var characters = this.scene.enemies.concat(this.spiderman);
	x -= this.cameraX;

	for (var i = 0; i < characters.length; i++) {
		var character = characters[i];
		var stateImg = character.stateImg || {};

		var left = character.x - this.cameraX;
		var top = character.y;
		var right = left + stateImg.width * character.scale;
		var bottom = top + stateImg.height * character.scale;

		var isCharacter = 
			   left   <= x // check left bound
			&& top    <= y // top bound
			&& right  >= x // right bound
			&& bottom >= y; // bottom bound

		if (isCharacter) return character;
	}

	return false;
}

SpidermanGame.prototype.restart = function() {
	// Kill the current animation loop by advancing the generation
	this._loopGen = (this._loopGen || 0) + 1;

	// Apply level config if provided
	if (this.levelConfig) {
		this.levelWorldLength = this.levelConfig.worldLength || Infinity;
	} else {
		this.levelWorldLength = Infinity;
	}
	this.worldProgress = 0;
	this.levelCompleted = false;

	var roof = new Roof(this, 0, this.levelConfig);

	this.spiderman = new SpiderMan(this);
	this.scene.spiderman = this.spiderman;
	this.scene.projectiles = [];
	this.scene.roofs = [roof];
	this.scene.enemies = [];
	this.cameraX = 0;
	this.score = 0;

	this.paused = false;
	this.gameIsOver = false;

	this.gameoverMenu.style.display = "none";
	this.pauseMenu.style.display = "none";

	this.update();  // start single fresh loop
}

SpidermanGame.prototype.gameover = function() {
	if (!this.gameIsOver) {
		console.log("[Spiderweb] Player health reached 0 or fell into pit - triggering Game Over UI");
		this.gameIsOver = true;
		window.dispatchEvent(new CustomEvent('SPIDERWORLD_GAMEOVER', { detail: { score: this.score } }));
	}
	// Only show built-in menu if Spiderweb overlay is NOT active
	if (!window.__swOverlayActive) {
		this.showGameoverMenu();
	}
}


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
	
	// Epic 3: SpiderGirl Modifiers
	this.isSpiderGirl = game.isSpiderGirl;
	this.maxHealth = this.isSpiderGirl ? 4 : 5;
	this.health = this.maxHealth;

	this.web = 100;
	this.webState = { anchor: null, ropeLength: 0, theta: 0, angularVelocity: 0, attached: false };

	this.velocityX = 0;
	this.velocityY = 0;

	// to regenerate every N fps (approximately N / 60 seconds)
	this.regenerationSpeed = 1200;

	// how many frames have passed
	this.frame = 0;

	this.runningFrames = ["RUNNING_RIGHT_STEP", "RUNNING_CHANGE_STEP", "RUNNING_LEFT_STEP", "RUNNING_CHANGE_STEP"];
	this.runningShootingFrames = ["SHOOT_RIGHT-STEP", "SHOOT_CHANGE_STEP", "SHOOT_LEFT-STEP", "SHOOT_CHANGE_STEP"];
	this.runningFrame = 0;

	this.gravityForce = 0.7;

	this.runningDirection = 0;
	var speedMult = (game && game.speedMultiplier) ? game.speedMultiplier : 1.0;
	this.runningSpeed = 5 * speedMult;

	this.shootingFrame = 0;
	this.wasDamagedOnPreviousFrame = false;
}

SpiderMan.prototype.keyIsDown = function(keyCode) {
	return this.keydowns.indexOf(keyCode) > -1;
}

SpiderMan.prototype.hasState = function(state) {
	return this.states.indexOf(state) > -1;
}

SpiderMan.prototype.hasStates = function(states) {
	states = states.split(" ");
	var hasStates = true;
	for (var i = 0; i < states.length; i++) {
		hasStates = hasStates && this.hasState(states[i]);
	}
	return hasStates;
}

SpiderMan.prototype.addState = function(state) {
	if (this.hasState(state) === false) this.states.push(state);
}

SpiderMan.prototype.removeState = function(state) {
	if (state instanceof Array) {
		for (var i = 0; i < state.length; i++) {
			this.removeState(state[i]);
		}
	}

	if (this.hasState(state)) this.states.splice(this.states.indexOf(state), 1);
}

SpiderMan.prototype.handleHitWithProjectile = function(projectile) {
	if (projectile.name != "WEB") {
		this.health -= projectile.damage;
		this.wasDamagedOnPreviousFrame = true;
	}
}

// returns the image to draw in position of spiderman
SpiderMan.prototype.stateImage = function() {
	var state = "STANDING";

	if (this.hasState("JUMP")) {
		state = "JUMP";

		if (this.velocityY == 0) {
			this.velocityY = -15;
		}
	}

	if (this.velocityY >= 0) this.removeState("JUMP");

	if (this.hasState("RUNNING")) {
		state = this.runningFrames[this.runningFrame];

		// if user is shooting while running
		if (this.hasState("SHOOT")) state = this.runningShootingFrames[this.runningFrame];

		// every 10th frame update the image
		if (this.frame % 10 === 0) {
			this.runningFrame++;
			this.runningFrame %= this.runningFrames.length - 1;
		}

		this.velocityX = this.runningDirection * this.runningSpeed;
	} else {
		this.velocityX = 0;
	}

	if (this.hasState("SHOOT")) {
		if (!this.hasState("RUNNING")) state = "SHOOT";
		if (this.shootingFrame % 20 === 0) {
			this.shoot(this.game.resources.SHOOT);
		}
		this.shootingFrame++;
	}

	var image = this.game.resources[state] || this.game.resources["STANDING"];
	this.stateImg = image; // so that stateImage is accessible

	return image;
}

SpiderMan.prototype.keydown = function(keyCode) {
	this.keydowns.push(keyCode);
}

SpiderMan.prototype.keyup = function(keyCode) {
	this.runningFrame = 0;

	if (keyCode == KEY.ARROW_RIGHT || keyCode == KEY.ARROW_LEFT || keyCode == KEY.D || keyCode == KEY.A) {
		this.removeState("RUNNING");
	}

	if (keyCode == KEY.X || keyCode == KEY.SPACEBAR) {
		this.removeState("SHOOT");
		this.shootingFrame = 0;
	}

	while (this.keydowns.indexOf(keyCode) > -1) {
		this.keydowns.splice(this.keydowns.indexOf(keyCode), 1);
	}
}

SpiderMan.prototype.regenerate = function() {
	// if this is 300th fps, regenerate
	if (this.frame % this.regenerationSpeed === 0 && this.health < this.maxHealth) {
		this.health = Math.round(this.health + 1);
	}
}

SpiderMan.prototype.shoot = function(img) {
	if (this.web <= 0) return;

	var direction = this.runningDirection || 1;
	var web = new Projectile(this.game);

	web.name = "WEB";
	web.damage = 2;

	web.x = this.x + img.width * this.scale + 1;
	if (this.runningDirection == DIRECTION.LEFT) {
		web.x = this.x - 1; // left hand will be the X position of the spiderman
	}
	web.y = this.y + img.height * this.scale / 2;

	web.update = function() {            
		var x = this.x - this.game.cameraX;
		var y = this.y;

		if (direction == DIRECTION.LEFT) {
			// if spiderman is turned to left,
			// move web by 20pixels since X coordinates start from LEFT to right
			x -= 20;
		}

		this.ctx.drawImage(this.game.resources["WEB_PROJECTILE"], x, y - 10, 20, 20);

		this.x += direction * 10;
		if (this.x - this.game.cameraX >= this.canvas.width || this.x <= 0) this.remove();
	}

	web.handleHitWithCharacter = function(character) {
		// somtimes projectile is being hit by the spiderman ON launch
		// the best way is probably to launch it better but for now, i'll just make sure
		// it doesn't get destroyed on launch
		if (character.name != "SPIDER_MAN") return this.remove();
	}

	web.spiderman = this;

	this.game.addProjectile(web);
	if (this.game.soundEffects == true) {
		this.game.playSound("SHOOT", true, 0);
	}

	this.web--;
}

SpiderMan.prototype.drawHealthbar = function() {
	var heart = {
		width: 25,
		height: 25,
	};

	for (var i = 0; i < this.health; i++) {
		// (i + 1) * 5 for every 5 pixel padding per heart
		var x = i * heart.width + 5 * (i + 1);
		var y = 5;
		this.ctx.drawImage(this.game.resources.HEART, x, y, heart.width, heart.height);
	}
}

SpiderMan.prototype.drawWebbar = function() {
	var img = this.game.resources.WEB_PROJECTILE;
	var string = "X " + this.web;
	this.ctx.fillStyle = "white";
	this.ctx.font = "15px SpidermanGamePixelFont, Monospace, Arial";
	this.ctx.textAlign = "start";
	this.ctx.textBaseline = "top";

	var web = {
		width: 20,
		height: 20,
	};

	var text = {
		string: string,
		width: this.ctx.measureText(string).width,
		verticalPadding: 5,
		horizontalPadding: 10,
	};

	var x = this.canvas.width - web.width - text.width - text.horizontalPadding * 2;
	var y = text.verticalPadding;

	var textX = x + web.width + text.horizontalPadding;
	var textY = y;

	this.ctx.drawImage(img, x, y, web.width, web.height);
	this.ctx.fillText(text.string, textX, textY);
}

// function that gets called with global update function
SpiderMan.prototype.update = function() {
	if ((this.keyIsDown(KEY.ARROW_UP) || this.keyIsDown(KEY.W)) && !this.hasState("FALL")) {
		this.addState("JUMP");
	}
	if (this.keyIsDown(KEY.ARROW_RIGHT) || this.keyIsDown(KEY.D)) {
		this.addState("RUNNING");
		this.runningDirection = DIRECTION.RIGHT;
	}
	if (this.keyIsDown(KEY.ARROW_LEFT) || this.keyIsDown(KEY.A)) {
		this.addState("RUNNING");
		this.runningDirection = DIRECTION.LEFT;
	}
	if (this.keyIsDown(KEY.X) || this.keyIsDown(KEY.SPACEBAR)) {
		this.addState("SHOOT");
	}

	if (this.y >= this.canvas.height + 200 || !this.health) {
		this.game.gameover();
	}

	var img = this.stateImage();

	// Standard physics (gravity + position update)
	this.velocityY += this.gravityForce;
	this.y += this.velocityY;
	this.x += this.velocityX;

	if (this.x - this.game.cameraX < 0) {
		this.x = this.game.cameraX; // dont allow going left
	}

	if (this.x - this.game.cameraX > 150) {
		this.game.cameraX += this.velocityX;
	}
	
	// check if coordinates are on the roof, before increasing it by velocityX, because it might BE inside the building
	// after velocityX
	// check if left side is on the roof
	var roofLeft = this.game.isRoofAtPoint(this.x - this.velocityX, this.y + img.height * this.scale + 1);
	// check if right X hit the roof
	var roofRight = this.game.isRoofAtPoint(this.x + img.width * this.scale - this.velocityX, this.y + img.height * this.scale + 1);

	// check if spiderman is standing on the ground (roof)
	if (roofLeft || roofRight) {
		var roof = roofLeft || roofRight;

		// since velocity might kinda make the spiderman go INSIDE the wall by adding too much Y,
		// we'll just check if spider's y is INSIDE the wall just because of the velocityY
		// just to make sure that spider is actually on the roof
		if (roof.y + this.velocityY <= this.y) {
			// Hit a wall — wall-kick if UP/W is pressed
			var hitWall = true;
			if ((this.keyIsDown(KEY.ARROW_UP) || this.keyIsDown(KEY.W)) && this.hasState("FALL")) {
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
			this.y = this.canvas.height - roof.height - img.height * this.scale;
			this.velocityY = 0;
			this.velocityX = this.hasState("RUNNING") ? this.velocityX : 0;
			this.removeState("FALL");
			this.webState.attached = false;
		}
	} else {
		// In the air — add FALL state when moving downward
		if (this.velocityY > 0) this.addState("FALL");
	}

	var x = this.x - this.game.cameraX;
	var y = this.y;
	var width = img.width * this.scale;
	var height = img.height * this.scale;

	this.ctx.save();
	this.drawCharacterSprite(this.ctx, x, y, width, height, img);
	this.ctx.restore();


	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;

		this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
		this.ctx.fillRect(x, y, width, height);
	}

	this.regenerate();
	this.drawHealthbar();
	this.drawWebbar();

	this.frame++;
}

SpiderMan.prototype.drawCharacterSprite = function(ctx, x, y, width, height, img) {
	if (img && img.complete && img.naturalWidth > 0 && img.naturalWidth !== 32) {
		ctx.drawImage(img, x, y, width, height);
		return;
	}

	ctx.save();
	var isFacingLeft = (this.runningDirection === DIRECTION.LEFT);
	var state = "STANDING";
	if (this.velocityY > 2) state = "FALLING";
	else if (this.velocityY < -2) state = "JUMPING";
	else if (this.hasState("RUNNING")) state = "RUNNING";
	else if (this.hasState("SHOOT")) state = "SHOOTING";

	var charW = 40;
	var charH = 64;
	var posX = x + (width - charW) / 2;
	var posY = y + (height - charH);

	if (isFacingLeft) {
		ctx.scale(-1, 1);
		posX = -posX - charW;
	}

	// Shadow
	ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
	ctx.beginPath();
	ctx.ellipse(posX + charW/2, posY + charH, charW/2, 6, 0, 0, Math.PI * 2);
	ctx.fill();

	// Legs
	ctx.fillStyle = "#0B192C"; // Navy base
	ctx.strokeStyle = "#030712";
	ctx.lineWidth = 1.5;

	if (state === "RUNNING") {
		var legOffset = (this.frame % 10 < 5) ? 4 : -4;
		ctx.fillRect(posX + 10 + legOffset, posY + 36, 8, 24);
		ctx.strokeRect(posX + 10 + legOffset, posY + 36, 8, 24);
		ctx.fillRect(posX + 22 - legOffset, posY + 36, 8, 24);
		ctx.strokeRect(posX + 22 - legOffset, posY + 36, 8, 24);
	} else if (state === "JUMPING" || state === "FALLING") {
		ctx.fillRect(posX + 6, posY + 34, 11, 18);
		ctx.strokeRect(posX + 6, posY + 34, 11, 18);
		ctx.fillRect(posX + 23, posY + 34, 11, 18);
		ctx.strokeRect(posX + 23, posY + 34, 11, 18);
	} else {
		ctx.fillRect(posX + 10, posY + 36, 9, 26);
		ctx.strokeRect(posX + 10, posY + 36, 9, 26);
		ctx.fillRect(posX + 21, posY + 36, 9, 26);
		ctx.strokeRect(posX + 21, posY + 36, 9, 26);
	}

	// Teal boots
	ctx.fillStyle = "#00F2FE";
	ctx.fillRect(posX + 10, posY + 54, 9, 8);
	ctx.fillRect(posX + 21, posY + 54, 9, 8);

	// Torso (Navy Blue)
	ctx.fillStyle = "#162A45";
	ctx.fillRect(posX + 8, posY + 16, 24, 22);
	ctx.strokeRect(posX + 8, posY + 16, 24, 22);

	// Teal Chest Emblem
	ctx.fillStyle = "#00F2FE";
	ctx.beginPath();
	ctx.moveTo(posX + 20, posY + 18);
	ctx.lineTo(posX + 26, posY + 24);
	ctx.lineTo(posX + 20, posY + 30);
	ctx.lineTo(posX + 14, posY + 24);
	ctx.closePath();
	ctx.fill();

	// Belt line
	ctx.fillRect(posX + 8, posY + 34, 24, 3);

	// Arms
	ctx.fillStyle = "#0B192C";
	if (state === "SHOOTING") {
		ctx.fillRect(posX + 28, posY + 18, 14, 8);
		ctx.strokeRect(posX + 28, posY + 18, 14, 8);
		ctx.fillStyle = "#00F2FE";
		ctx.fillRect(posX + 38, posY + 18, 4, 8);
	} else {
		ctx.fillRect(posX + 2, posY + 18, 7, 18);
		ctx.strokeRect(posX + 2, posY + 18, 7, 18);
		ctx.fillRect(posX + 31, posY + 18, 7, 18);
		ctx.strokeRect(posX + 31, posY + 18, 7, 18);
	}

	// Head & Mask
	ctx.fillStyle = "#0B192C";
	ctx.beginPath();
	ctx.arc(posX + 20, posY + 10, 10, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	// Glowing White Mask Eyes
	ctx.fillStyle = "#FFFFFF";
	ctx.strokeStyle = "#00F2FE";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.ellipse(posX + 15, posY + 9, 4, 3, Math.PI / 6, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.ellipse(posX + 25, posY + 9, 4, 3, -Math.PI / 6, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	ctx.restore();
};


function Projectile(game) {
	this.x = 0;
	this.y = 0;

	this.damage = 0;
	this.name = "UNKNOWN";

	this.canvas = game.canvas;
	this.ctx = game.ctx;
	this.game = game;
}

Projectile.prototype.update = function() {
}

Projectile.prototype.remove = function() {
	this.game.removeProjectile(this);
}

Projectile.prototype.handleHitWithCharacter = function() {
	this.remove();
}

function Roof(game, x, levelConfig) {
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;

	// Use level config ranges if provided, else sensible defaults
	var minH = (levelConfig && levelConfig.buildingHeightRange) ? levelConfig.buildingHeightRange[0] : 100;
	var maxH = (levelConfig && levelConfig.buildingHeightRange) ? levelConfig.buildingHeightRange[1] : 150;
	var heightRange = maxH - minH;

	var maxBuildingW = this.game.resources.BUILDING.width;
	this.width = Math.round(Math.random() * (maxBuildingW - 200)) + 200;
	this.height = Math.round(Math.random() * heightRange) + minH;
	this.fullWidth = this.width + 15; // 15 pixels for right end of the roof top

	this.x = x || 0;
	this.y = this.canvas.height - this.height;

	// 70% chance to spawn an enemy on this roof
	var shouldSpawnEnemy = Math.round(Math.random() * 100) >= 30;
	if (shouldSpawnEnemy) {
		var enemy = new Enemy(this.game, {
			x: this.x + this.width / 2,
		});
		enemy.y = this.y - 1 - enemy.stateImg.height * enemy.scale;
		this.game.addEnemy(enemy);
		this.enemy = enemy;
	}
}

Roof.prototype.update = function() {
	var renderX = this.x - this.game.cameraX;
	var roof = this.game.resources.BUILDING;

	this.ctx.drawImage(roof, 0, 0, this.width, this.height, renderX, this.y, this.width, this.height);
	this.ctx.drawImage(roof, this.width, 0, 15, 26, renderX + this.width, this.y, 15, 26);

	if (renderX + this.width <= 0) {
		this.game.removeRoof(this);
		this.game.removeEnemy(this.enemy);
	}
}


function Enemy(game, opts) {
	opts = opts || {};

	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;

	this.health = opts.health || 4;
	this.maxHealth = opts.maxHealth || this.health;
	this.name = opts.name || "THUG";
	this.x = opts.x || this.canvas.width - 50;
	this.y = opts.y || 0;
	// just to control the scaling of an image
	this.scale = 0.5;
	this.stateImg = this.game.resources[this.name];

	this.wasDamagedOnPreviousFrame = false;
	this.frame = 0;
};

Enemy.prototype.shoot = function() {
	var self = this;
	var knife = this.game.resources.KNIFE;

	var projectile = new Projectile(this.game);
	projectile.name = "KNIFE";
	projectile.damage = 1;

	projectile.x = this.x - knife.width * this.scale / 2;
	// so knifes height is divided by 4 because, 2 is for center, and another 2 is for 0.5 scale
	projectile.y = this.y + (this.stateImg.height * this.scale / 2) - (knife.height * this.scale / 4);
	var speedMult = (this.game && this.game.speedMultiplier) ? this.game.speedMultiplier : 1.0;
	projectile.update = function() {
		this.ctx.drawImage(knife, this.x - this.game.cameraX, this.y, knife.width * self.scale / 2, knife.height * self.scale / 2);

		this.x -= 10 * speedMult;
	}

	this.game.addProjectile(projectile);
}

Enemy.prototype.drawHealthbar = function() {
	var healthbar = {
		height: 5,
		width: 100,
		style: "red",
		borderWidth: 2,
		borderStyle: "black"
	};

	var x = this.x - this.game.cameraX;
	x -= healthbar.width / 2; // to center the healthbar with the X of the character
	x += this.stateImg.width * this.scale / 2; // to center the healthbar with the X of characters center

	var y      = this.y - (healthbar.height + healthbar.borderWidth * 2) - 5;
	var width  = healthbar.width * this.health / this.maxHealth; // get the width for current health
	var height = healthbar.height;

	var borderX      = x - healthbar.borderWidth;
	var borderY      = y - healthbar.borderWidth;
	var borderWidth  = healthbar.width + healthbar.borderWidth * 2;
	var borderHeight = healthbar.height + healthbar.borderWidth * 2;

	this.ctx.fillStyle = healthbar.borderStyle;
	this.ctx.fillRect(borderX, borderY, borderWidth, borderHeight);

	this.ctx.fillStyle = healthbar.style;
	this.ctx.fillRect(x, y, width, height);
}

Enemy.prototype.update = function() {
	var img = this.game.resources[this.name];
	this.stateImg = img;

	if (this.health <= 0) {
		this.remove();
	}

	this.drawHealthbar();

	var x = this.x - this.game.cameraX;
	var y = this.y;
	var width = img.width * this.scale;
	var height = img.height * this.scale;

	this.ctx.save();
	this.ctx.scale(-1, 1);

	this.ctx.drawImage(this.game.resources[this.name], (x + width) * -1, y, width, height);
	this.ctx.restore();

	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
		this.ctx.fillRect(x, y, width, height);
	}

	var isInScreen = this.x - this.game.cameraX <= this.canvas.width;

	if (this.frame % 100 === 0 && isInScreen) {
		this.shoot();
	}

	this.frame++;
}

Enemy.prototype.remove = function() {
	this.game.score++;
	this.game.spiderman.web += this.maxHealth;
	this.game.removeEnemy(this);	
}

Enemy.prototype.handleHitWithProjectile = function(projectile) {
	if (projectile.name == "WEB") {
		this.health -= projectile.damage;
		this.wasDamagedOnPreviousFrame = true;
	}
}

window.SpidermanGame = SpidermanGame;
window.Projectile    = Projectile;
window.SpiderMan     = SpiderMan;
window.Enemy         = Enemy;
window.Roof          = Roof;