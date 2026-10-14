/**
 * ASCII DUNGEON - Entities, Monsters, Items & Player Classes
 */

class Entity {
  constructor(x, y, char, color, name) {
    this.x = x;
    this.y = y;
    this.char = char;
    this.color = color;
    this.name = name;
  }
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y, '@', '#ffffff', 'Hiệp Sĩ');
    this.level = 1;
    this.hp = 35;
    this.maxHp = 35;
    this.mp = 15;
    this.maxMp = 15;
    this.baseAtk = 5;
    this.baseDef = 1;
    this.xp = 0;
    this.maxXp = 40;
    this.gold = 0;
    this.turns = 0;
    this.kills = 0;

    this.equipped = {
      weapon: { name: 'Dao Găm Cũ Kỹ', bonusAtk: 2, icon: '/' },
      armor: { name: 'Áo Vải Bố', bonusDef: 1, icon: '[' },
      ring: null
    };

    this.inventory = [
      new Item(0, 0, '!', '#ff4444', 'Bình Máu (HP)', 'POTION_HP', 25),
      new Item(0, 0, '!', '#38bdf8', 'Bình Năng Lượng (MP)', 'POTION_MP', 15),
      new Item(0, 0, '?', '#f59e0b', 'Cuộn Giấy Cầu Lửa', 'SCROLL_FIRE', 28)
    ];
  }

  get totalAtk() {
    let atk = this.baseAtk;
    if (this.equipped.weapon) atk += this.equipped.weapon.bonusAtk;
    if (this.equipped.ring && this.equipped.ring.bonusAtk) atk += this.equipped.ring.bonusAtk;
    return atk;
  }

  get totalDef() {
    let def = this.baseDef;
    if (this.equipped.armor) def += this.equipped.armor.bonusDef;
    if (this.equipped.ring && this.equipped.ring.bonusDef) def += this.equipped.ring.bonusDef;
    return def;
  }

  heal(amount) {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prev;
  }

  restoreMana(amount) {
    const prev = this.mp;
    this.mp = Math.min(this.maxMp, this.mp + amount);
    return this.mp - prev;
  }

  takeDamage(amount) {
    const actual = Math.max(1, amount - this.totalDef);
    this.hp = Math.max(0, this.hp - actual);
    return actual;
  }

  gainXp(amount) {
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.maxXp) {
      this.xp -= this.maxXp;
      this.level++;
      this.maxXp = Math.floor(this.maxXp * 1.5);
      this.maxHp += 8;
      this.hp = this.maxHp;
      this.maxMp += 4;
      this.mp = this.maxMp;
      this.baseAtk += 2;
      this.baseDef += 1;
      leveledUp = true;
    }
    return leveledUp;
  }

  addItem(item) {
    if (this.inventory.length >= 10) return false;
    this.inventory.push(item);
    return true;
  }

  removeItem(index) {
    if (index >= 0 && index < this.inventory.length) {
      return this.inventory.splice(index, 1)[0];
    }
    return null;
  }
}

class Monster extends Entity {
  constructor(x, y, char, color, name, hp, atk, def, xpReward, isRanged = false) {
    super(x, y, char, color, name);
    this.hp = hp;
    this.maxHp = hp;
    this.atk = atk;
    this.def = def;
    this.xpReward = xpReward;
    this.isRanged = isRanged;
    this.aggro = false;
  }

  takeDamage(amount) {
    const actual = Math.max(1, amount - this.def);
    this.hp = Math.max(0, this.hp - actual);
    this.aggro = true;
    return actual;
  }
}

class Item extends Entity {
  constructor(x, y, char, color, name, type, value, extraProps = {}) {
    super(x, y, char, color, name);
    this.type = type;
    this.value = value;
    this.extraProps = extraProps;
  }
}

