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

    this.foldBtn = this.add.image(0, 100, 'fold').setOrigin(0).setScale(1)
    this.checkBtn = this.add.image(150, 100, 'check').setOrigin(0).setScale(1)
    this.raiseBtn = this.add.image(150, 100, 'raise').setOrigin(0).setScale(1)

    this.foldBtn.visible = false
    this.checkBtn.visible = false
    this.raiseBtn.visible = false

    this.readyBtn = this.add.image(0, 0, 'ready').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendReady({
        username: username,
      });
    });

    this.pokerTable = this.add.container(this.pokerBoard.width / 2 + 200, this.pokerBoard.height / 2)
    this.pokerTable.add(this.add.image(0, 0, 'poker_table').setOrigin(0.5, 0.5).setScale(1));

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

    for (let i = 0; i < curRoom.players.length; i++) {
      curRoom.players[i].group = this.add.container(this.seatPos[curRoom.players[i].tableSeat][0], this.seatPos[curRoom.players[i].tableSeat][1])
      curRoom.players[i].card = this.add.container(this.seatPos[curRoom.players[i].tableSeat][0], this.seatPos[curRoom.players[i].tableSeat][1])

      this.pokerTable.add(curRoom.players[i].group) // sit the player on the table
      this.pokerTable.add(curRoom.players[i].card)

      curRoom.players[i].group.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar
      curRoom.players[i].group.add(this.add.image(0, 0, 'dealer').setOrigin(0, 0.5).setScale(1)) // assign the dealer sign
      curRoom.players[i].group.add(this.add.text(0, 0, `${curRoom.players[i].username}`, { font: "bold 28px Arial", fill: "#fff" }))
      curRoom.players[i].group.add(this.add.text(0, 30, `Bet: $0 (0)`, { font: "bold 28px Arial", fill: "#fff" }))

      curRoom.players[i].group.list[1].visible = false
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
    tmpPlayer.group.add(this.add.text(0, 30, `Bet: $0 (0)`, { font: "bold 28px Arial", fill: "#fff" }))

    tmpPlayer.group.list[1].visible = false
  },
  setReady: function () {
    this.readyBtn.visible = false
  },
  startTable: function (players) {
    let dealerName = players.find(elem => elem.dealer).username;
    let tmpPlayer = curRoom.players.find(elem => elem.username == dealerName);
    tmpPlayer.group.list[1].visible = true; // show the dealer sign

    for (let i = 0; i < players.length; i++) {
      let tmpPlayer = curRoom.players.find(elem => elem.username == players[i].username);
      tmpPlayer.handed = players[i].handed
      tmpPlayer.turn = players[i].turn

      tmpPlayer.game_coin = players[i].game_coin
      tmpPlayer.total_bet = players[i].total_bet
      tmpPlayer.bet = players[i].bet

      tmpPlayer.group.list[3].setText(`Bet: $${tmpPlayer.bet} (${tmpPlayer.total_bet})`)

      tmpPlayer.card.add(this.add.image(0, 60, tmpPlayer.handed[0]).setOrigin(0).setScale(0.1))
      tmpPlayer.card.add(this.add.image(50, 60, tmpPlayer.handed[1]).setOrigin(0).setScale(0.1))
    }

    tmpPlayer = curRoom.players.find(elem => elem.username == username);
    console.log(tmpPlayer)
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
  }
});