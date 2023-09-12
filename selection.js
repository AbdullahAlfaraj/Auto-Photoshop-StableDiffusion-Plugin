const psapi = require('./psapi')

const html_manip = require('./utility/html_manip')
function finalWidthHeight(
    selectionWidth,
    selectionHeight,
    minWidth,
    minHeight
) {
    // const minWidth = 512
    // const minHeight = 512

    // const selectionWidth = 256
    // const selectionHeight = 1000

    let finalWidth = 0
    let finalHeight = 0

    if (selectionWidth <= selectionHeight) {
        //do operation on the smaller dimension
        const scaleRatio = selectionWidth / minWidth

        finalWidth = minWidth
        finalHeight = selectionHeight / scaleRatio
    } else {
        const scaleRatio = selectionHeight / minHeight

        finalHeight = minHeight
        finalWidth = selectionWidth / scaleRatio
    }
    return [finalWidth, finalHeight]
}

async function selectionToFinalWidthHeight() {
    // const { getSelectionInfoExe } = require('./psapi')
    try {
        const selectionInfo = await psapi.getSelectionInfoExe()
        const [finalWidth, finalHeight] = finalWidthHeight(
            selectionInfo.width,
            selectionInfo.height,
            512,
            512
        )

        return [
            parseInt(finalWidth),
            parseInt(finalHeight),
            selectionInfo.width,
            selectionInfo.height,
        ]
    } catch (e) {
        console.warn('you need a rectangular selection', e)
    }
}

async function selectBoundingBox() {
    let l = await app.activeDocument.activeLayers[0]
    let bounds = await l.boundsNoEffects
    let selectionInfo = convertSelectionObjectToSelectionInfo(bounds)
    await psapi.reSelectMarqueeExe(selectionInfo)
    return selectionInfo
}
function convertSelectionObjectToSelectionInfo(selection_obj) {
    let selection_info = {
        left: selection_obj._left,
        right: selection_obj._right,
        bottom: selection_obj._bottom,
        top: selection_obj._top,
        height: selection_obj._bottom - selection_obj._top,
        width: selection_obj._right - selection_obj._left,
    }
    return selection_info
}

const SelectionInfoDesc = () => ({
    _obj: 'get',
    _target: [
        {
            _property: 'selection',
        },
        {
            _ref: 'document',
            _id: app.activeDocument._id,
        },
    ],
    _options: {
        dialogOptions: 'dontDisplay',
    },
})

async function createChannelIfNotExists(channelName) {
    // const photoshop = require('photoshop')
    // const app = photoshop.app
    // const batchPlay = photoshop.action.batchPlay

    // // Check if the channel exists
    // let channelExists = false
    // for (const channel of app.activeDocument.channels) {
    //     if (channel.name === channelName) {
    //         channelExists = true
    //         break
    //     }
    // }

    // // Create the channel if it doesn't exist
    // if (!channelExists) {
    //     await batchPlay(
    //         [
    //             {
    //                 _obj: 'make',
    //                 _target: [
    //                     {
    //                         _ref: 'channel',
    //                     },
    //                 ],
    //                 using: {
    //                     _obj: 'channel',
    //                     name: channelName,
    //                 },
    //             },
    //         ],
    //         {}
    //     )
    // }
    if (!app.activeDocument.channels.getByName(channelName)) {
    }
}

const deleteChannel = (channel_name = 'mask') =>
    app.activeDocument.channels.getByName(channel_name)
        ? [
              {
                  _obj: 'delete',
                  _target: { _ref: 'channel', _name: channel_name },
                  options: {
                      failOnMissingProperty: false,
                      failOnMissingElement: false,
                  },
              },
          ]
        : []
