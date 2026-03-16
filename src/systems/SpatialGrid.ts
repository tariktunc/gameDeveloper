import { GRID_CELL_SIZE } from '../utils/constants';

export interface SpatialEntity {
  x: number;
  y: number;
  active: boolean;
  width?: number;
  height?: number;
}

export class SpatialGrid<T extends SpatialEntity> {
  private cellSize: number;
  private cells: Map<number, T[]> = new Map();
  private entityCells: Map<T, number[]> = new Map();

  constructor(cellSize: number = GRID_CELL_SIZE) {
    this.cellSize = cellSize;
  }

  private hash(cx: number, cy: number): number {
    return cx * 73856093 + cy * 19349663;
  }

  private getCellCoords(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: Math.floor(x / this.cellSize),
      cy: Math.floor(y / this.cellSize)
    };
  }

  clear(): void {
    this.cells.clear();
    this.entityCells.clear();
  }

  insert(entity: T): void {
    if (!entity.active) return;
    const { cx, cy } = this.getCellCoords(entity.x, entity.y);
    const key = this.hash(cx, cy);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
    this.entityCells.set(entity, [key]);
  }

  insertAll(entities: T[]): void {
    for (const entity of entities) {
      this.insert(entity);
    }
  }

  /** Get all entities in the same cell and neighboring cells */
  query(x: number, y: number, radius: number = 0): T[] {
    const results: T[] = [];
    const { cx: minCx, cy: minCy } = this.getCellCoords(x - radius, y - radius);
    const { cx: maxCx, cy: maxCy } = this.getCellCoords(x + radius, y + radius);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this.hash(cx, cy);
        const cell = this.cells.get(key);
        if (cell) {
          for (const entity of cell) {
            if (entity.active) {
              results.push(entity);
            }
          }
        }
      }
    }
    return results;
  }

  /** Query with circle collision check */
  queryCircle(x: number, y: number, radius: number): T[] {
    const candidates = this.query(x, y, radius);
    const radiusSq = radius * radius;
    return candidates.filter(entity => {
      const dx = entity.x - x;
      const dy = entity.y - y;
      return dx * dx + dy * dy <= radiusSq;
    });
  }
}
