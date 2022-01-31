var WaitScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { "key": "WaitScene" });
  },
  init: function () { },
  preload: function () {
    this.load.image('create_room_index0', 'images/create_room_index0.png');
    this.load.image('create_room_index1', 'images/create_room_index1.png');
    this.load.image('create_room_index2', 'images/create_room_index2.png');
    this.load.image('create_room_index3', 'images/create_room_index3.png');

    this.load.image('room-sprite', 'images/room-sprite.png');
    this.load.image('top-bar', 'images/topbar.png');
    this.load.image('logo', 'images/logo.png');
  },
  create: function  () {
    currentScene = this;
    this.add.image(0, 0, 'top-bar').setOrigin(0).setScale(1);
    this.add.image(70, 70, 'logo').setOrigin(0, 0.5).setScale(0.2);

    this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#fff");    

    this.roomContainer = this.add.container(100, 250);
    this.topbarContainer = this.add.container(500, 0);

    this.topbarContainer.add(this.add.text(0, 20, `Play Now`, { font: "bold 20px Arial", fill: "#fff" }).setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      console.log('pointer', pointer);
    }));
    this.topbarContainer.add(this.add.text(200, 20, `Statistics`, { font: "bold 20px Arial", fill: "#fff" }));
    this.topbarContainer.add(this.add.text(400, 20, `FAQ`, { font: "bold 20px Arial", fill: "#fff" }));

    this.add.image(50, 150, 'create_room_index0').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      this.betSol({
        type: 0,
        order: 'create'
      })
      // getProvider().then(provider => {
      //   this.betSol({
      //     type: 0,
      //     order: 'create'
      //   })
      // }).catch((err) => {
      //   console.log(err)
      // });
    });

    this.add.image(200, 150, 'create_room_index1').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      this.betSol({
        type: 1,
        order: 'create'
      })
      // getProvider().then(provider => {
      //   this.betSol({
      //     type: 1,
      //     order: 'create'
      //   })
      // }).catch((err) => {
      //   console.log(err)
      // });
    });

    this.add.image(350, 150, 'create_room_index2').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      this.betSol({
        type: 2,
        order: 'create'
      })
      // getProvider().then(provider => {
      //   this.betSol({
      //     type: 2,
      //     order: 'create'
      //   })
      // }).catch((err) => {
      //   console.log(err)
      // });
    });

    this.add.image(500, 150, 'create_room_index3').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      this.betSol({
        type: 3,
        order: 'create'
      })
      // getProvider().then(provider => {
      //   this.betSol({
      //     type: 3,
      //     order: 'create'
      //   })
      // }).catch((err) => {
      //   console.log(err)
      // });
    });

    connectNewPlayer();
  },
  update: function () {

  },
  redrawAllRooms: function (data) {
    this.roomContainer.removeAll()

    for (let i = 0; i < data.rooms.length; i++) {
      const elem = data.rooms[i];
      let roomObj = this.add.container((i % 4) * 450, Math.floor(i / 2) * 160 + 50)
      let roomImage = this.add.image(0, 0, 'room-sprite').setOrigin(0).setScale(1);
      roomObj.add(roomImage.setInteractive().on('pointerup', (pointer) => {
        this.betSol({
          username: username,
          type: elem.type,
          order: 'join',
          roomId: elem.id,
        })
        // getProvider().then(provider => {
        //   this.betSol({
        //     username: username,
        //     type: elem.type,
        //     order: 'join',
        //     roomId: elem.id,
        //   })
        // }).catch((err) => {
        //   console.log(err)
        // });
      }))      
      roomObj.add(this.add.text(roomImage.width/10, roomImage.height*6.5/9, `Room ${elem.id}`, { font: "bold 20px Arial", fill: "#000" }))
      roomObj.add(this.add.text(roomImage.width*0.9/5, roomImage.height*7.5/9, `${[0.1, 0.25, 0.5, 1][elem.type]} SOL`, { font: "bold 20px Arial", fill: "#000" }))

      this.roomContainer.add(roomObj)
    }
  },
  betSol: function (data) {
    if (data.order == 'create') {
      sendCreateRoom({
        username: username,
        type: data.type,
        // signature: signature,
        // pubKey: provider.publicKey.toString(),
      });
    } else {
      sendJoinRoom({
        username: username,
        type: data.type,
        roomId: data.roomId,
        // signature: signature,
        // pubKey: provider.publicKey.toString(),
      });
    }

    return;

    $.ajax({
      url: "getOwner",
      type: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      success: async function (response) {
        let provider = await getProvider()
        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl(response.net));

        var transaction = new solanaWeb3.Transaction().add(
          solanaWeb3.SystemProgram.transfer({
            fromPubkey: provider.publicKey,
            toPubkey: new solanaWeb3.PublicKey(response.pubKey), // owner's public key
            lamports: [0.1, 0.25, 0.5, 1][data.type] * solanaWeb3.LAMPORTS_PER_SOL // Investing 1 SOL. Remember 1 Lamport = 10^-9 SOL.
          }),
        );

        // Setting the variables for the transaction
        transaction.feePayer = await provider.publicKey;
        let blockhashObj = await connection.getRecentBlockhash();
        transaction.recentBlockhash = await blockhashObj.blockhash;

        // Transaction constructor initialized successfully
        if (transaction) {
          console.log("Txn created successfully");
        }

        // Request creator to sign the transaction (allow the transaction)
        provider.signTransaction(transaction).then(async (signed) => {
          // The signature is generated
          connection.sendRawTransaction(signed.serialize()).then(async (signature) => {

            // Confirm whether the transaction went through or not
            await connection.confirmTransaction(signature);

            // Signature or the txn hash
            console.log("Signature: ", signature);

            if (data.order == 'create') {
              sendCreateRoom({
                username: username,
                type: data.type,
                signature: signature,
                pubKey: provider.publicKey.toString(),
              });
            } else {
              sendJoinRoom({
                username: username,
                type: data.type,
                roomId: data.roomId,
                signature: signature,
                pubKey: provider.publicKey.toString(),
              });
            }
            return true;
          }).catch((err) => {
            console.log(err)
          })
        }).catch((err) => { // reject the request or etc
          console.log(err)
        });

        return false
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log('error');
      }
    });
  },
});