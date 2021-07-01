import Phaser from 'phaser'
import Game from './game'

import './game.css'

window.Navkolo = {}
window.Navkolo.Game = Game

window.Navkolo.defaultConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  width: 1366,
  height: 768
}

/**
 * Creates and starts a navkolo game. Either `gameConfig` or `gameConfigUrl` must be passed.
 * The created game is stored in `window.Navkolo.game`.
 * @param {Object} phaserConfig phaser game config (without `scene` key). Should have `dom` with `createContainer = true` and `parent` properties.
 * @param {string} gameConfigUrl URL of a JSON file with a navkolo game configuration.
 * @param {Object} gameConfig JSON navkolo game configuration with puzzles and stages.
 */
window.Navkolo.start = (phaserConfig, gameConfigUrl, gameConfig) => {
  // Add game container if it is absent
  const gameContainerId = phaserConfig.parent
  if (!document.getElementById(gameContainerId)) {
    const gameContainer = document.createElement('div')
    gameContainer.id = gameContainerId
    document.body.appendChild(gameContainer)
  }

  phaserConfig.scene = new Game(gameConfig)
  if (gameConfigUrl) {
    phaserConfig.scene.loadGameConfig(gameConfigUrl)
  }

  window.Navkolo.game = new Phaser.Game(phaserConfig)
}
