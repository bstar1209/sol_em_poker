import { Server } from 'socket.io'
import express from 'express';
import { createServer } from 'http';

import session from 'express-session';
import cookieParser from 'cookie-parser';


const app = express();
const server = createServer(app);
const socketio = new Server(server, {
  cors: true,
  allowEIO3: true, // tweaking it may help
});

import path from 'path';
import bodyParser from 'body-parser'

import Utils from './solana/utils.js'

import ejs from 'ejs'

import DB from './db/index.js'

import dotenv from 'dotenv'
dotenv.config();

const __dirname = path.resolve();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views/');

app.use(cookieParser());
app.use(session({ secret: "Your secret key" }));

try {
  // connect to database.
  await DB.connectDB();
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Cannot be able to connect to DB");
  process.exit(1); // exit node.js with an error
}

let playerList = [];
let roomList = [];

let unqueRoomId = 0;

let checkSignIn = (req, res, next) => {
  if (req.session.user) {
    next();     // If session exists, proceed to page
  } else {
    res.redirect('/login');
  }
}

app.get("/login", function (req, res) {
  res.render('login');
});

app.post('/login', async (req, res) => {
  if (!req.body.username) {
    res.render('login', { message: "Please enter both id and password" });
  } else {
    const user = await DB.getUser(req.body.username)
    if (user) {
      req.session.user = user;
      res.redirect('/home');
      return;
    }

    res.render('login', { message: "Invalid credentials!" });
  }
});

app.get('/logout', function (req, res) {
  req.session.destroy(function () {
    console.log("user logged out.")
  });
  res.redirect('/login');
});

app.get('/signup', function (req, res) {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  if (!req.body.username) {
    res.status("400");
    res.send("Invalid details!");
  } else {
    if (await DB.getUser(req.body.username)) {
      res.send("User Already Exists! Login or choose another username");
      return;
    }

    var newUser = { username: req.body.username };

    DB.saveUser(newUser);

    req.session.user = newUser;
    res.redirect('/login');
  }
});

app.get('/home', checkSignIn, (req, res) => {
  res.render('home', {
    username: req.session.user.username
  })
});

