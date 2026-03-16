import Phaser from 'phaser';

export class ObjectPool<T extends Phaser.GameObjects.GameObject & { active: boolean }> {
  private pool: T[] = [];
  private activeItems: Set<T> = new Set();
  private factory: () => T;

  constructor(factory: () => T, initialSize: number) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      const item = this.factory();
      item.setActive(false);
      (item as any).setVisible?.(false);
      this.pool.push(item);
    }
  }

  get(): T {
    let item = this.pool.find(i => !i.active);
    if (!item) {
      // No limit — grow pool as needed
      item = this.factory();
      item.setActive(false);
      (item as any).setVisible?.(false);
      this.pool.push(item);
    }
    item.setActive(true);
    (item as any).setVisible?.(true);
    this.activeItems.add(item);
    return item;
  }

  release(item: T): void {
    item.setActive(false);
    (item as any).setVisible?.(false);
    this.activeItems.delete(item);
  }

  getActive(): T[] {
    return Array.from(this.activeItems);
  }

  get activeCount(): number {
    return this.activeItems.size;
  }

  forEach(callback: (item: T) => void): void {
    this.activeItems.forEach(callback);
  }

  releaseAll(): void {
    this.activeItems.forEach(item => {
      item.setActive(false);
      (item as any).setVisible?.(false);
    });
    this.activeItems.clear();
  }
}
