const selection = require('./selection')
const app = window.require('photoshop').app
const batchPlay = require('photoshop').action.batchPlay
const { executeAsModal } = require('photoshop').core
const storage = require('uxp').storage
const fs = storage.localFileSystem
const formats = require('uxp').storage.formats

let mask_layer_exist = false // true if inpaint mask layer exist, false otherwise.
let inpaint_mask_layer
let inpaint_mask_layer_history_id //store the history state id when creating a new inpaint mask layer
let saved_active_layers = []
let saved_active_selection = {}
let image_path_to_layer = {}
let use_smart_object = true // true to keep layer as smart objects, false to rasterize them

async function createSolidLayer(r, g, b) {
    console.warn('this function is deprecated')
    await executeAsModal(async () => {
        const result = await batchPlay(
            [
                {
                    _obj: 'make',
                    _target: [
                        {
                            _ref: 'contentLayer',
                        },
                    ],
                    using: {
                        _obj: 'contentLayer',
                        type: {
                            _obj: 'solidColorLayer',
                            color: {
                                _obj: 'RGBColor',
                                red: r,
                                grain: g,
                                blue: b,
                            },
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
    })
}

async function makeGroupCommand() {
    const result = await batchPlay(
        [
            {
                _obj: 'make',
                _target: [
                    {
                        _ref: 'layerSection',
                    },
                ],
                layerSectionStart: 405,
                layerSectionEnd: 406,
                name: 'Group 16',
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

    console.log('makeGroupCommand: ', result)

    return result
}
async function createEmptyGroup(name = 'New Group') {
    let groupLayer
    await executeAsModal(async () => {
        await makeGroupCommand()
        groupLayer = app.activeDocument.activeLayers[0]
        groupLayer.name = name
    })
    console.log('groupLayer:', groupLayer)
    return groupLayer
}

async function moveToGroupCommand(to_index, layerIDs) {
    const batchPlay = require('photoshop').action.batchPlay
    console.log('to_index:', to_index)
    console.log('layerIDs:', layerIDs)

    const result = await batchPlay(
        [
            {
                _obj: 'move',
                _target: [
                    {
                        _ref: 'layer',
                        _enum: 'ordinal',
                        _value: 'targetEnum',
                    },
                ],
                to: {
                    _ref: 'layer',
                    _index: to_index,
                },
                adjustment: false,
                version: 5,
                layerID: layerIDs,
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
function MoveToGroupExe(toIndex, layerIDs) {
    try {
        executeAsModal(async () => {
            await moveToGroupCommand(toIndex, layerIDs)
        })
    } catch (e) {
        console.warn('executeCommand error:', e)
    }
}

async function getIndexCommand(layer_id) {
    const idx = batchPlay(
        [
            {
                _obj: 'get',
                _target: [
                    {
                        _property: 'itemIndex',
                    },
                    {
                        _ref: 'layer',
                        // _name: 'myGroup'
                        _id: layer_id,
                    },
                ],
                _options: {
                    dialogOptions: 'dontDisplay',
                },
            },
        ],
        { synchronousExecution: true }
    )[0]['itemIndex']
    console.log('index:', idx)
    return idx
}

async function getLayerIndex(layer_id) {
    const { executeAsModal } = require('photoshop').core
    try {
        let index
        await executeAsModal(async () => {
            index = await getIndexCommand(layer_id)
            console.log('getIndex: ', index)
        })
        return index
    } catch (e) {
        console.warn('getIndex error:', e)
    }
}

async function unselectActiveLayers() {
    const layers = await app.activeDocument.activeLayers
    for (layer of layers) {
        layer.selected = false
    }
}
async function unselectActiveLayersExe() {
    await executeAsModal(async () => {
        await unselectActiveLayers()
    })
}
async function selectLayers(layers) {
    await unselectActiveLayers()
    for (layer of layers) {
        try {
            if (layer) {
                const is_visible = layer.visible // don't change the visibility when selecting the layer
                layer.selected = true
                layer.visible = is_visible
            }
        } catch (e) {
            console.warn(e)
        }
    }
}

async function setVisibleExe(layer, is_visible) {
    try {
        await executeAsModal(async () => {
            layer.visible = is_visible
        })
    } catch (e) {
        console.warn(e)
    }
}
async function selectLayersExe(layers) {
    await executeAsModal(async () => {
        await selectLayers(layers)
    })
}
async function selectGroup(layer) {
    await unselectActiveLayers()
    layer.parent.selected = true
}
async function collapseGroup(layer) {
    await selectGroup(layer)
    await app.activeDocument.activeLayers[0].merge()
}

async function createMaskCommand() {
    const batchPlay = require('photoshop').action.batchPlay

    const result = await batchPlay(
        [
            {
                _obj: 'make',
                new: {
                    _class: 'channel',
                },
                at: {
                    _ref: 'channel',
                    _enum: 'channel',
                    _value: 'mask',
                },
                using: {
                    _enum: 'userMaskEnabled',
                    _value: 'revealSelection',
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

async function createMaskExe() {
    const { executeAsModal } = require('photoshop').core
    await executeAsModal(createMaskCommand)
}

//unselect the rectangular marquee selection area
async function unSelectMarqueeCommand() {
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
async function unSelectMarqueeExe() {
    try {
        await executeAsModal(unSelectMarqueeCommand)
    } catch (e) {
        console.warn(e)
    }
}

//REFACTOR: move to selection.js
async function selectMarqueeRectangularToolExe() {
    async function selectMarqueeRectangularToolCommand() {
        const result = await batchPlay(
            [
                {
                    _obj: 'select',
                    _target: [
                        {
                            _ref: 'marqueeRectTool',
                        },
                    ],
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
    await executeAsModal(async () => {
        await selectMarqueeRectangularToolCommand()
    })
}

async function promptForMarqueeTool() {
    console.warn('promptForMarqueeTool is deprecated use Notification class')(
        async () => {
            const r1 = await dialog_box.prompt(
                'Please Select a Rectangular Area',
                'You Forgot to select a Rectangular Area',
                ['Cancel', 'Rectangular Marquee']
            )
            if ((r1 || 'Rectangular Marquee') !== 'Rectangular Marquee') {
                /* cancelled or No */
                console.log('cancel')
            } else {
                /* Yes */
                console.log('Rectangular Marquee')
                await selectMarqueeRectangularToolExe()
            }
        }
    )()
}

async function selectLayerChannelCommand() {
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
                    _ref: 'channel',
                    _enum: 'channel',
                    _value: 'transparencyEnum',
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

async function snapshot_layer() {
    let psAction = require('photoshop').action
    const ids = await app.activeDocument.layers.map((layer) => layer.id)
    let command = [
        // Select All Layers current layer
        {
            _obj: 'selectAllLayers',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
        },
        // Duplicate current layer
        // {"ID":[459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513],"_obj":"duplicate","_target":[{"_enum":"ordinal","_ref":"layer","_value":"targetEnum"}],"version":5},
        {
            ID: ids,
            _obj: 'duplicate',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
            // version: 5
        },

        // Merge Layers
        { _obj: 'mergeLayersNew' },
        // Make
        {
            _obj: 'make',
            at: { _enum: 'channel', _ref: 'channel', _value: 'mask' },
            new: { _class: 'channel' },
            using: { _enum: 'userMaskEnabled', _value: 'revealSelection' },
        },
        // Set Selection
        {
            _obj: 'set',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            to: { _enum: 'ordinal', _ref: 'channel', _value: 'targetEnum' },
        },
    ]
    const result = await psAction.batchPlay(command, {
        synchronousExecution: true,
        modalBehavior: 'execute',
    })
    console.log('snapshot_layer: result: ', result)
    return result
}
async function snapshot_layer_new() {
    //similar to snapshot_layer() but fixes the problem with smart effects

    let psAction = require('photoshop').action

    const ids = await app.activeDocument.layers.map((layer) => layer.id)
    const selection_info = await selection.Selection.getSelectionInfoExe()

    let create_snapshot_layer_command = [
        // Select All Layers current layer
        {
            _obj: 'selectAllLayers',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
        },
        // Duplicate current layer

        {
            ID: ids,
            _obj: 'duplicate',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
            // version: 5
        },

        // Merge Layers
        { _obj: 'mergeLayersNew' },
    ]
    const result = await psAction.batchPlay(create_snapshot_layer_command, {
        synchronousExecution: true,
        modalBehavior: 'execute',
    })
    await selection.reSelectMarqueeExe(selection_info) //reselect the selection area for the mask
    //make a mask of the selection area
    const make_mask_command = [
        // Make
        {
            _obj: 'make',
            at: { _enum: 'channel', _ref: 'channel', _value: 'mask' },
            new: { _class: 'channel' },
            using: { _enum: 'userMaskEnabled', _value: 'revealSelection' },
        },
    ]
    const result_2 = await psAction.batchPlay(make_mask_command, {
        synchronousExecution: true,
        modalBehavior: 'execute',
    })
    await selection.reSelectMarqueeExe(selection_info) //reselect the selection area again so we don't break other functionality

    console.log('snapshot_layer: result: ', result)
    return result
}

async function snapshot_layerExe() {
    try {
        await executeAsModal(
            async () => {
                await snapshot_layer_new()
            },
            {
                commandName: 'Action Commands',
            }
        )
    } catch (e) {
        console.error(e)
    }
}

async function snapshot_layer_no_slide() {
    let psAction = require('photoshop').action
    // const ids = (await app.activeDocument.activeLayers).map(layer => layer.id)
    const ids = await app.activeDocument.layers.map((layer) => layer.id)
    let command = [
        // Select All Layers current layer
        {
            _obj: 'selectAllLayers',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
        },
        // Duplicate current layer
        // {"ID":[459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513],"_obj":"duplicate","_target":[{"_enum":"ordinal","_ref":"layer","_value":"targetEnum"}],"version":5},
        {
            ID: ids,
            _obj: 'duplicate',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
            // version: 5
        },
    ]
    const result = await psAction.batchPlay(command, {
        synchronousExecution: true,
        modalBehavior: 'execute',
    })
    console.log('snapshot_layer: result: ', result)
    return result
}

async function snapshot_layer_no_slide_Exe() {
    try {
        await executeAsModal(
            async () => {
                await snapshot_layer_no_slide()
            },
            {
                commandName: 'Action Commands',
            }
        )
    } catch (e) {
        console.error(e)
    }
}

// await runModalFunction();

async function fillAndGroup() {
    let result
    let psAction = require('photoshop').action

    let command = [
        // Make fill layer
        {
            _obj: 'make',
            _target: [{ _ref: 'contentLayer' }],
            using: {
                _obj: 'contentLayer',
                type: {
                    _obj: 'solidColorLayer',
                    color: {
                        _obj: 'RGBColor',
                        blue: 255.0,
                        grain: 255.0,
                        red: 255.0,
                    },
                },
            },
        },
    ]
    const snapshotLayer = await app.activeDocument.activeLayers[0]
    await makeGroupCommand()
    const groupLayer = app.activeDocument.activeLayers[0]
    result = await psAction.batchPlay(command, {})
    const fillLayer = app.activeDocument.activeLayers[0]
    snapshotLayer.moveAbove(fillLayer)
}

async function fillAndGroupExe() {
    await require('photoshop').core.executeAsModal(fillAndGroup, {
        commandName: 'Action Commands',
    })
}
async function fastSnapshot() {
    await snapshot_layerExe()
    await fillAndGroupExe()
}

function layerToFileName(layer, session_id) {
    file_name = `${layer.name}_${layer.id}_${session_id}`
    return file_name
}
function layerNameToFileName(layer_name, layer_id, session_id) {
    file_name = `${layer_name}_${layer_id}_${session_id}`
    return file_name
}

async function createClippingMaskExe() {
    const batchPlay = require('photoshop').action.batchPlay

    async function createClippingMaskCommand() {
        const result = await batchPlay(
            [
                {
                    _obj: 'make',
                    new: {
                        _class: 'channel',
                    },
                    at: {
                        _ref: 'channel',
                        _enum: 'channel',
                        _value: 'mask',
                    },
                    using: {
                        _enum: 'userMaskEnabled',
                        _value: 'revealSelection',
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

    await executeAsModal(async () => {
        await createClippingMaskCommand()
    })
}
//REFACTOR: delete and replace with getSelectionInfoExe()
async function checkIfSelectionAreaIsActive() {
    try {
        let isSelectionAreaValid =
            await selection.Selection.getSelectionInfoExe()
        return isSelectionAreaValid
    } catch (e) {
        console.warn(e)
    }
}
async function saveUniqueDocumentIdExe(new_id) {
    const batchPlay = require('photoshop').action.batchPlay

    async function saveUniqueDocumentIdCommand() {
        const batchPlay = require('photoshop').action.batchPlay

        const result = await batchPlay(
            [
                {
                    _obj: 'set',
                    _target: [
                        {
                            _ref: 'property',
                            _property: 'fileInfo',
                        },
                        {
                            _ref: 'document',
                            _enum: 'ordinal',
                            _value: 'targetEnum',
                        },
                    ],
                    to: {
                        _obj: 'fileInfo',
                        caption: new_id,
                        keywords: [new_id],
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

    await executeAsModal(async () => {
        await saveUniqueDocumentIdCommand()
    })
}

async function readUniqueDocumentIdExe() {
    const batchPlay = require('photoshop').action.batchPlay

    async function readUniqueDocumentIdCommand() {
        const batchPlay = require('photoshop').action.batchPlay

        const result = await batchPlay(
            [
                {
                    _obj: 'get',
                    _target: [
                        {
                            _ref: 'property',
                            _property: 'fileInfo',
                        },
                        {
                            _ref: 'document',
                            _enum: 'ordinal',
                            _value: 'targetEnum',
                        },
                    ],
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
        console.log('readUniqueDocumentIdCommand: result ', result)
        return result
    }

    let uniqueDocumentId = ''
    try {
        await executeAsModal(async () => {
            uniqueDocumentId = (await readUniqueDocumentIdCommand())[0].fileInfo
                .caption
            if (typeof uniqueDocumentId === 'string') {
                uniqueDocumentId = uniqueDocumentId.trim()
            }
        })
    } catch (e) {
        console.warn('readUniqueDocumentIdExe: ', e)
        uniqueDocumentId = ''
    }

    return uniqueDocumentId
}

const readPng = async (image_name) => {
    //it will save the document then read it. store it in memory
    // image_name = 'test.png'
    try {
        let img_buffer
        await executeAsModal(
            async (control) => {
                const folder = await fs.getTemporaryFolder()
                const file = await folder.createFile(image_name, {
                    overwrite: true,
                })

                const currentDocument = app.activeDocument
                await currentDocument.saveAs.png(
                    file,
                    // {
                    //   compression: 6,
                    // },
                    null,
                    true
                )

                const arrayBuffer = await file.read({ format: formats.binary })
                img_buffer = arrayBuffer
            },

            { commandName: 'readPng' }
        )

        return img_buffer
    } catch (e) {
        console.warn(e)
    }
}

async function selectCanvasCommand() {
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
                    _value: 'allEnum',
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
async function selectCanvasExe() {
    await executeAsModal(
        async () => {
            await selectCanvasCommand()
        },
        { commandName: 'selectCanvasExe' }
    )
}
async function newExportPng(layer, image_name, width, height) {
    //store layers we want to export in variables
    // let layerToExports =
    // create new document
    // duplicate the layers to the new documnet
    //select the layer channel selectLayerChannelCommand
    //document.crop
    //export using readPng()

    try {
        let exportDoc
        const makeDoc = async () => {
            let exportDoc = await app.documents.add({
                width: width,
                height: height,
                resolution: await app.activeDocument.resolution,
                mode: 'RGBColorMode',
                fill: 'transparent',
            })
        }
        let image_buffer
        await executeAsModal(
            async () => {
                // await app.documents.add()
                await makeDoc()
                exportDoc = app.activeDocument

                console.log('exportDoc.id: ', exportDoc.id)
                // for (layer of layersToExport) {

                console.log(layer.id)
                const dupLayer = await layer.duplicate(exportDoc)
                await selectLayers([dupLayer])
                // await selectLayerChannelCommand()
                await selectCanvasExe()
                const canvas_selection_info =
                    await selection.Selection.getSelectionInfoExe()
                await layerToSelection(canvas_selection_info)
                image_buffer = await readPng(image_name)
                await exportDoc.closeWithoutSaving()
            },
            { commandName: 'NewExportPng' }
        )
        return image_buffer
        // }
    } catch (e) {
        console.error(`newExportPng error: ,${e}`)
    }
}

async function tempExportPng(layer, image_name, width, height) {
    //store layers we want to export in variables
    // let layerToExports =
    // create new document
    // duplicate the layers to the new documnet
    //select the layer channel selectLayerChannelCommand
    //document.crop
    //export using readPng()

    try {
        let exportDoc
        const makeDoc = async () => {
            let exportDoc = await app.documents.add({
                width: width,
                height: height,
                resolution: await app.activeDocument.resolution,
                mode: 'RGBColorMode',
                fill: 'transparent',
            })
        }
        await executeAsModal(
            async () => {
                // await app.documents.add()
                await makeDoc()
                exportDoc = app.activeDocument

                console.log('exportDoc.id: ', exportDoc.id)
                // for (layer of layersToExport) {

                console.log(layer.id)
                const dupLayer = await layer.duplicate(exportDoc)
                await selectLayers([dupLayer])
                await selectCanvasExe()
                const canvas_selection_info =
                    await selection.Selection.getSelectionInfoExe()
                await layerToSelection(canvas_selection_info)
                await readPng(image_name)
                await exportDoc.closeWithoutSaving()
            },
            { commandName: 'tempExportPng' }
        )
        // }
    } catch (e) {
        console.error(`newExportPng error: ,${e}`)
    }
}
async function mergeVisibleCommand() {
    const result = await batchPlay(
        [
            {
                _obj: 'mergeVisible',
                duplicate: true,
                _isCommand: true,
            },
        ],
        {
            synchronousExecution: true,
            modalBehavior: 'execute',
        }
    )

    return result
}

async function mergeVisibleExe() {
    await executeAsModal(async () => {
        await mergeVisibleCommand()
    })
}

async function layerToSelection(selection_info) {
    //store active layer for later

    try {
        //Store selection info
        //unSelect
        //move layer
        //scale layer
        //Select from selection info
        // let selection_info = await getSelectionInfo()

        console.log('selection_info:', selection_info)

        console.log('unSelect')

        function getLayerSize(layer) {
            console.log('layer.bounds:')
            console.dir(layer.bounds)
            const bounds = layer.bounds
            const height = bounds.bottom - bounds.top
            const width = bounds.right - bounds.left
            return {
                height: height,
                width: width,
                left: bounds.left,
                right: bounds.right,
                top: bounds.top,
                bottom: bounds.bottom,
            }
        }
        //scale layer
        async function scaleLayer(layer, selection_info) {
            console.log('scaleLayer got called')
            let layer_info = getLayerSize(layer)
            scale_x_ratio = (selection_info.width / layer_info.width) * 100
            scale_y_ratio = (selection_info.height / layer_info.height) * 100
            console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
            await layer.scale(scale_x_ratio, scale_y_ratio)
        }

        async function moveLayerExe(layerToMove, selection_info) {
            let layer_info = getLayerSize(layerToMove)
            top_dist = layer_info.top - selection_info.top
            left_dist = layer_info.left - selection_info.left
            await layerToMove.translate(-left_dist, -top_dist)
        }
        // const activeLayer = await getActiveLayer()

        //store all active layers
        const activeLayers = await app.activeDocument.activeLayers
        await unSelectMarqueeExe()

        await executeAsModal(
            async () => {
                for (let layer of activeLayers) {
                    await selectLayers([layer]) // make sure only one layer is selected
                    await scaleLayer(layer, selection_info) //scale to selection size
                    await moveLayerExe(layer, selection_info) //move to selection
                }
            },
            { commandName: 'moveLayerExe' }
        )
    } catch (e) {
        console.warn(e)
    }
}
function executeCommandExe(commandFunc) {
    try {
        ;(async () => {
            await executeAsModal(async () => {
                await commandFunc()
            })
        })()
    } catch (e) {
        console.warn(e)
    }
}
async function executeDescExe(Desc) {
    try {
        await executeAsModal(async () => {
            const result = await batchPlay([Desc], {
                synchronousExecution: true,
                modalBehavior: 'execute',
            })
            console.log(result)
        })
    } catch (e) {
        console.warn(e)
    }
}
async function createTempInpaintMaskLayer() {
    if (!mask_layer_exist) {
        //make new layer "Mask -- Paint White to Mask -- temporary"
        const name = 'Mask -- Paint White to Mask -- temporary'
        await unselectActiveLayersExe() // so that the mask layer get create at the top of the layer stocks
        const top_layer_doc = await app.activeDocument.layers[0]
        inpaint_mask_layer = await createNewLayerExe(name, 60)
        await executeAsModal(async () => {
            await inpaint_mask_layer.moveAbove(top_layer_doc)
        })
        mask_layer_exist = true
        const index = app.activeDocument.historyStates.length - 1
        inpaint_mask_layer_history_id =
            app.activeDocument.historyStates[index].id
        console.log(
            'inpaint_mask_layer_history_id: ',
            inpaint_mask_layer_history_id
        )
    }
}
function selectTool() {
    var doc = app.activeDocument
    var activeTool = app.currentTool
    console.dir(app, { depth: null })
    console.log('hello this is Abdullah')
    document.getElementById('layers').innerHTML = `<span>
    selectTool was called, ${activeTool}
    </span>`
}

async function fillImage() {
    const storage = require('uxp').storage
    const fs = storage.localFileSystem
    let imageFile = await fs.getFileForOpening({
        types: storage.fileTypes.images,
    })

    // Create ImageFill for this image
    const ImageFill = require('scenegraph').ImageFill
    let fill = new ImageFill(imageFile)

    // Set fill of first selected item
    selection.items[0].fill = fill
}

function pastImage2Layer() {
    const { batchPlay } = require('photoshop').action
    const { executeAsModal } = require('photoshop').core

    executeAsModal(
        () => {
            // batchPlay([command], {})
            const result = batchPlay(
                [
                    {
                        _obj: 'paste',
                        antiAlias: {
                            _enum: 'antiAliasType',
                            _value: 'antiAliasNone',
                        },
                        as: {
                            _class: 'pixel',
                        },
                        _options: {
                            dialogOptions: 'dontDisplay',
                        },
                    },
                ],
                {
                    synchronousExecution: true,
                    modalBehavior: 'fail',
                }
            )
        },
        {
            commandName: 'Create Label',
        }
    )
}

//store active layers only if they are not stored.
async function storeActiveLayers() {
    setTimeout(async () => {
        const layers = await app.activeDocument.activeLayers
        console.log('storeActiveLayers: ', layers.length)

        if (layers.length > 0) {
            saved_active_layers = layers
            await unselectActiveLayersExe()
        }
    }, 200)
}

async function restoreActiveLayers() {
    const layers = await app.activeDocument.activeLayers
    console.log('restoreActiveLayers: ', layers.length)
    if (layers.length == 0) {
        await selectLayersExe(psapi.saved_active_layers)
        saved_active_layers = []
    }
}

//store active selection only if they are not stored.
async function storeActiveSelection() {
    try {
        setTimeout(async () => {
            const current_selection = await checkIfSelectionAreaIsActive()
            console.log('storeActiveSelection: ', current_selection)

            if (current_selection) {
                saved_active_selection = current_selection
                await unSelectMarqueeExe()
            }
        }, 200)
    } catch (e) {
        console.warn(e)
    }
}

//REFACTOR: move to psapi.js
async function restoreActiveSelection() {
    try {
        const current_selection = await checkIfSelectionAreaIsActive()

        console.log('restoreActiveSelection: ', current_selection)
        if (
            !current_selection &&
            selection.Selection.isSelectionValid(saved_active_selection)
        ) {
            await selection.reSelectMarqueeExe(saved_active_selection)
            saved_active_selection = {}
        }
    } catch (e) {
        console.warn(e)
    }
}

function moveElementToAnotherTab(elementId, newParentId) {
    const element = document.getElementById(elementId)
    document.getElementById(newParentId).appendChild(element)
}

async function imageToSmartObject() {
    const { batchPlay } = require('photoshop').action
    const { executeAsModal } = require('photoshop').core

    try {
        // const file = await fs.getFileForOpening()
        // token = await fs.getEntryForPersistentToken(file);
        // const entry = await fs.getEntryForPersistentToken(token);
        // const session_token = await fs.createSessionToken(entry);
        // // let token = await fs.createSessionToken(entry)
        await executeAsModal(
            async () => {
                console.log('imageToSmartObject():')
                let pluginFolder = await fs.getPluginFolder()
                let img = await pluginFolder.getEntry(
                    'output- 1672730735.1670313.png'
                )
                const result = await batchPlay(
                    [
                        {
                            _obj: 'placeEvent',
                            ID: 95,
                            null: {
                                _path: img,
                                _kind: 'local',
                            },
                            freeTransformCenterState: {
                                _enum: 'quadCenterState',
                                _value: 'QCSAverage',
                            },
                            offset: {
                                _obj: 'offset',
                                horizontal: {
                                    _unit: 'pixelsUnit',
                                    _value: 0,
                                },
                                vertical: {
                                    _unit: 'pixelsUnit',
                                    _value: 0,
                                },
                            },
                            replaceLayer: {
                                _obj: 'placeEvent',
                                from: {
                                    _ref: 'layer',
                                    _id: 56,
                                },
                                to: {
                                    _ref: 'layer',
                                    _id: 70,
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
            },
            {
                commandName: 'Create Label',
            }
        )
    } catch (e) {
        console.log('imageToSmartObject() => error: ')
        console.warn(e)
    }
}

async function placeEmbedded(image_name, dir_entery) {
    //silent importer
    try {
        let image_dir = dir_entery

        const file = await image_dir.createFile(image_name, { overwrite: true })

        const img = await file.read({ format: formats.binary })
        const token = await storage.localFileSystem.createSessionToken(file)
        let place_event_result
        await executeAsModal(async () => {
            const result = await batchPlay(
                [
                    {
                        _obj: 'placeEvent',
                        ID: 6,
                        null: {
                            _path: token,
                            _kind: 'local',
                        },
                        freeTransformCenterState: {
                            _enum: 'quadCenterState',
                            _value: 'QCSAverage',
                        },
                        offset: {
                            _obj: 'offset',
                            horizontal: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                            vertical: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                        },
                        _isCommand: true,
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
            console.log('placeEmbedd batchPlay result: ', result)

            place_event_result = result[0]
        })

        return place_event_result
    } catch (e) {
        console.warn(e)
    }
}

async function convertToSmartObjectExe() {
    await require('photoshop').core.executeAsModal(convertToSmartObjectAction)
}

async function stackLayers() {
    //workingDoc is the project you are using stable diffusion in
    const workingDoc = app.documents[0]
    //you should not open two multiple projects this script assume there is only one project opened
    const docsToStack = app.documents.filter(
        (doc) => doc._id !== workingDoc._id
    )
    let docCounter = 0

    // execute as modal is required for functions that change the state of Photoshop or documents
    // think of it as a function that 'wraps' yours and tells Photoshop to go into a modal state and not allow anything to interrupt it from doing whatever is contained in the executeAsModal
    // we also call it with the await keyword to tell JS that we want to wait for it to complete before moving on to later code (in this case there isn't any though)
    await require('photoshop').core.executeAsModal(async () => {
        // increment counter
        docCounter++

        // loop through other open docs
        for (const doc of docsToStack) {
            // flatten
            // doc.flatten();

            // rename layer with counter
            doc.layers[0].name = `Layer ${docCounter}`

            // increment counter
            docCounter++

            // duplicate layer to docZero
            doc.layers[0].duplicate(workingDoc)

            // close doc
            await doc.closeWithoutSaving()
        }
    })
}

function toggleLayerVisibility(layer, b_on) {
    try {
        layer.visible = b_on
    } catch (e) {
        console.warn(e)
    }
}

async function collapseFolderExe(layers, expand = false, recursive = false) {
    for (let layer of layers) {
        try {
            await executeAsModal(async () => {
                const is_visible = await layer.visible // don't change the visiblity of the layer when collapsing
                await selectLayers([layer])
                await collapseFolderCommand(expand, recursive)
                layer.visible = is_visible
            })
        } catch (e) {
            console.warn(e)
        }
    }
}

async function getColor(X, Y) {
    // const background_layer_id = await app.activeDocument.backgroundLayer.id

    const batchPlay = require('photoshop').action.batchPlay
    try {
        const result = await batchPlay(
            [
                {
                    _obj: 'colorSampler',
                    _target: {
                        _ref: 'document',
                        _enum: 'ordinal',
                        _value: 'targetEnum',
                    },
                    samplePoint: {
                        horizontal: X,
                        vertical: Y,
                    },
                },
            ],
            {}
        )

        const red = result[0].colorSampler.red
        const green = result[0].colorSampler.grain
        const blue = result[0].colorSampler.blue

        return [red, green, blue]
    } catch (e) {
        console.warn(e)
    }
}

const collapseFolderCommand = async (expand = false, recursive = false) => {
    let result
    try {
        result = await batchPlay(
            [
                {
                    _obj: 'set',
                    _target: {
                        _ref: [
                            { _property: 'layerSectionExpanded' },
                            {
                                _ref: 'layer',
                                _enum: 'ordinal',
                                _value: 'targetEnum',
                            },
                        ],
                    },
                    to: expand,
                    recursive,
                    _options: { dialogOptions: 'dontDisplay' },
                },
            ],
            { synchronousExecution: true }
        )
    } catch (e) {
        console.error(e.message)
    }
    return result
}

async function createBackgroundLayer(r = 255, g = 255, b = 255) {
    try {
        const has_background = await hasBackgroundLayer()
        if (has_background) {
            //no need to create a background layer
            return null
        }

        //reselect the selection area if it exist

        await executeAsModal(async () => {
            //store the selection area and then unselected
            const selectionInfo =
                await selection.Selection.getSelectionInfoExe()
            await unSelectMarqueeExe()
            const active_layers = app.activeDocument.activeLayers

            // await createNewLayerCommand('background') //create layer
            //make the layer into background
            const result = await batchPlay(
                [createSolidLayerDesc(r, g, b), makeBackgroundLayerDesc()],
                {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                }
            )

            await selection.reSelectMarqueeExe(selectionInfo)
            await selectLayersExe(active_layers)
        })
    } catch (e) {
        console.warn(e)
    }
}

const makeBackgroundLayerDesc = () => ({
    _obj: 'make',
    _target: [
        {
            _ref: 'backgroundLayer',
        },
    ],
    using: {
        _ref: 'layer',
        _enum: 'ordinal',
        _value: 'targetEnum',
    },
    _options: { failOnMissingProperty: false, failOnMissingElement: false },
    // _options: {
    //     dialogOptions: 'dontDisplay',
    // },
})

const createSolidLayerDesc = (r, g, b) => ({
    _obj: 'make',
    _target: [
        {
            _ref: 'contentLayer',
        },
    ],
    using: {
        _obj: 'contentLayer',
        type: {
            _obj: 'solidColorLayer',
            color: {
                _obj: 'RGBColor',
                red: r,
                grain: g,
                blue: b,
            },
        },
    },
    _options: {
        dialogOptions: 'dontDisplay',
    },
})

const hasBackgroundLayerDesc = () => ({
    _obj: 'get',
    _target: [
        { _property: 'hasBackgroundLayer' },
        {
            _ref: 'document',
            _enum: 'ordinal',
            _value: 'targetEnum',
        },
    ],
})

async function hasBackgroundLayer() {
    // check if a document has a background layer
    try {
        const result = await batchPlay([hasBackgroundLayerDesc()], {
            synchronousExecution: true,
            modalBehavior: 'execute',
        })
        const b_hasBackgroundLayer = result[0]?.hasBackgroundLayer
        return b_hasBackgroundLayer
    } catch (e) {
        console.warn(e)
    }
}

async function createNewLayerExe(layerName, opacity = 100) {
    await executeAsModal(async () => {
        await createNewLayerCommand(layerName, opacity)
    })
    const new_layer = await app.activeDocument.activeLayers[0]
    return new_layer
}

async function createNewLayerCommand(layerName, opacity = 100) {
    return await app.activeDocument.createLayer({
        name: layerName,
        opacity: opacity,
        mode: 'normal',
    })
}

module.exports = {
    createSolidLayer,
    createEmptyGroup,
    getLayerIndex,
    collapseGroup,
    moveToGroupCommand,
    MoveToGroupExe,
    selectLayers,
    selectLayersExe,
    unselectActiveLayers,
    unselectActiveLayersExe,
    createMaskExe,
    unSelectMarqueeCommand,
    unSelectMarqueeExe,
    selectLayerChannelCommand,
    snapshot_layer,
    snapshot_layerExe,
    fillAndGroupExe,
    fastSnapshot,
    layerToFileName,
    layerNameToFileName,
    createClippingMaskExe,
    checkIfSelectionAreaIsActive,
    selectMarqueeRectangularToolExe,
    promptForMarqueeTool,
    saveUniqueDocumentIdExe,
    readUniqueDocumentIdExe,
    newExportPng,
    mergeVisibleExe,
    selectCanvasExe,
    layerToSelection,
    snapshot_layer_no_slide_Exe,
    setVisibleExe,
    executeCommandExe,
    executeDescExe,
    mask_layer_exist,
    createTempInpaintMaskLayer,
    inpaint_mask_layer,
    inpaint_mask_layer_history_id,
    selectTool,
    fillImage,
    pastImage2Layer,
    saved_active_layers,
    restoreActiveLayers,
    saved_active_selection,
    restoreActiveSelection,
    moveElementToAnotherTab,
    imageToSmartObject,
    placeEmbedded,
    convertToSmartObjectExe,
    use_smart_object,
    getColor,
    collapseFolderExe,
    createBackgroundLayer,
}
