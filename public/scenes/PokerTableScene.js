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
  },
  create: function () {
    currentScene = this;

    this.pokerBoard = this.add.image(0, 0, 'poker_board').setOrigin(0).setScale(1)
    this.readyBtn = this.add.image(0, 0, 'ready').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      sendReady({
        username: username,
      });
    });
    
    this.pokerTable = this.add.container(this.pokerBoard.width / 2, this.pokerBoard.height / 2)
    this.pokerTable.add(this.add.image(0, 0, 'poker_table').setOrigin(0.5, 0.5).setScale(1));

    this.seatPos = [
      [270, 170],
      [90, 170],
      [-90, 170],
      [-270, 170],
      [-370, 0],
      [-270, -170],
      [-90, -170],
      [90, -170],
      [270, -170],
      [370, 0],
    ];

    for (let i = 0; i < curRoom.players.length; i++) {
      curRoom.players[i].group = this.add.container(this.seatPos[curRoom.players[i].tableSeat][0], this.seatPos[curRoom.players[i].tableSeat][1])

      this.pokerTable.add(curRoom.players[i].group) // sit the player on the table

      curRoom.players[i].group.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar
      curRoom.players[i].group.add(this.add.image(0, 0, 'dealer').setOrigin(0, 0.5).setScale(1)) // assign the dealer sign
      curRoom.players[i].group.add(this.add.text(0, 0, `${curRoom.players[i].username}`, { font: "bold 28px Arial", fill: "#fff" }))

      curRoom.players[i].group.list[1].visible = false
    }
  },
  joinToRoom: function (player) {
    player.group = this.add.container(this.seatPos[player.tableSeat][0], this.seatPos[player.tableSeat][1])
    this.pokerTable.add(player.group) // sit the player on the table

    player.group.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar
    player.group.add(this.add.text(0, 0, `${player.username}`, { font: "bold 28px Arial", fill: "#fff" }))
  },
  setReady: function () {
    this.readyBtn.visible = false
  },
  startTable: function (players) {
    let dealerName = players.find(elem => elem.dealer).username;
    let tmpPlayer = curRoom.players.find(elem => elem.username == dealerName);
    tmpPlayer.group.list[1].visible = true; // show the dealer sign

    
  }
});