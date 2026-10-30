// Temple Runner 3D - Multiplayer Server (Node.js + Express + Socket.IO)
// Chạy: npm install  ->  npm start
// Người chơi cùng mạng vào: http://<IP-máy-chủ>:3000

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

// Phục vụ game client tĩnh trong thư mục public/
app.use(express.static(join(__dirname, 'public')));

// ---------- Trạng thái người chơi trong phòng ----------
// players[socketId] = { id, name, color, pant, x, z, y, score, lane }
const players = {};

io.on('connection', (socket) => {
  console.log('🟢 Kết nối:', socket.id);

  // Người chơi tham gia (gửi tên + màu)
  socket.on('join', (info) => {
    players[socket.id] = {
      id: socket.id,
      name: (info?.name || 'Người chơi').slice(0, 16),
      color: info?.color ?? 0x00e5ff,
      pant:  info?.pant  ?? 0x00b4d8,
      x: 0, z: 0, y: 0, lane: 1, score: 0
    };
    // Gửi danh sách người chơi hiện có cho người mới
    socket.emit('players', players);
    // Báo cho mọi người khác có người mới vào
    socket.broadcast.emit('playerJoined', players[socket.id]);
    // Thông báo chat hệ thống
    io.emit('chat', { name: '🔔 Hệ thống', text: `${players[socket.id].name} đã vào phòng`, sys: true });
    console.log(`👤 ${players[socket.id].name} tham gia (tổng ${Object.keys(players).length})`);
  });

  // Cập nhật vị trí/điểm (gửi liên tục trong lúc chơi)
  socket.on('state', (s) => {
    const p = players[socket.id];
    if (!p) return;
    p.x = s.x; p.z = s.z; p.y = s.y; p.lane = s.lane; p.score = s.score;
    // Chuyển tiếp cho người khác (không gửi lại cho chính mình)
    socket.broadcast.emit('playerState', { id: socket.id, x: p.x, y: p.y, z: p.z, lane: p.lane, score: p.score });
  });

  // Tin nhắn chat (đàm thoại bằng text)
  socket.on('chat', (msg) => {
    const p = players[socket.id];
    if (!p) return;
    const text = String(msg?.text || '').slice(0, 200);
    if (!text.trim()) return;
    io.emit('chat', { name: p.name, text, id: socket.id });
  });

  // Rời phòng
  socket.on('disconnect', () => {
    const p = players[socket.id];
    if (p) {
      io.emit('chat', { name: '🔔 Hệ thống', text: `${p.name} đã rời phòng`, sys: true });
      io.emit('playerLeft', socket.id);
      console.log('🔴 Ngắt:', p.name);
      delete players[socket.id];
    }
  });
});

// ---------- Khởi động + in ra các địa chỉ truy cập ----------
httpServer.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const addrs = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) addrs.push(`${name}: http://${net.address}:${PORT}`);
    }
  }
  console.log('\n================= TEMPLE RUNNER 3D - MULTIPLAYER =================');
  console.log(`✅ Server đang chạy trên cổng ${PORT}`);
  console.log(`   Máy chủ (máy này):  http://localhost:${PORT}`);
  console.log('   Người cùng mạng vào một trong các địa chỉ:');
  addrs.forEach(a => console.log('   •', a));
  console.log('=================================================================\n');
});
