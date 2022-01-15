var MinionsChoiseScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { "key": "MinionsChoiseScene" });
  },
  init: function () { },
  preload: function () {
    // Load all the minions
    for (var i = 0; i < minionNames.length; i++) {
      this.load.image(`${minionNames[i]}`, `/images/minions/${minionNames[i]}.png`);
    }

    // Load all the spells
    for (var i = 0; i < spellNames.length; i++) {
      this.load.image(`${spellNames[i]}`, `/images/spells/${spellNames[i]}.png`);
    }

    this.load.image('background', 'images/background.png'); // background image for the scene
    this.load.image('start', 'images/start.png');
    this.load.image('check', 'images/check.png')
  },
  create: function () {
    currentScene = this;

    this.minions = [
    ];

    this.spells = [
    ];

    this.add.image(0, 0, 'background').setOrigin(0).setScale(1);
    this.add.image(0, 0, 'start').setOrigin(0).setScale(1).setInteractive().on('pointerup', (pointer) => {
      if (this.minions.filter(elem => elem.selected).length != 12) {
        alert('Please select 12 minions')
        return;

      }

      if (this.spells.filter(elem => elem.selected).length != 7) {
        alert('Please select 7 spells')
        return;
      }

      sendReadyBattle({
        username: username,
        minions: this.minions.filter(elem => elem.selected).map(elem => {
          if (elem.selected) return elem.name
        }),
        spells: this.spells.filter(elem => elem.selected).map(elem => {
          if (elem.selected) return elem.name
        })
      });
    });

    for (var i = 0; i < minionNames.length; i++) {
      const minion = minionNames[i]
      let container = this.add.container((i % 17) * 80, 80 + 140 * Math.floor(i / 17))
      container.add(this.add.image(0, 0, minionNames[i]).setOrigin(0).setScale(0.22).setInteractive().on('pointerup', (pointer) => {
        this.selectMinion(minion)
      }))
      container.add(this.add.image(0, 0, 'check').setOrigin(0).setScale(0.5))

      this.minions.push({
        name: minion,
        selected: false,
        group: container,
      })

      container.list[1].alpha = 0
    }

    for (var i = 0; i < spellNames.length; i++) {
      const spell = spellNames[i]
      let container = this.add.container((i % 13) * 100, 510 + 140 * Math.floor(i / 13))
      container.add(this.add.image(0, 0, spellNames[i]).setOrigin(0).setScale(0.25).setInteractive().on('pointerup', (pointer) => {
        this.selectSpell(spell)
      }))
      container.add(this.add.image(0, 0, 'check').setOrigin(0).setScale(0.5))

      this.spells.push({
        name: spell,
        selected: false,
        group: container,
      })

      container.list[1].alpha = 0
    }
  },
  update: function () {

  },
  selectMinion: function (minion) {
    this.minions.find(elem => {
      if (elem.name == minion) {
        elem.selected = !elem.selected;
        (elem.selected) ? elem.group.list[1].alpha = 1 : elem.group.list[1].alpha = 0
        return true
      }
    })
  },
  selectSpell: function (spell) {
    this.spells.find(elem => {
      if (elem.name == spell) {
        elem.selected = !elem.selected;
        (elem.selected) ? elem.group.list[1].alpha = 1 : elem.group.list[1].alpha = 0
        return true
      }
    })
  },
});