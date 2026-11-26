
import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

// 1. Create HTTP server
const server = http.createServer((req, res) => {
  fs.readFile('./public/index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html'
    });

    res.end(data);
  });
});

// 2. Create WebSocket server
const wss = new WebSocketServer({ server });

// Broadcast messages to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// 3. Handle new connections
wss.on('connection', (socket, req) => {
  const username = new URL(
    req.url,
    'http://localhost'
  ).searchParams.get('username');

  // 4. Notify when a user joins
  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  // 5. Handle chat messages
  socket.on('message', (data) => {
    try {
      const { username, text } = JSON.parse(data.toString());

      broadcast({
        type: 'chat',
        username,
        text
      });
    } catch (err) {
      console.error('Invalid message:', err.message);
    }
  });

  // 6. Notify when a user leaves
  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

// 7. Start the server
server.listen(PORT, () => {
  console.log(
    'Chat server running at http://localhost:3001'
  );
});
