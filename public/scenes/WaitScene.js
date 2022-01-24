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

    this.add.image(0, 0, 'background').setOrigin(0).setScale(1)

    this.roomContainer = this.add.container(100, 120);

    this.add.image(50, 50, 'create_room').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      getProvider().then(provider => {
        sendCreateRoom(username);
      }).catch((err) => {
        console.log(err)
      });
    });

    connectNewPlayer();
  },
  update: function () {

  },
  redrawAllRooms: function (data) {
    this.roomContainer.removeAll()

    for (let i = 0; i < data.rooms.length; i++) {
      const elem = data.rooms[i];
      let roomObj = this.add.container((i % 4) * 250, Math.floor(i / 4) * 160)
      roomObj.add(this.add.image(0, 0, 'room-sprite').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
        getProvider().then(provider => {
          sendJoinRoom(username, elem.id)
        }).catch((err) => {
          console.log(err)
        });
      }))
      roomObj.add(this.add.text(0, 0, `Room ${elem.id}`, { font: "bold 32px Arial", fill: "#fff" }))

      this.roomContainer.add(roomObj)
    }
  }
});