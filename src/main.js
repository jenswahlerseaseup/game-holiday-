// Entry point — configure and launch Phaser
const config = {
  type: Phaser.AUTO,
  width:  960,
  height: 540,
  backgroundColor: '#000000',
  parent: 'game-container',
  scale: {
    mode:            Phaser.Scale.FIT,
    autoCenter:      Phaser.Scale.CENTER_BOTH,
    min: { width: 480, height: 270 },
    max: { width: 1920, height: 1080 },
  },
  scene: [
    OpeningScene,
    CarScene,
    VillageScene,
    ForestScene,
    ShopScene,
    EndScene,
  ],
  // Disable Phaser's own audio — we use Web Audio API directly
  audio: { noAudio: false, disableWebAudio: false },
};

new Phaser.Game(config);
