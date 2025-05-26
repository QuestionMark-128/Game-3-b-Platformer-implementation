class Win extends Phaser.Scene {
    constructor() {
        super('Win');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2 - 50, 'You Win!', {
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 50, 'Press SPACE to restart', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Begin'); // Restart the game or go to another scene
        });
    }
}