PlayState = {};


PlayState._spawnCharacters = function (data) {

    // spawn hero
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
// spawn spiders
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
};

function Hero(game, x, y) {
    // 
    Phaser.Sprite.call(this, game, x, y, 'hero');
	//hero positionieren
	this.anchor.set(0.5, 0.5);
	//Engine
    this.game.physics.enable(this);
    //nicht weiter als Rand
    this.body.collideWorldBounds = true;
}
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

//load game assets here
PlayState.preload = function () {
	// main character laden
	this.game.load.image('hero', 'images/hero_stopped.png');
	//
    this.game.load.image('background', 'images/background.png');
    //
	this.game.load.json('level:1', 'data/level01.json');
    //Bilder für Plattformen laden
	this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    //sfx
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    //Coin spritesheet
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    //Spinnen spritesheet
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    //unsichtbare Wände
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
};

// create game entities and set up world here
PlayState.create = function () {
    //Objekt für sfx
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin')
    };
    //Hintergrund
    this.game.add.image(0, 0, 'background');
    //
	this._loadLevel(this.game.cache.getJSON('level:1'));

};

PlayState._loadLevel = function (data) {
    // Gruppen
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;
    //  spawnen
    this._spawnCharacters({hero: data.hero, spiders: data.spiders});
	//alle Plattformen spawnen
	data.platforms.forEach(this._spawnPlatform, this);
	//Coins
    data.coins.forEach(this._spawnCoin, this);
    //Schwerkraft
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play');
};

PlayState._spawnPlatform = function (platform) {
    this.game.add.sprite(platform.x, platform.y, platform.image);
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState.init = function () {
    //Tastatur input
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });
    //
    this.game.renderer.renderSession.roundPixels = true;
    this.keys.up.onDown.add(function(){
        let didJump = this.hero.jump();
        if(didJump){
            this.sfx.jump.play();
        }
    }, this);

};

Hero.prototype.move = function (direction) {
    this.x += direction * 2.5; //bewegt sich 2,5 Pixel pro frame
    //
    const SPEED = 200;
    this.body.velocity.x = direction * SPEED;
};
PlayState.update = function (){
    this._handleCollisions();
    this._handleInput();
};

PlayState._handleInput = function () {
    //wenn linke Pfeiltaste gedrückt ist, bewegt er sich nach links
    if (this.keys.left.isDown){
        this.hero.move(-1);
    }
    //wenn rechte Pfeiltaste gedrückt ist, bewegt er sich nach rechts
    else if (this.keys.right.isDown){
        this.hero.move(1);
    }
    //sonst nicht bewegen
    else{
        this.hero.move(0);
    }
};
PlayState._handleCollisions = function () {
    //
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);
    //
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    //
    this.game.physics.arcade.collide(this.hero, this.platforms);
    //
    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin,
        null, this);
};

Hero.prototype.jump = function(){
    const JUMP_SPEED = 600;
    let canJump = this.body.touching.down;

    if(canJump){
        this.body.velocity.y = -JUMP_SPEED;
    }
    return canJump;
};
PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    //Animation
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true);
    sprite.animations.play('rotate');
    //
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};
PlayState._onHeroVsCoin = function (her, coin) {
    this.sfx.coin.play();
    coin.kill();
}
function Spider(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');
    // anchor
    this.anchor.set(0.5);
    // animation
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // physic properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Spider.SPEED;
}
Spider.SPEED = 100;
//
Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
    //wenn sie an der rechten Wand ist, dreht sie sich nach links
    if (this.body.touching.right || this.body.blocked.right){
        this.body.velocity.x = -Spider.SPEED;
    }
    //wenn sie an der linken Wand ist, dreht sie sich nach rechts
    else if(this.body.touching.left || this.body.blocked.left){
        this.body.velocity.x = Spider.SPEED;
    }
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    //
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);
    //
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};