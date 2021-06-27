import Phaser from 'phaser'
import Game from './game'

import './game.css'

const GAME_CONTAINER_DIV_ID = 'game-container'

if (!document.getElementById(GAME_CONTAINER_DIV_ID)) {
  const gameContainer = document.createElement('div')
  gameContainer.id = GAME_CONTAINER_DIV_ID
  document.body.appendChild(gameContainer)
}

window.navkolo = {}

window.navkolo.default_config = {
  type: Phaser.AUTO,
  parent: GAME_CONTAINER_DIV_ID,
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  width: 1366,
  height: 768,
  scene: new Game()
}

window.navkolo.default_config.scene.loadGameConfig('config.json')

window.navkolo.game = new Phaser.Game(window.navkolo.default_config)
