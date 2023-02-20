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
    const { getSelectionInfoExe } = require('./psapi')
    try {
        const selectionInfo = await getSelectionInfoExe()
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

class Selection {
    static getSelectionInfo() {}
    static isValidSelection() {
        selection_info
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
}
