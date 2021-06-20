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

  /**
   * Pass a URL for a JSON game config file
   * @param {string} gameConfigUrl
   */
  loadGameConfig (gameConfigUrl) {
    this.gameConfigUrl = gameConfigUrl
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
     * The key of the currently set background audio.
     * @member {string}
     */
    this.gameState.backgroundAudioKey = null

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
    parameters.puzzleLockedByOtherPuzzleMessage = 'Solve another riddle first'
    parameters.puzzleLockedByOtherPuzzlesMessage = 'Solve other riddles first'
    parameters.defaultWrongCodeActions = [
      {
        type: 'show_text',
        text: 'Wrong code'
      }
    ]

    parameters.defaultRediscoveredStageActions = [
      {
        type: 'show_text',
        text: 'Nothing happens'
      }
    ]

    return parameters
  }

  gameWidth () {
    return this.cameras.main.width
  }

  gameHeight () {
    return this.cameras.main.height
  }

  currentScene () {
    return this.gameDescription.scenes[this.gameState.currentSceneId]
  }

  preload () {
    if (this.gameConfigUrl) {
      this.load.json('config', this.gameConfigUrl)
    }
  }

  create () {
    this.createSvgUi()
    this.createCodeInput()
    this.createMessageBox()
    this.createFadeRectangle()

    this.registerActionHandlers()
    this.registerGuardCheckers()

    if (this.gameConfigUrl) {
      this.gameConfig = this.cache.json.get('config')
    }

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

    const hintButton = document.getElementById('hint_button_container').getElementsByTagName('button')[0]
    hintButton.addEventListener('pointerdown', this.hintButtonHandler.bind(this, 0))
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
    messageBoxButton.addEventListener('pointerdown', this.messageBoxButtonHandler.bind(this, 0))
  }

  messageBoxButtonHandler (index, event) {
    event.preventDefault()
    const actions = this.nextActions[index]
    this.nextActions = null
    this.uiElements.message.setVisible(false)
    this.showCurrentInteractiveElements()
    this.processActions(actions)
  }

  createFadeRectangle () {
    this.uiElements.fadeRectangle = this.add.rectangle(0, 0, this.gameWidth(), this.gameHeight(), 0xffff00)
      .setAlpha(0)
      .setOrigin(0, 0)
      .setDepth(10)
  }

  registerActionHandlers () {
    this.actionHandlers.go_to_scene = action => this.changeScene(action.scene)
    this.actionHandlers.enter_code = action => this.processCode(action.puzzle, action.code)

    this.actionHandlers.show_text = action => this.showText(action.text)
    this.actionHandlers.blocking_text = action => {
      const buttonName = 'button' in action ? action.button : this.gameParameters.defaultMessageBoxSingleButtonText
      this.showBlockingMessage(action.text, [action.next], [buttonName])
    }
    this.actionHandlers.alternative = action => this.showBlockingMessage(action.text, action.alternatives, action.buttons)

    this.actionHandlers.set_variable = action => { this.gameState.variables[action.variable] = action.value }
    this.actionHandlers.increment_variable = action => {
      const oldValue = this.gameState.variables[action.variable]
      const increment = 'increment' in action ? action.increment : 1
      this.gameState.variables[action.variable] = oldValue + increment
    }

    this.actionHandlers.background_fade_tween = action => this.backgroundFadeTween(action.tween)

    this.actionHandlers.set_background_music = action => this.setBackgroundAudio(action.audio, action.audio_config)
    this.actionHandlers.background_music_tween = action => this.backgroundAudioTween(action.tween)
    this.actionHandlers.play_audio = action => this.playAudio(action.audio, action.audio_config)
    this.actionHandlers.stop_audio = action => this.stopAudio(action.audio)

    this.actionHandlers.grouped_actions = action => this.processActions(action.next)
    this.actionHandlers.run_procedure = action => this.processActions(this.gameDescription.procedures[action.procedure])
    this.actionHandlers.delayed_actions = action => setTimeout(this.processActions, action.delay, action.next)

    this.actionHandlers.hide_interactive_elements = _ => this.hideCurrentInteractiveElements()

    this.actionHandlers.redirect = action => window.location.replace(action.url)
  }

  registerGuardCheckers () {
    this.guardCheckers.variable = guard => this.gameState.variables[guard.variable] === guard.value
    this.guardCheckers.puzzle_solved = guard => guard.puzzle in this.gameState.correctAnswers
    this.guardCheckers.scene_visited = guard => this.gameState.visitedScenes.has(guard.scene)
    this.guardCheckers.stage_loaded = guard => this.gameState.loadedStages.has(guard.stage)
  }

  /**
   * Default implementation loads the first stage in the config
   */
  startGame () {
    this.loadStage(this.gameConfig.stages[0])
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
    for (const action of actions) {
      this.processAction(action)
    }
  }

  processAction (action) {
    if ('guard' in action && !this.checkGuard(action.guard)) {
      return
    }
    this.actionHandlers[action.type](action)
  }

  checkGuard (guard) {
    let result
    if ('and' in guard) {
      for (const nestedGuard of guard.and) {
        result = this.checkGuard(nestedGuard)
        if (result === false) {
          break
        }
      }
    } else if ('type' in guard) {
      result = this.guardCheckers[guard.type](guard)
    }

    if (guard.not) {
      result = !result
    }
    return result
  }

  submitCode () {
    const code = document.getElementById('code_input').value
    const puzzle = this.currentScene().puzzle
    this.processCode(this, puzzle, code)
  }

  processCode (puzzle, code) {
    this.hideMessageIfOpen()

    const puzzleConfig = this.gameConfig.puzzles[puzzle]
    if ('code' in puzzleConfig) {
      this.checkCode(puzzle, code, puzzleConfig.code, puzzleConfig.stage)
    } else if ('codes' in puzzleConfig) {
      for (const altCode in puzzleConfig.codes) {
        this.checkCode(puzzle, code, altCode, puzzleConfig.codes[altCode])
      }
    }
  }

  checkCode (puzzle, code, expectedCode, nextStage) {
    if (this.compareCode(code, expectedCode)) {
      this.processCorrectCode(puzzle, code, nextStage)
    } else {
      this.processWrongCode()
    }
  }

  /**
   * Compares the code given by the player to the expected correct code.
   * @param {string} givenCode
   * @param {string} expectedCode
   * @returns true if the given code matches the expected code
   */
  compareCode (givenCode, expectedCode) {
    return givenCode.trim().toUpperCase() === expectedCode.toUpperCase()
  }

  processCorrectCode (puzzle, code, newStage) {
    if (this.gameState.loadedStages.has(newStage)) {
      this.processActions(this.gameParameters.defaultRediscoveredStageActions)
    } else {
      this.gameState.correctAnswers[puzzle] = code
      if (this.gameState.currentSceneId !== null &&
          'puzzle' in this.currentScene()) {
        this.showCodeInput()
      }
      const newStageConfig = this.gameConfig.stages.find(st => st.id === newStage)
      this.loadStage(newStageConfig)
    }
  }

  processWrongCode () {
    const scene = this.currentScene()
    document.getElementById('code_input').value = ''
    if ('wrong_code_actions' in scene) {
      this.processActions(scene.wrong_code_actions)
    } else {
      this.processActions(this.gameParameters.defaultWrongCodeActions)
    }
  }

  hintButtonHandler (hintIndex) {
    const puzzle = this.currentScene().puzzle
    const hint = this.gameConfig.puzzles[puzzle].hints[hintIndex]

    this.hideMessageIfOpen()
    this.showText(hint)
  }

  objectClicked (objectName) {
    this.hideMessageIfOpen()

    const interactions = this.currentScene().interactive[objectName]
    this.processActions(interactions)
  }

  changeScene (newSceneId) {
    if (this.gameState.currentSceneId !== null) {
      this.leaveCurrentScene()
    }
    this.enter_scene(newSceneId)
  }

  leaveCurrentScene () {
    this.hideCurrentInteractiveElements()
    const curSceneId = this.gameState.currentSceneId
    this.gameDescription.backgrounds[curSceneId].setVisible(false)
    this.gameState.currentSceneId = null
  }

  enterScene (newSceneId) {
    this.gameState.currentSceneId = newSceneId
    this.gameDescription.backgrounds[newSceneId].setVisible(true)

    const firstEntry = !this.gameState.visitedScenes.has(newSceneId)
    if (firstEntry) {
      this.gameState.visitedScenes.add(newSceneId)
    }

    this.showCurrentInteractiveElements()

    const scene = this.currentScene()
    if (firstEntry && 'first_entry_actions' in scene) {
      this.processActions(scene.first_entry_actions)
    }
    if ('entry_actions' in scene) {
      this.processActions(scene.entry_actions)
    }
  }

  showText (text) {
    const messageBox = this.uiElements.message
    document.getElementById('message').innerHTML = text
    document.getElementById('message_box_button_container').hidden = true

    messageBox.node.style.display = 'block'
    messageBox.updateSize()
    messageBox.setVisible(true)

    this.hideSceneObjects(obj => obj.object_type !== 'arrow')

    this.input.on('pointerdown', () => {
      this.hideMessage()
    })
  }

  hideMessage () {
    this.uiElements.message.setVisible(false)
    this.input.removeListener('pointerdown')
    this.showActiveSceneObjects()
  }

  hideMessageIfOpen () {
    if (this.uiElements.message.visible) {
      this.hideMessage()
    }
  }

  /**
   * Shows a message box with buttons and blocks all other UI
   * @param {string} text Text to show in the message box
   * @param {Array.<Array.<Object>>} alternativeActions Array of possible alternatives which are arrays of JSON actions
   * @param {Array.<string>} buttonNames Button captions in the same order and of the same size as the alternative actions
   */
  showBlockingMessage (text, alternativeActions, buttonNames) {
    const messageBox = this.uiElements.message
    document.getElementById('message').innerHTML = text
    const buttonContainer = document.getElementById('message_box_button_container')
    buttonContainer.hidden = false
    this.updateButtons(buttonContainer, buttonNames, this.messageBoxButtonHandler)

    messageBox.node.style.display = 'block'
    messageBox.updateSize()
    messageBox.setVisible(true)

    this.hideSceneObjects()
    this.setCodeInputElementsDisabled(true)

    this.gameState.nextActions = alternativeActions
  }

  /**
   * Updates names of the buttons in the buttonContainer.
   * If necessary, more buttons are created from the first button.
   * For new buttons buttonHandler is added as a handler.
   *
   * @param {HTMLElement} buttonContainer DOM element which contains at least one button
   * @param {Array.<string>} buttonNames
   * @param {function(number, event)} buttonHandler handler function, which will be bound to this and the first parameter will be the index of the button in the container.
   */
  updateButtons (buttonContainer, buttonNames, buttonHandler) {
    const existingButtons = buttonContainer.getElementsByTagName('button')

    for (let i = 0; i < buttonNames.length; i++) {
      if (existingButtons.length < i) {
        existingButtons[i].hidden = false
        existingButtons[i].innerHTML = buttonNames[i]
      } else {
        const newButton = existingButtons[0].cloneNode(false)
        newButton.innerHTML = buttonNames[i]
        newButton.addEventListener('pointerdown', buttonHandler.bind(this, i))
        buttonContainer.appendChild(newButton)
      }
    }

    for (let i = buttonNames.length; i < existingButtons.length; i++) {
      existingButtons[i].hidden = true
    }
  }

  backgroundFadeTween (actionTween) {
    const fadeRect = this.uiElements.fadeRectangle

    this.tweens.killTweensOf(fadeRect)
    const tween = Object.assign({ targets: fadeRect }, actionTween)
    this.tweens.add(tween)
  }

  backgroundAudioTween (actionTween) {
    const bgAudioKey = this.gameState.backgroundAudioKey
    const bgAudio = this.gameDescription.audio[bgAudioKey]

    this.tweens.killTweensOf(bgAudio)
    const tween = Object.assign({ targets: bgAudio }, actionTween)
    this.tweens.add(tween)
  }

  setBackgroundAudio (audioKey, audioConfig) {
    const currentBgAudioKey = this.gameState.backgroundAudioKey

    if (currentBgAudioKey !== audioKey) {
      if (currentBgAudioKey !== null) {
        this.gameDescription.audio[currentBgAudioKey].stop()
      }
      this.gameState.backgroundAudioKey = audioKey
      if (audioKey !== null) {
        this.gameDescription.audio[audioKey].play(Object.assign({ loop: true }, audioConfig))
      }
    }
  }

  playAudio (audioKey, audioConfig) {
    this.gameDescription.audio[audioKey].play(audioConfig)
  }

  stopAudio (audioKey) {
    this.gameDescription.audio[audioKey].stop()
  }

  /**
   * Sets visibility to false for all objects that have interactions in the current scene and pass the filter function
   * @param {function(Object):boolean} filter function that will be called on every Phaser object representing a scene oblect
   */
  hideSceneObjects (filter = _ => true) {
    const scene = this.currentScene()
    if ('interactive' in scene) {
      for (const objName in scene.interactive) {
        const obj = this.gameDescription.objects[objName]
        if (filter(obj)) {
          obj.setVisible(false)
        }
      }
    }
  }

  showActiveSceneObjects () {
    const scene = this.currentScene()
    if ('interactive' in scene) {
      for (const objName in scene.interactive) {
        const obj = this.gameDescription.objects[objName]
        const interactions = scene.interactive[objName]
        if (this.checkActiveInteraction(interactions)) {
          obj.setVisible(true)
        }
      }
    }
  }

  /**
   * @param {Array.<Object>} interactions array of actions, possibly with guards
   * @returns true if there is an interaction with a passing guard (or without a guard), otherwise false
   */
  checkActiveInteraction (interactions) {
    for (const interaction of interactions) {
      if (!('guard' in interaction) || this.checkGuard(interaction.guard)) {
        return true
      }
    }
    return false
  }

  hideCurrentInteractiveElements () {
    this.hideSceneObjects()
    if ('puzzle' in this.currentScene()) {
      this.uiElements.input.setVisible(false)
    }
  }

  showCurrentInteractiveElements () {
    this.showActiveSceneObjects()
    if ('puzzle' in this.currentScene()) {
      this.showCodeInput()
    }
  }

  showCodeInput () {
    const scene = this.currentScene()
    const puzzle = scene.puzzle

    const codeInput = document.getElementById('code_input')
    codeInput.hidden = scene.hide_code_input

    this.uiElements.input.node.style.display = 'block'
    this.uiElements.input.updateSize()
    this.uiElements.input.setVisible(true)

    if (puzzle in this.gameState.correctAnswers) {
      this.setCodeInputElementsDisabled(true)
      codeInput.value = this.gameState.correctAnswers[puzzle]
    } else if (!this.currentPuzzleUnlocked()) {
      this.setCodeInputElementsDisabled(true)
      if (scene.puzzle_depends_on.length === 1) {
        codeInput.value = this.gameParameters.puzzleLockedByOtherPuzzleMessage
      } else {
        codeInput.value = this.gameParameters.puzzleLockedByOtherPuzzlesMessage
      }
    } else {
      this.setCodeInputElementsDisabled(false)
      codeInput.value = ''
    }
  }

  setCodeInputElementsDisabled (value) {
    const inputElements = document.getElementsByClassName('code_input_element')
    for (const inputElement of inputElements) {
      inputElement.disabled = value
    }
  }

  currentPuzzleUnlocked () {
    const scene = this.currentScene()
    if ('puzzle_depends_on' in scene) {
      const neededSolutions = scene.puzzle_depends_on
      for (const neededSolution of neededSolutions) {
        if (!(neededSolution in this.gameState.correctAnswers)) {
          return false
        }
      }
    }
    return true
  }
}
