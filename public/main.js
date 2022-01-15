var config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  width: 1366,
  height: 768,
  loader: {
    crossOrigin: 'anonymous'
  },
  physics: {
    default: 'arcade',
    arcade: {
      // debug: true,
      // debugShowBody: true
    }
  },
  scene: [
    WaitScene,
    PokerTableScene,
  ]
};

var game = new Phaser.Game(config);

let currentScene;

let curRoom;

game.scene.start("WaitScene");