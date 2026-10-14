# 📟 ASCII DUNGEON: Shadows of Code

Một tựa game **ASCII Roguelike Dungeon Crawler** cổ điển kết hợp hiệu ứng màn hình **CRT Retro**, bộ tổng hợp âm thanh **8-bit Web Audio**, và thuật toán tạo hầm ngục ngẫu nhiên (**Procedural Dungeon Generation**).

---

## 🎮 Cách Khởi Chạy Game

1. Mở terminal tại thư mục dự án và chạy lệnh:
   ```bash
   python -m http.server 8080
   ```
2. Mở trình duyệt web và truy cập vào: [http://localhost:8080](http://localhost:8080)

---

## 🕹️ Bảng Điều Khiển (Controls)

| Phím | Hành Động |
| :--- | :--- |
| **`W / A / S / D`** hoặc **Phím Mũi Tên** | Di chuyển nhân vật `@` lên, trái, xuống, phải |
| **Numpad `(1, 2, 3, 4, 6, 7, 8, 9)`** | Hỗ trợ di chuyển cả 8 hướng (kể cả đi chéo) |
| **Đâm thẳng vào quái** | Tấn công cận chiến (Melee Attack) |
| **`Space`** hoặc **`.` (Dấu chấm)** | Bỏ lượt / Đứng chờ hồi phục mana tự nhiên |
| **`>`** hoặc **`Enter`** | Đi xuống tầng hầm ngục tiếp theo khi đứng ở cầu thang `>` |
| **`F`** | Bắn cầu lửa **Fireball Spell** (Tốn 5 MP, tầm nhìn FOV) |
| **`H`** | Hồi máu nhanh **Heal Spell** (Tốn 6 MP) |
| **`B`** | Dịch chuyển tức thời **Blink Step** (Tốn 8 MP) |
| **`1 - 9`** | Sử dụng/trang bị vật phẩm tương ứng trong túi đồ Inventory |
| **`?`** | Mở bảng hướng dẫn chi tiết (Survival Manual) |

---

## 🗺️ Ký Hiệu Bản Đồ & Địa Hình (Map Legend)

| Ký Hiệu | Tên Địa Hình | Mô Tả & Tương Tác |
| :---: | :--- | :--- |
| **`+`** | **Cửa Đóng (Closed Door)** | Cánh cửa đang khép kín. **Chặn tầm nhìn (FOV)** và ánh sáng. Đi thẳng vào ô cửa để mở. |
| **`_`** | **Cửa Mở (Open Door)** | Cửa đã được mở. Cho phép **nhìn xuyên qua** và di chuyển qua lại tự do. |
| **`#`** | **Tường Đá (Wall)** | Chặn đường đi và chặn tầm nhìn. |
| **`.`** | **Sàn Hầm (Floor)** | Đường đi thông thoáng trong phòng và hành lang. |
| **`>`** | **Cầu Thang (Stairs)** | Lối dẫn xuống tầng hầm sâu hơn (bấm `>` hoặc `Enter` khi đứng tại đây). |

---

## 👾 Bách Khoa Quái Vật (Bestiary)

| Ký Hiệu | Tên Quái Vật | Tầng Xuất Hiện | Mô Tả & Chỉ Số Cơ Bản |
| :---: | :--- | :---: | :--- |
| **`b`** | **Dơi Khổng Lồ (Giant Bat)** | Tầng 1 - 2 | Di chuyển nhanh, máu thấp (HP 10, ATK 4, DEF 0). |
| **`g`** | **Yêu Tinh Hang Động (Goblin)** | Tầng 1 - 3 | Quái vật tinh quái (HP 16, ATK 6, DEF 1). |
| **`s`** | **Lính Xương Khô (Skeleton)** | Tầng 1 - 4 | Chiến binh bất tử, phòng thủ tốt (HP 22, ATK 8, DEF 2). |
| **`o`** | **Chiến Binh Orc** | Tầng 2 - 5 | Lực đánh mạnh, máu dồi dào (HP 32, ATK 11, DEF 3). |
| **`m`** | **Pháp Sư Bóng Đêm (Dark Mage)** | Tầng 2 - 5 | Tấn công ma thuật tầm xa nguy hiểm (HP 24, ATK 12, DEF 1). |
| **`M`** | **Quái Vật Nhân Ngưu (Minotaur)** | Tầng 3 - 5 | Quái tinh anh cực trâu bò, húc siêu đau (HP 48, ATK 15, DEF 4). |
| **`D`** | **Chúa Tể Malgok (Final Boss)** | Tầng 5 | Trùm cuối canh giữ Amulet of Code (HP 120, ATK 18, DEF 6). |

---

## ⚔️ Tính Năng Nổi Bật

1. **Hiệu ứng CRT Retro cao cấp**:
   - Scanline, cong màn hình Phosphor, Vignette bóng mờ.
   - 5 chủ đề màu màn hình chuyển đổi tức thì:
     - 🟢 **Matrix Green**
     - 🟠 **Amber CRT**
     - 🔵 **Cyber Cyan**
     - 🔴 **Blood Red**
     - ⚪ **Monochrome White**
2. **Âm thanh 8-bit Procedural Web Audio API**:
   - Bước chân, chém kiếm, quái gầm, nhặt đồ, uống thuốc, nổ cầu lửa, lên cấp (Level Up fanfare), tiếng sấm thang máy hầm ngục, v.v. (hoàn toàn tự tổng hợp bằng sóng âm, không cần file audio nặng).
3. **Thuật toán sương mù Fog of War & Tầm nhìn (FOV)**:
   - Raycasting 360 độ chân thực: Những vùng chưa thám hiểm hoàn toàn tối đen, vùng đã đi qua hiển thị mờ, vùng trong tầm mắt hiển thị sáng rõ rực rỡ.
4. **Hệ thống Combat, Chỉ số & Trang bị (RPG Progression)**:
   - Thanh HP, MP, XP và cấp độ nhân vật (Level Up tăng máu tối đa và sát thương).
   - Hệ thống trang bị: Vũ khí (`/`), Giáp bảo vệ (`[`), Nhẫn sức mạnh (`=`).
   - Boss Overlord Malgok xuất hiện tại Tầng 5 canh giữ bảo vật **Amulet of Code**!
