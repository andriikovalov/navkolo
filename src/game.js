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
     * Dictionary from action type to a function that processes it. Should be bound to this Game and take action JSON as a parameter.
     */
    this.actionHandlers = {}

    /**
     * Dictionary from guard type to a function that checks it. Should be bound to this Game and take guard JSON as a parameter.
     */
    this.guardCheckers = {}

    /**
     * Dictionary of game parameters such as default values.
     * @member {Object.<string, Object>}
     */
    this.gameParameters = this.defaultGameParameters()

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

  defaultGameParameters () {
    const parameters = {}
    parameters.sceneBackgroundImagesPath = ''
    parameters.audiosPath = ''
    parameters.defaultMessageBoxSingleButtonText = 'Continue'

    return parameters
  }

  gameWidth () {
    return this.cameras.main.width
  }

  gameHeight () {
    return this.cameras.main.height
  }

  create () {
    this.createSvgUi()
    this.createCodeInput()
    this.createMessageBox()
    this.createFadeRectangle()

    this.registerActionHandlers()
    this.registerGuardCheckers()

    this.startGame()
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

  createFadeRectangle () {
    this.uiElements.fadeRectangle = this.add.rectangle(0, 0, this.gameWidth(), this.gameHeight(), 0xffff00)
      .setAlpha(0)
      .setOrigin(0, 0)
      .setDepth(10)
  }

  registerActionHandlers () {
    // TODO
  }

  registerGuardCheckers () {
    // TODO
  }

  startGame () {
    console.log('Starting game')
  }

  loadStage (stage) {
    this.uiElements.loading.setVisible(true)
    this.gameState.loadedStages.add(stage.id)
    if (('scenes' in stage && stage.scenes.length > 0) || 'audio' in stage) {
      this.preloadStage(stage)
      this.load.start()
      this.load.once('complete', this.createStage.bind(this, stage))
    } else {
      this.createStage(stage)
    }
  }

  preloadStage (stage) {
    if ('scenes' in stage) {
      this.preloadSceneBackgrounds(stage.scenes)
    }
    if ('audio' in stage) {
      this.preloadAudio(stage.audio)
    }
  }

  preloadSceneBackgrounds (scenes) {
    for (const scene of scenes) {
      this.load.image(this.getSceneBgImageKey(scene), this.getSceneBgImageUrl(scene))
    }
  }

  preloadAudio (audio) {
    for (const audioKey in audio) {
      if (!(audioKey in this.gameDescription.audio)) {
        const audioUrls = audio[audioKey].map(fileName => this.getAudioUrl(fileName))
        this.load.audio(audioKey, audioUrls)
      }
    }
  }

  getSceneBgImageKey (scene) {
    return scene.id + '_bg'
  }

  getSceneBgImageUrl (scene) {
    return this.gameParameters.sceneBackgroundImagesPath + scene.background
  }

  getAudioUrl (audioFileName) {
    return this.gameParameters.audiosPath + audioFileName
  }

  createStage (stage) {
    this.createObjects(stage)
    this.createScenes(stage)
    this.createAudio(stage)
    this.createProcedures(stage)

    this.uiElements.loading.setVisible(false)

    if ('load_actions' in stage) {
      this.processActions(stage.load_actions)
    }
  }

  createObjects (stage) {
    for (const object of this.gatherObjects(stage)) {
      this.createObject(object)
    }
  }

  gatherObjects (stage) {
    const objects = []
    for (const scene of stage.scenes) {
      if ('objects' in scene) {
        for (const object of scene.objects) {
          objects.push(object)
        }
      }
    }
    return objects
  }

  createObject (object) {
    const phaserObject = this.add.rectangle(object.x * this.gameWidth(), object.y * this.gameHeight(), object.width * this.gameWidth(), object.height * this.gameHeight())
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.000001)
      .setVisible(false)

    phaserObject.on('pointerdown', (_pointer, _localX, _localY, event) => {
      this.objectClicked(object.id)
      event.stopPropagation()
    })

    this.gameDescription.objects[object.id] = phaserObject
  }

  createScenes (stage) {
    for (const scene of stage.scenes) {
      if ('interactive_inherit' in scene) {
        const baseScene = this.gameDescription.scenes[scene.interactive_inherit]
        scene.interactive = Object.assign({}, baseScene.interactive, scene.interactive)
      }
      this.gameDescription.scenes[scene.id] = scene

      this.gameDescription.backgrounds[scene.id] = this.add.image(0, 0, this.getSceneBgImageKey(scene))
        .setOrigin(0, 0)
        .setDisplaySize(this.gameWidth(), this.gameHeight())
        .setVisible(false)
        .setDepth(-1)
    }
  }

  createAudio (stage) {
    if ('audio' in stage) {
      for (const audioKey in stage.audio) {
        if (!(audioKey in this.gameDescription.audio)) {
          this.gameDescription.audio[audioKey] = this.sound.add(audioKey)
        }
      }
    }
  }

  createProcedures (stage) {
    for (const scene of stage.scenes) {
      if ('procedures' in scene) {
        for (const procedureName in scene.procedures) {
          this.gameDescription.procedures[procedureName] = scene.procedures[procedureName]
        }
      }
    }
  }

  processActions (actions) {
    console.log('TODO: process actions')
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
}
