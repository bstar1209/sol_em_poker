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

    for (let i = 2; i <= 14; i++) {
      let rank = this.getRank(i);

      this.load.image(`h${i}`, `images/cards/${rank}_of_hearts.png`)
      this.load.image(`d${i}`, `images/cards/${rank}_of_diamonds.png`)
      this.load.image(`c${i}`, `images/cards/${rank}_of_clubs.png`)
      this.load.image(`s${i}`, `images/cards/${rank}_of_spades.png`)
    }
  },
  create: function () {
    currentScene = this;

    this.pokerBoard = this.add.image(0, 0, 'poker_board').setOrigin(0).setScale(1)

    this.foldBtn = this.add.image(0, 400, 'fold').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendFold({
        username:username,
      })
    })
    this.checkBtn = this.add.image(150, 400, 'check').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendCheck({
        username:username,
      })
    })
    this.raiseBtn = this.add.image(150, 400, 'raise').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendRaise({
        username: username,
      });
    })

    this.pluschipBtn = this.add.container(0, 600)
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

    this.pokerTable = this.add.container(this.pokerBoard.width / 2, this.pokerBoard.height / 2 - 100)
    this.pokerTable.add(this.add.image(0, 0, 'poker_table').setOrigin(0.5, 0.5).setScale(1));

    this.layedCardsGroup = this.add.container(-150, -50)
    this.pokerTable.add(this.layedCardsGroup)

    this.seatPos = [
      [270, 170],
      [90, 170],
      [-90, 170],
      [-270, 170],
      [-370, 0],
      [-270, -200],
      [-90, -200],
      [90, -200],
      [270, -200],
      [370, 0],
    ];

    let curPlayer = curRoom.players.find(elem => elem.username == username)
    if (curPlayer.ready) { // ready yet
      this.readyBtn.visible = false
    }

    for (let i = 0; i < curRoom.players.length; i++) {
      let player = curRoom.players[i];
      player.group = this.add.container(this.seatPos[player.tableSeat][0], this.seatPos[player.tableSeat][1])
      player.card = this.add.container(this.seatPos[player.tableSeat][0], this.seatPos[player.tableSeat][1])

      this.pokerTable.add(player.group) // sit the player on the table
      this.pokerTable.add(player.card)

      player.group.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar
      player.group.add(this.add.image(0, 0, 'dealer').setOrigin(0, 0.5).setScale(1)) // assign the dealer sign
      player.group.add(this.add.text(0, 0, `${player.username}`, { font: "bold 28px Arial", fill: "#fff" }))
      player.group.add(this.add.text(0, 30, `Bet: $0 (0)\n$0`, { font: "20px Arial", fill: "#fff" }))

      if (!player.dealer) {
        player.group.list[1].visible = false
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

    for (let i = 0; i < curRoom.layedCards.length; i++) {
      this.layedCardsGroup.add(this.add.image(60 * i, 0, curRoom.layedCards[i]).setOrigin(0).setScale(0.1))
    }
  },
  joinToRoom: function (player) {
    let tmpPlayer = curRoom.players.find(elem => elem.username == player.username);

    tmpPlayer.group = this.add.container(this.seatPos[tmpPlayer.tableSeat][0], this.seatPos[tmpPlayer.tableSeat][1])
    tmpPlayer.card = this.add.container(this.seatPos[tmpPlayer.tableSeat][0], this.seatPos[tmpPlayer.tableSeat][1])

    this.pokerTable.add(tmpPlayer.group) // sit the player on the table
    this.pokerTable.add(tmpPlayer.card) // sit the player on the table

    tmpPlayer.group.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar
    tmpPlayer.group.add(this.add.image(0, 0, 'dealer').setOrigin(0, 0.5).setScale(1)) // assign the dealer sign
    tmpPlayer.group.add(this.add.text(0, 0, `${tmpPlayer.username}`, { font: "bold 28px Arial", fill: "#fff" }))
    tmpPlayer.group.add(this.add.text(0, 30, `Bet: $0 (0)\$0`, { font: "20px Arial", fill: "#fff" }))

    tmpPlayer.group.list[1].visible = false
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
      tmpPlayer.group.list[2].setColor('#fff')
      tmpPlayer.group.list[3].setText(`Bet: $${tmpPlayer.bet} (${tmpPlayer.total_bet})\n$${tmpPlayer.game_coin}`)

      tmpPlayer.card.add(this.add.image(0, 70, tmpPlayer.handed[0]).setOrigin(0).setScale(0.1))
      tmpPlayer.card.add(this.add.image(50, 70, tmpPlayer.handed[1]).setOrigin(0).setScale(0.1))
    }

    let dealerName = players.find(elem => elem.dealer).username;
    let tmpPlayer = curRoom.players.find(elem => elem.username == dealerName);
    tmpPlayer.group.list[1].visible = true; // show the dealer sign

    curRoom.players.find(elem => elem.turn).group.list[2].setColor('#f00')

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
    let diffArr =  data.cards.filter(e => !curRoom.layedCards.includes(e))

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

    tmpPlayer.group.list[2].setColor('#fff')
    tmpPlayer.group.list[3].setText(`Bet: $${tmpPlayer.bet} (${tmpPlayer.total_bet})\n$${tmpPlayer.game_coin}`)

    let tmpNextPlayer = curRoom.players.find(elem => elem.username == data.nextUsername);
    tmpNextPlayer.turn = true;
    tmpNextPlayer.group.list[2].setColor('#f00')

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
  check: function (data) {
    let tmpPlayer = curRoom.players.find(elem => elem.username == data.player.username);
    let tmpNextPlayer = curRoom.players.find(elem => elem.username == data.nextUsername);

    tmpPlayer.group.list[2].setColor('#fff')

    tmpNextPlayer.group.list[2].setColor('#f00')

    if (tmpNextPlayer.username == username) {
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
    tmpPlayer.group.list[2].setColor('#fff')
    tmpPlayer.group.list[3].setText(`FOLDED (${tmpPlayer.total_bet})`)

    let tmpNextPlayer = curRoom.players.find(elem => elem.username == data.nextUsername);
    tmpNextPlayer.group.list[2].setColor('#f00')
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

      tmpPlayer.group.list[2].setColor('#fff')
      if (tmpPlayer.status != 'folded') {
        tmpPlayer.group.list[3].setText(`Bet: $${tmpPlayer.bet} (${tmpPlayer.total_bet})\n$${tmpPlayer.game_coin}`)
      }
    }

    curRoom.players.find(elem => elem.turn).group.list[2].setColor('#f00')

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