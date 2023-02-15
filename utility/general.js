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

module.exports = {
    newOutputImageName,
    makeImagePath,
    convertImageNameToPng,
    fixNativePath,
    base64ToBase64Url,
    base64UrlToBase64,
}
