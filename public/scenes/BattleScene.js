let BattleScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { "key": "BattleScene" });
  },
  init: function () { },
  preload: function () {
    this.load.image('battle_board', 'images/battle_board.png'); // the back ground image for the scene
    this.load.image('bet', 'images/bet.png'); // the back ground image for the scene

    this.load.image('army_turn_button', 'images/army_turn_button.png');
    this.load.image('enemy_turn_button', 'images/enemy_turn_button.png');

    this.load.image('card_back', 'images/card_back.png')

    // load the army hero image
    this.load.image(`${armyProfile.hero.nft.name}`, `${armyProfile.hero.nft.image}`)

    // load the enemy hero image
    this.load.image(`${enemyProfile.hero.nft.name}`, `${enemyProfile.hero.nft.image}`)

    // load all the minions
    for (var i = 0; i < minionNames.length; i++) {
      this.load.image(`${minionNames[i]}`, `/images/minions/${minionNames[i]}.png`);
      this.load.image(`${minionNames[i]}_fight`, `/images/minions/${minionNames[i]}_fight.png`);
    }

    // load all the spells
    for (var i = 0; i < spellNames.length; i++) {
      this.load.image(`${spellNames[i]}`, `/images/spells/${spellNames[i]}.png`);
    }
  },
  create: function () {
    currentScene = this;

    this.battleBoard = this.add.image(0, 0, 'battle_board').setOrigin(0, 0).setScale(1);

    this.add.image(0, this.battleBoard.height / 2, 'bet').setOrigin(0, 0.5).setScale(1).setInteractive().on('pointerup', (pointer) => {
      if (!armyProfile.turn) {
        alert("It isn't your turn")
        return;
      }

      if (!this.selectedCard) {
        alert('No card is selected')
        return;
      }

      if (this.selectedCard.bet) {
        this.selectedCard = null
        alert('This card is already beted')
        return;
      }

      if (armyProfile.minions.filter(elem => elem.bet).length >= 5) {
        this.selectedCard = null
        alert('Max bet: 5')
        return;
      }

      if (this.selectedCard.mana > armyProfile.hero.mana) {
        this.selectedCard = null
        alert('Not enough mana')
        return;
      }

      betMinionOrSpell(username, this.selectedCard.name);
    });

    this.turnBtn = this.add.image(this.battleBoard.width, this.battleBoard.height / 2, 'army_turn_button').setOrigin(1, 0.5).setScale(1).setInteractive().on('pointerup', (pointer) => {
      changeTurn(username)
    })

    this.armyBackCard = this.add.container(this.battleBoard.width, this.battleBoard.height / 2 + 100)
    this.armyBackCard.add(this.add.image(0, 0, 'card_back').setOrigin(1, 0).setScale(0.5))
    this.armyBackCard.add(this.add.text(-50, 0, ``, { font: "bold 32px Arial", fill: "#000" }))

    this.enemyBackCard = this.add.container(this.battleBoard.width, this.battleBoard.height / 2 - 100)
    this.enemyBackCard.add(this.add.image(0, 0, 'card_back').setOrigin(1, 1).setScale(0.5))
    this.enemyBackCard.add(this.add.text(-50, 0, ``, { font: "bold 32px Arial", fill: "#000" }))

    if (!armyProfile.turn) {
      this.turnBtn.setTexture('enemy_turn_button')
    }

    armyProfile.hero.group = this.add.container(this.battleBoard.width / 2, this.battleBoard.height)
    armyProfile.hero.group.add(this.add.image(0, 0, `${armyProfile.hero.nft.name}`, `${armyProfile.hero.nft.image}`).setOrigin(0.5, 1))
    armyProfile.hero.group.list[0].setScale(114 / armyProfile.hero.group.list[0].width)
    armyProfile.hero.group.add(this.add.text(0, -50, `${armyProfile.hero.manabar} / ${armyProfile.hero.mana}`, { font: "bold 24px Arial", fill: "#00f" }))
    armyProfile.hero.group.add(this.add.text(-100, -50, `${armyProfile.hero.hp}`, { font: "bold 24px Arial", fill: "#0f0" }))

    for (var i = 0; i < armyProfile.sortedCards.length; i++) {
      const name = armyProfile.sortedCards[i].name;

      armyProfile.sortedCards[i].group = this.add.container(i * 100, -1000)

      if (armyProfile.sortedCards[i].handed) { // show only handed card
        armyProfile.sortedCards[i].group.y = this.battleBoard.height - 200
      }

      armyProfile.sortedCards[i].group.add(this.add.image(0, 0, armyProfile.sortedCards[i].name).setOrigin(0, 0).setScale(0.3).setInteractive().on('pointerup', (pointer) => {
        this.selectedCard = null;
        this.selectCard(armyProfile.sortedCards.find((elem) => elem.name == name));
      }));

      armyProfile.sortedCards[i].group.add(this.add.text(0, 130, '', { font: "bold 20px Arial", fill: "#f00" })) // att text
      armyProfile.sortedCards[i].group.add(this.add.text(70, 130, '', { font: "bold 20px Arial", fill: "#0f0" })) // hp text

      armyProfile.sortedCards[i].group.add(this.add.text(0, 0, '', { font: "bold 30px Arial", fill: "#00f" })) // ice tag
      armyProfile.sortedCards[i].group.add(this.add.text(0, 70, '', { font: "bold 30px Arial", fill: "#000" })) // sleep tag
    }

    this.selectedCard = null;

    enemyProfile.hero.group = this.add.container(this.battleBoard.width / 2, 0)
    enemyProfile.hero.group.add(this.add.image(0, 0, `${enemyProfile.hero.nft.name}`, `${enemyProfile.hero.nft.image}`).setOrigin(0.5, 0).setInteractive().on('pointerup', (pointer) => {
      if (this.selectedCard && this.selectedCard.bet) {
        if (this.selectedCard.disabled) {
          alert('The card is disabled')
          return
        }
        sendAttackHero(username, this.selectedCard.name);
      }
    }))
    enemyProfile.hero.group.list[0].setScale(114 / enemyProfile.hero.group.list[0].width)
    enemyProfile.hero.group.add(this.add.text(0, 150, `${enemyProfile.hero.manabar} / ${enemyProfile.hero.mana}`, { font: "bold 20px Arial", fill: "#00f" }))
    enemyProfile.hero.group.add(this.add.text(-100, 150, `${enemyProfile.hero.hp}`, { font: "bold 20px Arial", fill: "#0f0" }))

    for (var i = 0; i < enemyProfile.sortedCards.length; i++) {
      const name = enemyProfile.sortedCards[i].name;
      enemyProfile.sortedCards[i].group = this.add.container(-1000, -1000);
      enemyProfile.sortedCards[i].group.add(this.add.image(0, 0, enemyProfile.sortedCards[i].name).setOrigin(0, 0).setScale(0.3).setInteractive().on('pointerup', (pointer) => {
        if (this.selectedCard && this.selectedCard.bet) {
          if (this.selectedCard.disabled) {
            alert('The card is disabled')
            return
          }

          sendAttackMinion(username, this.selectedCard.name, name);
        }
      }));

      enemyProfile.sortedCards[i].group.add(this.add.text(0, 130, '', { font: "bold 24px Arial", fill: "#f00" })) // att text
      enemyProfile.sortedCards[i].group.add(this.add.text(70, 130, '', { font: "bold 24px Arial", fill: "#0f0" })) // hp text
      enemyProfile.sortedCards[i].group.add(this.add.text(0, 0, '', { font: "bold 30px Arial", fill: "#00f" })) // ice tag
      enemyProfile.sortedCards[i].group.add(this.add.text(0, 70, '', { font: "bold 30px Arial", fill: "#000" })) // sleep tag
    }

    this.backUp()
  },
  update: function () {

  },
  selectCard: function (obj) {
    if (obj.freeze == 1 || obj.freeze == 2) {
      window.alert('this card is frozen')
      return
    }

    if (obj.sleep == 1) {
      window.alert('This card is sleeping')
      return
    }
    this.selectedCard = obj;
  },
  betCard: function (data) {
    this.selectedCard = null;

    if (username == data.username) { // army bet
      this.updatePlayerInfo(armyProfile.hero, data.betted_player.hero)
      this.updatePlayerInfo(enemyProfile.hero, data.hurted_player.hero)

      this.updateCardsInfo(armyProfile.sortedCards, data.betted_player.sortedCards)
      this.updateCardsInfo(enemyProfile.sortedCards, data.hurted_player.sortedCards)

      let bettedCards = armyProfile.sortedCards.filter(elem => elem.bet && elem.type == 'minion');
      this.redrawArmyBettedCard(bettedCards)
    } else { // enemy bet
      this.updatePlayerInfo(armyProfile.hero, data.hurted_player.hero)
      this.updatePlayerInfo(enemyProfile.hero, data.betted_player.hero)

      this.updateCardsInfo(armyProfile.sortedCards, data.hurted_player.sortedCards)
      this.updateCardsInfo(enemyProfile.sortedCards, data.betted_player.sortedCards)

      let bettedCards = enemyProfile.sortedCards.filter(elem => elem.bet && elem.type == 'minion');
      this.redrawEnemyBettedCard(bettedCards)
    }

    let handedCards = armyProfile.sortedCards.filter(elem => !elem.bet && elem.handed);
    this.redrawArmyHandedCard(handedCards)

    this.refreshCards(armyProfile, enemyProfile)

    this.updateBackCard()
  },
  updateCardsInfo: function (oldCards, newCards) {
    for (let i = 0; i < oldCards.length; i++) {
      let newCard = newCards.find(elem => elem.name == oldCards[i].name)

      if (!newCard) {
        continue;
      }

      oldCards[i].mana = newCard.mana
      oldCards[i].att = newCard.att
      oldCards[i].hp = newCard.hp

      oldCards[i].bet = newCard.bet
      oldCards[i].handed = newCard.handed
      oldCards[i].disabled = newCard.disabled

      oldCards[i].freeze = newCard.freeze
      if (oldCards[i].freeze == 2) {
        oldCards[i].group.list[3].setText(`ice 2`) // tag ice
      } else if (oldCards[i].freeze == 1) {
        oldCards[i].group.list[3].setText(`ice 1`) // tag ice
      } else {
        oldCards[i].group.list[3].setText(``) // tag ice
      }

      oldCards[i].sleep = newCard.sleep
      if (oldCards[i].sleep == 1) {
        oldCards[i].group.list[4].setText(`sleep`) // tag sleep
      } else {
        oldCards[i].group.list[4].setText(``) // tag sleep
      }

      if (oldCards[i].disabled) {
        oldCards[i].group.list[0].alpha = 0.5;
      } else {
        oldCards[i].group.list[0].alpha = 1;
      }

      if (oldCards[i].hp <= 0) {
        oldCards[i].group.destroy();
      } else {
        oldCards[i].group.list[1].setText(`${oldCards[i].att}`)
        oldCards[i].group.list[2].setText(`${oldCards[i].hp}`)
      }
    }
  },
  updatePlayerInfo: function (oldInfo, newInfo) {
    oldInfo.hp = newInfo.hp
    oldInfo.manabar = newInfo.manabar
    oldInfo.mana = newInfo.mana

    oldInfo.group.list[1].setText(`${oldInfo.manabar} / ${oldInfo.mana}`)
    oldInfo.group.list[2].setText(`${oldInfo.hp}`)
  },
  updateBackCard: function () {
    this.armyBackCard.list[1].setText(`${armyProfile.sortedCards.filter(elem => !elem.handed).length}`)
    this.enemyBackCard.list[1].setText(`${enemyProfile.sortedCards.filter(elem => !elem.handed).length}`)
  },
  operateTurn: function (data) {
    const tempArmy = data.room.players.find(elem => elem.username == username)
    const tempEnemy = data.room.players.find(elem => elem.username != username)

    this.updatePlayerInfo(armyProfile.hero, tempArmy.hero)
    this.updatePlayerInfo(enemyProfile.hero, tempEnemy.hero)

    this.updateCardsInfo(armyProfile.sortedCards, tempArmy.sortedCards)
    this.updateCardsInfo(enemyProfile.sortedCards, tempEnemy.sortedCards)

    armyProfile.turn = tempArmy.turn;
    enemyProfile.turn = tempEnemy.turn;

    if (!armyProfile.turn) { // now is enemy turn
      this.turnBtn.setTexture('enemy_turn_button')
      enemyProfile.sortedCards.filter(elem => { // enable the enemy's betted card
        if (elem.bet && elem.hp > 0) {
          elem.group.list[0].alpha = 1;
          elem.disabled = false
          return true
        }
      })
    } else { // now is army turn
      this.turnBtn.setTexture('army_turn_button')
      armyProfile.sortedCards.filter(elem => { // enable the army's betted card
        if (elem.bet && elem.hp > 0) {
          elem.group.list[0].alpha = 1;
          elem.disabled = false
          return true
        }
      })

      let handedCards = armyProfile.sortedCards.filter(elem => !elem.bet && elem.handed);
      this.redrawArmyHandedCard(handedCards)
    }

    this.refreshCards(armyProfile, enemyProfile)

    this.updateBackCard()
  },
  attackHero: function (data) {
    if (data.username == username) { // you attacked
      this.updateCardsInfo(armyProfile.sortedCards, data.from.sortedCards)
      this.updateCardsInfo(enemyProfile.sortedCards, data.to.sortedCards)

      this.updatePlayerInfo(armyProfile.hero, data.from.hero)
      this.updatePlayerInfo(enemyProfile.hero, data.to.hero)

      armyProfile.sortedCards.filter(elem => { // enable the army's betted card
        if (elem.name == data.card.name) {
          elem.group.list[0].alpha = 0.5;
          elem.disabled = true
          return true
        }
      })
    } else { // you get hurt
      this.updateCardsInfo(armyProfile.sortedCards, data.to.sortedCards)
      this.updateCardsInfo(enemyProfile.sortedCards, data.from.sortedCards)

      this.updatePlayerInfo(armyProfile.hero, data.to.hero)
      this.updatePlayerInfo(enemyProfile.hero, data.from.hero)

      enemyProfile.sortedCards.filter(elem => { // enable the enemy's betted card
        if (elem.name == data.card.name) {
          elem.group.list[0].alpha = 0.5;
          elem.disabled = true
          return true
        }
      })
    }
  },
  attackMinion: function (data) {
    const tempArmy = data.room.players.find(elem => elem.username == username)
    const tempEnemy = data.room.players.find(elem => elem.username != username)

    this.updatePlayerInfo(armyProfile.hero, tempArmy.hero)
    this.updatePlayerInfo(enemyProfile.hero, tempEnemy.hero)

    this.updateCardsInfo(armyProfile.sortedCards, tempArmy.sortedCards)
    this.updateCardsInfo(enemyProfile.sortedCards, tempEnemy.sortedCards)

    let handedCards = armyProfile.sortedCards.filter(elem => !elem.bet && elem.handed);
    this.redrawArmyHandedCard(handedCards)

    this.refreshCards(armyProfile, enemyProfile)
  },
  deadCard: function (data) {
    console.log(data)
  },
  endBattle: function (data) {
    if (data.loser == username) { // you are loser
      alert('You are loser')
    } else {
      alert('You are winner')
    }
  },
  refreshCards: function (army, enemy) { // clear the card that's hp is 0
    army.sortedCards = army.sortedCards.filter(function (elem) {
      return elem.hp > 0;
    });

    enemy.sortedCards = enemy.sortedCards.filter(function (elem) {
      return elem.hp > 0;
    });
  },
  redrawArmyBettedCard: function (cards) { // redraw the army betted card
    for (let i = 0; i < cards.length; i++) {
      let elem = cards[i];
      
      if (elem.hp <= 0) {
        elem.group.destroy();
        continue;
      }

      elem.group.y = this.battleBoard.height / 2

      const step = 100;
      if (cards.length % 2 == 0) {
        elem.group.x = this.battleBoard.width / 2 + step * (i - cards.length / 2)
      } else {
        elem.group.x = this.battleBoard.width / 2 + step * (i - Math.floor(cards.length / 2)) - step / 2
      }

      elem.group.list[0].setTexture(`${elem.name}_fight`)
      elem.group.list[1].setText(`${elem.att}`)
      elem.group.list[2].setText(`${elem.hp}`)

      if (elem.freeze == 2) {
        elem.group.list[3].setText(`ice 2`) // tag ice
      } else if (elem.freeze == 1) {
        elem.group.list[3].setText(`ice 1`) // tag ice
      } else {
        elem.group.list[3].setText(``) // tag ice
      }

      if (elem.sleep == 1) {
        elem.group.list[4].setText(`sleep`) // tag sleep
      } else {
        elem.group.list[4].setText(``) // tag sleep
      }

      if (elem.disabled) {
        elem.group.list[0].alpha = 0.5
      }
    }
  },
  redrawEnemyBettedCard: function (cards) { // redraw the enemy betted card
    for (let i = 0; i < cards.length; i++) {
      let elem = cards[i];
      
      if (elem.hp <= 0) {
        elem.group.destroy();
        continue;
      }

      elem.group.y = this.battleBoard.height / 2 - 200

      const step = 100;
      if (cards.length % 2 == 0) {
        elem.group.x = this.battleBoard.width / 2 + step * (i - cards.length / 2)
      } else {
        elem.group.x = this.battleBoard.width / 2 + step * (i - Math.floor(cards.length / 2)) - step / 2
      }

      elem.group.list[0].setTexture(`${elem.name}_fight`)
      elem.group.list[1].setText(`${elem.att}`)
      elem.group.list[2].setText(`${elem.hp}`)

      if (elem.freeze == 2) {
        elem.group.list[3].setText(`ice 2`) // tag ice
      } else if (elem.freeze == 1) {
        elem.group.list[3].setText(`ice 1`) // tag ice
      } else {
        elem.group.list[3].setText(``) // tag ice
      }

      if (elem.sleep == 1) {
        elem.group.list[4].setText(`sleep`) // tag sleep
      } else {
        elem.group.list[4].setText(``) // tag sleep
      }

      if (elem.disabled) {
        elem.group.list[0].alpha = 0.5
      }
    }
  },
  redrawArmyHandedCard: function (cards) { // redraw the army handed card
    for (let i = 0; i < cards.length; i++) {
      const elem = cards[i];
      elem.group.x = i * 100
      elem.group.y = this.battleBoard.height - 200
    }
  },
  backUp: function () {
    // load army
    this.redrawArmyHandedCard(armyProfile.sortedCards.filter(elem => !elem.bet && elem.handed))
    this.redrawArmyBettedCard(armyProfile.sortedCards.filter(elem => elem.bet && elem.type == 'minion'))

    // load enemy
    this.redrawEnemyBettedCard(enemyProfile.sortedCards.filter(elem => elem.bet && elem.type == 'minion'))
  }
});