// Serve the heros page 
app.get("/heros", (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post("/getTokensByOwner", async (req, res) => {
  // get all nfts in Phantom wallet
  const mints = await Utils.getTokensByOwner(req.body.publicKey);
  const filtered = mints.filter((elem) => elem.account.data.parsed.info.tokenAmount.uiAmount != 0)

  let result = []

  for (let j = 0; j < filtered.length; j++) {
    const elem = filtered[j];

    if (elem.account.data.parsed.info.tokenAmount.uiAmount != 0) {
      Utils.getMeta(elem.account.data.parsed.info.mint).then((piece) => {
        result.push(piece)
        if (result.length == filtered.length) {
          res.json(result)
        }
      }).catch((e) => {
        console.log('error is detected when get the metadata')
        result.push(null)
      })
    }
  }
})

socketio.on('connection', function (socket) {
  let playerId = socket.id;
  socket.on('new-player', (data) => {
    let playerInfo = {
      id: playerId,
      roomId: 0,
      username: data.username,
      ready: false,
      turn: false,
      scene: 'WaitScene',
      tableSeat: 0,
    }

    const index = playerList.findIndex((elem) => elem.username == data.username);

    if (index != -1) { // exist yet
      playerInfo = playerList[index]
      playerInfo.id = playerId

      playerList.splice(index, 1);
    }
    playerList.push(playerInfo);

    socket.emit('room-list', {
      rooms: roomList
    });

    socket.emit('player-list', {
      players: playerList,
      room: (playerInfo.roomId == 0) ? null : getRoom(playerInfo.roomId),
    })
  });

  socket.on('create-room', (data) => {
    let player = getPlayer(data);

    if (player.roomId != 0) {
      console.log(`${player.username} has already room`);
      return;
    }

    unqueRoomId++;
    player.roomId = unqueRoomId; // assign the room id
    player.scene = 'PokerTableScene'

    let room = {
      id: unqueRoomId,
      players: [],
      status: 'waiting'
    }

    player.tableSeat = Math.floor(Math.random() * 10); // set the table seat number
    room.players.push(player);
    roomList.push(room);

    socket.emit('create-room', {
      username: player.username,
      room: room,
    })

    broadcastToPlayer(player.id, 'create-room', {
      username: player.username,
      rooms: roomList,
    });
  })

  socket.on('join-room', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(data.roomId)

    if (!player) {
      console.log('is not exist');
      return;
    }

    if (player.roomId != 0) {
      console.log(`${player.username} has already room`);
      return;
    }

    if (!room) {
      console.log('room does not exist');
      return;
    }

    if (room.players.length >= 3) {
      console.log('players are limited')
      return;
    }

    player.roomId = data.roomId; // assign the room id
    
    let randomSeat = Math.floor(Math.random() * 10);

    while (room.players.find(elem => elem.tableSeat == randomSeat)) {
      randomSeat = Math.floor(Math.random() * 10);
    }
    player.tableSeat = randomSeat; // set the table seat number
    room.players.push(player);

    player.scene = 'PokerTableScene'

    socket.emit('join-room', {
      username: player.username,
      room: room,
    })
  })

  socket.on('leave-room', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    broadcastToRoom(player.roomId, 'leave-room', {
      username: player.username,
    })

    player.roomId = 0

    player.scene = 'WaitScene'

    room.players = room.players.filter(elem => elem.username != data.username)
    roomList = roomList.filter(elem => elem.players.length != 0)
  })

  socket.on('select-hero', (data) => {
    let player = getPlayer(data.username);
    player.hero.nft = data.hero;
  })

  socket.on('ready-battle', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!room) {
      console.log('room is not exist')
      return;
    }

    player.minions = []
    for (let i = 0; i < data.minions.length; i++) {
      player.minions.push(Minions.getMinion(data.minions[i]))
    }

    if (player.minions.length != 12) {
      console.log("please select 12 minions")
      return;
    }

    player.spells = []
    for (let i = 0; i < data.spells.length; i++) {
      player.spells.push(Spells.getSpell(data.spells[i]))
    }

    if (player.spells.length != 7) {
      console.log("please select 7 spells")
      return;
    }

    player.sortedCards = player.minions.concat(player.spells) // merge with minions and spells
    player.sortedCards.sort((a, b) => 0.5 - Math.random()) // shuffle the spells

    player.minions = []
    player.spells = []

    for (let i = 0; i < 4; i++) { // hand 4 card at first
      player.sortedCards[i].handed = true;
    }

    player.ready = true
    player.scene = 'LoadingScene'
    socket.emit('ready-battle', room);

    if (room.players.filter(elem => elem.ready).length == 2) {
      room.status = 'battle'
      room.players[0].turn = true

      room.players[0].hero.manabar = 1;
      room.players[0].hero.mana = 1;

      room.players[0].scene = 'BattleScene';
      room.players[1].scene = 'BattleScene';

      broadcastToRoom(player.roomId, 'start-battle', room)
    }
  })

  socket.on('bet-card', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!room) {
      console.log('room does not exist')
      return
    }

    let enemy = room.players.find(elem => elem.username != data.username)

    if (!player.turn) {
      return;
    }

    let card = player.sortedCards.find((elem) => elem.name == data.card)

    if (!card) {
      return;
    }

    if (player.sortedCards.filter(elem => elem.bet).length >= 5) {
      console.log('Max bet: 5')
      return
    }

    if (player.hero.mana < card.mana) {
      console.log('Not enough mana')
      return;
    }

    card.bet = true;
    card.disabled = true;
    player.hero.mana -= card.mana;

    if (card.type == 'minion') {
      Minions.doMagic(card, player, enemy)
    } else if (card.type == 'spell') {
      Spells.doMagic(card, player, enemy)
      card.hp = 0
    }

    Minions.dieMagic(player, enemy)
    Minions.dieMagic(enemy, player)

    broadcastToRoom(player.roomId, 'bet-card', {
      username: player.username,
      betted_player: player,
      hurted_player: enemy,
    });

    refreshCards(player, enemy)
  })

  socket.on('change-turn', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!room) {
      console.log('room does not exist')
      return
    }


    if (!player.turn) {
      return;
    }

    player.turn = false;

    let enemy = room.players.find(elem => elem.username != data.username)

    enemy.turn = true;
    if (enemy.hero.manabar < 10) {
      enemy.hero.manabar++;
    }
    enemy.hero.mana = enemy.hero.manabar
    enemy.sortedCards.filter((elem) => {
      if (elem.bet) {
        elem.disabled = false;
        return true
      }
    })

    player.sortedCards.filter((elem) => {
      if (elem.bet) {
        if (elem.freeze) {
          elem.freeze--;
          if (elem.freeze < 0) {
            elem.freeze = 0
          }
        } else {
          elem.freeze = 0;
        }

        if (elem.sleep) {
          elem.sleep--;
          if (elem.sleep < 0) {
            elem.sleep = 0
          }
        } else {
          elem.sleep = 0;
        }

        return true
      }
    })

    Minions.repeatMagic(enemy, player)

    enemy.sortedCards.find(elem => {
      if (!elem.handed) {
        if (enemy.sortedCards.filter(e => !e.bet && e.handed).length >= 10) {
          elem.hp = 0
        } else {
          elem.handed = true
        }
        return true;
      }
    })

    Minions.dieMagic(player, enemy)
    Minions.dieMagic(enemy, player)

    broadcastToRoom(player.roomId, 'change-turn', {
      username: player.username,
      room: room,
    })

    refreshCards(player, enemy)
  })

  socket.on('attack-hero', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!player.turn) {
      return;
    }

    let enemy = room.players.find(elem => elem.username != data.username)
    let card = player.sortedCards.find((elem) => elem.name == data.card)

    if (card.disabled) {
      console.log("Disabled card yet")
      return;
    }

    card.disabled = true;
    if (card.type == 'minion') {
      enemy.hero.hp -= card.att;
    } else if (card.type == 'spell') {
    }

    broadcastToRoom(player.roomId, 'attack-hero', {
      username: player.username,
      card: card,
      from: player,
      to: enemy,
    })

    if (enemy.hero.hp <= 0) {
      broadcastToRoom(player.roomId, 'end-battle', {
        loser: enemy.username,
      })

      formatPlayerInfo(player)
      formatPlayerInfo(enemy)

      room.status = 'end'
      roomList = roomList.filter((elem) => elem.status != 'end')
    }
  })

  socket.on('attack-minion', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!player.turn) {
      return;
    }

    let from = player.sortedCards.find((elem) => elem.name == data.from)
    let enemy = room.players.find(elem => elem.username != data.username)
    let to = enemy.sortedCards.find((elem) => elem.name == data.to)

    if (!Minions.guideMagic(player, enemy, from, to)) {
      console.log(`${from.name} can not attack ${to.name}`)
      return;
    }

    Minions.dieMagic(player, enemy)
    Minions.dieMagic(enemy, player)

    broadcastToRoom(player.roomId, 'attack-minion', {
      username: player.username,
      room: room
    })

    refreshCards(player, enemy)
  })
});

