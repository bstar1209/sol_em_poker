var WaitScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { "key": "WaitScene" });
  },
  init: function () { },
  preload: function () {
    this.load.image('create_room', 'images/create_room.png');
    this.load.image('background', 'images/background.jpg'); // the back ground image for the scene
    this.load.image('room-sprite', 'images/room-sprite.jpg')
  },
  create: function () {
    currentScene = this;

    this.roomContainer = null;

    this.add.image(0, 0, 'background').setOrigin(0).setScale(1)

    this.add.image(50, 50, 'create_room').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      sendCreateRoom(username);
    });

    connectNewPlayer();
  },
  update: function () {

  },
  redrawAllRooms: function (data) {
    this.roomContainer = this.add.container(100, 100)

    for (let i = 0; i < data.rooms.length; i++) {
      const elem = data.rooms[i];
      this.roomContainer.add(this.add.image(i * 250, 160, 'room-sprite').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
        sendJoinRoom(username, elem.id)
      }))
      this.roomContainer.add(this.add.text(i * 250, 160, `Room ${elem.id}`, { font: "bold 32px Arial", fill: "#fff" }))
    }
  }
});