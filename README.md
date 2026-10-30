# 🏃 Temple Runner 3D — Multiplayer

Game 3D chạy vượt chướng ngại vật, nhiều người chơi cùng phòng qua Internet, có chat.

## Chạy thử trên máy (local)
```bash
npm install
npm start
```
Mở http://localhost:3000 — người cùng wifi vào http://<IP-máy>:3000

## 🚀 Deploy lên Internet (Render — miễn phí)

### Bước 1: Đẩy code lên GitHub
1. Tạo tài khoản https://github.com (nếu chưa có)
2. Tạo repo mới (New repository), ví dụ tên `temple-runner-3d`, để **Public**
3. Trong thư mục này, chạy lần lượt (thay `<URL-repo>` bằng link repo bạn vừa tạo):
```bash
git init
git add .
git commit -m "Temple Runner 3D multiplayer"
git branch -M main
git remote add origin <URL-repo>
git push -u origin main
```
(GitHub sẽ hỏi đăng nhập — dùng tài khoản của bạn.)

### Bước 2: Deploy trên Render
1. Tạo tài khoản https://render.com (đăng nhập bằng GitHub cho nhanh)
2. Bấm **New +** → **Web Service**
3. Chọn repo `temple-runner-3d` vừa đẩy lên
4. Render tự đọc `render.yaml`. Nếu hỏi, điền:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Bấm **Create Web Service** → chờ ~2-3 phút

### Bước 3: Nhận link công khai 🎉
Render cho bạn link dạng: `https://temple-runner-3d.onrender.com`
Gửi link này cho bất kỳ ai trên thế giới để chơi chung!

> ⚠️ Gói Free của Render "ngủ" sau 15 phút không ai dùng → lần vào đầu tiên chờ ~30 giây để nó thức dậy. Bình thường với game cá nhân.

## 📱 Lên CH Play / App Store?
Đây là web game. Muốn thành app cần đóng gói (TWA/Capacitor) + tài khoản nhà phát triển
(Google Play $25 một lần, Apple $99/năm) + nộp duyệt. Là dự án riêng, không bắt buộc —
web link chơi được trên mọi điện thoại qua trình duyệt rồi.
