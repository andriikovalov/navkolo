import Phaser from 'phaser'
import leftArrowSvg from './assets/svg/left_arrow.svg'
import rightArrowSvg from './assets/svg/right_arrow.svg'
import upArrowSvg from './assets/svg/up_arrow.svg'
import downArrowSvg from './assets/svg/down_arrow.svg'
import gearSvg from './assets/svg/gear.svg'

import inputHtml from './assets/html/input.html'
import messageHtml from './assets/html/message.html'

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
     * Temporary storage for possible next actions for blocking messages.
     * Outer array corresponds to different buttons on the message, inner array contains
     * JSON actions to perform after clicking a certain button.
     * @member {Array.<Array.<Object>>}
     */
    this.gameState.nextActions = null
  }

  gameWidth () {
    return this.cameras.main.width
  }

  gameHeight () {
    return this.cameras.main.height
  }

  create () {
    this.createSvgUi()
    this.createHtmlUi()
  }

  createSvgUi () {
    // Counts how many svg files we need to load, to remove the listener when we are done
    let svgImageQueued = 5

    const addTextureListener = (key) => {
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
        this.textures.removeListener('addtexture', addTextureListener)
      }
    }

    this.textures.on('addtexture', addTextureListener)

    this.addSvgTexture(leftArrowSvg, 'left_arrow')
    this.addSvgTexture(rightArrowSvg, 'right_arrow')
    this.addSvgTexture(upArrowSvg, 'up_arrow')
    this.addSvgTexture(downArrowSvg, 'down_arrow')
    this.addSvgTexture(gearSvg, 'loading')
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
      this.objectClicked(objectName)
      event.stopPropagation()
    })
    arrow.setVisible(false)
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
      .setVisible(false)

    this.tweens.add({
      targets: this.uiElements.loading,
      angle: 360,
      duration: 5000,
      loop: -1
    })
  }

  createHtmlUi () {
    this.createCodeInput()
    this.createMessageBox()
  }

  createCodeInput () {
    const input = this.add.dom(0.5 * this.gameWidth(), 0.9167 * this.gameHeight()).createFromHTML(inputHtml)
    input.setDepth(100)
    input.setAlpha(0.6)
    input.setVisible(false)
    this.uiElements.input = input

    document.getElementById('code_form').addEventListener('submit', (event) => {
      event.preventDefault()
      this.submitCode()
    })

    document.getElementById('hint1').addEventListener('pointerdown', this.showHint.bind(this, 0))
    document.getElementById('hint2').addEventListener('pointerdown', this.showHint.bind(this, 1))
    document.getElementById('hint3').addEventListener('pointerdown', this.showHint.bind(this, 2))
  }

  createMessageBox () {
    const messageBox = this.add.dom(0.5 * this.gameWidth(), 0.5 * this.gameHeight()).createFromHTML(messageHtml)
    this.uiElements.message = messageBox

    const messageBoxStyle = messageBox.node.style
    messageBoxStyle.width = (0.8 * this.gameWidth()) + 'px'
    messageBox.setDepth(100)
    messageBox.setVisible(false)

    // Initially there is only one button. If more buttons are needed later, they are added dynamically
    const messageBoxButton = document.getElementById('message_box_button_container').getElementsByTagName('button')[0]
    this.addMessageBoxButtonHandler(messageBoxButton, 0)
  }

  addMessageBoxButtonHandler (buttonNode, index) {
    buttonNode.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      const actions = this.nextActions[index]
      this.nextActions = null
      this.processActions(actions)
    })
  }

  createGeneralUI () {
    // create_code_input(phaser_scene);
    // create_message_box(phaser_scene);
    // create_blocking_message_box(phaser_scene);
    // create_alternative_message_box(phaser_scene);

    // create_fade_rectangle(phaser_scene);
  }

  submitCode () {
    console.log('Submitting from')
    console.log(this)
  }

  showHint (hintIndex) {
    console.log('Hint ' + hintIndex + ' from')
    console.log(this)
  }

  objectClicked (objectName) {
    console.log('Clicked ' + objectName)
    // hide_message_if_open(phaser_scene);

    // const cur_scene_id = phaser_scene.gameState.currentSceneId;
    // const interactions = phaser_scene.gameDescription.scenes[cur_scene_id].interactive[object_name];
    // process_actions(phaser_scene, interactions);
  }

  processActions (actions) {
    console.log('TODO: process actions')
  }
}
