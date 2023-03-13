const { requestGet } = require('./api')

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

function compareVersions(version_1, version_2) {
    //remove the first character v
    version_1 = version_1.slice(1)
    const increments_1 = version_1.split('.').map((sn) => parseInt(sn))

    version_2 = version_2.slice(1)
    const increments_2 = version_2.split('.').map((sn) => parseInt(sn))

    let b_older = false // true if version_1 is < than version_2, false if version_1 >= older
    for (let i = 0; i < increments_1.length; ++i) {
        if (increments_1[i] < increments_2[i]) {
            b_older = true
            break
        }
    }
    return b_older
}
async function requestOnlineData() {
    const { requestGet } = require('./api')
    const online_data = await requestGet(g_online_data_url)
    return online_data
}
function nearestMultiple(input, multiple) {
    //use the following formula for finding the upper value instead of the lower.
    //( ( x - 1 ) | ( m - 1 ) ) + 1
    const nearest_multiple = input - (input % multiple)
    return nearest_multiple
}

function sudoTimer() {
    //sudo timer that will count to 100 and update the progress bar.
    //use it for controlNet since block api progress call
    let current_time = 0
    let max_time = 100
    var timerId = setInterval(countdown, 1000)

    function countdown() {
        if (current_time > max_time) {
            clearTimeout(timerId)
            // doSomething()
            // html_manip.updateProgressBarsHtml(0)
        } else {
            html_manip.updateProgressBarsHtml(
                current_time,
                'Loading ControlNet...'
            )
            console.log(current_time + ' seconds remaining')
            current_time++
        }
    }
    return timerId
}
function countNewLines(string) {
    const count = (string.match(/\n/g) || []).length
    // console.log(count)
    return count
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
    compareVersions,
    requestOnlineData,
    nearestMultiple,
    sudoTimer,
    countNewLines,
}
