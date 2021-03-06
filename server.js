import { Server } from 'socket.io'
import express from 'express';
import { createServer } from 'http';

import session from 'express-session';
import cookieParser from 'cookie-parser';

import {
  CLUSTERS,
  ROOM_STATUS,
  ROOM_TYPE,
  PLAYER_STATUS,
  MAX_ROOM_PLAYERS,
  MAX_GAME_COIN,
  SMALL_BLIND,
} from './config/index.js'

import poker from './poker/index.js'

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
import { setTimeout } from 'timers/promises';
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

let cards = new Array(52);

// make the deck
let makeDeck = () => {
  var i;
  var j = 0;
  for (i = 2; i <= 14; i++) {
    cards[j++] = "h" + i;
    cards[j++] = "d" + i;
    cards[j++] = "c" + i;
    cards[j++] = "s" + i;
  }
}

// shuffle the deck
let shuffleDeck = () => {
  for (var i = 0; i < cards.length; ++i) {
    var j = Math.floor(Math.random() * (cards.length - 1));
    var tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
}

let checkSignIn = (req, res, next) => {
  if (req.session.user) {
    next();     // If session exists, proceed to page
  } else {
    res.redirect('/');
  }
}

// app.get("/login", function (req, res) {
//   res.render('login');
// });

app.post('/login', async (req, res) => {
  if (!req.body.username) {
    // res.render('login', { message: "Please enter both id and password" });
    console.log('login error')
  } else {
    // const user = await DB.getUser(req.body.username)
    // if (user) {
    req.session.user = req.body.username;
    //   res.redirect('/');
    //   return;
    // }

    // res.render('login', { message: "Invalid credentials!" });
    res.json({
      success: true,
      username: req.body.username,
    });
  }
});

// app.get('/logout', function (req, res) {
//   req.session.destroy(function () {
//     console.log("user logged out.")
//   });
//   res.redirect('/login');
// });

// app.get('/signup', function (req, res) {
//   res.render('signup');
// });

// app.post('/signup', async (req, res) => {
//   if (!req.body.username) {
//     res.status("400");
//     res.send("Invalid details!");
//   } else {
//     if (await DB.getUser(req.body.username)) {
//       res.send("User Already Exists! Login or choose another username");
//       return;
//     }

//     var newUser = { username: req.body.username };

//     DB.saveUser(newUser);

//     req.session.user = newUser;
//     res.redirect('/login');
//   }
// });

app.post("/getOwner", async (req, res) => {
  // load the owner wallet
  const ownerWallet = await Utils.getOwnerWallet(process.env.MASTER_WALLET);

  res.json({
    net: CLUSTERS.DEVNET,
    pubKey: ownerWallet.publicKey.toString()
  });
})

app.get('/', async (req, res) => {
  res.render('dashboard')
});

app.get('/table', checkSignIn, (req, res) => {
  res.render('table', {
    username: req.session.user.username
  })
});

// Serve the heros page 
app.get("/heros", (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

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
      handed: [],
      game_coin: 0,
      total_bet: 0,
      bet: 0,
      signature: '',
      pubKey: '',
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

  // create new room
  socket.on('create-room', (data) => {
    let player = getPlayer(data.username);
    if (!player) {
      console.log('is not exist');
      return;
    }

    if (player.roomId != 0) {
      console.log(`${player.username} has already room`);
      return;
    }

    unqueRoomId++;
    player.roomId = unqueRoomId; // assign the room id
    player.scene = 'PokerTableScene'
    // player.signature = data.signature
    // player.pubKey = data.pubKey

    let room = {
      id: unqueRoomId,
      players: [],
      status: ROOM_STATUS.IDLE,
      layedCards: [],
      type: data.type,
      reward: 0,
    }

    let randomChance = Math.random();
    console.log(randomChance)

    if (randomChance >= 0.69) {
      room.reward = 2
    } else if (randomChance >= 0.21) {
      room.reward = 3
    } else if (randomChance >= 0.07) {
      room.reward = 5
    } else if (randomChance >= 0.029) {
      room.reward = 10
    } else if (randomChance >= 0.001) {
      room.reward = 50
    }

    player.tableSeat = Math.floor(Math.random() * 3); // set the table seat number
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

  // join to room
  socket.on('join-room', (data) => {
    let player = getPlayer(data.username);

    if (!player) {
      console.log('is not exist');
      return;
    }

    if (player.roomId != 0) {
      console.log(`${player.username} has already room`);
      return;
    }

    let room = getRoom(data.roomId)
    if (!room) {
      console.log('room does not exist');
      return;
    }

    if (room.players.length >= MAX_ROOM_PLAYERS) {
      console.log('players are limited')
      return;
    }

    if (room.status == ROOM_STATUS.PLAYING) {
      console.log('Room is playing')
      return;
    }

    player.roomId = data.roomId; // assign the room id
    // player.signature = data.signature // assign the signature
    // player.pubKey = data.pubKey

    let randomSeat = Math.floor(Math.random() * 3);

    while (room.players.find(elem => elem.tableSeat == randomSeat)) {
      randomSeat = Math.floor(Math.random() * 3);
    }

    player.tableSeat = randomSeat; // set the table seat number
    room.players.push(player);

    player.scene = 'PokerTableScene'

    socket.emit('join-room', {
      username: player.username,
      room: room,
    })

    broadcastToRoom(player.roomId, player.id, 'join-room', {
      username: player.username,
      player: player,
    });
  })

  // leave room
  socket.on('leave-room', (data) => {
    let player = getPlayer(data.username);
    if (!player) {
      console.log('is not exist');
      return;
    }

    let room = getRoom(player.roomId);
    if (!room) {
      console.log('room does not exist');
      return;
    }

    if (room.status == ROOM_STATUS.PLAYING) {
      console.log('cannot leave room while playing now.')
      return
    }

    // Utils.transferSOL(process.env.MASTER_WALLET, player.pubKey, ROOM_TYPE[room.type])

    broadcastToRoom(player.roomId, '', 'leave-room', {
      username: player.username,
    })

    player.roomId = 0
    player.signature = ''
    player.scene = 'WaitScene'

    room.players = room.players.filter(elem => elem.username != data.username)

    if (room.players.length == 0) { // remove room
      roomList = roomList.filter(elem => elem.players.length != 0)

      broadcastToPlayer('', 'remove-room', {
        rooms: roomList,
      })
    }
  })

  socket.on('select-hero', (data) => {
    let player = getPlayer(data.username);
    player.hero.nft = data.hero;
  })

  socket.on('ready', async (data) => {
    let player = getPlayer(data.username);
    if (!player) {
      console.log('is not exist');
      return;
    }

    let room = getRoom(player.roomId);
    if (!room) {
      console.log('room is not exist')
      return;
    }

    player.ready = true
    player.game_coin = MAX_GAME_COIN;
    socket.emit('ready');

    if (room.players.filter(elem => elem.ready).length == MAX_ROOM_PLAYERS) { // all players are ready
      let tmpDealer = room.players[Math.floor(Math.random() * room.players.length)]
      tmpDealer.dealer = true;

      // const holderWallet = await Utils.getOwnerWallet(process.env.HOLDER_WALLET);
      // // 8% to Holder Wallet
      // Utils.transferSOL(process.env.MASTER_WALLET, holderWallet.publicKey.toString(), ROOM_TYPE[room.type] * 0.08)

      // const creatorWallet = await Utils.getOwnerWallet(process.env.CREATOR_WALLET);
      // // 2% to Creator Wallet
      // Utils.transferSOL(process.env.MASTER_WALLET, creatorWallet.publicKey.toString(), ROOM_TYPE[room.type] * 0.02)

      startTable(room, tmpDealer)

      broadcastToRoom(player.roomId, '', 'start-table', {
        players: room.players
      })
    }
  })

  socket.on('raise', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!room) {
      console.log('room is not exist')
      return;
    }

    let maxBettedPlayer = room.players.reduce((prev, current) => prev.bet > current.bet ? prev : current)

    // calculate the diff
    let diff = maxBettedPlayer.bet - player.bet;

    // check if can raise
    if (diff <= 0 || maxBettedPlayer.username == player.username) {
      return;
    }

    if (diff > player.game_coin) { // validate the diff
      diff = player.game_coin
      player.game_coin = 0
    } else {
      player.game_coin -= diff
    }

    player.bet += diff;
    player.total_bet += diff
    player.turn = false;

    let tmpPlayer = getNextSeatPlayer(room.players, player)
    if (tmpPlayer) {
      tmpPlayer.turn = true

      broadcastToRoom(player.roomId, '', 'raise', {
        player: player,
        nextUsername: tmpPlayer.username
      });
    }
  })

  socket.on('check', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!room) {
      console.log('room is not exist')
      return;
    }

    let maxBet = room.players.reduce((prev, current) => prev.bet > current.bet ? prev : current).bet

    if (maxBet != player.bet && player.game_coin != 0) { // validate if can check
      console.log(`${player.username} can not be able to check`)
      return
    }

    player.status = PLAYER_STATUS.CHECKED
    player.turn = false

    let nextPlayer = getNextSeatPlayer(room.players, player)
    if (nextPlayer) { // next seat player
      if ((nextPlayer.bet == maxBet && nextPlayer.bet != 0) ||
        (nextPlayer.status == PLAYER_STATUS.CHECKED && nextPlayer.bet == 0)) { // have to lay the new card
        if (room.layedCards.length == 5) { // for final result
          // get the winner in the table
          let winner = poker.getWinner(room.players, room.layedCards);
          console.log(winner)
          winner = room.players.find(elem => elem.username == winner.username)
          for (let i = 0; i < room.players.length; i++) {
            winner.game_coin += room.players[i].total_bet;
            room.players[i].bet = 0
            room.players[i].total_bet = 0
            room.players[i].status = PLAYER_STATUS.PLAYING

            room.players[i].handed = []
          }

          broadcastToRoom(room.id, '', 'end-round', {
            player: winner,
          })

          // init the table
          initTable(room)

          // get the busting players
          let bustingPlayers = room.players.filter(elem => elem.game_coin <= 0 && elem.username != winner.username)
          for (let i = 0; i < bustingPlayers.length; i++) {
            const elem = bustingPlayers[i];
            broadcastToRoom(elem.roomId, elem.id, 'leave-room', {
              username: elem.username,
            })

            elem.roomId = 0
            elem.scene = 'WaitScene'
            elem.status = PLAYER_STATUS.BUSTED
          }

          // remove the old dealer
          let tmpDealer = room.players.find(elem => elem.dealer)
          tmpDealer.dealer = false;

          // set the new dealer
          tmpDealer = getNextSeatPlayer(room.players, player)
          tmpDealer.dealer = true;

          // remove the busted players
          room.players = room.players.filter(e => e.status != PLAYER_STATUS.BUSTED)

          if (room.players.length == 1) { // end the game
            room.status = ROOM_STATUS.IDLE

            winner.ready = false
            winner.turn = false
            winner.game_coin = 0
            winner.total_bet = 0
            winner.bet = 0
            winner.status = PLAYER_STATUS.IDLE
            winner.dealer = false

            // Utils.transferSOL(process.env.MASTER_WALLET, winner.pubKey, ROOM_TYPE[room.type] * room.reward)

            winner.roomId = 0
            room.players = []

            roomList = roomList.filter(elem => elem.players.length != 0)

            broadcastToPlayer('', 'remove-room', {
              rooms: roomList,
            })
            return;
          }

          // start new table
          startTable(room, tmpDealer)

          broadcastToRoom(room.id, '', 'start-table', {
            players: room.players,
          })
        } else {
          if (room.layedCards.length == 0) { // lay 3 cards first
            room.layedCards.push(cards[cards.length - 1])
            room.layedCards.push(cards[cards.length - 2])
            room.layedCards.push(cards[cards.length - 3])
          } else if (0 < room.layedCards.length && room.layedCards.length < 5) { // have to lay the new one card
            room.layedCards.push(cards[cards.length - (room.layedCards.length + 1)])
          }

          broadcastToRoom(player.roomId, '', 'lay-card', {
            cards: room.layedCards,
          });

          // new round and clear the bet
          room.players.forEach(elem => {
            elem.bet = 0;
            elem.status != PLAYER_STATUS.FOLDED ? elem.status = PLAYER_STATUS.PLAYING : elem.status = PLAYER_STATUS.FOLDED
          })

          nextPlayer = getNextSeatPlayer(room.players, room.players.find(elem => elem.dealer))
          if (nextPlayer) {
            nextPlayer.turn = true
            broadcastToRoom(player.roomId, '', 'new-round', {
              players: room.players,
            });
          }
        }
      } else {
        broadcastToRoom(player.roomId, '', 'check', {
          player: player,
          nextUsername: nextPlayer.username,
        });
      }
    }
  })

  socket.on('plus-call', (data) => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!room) {
      console.log('room is not exist')
      return;
    }

    let maxBettedPlayer = room.players.reduce((prev, current) => prev.bet > current.bet ? prev : current)

    // calculate the diff
    let diff = maxBettedPlayer.bet - player.bet;

    switch (data.amount) {
      case '5':
        diff += 5;
        break;
      case '10':
        diff += 10;
        break;
      case '20':
        diff += 20;
        break;
      case '50':
        diff += 50;
        break;
      case '100':
        diff += 100;
        break;
      case 'all_in':
        diff += player.game_coin
        break;
    }

    // check if can raise
    if (diff <= 0) {
      return;
    }

    if (diff > player.game_coin) { // validate the diff
      diff = player.game_coin
      player.game_coin = 0
    } else {
      player.game_coin -= diff
    }

    player.bet += diff;
    player.total_bet += diff
    player.turn = false;

    let tmpPlayer = getNextSeatPlayer(room.players, player)
    if (tmpPlayer) {
      tmpPlayer.turn = true

      broadcastToRoom(player.roomId, '', 'raise', {
        player: player,
        nextUsername: tmpPlayer.username
      });
    }
  })

  socket.on('fold', data => {
    let player = getPlayer(data.username);
    let room = getRoom(player.roomId);

    if (!room) {
      console.log('room is not exist')
      return;
    }

    player.status = PLAYER_STATUS.FOLDED
    player.turn = false

    let tmpPlayer = getNextSeatPlayer(room.players, player)
    if (tmpPlayer) {
      broadcastToRoom(player.roomId, '', 'fold', {
        player: player,
        nextUsername: tmpPlayer.username,
      });
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

let broadcastToRoom = (roomId, playerId, command, data) => { // playerId: expected
  let room = getRoom(roomId);

  for (let i = 0; i < room.players.length; i++) {
    const elem = room.players[i];
    if (elem.id != playerId && socketio.sockets.sockets.get(elem.id)) {
      socketio.sockets.sockets.get(elem.id).emit(command, data);
    }
  }
}

let broadcastToPlayer = (playerId, command, data) => { // playerId: expected id
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

let getNextSeatPlayer = (players, curPlayer) => {
  for (let i = (curPlayer.tableSeat + 1) % 3; ;) {
    let nextSeatPlayer = players.find(elem => elem.tableSeat == i && elem.status != PLAYER_STATUS.FOLDED && elem.status != PLAYER_STATUS.BUSTED)

    if (nextSeatPlayer) {
      return nextSeatPlayer;
    }

    if (i == curPlayer.tableSeat) {
      return null;
    }

    i++
    i = i % 3
  }
}

let initTable = (room) => {
  room.layedCards = []
}

let startTable = (room, dealer) => {
  room.status = ROOM_STATUS.PLAYING

  makeDeck()
  shuffleDeck()

  // assign two cards into players
  for (let i = (dealer.tableSeat + 1) % 3, j = 0; ;) {
    let tmpPlayer = room.players.find(elem => elem.tableSeat == i)
    if (tmpPlayer) {
      tmpPlayer.status = PLAYER_STATUS.PLAYING

      tmpPlayer.handed[0] = cards[j++]
      tmpPlayer.handed[1] = cards[j++]
      tmpPlayer.turn = false;
    }

    if (i == dealer.tableSeat) break;

    i++
    i = i % 3
  }

  let tmpPlayer = getNextSeatPlayer(room.players, dealer);
  if (tmpPlayer) {
    tmpPlayer.total_bet = SMALL_BLIND;
    tmpPlayer.bet = SMALL_BLIND;
    tmpPlayer.game_coin -= tmpPlayer.total_bet
  }

  tmpPlayer = getNextSeatPlayer(room.players, tmpPlayer);
  if (tmpPlayer) {
    tmpPlayer.total_bet = 2 * SMALL_BLIND;
    tmpPlayer.bet = 2 * SMALL_BLIND;
    tmpPlayer.game_coin -= tmpPlayer.total_bet
  }

  tmpPlayer = getNextSeatPlayer(room.players, tmpPlayer);
  if (tmpPlayer) {
    tmpPlayer.turn = true
  }
}