server.listen(process.env.PORT, function () {
  console.log(`listening on port ${process.env.PORT}`);
});

let getPlayer = (username) => {
  let player = playerList.find((elem) => elem.username == username);
  return player;
}

let getRoom = (roomId) => {
  let room = roomList.find((elem) => elem.id == roomId)
  return room;
}

let broadcastToRoom = (roomId, command, data) => {
  let room = getRoom(roomId);
  for (let i = 0; i < room.players.length; i++) {
    const elem = room.players[i];
    if (socketio.sockets.sockets.get(elem.id)) {
      socketio.sockets.sockets.get(elem.id).emit(command, data);
    }
  }
}

let broadcastToPlayer = (playerId, command, data) => {
  playerList.filter((elem) => {
    if (elem.id != playerId) {
      if (socketio.sockets.sockets.get(elem.id)) {
        socketio.sockets.sockets.get(elem.id).emit(command, data);
      }
    }
  })
}

let refreshCards = (army, enemy) => {
  army.sortedCards = army.sortedCards.filter((elem) => elem.hp > 0);
  enemy.sortedCards = enemy.sortedCards.filter((elem) => elem.hp > 0);
}

let formatPlayerInfo = (player) => {
  player.roomId = 0

  player.hero.hp = 30
  player.hero.manabar = 0
  player.hero.mana = 0

  player.minions = []
  player.spells = []
  player.sortedCards = []

  player.ready = false
  player.turn = false

  player.scene = 'WaitScene'
}