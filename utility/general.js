function newOutputImageName(format = 'png') {
    const random_id = Math.floor(Math.random() * 100000000000 + 1) // Date.now() doesn't have enough resolution to avoid duplicate
    const image_name = `output- ${Date.now()}-${random_id}.${format}`
    console.log('generated image name:', image_name)
    return image_name
}

function makeImagePath(format = 'png') {
    const image_name = general.newOutputImageName(format)
    const image_path = `${uniqueDocumentId}/${image_name}`
    return image_path
}
function convertImageNameToPng(image_name) {
    const image_png_name = image_name.split('.')[0] + '.png'
    return image_png_name
}
module.exports = {
    newOutputImageName,
    makeImagePath,
    convertImageNameToPng,
}
