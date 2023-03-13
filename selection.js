const html_manip = require('./utility/html_manip')
const { executeAsModal } = require('photoshop').core
const batchPlay = require('photoshop').action.batchPlay
const app = window.require('photoshop').app

function finalWidthHeight(
    selectionWidth,
    selectionHeight,
    minWidth,
    minHeight
) {
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
    try {
        const selectionInfo = await Selection.getSelectionInfoExe()
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
    await reSelectMarqueeExe(selectionInfo)
    return selectionInfo
}
async function reSelectMarqueeExe(selectionInfo) {
    try {
        if (Selection.isSelectionValid(selectionInfo)) {
            //only try to reactivate the selection area if it is valid
            await executeAsModal(async () => {
                await reSelectMarqueeCommand(selectionInfo)
            })
        }
    } catch (e) {
        console.warn(e)
    }
}

async function reSelectMarqueeCommand(selectionInfo) {
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

async function calcWidthHeightFromSelection() {
    //set the width and height, hrWidth, and hrHeight using selection info and selection mode
    const selection_mode = html_manip.getSelectionMode()
    if (selection_mode === 'ratio') {
        //change (width and height) and (hrWidth, hrHeight) to match the ratio of selection
        const [width, height, hr_width, hr_height] =
            await selectionToFinalWidthHeight()

        html_manip.autoFillInWidth(width)
        html_manip.autoFillInHeight(height)
        html_manip.autoFillInHRWidth(hr_width)
        html_manip.autoFillInHRHeight(hr_height)
    } else if (selection_mode === 'precise') {
        const selectionInfo = await Selection.getSelectionInfoExe()
        const [width, height, hr_width, hr_height] = [
            selectionInfo.width,
            selectionInfo.height,
            0,
            0,
        ]
        html_manip.autoFillInWidth(width)
        html_manip.autoFillInHeight(height)
    }
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
class Selection {
    static async getSelectionInfoExe() {
        try {
            const selection = (
                await executeAsModal(Selection.getSelectionInfoCommand)
            )[0].selection

            if (Selection.isSelectionValid(selection)) {
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
    static async getSelectionInfoCommand() {
        const result = await batchPlay(
            [
                {
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
                },
            ],
            {
                synchronousExecution: true,
                modalBehavior: 'execute',
            }
        )

        return result
    }

    static isSelectionValid(selection) {
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
        const selectionInfo = await Selection.getSelectionInfoExe()

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
    calcWidthHeightFromSelection,
    reSelectMarqueeExe,
}
