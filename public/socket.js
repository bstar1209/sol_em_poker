let socket = io();

let connectNewPlayer = () => {
  socket.emit('new-player', {
    username: username
  });
}

socket.on('room-list', (data) => {
  currentScene.redrawAllRooms(data)
})

socket.on('player-list', (data) => {
  let player = data.players.find(elem => elem.username == username)

  if (player.roomId != 0) { // exist the room info
    switch (player.scene) {
      case 'WaitScene':
        currentScene.scene.start("HeroChoiseScene");
        break;
      case 'HeroChoiseScene':
        currentScene.scene.start("HeroChoiseScene");
        break;
      case 'LoadingScene':
        currentScene.scene.start("LoadingScene");
        break;
      case 'BattleScene':
        armyProfile = data.room.players.find(elem => elem.username == username)
        enemyProfile = data.room.players.find(elem => elem.username != username)

        currentScene.scene.start("BattleScene");
        break;
      default:
        break;
    }
  }
})

// create new room
let sendCreateRoom = (username) => {
  socket.emit('create-room', username)
}

socket.on('create-room', (data) => {
  switch (currentScene.scene.key) {
    case "WaitScene":
      if (data.username == username) { // you create the room
        curRoom = data.room;
        currentScene.scene.start("PokerTableScene");      
      } else {
        currentScene.redrawAllRooms({
          rooms: data.rooms
        })
      }
      break;
    default:
      break;
  }
})

// join to room
let sendJoinRoom = (username, roomId) => {
  socket.emit('join-room', {
    roomId: roomId,
    username: username
  })
}

socket.on('join-room', (data) => {
  if (data.username == username) { // you join the room
    curRoom = data.room;
    currentScene.scene.start("PokerTableScene");
  } else { // other join your room
    curRoom.players.push(data.player)
    currentScene.joinPlayer(data.player)
  }
})

// leave the room
let sendLeaveRoom = (username) => {
  socket.emit('leave-room', {
    username: username
  })
}

socket.on('leave-room', (data) => {
  if (data.username == username) {
    currentScene.scene.start("WaitScene");
  }
})

let selectHero = (username, hero) => {
  socket.emit('select-hero', {
    username: username,
    hero: hero
  });
}

let sendReady = (data) => {
  socket.emit('ready', data);
}

socket.on('ready', () => {
  currentScene.setReady()
})

let betMinionOrSpell = (username, card) => {
  socket.emit('bet-card', {
    username: username,
    card: card
  });
}

socket.on('bet-card', (data) => {
  currentScene.betCard(data)
})

socket.on('start-table', () => {
  currentScene.startTable()
})

let changeTurn = (username) => {
  socket.emit('change-turn', {
    username: username
  })
}

socket.on('change-turn', (data) => {
  currentScene.operateTurn(data)
})

let sendAttackHero = (username, card) => {
  socket.emit('attack-hero', {
    username: username,
    card: card
  })
}

socket.on('attack-hero', (data) => {
  currentScene.attackHero(data);
})

let sendAttackMinion = (username, from, to) => {
  socket.emit('attack-minion', {
    username: username,
    from: from,
    to: to,
  })
}

socket.on('attack-minion', (data) => {
  currentScene.attackMinion(data)
})

socket.on('dead-card', (data) => {
  currentScene.deadCard(data)
})

socket.on('end-battle', (data) => {
  currentScene.endBattle(data)
})