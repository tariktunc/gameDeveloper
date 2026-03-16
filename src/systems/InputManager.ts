import Phaser from 'phaser';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private escKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  public moveX = 0;
  public moveY = 0;
  public pausePressed = false;
  public dashPressed = false;

  /** Mouse position in world coordinates */
  public mouseWorldX = 0;
  public mouseWorldY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    if (!scene.input.keyboard) return;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(): void {
    this.moveX = 0;
    this.moveY = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) this.moveX = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) this.moveX = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) this.moveY = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) this.moveY = 1;

    // Normalize diagonal movement
    if (this.moveX !== 0 && this.moveY !== 0) {
      const len = Math.SQRT2;
      this.moveX /= len;
      this.moveY /= len;
    }

    // Mouse world position
    const pointer = this.scene.input.activePointer;
    this.mouseWorldX = pointer.worldX;
    this.mouseWorldY = pointer.worldY;

    this.pausePressed = Phaser.Input.Keyboard.JustDown(this.escKey);
    this.dashPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }
}
