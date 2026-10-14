/**
 * ASCII DUNGEON - Field of View (FOV) & Line of Sight Algorithm
 * Raycasting-based visibility calculation for authentic roguelike fog of war.
 */

class FOVSystem {
  constructor(mapWidth, mapHeight) {
    this.width = mapWidth;
    this.height = mapHeight;
  }

  compute(originX, originY, radius, isOpaqueCallback) {
    const visibleTiles = new Set();
    visibleTiles.add(`${originX},${originY}`);

    const rayCount = 180;
    const stepSize = 0.5;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i * 2 * Math.PI) / rayCount;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let currentX = originX + 0.5;
      let currentY = originY + 0.5;

      for (let dist = 0; dist <= radius; dist += stepSize) {
        currentX += cosA * stepSize;
        currentY += sinA * stepSize;

        const tileX = Math.floor(currentX);
        const tileY = Math.floor(currentY);

        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
          break;
        }

        visibleTiles.add(`${tileX},${tileY}`);

        // If the tile blocks line of sight (e.g. wall, closed door)
        if (isOpaqueCallback(tileX, tileY)) {
          break;
        }
      }
    }

    return visibleTiles;
  }
}

window.FOVSystem = FOVSystem;
