import Phaser from 'phaser';
import { WeaponBase } from '../WeaponBase';
import { Player } from '../../entities/Player';
import { Enemy } from '../../entities/Enemy';

interface HolyWaterPool {
  x: number;
  y: number;
  radius: number;
  lifetime: number;
  maxLifetime: number;
  damage: number;
  tickTimer: number;
}

export class HolyWater extends WeaponBase {
  private enemies: Enemy[];
  private pools: HolyWaterPool[] = [];
  private poolGraphics: Phaser.GameObjects.Graphics;
  private readonly POOL_DURATION = 3000;
  private readonly TICK_INTERVAL = 300;

  constructor(scene: Phaser.Scene, owner: Player, enemies: Enemy[]) {
    super(scene, owner, {
      id: 'holy_water',
      name: 'Kutsal Su',
      damage: 12,
      cooldown: 2500,
      projectileSpeed: 0,
      projectileCount: 1,
      pierce: 0,
      range: 250,
      type: 'area'
    });
    this.enemies = enemies;
    this.poolGraphics = scene.add.graphics().setDepth(2);
  }

  update(delta: number): void {
    super.update(delta);

    for (let i = this.pools.length - 1; i >= 0; i--) {
      const pool = this.pools[i];
      pool.lifetime += delta;
      pool.tickTimer += delta;

      if (pool.tickTimer >= this.TICK_INTERVAL) {
        pool.tickTimer = 0;
        this.damageInArea(pool);
      }

      if (pool.lifetime >= pool.maxLifetime) {
        this.pools.splice(i, 1);
      }
    }

    this.drawPools();
  }

