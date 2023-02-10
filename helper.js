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

// async function layerToSelectionHelper () {
//   // console.log("executeAsModal layer.translate")

//   //get selection info
//   let activeLayer = getActiveLayer()
//   let selectionInfoPromise = await getSelectionInfo()
//   selectionInfoPromise.then(async value => {
//     console.dir(value)

//     let selection = value[0].selection

//     // let selectionInfo = value[0].selection

//     //unselect everything so you can move the layer
//     // top_new = layer_info.top - top_dist
//     executeAsModal(unSelect).then(() => {
//       console.log('done unSelect Exe')
//       //scale layer
//       async function scaleLayer (executionContext) {
//         console.log('scaleLayer got called')
//         let layer_info = getLayerSize(activeLayer)
//         scale_x_ratio = (selection_info.width / layer_info.width) * 100
//         scale_y_ratio = (selection_info.height / layer_info.height) * 100
//         console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
//         activeLayer.scale(scale_x_ratio, scale_y_ratio)
//       }

//       executeAsModal(scaleLayer).then(async () => {
//         console.log('done scaling Exe')

//         await require('photoshop').core.executeAsModal(moveLayerExe)
//       })
//     })
//   })
// }

// async function layerToSelection (selection_info) {
//   //store active layer for later

//   const { executeAsModal } = require('photoshop').core

//   try {
//     //Store selection info
//     //unSelect
//     //move layer
//     //scale layer
//     //Select from selection info
//     // let selection_info = await getSelectionInfo()

//     console.log('selection_info:',selection_info)

//     console.log('unSelect')

//     await executeAsModal(unSelect,  {'commandName': 'unSelect'})

//      //scale layer
//      async function scaleLayer (executionContext) {
//         console.log('scaleLayer got called')
//         // const activeLayer = getActiveLayer()
//         const activeLayer = await app.activeDocument.activeLayers[0]

//         let layer_info = getLayerSize(activeLayer)
//         scale_x_ratio = (selection_info.width / layer_info.width) * 100
//         scale_y_ratio = (selection_info.height / layer_info.height) * 100
//         console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
//         activeLayer.scale(scale_x_ratio, scale_y_ratio)
//       }
//       await executeAsModal(scaleLayer,  {'commandName': 'scaleLayer'})

//     async function moveLayerExe (layerToMove, selection_info) {

//         let layer_info = getLayerSize(layerToMove)
//       top_dist = layer_info.top - selection_info.top
//       left_dist = layer_info.left - selection_info.left
//       await layerToMove.translate(-left_dist, -top_dist)
//     }
//     // const activeLayer = await getActiveLayer()
//     //store all active layers
//     const activeLayers = await app.activeDocument.activeLayers

//     await executeAsModal(async () => {

//       for (let layer of activeLayers){
//         await psapi.selectLayers([layer])
//         await moveLayerExe(layer, selection_info)
//       }
//     },  {'commandName': 'moveLayerExe'})

//     await reselect(selection_info)
//   } catch (e) {
//     console.warn(e)
//   }

// }

module.exports = {
    // layerToSelection
}
