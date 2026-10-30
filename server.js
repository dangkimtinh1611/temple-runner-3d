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

// ---------- Trạng thái người chơi theo PHÒNG ----------
// rooms[code] = { [socketId]: {id,name,color,pant,x,z,y,score,lane} }
const rooms = {};
function genCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ ký tự dễ nhầm (0/O,1/I)
  let c; do { c=''; for(let i=0;i<6;i++) c+=chars[Math.floor(Math.random()*chars.length)]; } while(rooms[c]);
  return c;
}

io.on('connection', (socket) => {
  console.log('🟢 Kết nối:', socket.id);
  let room = null; // mã phòng của socket này

  function playersInRoom(code){ return rooms[code] || {}; }
  function leaveRoom(){
    if(room && rooms[room]){
      const p = rooms[room][socket.id];
      const name = p?.name || 'Người chơi';
      delete rooms[room][socket.id];
      socket.to(room).emit('playerLeft', socket.id);
      io.to(room).emit('chat', { name:'🔔 Hệ thống', text:`${name} đã rời phòng`, sys:true });
      if(Object.keys(rooms[room]).length===0) delete rooms[room]; // phòng trống -> xóa
      socket.leave(room);
      room = null;
    }
  }
  function doJoin(code, info){
    code = String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
    if(!rooms[code]){ socket.emit('joinError','Phòng không tồn tại hoặc đã đóng.'); return; }
    leaveRoom();
    room = code; socket.join(room);
    rooms[room][socket.id] = {
      id: socket.id,
      name: (info?.name||'Người chơi').slice(0,16),
      color: info?.color ?? 0x00e5ff, pant: info?.pant ?? 0x00b4d8,
      x:0,z:0,y:0,lane:1,score:0
    };
    socket.emit('joined', { code: room, players: playersInRoom(room) });
    socket.to(room).emit('playerJoined', rooms[room][socket.id]);
    io.to(room).emit('chat', { name:'🔔 Hệ thống', text:`${rooms[room][socket.id].name} đã vào phòng`, sys:true });
    console.log(`👤 ${rooms[room][socket.id].name} vào phòng ${room} (${Object.keys(rooms[room]).length} người)`);
  }

  // Tạo phòng mới -> sinh mã rồi tự vào
  socket.on('createRoom', (info) => {
    const code = genCode();
    rooms[code] = {};
    doJoin(code, info);
  });

  // Vào phòng theo mã
  socket.on('joinRoom', ({ code, ...info }) => doJoin(code, info));

  // Cập nhật màu (khi đổi quần áo lúc đang trong phòng)
  socket.on('updateLook', (info) => {
    if(room && rooms[room] && rooms[room][socket.id]){
      rooms[room][socket.id].color = info?.color ?? rooms[room][socket.id].color;
      rooms[room][socket.id].pant  = info?.pant  ?? rooms[room][socket.id].pant;
    }
  });

  // Chủ phòng bấm Bắt đầu -> báo cho TẤT CẢ trong phòng cùng chạy
  socket.on('startGame', () => {
    if(room && rooms[room] && rooms[room][socket.id]){
      io.to(room).emit('gameStart');
      io.to(room).emit('chat', { name:'🔔 Hệ thống', text:'🏁 Bắt đầu! Chạy nào!', sys:true });
    }
  });

  // Cập nhật vị trí/điểm -> chỉ gửi trong cùng phòng
  socket.on('state', (s) => {
    if(!room || !rooms[room] || !rooms[room][socket.id]) return;
    const p = rooms[room][socket.id];
    p.x=s.x; p.z=s.z; p.y=s.y; p.lane=s.lane; p.score=s.score;
    socket.to(room).emit('playerState', { id:socket.id, x:p.x, y:p.y, z:p.z, lane:p.lane, score:p.score });
  });

  // Chat -> chỉ trong cùng phòng
  socket.on('chat', (msg) => {
    if(!room || !rooms[room] || !rooms[room][socket.id]) return;
    const p = rooms[room][socket.id];
    const text = String(msg?.text||'').slice(0,200);
    if(!text.trim()) return;
    io.to(room).emit('chat', { name:p.name, text, id:socket.id });
  });

  socket.on('disconnect', () => { leaveRoom(); console.log('🔴 Ngắt:', socket.id); });
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
