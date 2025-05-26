class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    init() {
        // variables and settings
        this.ACCELERATION = 900;
        this.DRAG = 1000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.MAX_SPEED = 150;
        this.RUN_MULTIPLIER = 1.5;
        this.DASH_VELOCITY = 400;
        this.DASH_DURATION = 150;
        this.DASH_COOLDOWN = 500;
        this.isDashing = false;
        this.canDash = true;
        this.COYOTE_TIME = 100;
        this.JUMP_BUFFER_TIME = 100;
        this.timeSinceGrounded = 0;
        this.jumpBufferTimer = 0;
    }

    create() {
        this.gemCount = 0;
        this.totalGems = 32;
        this.map = this.add.tilemap("map", 18, 18, 180, 100);
        this.tileset = this.map.addTilesetImage("Basic", "tilemap_tiles1");
        this.tileset0 = this.map.addTilesetImage("Background", "tilemap_tiles0");
        
        this.backgroundLayer = this.map.createLayer("Background", this.tileset0, 0, 0);
        this.backgroudobjLayer = this.map.createLayer("BackgroundObj", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        
        
        this.groundLayer.setCollisionByProperty({
            Collides: true
        });

        this.gems = this.map.createFromObjects("Objects", {
            name: "Gem",
            key: "tilemap_sheet",
            frame: 67
        });

        this.spikes = this.map.createFromObjects("Objects", {
            name: "Spike",
            key: "tilemap_sheet",
            frame: 68
        });

        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY);
        this.spikeGroup = this.add.group(this.spikes);

        this.physics.world.enable(this.gems, Phaser.Physics.Arcade.STATIC_BODY);
        this.gemGroup = this.add.group(this.gems);

        my.sprite.player = this.physics.add.sprite(50, 1752, "platformer_characters", "tile_0000.png");
        my.sprite.player.flipX = true;
        this.foregroundLayer = this.map.createLayer("Foreground", this.tileset, 0, 0);
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.gemGlowEmitters = [];

        this.gems.forEach(gem => {
            const emitter = this.add.particles(0, 0, 'kenny-particles', {
                frame: 'star_02.png',
                lifespan: 500,
                speed: { min: 5, max: 20 },
                scale: { start: 0.1, end: 0 },
                alpha: { start: 0.6, end: 0 },
                frequency: 1000,
                emitZone: {
                    type: 'edge',
                    source: new Phaser.Geom.Circle(0, 0, 8),
                    quantity: 6,
                    yoyo: true
                }
            });
            emitter.startFollow(gem);
            this.gemGlowEmitters.push(emitter);
        });

        this.gemEmitters = this.add.particles (0, 0, 'kenny-particles', {
            frame: 'flare_01.png',
            lifespan: 1000,
            speed: { min: -100, max: 100 },
            scale: { start: 0.15, end: 0 }
        });
        this.gemEmitters.stop();

        this.smokeEmitters = this.add.particles (0, 0, 'kenny-particles', {
            frame: 'smoke_01.png',
            lifespan: 500,
            scale: { start: 0.05, end: 0 }
        });
        this.smokeEmitters.stop();

        this.physics.add.overlap(my.sprite.player, this.gemGroup, (obj1, obj2) => {
            const gemIndex = this.gems.indexOf(obj2);
            if (gemIndex !== -1) {
                const emitter = this.gemGlowEmitters[gemIndex];
                emitter.stop();
            }

            const gemx = obj2.x;
            const gemy = obj2.y;
            this.sound.play("collect", {
                volume: 0.5
            });
            obj2.destroy();
            this.gemCount++;
            this.gemEmitters.explode(10, gemx, gemy);
            if (this.gemCount >= this.totalGems) {
                this.playerWins();
            }
        });
        this.physics.add.overlap(my.sprite.player, this.spikeGroup, () => {
            this.sound.play("death", {
                volume: 0.5
            });
            this.playerDies();
        });

        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S
        });
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.jumpKeyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.timeSinceGrounded = this.time.now;

        this.footstepSound = this.sound.add("footstep", { volume: 0.05 });
        this.footstepCooldown = 0;

    }

    update() {
        if (my.sprite.player.body.blocked.down) {
            this.timeSinceGrounded = this.time.now;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.jump) || Phaser.Input.Keyboard.JustDown(this.jumpKeyJ)) {
            this.jumpBufferTimer = this.time.now;
        }
        let accel = this.ACCELERATION;
        let maxSpeed = this.MAX_SPEED;

        if (this.isDashing) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.dashKey) && this.canDash) {
            this.sound.play("dash", {
                volume: 0.5
            });
            this.startDash();
        }

        if (this.shiftKey.isDown) {
            accel *= this.RUN_MULTIPLIER;
            maxSpeed *= this.RUN_MULTIPLIER;
        }

        if (this.cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-accel);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
        } else if (this.cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(accel);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        if (!this.isDashing) {
            if (my.sprite.player.body.velocity.x > maxSpeed) {
                my.sprite.player.body.velocity.x = maxSpeed;
            } else if (my.sprite.player.body.velocity.x < -maxSpeed) {
                my.sprite.player.body.velocity.x = -maxSpeed;
            }
        }
        
        if (this.time.now - this.jumpBufferTimer <= this.JUMP_BUFFER_TIME && this.time.now - this.timeSinceGrounded <= this.COYOTE_TIME) {
            this.sound.play("jump", {
                volume: 0.5
            });
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.smokeEmitters.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
            this.isJumping = true;
            this.jumpBufferTimer = 0;
        }

        if (this.isJumping && (Phaser.Input.Keyboard.JustUp(this.cursors.jump) || Phaser.Input.Keyboard.JustUp(this.jumpKeyJ))) {
            if (my.sprite.player.body.velocity.y < 0) {
                my.sprite.player.body.setVelocityY(my.sprite.player.body.velocity.y * 0.5);
            }
            this.isJumping = false;
        }

        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }

        if (my.sprite.player.body.blocked.down) {
            if (!this.canDash && !this.isDashing) {
                this.canDash = true;
                this.events.emit('playerLanded');
            }
            this.timeSinceGrounded = this.time.now;
        }

        if (my.sprite.player.body.blocked.down && (this.cursors.left.isDown || this.cursors.right.isDown) && !this.isDashing) {
            if (this.time.now > this.footstepCooldown) {
                this.footstepSound.play();
                this.footstepCooldown = this.time.now + 250;
            }
        }
    }

    startDash() {
        const player = my.sprite.player;
        const body = my.sprite.player.body;
        this.isDashing = true;
        this.canDash = false;

        body.allowGravity = false;
        body.setAcceleration(0);
        body.setDrag(0);

        let x = 0;
        let y = 0;

        if (this.cursors.left.isDown) x -= 1;
        if (this.cursors.right.isDown) x += 1;
        if (this.cursors.up.isDown) y -= 1;
        if (this.cursors.down.isDown) y += 1;

        if (x === 0 && y === 0) {
            x = my.sprite.player.flipX ? 1 : -1;
        }

        const length = Math.hypot(x, y);
        const normX = x / length;
        const normY = y / length;

        this.smokeEmitters.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);

        body.setVelocity(normX * this.DASH_VELOCITY, normY * this.DASH_VELOCITY);

        this.time.delayedCall(this.DASH_DURATION, () => {
            this.isDashing = false;
            body.allowGravity = true;
            //body.setVelocity(0);
        });

        this.time.delayedCall(this.DASH_COOLDOWN, () => {
            if (player.body.blocked.down) {
                this.canDash = true;
            } else {
                this.events.once('playerLanded', () => {
                    this.canDash = true;
                });
            }
        });
    }  
    
    playerDies() {
        this.scene.restart();
    }

    playerWins() {
        this.scene.start("Win");
    }
    
}
