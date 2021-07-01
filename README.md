# Navkolo

Navkolo is a library for making escape room-like puzzle/adventure games, where the player can navigate through static scenes, click on objects and submit answers to puzzles. Built on top of [phaser](https://github.com/photonstorm/phaser) framework.

## Installation

### NPM

```bash
npm install navkolo
```

### CDN

Get if from [jsDelivr](https://www.jsdelivr.com/).

## Starting a game

To start a navkolo game, call

```js
window.Navkolo.start(phaserConfig, gameConfigUrl, gameConfig)
```

Either `gameConfigUrl` or `gameConfig` should be passed. An example config is in [test_config/config.json](test_config/config.json)

Alternatively, create and start a `Phaser.Game` with a config in which `scene` is a `Navkolo.Game` (or its subclass).

## License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.
