import Phaser from 'phaser'
import leftArrow from './assets/svg/left_arrow.svg'
import rightArrow from './assets/svg/right_arrow.svg'
import upArrow from './assets/svg/up_arrow.svg'
import downArrow from './assets/svg/down_arrow.svg'
import gear from './assets/svg/gear.svg'

export default class Game extends Phaser.Scene {
  constructor (gameConfig) {
    super()

    /**
     * Complete game config as JSON object.
     * @member {Object.<string, Object>}
     */
    this.gameConfig = gameConfig
  }

  init () {
    /**
     * Dictionary of all general UI objects (such as message box, input field, loading image).
     * @member {Object.<string, Phaser.GameObjects.GameObject>}
     */
    this.uiElements = {}

    /**
     * Collection of information about game world as it is discovered. Values here are not supposed to change.
     */
    this.gameDescription = {}

    /**
     * Interactive clickable game objects (including navigation arrows).
     * @member {Object.<string, Phaser.GameObjects.GameObject>}
     */
    this.gameDescription.objects = {}

    /**
     * Background images for game scenes.
     * @member {Object.<string, Phaser.GameObjects.Image>}
     */
    this.gameDescription.backgrounds = {}

    /**
     * Dictionary of all loaded scene descriptions in JSON.
     * @member {Object.<string, Object>}
     */
    this.gameDescription.scenes = {}

    /**
     * Dictionary of loaded audio objects.
     * @member {Object.<string, Phaser.Sound.BaseSound>}
     */
    this.gameDescription.audio = {}

    /**
     * Dictionary of all procedures. Every procedure is an array of actions in JSON.
     * @member {Object.<string, Object>}
     */
    this.gameDescription.procedures = {}

    /**
     * Dictionary of game parameters such as default values.
     * @member {Object.<string, Object>}
     */
    this.gameDescription.parameters = {}

    /**
     * Collection of information about the game state the player is currently in.
     */
    this.gameState = {}

    /**
     * The id of scene the player is currently seeing.
     * @member {string}
     */
    this.gameState.currentSceneId = null

    /**
     * The key of the currently set background music.
     * @member {string}
     */
    this.gameState.backgroundMusicId = null

    /**
     * Values of in-game variables.
     * @member {Object.<string, Object>}
     */
    this.gameState.variables = {}

    /**
     * Set of ids of all stages loaded so far.
     * @member {Object.<string, Object>}
     */
    this.gameState.loadedStages = new Set()

    /**
     * Set of ids of all scenes visited so far.
     * @member {Object.<string, Object>}
     */
    this.gameState.visitedScenes = new Set()

    /**
     * Dictionary of correct answers given to puzzles so far.
     * @member {Object.<string, Object>}
     */
    this.gameState.correctAnswers = {}

    /**
     * Temporary storage for possible next actions for alternative message.
     * @member {Object.<string, Object>}
     */
    this.gameState.alternativeNextActions = null
  }

  gameWidth () {
    return this.cameras.main.width
  }

  gameHeight () {
    return this.cameras.main.height
  }

  create () {
    this.createSvgUi()
  }

  createSvgUi () {
    // Counts how many svg files we need to load, to remove the listener when we are done
    let svgImageQueued = 5

    const addTextureListener = (key) => {
      console.log(key)
      switch (key) {
        case 'left_arrow':
          this.createArrow(0.0583 * this.gameWidth(), 0.5 * this.gameHeight(), 'left', 'left_arrow')
          svgImageQueued -= 1
          break
        case 'right_arrow':
          this.createArrow(0.9417 * this.gameWidth(), 0.5 * this.gameHeight(), 'right', 'right_arrow')
          svgImageQueued -= 1
          break
        case 'up_arrow':
          this.createArrow(0.5 * this.gameWidth(), 0.1 * this.gameHeight(), 'up', 'up_arrow')
          svgImageQueued -= 1
          break
        case 'down_arrow':
          this.createArrow(0.5 * this.gameWidth(), 0.9 * this.gameHeight(), 'down', 'down_arrow')
          svgImageQueued -= 1
          break
        case 'loading':
          this.createLoadingIndicator()
          svgImageQueued -= 1
          break
      }
      if (svgImageQueued === 0) {
        console.log('TODO: remove')
        this.textures.removeListener('addtexture', addTextureListener)
      }
    }

    this.textures.on('addtexture', addTextureListener)

    this.addSvgTexture(leftArrow, 'left_arrow')
    this.addSvgTexture(rightArrow, 'right_arrow')
    this.addSvgTexture(upArrow, 'up_arrow')
    this.addSvgTexture(downArrow, 'down_arrow')
    this.addSvgTexture(gear, 'loading')
  }

  addSvgTexture (svgText, key) {
    const imageData = 'data:image/svg+xml,' + encodeURIComponent(svgText)
    const image = new Image()
    image.src = imageData
    image.onload = () => {
      this.textures.addImage(key, image)
    }
  }

  createArrow (x, y, objectName, imageId) {
    const arrow = this.add.image(x, y, imageId)
    this.gameDescription.objects[objectName] = arrow
    arrow.object_type = 'arrow'
    const arrowSize = 0.0833 * this.gameWidth()
    arrow.setDisplaySize(arrowSize, arrowSize)
    this.addArrowHover(arrow)
    arrow.on('pointerdown', (pointer, localX, localY, event) => {
      // TODO object_clicked(phaser_scene, objectName);
      console.log('click')
      event.stopPropagation()
    })
    // arrow.setVisible(false);
  }

  addArrowHover (arrow) {
    arrow.setInteractive({ useHandCursor: true })
    arrow.setAlpha(0.7)
    arrow.on('pointerover', () => {
      arrow.setAlpha(1)
    })
    arrow.on('pointerout', () => {
      arrow.setAlpha(0.7)
    })
  }

  createLoadingIndicator () {
    const indicatorSize = 0.0833 * this.gameWidth()
    this.uiElements.loading = this.add.image(this.gameWidth() / 2, this.gameHeight() / 2, 'loading')
      .setDepth(1000)
      .setDisplaySize(indicatorSize, indicatorSize)
      .setAlpha(0.7)
      // .setVisible(false)

    this.tweens.add({
      targets: this.uiElements.loading,
      angle: 360,
      duration: 5000,
      loop: -1
    })
  }

  createGeneralUI () {
    // create_code_input(phaser_scene);
    // create_message_box(phaser_scene);
    // create_blocking_message_box(phaser_scene);
    // create_alternative_message_box(phaser_scene);

    // create_fade_rectangle(phaser_scene);
  }
}
