class Begin extends Phaser.Scene {
    constructor() {
        super('Begin');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2 - 50, 'You must Collect all 32 Gems', {
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 50, 'A and D to move left and right\nSpace to jump and shift to sprint\nPress K and a direction to dash', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 150, 'Press SPACE to Start', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 250, 'PS. There is a wierd visual bug when I use this.add.text that causes the gridlines to show.\nI dont know how to fix it :(', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Load');
        });
    }
}