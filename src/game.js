import Phaser from 'phaser'
import leftArrow from './assets/svg/left_arrow.svg'
import rightArrow from './assets/svg/right_arrow.svg'
import upArrow from './assets/svg/up_arrow.svg'
import downArrow from './assets/svg/down_arrow.svg'

export default class Game extends Phaser.Scene {
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

  preload () {
    this.load.svg('left_arrow', leftArrow)
    this.load.svg('right_arrow', rightArrow)
    this.load.svg('up_arrow', upArrow)
    this.load.svg('down_arrow', downArrow)
  }

  create () {
    this.createGeneralUI()
  }

  gameWidth () {
    return this.cameras.main.width
  }

  gameHeight () {
    return this.cameras.main.height
  }

  createGeneralUI () {
    this.createArrow(0.0583 * this.gameWidth(), 0.5 * this.gameHeight(), 'left', 'left_arrow')
    this.createArrow(0.9417 * this.gameWidth(), 0.5 * this.gameHeight(), 'right', 'right_arrow')
    this.createArrow(0.5 * this.gameWidth(), 0.1 * this.gameHeight(), 'up', 'up_arrow')
    this.createArrow(0.5 * this.gameWidth(), 0.9 * this.gameHeight(), 'down', 'down_arrow')

    // create_code_input(phaser_scene);
    // create_message_box(phaser_scene);
    // create_blocking_message_box(phaser_scene);
    // create_alternative_message_box(phaser_scene);

    // create_fade_rectangle(phaser_scene);
    // create_loading_indicator(phaser_scene);
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
}
