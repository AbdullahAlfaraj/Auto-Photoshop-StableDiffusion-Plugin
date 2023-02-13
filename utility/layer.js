const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core
const {
    cleanLayers,
    getLayerIndex,
    selectLayers,
    unSelectMarqueeCommand,
    unSelectMarqueeExe,
    getSelectionInfoExe,
    reSelectMarqueeExe,
} = require('../psapi')
const psapi = require('../psapi')
async function createNewLayerExe(layerName) {
    await executeAsModal(async () => {
        await createNewLayerCommand(layerName)
    })
    const new_layer = await app.activeDocument.activeLayers[0]
    return new_layer
}

async function createNewLayerCommand(layerName) {
    return await app.activeDocument.createLayer({
        name: layerName,
        opacity: 100,
        mode: 'normal',
    })
}

async function deleteLayers(layers) {
    try {
        await cleanLayers(layers)
    } catch (e) {
        console.warn(e)
    }
}

async function getIndexCommand() {
    const command = {
        _obj: 'get',
        _target: [
            {
                _property: 'itemIndex',
            },
            {
                _ref: 'layer',
                _enum: 'ordinal',
                _value: 'targetEnum',
            },
        ],
    }
    const result = await batchPlay([command], {
        synchronousExecution: true,
        modalBehavior: 'execute',
    })

    return result
}

async function getIndexExe() {
    let index
    await executeAsModal(async () => {
        index = await getIndexCommand()
    })

    return index
}
const photoshop = require('photoshop')

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

class Layer {
    static doesLayerExist(layer) {
        let b_exist = false
        try {
            if (typeof layer !== 'undefined' && layer && layer.name) {
                //it will throw an error if the layer has been deleted
                b_exist = true
                // return true
            }
            // b_exist = true
        } catch (e) {
            b_exist = false
            // console.warn(e)
        }
        return b_exist
    }
    static async getLayerInfo(layer) {
        const bounds = layer.bounds
        const height = bounds.bottom - bounds.top
        const width = bounds.right - bounds.left
        const layer_info = {
            height: height,
            width: width,
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            bottom: bounds.bottom,
        }
        console.log('layer_info:', layer_info)
        return layer_info
    }
    static async scaleTo(layer, new_width, new_height) {
        await executeAsModal(async () => {
            try {
                const selection_info = await psapi.getSelectionInfoExe()
                await psapi.unSelectMarqueeExe()

                console.log('scaleLayer got called')
                // const activeLayer = getActiveLayer()
                // const activeLayer = await app.activeDocument.activeLayers[0]

                const layer_info = await this.getLayerInfo(layer)
                const scale_x_ratio = (new_width / layer_info.width) * 100
                const scale_y_ratio = (new_height / layer_info.height) * 100
                console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
                await layer.scale(scale_x_ratio, scale_y_ratio)
                await psapi.reSelectMarqueeExe(selection_info)
            } catch (e) {
                console.warn(e)
            }
        })
    }

    static async moveTo(layer, to_x, to_y) {
        try {
            await executeAsModal(async () => {
                try {
                    //translate doesn't work with selection active. so store the selection and then unselect. move the layer, then reselect the selection info
                    const selection_info = await psapi.getSelectionInfoExe()
                    await psapi.unSelectMarqueeExe()

                    const layer_info = await this.getLayerInfo(layer)
                    const top_dist = layer_info.top - to_y
                    const left_dist = layer_info.left - to_x
                    console.log('-left_dist, -top_dist', -left_dist, -top_dist)
                    await layer.translate(-left_dist, -top_dist)

                    await psapi.reSelectMarqueeExe(selection_info)
                } catch (e) {
                    console.warn(e)
                }
            })
        } catch (e) {
            console.warn(e)
        }
    }
    static resizeTo() {}
    static fitSelection() {}
    static async duplicateToDoc(layer, to_doc) {
        const dupLayer = await layer.duplicate(to_doc)
        // await selectLayers([dupLayer])
        return dupLayer
    }
    static {}
}
module.exports = {
    createNewLayerExe,
    deleteLayers,
    getIndexExe,
    collapseFolderExe,
    Layer,
}
