const thumbnail = require('../../thumbnail')
const api = require('../api')
const io = require('../io')
const html_manip = require('../html_manip')

class Lexica {
    constructor(items = []) {
        //items is json object return from lexica request
        this.items = items
    }

    delete() {
        this.items = []
    }
}

async function requestLexica(search_query) {
    const lexica_url = `https://lexica.art/api/v1/search?q=${search_query}`
    const url_encoded = encodeURI(lexica_url)
    result = await api.requestGet(url_encoded)
    console.log('result:', result)
    return result
}
function displayAllLexicaImages(lexica_items) {
    const lexicaMasterImageContainer = document.getElementById(
        'divLexicaImagesContainer'
    )
    lexicaMasterImageContainer.innerHTML = ''
    for (item of lexica_items) {
        displayLexicaImage(item)
    }
}
function displayLexicaImage(lexica_item) {
    // let lexica_item = {
    //     id: '0482ee68-0368-4eca-8846-5930db866b33',
    //     gallery: 'https://lexica.art?q=0482ee68-0368-4eca-8846-5930db866b33',
    //     src: 'https://lexica-serve-encoded-images.sharif.workers.dev/md/0482ee68-0368-4eca-8846-5930db866b33',
    //     srcSmall:
    //         'https://lexica-serve-encoded-images.sharif.workers.dev/sm/0482ee68-0368-4eca-8846-5930db866b33',
    //     prompt: 'cute chubby blue fruits icons for mobile game ui ',
    //     width: 512,
    //     height: 512,
    //     seed: '1413536227',
    //     grid: false,
    //     model: 'stable-diffusion',
    //     guidance: 7,
    //     promptid: 'd9868972-dad8-477d-8e5a-4a0ae1e9b72b',
    //     nsfw: false,
    // }

    const lexicaMasterImageContainer = document.getElementById(
        'divLexicaImagesContainer'
    )

    img_html = document.createElement('img')
    img_html.classList.add('viewer-image')
    img_html.src = lexica_item.srcSmall
    img_html.style.width = '100px'
    const thumbnail_container = thumbnail.Thumbnail.wrapImgInContainer(
        img_html,
        'viewer-image-container'
    )

    async function loadOnCanvas(lexica_item) {
        // lexica_item.
        const link = lexica_item.src
        const image_file_name = 'lexica_image.png'
        await io.IO.urlToLayer(link, image_file_name)
    }

    thumbnail.Thumbnail.addSPButtonToContainer(
        thumbnail_container,
        'svg_sp_btn',
        'Load on Canvas',
        loadOnCanvas,
        lexica_item
    )

    lexicaMasterImageContainer.appendChild(thumbnail_container)
}
document
    .getElementById('btnSearchLexica')
    .addEventListener('click', async () => {
        const search_query = document.getElementById('LexicaSearchField').value
        const result_json = await requestLexica(search_query)

        const lexica_items = result_json.images
        const lexica_obj = getLexicaObject()
        lexica_obj.items = lexica_items
        displayAllLexicaImages(lexica_items)
    })

const g_lexica_obj = new Lexica()

function getLexicaObject() {
    return g_lexica_obj
}
function setLexicaObject(lexica_obj) {
    g_lexica_obj = lexica_obj
}
module.exports = {
    requestLexica,
    displayLexicaImage,
    displayAllLexicaImages,
    requestHostedUrl,
    Lexica,
    getLexicaObject,
    setLexicaObject,
}
