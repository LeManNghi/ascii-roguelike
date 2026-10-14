/**
 * ASCII DUNGEON - Core Game Loop & Turn Controller (Tiếng Việt)
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('dungeon-canvas');
    this.ui = new UIManager(this.canvas);
    this.fov = new FOVSystem(60, 35);
    
    this.currentFloor = 1;
    this.maxFloors = 5;
    this.map = null;
    this.player = null;
    this.monsters = [];
    this.items = [];
    this.visibleTiles = new Set();

    this.isGameOver = false;
    this.isVictory = false;

    this.bindEvents();
    this.startNewGame();
  }

  startNewGame() {
    this.currentFloor = 1;
    this.isGameOver = false;
    this.isVictory = false;

    const modal = document.getElementById('modal-gameover');
    if (modal) modal.classList.add('hidden');

    this.map = new DungeonMap(60, 35, this.currentFloor);
    this.player = new Player(this.map.playerStart.x, this.map.playerStart.y);

    this.setupFloor();
    this.ui.logMessage('Chào mừng Hiệp Sĩ! Hãy dấn thân vào bóng tối và đoạt lại Cổ Vật Amulet of Code.', 'system');
    this.ui.logMessage('Dùng WASD/Mũi tên để di chuyển, đi thẳng vào quái vật để tấn công cận chiến!', 'system');
  }

  setupFloor() {
    this.monsters = [];
    this.items = [];

    // Place player at start
    this.player.x = this.map.playerStart.x;
    this.player.y = this.map.playerStart.y;

    // Spawn monsters and items in rooms (skip room 0 where player starts)
    for (let i = 1; i < this.map.rooms.length; i++) {
      const room = this.map.rooms[i];

      // Spawn 1-3 monsters per room
      const monsterCount = 1 + Math.floor(Math.random() * 2);
      for (let m = 0; m < monsterCount; m++) {
        const mx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const my = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (this.map.isWalkable(mx, my) && !this.getMonsterAt(mx, my)) {
          this.monsters.push(createRandomMonster(mx, my, this.currentFloor));
        }
      }

      // 60% chance to spawn item in room
      if (Math.random() < 0.6) {
        const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (this.map.isWalkable(ix, iy) && !this.getItemAt(ix, iy)) {
          this.items.push(createRandomItem(ix, iy));
        }
      }

      // 40% chance to spawn gold pile
      if (Math.random() < 0.4) {
        const gx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (this.map.isWalkable(gx, gy) && !this.getItemAt(gx, gy)) {
          const goldVal = 10 + Math.floor(Math.random() * 25) * this.currentFloor;
          this.items.push(new Item(gx, gy, '$', '#facc15', `${goldVal} Tiền Vàng`, 'GOLD', goldVal));
        }
      }
    }

    // Boss on Floor 5
    if (this.currentFloor === this.maxFloors) {
      const lastRoom = this.map.rooms[this.map.rooms.length - 1];
      const boss = createBossMonster(lastRoom.centerX, lastRoom.centerY - 1);
      this.monsters.push(boss);
      this.ui.logMessage('⚠️ Tiếng gầm kinh hoàng rung chuyển đất đá! Chúa Tể Malgok đang chờ đợi bạn!', 'warning');
    }

    this.recomputeFOV();
    this.render();
  }

  recomputeFOV() {
    this.visibleTiles = this.fov.compute(
      this.player.x,
      this.player.y,
      8, // 8 tiles view radius
      (x, y) => this.map.isOpaque(x, y)
    );

    // Mark visible tiles as explored
    for (const key of this.visibleTiles) {
      const [tx, ty] = key.split(',').map(Number);
      if (tx >= 0 && tx < this.map.width && ty >= 0 && ty < this.map.height) {
        this.map.explored[ty][tx] = true;
      }
    }
  }

  getMonsterAt(x, y) {
    return this.monsters.find(m => m.x === x && m.y === y);
  }

  getItemAt(x, y) {
    return this.items.find(i => i.x === x && i.y === y);
  }

  // Handle Player Action
  handleMove(dx, dy) {
    if (this.isGameOver) return;

    window.soundEngine.ensureContext();
    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;

    // Check for Monster (Melee Attack)
    const targetMonster = this.getMonsterAt(targetX, targetY);
    if (targetMonster) {
      this.attackMonster(targetMonster);
      this.endPlayerTurn();
      return;
    }

    // Check for Door
    if (this.map.tiles[targetY] && this.map.tiles[targetY][targetX] === TILE_DOOR) {
      this.map.openDoor(targetX, targetY);
      this.ui.logMessage('Bạn mở cánh cửa gỗ nặng nề.', 'system');
      window.soundEngine.playStep();
      this.endPlayerTurn();
      return;
    }

    // Check Walkable
    if (this.map.isWalkable(targetX, targetY)) {
      this.player.x = targetX;
      this.player.y = targetY;
      window.soundEngine.playStep();

      // Check Item pickup
      const item = this.getItemAt(targetX, targetY);
      if (item) {
        this.pickupItem(item);
      }

      this.endPlayerTurn();
    }
  }

  attackMonster(monster) {
    window.soundEngine.playAttack();
    const damage = Math.max(1, this.player.totalAtk - monster.def + Math.floor(Math.random() * 3) - 1);
    const actual = monster.takeDamage(damage);

    this.ui.spawnFloatingNumber(monster.x, monster.y, `-${actual}`, 'dmg');
    this.ui.logMessage(`Bạn chém ${monster.name} gây ${actual} sát thương!`, 'combat');

    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  killMonster(monster) {
    window.soundEngine.playMonsterDeath();
    this.ui.logMessage(`☠ ${monster.name} đã ngã gục tan biến! (+${monster.xpReward} XP)`, 'loot');
    this.player.kills++;

    const leveledUp = this.player.gainXp(monster.xpReward);
    if (leveledUp) {
      window.soundEngine.playLevelUp();
      this.ui.logMessage(`★ THĂNG CẤP! Bạn đạt Cấp ${this.player.level}! Máu, Năng lượng và Sức mạnh tăng vọt!`, 'system');
      this.ui.spawnFloatingNumber(this.player.x, this.player.y, 'LÊN CẤP!', 'heal');
    }

    // Boss Kill condition
    if (monster.char === 'D') {
      this.triggerVictory();
    }

    this.monsters = this.monsters.filter(m => m !== monster);
  }

  pickupItem(item) {
    if (item.type === 'GOLD') {
      this.player.gold += item.value;
      this.ui.logMessage(`💰 Thu thập được ${item.value} Tiền Vàng!`, 'loot');
      this.ui.spawnFloatingNumber(this.player.x, this.player.y, `+${item.value} 🪙`, 'info');
      window.soundEngine.playPickup();
      this.items = this.items.filter(i => i !== item);
    } else {
      if (this.player.addItem(item)) {
        this.ui.logMessage(`Nhặt được ${item.name}.`, 'loot');
        this.ui.spawnFloatingNumber(this.player.x, this.player.y, `+${item.name}`, 'info');
        window.soundEngine.playPickup();
        this.items = this.items.filter(i => i !== item);
      } else {
        this.ui.logMessage('Túi đồ của bạn đã đầy (tối đa 10 món)!', 'warning');
      }
    }
  }

  useInventoryItem(index) {
    if (this.isGameOver) return;
    const item = this.player.inventory[index];
    if (!item) return;

    if (item.type === 'POTION_HP') {
      const healed = this.player.heal(item.value);
      this.ui.logMessage(`Bạn uống ${item.name} và hồi phục ${healed} Máu!`, 'magic');
      this.ui.spawnFloatingNumber(this.player.x, this.player.y, `+${healed} HP`, 'heal');
      window.soundEngine.playHeal();
      this.player.removeItem(index);
      this.endPlayerTurn();
    } else if (item.type === 'POTION_MP') {
      const restored = this.player.restoreMana(item.value);
      this.ui.logMessage(`Bạn uống ${item.name} và hồi phục ${restored} Mana!`, 'magic');
      this.ui.spawnFloatingNumber(this.player.x, this.player.y, `+${restored} MP`, 'mana');
      window.soundEngine.playHeal();
      this.player.removeItem(index);
      this.endPlayerTurn();
    } else if (item.type === 'SCROLL_FIRE') {
      this.castFireballScroll();
      this.player.removeItem(index);
      this.endPlayerTurn();
    } else if (item.type === 'SCROLL_TELEPORT') {
      this.castTeleport();
      this.player.removeItem(index);
      this.endPlayerTurn();
    } else if (item.type === 'WEAPON') {
      const old = this.player.equipped.weapon;
      this.player.equipped.weapon = { name: item.name, bonusAtk: item.value, icon: item.char };
      this.player.removeItem(index);
      if (old && old.name !== 'Dao Găm Cũ Kỹ') {
        this.player.addItem(new Item(0, 0, '/', '#38bdf8', old.name, 'WEAPON', old.bonusAtk));
      }
      this.ui.logMessage(`Trang bị vũ khí: ${item.name} (+${item.value} Công)!`, 'system');
      window.soundEngine.playPickup();
      this.endPlayerTurn();
    } else if (item.type === 'ARMOR') {
      const old = this.player.equipped.armor;
      this.player.equipped.armor = { name: item.name, bonusDef: item.value, icon: item.char };
      this.player.removeItem(index);
      if (old && old.name !== 'Áo Vải Bố') {
        this.player.addItem(new Item(0, 0, '[', '#94a3b8', old.name, 'ARMOR', old.bonusDef));
      }
      this.ui.logMessage(`Mặc giáp trụ: ${item.name} (+${item.value} Thủ)!`, 'system');
      window.soundEngine.playPickup();
      this.endPlayerTurn();
    } else if (item.type === 'RING') {
      this.player.equipped.ring = { name: item.name, bonusAtk: 3, bonusDef: 2 };
      this.player.removeItem(index);
      this.ui.logMessage(`Đeo nhẫn thần bí: ${item.name}!`, 'system');
      window.soundEngine.playPickup();
      this.endPlayerTurn();
    }
  }

  // Spells
  castFireball() {
    if (this.isGameOver) return;
    const cost = 5;
    if (this.player.mp < cost) {
      this.ui.logMessage('Không đủ Năng Lượng để bắn Cầu Lửa! (Yêu cầu 5 MP)', 'warning');
      return;
    }

    // Find closest monster in FOV
    const visibleMonsters = this.monsters.filter(m => this.visibleTiles.has(`${m.x},${m.y}`));
    if (visibleMonsters.length === 0) {
      this.ui.logMessage('Không có quái vật nào trong tầm mắt để thiêu đốt!', 'warning');
      return;
    }

    this.player.mp -= cost;
    window.soundEngine.playFireball();

    // Blast closest monster
    visibleMonsters.sort((a, b) => {
      const distA = Math.hypot(a.x - this.player.x, a.y - this.player.y);
      const distB = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      return distA - distB;
    });

    const target = visibleMonsters[0];
    const dmg = 20 + Math.floor(Math.random() * 12);
    const actual = target.takeDamage(dmg);

    this.ui.spawnFloatingNumber(target.x, target.y, `🔥 -${actual}`, 'dmg');
    this.ui.logMessage(`🔥 Cầu Lửa giáng xuống ${target.name} thiêu đốt ${actual} sát thương!`, 'magic');

    if (target.hp <= 0) {
      this.killMonster(target);
    }

    this.endPlayerTurn();
  }

  castFireballScroll() {
    window.soundEngine.playFireball();
    const visibleMonsters = this.monsters.filter(m => this.visibleTiles.has(`${m.x},${m.y}`));
    if (visibleMonsters.length === 0) {
      this.ui.logMessage('Cầu lửa ma thuật tan biến vì không có kẻ địch ở gần.', 'magic');
      return;
    }

    visibleMonsters.forEach(target => {
      const dmg = 25 + Math.floor(Math.random() * 10);
      const actual = target.takeDamage(dmg);
      this.ui.spawnFloatingNumber(target.x, target.y, `🔥 -${actual}`, 'dmg');
      if (target.hp <= 0) this.killMonster(target);
    });

    this.ui.logMessage('🔥 Hỏa trận từ cuộn giấy quét sạch toàn bộ quái vật trong tầm nhìn!', 'magic');
  }

  castHealSpell() {
    if (this.isGameOver) return;
    const cost = 6;
    if (this.player.mp < cost) {
      this.ui.logMessage('Không đủ Năng Lượng để Trị Thương! (Yêu cầu 6 MP)', 'warning');
      return;
    }

    this.player.mp -= cost;
    const healed = this.player.heal(18);
    window.soundEngine.playHeal();
    this.ui.spawnFloatingNumber(this.player.x, this.player.y, `+${healed} HP`, 'heal');
    this.ui.logMessage(`✨ Hào quang thánh thần hồi phục ${healed} Máu!`, 'magic');
    this.endPlayerTurn();
  }

  castTeleport() {
    window.soundEngine.playBlink();
    const randomRoom = this.map.rooms[Math.floor(Math.random() * this.map.rooms.length)];
    this.player.x = randomRoom.centerX;
    this.player.y = randomRoom.centerY;
    this.ui.spawnFloatingNumber(this.player.x, this.player.y, 'DỊCH CHUYỂN!', 'info');
    this.ui.logMessage('⚡ Bạn xé rách không gian và tức thời chuyển tới căn phòng khác!', 'magic');
  }

  castBlinkSpell() {
    if (this.isGameOver) return;
    const cost = 8;
    if (this.player.mp < cost) {
      this.ui.logMessage('Không đủ Năng Lượng để dùng Hư Không Bộ! (Yêu cầu 8 MP)', 'warning');
      return;
    }
    this.player.mp -= cost;
    this.castTeleport();
    this.endPlayerTurn();
  }

  // Descend Stairs
  descendStairs() {
    if (this.isGameOver) return;
    if (this.map.tiles[this.player.y][this.player.x] !== TILE_STAIRS) {
      this.ui.logMessage('Không có cầu thang xuống tầng ở đây!', 'warning');
      return;
    }

    if (this.currentFloor >= this.maxFloors) {
      this.triggerVictory();
      return;
    }

    this.currentFloor++;
    window.soundEngine.playDescend();
    this.ui.logMessage(`🔻 Bạn cẩn trọng bước xuống Tầng ${this.currentFloor}... Không khí càng lúc càng lạnh giá.`, 'system');

    this.map = new DungeonMap(60, 35, this.currentFloor);
    this.setupFloor();
  }

  // End turn & Monster AI
  endPlayerTurn() {
    this.player.turns++;
    this.recomputeFOV();

    // Natural slight MP regen every 5 turns
    if (this.player.turns % 5 === 0 && this.player.mp < this.player.maxMp) {
      this.player.mp++;
    }

    // Monster Turns
    this.runMonsterTurns();

    // Check Player Death
    if (this.player.hp <= 0) {
      this.triggerGameOver();
    }

    this.render();
  }

  runMonsterTurns() {
    for (const monster of this.monsters) {
      if (monster.hp <= 0) continue;

      const dist = Math.hypot(this.player.x - monster.x, this.player.y - monster.y);
      const isVisible = this.visibleTiles.has(`${monster.x},${monster.y}`);

      if (isVisible || dist < 6) {
        monster.aggro = true;
      }

      if (!monster.aggro) continue;

      // Adjacent to player -> Attack!
      if (Math.abs(this.player.x - monster.x) <= 1 && Math.abs(this.player.y - monster.y) <= 1) {
        window.soundEngine.playHit();
        const dmg = Math.max(1, monster.atk - this.player.totalDef + Math.floor(Math.random() * 2));
        const actual = this.player.takeDamage(dmg);

        this.ui.spawnFloatingNumber(this.player.x, this.player.y, `-${actual}`, 'dmg');
        this.ui.logMessage(`⚔ ${monster.name} tấn công bạn gây ${actual} sát thương!`, 'combat');
        continue;
      }

      // Ranged Monster Attack
      if (monster.isRanged && isVisible && dist <= 5 && Math.random() < 0.6) {
        window.soundEngine.playFireball();
        const dmg = Math.max(2, monster.atk - this.player.totalDef);
        const actual = this.player.takeDamage(dmg);

        this.ui.spawnFloatingNumber(this.player.x, this.player.y, `⚡ -${actual}`, 'dmg');
        this.ui.logMessage(`⚡ ${monster.name} phóng hắc ma thuật vào bạn gây ${actual} sát thương!`, 'combat');
        continue;
      }

      // Movement AI: Step towards player
      let stepX = 0;
      let stepY = 0;

      if (this.player.x > monster.x) stepX = 1;
      else if (this.player.x < monster.x) stepX = -1;

      if (this.player.y > monster.y) stepY = 1;
      else if (this.player.y < monster.y) stepY = -1;

      // Try preferred step
      let nextX = monster.x + stepX;
      let nextY = monster.y + stepY;

      if (this.map.isWalkable(nextX, nextY) && !this.getMonsterAt(nextX, nextY) && !(nextX === this.player.x && nextY === this.player.y)) {
        monster.x = nextX;
        monster.y = nextY;
      } else {
        // Try horizontal only
        if (stepX !== 0 && this.map.isWalkable(monster.x + stepX, monster.y) && !this.getMonsterAt(monster.x + stepX, monster.y) && !(monster.x + stepX === this.player.x && monster.y === this.player.y)) {
          monster.x += stepX;
        } else if (stepY !== 0 && this.map.isWalkable(monster.x, monster.y + stepY) && !this.getMonsterAt(monster.x, monster.y + stepY) && !(monster.x === this.player.x && monster.y + stepY === this.player.y)) {
          monster.y += stepY;
        }
      }
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    window.soundEngine.playGameOver();
    const score = (this.player.kills * 40) + (this.player.gold * 2) + (this.currentFloor * 150) + (this.player.level * 80);
    this.ui.showGameOverModal(false, {
      floor: this.currentFloor,
      kills: this.player.kills,
      gold: this.player.gold,
      turns: this.player.turns,
      score: score
    });
  }

  triggerVictory() {
    this.isGameOver = true;
    this.isVictory = true;
    window.soundEngine.playVictory();
    const score = (this.player.kills * 50) + (this.player.gold * 3) + 2000 + (this.player.level * 150);
    this.ui.showGameOverModal(true, {
      floor: this.currentFloor,
      kills: this.player.kills,
      gold: this.player.gold,
      turns: this.player.turns,
      score: score
    });
  }

  render() {
    this.ui.updateCamera(this.player.x, this.player.y, this.map.width, this.map.height);
    this.ui.render(this.map, this.visibleTiles, this.player, this.monsters, this.items);
    this.ui.updateHUD(this.player, this.currentFloor);
    this.ui.renderInventory(this.player, (idx) => this.useInventoryItem(idx));
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // First interaction activates audio context
      window.soundEngine.ensureContext();

      if (this.isGameOver) {
        if (e.code === 'Space' || e.key === ' ') {
          this.startNewGame();
        }
        return;
      }

      switch (e.key) {
        // Arrow & WASD Movement
        case 'ArrowUp':
        case 'w':
        case 'W':
        case '8':
          e.preventDefault();
          this.handleMove(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
        case '2':
          e.preventDefault();
          this.handleMove(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case '4':
          e.preventDefault();
          this.handleMove(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
        case '6':
          e.preventDefault();
          this.handleMove(1, 0);
          break;

        // Diagonal Numpad support
        case '7':
          this.handleMove(-1, -1);
          break;
        case '9':
          this.handleMove(1, -1);
          break;
        case '1':
          this.handleMove(-1, 1);
          break;
        case '3':
          this.handleMove(1, 1);
          break;

        // Wait / Skip turn
        case ' ':
        case '.':
        case '5':
          e.preventDefault();
          this.ui.logMessage('Bạn dừng chân nghỉ ngơi dưỡng sức.', 'system');
          this.endPlayerTurn();
          break;

        // Descend Stairs
        case '>':
        case 'Enter':
          this.descendStairs();
          break;

        // Spells
        case 'f':
        case 'F':
          this.castFireball();
          break;
        case 'h':
        case 'H':
          this.castHealSpell();
          break;
        case 'b':
        case 'B':
          this.castBlinkSpell();
          break;

        // Inventory numeric keys (1-9)
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const slot = parseInt(e.key) - 1;
          this.useInventoryItem(slot);
          break;

        // Help Modal Toggle
        case '?':
          this.toggleHelpModal();
          break;
        case 'Escape':
          this.closeModals();
          break;
      }
    });

    // Touch & Virtual D-Pad buttons
    const bindBtn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    bindBtn('btn-up', () => this.handleMove(0, -1));
    bindBtn('btn-down', () => this.handleMove(0, 1));
    bindBtn('btn-left', () => this.handleMove(-1, 0));
    bindBtn('btn-right', () => this.handleMove(1, 0));
    bindBtn('btn-wait', () => { this.ui.logMessage('Bạn đứng cảnh giác quan sát.', 'system'); this.endPlayerTurn(); });
    bindBtn('btn-stairs', () => this.descendStairs());
    bindBtn('btn-cast', () => this.castFireball());
    bindBtn('btn-potion', () => this.useInventoryItem(0));

    // Spell panel buttons
    bindBtn('spell-fireball', () => this.castFireball());
    bindBtn('spell-heal', () => this.castHealSpell());
    bindBtn('spell-blink', () => this.castBlinkSpell());

    // Audio button toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const state = window.soundEngine.toggle();
        audioBtn.innerText = `LOA: ${state ? 'BẬT' : 'TẮT'}`;
      });
    }

    // Help modal buttons
    bindBtn('btn-help-toggle', () => this.toggleHelpModal());
    bindBtn('btn-close-help', () => this.closeModals());
    bindBtn('btn-help-ok', () => this.closeModals());

    // Restart button
    bindBtn('btn-restart', () => this.startNewGame());
  }

  toggleHelpModal() {
    const modal = document.getElementById('modal-help');
    if (modal) modal.classList.toggle('hidden');
  }

  closeModals() {
    const helpModal = document.getElementById('modal-help');
    if (helpModal) helpModal.classList.add('hidden');
  }
}

// Launch the Game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
