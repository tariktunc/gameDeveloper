import Phaser from 'phaser';

export class XPGem extends Phaser.GameObjects.Sprite {
  public xpValue: number = 0;
  private attractSpeed: number = 0;
  private attracting: boolean = false;
  private targetX: number = 0;
  private targetY: number = 0;
  private baseY: number = 0;
  private bobTime: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, 'xp-gem', 0);
    scene.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setOrigin(0.5, 0.5);
    this.setDepth(3);
  }

  spawn(x: number, y: number, xpValue: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.xpValue = xpValue;
    this.attracting = false;
    this.attractSpeed = 0;
    this.baseY = y;
    this.bobTime = Math.random() * 1000;

    // Color based on value
    if (xpValue >= 10) this.setTint(0xff3333); // red = big
    else if (xpValue >= 5) this.setTint(0x3333ff); // blue = medium
    else this.clearTint(); // green = small (default sprite)
  }

  attract(targetX: number, targetY: number): void {
    this.attracting = true;
    this.targetX = targetX;
    this.targetY = targetY;
    this.attractSpeed = 200;
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    if (!this.attracting) {
      // Bob up/down and pulse scale
      this.bobTime += delta;
      this.y = this.baseY + Math.sin(this.bobTime * 0.004) * 3;
      const scale = 0.9 + Math.sin(this.bobTime * 0.003) * 0.1;
      this.setScale(scale);
      return;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.collect();
      return;
    }

    this.attractSpeed += delta * 0.5; // accelerate
    const speed = this.attractSpeed * (delta / 1000);
    this.x += (dx / dist) * speed;
    this.y += (dy / dist) * speed;
  }

  collect(): void {
    this.setScale(1);
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);
  }

  get isCollected(): boolean {
    return !this.active;
  }
}
