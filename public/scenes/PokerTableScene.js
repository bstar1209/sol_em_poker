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
  },
  create: function () {
    currentScene = this;

    this.pokerBoard = this.add.image(0, 0, 'poker_board').setOrigin(0).setScale(1)

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

    this.pokerUser = this.add.container(this.seatPos[curRoom.players[0].tableSeat][0], this.seatPos[curRoom.players[0].tableSeat][1])
    this.pokerTable.add(this.pokerUser)

    this.pokerUser.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar
    this.pokerUser.add(this.add.image(0, 0, 'poker_user').setOrigin(0.5, 0.5).setScale(0.2)) // assign the avatar

    this.pokerUser.add(this.add.text(0, 0, `${curRoom.players[0].username}`, { font: "bold 28px Arial", fill: "#fff" }))
  },
});