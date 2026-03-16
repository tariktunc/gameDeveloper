import Phaser from 'phaser';

export class DamageNumber extends Phaser.GameObjects.Text {
  private lifetime: number = 0;
  private maxLifetime: number = 800;
  private vy: number = -30;

  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, '', { fontSize: '16px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold' });
    scene.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setOrigin(0.5, 0.5);
    this.setDepth(100);
  }

  show(x: number, y: number, amount: number, isCrit: boolean = false): void {
    this.setPosition(x, y - 8);
    this.setActive(true);
    this.setVisible(true);
    this.setText(Math.round(amount).toString());
    this.lifetime = 0;
    this.setAlpha(1);

    if (isCrit) {
      this.setColor('#ffcc00');
      this.setFontSize(24);
    } else {
      this.setColor('#ffffff');
      this.setFontSize(16);
    }
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    this.lifetime += delta;
    this.y += this.vy * (delta / 1000);

    // Fade out
    const progress = this.lifetime / this.maxLifetime;
    this.setAlpha(1 - progress);

    if (this.lifetime >= this.maxLifetime) {
      this.setActive(false);
      this.setVisible(false);
      this.setPosition(-100, -100);
    }
  }
}
