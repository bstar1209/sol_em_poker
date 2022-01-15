var HeroChoiseScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { "key": "HeroChoiseScene" });
  },
  init: function () { },
  preload: function () {
    this.load.image('connect_wallet', 'images/connect_wallet.png');
    this.load.image('disconnect_wallet', 'images/disconnect_wallet.png');
    this.load.image('leave_room', 'images/leave_room.png');
    this.load.image('background', 'images/background.png'); // the back ground image for the scene
  },
  create: function () {
    currentScene = this;
    
    let gameObj = this;
    this.add.image(0, 0, 'background').setOrigin(0).setScale(1);
    let addressText = this.add.text(0, 0, '', { font: "bold 24px Arial", fill: "#fff" });

    let connectWalletBtn = this.add.image(50, 50, 'connect_wallet').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      getProvider().then(provider => {
        addressText.setText(`Wallet Address: ${provider.publicKey.toString()}`);
        connectWalletBtn.visible = false; 
        disconnectWalletBtn.visible = true;

        $.ajax({
          url: "getTokensByOwner",
          type: "POST",
          data: JSON.stringify({
            publicKey: provider.publicKey.toString(),
          }),
          headers: {
            "Content-Type": "application/json"
          },
          success: function (response) {
            const filtered = response.filter((elem) => elem != null && elem.metadata.symbol == 'CHEEMS')
            for (var i = 0; i < filtered.length; i++) {
              const hero = filtered[i]
              
              gameObj.load.image(`${hero.metadata.name}`, `${hero.metadata.image}`);
              const heroCard = gameObj.add.image(i * 220, 150, `${hero.metadata.name}`).setOrigin(0)
              gameObj.load.once(Phaser.Loader.Events.COMPLETE, () => {
                heroCard.setTexture(`${hero.metadata.name}`)

                heroCard.setScale(200 / heroCard.width).setInteractive().on('pointerup', (pointer) => {
                  selectHero(username, hero.metadata)
                  gameObj.scene.start("MinionsChoiseScene");
                })
              })
              gameObj.load.start()
            }
          },
          error: function (jqXHR, textStatus, errorThrown) {
            console.log('error');
          }
        });
      }).catch(function (error) {
        console.log(error)
      });
    });

    let disconnectWalletBtn = this.add.image(50, 50, 'disconnect_wallet').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      addressText.setText(``);
      connectWalletBtn.visible = true;
      disconnectWalletBtn.visible = false;
    });

    disconnectWalletBtn.visible = false;

    this.add.image(250, 50, 'leave_room').setOrigin(0).setInteractive().on('pointerup', () => {
      sendLeaveRoom(username);
    })
  },
  update: function () {

  }
});