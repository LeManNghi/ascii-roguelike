/**
 * ASCII DUNGEON - Procedural Dungeon Map Generator
 * Generates room & corridor dungeons with doors, stairs, and decorations.
 */

const TILE_WALL = '#';
const TILE_FLOOR = '.';
const TILE_DOOR = '+';
const TILE_DOOR_OPEN = '_';
const TILE_STAIRS = '>';
const TILE_WATER = '~';

class Room {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get centerX() {
    return Math.floor(this.x + this.w / 2);
  }

  get centerY() {
    return Math.floor(this.y + this.h / 2);
  }

  intersects(other, padding = 1) {
    return (
      this.x - padding <= other.x + other.w &&
      this.x + this.w + padding >= other.x &&
      this.y - padding <= other.y + other.h &&
      this.y + this.h + padding >= other.y
    );
  }
}

class DungeonMap {
  constructor(width = 60, height = 35, floorNumber = 1) {
    this.width = width;
    this.height = height;
    this.floorNumber = floorNumber;

    this.tiles = [];
    this.explored = [];
    this.rooms = [];
    this.playerStart = { x: 0, y: 0 };
    this.stairsLocation = { x: 0, y: 0 };

    this.initEmpty();
    this.generate();
  }

  initEmpty() {
    this.tiles = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => TILE_WALL)
    );
    this.explored = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => false)
    );
  }

  generate() {
    this.initEmpty();
    this.rooms = [];

    const maxRooms = 9 + Math.floor(Math.random() * 4);
    const minRoomSize = 5;
    const maxRoomSize = 11;

    for (let i = 0; i < maxRooms * 3; i++) {
      const w = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
      const h = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
      const x = 1 + Math.floor(Math.random() * (this.width - w - 2));
      const y = 1 + Math.floor(Math.random() * (this.height - h - 2));

      const newRoom = new Room(x, y, w, h);

      let overlaps = false;
      for (const r of this.rooms) {
        if (newRoom.intersects(r, 2)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        this.digRoom(newRoom);

        if (this.rooms.length > 0) {
          const prevRoom = this.rooms[this.rooms.length - 1];
          this.digCorridor(prevRoom.centerX, prevRoom.centerY, newRoom.centerX, newRoom.centerY);
        }

        this.rooms.push(newRoom);
        if (this.rooms.length >= maxRooms) break;
      }
    }

    // Connect last room to first room for loops in layout
    if (this.rooms.length > 2) {
      const first = this.rooms[0];
      const last = this.rooms[this.rooms.length - 1];
      this.digCorridor(last.centerX, last.centerY, first.centerX, first.centerY);
    }

    // Place Doors at room boundaries
    this.placeDoors();

    // Player starts in first room
    if (this.rooms.length > 0) {
      this.playerStart = {
        x: this.rooms[0].centerX,
        y: this.rooms[0].centerY
      };

      // Stairs in last room
      const lastRoom = this.rooms[this.rooms.length - 1];
      this.stairsLocation = {
        x: lastRoom.centerX,
        y: lastRoom.centerY
      };
      this.tiles[this.stairsLocation.y][this.stairsLocation.x] = TILE_STAIRS;
    }
  }

  digRoom(room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
          this.tiles[y][x] = TILE_FLOOR;
        }
      }
    }
  }

  digCorridor(x1, y1, x2, y2) {
    // Horizontal then vertical or vice versa
    if (Math.random() < 0.5) {
      this.digHorizontal(x1, x2, y1);
      this.digVertical(y1, y2, x2);
    } else {
      this.digVertical(y1, y2, x1);
      this.digHorizontal(x1, x2, y2);
    }
  }

  digHorizontal(x1, x2, y) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
      if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
        this.tiles[y][x] = TILE_FLOOR;
      }
    }
  }

  digVertical(y1, y2, x) {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    for (let y = start; y <= end; y++) {
      if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
        this.tiles[y][x] = TILE_FLOOR;
      }
    }
  }

  placeDoors() {
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.tiles[y][x] === TILE_FLOOR) {
          // Check for narrow doorway: wall on both sides, floor on opposite sides
          const north = this.tiles[y - 1][x];
          const south = this.tiles[y + 1][x];
          const west = this.tiles[y][x - 1];
          const east = this.tiles[y][x + 1];

          const isHorizontalDoorway =
            north === TILE_WALL && south === TILE_WALL &&
            west === TILE_FLOOR && east === TILE_FLOOR;

          const isVerticalDoorway =
            west === TILE_WALL && east === TILE_WALL &&
            north === TILE_FLOOR && south === TILE_FLOOR;

          if ((isHorizontalDoorway || isVerticalDoorway) && Math.random() < 0.35) {
            this.tiles[y][x] = TILE_DOOR;
          }
        }
      }
    }
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const t = this.tiles[y][x];
    return t === TILE_FLOOR || t === TILE_DOOR_OPEN || t === TILE_STAIRS || t === TILE_DOOR;
  }

  isOpaque(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
    const t = this.tiles[y][x];
    return t === TILE_WALL || t === TILE_DOOR;
  }

  openDoor(x, y) {
    if (this.tiles[y][x] === TILE_DOOR) {
      this.tiles[y][x] = TILE_DOOR_OPEN;
      return true;
    }
    return false;
  }
}

window.DungeonMap = DungeonMap;
window.TILE_WALL = TILE_WALL;
window.TILE_FLOOR = TILE_FLOOR;
window.TILE_DOOR = TILE_DOOR;
window.TILE_DOOR_OPEN = TILE_DOOR_OPEN;
window.TILE_STAIRS = TILE_STAIRS;
