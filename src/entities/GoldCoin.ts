import Phaser from 'phaser';

export class GoldCoin extends Phaser.GameObjects.Graphics {
  public goldValue: number = 0;
  private attractSpeed: number = 0;
  private attracting: boolean = false;
  private targetX: number = 0;
  private targetY: number = 0;
  private spinTime: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setDepth(3);
    this.setPosition(-100, -100);
  }

  spawn(x: number, y: number, goldValue: number): void {
    this.clear();
    // Draw a spinning gold diamond
    this.fillStyle(0xffcc00, 1);
    this.fillPoints([{x:0,y:-5},{x:4,y:0},{x:0,y:5},{x:-4,y:0}], true);
    this.lineStyle(1.5, 0xffee44, 1);
    this.strokePoints([{x:0,y:-5},{x:4,y:0},{x:0,y:5},{x:-4,y:0}], true);
    // Inner shine
    this.fillStyle(0xffffaa, 0.5);
    this.fillPoints([{x:0,y:-2},{x:1.5,y:0},{x:0,y:2},{x:-1.5,y:0}], true);

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.goldValue = goldValue;
    this.attracting = false;
    this.attractSpeed = 0;
    this.spinTime = Math.random() * 1000;
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
      // Spin the diamond
      this.spinTime += delta;
      this.rotation = this.spinTime * 0.003;
      return;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.collect();
      return;
    }

    this.attractSpeed += delta * 0.5;
    const speed = this.attractSpeed * (delta / 1000);
    this.x += (dx / dist) * speed;
    this.y += (dy / dist) * speed;
  }

  collect(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);
  }
}
