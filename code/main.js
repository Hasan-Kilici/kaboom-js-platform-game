import kaboom from "kaboom"

kaboom()
loadSprite("bean", "/sprites/bean.png")
loadSprite("ghosty", "/sprites/bean.png")
loadSprite("spike", "/sprites/bean.png")
loadSprite("grass", "/sprites/bean.png")
loadSprite("prize", "/sprites/bean.png")
loadSprite("apple", "/sprites/bean.png")
loadSprite("portal", "/sprites/bean.png")
loadSprite("coin", "/sprites/bean.png")
loadSound("coin", "/sounds/score.mp3")
loadSound("powerup", "/sounds/score.mp3")
loadSound("blip", "/sounds/score.mp3")
loadSound("hit", "/sounds/score.mp3")
loadSound("portal", "/sounds/score.mp3")
function patrol(speed = 60, dir = 1) {
	return {
		id: "patrol",
		require: [ "pos", "area", ],
		add() {
			this.on("collide", (obj, col) => {
				if (col.isLeft() || col.isRight()) {
					dir = -dir
				}
			})
		},
		update() {
			this.move(speed * dir, 0)
		},
	}
}
function big() {
	let timer = 0
	let isBig = false
	let destScale = 1
	return {
		// component id / name
		id: "big",
		// it requires the scale component
		require: [ "scale" ],
		// this runs every frame
		update() {
			if (isBig) {
				timer -= dt()
				if (timer <= 0) {
					this.smallify()
				}
			}
			this.scale = this.scale.lerp(vec2(destScale), dt() * 6)
		},
		isBig() {
			return isBig
		},
		smallify() {
			destScale = 1
			timer = 0
			isBig = false
		},
		biggify(time) {
			destScale = 2
			timer = time
			isBig = true
		},
	}
}
let curFont = 0
let curSize = 48
const pad = 24

const JUMP_FORCE = 1320
const MOVE_SPEED = 480
const FALL_DEATH = 2400

const LEVELS = [
  //Level 1
	[
		"                          $",
		"                          $",
		"                          $",
		"                          $",
		"                          $",
		"           $$         =   $",
		"  %      ====         =   $",
		"                      =   $",
		"                      =    ",
		"       ^^      = >    =   @",
		"===========================",
	], //Level 2
	[
		"     $    $    $           ",
		"     $    $    $           ",
		"                           ",
		"                           ",
		"                           ",
		"                           ",
		"     $        $            ",
		"    >==     >==     >==   @",
		"===========================",
	],
  [
  "                             ",
  "                             ",
  " $                  ^^       ",
  "        ^^   $$  ======     @",
  "=============================",
  ],
]

const levelConf = {
	width: 64,
	height: 64,
	"=": () => [
		sprite("grass"),
		area(),
		solid(),
		origin("bot"),
	],
	"$": () => [
		sprite("coin"),
		area(),
		pos(0, -9),
		origin("bot"),
		"coin",
	],
	"%": () => [
		sprite("prize"),
		area(),
		solid(),
		origin("bot"),
		"prize",
	],
	"^": () => [
		sprite("spike"),
		area(),
		solid(),
		origin("bot"),
		"danger",
	],
	"#": () => [
		sprite("apple"),
		area(),
		origin("bot"),
		body(),
		"apple",
	],
	">": () => [
		sprite("ghosty"),
		area(),
		origin("bot"),
		body(),
		patrol(),
		"enemy",
	],
	"@": () => [
		sprite("portal"),
		area({ scale: 0.5, }),
		origin("bot"),
		pos(0, -12),
		"portal",
	],
}

scene("game", ({ levelId, coins } = { levelId: 0, coins: 0 }) => {
	gravity(3200)
	const level = addLevel(LEVELS[levelId ?? 0], levelConf)
	const player = add([
		sprite("bean"),
		pos(0, 0),
		area(),
		scale(1),
		body(),
		big(),
		origin("bot"),
	])
	player.onUpdate(() => {
		camPos(player.pos)
		if (player.pos.y >= FALL_DEATH) {
			go("lose")
		}
	})
	player.onCollide("danger", () => {
		go("lose")
		play("hit")
	})
	player.onCollide("portal", () => {
		play("portal")
		if (levelId + 1 < LEVELS.length) {
			go("game", {
				levelId: levelId + 1,
				coins: coins,
			})
		} else {
			go("win")
		}
	})
	player.onGround((l) => {
		if (l.is("enemy")) {
			player.jump(JUMP_FORCE * 1.5)
			destroy(l)
			addKaboom(player.pos)
			play("powerup")
		}
	})
	player.onCollide("enemy", (e, col) => {
		if (!col.isBottom()) {
			go("lose")
			play("hit")
		}
	})

	let hasApple = false
	player.onHeadbutt((obj) => {
		if (obj.is("prize") && !hasApple) {
			const apple = level.spawn("#", obj.gridPos.sub(0, 1))
			apple.jump()
			hasApple = true
			play("blip")
		}
	})
	player.onCollide("apple", (a) => {
		destroy(a)
		player.biggify(3)
		hasApple = false
		play("powerup")
	})

	let coinPitch = 0

	onUpdate(() => {
		if (coinPitch > 0) {
			coinPitch = Math.max(0, coinPitch - dt() * 100)
		}
	})

	player.onCollide("coin", (c) => {
		destroy(c)
		play("coin", {
			detune: coinPitch,
		})
		coinPitch += 100
		coins += 1
		coinsLabel.text = coins
	})

	const coinsLabel = add([
		text(coins),
		pos(24, 24),
		fixed(),
	])
	onKeyPress("space", () => {
		if (player.isGrounded()) {
			player.jump(JUMP_FORCE)
		}
	})
  onKeyPress("w", () => {
		if (player.isGrounded()) {
			player.jump(JUMP_FORCE)
		}
	})
  onKeyPress("up", () => {
		if (player.isGrounded()) {
			player.jump(JUMP_FORCE)
		}
	})
	onKeyDown("left", () => {
		player.move(-MOVE_SPEED, 0)
	})
  onKeyDown("a", () => {
		player.move(-MOVE_SPEED, 0)
	})
	onKeyDown("right", () => {
		player.move(MOVE_SPEED, 0)
	})
  onKeyDown("d", () => {
		player.move(MOVE_SPEED, 0)
	})
	onKeyPress("down", () => {
		player.weight = 3
	})
  	onKeyPress("s", () => {
		player.weight = 3
	})
	onKeyRelease("down", () => {
		player.weight = 1
	})
	onKeyRelease("s", () => {
		player.weight = 1
	})
	onKeyPress("f", () => {
		fullscreen(!fullscreen())
	})

})
scene("lose", () => {
add([
text("Oldun")
])
add([
	text("[Yeniden baslamak icin herhangi bir tusa bas].green", {
		width: width(),
		styles: {
			"green": {
				color: rgb(128, 128, 255),},
		},
	}),
	pos(pad, height() - pad),
	origin("botleft"),
	// scale(0.5),
])
	onKeyPress(() => go("game"))
})

scene("win", () => {
	add([
text("Tebrikler, Kazandın")
])
add([
	text("[Yeniden baslamak icin herhangi bir tusa bas].green", {
		width: width(),
		styles: {
			"green": {
				color: rgb(128, 128, 255),},
		},
	}),
	pos(pad, height() - pad),
	origin("botleft"),
])
	onKeyPress(() => go("game"))
})

go("game")
