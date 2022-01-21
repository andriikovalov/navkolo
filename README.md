# Navkolo

Navkolo is a library for making escape room-like puzzle/adventure games, where the player can navigate through static scenes, click on objects and submit answers to puzzles. Built on top of [phaser](https://github.com/photonstorm/phaser) framework.

## Installation

### NPM

```bash
npm install navkolo
```

### CDN

Get if from [jsDelivr](https://cdn.jsdelivr.net/npm/navkolo@latest/dist/navkolo.min.js).

## Starting a game

To start a navkolo game, call

```js
window.Navkolo.start(phaserConfig, gameConfigUrl, gameConfig)
```

Either `gameConfigUrl` or `gameConfig` should be passed. An example config is in [test_config/config.json](test_config/config.json)

Alternatively, create and start a `Phaser.Game` with a config in which `scene` is a `Navkolo.Game` (or its subclass).

## Development

### Building js file

```bash
npm run build
```

### Local testing

```bash
cp dist/navkolo.min.js test_config
cd test_config
python3 -m http.server
```

The test configuration will be served from the local web server from python.

### Publishing new version

1. Make a change, build minified js file and and test it locally
2. Update version in `package.json`
3. Run `npm publish`
4. Add a version tag in git

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.