  attack(): void {
    // Hedef bul — yoksa ateş etme
    let targetX = -1;
    let targetY = -1;
    let nearestDist = this.data.range * this.data.range;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDist) {
        nearestDist = distSq;
        targetX = enemy.x;
        targetY = enemy.y;
      }
    }

    if (targetX === -1) return; // Menzilde düşman yok

    const poolRadius = 60 + this.level * 5;
    const poolDamage = this.effectiveDamage;
    this.throwFlask(targetX, targetY, poolRadius, poolDamage);
  }

  /** Şişeyi fırlat: uçuş animasyonu → çarpma → havuz */
  private throwFlask(targetX: number, targetY: number, poolRadius: number, poolDamage: number): void {
    // Uçan şişe grafiği
    const flask = this.scene.add.graphics().setDepth(15);

    // Başlangıç yükseklik ofseti (yay efekti için)
    const startX = this.owner.x;
    const startY = this.owner.y;

    // Uçuş süresi mesafeye göre (min 300ms, max 600ms)
    const dist = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
    const duration = Math.min(600, Math.max(300, dist * 1.2));

    // Yay yüksekliği
    const arcHeight = Math.min(80, dist * 0.35);

    let elapsed = 0;
    let rotation = 0;

    // Her frame şişeyi çiz
    const updateFlask = (_time: number, delta: number) => {
      elapsed += delta;
      const t = Math.min(elapsed / duration, 1);
      rotation += delta * 0.012;

      // Parabolik yay: lerp + quadratic arc
      const x = startX + (targetX - startX) * t;
      const baseY = startY + (targetY - startY) * t;
      const arcY = baseY - arcHeight * Math.sin(Math.PI * t); // yay

      // Şişeyi çiz (küçük daire + içi parlak)
      flask.clear();

      // Gölge (zemine yansıma)
      const shadowScale = 0.4 + t * 0.6;
      flask.fillStyle(0x000000, 0.15 * shadowScale);
      flask.fillEllipse(x, baseY + 4, 14 * shadowScale, 6 * shadowScale);

      // Şişe gövdesi (dönen küçük + şekli)
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      flask.fillStyle(0x44aaff, 0.9);
      flask.fillEllipse(x, arcY, 10, 14);
      // Parlak yüzey
      flask.fillStyle(0xaaddff, 0.6);
      flask.fillEllipse(x - 2 * cos, arcY - 2 * sin, 4, 6);
      // Tıpa
      flask.fillStyle(0xffd966, 1);
      flask.fillRect(x - 2, arcY - 8, 4, 3);

      if (t >= 1) {
        this.scene.events.off('update', updateFlask);
        flask.destroy();
        this.onFlaskLand(x, baseY, poolRadius, poolDamage);
      }
    };

    this.scene.events.on('update', updateFlask);
  }

  /** Şişe yere çarptığında: splash burst + havuz oluştur */
  private onFlaskLand(x: number, y: number, poolRadius: number, poolDamage: number): void {
    // Splash burst animasyonu
    this.showSplash(x, y, poolRadius);

    // Havuzu ekle
    this.pools.push({
      x, y,
      radius: poolRadius,
      lifetime: 0,
      maxLifetime: this.POOL_DURATION,
      damage: poolDamage,
      tickTimer: 0
    });
  }

  /** Çarpma anındaki sıçrama efekti */
  private showSplash(x: number, y: number, radius: number): void {
    const splashGfx = this.scene.add.graphics().setDepth(14);

    // Birden fazla damlacık fırla
    const dropCount = 8;
    interface Drop { angle: number; dist: number; size: number }
    const drops: Drop[] = [];
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        angle: (i / dropCount) * Math.PI * 2,
        dist: 0,
        size: 3 + Math.random() * 4
      });
    }

    const maxDist = radius * 0.7;
    const duration = 350;
    let elapsed = 0;

    const updateSplash = (_time: number, delta: number) => {
      elapsed += delta;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t); // ease-out

      splashGfx.clear();

      // Ana genişleme halkası
      const ringAlpha = (1 - t) * 0.8;
      splashGfx.lineStyle(3, 0x66ccff, ringAlpha);
      splashGfx.strokeCircle(x, y, radius * eased * 0.6);

      splashGfx.lineStyle(1.5, 0xaaddff, ringAlpha * 0.5);
      splashGfx.strokeCircle(x, y, radius * eased * 0.35);

      // Damlacıklar
      for (const drop of drops) {
        drop.dist = maxDist * eased;
        const dx = x + Math.cos(drop.angle) * drop.dist;
        const dy = y + Math.sin(drop.angle) * drop.dist - drop.dist * 0.3; // hafif yukarı yay
        const dropAlpha = (1 - t) * 0.9;
        const dropSize = drop.size * (1 - t * 0.5);

        splashGfx.fillStyle(0x44aaff, dropAlpha);
        splashGfx.fillCircle(dx, dy, dropSize);
        splashGfx.fillStyle(0xcceeff, dropAlpha * 0.6);
        splashGfx.fillCircle(dx - 1, dy - 1, dropSize * 0.4);
      }

      if (t >= 1) {
        this.scene.events.off('update', updateSplash);
        splashGfx.destroy();
      }
    };

    this.scene.events.on('update', updateSplash);
  }

  private damageInArea(pool: HolyWaterPool): void {
    const radiusSq = pool.radius * pool.radius;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - pool.x;
      const dy = enemy.y - pool.y;
      if (dx * dx + dy * dy <= radiusSq) {
        const killed = enemy.takeDamage(pool.damage);
        this.onMeleeHit?.(enemy, pool.damage);
        if (killed) this.onEnemyKilled?.(enemy);
      }
    }
  }

  private drawPools(): void {
    this.poolGraphics.clear();
    for (const pool of this.pools) {
      const progress = pool.lifetime / pool.maxLifetime;
      const alpha = 0.35 * (1 - progress);
      const pulse = 1 + Math.sin(pool.lifetime * 0.008) * 0.08;

      // Zemin suyu efekti — elips (perspektif hissi)
      this.poolGraphics.fillStyle(0x1a88ff, alpha * 0.7);
      this.poolGraphics.fillEllipse(pool.x, pool.y, pool.radius * 2 * pulse, pool.radius * 1.3 * pulse);

      // Dış halka
      this.poolGraphics.lineStyle(2, 0x66ccff, alpha + 0.2);
      this.poolGraphics.strokeEllipse(pool.x, pool.y, pool.radius * 2 * pulse, pool.radius * 1.3 * pulse);

      // İç parlaklık
      this.poolGraphics.fillStyle(0x99ddff, alpha * 0.4);
      this.poolGraphics.fillEllipse(pool.x, pool.y, pool.radius * pulse, pool.radius * 0.65 * pulse);

      // Kalan süre göstergesi — dış çember solar
      this.poolGraphics.lineStyle(1, 0x3399ff, alpha * 0.5);
      this.poolGraphics.strokeEllipse(pool.x, pool.y, pool.radius * 2.2, pool.radius * 1.45);
    }
  }

  protected applyLevelUpBonus(): void {
    super.applyLevelUpBonus();
    this.data.range += 20;
  }
}