// Monster Templates by Floor
const MONSTER_TEMPLATES = [
  // Tier 1 (Floor 1-2)
  { char: 'b', color: '#94a3b8', name: 'Dơi Khổng Lồ', hp: 10, atk: 4, def: 0, xp: 6, minFloor: 1, maxFloor: 2 },
  { char: 'g', color: '#4ade80', name: 'Yêu Tinh Hang Động', hp: 16, atk: 6, def: 2, xp: 10, minFloor: 1, maxFloor: 3 },
  { char: 's', color: '#e2e8f0', name: 'Lính Xương Khô', hp: 22, atk: 8, def: 3, xp: 16, minFloor: 1, maxFloor: 4 },
  
  // Tier 2 (Floor 2-4)
  { char: 'o', color: '#f97316', name: 'Chiến Binh Orc', hp: 32, atk: 11, def: 5, xp: 25, minFloor: 2, maxFloor: 5 },
  { char: 'm', color: '#c084fc', name: 'Pháp Sư Bóng Đêm', hp: 24, atk: 12, def: 3, xp: 30, minFloor: 2, maxFloor: 5, isRanged: true },
  { char: 'M', color: '#ef4444', name: 'Quái Vật Nhân Ngưu', hp: 60, atk: 20, def: 6, xp: 45, minFloor: 3, maxFloor: 5 },

  // Boss (Floor 5)
  { char: 'D', color: '#ff2222', name: 'Chúa Tể Malgok', hp: 250, atk: 32, def: 15, xp: 150, minFloor: 5, maxFloor: 5 }
];

// Item Templates
const ITEM_TEMPLATES = [
  // Potions
  { char: '!', color: '#ff4444', name: 'Bình Máu (HP)', type: 'POTION_HP', value: 25, weight: 35 },
  { char: '!', color: '#38bdf8', name: 'Bình Năng Lượng (MP)', type: 'POTION_MP', value: 15, weight: 25 },
  
  // Scrolls
  { char: '?', color: '#f59e0b', name: 'Cuộn Giấy Cầu Lửa', type: 'SCROLL_FIRE', value: 30, weight: 15 },
  { char: '?', color: '#a855f7', name: 'Cuộn Giấy Dịch Chuyển', type: 'SCROLL_TELEPORT', value: 0, weight: 12 },

  // Weapons
  { char: '/', color: '#38bdf8', name: 'Đoản Kiếm Sắt', type: 'WEAPON', value: 5, weight: 12, slot: 'weapon' },
  { char: '/', color: '#a855f7', name: 'Hắc Diệu Kiếm', type: 'WEAPON', value: 9, weight: 6, slot: 'weapon' },
  { char: '/', color: '#facc15', name: 'Thánh Kiếm Thái Dương', type: 'WEAPON', value: 14, weight: 3, slot: 'weapon' },

  // Armor
  { char: '[', color: '#94a3b8', name: 'Áo Giáp Xích', type: 'ARMOR', value: 3, weight: 10, slot: 'armor' },
  { char: '[', color: '#38bdf8', name: 'Giáp Vảy Rồng', type: 'ARMOR', value: 6, weight: 5, slot: 'armor' },

  // Ring
  { char: '=', color: '#ec4899', name: 'Nhẫn Quyền Năng (+3 Công/+2 Thủ)', type: 'RING', value: 3, weight: 5, slot: 'ring', extraProps: { bonusAtk: 3, bonusDef: 2 } }
];

function createRandomMonster(x, y, floor) {
  const eligible = MONSTER_TEMPLATES.filter(m => floor >= m.minFloor && floor <= m.maxFloor);
  const t = eligible[Math.floor(Math.random() * eligible.length)];
  return new Monster(x, y, t.char, t.color, t.name, t.hp, t.atk, t.def, t.xp, !!t.isRanged);
}

function createBossMonster(x, y) {
  const t = MONSTER_TEMPLATES.find(m => m.char === 'D');
  return new Monster(x, y, t.char, t.color, t.name, t.hp, t.atk, t.def, t.xp, false);
}

function createRandomItem(x, y) {
  const totalWeight = ITEM_TEMPLATES.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const t of ITEM_TEMPLATES) {
    if (rand < t.weight) {
      return new Item(x, y, t.char, t.color, t.name, t.type, t.value, { slot: t.slot, ...t.extraProps });
    }
    rand -= t.weight;
  }
  const fallback = ITEM_TEMPLATES[0];
  return new Item(x, y, fallback.char, fallback.color, fallback.name, fallback.type, fallback.value);
}

window.Player = Player;
window.Monster = Monster;
window.Item = Item;
window.createRandomMonster = createRandomMonster;
window.createBossMonster = createBossMonster;
window.createRandomItem = createRandomItem;
