function newOutputImageName(format = 'png') {
    const random_id = Math.floor(Math.random() * 100000000000 + 1) // Date.now() doesn't have enough resolution to avoid duplicate
    const image_name = `output- ${Date.now()}-${random_id}.${format}`
    console.log('generated image name:', image_name)
    return image_name
}

function makeImagePath(format = 'png') {
    const image_name = newOutputImageName(format)
    const image_path = `${uniqueDocumentId}/${image_name}`
    return image_path
}
function convertImageNameToPng(image_name) {
    const image_png_name = image_name.split('.')[0] + '.png'
    return image_png_name
}
function fixNativePath(native_path) {
    const fixed_native_path = native_path.replaceAll('\\', '/')

    return fixed_native_path
}
function base64ToBase64Url(base64_image) {
    return 'data:image/png;base64,' + base64_image
}
function base64UrlToBase64(base64_url) {
    const base64_image = base64_url.replace('data:image/png;base64,', '')
    return base64_image
}
const timer = (ms) => new Promise((res) => setTimeout(res, ms)) //Todo: move this line to it's own utilit function

function scaleToClosestKeepRatio(
    original_width,
    original_height,
    min_width,
    min_height
) {
    const { finalWidthHeight } = require('../selection')
    //better naming than finalWidthHeight()
    //scale an image to the closest dimension while keeping the ratio intact
    const [final_width, final_height] = finalWidthHeight(
        original_width,
        original_height,
        min_width,
        min_height
    )
    return [final_width, final_height]
}

function mapRange(x, in_min, in_max, out_min, out_max) {
    return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
}
function scaleToRatio(
    new_value_1,
    old_value_1,
    new_value_2, //get ignored
    old_value_2,
    max_value,
    min_value
) {
    const ratio = new_value_1 / old_value_1 // 1000/500 = 2
    let final_new_value_2 = old_value_2 * ratio // 500 * 2 = 1000
    let final_new_value_1 = new_value_1
    if (final_new_value_2 > max_value) {
        ;[_, final_new_value_1] = scaleToRatio(
            max_value,
            old_value_2,
            new_value_1, //get ignored
            old_value_1,
            max_value,
            min_value
        )
        final_new_value_2 = max_value
    } else if (final_new_value_2 < min_value) {
        ;[_, final_new_value_1] = scaleToRatio(
            min_value,
            old_value_2,
            new_value_1, //get ignored
            old_value_1,
            max_value,
            min_value
        )
        final_new_value_2 = min_value
    }

    return [final_new_value_1, final_new_value_2]
}

module.exports = {
    newOutputImageName,
    makeImagePath,
    convertImageNameToPng,
    fixNativePath,
    base64ToBase64Url,
    base64UrlToBase64,
    timer,
    scaleToClosestKeepRatio,
    scaleToRatio,
    mapRange,
}
