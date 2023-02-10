const { unselectActiveLayers } = require('./psapi')

const app = window.require('photoshop').app

function getActiveLayer() {
    let activeLayers = app.activeDocument.activeLayers
    // console.dir(getSize())
    for (const layer of activeLayers) {
        console.dir({ layer })
        const name = layer.name
        console.dir({ name })
        let layer_size = getLayerSize(layer)
        console.dir({ layer_size })
    }

    return activeLayers[0]
}

function getSize() {
    let doc = app.activeDocument
    return { height: doc.height, width: doc.width }
}

const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core

async function reselectBatchPlay(selectionInfo) {
    const result = await batchPlay(
        [
            {
                _obj: 'set',
                _target: [
                    {
                        _ref: 'channel',
                        _property: 'selection',
                    },
                ],
                to: {
                    _obj: 'rectangle',
                    top: {
                        _unit: 'pixelsUnit',
                        _value: selectionInfo.top,
                    },
                    left: {
                        _unit: 'pixelsUnit',
                        _value: selectionInfo.left,
                    },
                    bottom: {
                        _unit: 'pixelsUnit',
                        _value: selectionInfo.bottom,
                    },
                    right: {
                        _unit: 'pixelsUnit',
                        _value: selectionInfo.right,
                    },
                },
                _options: {
                    dialogOptions: 'dontDisplay',
                },
            },
        ],
        {
            synchronousExecution: true,
            modalBehavior: 'execute',
        }
    )
}

async function reselect(selectionInfo) {
    await executeAsModal(
        async () => {
            reselectBatchPlay(selectionInfo)
        },
        { commandName: 'reselect' }
    )
}

//unselect the rectangular marquee selection area
async function unSelect() {
    const batchPlay = require('photoshop').action.batchPlay

    const result = await batchPlay(
        [
            {
                _obj: 'set',
                _target: [
                    {
                        _ref: 'channel',
                        _property: 'selection',
                    },
                ],
                to: {
                    _enum: 'ordinal',
                    _value: 'none',
                },
                _options: {
                    dialogOptions: 'dontDisplay',
                },
            },
        ],
        {
            synchronousExecution: true,
            modalBehavior: 'execute',
        }
    )

    return result
}

/**
 * Convert 1d index to 2d array
 * @param {number} index sequential index
 * @param {number} width width of 2d array
 * @returns {number[]} [x,y]
 */
function indexToXY(index, width) {
    return [index % width, Math.floor(index / width)]
}

module.exports = {}
