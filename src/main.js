// Phaser game bootstrap — automation factory game

window.addEventListener('load', () => {
  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1a2810',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: true,
      antialias: false,
    },
    input: {
      activePointers: 3,
    },
    scene: [GameScene, UIScene],
  };

  new Phaser.Game(config);
});
