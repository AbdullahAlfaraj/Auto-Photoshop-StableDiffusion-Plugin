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

const makeMaskChannel = () => ({
    _obj: 'set',
    _target: { _ref: 'channel', _property: 'selection' },
    to: { _ref: 'channel', _name: 'inpaint_mask' },
})
async function makeMaskChannelExe() {
    await executeAsModal(async () => {
        const result = await batchPlay(
            [
                // SelectionInfoDesc(),
                // makeMaskChannel(),
                {
                    _obj: 'duplicate',
                    _target: [
                        {
                            _ref: 'channel',
                            _property: 'selection',
                        },
                    ],
                    name: 'inpaint_mask_2',
                    _isCommand: true,
                },
                // {
                //     _obj: 'set',
                //     _target: { _ref: 'channel', _property: 'selection' },
                //     to: { _ref: 'channel', _name: 'inpaint_mask' },
                // },
                {
                    _obj: 'make',
                    new: { _class: 'channel' },
                    at: { _ref: 'channel', _enum: 'channel', _value: 'mask' },
                    using: {
                        _enum: 'userMaskEnabled',
                        _value: 'revealSelection',
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

async function fillSelectionWhiteOutsideBlack() {
    // Create a new layer
    const layer_name = 'inpaint_laso_mask'
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
        const selectionInfo = await psapi.getSelectionInfoExe()

        const width = html_manip.getWidth()
        const height = html_manip.getHeight()
        const scale_info_str = `${parseInt(width)}x${parseInt(
            height
        )} => ${parseInt(selectionInfo.width)}x${parseInt(
            selectionInfo.height
        )} `
        let ratio =
            (width * height) / (selectionInfo.width * selectionInfo.height)

        // const arrow = percentage >= 1 ? '↑' : '↓'
        // percentage = percentage >= 1 ? percentage : 1 / percentage

        // const percentage_str = `${arrow}X${percentage.toFixed(2)}`

        // console.log('scale_info_str: ', scale_info_str)
        // console.log('percentage_str: ', percentage_str)
        return ratio
    }
    static {}
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
}
