const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const routeV1 = require('./routes/route');
require('dotenv').config();
const cors = require("cors")
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);



const io = socketIo(server, {
  cors: { transports: ['polling'],  origin: "*", },
});

// module.exports = { io };


io.on('connection', (socket) => {
  console.log("New client connected with socket ID ::", socket.id);

  socket.on('disconnect', () => {
    console.log("Client disconnected with socket ID ::", socket.id);
  });
});

app.set('io', io);  // Make io accessible via the app instance
app.use(bodyParser.json());
app.use(cors())
app.use(cors({
  origin: '*'
}))
app.use(express.text())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(routeV1);


sequelize.authenticate()
  .then(() => {
    console.log('Database connected.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });


const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
