/**
 * ASCII DUNGEON - UI Renderer, Canvas ASCII Display & HUD Management
 */

class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Font and cell configuration
    this.fontSize = 20;
    this.charWidth = 12;
    this.charHeight = 20;
    this.ctx.font = `${this.fontSize}px 'VT323', monospace`;
    this.ctx.textBaseline = 'top';

    // Camera offset
    this.cameraX = 0;
    this.cameraY = 0;

    // Floating combat text overlay
    this.floatingLayer = document.getElementById('floating-numbers-layer');

    this.setupTheme();
    this.handleResize();
    window.addEventListener('resize', () => {
      this.handleResize();
      if (window.game) window.game.render();
    });
  }

  handleResize() {
    const isMobile = window.innerWidth <= 820;
    const wrapper = this.canvas.parentElement;

    if (isMobile && wrapper) {
      const rect = wrapper.getBoundingClientRect();
      const cssWidth = Math.max(280, Math.floor(rect.width || window.innerWidth));
      const cssHeight = Math.max(220, Math.floor(rect.height || (window.innerHeight * 0.4)));

      this.canvas.width = cssWidth;
      this.canvas.height = cssHeight;

      // Phóng to chữ trên mobile: giới hạn khoảng 18-22 ô hiển thị theo chiều ngang để chữ thật to và rõ
      const targetCols = Math.min(22, Math.max(16, Math.floor(cssWidth / 20)));
      this.charWidth = Math.max(16, Math.floor(cssWidth / targetCols));
      this.charHeight = Math.floor(this.charWidth * 1.55);
      this.fontSize = Math.floor(this.charHeight * 1.1);
    } else {
      this.canvas.width = 800;
      this.canvas.height = 540;
      this.fontSize = 20;
      this.charWidth = 12;
      this.charHeight = 20;
    }

    this.ctx.font = `${this.fontSize}px 'VT323', monospace`;
    this.ctx.textBaseline = 'top';
  }

  setupTheme() {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        document.body.className = `${e.target.value} ${document.body.classList.contains('crt-active') ? 'crt-active' : ''}`;
      });
    }

    const crtBtn = document.getElementById('btn-crt-toggle');
    if (crtBtn) {
      crtBtn.addEventListener('click', () => {
        document.body.classList.toggle('crt-active');
        const active = document.body.classList.contains('crt-active');
        crtBtn.innerText = `CRT: ${active ? 'BẬT' : 'TẮT'}`;
      });
    }
  }

  getThemeColors() {
    const style = getComputedStyle(document.body);
    return {
      textMain: style.getPropertyValue('--text-main').trim() || '#3dfc47',
      textDim: style.getPropertyValue('--text-dim').trim() || '#1f6b24',
      borderFocus: style.getPropertyValue('--border-focus').trim() || '#44e34c',
      bgPrimary: style.getPropertyValue('--bg-primary').trim() || '#060d07'
    };
  }

  updateCamera(playerX, playerY, mapWidth, mapHeight) {
    const viewCols = Math.floor(this.canvas.width / this.charWidth);
    const viewRows = Math.floor(this.canvas.height / this.charHeight);

    if (viewCols >= mapWidth) {
      this.cameraX = -Math.floor((viewCols - mapWidth) / 2);
    } else {
      this.cameraX = Math.max(0, Math.min(mapWidth - viewCols, playerX - Math.floor(viewCols / 2)));
    }

    if (viewRows >= mapHeight) {
      this.cameraY = -Math.floor((viewRows - mapHeight) / 2);
    } else {
      this.cameraY = Math.max(0, Math.min(mapHeight - viewRows, playerY - Math.floor(viewRows / 2)));
    }
  }

  render(gameMap, visibleTiles, player, monsters, items) {
    const theme = this.getThemeColors();
    this.ctx.fillStyle = '#020502';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = `${this.fontSize}px 'VT323', monospace`;
    this.ctx.textBaseline = 'top';

    const viewCols = Math.ceil(this.canvas.width / this.charWidth);
    const viewRows = Math.ceil(this.canvas.height / this.charHeight);

    // 1. Draw Map Tiles
    for (let screenY = 0; screenY < viewRows; screenY++) {
      const mapY = this.cameraY + screenY;
      if (mapY < 0 || mapY >= gameMap.height) continue;

      for (let screenX = 0; screenX < viewCols; screenX++) {
        const mapX = this.cameraX + screenX;
        if (mapX < 0 || mapX >= gameMap.width) continue;

        const isVisible = visibleTiles.has(`${mapX},${mapY}`);
        const isExplored = gameMap.explored[mapY][mapX];

        if (!isVisible && !isExplored) {
          // Unexplored, stays black
          continue;
        }

        const tile = gameMap.tiles[mapY][mapX];
        const destX = screenX * this.charWidth;
        const destY = screenY * this.charHeight;

        let char = tile;
        let color = '#333333';

        if (isVisible) {
          if (tile === TILE_WALL) {
            color = theme.textDim;
          } else if (tile === TILE_FLOOR) {
            color = '#3a4a3a';
          } else if (tile === TILE_DOOR) {
            color = '#f59e0b';
          } else if (tile === TILE_DOOR_OPEN) {
            color = '#d97706';
          } else if (tile === TILE_STAIRS) {
            color = '#38bdf8';
          }
        } else {
          // Explored but out of view
          color = '#1f2922';
        }

        this.ctx.fillStyle = color;
        this.ctx.fillText(char, destX, destY);
      }
    }

    // 2. Draw Items
    for (const item of items) {
      if (!visibleTiles.has(`${item.x},${item.y}`)) continue;
      const screenX = (item.x - this.cameraX) * this.charWidth;
      const screenY = (item.y - this.cameraY) * this.charHeight;

      if (screenX >= 0 && screenX < this.canvas.width && screenY >= 0 && screenY < this.canvas.height) {
        this.ctx.fillStyle = item.color;
        this.ctx.fillText(item.char, screenX, screenY);
      }
    }

    // 3. Draw Monsters
    for (const monster of monsters) {
      if (!visibleTiles.has(`${monster.x},${monster.y}`)) continue;
      const screenX = (monster.x - this.cameraX) * this.charWidth;
      const screenY = (monster.y - this.cameraY) * this.charHeight;

      if (screenX >= 0 && screenX < this.canvas.width && screenY >= 0 && screenY < this.canvas.height) {
        // Monster character
        this.ctx.fillStyle = monster.color;
        this.ctx.fillText(monster.char, screenX, screenY);

        // Monster Mini HP bar above head if wounded
        if (monster.hp < monster.maxHp) {
          const hpRatio = Math.max(0, monster.hp / monster.maxHp);
          const barW = this.charWidth;
          const barH = 2;
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
          this.ctx.fillRect(screenX, screenY - 2, barW, barH);
          this.ctx.fillStyle = '#22c55e';
          this.ctx.fillRect(screenX, screenY - 2, barW * hpRatio, barH);
        }
      }
    }

    // 4. Draw Player
    const pScreenX = (player.x - this.cameraX) * this.charWidth;
    const pScreenY = (player.y - this.cameraY) * this.charHeight;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('@', pScreenX, pScreenY);
    this.ctx.shadowBlur = 0; // Reset
  }

  spawnFloatingNumber(mapX, mapY, text, type = 'dmg') {
    if (!this.floatingLayer) return;

    const screenX = (mapX - this.cameraX) * this.charWidth + 6;
    const screenY = (mapY - this.cameraY) * this.charHeight;

    const el = document.createElement('div');
    el.className = `floating-text floating-${type}`;
    el.innerText = text;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;

    this.floatingLayer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  updateHUD(player, currentFloor) {
    // Floor
    const floorEl = document.getElementById('stat-floor');
    if (floorEl) floorEl.innerText = currentFloor;

    // Level
    const levelEl = document.getElementById('stat-level');
    if (levelEl) levelEl.innerText = player.level;

    // HP Bar & text
    const hpText = document.getElementById('stat-hp-text');
    const hpBar = document.getElementById('stat-hp-bar');
    if (hpText && hpBar) {
      hpText.innerText = `${player.hp}/${player.maxHp}`;
      hpBar.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
    }

    // MP Bar & text
    const mpText = document.getElementById('stat-mp-text');
    const mpBar = document.getElementById('stat-mp-bar');
    if (mpText && mpBar) {
      mpText.innerText = `${player.mp}/${player.maxMp}`;
      mpBar.style.width = `${Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100))}%`;
    }

    // XP Bar & text
    const xpText = document.getElementById('stat-xp-text');
    const xpBar = document.getElementById('stat-xp-bar');
    if (xpText && xpBar) {
      xpText.innerText = `${player.xp}/${player.maxXp}`;
      xpBar.style.width = `${Math.max(0, Math.min(100, (player.xp / player.maxXp) * 100))}%`;
    }

    // Attack & Defense
    const atkEl = document.getElementById('stat-atk');
    const defEl = document.getElementById('stat-def');
    if (atkEl) atkEl.innerText = `${player.totalAtk} (${player.baseAtk}+${player.totalAtk - player.baseAtk})`;
    if (defEl) defEl.innerText = `${player.totalDef} (${player.baseDef}+${player.totalDef - player.baseDef})`;

    // Gold & Turns
    const goldEl = document.getElementById('stat-gold');
    const turnsEl = document.getElementById('stat-turns');
    if (goldEl) goldEl.innerText = `${player.gold} 🪙`;
    if (turnsEl) turnsEl.innerText = player.turns;

    // Equipment
    const eqWeapon = document.getElementById('equip-weapon');
    const eqArmor = document.getElementById('equip-armor');
    const eqRing = document.getElementById('equip-ring');
    if (eqWeapon) eqWeapon.innerText = player.equipped.weapon ? `${player.equipped.weapon.name} (+${player.equipped.weapon.bonusAtk} Công)` : 'Trống';
    if (eqArmor) eqArmor.innerText = player.equipped.armor ? `${player.equipped.armor.name} (+${player.equipped.armor.bonusDef} Thủ)` : 'Trống';
    if (eqRing) eqRing.innerText = player.equipped.ring ? `${player.equipped.ring.name}` : 'Trống';

    // Synchronize Mobile Mini-HUD
    const mHpText = document.getElementById('m-stat-hp-text');
    const mHpBar = document.getElementById('m-stat-hp-bar');
    if (mHpText && mHpBar) {
      mHpText.innerText = `${player.hp}/${player.maxHp}`;
      mHpBar.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
    }

    const mMpText = document.getElementById('m-stat-mp-text');
    const mMpBar = document.getElementById('m-stat-mp-bar');
    if (mMpText && mMpBar) {
      mMpText.innerText = `${player.mp}/${player.maxMp}`;
      mMpBar.style.width = `${Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100))}%`;
    }

    const mLevel = document.getElementById('m-stat-level');
    if (mLevel) mLevel.innerText = player.level;

    const mGold = document.getElementById('m-stat-gold');
    if (mGold) mGold.innerText = player.gold;

    const mFloor = document.getElementById('m-stat-floor');
    const statFloor = document.getElementById('stat-floor');
    if (mFloor && statFloor) mFloor.innerText = statFloor.innerText;

    const mInvCount = document.getElementById('m-inv-count');
    if (mInvCount) mInvCount.innerText = player.inventory.length;
  }

  renderInventory(player, onUseCallback) {
    const list = document.getElementById('inventory-list');
    const mList = document.getElementById('m-inventory-list');
    const mInvCount = document.getElementById('m-inv-count');
    if (mInvCount) mInvCount.innerText = player.inventory.length;

    const panelTitle = document.querySelector('.inv-panel .panel-title');
    if (panelTitle) {
      panelTitle.innerText = `══ TÚI ĐỒ (${player.inventory.length}/10) ══`;
    }

    const buildItemNode = (item, idx, isMobile = false) => {
      const slotDiv = document.createElement('div');
      slotDiv.className = isMobile ? 'inv-item mobile-touch-item' : 'inv-item';
      slotDiv.innerHTML = `
        <span class="inv-slot-num">[${idx + 1}]</span>
        <span class="inv-name" style="color: ${item.color}">${item.name}</span>
        <button class="inv-btn-use">${isMobile ? 'SỬ DỤNG' : 'DÙNG'}</button>
      `;
      slotDiv.addEventListener('click', () => {
        onUseCallback(idx);
        if (isMobile) {
          const mInvModal = document.getElementById('modal-mobile-inventory');
          if (mInvModal) mInvModal.classList.add('hidden');
        }
      });
      return slotDiv;
    };

    if (list) {
      list.innerHTML = '';
      if (player.inventory.length === 0) {
        list.innerHTML = `<div style="color:var(--text-dim); text-align:center; padding:10px;">[Túi Đồ Trống]</div>`;
      } else {
        player.inventory.forEach((item, idx) => {
          list.appendChild(buildItemNode(item, idx, false));
        });
      }
    }

    if (mList) {
      mList.innerHTML = '';
      if (player.inventory.length === 0) {
        mList.innerHTML = `<div style="color:var(--text-dim); text-align:center; padding:20px; font-size:18px;">[Túi Đồ Hiện Đang Trống]</div>`;
      } else {
        player.inventory.forEach((item, idx) => {
          mList.appendChild(buildItemNode(item, idx, true));
        });
      }
    }
  }

  logMessage(msg, category = 'system') {
    const logContainer = document.getElementById('combat-log');
    const mLogContainer = document.getElementById('m-combat-log');

    const appendEntry = (container) => {
      if (!container) return;
      const entry = document.createElement('div');
      entry.className = `log-entry log-${category}`;
      entry.innerText = msg;
      container.appendChild(entry);
      container.scrollTop = container.scrollHeight;
      while (container.children.length > 50) {
        container.removeChild(container.firstChild);
      }
    };

    appendEntry(logContainer);
    appendEntry(mLogContainer);
  }

  showGameOverModal(isVictory, stats) {
    const modal = document.getElementById('modal-gameover');
    if (!modal) return;

    const titleEl = document.getElementById('gameover-title');
    const descEl = document.getElementById('gameover-desc');
    const floorEl = document.getElementById('gov-floor');
    const killsEl = document.getElementById('gov-kills');
    const goldEl = document.getElementById('gov-gold');
    const turnsEl = document.getElementById('gov-turns');
    const scoreEl = document.getElementById('gov-score');

    if (isVictory) {
      titleEl.innerText = '🏆 CHIẾN THẮNG HUY HOÀNG! 🏆';
      titleEl.style.color = '#3dfc47';
      titleEl.style.textShadow = '0 0 10px #3dfc47';
      descEl.innerText = 'Bạn đã tiêu diệt Chúa Tể Malgok và đoạt lại Cổ Vật Amulet of Code!';
    } else {
      titleEl.innerText = '☠ BẠN ĐÃ TỬ TRẬN ☠';
      titleEl.style.color = '#ef4444';
      titleEl.style.textShadow = '0 0 10px #ef4444';
      descEl.innerText = 'Linh hồn bạn mãi mãi chìm sâu dưới đáy hầm ngục ASCII...';
    }

    if (floorEl) floorEl.innerText = stats.floor;
    if (killsEl) killsEl.innerText = stats.kills;
    if (goldEl) goldEl.innerText = stats.gold;
    if (turnsEl) turnsEl.innerText = stats.turns;
    if (scoreEl) scoreEl.innerText = stats.score;

    modal.classList.remove('hidden');
  }
}

window.UIManager = UIManager;
