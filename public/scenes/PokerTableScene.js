var PokerTableScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { "key": "PokerTableScene" });
  },
  init: function () { },
  preload: function () {
    this.load.image('poker_board', 'images/poker_board.png'); // the board image for the scene
    this.load.image('poker_table', 'images/poker_table.png'); // table image for the scene

    this.load.image('poker_user', 'images/poker_user.png'); // table image for the scene

    this.load.image('ready', 'images/ready.png');
    this.load.image('leave_room', 'images/leave_room.png')
    this.load.image('dealer', 'images/dealer.png')

    this.load.image('check', 'images/check.png')
    this.load.image('raise', 'images/raise.png')
    this.load.image('fold', 'images/fold.png')

    this.load.image('5_chip', 'images/5_chip.png')
    this.load.image('10_chip', 'images/10_chip.png')
    this.load.image('20_chip', 'images/20_chip.png')
    this.load.image('50_chip', 'images/50_chip.png')
    this.load.image('100_chip', 'images/100_chip.png')
    this.load.image('all_chip', 'images/all_chip.png')

    this.load.image('red_coin', 'images/coin/red.png')
    this.load.image('blue_coin', 'images/coin/blue.png')
    this.load.image('green_coin', 'images/coin/green.png')    

    for (let i = 2; i <= 14; i++) {
      let rank = this.getRank(i);

      this.load.image(`h${i}`, `images/cards/${rank}_of_hearts.png`)
      this.load.image(`d${i}`, `images/cards/${rank}_of_diamonds.png`)
      this.load.image(`c${i}`, `images/cards/${rank}_of_clubs.png`)
      this.load.image(`s${i}`, `images/cards/${rank}_of_spades.png`)
    }

    this.load.image('card_back', 'images/cards/card_back.png')
  },
  create: async function () {
    currentScene = this;

    let provider = await getProvider();
    username = provider.publicKey.toString()
    connectNewPlayer(username);

    this.pokerBoard = this.add.image(0, 0, 'poker_board').setOrigin(0).setScale(1)

    this.pokerTable = this.add.container(0, 0)
    this.pokerTable.add(this.add.image(0, 0, 'poker_table').setOrigin(0, 0).setScale(1));

    this.layedCardsGroup = this.add.container(550, 300)
    this.pokerTable.add(this.layedCardsGroup)

    this.foldBtn = this.add.image(100, 670, 'fold').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendFold({
        username: username,
      })
    })
    this.checkBtn = this.add.image(250, 670, 'check').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendCheck({
        username: username,
      })
    })
    this.raiseBtn = this.add.image(400, 670, 'raise').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendRaise({
        username: username,
      });
    })

    this.pluschipBtn = this.add.container(600, 670)
    this.pluschipBtn.add(this.add.image(0, 0, '5_chip').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendPlusCall({
        username: username,
        amount: '5',
      });
    }));
    this.pluschipBtn.add(this.add.image(80, 0, '10_chip').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendPlusCall({
        username: username,
        amount: '10',
      });
    }));
    this.pluschipBtn.add(this.add.image(160, 0, '20_chip').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendPlusCall({
        username: username,
        amount: '20',
      });
    }));
    this.pluschipBtn.add(this.add.image(240, 0, '50_chip').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendPlusCall({
        username: username,
        amount: '50',
      });
    }));
    this.pluschipBtn.add(this.add.image(320, 0, '100_chip').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendPlusCall({
        username: username,
        amount: '100',
      });
    }));
    this.pluschipBtn.add(this.add.image(400, 0, 'all_chip').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendPlusCall({
        username: username,
        amount: 'all_in',
      });
    }));

    this.foldBtn.visible = false
    this.checkBtn.visible = false
    this.raiseBtn.visible = false

    this.pluschipBtn.visible = false

    this.readyBtn = this.add.image(0, 0, 'ready').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendReady({
        username: username,
      });
    });
    this.readyBtn.visible = false

    this.leaveRoomBtn = this.add.image(145, 0, 'leave_room').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendLeaveRoom(username)
    })

    return;
  },
  initRoom: function () {
    this.seatPos = [
      [683, 597],
      [214, 248],
      [1148, 248],
    ];
        
    for (let i=0; i < curRoom.players.length; i++){
      let player = curRoom.players[i];
      if (player.username == username) {
        console.log("username seat", player.tableSeat);
        if (player.tableSeat != 0)
        {
          switch (player.tableSeat)
          {
            case 1:
              this.seatPos = [
                [1148, 248],
                [683, 597],
                [214, 248],                                
              ];
              break;
            case 2:
              this.seatPos = [
                [214, 248],                
                [1148, 248],
                [683, 597],                               
              ];
              break;
          }
        }
      }
    }
    
    // load the players
    for (let i = 0; i < curRoom.players.length; i++) {
      let player = curRoom.players[i];
      player.group = this.add.container(this.seatPos[player.tableSeat][0], this.seatPos[player.tableSeat][1])

      switch (this.seatPos[player.tableSeat][0]) {
        case 683:
          player.card = this.add.container(this.seatPos[player.tableSeat][0]-150, this.seatPos[player.tableSeat][1]-200)
          player.coin = this.add.container(this.seatPos[player.tableSeat][0]+100, this.seatPos[player.tableSeat][1]-80)
          player.betPan = this.add.container(this.seatPos[player.tableSeat][0], this.seatPos[player.tableSeat][1]-170)
          break;
        case 1148:
          player.card = this.add.container(this.seatPos[player.tableSeat][0]-120, this.seatPos[player.tableSeat][1]-10)
          player.coin = this.add.container(this.seatPos[player.tableSeat][0]-150, this.seatPos[player.tableSeat][1]-20)
          player.betPan = this.add.container(this.seatPos[player.tableSeat][0]-200, this.seatPos[player.tableSeat][1]+80)
          break;
        case 214:
          player.card = this.add.container(this.seatPos[player.tableSeat][0]+40, this.seatPos[player.tableSeat][1]-10)
          player.coin = this.add.container(this.seatPos[player.tableSeat][0]+150, this.seatPos[player.tableSeat][1]-40)
          player.betPan = this.add.container(this.seatPos[player.tableSeat][0]+180, this.seatPos[player.tableSeat][1]+80)
          break;
      }
      
      this.pokerTable.add(player.group) // sit the player on the table
      this.pokerTable.add(player.card)

      let poker_user = this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2);
      player.group.add(poker_user) // assign the avatar
      // assign the dealer sign
      switch (this.seatPos[player.tableSeat][0]) {
        case 683:
          player.group.add(this.add.image(10, -100, 'dealer').setOrigin(0.5, 0.5).setScale(0.5))
          break;
        case 1148:
          player.group.add(this.add.image(-100, 0, 'dealer').setOrigin(0.5, 0.5).setScale(0.5))
          break;
        case 214:
          player.group.add(this.add.image(100, 0, 'dealer').setOrigin(0.5, 0.5).setScale(0.5))
          break;
      }
      player.group.add(this.add.text(0, 20, `${player.username}`, { font: "bold 20px Arial", fill: "#000" }).setOrigin(0.5, 0))
      //player.group.add(this.add.text(0, 50, `Bet: $0 (0)`, { font: "20px Arial", fill: "#000" }))
      player.group.add(this.add.text(0, 50, ``, { font: "20px Arial", fill: "#000" }).setOrigin(0.5, 0))
      player.group.add(this.add.text(0, 0, `0`, { font: "bold 28px Arial", fill: "#000" }).setOrigin(0.5, 0.5))

      
      if (!player.dealer) {
        player.group.list[1].visible = false
      }

      if (player.status == 'folded') {
        player.group.list[3].setText(`FOLDED (${player.total_bet})`)
      }

      if (player.username == username && player.ready && player.turn) { // enable the order part
        let maxBet = curRoom.players.reduce((prev, current) => prev.bet > current.bet ? prev : current).bet

        if (maxBet == player.bet) {
          this.checkBtn.visible = true
          this.raiseBtn.visible = false
          this.foldBtn.visible = false
        } else {
          this.foldBtn.visible = true
          this.raiseBtn.visible = true
          this.checkBtn.visible = false
        }

        this.pluschipBtn.visible = true
      }
    }

    // load the layed cards
    for (let i = 0; i < curRoom.layedCards.length; i++) {
      this.layedCardsGroup.add(this.add.image(60 * i, 0, curRoom.layedCards[i]).setOrigin(0).setScale(0.1))
    }

    if (curRoom.players.length == 3 && curRoom.status != 'playing') {
      this.readyBtn.visible = true
    }

    let curPlayer = curRoom.players.find(elem => elem.username == username)
    if (curPlayer.ready) { // ready yet
      this.readyBtn.visible = false
    }
  },
  joinToRoom: function (player) {
    let tmpPlayer = curRoom.players.find(elem => elem.username == player.username);

    tmpPlayer.group = this.add.container(this.seatPos[tmpPlayer.tableSeat][0], this.seatPos[tmpPlayer.tableSeat][1])
    
    switch (this.seatPos[tmpPlayer.tableSeat][0]) {
      case 683:
        tmpPlayer.card = this.add.container(this.seatPos[player.tableSeat][0]-150, this.seatPos[player.tableSeat][1]-200)
        tmpPlayer.coin = this.add.container(this.seatPos[player.tableSeat][0]+100, this.seatPos[player.tableSeat][1]-80)
        tmpPlayer.betPan = this.add.container(this.seatPos[player.tableSeat][0], this.seatPos[player.tableSeat][1]-170)
        break;
      case 1148:
        tmpPlayer.card = this.add.container(this.seatPos[player.tableSeat][0]-120, this.seatPos[player.tableSeat][1]-10)
        tmpPlayer.coin = this.add.container(this.seatPos[player.tableSeat][0]-150, this.seatPos[player.tableSeat][1]-20)
        tmpPlayer.betPan = this.add.container(this.seatPos[player.tableSeat][0]-200, this.seatPos[player.tableSeat][1]+80)
        break;
      case 214:
        tmpPlayer.card = this.add.container(this.seatPos[player.tableSeat][0]+40, this.seatPos[player.tableSeat][1]-10)
        tmpPlayer.coin = this.add.container(this.seatPos[player.tableSeat][0]+150, this.seatPos[player.tableSeat][1]-40)
        tmpPlayer.betPan = this.add.container(this.seatPos[player.tableSeat][0]+180, this.seatPos[player.tableSeat][1]+80)
        break;
    }

    this.pokerTable.add(tmpPlayer.group) // sit the player on the table
    this.pokerTable.add(tmpPlayer.card) // sit the player on the table

    tmpPlayer.group.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar
    // assign the dealer sign
    switch (this.seatPos[tmpPlayer.tableSeat][0]) {
      case 683:
        tmpPlayer.group.add(this.add.image(10, -100, 'dealer').setOrigin(0.5, 0.5).setScale(0.5))
        break;
      case 1148:
        tmpPlayer.group.add(this.add.image(-100, 0, 'dealer').setOrigin(0.5, 0.5).setScale(0.5))
        break;
      case 214:
        tmpPlayer.group.add(this.add.image(100, 0, 'dealer').setOrigin(0.5, 0.5).setScale(0.5))
        break;
    }
    tmpPlayer.group.add(this.add.text(0, 20, `${tmpPlayer.username}`, { font: "bold 20px Arial", fill: "#000" }).setOrigin(0.5, 0))
    tmpPlayer.group.add(this.add.text(0, 50, ``, { font: "20px Arial", fill: "#000" }).setOrigin(0.5, 0))
    tmpPlayer.group.add(this.add.text(0, 0, `0`, { font: "bold 28px Arial", fill: "#000" }).setOrigin(0.5, 0.5))

    tmpPlayer.group.list[1].visible = false    

    if (curRoom.players.length == 3 && curRoom.status != 'playing') {
      this.readyBtn.visible = true
    }

    let curPlayer = curRoom.players.find(elem => elem.username == username)
    if (curPlayer.ready) { // ready yet
      this.readyBtn.visible = false
    }
  },
  removePlayer: function (data) {
    if (data.username == username) {
      currentScene.scene.start("WaitScene");
    } else {
      let index = curRoom.players.findIndex(elem => elem.username == data.username);

      curRoom.players[index].group.removeAll();
      curRoom.players[index].card.removeAll();

      curRoom.players.splice(index, 1);

      this.readyBtn.visible = false
    }
  },
  setReady: function () {
    this.readyBtn.visible = false
  },
  startTable: function (players) {
    for (let i = 0; i < players.length; i++) {
      let tmpPlayer = curRoom.players.find(elem => elem.username == players[i].username);
      tmpPlayer.handed = players[i].handed
      tmpPlayer.turn = players[i].turn

      tmpPlayer.game_coin = players[i].game_coin
      tmpPlayer.total_bet = players[i].total_bet
      tmpPlayer.bet = players[i].bet

      tmpPlayer.group.list[1].visible = false; // disable the dealer sign
      tmpPlayer.group.list[2].setColor('#000')
      //tmpPlayer.group.list[3].setText(`Bet: $${tmpPlayer.bet} (${tmpPlayer.total_bet})`)
      tmpPlayer.group.list[4].setText(`${tmpPlayer.game_coin}`)

      if(tmpPlayer.game_coin > 10)
      {
        let green_count = Math.floor(tmpPlayer.game_coin / 200)
        let blue_count = Math.floor((tmpPlayer.game_coin % 200) / 50)
        let red_count = Math.floor((tmpPlayer.game_coin % 50) / 10)
        
        for (let i=0; i<green_count; i++) {
          tmpPlayer.coin.add(this.add.image(0, 20-2*i, 'green_coin').setOrigin(0.5, 0.5).setScale(0.3))
        }

        for (let j=0; j<blue_count; j++) {
          tmpPlayer.coin.add(this.add.image(-40, 10-2*j, 'blue_coin').setOrigin(0.5, 0.5).setScale(0.3))
        }
      
        for (let n=0; n<red_count; n++)
        {
          tmpPlayer.coin.add(this.add.image(-10, -20-2*n, 'red_coin').setOrigin(0.5, 0.5).setScale(0.3))
        }
        
      }  
      //draw bet panel 
      this.reDrawBet(tmpPlayer)      
      
      if (tmpPlayer.username == username) {
        tmpPlayer.card.add(this.add.image(0, 70, tmpPlayer.handed[0]).setOrigin(0).setScale(0.1))
        tmpPlayer.card.add(this.add.image(60, 70, tmpPlayer.handed[1]).setOrigin(0).setScale(0.1))
      } else { // show the back
        tmpPlayer.card.add(this.add.image(0, 70, 'card_back').setOrigin(0).setScale(0.1))
        tmpPlayer.card.add(this.add.image(30, 70, 'card_back').setOrigin(0).setScale(0.1))
      }
    }      

    let dealerName = players.find(elem => elem.dealer).username;
    let tmpPlayer = curRoom.players.find(elem => elem.username == dealerName);
    tmpPlayer.group.list[1].visible = true; // show the dealer sign

    curRoom.players.find(elem => elem.turn).group.list[2].setColor('#000')

    tmpPlayer = curRoom.players.find(elem => elem.username == username);

    // clear the layed cards on the table
    this.layedCardsGroup.removeAll();

    if (tmpPlayer.turn) {
      this.foldBtn.visible = true
      this.raiseBtn.visible = true
      this.checkBtn.visible = false

      this.pluschipBtn.visible = true
    } else {
      this.foldBtn.visible = false
      this.raiseBtn.visible = false
      this.checkBtn.visible = false

      this.pluschipBtn.visible = false
    }
  },
  layCard: function (data) {
    let diffArr = data.cards.filter(e => !curRoom.layedCards.includes(e))

    for (let i = 0; i < diffArr.length; i++) {
      this.layedCardsGroup.add(this.add.image(60 * i + curRoom.layedCards.length, 0, diffArr[i]).setOrigin(0).setScale(0.1))
    }
  },
  raise: function (data) {
    let tmpPlayer = curRoom.players.find(elem => elem.username == data.player.username);

    tmpPlayer.game_coin = data.player.game_coin
    tmpPlayer.total_bet = data.player.total_bet
    tmpPlayer.bet = data.player.bet
    tmpPlayer.turn = false;

    tmpPlayer.group.list[2].setColor('#000')
    //tmpPlayer.group.list[3].setText(`Bet: $${tmpPlayer.bet} (${tmpPlayer.total_bet})`)
    tmpPlayer.group.list[4].setText(`${tmpPlayer.game_coin}`)

    let tmpNextPlayer = curRoom.players.find(elem => elem.username == data.nextUsername);
    tmpNextPlayer.turn = true;
    tmpNextPlayer.group.list[2].setColor('#000')

    //draw bet panel 
    this.reDrawBet(tmpPlayer)

    if (tmpNextPlayer.username == username) { // enable the order part
      let maxBet = curRoom.players.reduce((prev, current) => prev.bet > current.bet ? prev : current).bet

      if (maxBet == tmpNextPlayer.bet) {
        this.checkBtn.visible = true
        this.raiseBtn.visible = false
        this.foldBtn.visible = false
      } else {
        this.foldBtn.visible = true
        this.raiseBtn.visible = true
        this.checkBtn.visible = false
      }

      this.pluschipBtn.visible = true
    } else { // disable te order part
      this.foldBtn.visible = false
      this.raiseBtn.visible = false
      this.checkBtn.visible = false

      this.pluschipBtn.visible = false
    }
  },
  reDrawBet: function (data){
    if(data.total_bet >= 10)
    {
      let index = curRoom.players.findIndex(elem => elem.username == data.username);
      curRoom.players[index].betPan.removeAll();

      let green_count = Math.floor(data.total_bet / 200)
      let blue_count = Math.floor((data.total_bet % 200) / 50)
      let red_count = Math.floor((data.total_bet % 50) / 10)
      
      for (let i=0; i<green_count; i++) {
        data.betPan.add(this.add.image(0, 20-2*i, 'green_coin').setOrigin(0.5, 0.5).setScale(0.3))
      }

      for (let j=0; j<blue_count; j++) {
        data.betPan.add(this.add.image(-10, 10-2*j, 'blue_coin').setOrigin(0.5, 0.5).setScale(0.3))
      }
    
      for (let n=0; n<red_count; n++) {
        data.betPan.add(this.add.image(10, 20-2*n, 'red_coin').setOrigin(0.5, 0.5).setScale(0.3))
      }
      
      switch (this.seatPos[data.tableSeat][0]) {
        case 683:
          data.betPan.add(this.add.text(100, 0, `${data.total_bet}`, { font: "bold 15px Arial", fill: "#000" }).setOrigin(0.5, 0.5))
          break;
        case 1148:
          data.betPan.add(this.add.text(-80, -60, `${data.total_bet}`, { font: "bold 15px Arial", fill: "#000" }).setOrigin(0.5, 0.5))
          break;
        case 214:
          data.betPan.add(this.add.text(80, -60, `${data.total_bet}`, { font: "bold 15px Arial", fill: "#000" }).setOrigin(0.5, 0.5))
          break;
      } 
    }         
     
  },
  check: function (data) {
    let tmpPlayer = curRoom.players.find(elem => elem.username == data.player.username);
    let nextPlayer = curRoom.players.find(elem => elem.username == data.nextUsername);

    tmpPlayer.group.list[2].setColor('#000')

    nextPlayer.group.list[2].setColor('#000')

    if (nextPlayer.username == username) {
      this.foldBtn.visible = false
      this.raiseBtn.visible = false
      this.checkBtn.visible = true

      this.pluschipBtn.visible = true
    } else {
      this.foldBtn.visible = false
      this.raiseBtn.visible = false
      this.checkBtn.visible = false

      this.pluschipBtn.visible = false
    }
  },
  fold: function (data) {
    let tmpPlayer = curRoom.players.find(elem => elem.username == data.player.username);
    tmpPlayer.status = 'folded'
    tmpPlayer.group.list[2].setColor('#000')
    tmpPlayer.group.list[3].setText(`FOLDED (${tmpPlayer.total_bet})`)

    let tmpNextPlayer = curRoom.players.find(elem => elem.username == data.nextUsername);
    tmpNextPlayer.group.list[2].setColor('#000')
    if (tmpNextPlayer.username == username) { // enable the order part
      let maxBet = curRoom.players.reduce((prev, current) => prev.bet > current.bet ? prev : current).bet

      if (maxBet == tmpNextPlayer.bet) {
        this.checkBtn.visible = true
        this.raiseBtn.visible = false
        this.foldBtn.visible = false
      } else {
        this.foldBtn.visible = true
        this.raiseBtn.visible = true
        this.checkBtn.visible = false
      }

      this.pluschipBtn.visible = true
    } else { // disable te order part
      this.foldBtn.visible = false
      this.raiseBtn.visible = false
      this.checkBtn.visible = false

      this.pluschipBtn.visible = false
    }
  },
  newRound: function (players) {
    for (let i = 0; i < players.length; i++) {
      let tmpPlayer = curRoom.players.find(elem => elem.username == players[i].username);
      tmpPlayer.turn = players[i].turn

      tmpPlayer.game_coin = players[i].game_coin
      tmpPlayer.total_bet = players[i].total_bet
      tmpPlayer.bet = players[i].bet

      tmpPlayer.group.list[2].setColor('#000')
      if (tmpPlayer.status != 'folded') {
        tmpPlayer.group.list[3].setText(`Bet: $${tmpPlayer.bet} (${tmpPlayer.total_bet})`)
        tmpPlayer.group.list[4].setText(`${tmpPlayer.game_coin}`)
      }
    }

    curRoom.players.find(elem => elem.turn).group.list[2].setColor('#000')

    tmpPlayer = curRoom.players.find(elem => elem.username == username);

    if (tmpPlayer.turn) {
      this.foldBtn.visible = false
      this.raiseBtn.visible = false
      this.checkBtn.visible = true

      this.pluschipBtn.visible = true
    } else {
      this.foldBtn.visible = false
      this.raiseBtn.visible = false
      this.checkBtn.visible = false

      this.pluschipBtn.visible = false
    }
  },
  endRound: function (data) {
    for (let i = 0; i < curRoom.players.length; i++) {
      let tmpPlayer = curRoom.players[i]

      tmpPlayer.card.list[0].setTexture(tmpPlayer.handed[0])
      tmpPlayer.card.list[1].setTexture(tmpPlayer.handed[1])
    }
  },
  getCardName: function (card) {
    let suit = card.substring(0, 1);
    var rank = parseInt(card.substring(1));
  },
  getSuit: function (letter) {
    let suit;

    if (letter === 'c') {
      suit = 'clubs';
    } else if (letter === 'd') {
      suit = 'diamonds';
    } else if (letter === 'h') {
      suit = 'hearts';
    } else if (letter === 's') {
      suit = 'spades';
    }

    return suit;
  },
  getRank: function (i) {
    let rank;
    if (i === 14) {
      rank = 'ace';
    } else if (i === 13) {
      rank = 'king';
    } else if (i === 12) {
      rank = 'queen';
    } else if (i === 11) {
      rank = 'jack';
    } else if (0 < i && i < 11) {
      // Normal card 1 - 10
      rank = i;
    }

    return rank;
  },
});