const makeMaskChannel = (channel_name = 'mask') => ({
    // _obj: 'set',
    // _target: { _ref: 'channel', _property: 'selection' },
    // to: { _ref: 'channel', _name: channel_name },

    _obj: 'duplicate',
    _target: [
        {
            _ref: 'channel',
            _property: 'selection',
        },
    ],
    name: channel_name,
    _isCommand: true,
    options: { failOnMissingProperty: false, failOnMissingElement: false },
})
async function makeMaskChannelExe(channel_name = 'mask') {
    await executeAsModal(async () => {
        // const channel = app.activeDocument.channels.getByName(channel_name)
        // channel?.remove()
        const result = await batchPlay(
            [...deleteChannel(channel_name), makeMaskChannel(channel_name)],
            // [
            //     {
            //         _obj: 'duplicate',
            //         _target: [
            //             {
            //                 _ref: 'channel',
            //                 _property: 'selection',
            //             },
            //         ],
            //         name: channel_name,
            //         _isCommand: true,
            //     },

            //     {
            //         _obj: 'make',
            //         new: { _class: 'channel' },
            //         at: { _ref: 'channel', _enum: 'channel', _value: 'mask' },
            //         using: {
            //             _enum: 'userMaskEnabled',
            //             _value: 'revealSelection',
            //         },
            //     },
            // ],
            {
                synchronousExecution: true,
                modalBehavior: 'execute',
            }
        )
        console.log('result: ', result)
    })
}
async function multiGetExe() {
    desc = {
        _obj: 'multiGet',
        _target: { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
        extendedReference: [['layerID', 'itemIndex', 'count']],
        options: { failOnMissingProperty: false, failOnMissingElement: false },
    }

    try {
        const result = await batchPlay([desc], {
            modalBehavior: 'execute',
            synchronousExecution: true,
        })
        console.log('multiGetExe result: ', result)
        // await executeAsModal(async () => {})
    } catch (e) {
        console.warn(e)
    }
}
async function applyMaskChannelExe(channel_name = 'mask') {
    await executeAsModal(async () => {
        const result = await batchPlay(
            [
                // SelectionInfoDesc(),
                // makeMaskChannel(),

                {
                    _obj: 'set',
                    _target: { _ref: 'channel', _property: 'selection' },
                    to: { _ref: 'channel', _name: channel_name },
                },
                {
                    _obj: 'make',
                    new: { _class: 'channel' },
                    at: { _ref: 'channel', _enum: 'channel', _value: 'mask' },
                    using: {
                        _enum: 'userMaskEnabled',
                        _value: 'revealSelection',
                        _name: channel_name,
                    },
                },
            ],
            {
                synchronousExecution: true,
                modalBehavior: 'execute',
            }
        )
        console.log('result: ', result)
    })
}

async function selectionToChannel(channel_name) {
    const channelToSelection = {
        _obj: 'set',
        _target: { _ref: 'channel', _property: 'selection' },
        to: { _ref: 'channel', _name: channel_name },
    }
    let result
    try {
        await executeAsModal(async () => {
            result = await batchPlay(
                [
                    ...deleteChannel(channel_name),
                    makeMaskChannel(channel_name),
                    channelToSelection,
                ],
                { modalBehavior: 'execute', synchronousExecution: true }
            )
        })
    } catch (e) {
        console.warn(e)
    }
    return result
}
async function createLayerFromMaskChannel(channel_name = 'mask') {
    await executeAsModal(async () => {
        const result = await batchPlay(
            [
                // SelectionInfoDesc(),
                // makeMaskChannel(),
                // {
                //     _obj: 'set',
                //     _target: { _ref: 'channel', _property: 'selection' },
                //     to: { _ref: 'channel', _name: channel_name },
                // },
                // {
                //     _obj: 'make',
                //     new: { _class: 'channel' },
                //     at: { _ref: 'channel', _enum: 'channel', _value: 'mask' },
                //     using: {
                //         _enum: 'userMaskEnabled',
                //         _value: 'revealSelection',
                //         _name: channel_name,
                //     },
                // },
                {
                    _obj: 'set',
                    _target: { _ref: 'layer' },
                    to: { _ref: 'channel', _name: channel_name },
                },
            ],
            {
                synchronousExecution: true,
                modalBehavior: 'execute',
            }
        )
        console.log('result: ', result)
    })
}

async function channelToSelectionExe(channel_name = 'mask') {
    const channelToSelection = {
        _obj: 'set',
        _target: { _ref: 'channel', _property: 'selection' },
        to: { _ref: 'channel', _name: channel_name },
    }
    try {
        await executeAsModal(async () => {
            const result = await batchPlay([channelToSelection], {
                modalBehavior: 'execute',
                synchronousExecution: true,
            })
        })
    } catch (e) {
        console.warn(e)
    }
}
async function inpaintLassoInitImageAndMask(channel_name = 'mask') {
    async function getImageFromCanvas() {
        const width = html_manip.getWidth()
        const height = html_manip.getHeight()
        const selectionInfo = await psapi.getSelectionInfoExe()
        const base64 = await io.IO.getSelectionFromCanvasAsBase64Interface_New(
            width,
            height,
            selectionInfo,
            true
        )
        return base64
    }
    const channelToSelection = {
        _obj: 'set',
        _target: { _ref: 'channel', _property: 'selection' },
        to: { _ref: 'channel', _name: channel_name },
    }
    // await executeAsModal(async () => {
    //     const result = await batchPlay(
    //         [
    //             ...deleteChannel(channel_name),
    //             makeMaskChannel(channel_name),
    //             channelToSelection,
    //         ],
    //         { modalBehavior: 'execute', synchronousExecution: true }
    //     )
    //     const selection_info = await psapi.getSelectionInfoExe()
    // })
    await selectionToChannel('mask') //lasso selection to channel called 'mask'

    const init_base64 = await getImageFromCanvas()

    html_manip.setInitImageSrc(general.base64ToBase64Url(init_base64))
    let mask_base64
    await executeAsModal(async () => {
        const result = await batchPlay([channelToSelection], {
            modalBehavior: 'execute',
            synchronousExecution: true,
        })
        // const selection_info = await psapi.getSelectionInfoExe()
        mask_base64 = await fillSelectionWhiteOutsideBlack()
    })

    //save laso selection to channel
    //get laso selection
    //make rect selection
    //base64 from selection
    //and display it in init image html element
    //get laso selection:
    //make mask layer
    //get rectangular selection
    //get base64 from selection
    //display it in mask image html element
    // let jimp_mask = await Jimp.read(Buffer.from(mask_base64, 'base64'))
    // html_manip.setInitImageMaskSrc(
    //     await jimp_mask.getBase64Async(Jimp.MIME_PNG)
    // )
    html_manip.setInitImageMaskSrc(general.base64ToBase64Url(mask_base64))

    return [init_base64, mask_base64]
    // //return
    // //init image
    //mask
}

async function fillSelectionWhiteOutsideBlack() {
    // Create a new layer
    const layer_name = 'mask'
    const getSelectionDesc = () => ({
        _obj: 'get',
        _target: [
            {
                _property: 'selection',
            },
            {
                _ref: 'document',
                _id: app.activeDocument._id,
            },
        ],
        _options: {
            dialogOptions: 'dontDisplay',
        },
    })
    const invertSelection = () => ({
        _obj: 'inverse',
        _isCommand: true,
    })
    await psapi.unselectActiveLayers()
    const mask_layer = await layer_util.createNewLayerExe('mask')
    await moveToTopLayerStackExe()
    await batchPlay(
        [
            getSelectionDesc(),

            {
                _obj: 'fill',
                using: {
                    _enum: 'fillContents',
                    _value: 'white',
                },
                opacity: {
                    _unit: 'percentUnit',
                    _value: 100,
                },
                mode: {
                    _enum: 'blendMode',
                    _value: 'normal',
                },
            },
            // {
            //     _obj: 'select',
            //     _target: [
            //         {
            //             _ref: 'channel',
            //             _property: 'selection',
            //         },
            //     ],
            // },
            invertSelection(),
            {
                _obj: 'fill',
                using: {
                    _enum: 'fillContents',
                    _value: 'black',
                },
                opacity: {
                    _unit: 'percentUnit',
                    _value: 100,
                },
                mode: {
                    _enum: 'blendMode',
                    _value: 'normal',
                },
            },

            // {
            //     _obj: 'invert',
            //     _target: [
            //         {
            //             _ref: 'channel',
            //             _property: 'selection',
            //         },
            //     ],
            // },

            //make new layer
            // {
            //     _obj: 'make',
            //     _target: [
            //         {
            //             _ref: 'layer',
            //         },
            //     ],
            //     using: {
            //         _obj: 'layer',
            //         name: 'Fill Layer',
            //     },
            // },

            {
                _obj: 'set',
                _target: [
                    { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
                ],
                to: { _obj: 'layer', name: layer_name },
                _options: { dialogOptions: 'dontDisplay' },
                _isCommand: true,
            },
            // getSelectionDesc(),
            //undo the first inversion of the selection
            invertSelection(),
        ],
        { modalBehavior: 'execute' }
    )

    //get the rectangular bounding box selection

    const rect_selection_info = await psapi.getSelectionInfoExe()
    await psapi.reSelectMarqueeExe(rect_selection_info)
    const width = html_manip.getWidth()
    const height = html_manip.getHeight()

    //convert the selection area on the canvas to base64 image
    const base64 = await io.IO.getSelectionFromCanvasAsBase64Interface_New(
        width,
        height,
        rect_selection_info,
        true,
        layer_name + '.png'
    )

    //import the base64 image into the canvas as a new layer
    // await io.IO.base64ToLayer(
    //     base64,
    //     'base64_to_layer_temp.png',
    //     rect_selection_info.left,
    //     rect_selection_info.top,
    //     rect_selection_info.width,
    //     rect_selection_info.height
    // )

    await psapi.cleanLayers([mask_layer])
    return base64
}

async function inpaintLasoInitImage() {
    // Create a new layer
    const layer_name = 'inpaint_laso_init_image'
    const getSelectionDesc = () => ({
        _obj: 'get',
        _target: [
            {
                _property: 'selection',
            },
            {
                _ref: 'document',
                _id: app.activeDocument._id,
            },
        ],
        _options: {
            dialogOptions: 'dontDisplay',
        },
    })
    const invertSelection = () => ({
        _obj: 'inverse',
        _isCommand: true,
    })
    await batchPlay(
        [
            getSelectionDesc(),

            {
                _obj: 'fill',
                using: {
                    _enum: 'fillContents',
                    _value: 'white',
                },
                opacity: {
                    _unit: 'percentUnit',
                    _value: 100,
                },
                mode: {
                    _enum: 'blendMode',
                    _value: 'normal',
                },
            },
            // {
            //     _obj: 'select',
            //     _target: [
            //         {
            //             _ref: 'channel',
            //             _property: 'selection',
            //         },
            //     ],
            // },
            invertSelection(),
            {
                _obj: 'fill',
                using: {
                    _enum: 'fillContents',
                    _value: 'black',
                },
                opacity: {
                    _unit: 'percentUnit',
                    _value: 100,
                },
                mode: {
                    _enum: 'blendMode',
                    _value: 'normal',
                },
            },

            // {
            //     _obj: 'invert',
            //     _target: [
            //         {
            //             _ref: 'channel',
            //             _property: 'selection',
            //         },
            //     ],
            // },

            //make new layer
            // {
            //     _obj: 'make',
            //     _target: [
            //         {
            //             _ref: 'layer',
            //         },
            //     ],
            //     using: {
            //         _obj: 'layer',
            //         name: 'Fill Layer',
            //     },
            // },

            {
                _obj: 'set',
                _target: [
                    { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
                ],
                to: { _obj: 'layer', name: layer_name },
                _options: { dialogOptions: 'dontDisplay' },
                _isCommand: true,
            },
            // getSelectionDesc(),
            //undo the first inversion of the selection
            invertSelection(),
        ],
        { modalBehavior: 'execute' }
    )

    //get the rectangular bounding box selection

    const rect_selection_info = await psapi.getSelectionInfoExe()
    await psapi.reSelectMarqueeExe(rect_selection_info)
    const width = html_manip.getWidth()
    const height = html_manip.getHeight()

    //convert the selection area on the canvas to base64 image
    const base64 = await io.IO.getSelectionFromCanvasAsBase64Interface_New(
        width,
        height,
        rect_selection_info,
        true,
        layer_name + '.png'
    )

    //import the base64 image into the canvas as a new layer
    await io.IO.base64ToLayer(
        base64,
        'base64_to_layer_temp.png',
        rect_selection_info.left,
        rect_selection_info.top,
        rect_selection_info.width,
        rect_selection_info.height
    )
    // Fill the current selection with white
    // await batchPlay(
    //     [
    //         {
    //             _obj: 'fill',
    //             using: {
    //                 _enum: 'fillContents',
    //                 _value: 'white',
    //             },
    //             opacity: {
    //                 _unit: 'percentUnit',
    //                 _value: 100,
    //             },
    //             mode: {
    //                 _enum: 'blendMode',
    //                 _value: 'normal',
    //             },
    //         },
    //     ],
    //     { modalBehavior: 'execute' }
    // )

    // // Invert the selection
    // await batchPlay(
    //     [
    //         {
    //             _obj: 'invert',
    //             _target: [
    //                 {
    //                     _ref: 'channel',
    //                     _property: 'selection',
    //                 },
    //             ],
    //         },
    //     ],
    //     { modalBehavior: 'execute' }
    // )

    // // Fill the inverted selection with black
    // await batchPlay(
    //     [
    //         {
    //             _obj: 'fill',
    //             using: {
    //                 _enum: 'fillContents',
    //                 _value: 'black',
    //             },
    //             opacity: {
    //                 _unit: 'percentUnit',
    //                 _value: 100,
    //             },
    //             mode: {
    //                 _enum: 'blendMode',
    //                 _value: 'normal',
    //             },
    //         },
    //     ],
    //     { modalBehavior: 'execute' }
    // )
}

class Selection {
    static async getSelectionInfoExe() {
        //return a selectionInfo object or undefined
        try {
            const selection = await executeAsModal(async () => {
                const result = await batchPlay([SelectionInfoDesc()], {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                })

                return result[0]?.selection
            })

            if (this.isSelectionValid(selection)) {
                let selection_info = {
                    left: selection.left._value,
                    right: selection.right._value,
                    bottom: selection.bottom._value,
                    top: selection.top._value,
                    height: selection.bottom._value - selection.top._value,
                    width: selection.right._value - selection.left._value,
                }
                // console.dir({selection_info})
                return selection_info
            }
        } catch (e) {
            console.warn('selection info error', e)
        }
    }

    static isSelectionValid(selection) {
        console.warn(
            'isSelectionValid is deprecated use selection.isSelectionValid instead'
        )
        if (
            selection && // check if the selection is defined
            selection.hasOwnProperty('left') &&
            selection.hasOwnProperty('right') &&
            selection.hasOwnProperty('top') &&
            selection.hasOwnProperty('bottom')
        ) {
            return true
        }

        return false
    }
    static reselectArea(selection_info) {}
    static isSameSelection(selection_info_1, selection_info_2) {}
    static async getImageToSelectionDifference() {
        // const selectionInfo = await psapi.getSelectionInfoExe()
        // const width = html_manip.getWidth()
        // const height = html_manip.getHeight()

        const selectionInfo = session_store.data.current_selection_info
        const width = sd_tab_store.data.width
        const height = sd_tab_store.data.height
        let ratio =
            (width * height) / (selectionInfo.width * selectionInfo.height)

        return ratio
    }
    static {}
}

async function moveToTopLayerStackExe() {
    const moveToTop = {
        _obj: 'move',
        _target: { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
        to: { _ref: 'layer', _enum: 'ordinal', _value: 'front' },
        // _options: { dialogOptions: 'dontDisplay' },
        options: { failOnMissingProperty: false, failOnMissingElement: false },
    }
    try {
        await executeAsModal(async () => {
            const layer = app.activeDocument.activeLayers[0]

            while (layer.parent) {
                console.log(layer.parent)
                const result = await batchPlay([moveToTop], {
                    modalBehavior: 'execute',
                    synchronousExecution: true,
                })
            }
        })
    } catch (e) {
        console.warn(e)
    }
}
async function colorRange() {
    // const select_current_layer_cmd = {
    //     _obj: 'set',
    //     _target: [
    //         {
    //             _ref: 'channel',
    //             _property: 'selection',
    //         },
    //     ],
    //     to: {
    //         _ref: 'channel',
    //         _enum: 'channel',
    //         _value: 'transparencyEnum',
    //     },
    //     _isCommand: true,
    // }
    const cmd = {
        _obj: 'colorRange',
        fuzziness: 0,
        minimum: {
            _obj: 'labColor',
            luminance: 100,
            a: 0,
            b: 0,
        },
        maximum: {
            _obj: 'labColor',
            luminance: 100,
            a: 0,
            b: 0,
        },
        colorModel: 0,
        _isCommand: true,
    }
    const result = await batchPlay([cmd], {
        modalBehavior: 'execute',
        synchronousExecution: true,
    })
    return result
}

async function colorRangeExe() {
    let result
    try {
        await executeAsModal(
            async () => {
                result = await colorRange()
            },
            { commandName: 'Convert Black and White Layer to mask selection' }
        )
    } catch (e) {
        console.warn(e)
    }
    return result
}

async function base64ToLassoSelection(base64, selection_info) {
    //place the mask on the canvas
    const mask_layer = await io.IO.base64ToLayer(
        base64,
        'monochrome_mask.png',
        selection_info.left,
        selection_info.top,
        selection_info.width,
        selection_info.height
    )
    //reselect the selection area
    await psapi.reSelectMarqueeExe(selection_info)
    //reselect the layer
    await psapi.selectLayersExe([mask_layer])
    await executeAsModal(async () => {
        await layer_util.toggleActiveLayer() // undo the toggling operation, active layer will be visible
        //select the white pixels
        await colorRange()
    })
    // await colorRangeExe()
    //delete the mask layer. we only needed to select the white pixels
    await executeAsModal(async () => {
        await layer_util.toggleActiveLayer() // undo the toggling operation, active layer will be visible
    })
    await layer_util.deleteLayers([mask_layer])
}

async function base64ToChannel(base64, selection_info, channel_name) {
    try {
        await executeAsModal(async (context) => {
            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id, //TODO: change this to the session document id
                name: 'Mask Image',
            })

            const layer = app.activeDocument.activeLayers[0]

            if (!layer_util.Layer.doesLayerExist(layer)) {
                return null
            }
            await psapi.unSelectMarqueeExe()
            await psapi.unselectActiveLayersExe()
            await base64ToLassoSelection(base64, selection_info)

            const expand_cmd = {
                _obj: 'expand',
                by: {
                    _unit: 'pixelsUnit',
                    _value: 10,
                },
                selectionModifyEffectAtCanvasBounds: true,
                _isCommand: true,
            }
            const channelToSelection = {
                _obj: 'set',
                _target: { _ref: 'channel', _property: 'selection' },
                to: { _ref: 'channel', _name: channel_name },
            }
            await executeAsModal(async () => {
                const result = await batchPlay(
                    [
                        expand_cmd,
                        ...deleteChannel(channel_name),
                        makeMaskChannel(channel_name),
                        channelToSelection,
                    ],
                    { modalBehavior: 'execute', synchronousExecution: true }
                )
            })
            await psapi.selectLayersExe([layer])
            await applyMaskChannelExe(channel_name)

            // context = stored_context
            await context.hostControl.resumeHistory(history_id)
        })
    } catch (e) {
        console.warn(e)
    }
}

async function black_white_layer_to_mask(mask_id, target_layer_id, mask_name) {
    let result
    let psAction = require('photoshop').action

    let command = [
        //
        ...deleteChannel(mask_name),
        // Select layer “Layer 33”
        {
            _obj: 'select',
            _target: [{ _id: mask_id, _ref: 'layer' }],
            // layerID: [3862],
            makeVisible: false,
        },
        // Set Selection
        {
            _obj: 'set',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            to: {
                _enum: 'channel',
                _ref: 'channel',
                _value: 'transparencyEnum',
            },
        },
        // Color Range
        {
            _obj: 'colorRange',
            colorModel: 0,
            fuzziness: 0,
            maximum: { _obj: 'labColor', a: 0.0, b: 0.0, luminance: 100.0 },
            minimum: { _obj: 'labColor', a: 0.0, b: 0.0, luminance: 100.0 },
        },
        // Duplicate Selection, make sure you delete the any mask that share the same name
        {
            _obj: 'duplicate',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            name: mask_name,
        },
        // Select channel “Alpha 1”
        { _obj: 'select', _target: [{ _name: mask_name, _ref: 'channel' }] },
        // Set Selection
        {
            _obj: 'set',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            to: { _enum: 'ordinal', _ref: 'channel', _value: 'targetEnum' },
        },
        // Select layer “Layer 43”
        {
            _obj: 'select',
            _target: [{ _id: target_layer_id, _ref: 'layer' }],
            // layerID: [3879],
            makeVisible: false,
        },
        // Make
        {
            _obj: 'make',
            at: { _enum: 'channel', _ref: 'channel', _value: 'mask' },
            new: { _class: 'channel' },
            using: { _enum: 'userMaskEnabled', _value: 'revealSelection' },
        },
    ]
    result = await psAction.batchPlay(command, {})
}

async function black_white_layer_to_mask_multi_batchplay(
    mask_id,
    target_layer_id,
    mask_name,
    expand_by = 10
) {
    let result
    let psAction = require('photoshop').action
    const timer = (ms) => new Promise((res) => setTimeout(res, ms))

    let command1 = [
        {
            _obj: 'set',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            to: { _enum: 'ordinal', _value: 'none' },
        },
        //
        ...deleteChannel(mask_name),
        // Select layer “Layer 33”
        {
            _obj: 'select',
            _target: [{ _id: mask_id, _ref: 'layer' }],
            // layerID: [3862],
            makeVisible: false,
        },
        // Set Selection
        {
            _obj: 'set',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            to: {
                _enum: 'channel',
                _ref: 'channel',
                _value: 'transparencyEnum',
            },
        },
    ]
    let command2 = [
        // Color Range
        {
            _obj: 'colorRange',
            colorModel: 0,
            fuzziness: 0,
            maximum: { _obj: 'labColor', a: 0.0, b: 0.0, luminance: 100.0 },
            minimum: { _obj: 'labColor', a: 0.0, b: 0.0, luminance: 100.0 },
        },
        {
            _obj: 'expand',
            by: {
                _unit: 'pixelsUnit',
                _value: expand_by,
            },
            selectionModifyEffectAtCanvasBounds: true,
            _isCommand: true,
        },
    ]
    let command3 = [
        // Duplicate Selection, make sure you delete the any mask that share the same name
        {
            _obj: 'duplicate',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            name: mask_name,
        },
        // Select channel “Alpha 1”
        {
            _obj: 'select',
            _target: [{ _name: mask_name, _ref: 'channel' }],
        },
        // Set Selection
        {
            _obj: 'set',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            to: { _enum: 'ordinal', _ref: 'channel', _value: 'targetEnum' },
        },
        // Select layer “Layer 43”
        {
            _obj: 'select',
            _target: [{ _id: target_layer_id, _ref: 'layer' }],
            // layerID: [3879],
            makeVisible: false,
        },
        // Make
        {
            _obj: 'make',
            at: { _enum: 'channel', _ref: 'channel', _value: 'mask' },
            new: { _class: 'channel' },
            using: { _enum: 'userMaskEnabled', _value: 'revealSelection' },
        },
    ]
    await timer(g_timer_value)
    // result = await psAction.batchPlay(command, {})

    await executeAsModal(async () => {
        result = await psAction.batchPlay(command1, {})
    })

    await timer(g_timer_value)
    await executeAsModal(async () => {
        await layer_util.toggleActiveLayer() // toggle active layer will be visible, note: doesn't solve the issue in outpaint mode
        result = await psAction.batchPlay(command2, {})
    })

    await timer(g_timer_value)
    await executeAsModal(async () => {
        await layer_util.toggleActiveLayer() // undo the toggling operation, active layer will be visible, note: doesn't solve the issue in outpaint mode
        result = await psAction.batchPlay(command3, {})
    })
}

module.exports = {
    finalWidthHeight,
    selectionToFinalWidthHeight,
    selectBoundingBox,
    convertSelectionObjectToSelectionInfo,
    Selection,

    makeMaskChannel,
    makeMaskChannelExe,
    fillSelectionWhiteOutsideBlack,
    inpaintLasoInitImage,
    applyMaskChannelExe,
    createLayerFromMaskChannel,
    multiGetExe,
    inpaintLassoInitImageAndMask,
    channelToSelectionExe,
    moveToTopLayerStackExe,
    colorRangeExe,
    base64ToLassoSelection,
    base64ToChannel,
    deleteChannel,
    selectionToChannel,
    black_white_layer_to_mask,
    black_white_layer_to_mask_multi_batchplay,
}
