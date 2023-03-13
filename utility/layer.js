const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core
const psapi = require('../psapi')
const selection = require('../selection')

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

async function cleanLayers(layers) {
    // g_init_image_related_layers = {}
    // g_mask_related_layers = {}
    // await loadViewerImages()// we should move loadViewerImages to a new file viewer.js
    console.log('cleanLayers() -> layers:', layers)
    for (const layer of layers) {
        try {
            if (Layer.doesLayerExist(layer)) {
                await executeAsModal(async () => {
                    await layer.delete()
                })
            }
        } catch (e) {
            console.warn(
                'warning attempting to a delete layer,layer.name: ',
                layer.name,
                layer,
                e
            )
            continue
        }
    }
    return []
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
                const selection_info =
                    await selection.Selection.getSelectionInfoExe()
                await psapi.unSelectMarqueeExe()

                console.log('scaleLayer got called')

                const layer_info = await this.getLayerInfo(layer)
                const scale_x_ratio = (new_width / layer_info.width) * 100
                const scale_y_ratio = (new_height / layer_info.height) * 100
                console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
                await layer.scale(scale_x_ratio, scale_y_ratio)
                await selection.reSelectMarqueeExe(selection_info)
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
                    const selection_info =
                        await selection.Selection.getSelectionInfoExe()
                    await psapi.unSelectMarqueeExe()

                    const layer_info = await this.getLayerInfo(layer)
                    const top_dist = layer_info.top - to_y
                    const left_dist = layer_info.left - to_x
                    console.log('-left_dist, -top_dist', -left_dist, -top_dist)
                    await layer.translate(-left_dist, -top_dist)

                    await selection.reSelectMarqueeExe(selection_info)
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

    static async duplicateLayerExe(layer) {
        let layer_copy
        try {
            await executeAsModal(async () => {
                layer_copy = await layer.duplicate()
            })
        } catch (e) {
            console.warn('duplication error:', e)
        }
        return layer_copy
    }

    static {}
}

const toggleBackgroundLayerDesc = () => ({
    _obj: 'show',
    null: [
        {
            _ref: 'layer',
            _property: 'background',
        },
    ],
    toggleOptionsPalette: true,
    _options: {
        dialogOptions: 'dontDisplay',
    },
})

async function toggleBackgroundLayerExe() {
    try {
        await executeAsModal(async () => {
            const result = await batchPlay([toggleBackgroundLayerDesc()], {
                synchronousExecution: true,
                modalBehavior: 'execute',
            })
            console.log('toggleBackgroundLayerExe result: ', result)
        })
    } catch (e) {
        console.warn(e)
    }
}

async function fixImageBackgroundLayer() {
    //convert the background layer to a normal layer
    //create a new layer
    //convert the new layer to background
}
async function deleteTempInpaintMaskLayer() {
    console.log(
        'inpaint_mask_layer_history_id: ',
        psapi.inpaint_mask_layer_history_id
    )
    const historyBrushTools = app.activeDocument.historyStates.filter(
        (h) =>
            h.id > psapi.inpaint_mask_layer_history_id &&
            h.name === 'Brush Tool'
    )
    console.log(historyBrushTools)
    if (historyBrushTools.length === 0 && psapi.mask_layer_exist) {
        await cleanLayers([psapi.inpaint_mask_layer])

        psapi.mask_layer_exist = false
    }
}

module.exports = {
    getIndexExe,
    Layer,
    cleanLayers,
    toggleBackgroundLayerExe,
    deleteTempInpaintMaskLayer,
}
