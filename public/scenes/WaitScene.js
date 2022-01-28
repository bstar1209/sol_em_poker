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

    this.load.image('background', 'images/background.jpg'); // the back ground image for the scene
    this.load.image('room-sprite', 'images/room-sprite.jpg')
  },
  create: function  () {
    currentScene = this;
    this.add.image(0, 0, 'background').setOrigin(0).setScale(1)

    this.roomContainer = this.add.container(100, 120);

    this.add.image(50, 50, 'create_room_index0').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      getProvider().then(provider => {
        this.betSol({
          type: 0,
          order: 'create'
        })
      }).catch((err) => {
        console.log(err)
      });
    });

    this.add.image(200, 50, 'create_room_index1').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      getProvider().then(provider => {
        this.betSol({
          type: 1,
          order: 'create'
        })
      }).catch((err) => {
        console.log(err)
      });
    });

    this.add.image(350, 50, 'create_room_index2').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      getProvider().then(provider => {
        this.betSol({
          type: 2,
          order: 'create'
        })
      }).catch((err) => {
        console.log(err)
      });
    });

    this.add.image(500, 50, 'create_room_index3').setOrigin(0).setInteractive().on('pointerup', (pointer) => {
      getProvider().then(provider => {
        this.betSol({
          type: 3,
          order: 'create'
        })
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
          this.betSol({
            username: username,
            type: elem.type,
            order: 'join',
            roomId: elem.id,
          })
        }).catch((err) => {
          console.log(err)
        });
      }))
      roomObj.add(this.add.text(0, 0, `Room ${elem.id}\n(${[0.1, 0.25, 0.5, 1][elem.type]} SOL)`, { font: "bold 32px Arial", fill: "#fff" }))

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