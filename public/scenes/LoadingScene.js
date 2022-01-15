var LoadingScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { "key": "LoadingScene" });
  },
  init: function () { },
  preload: function () {
    this.load.image('leave_room', 'images/leave_room.png');
    this.load.image('background', 'images/background.png'); // the back ground image for the scene
  },
  create: function () {
    currentScene = this;

    this.add.image(0, 0, 'background').setOrigin(0).setScale(1);
    this.add.text(0, 0, 'Loading...Please wait until opponent will be ready', { font: "bold 28px Arial", fill: "#fff" });

    this.add.image(0, 50, 'leave_room').setOrigin(0).setInteractive().on('pointerup', () => {
      sendLeaveRoom(username);
    })
  },
  update: function () {

  }
});