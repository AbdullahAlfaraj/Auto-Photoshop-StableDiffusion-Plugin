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

async function requestHostedUrl(base64) {
    try {
        const payload = {
            key: '6d207e02198a847aa98d0a2a901485a5',
            source: base64,
        }
        const url = 'https://freeimage.host/api/1/upload'

        const result_json = await api.requestFormDataPost(url, payload)

        const image_url = result_json.image.url
        return image_url
    } catch (e) {
        console.warn(e)
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
        try {
            const link = lexica_item.src
            const image_file_name = 'lexica_image.png'
            await io.IO.urlToLayer(link, image_file_name)
        } catch (e) {
            console.warn('loadOnCanvas(): ', lexica_item, e)
        }
    }
    async function loadSettingsToUI(lexica_item) {
        try {
            const settings = {
                prompt: lexica_item.prompt,
                width: lexica_item.width,
                height: lexica_item.height,
                seed: lexica_item.seed,
                cfg_scale: lexica_item.guidance,
            }
            g_ui_settings_object.autoFillInSettings(settings)
        } catch (e) {
            console.warn(e)
        }
    }
    async function searchForSimilarImage(lexica_item) {
        try {
            document.getElementById('LexicaSearchField').value = lexica_item.src
            const result_json = await requestLexica(lexica_item.src)

            const lexica_items = result_json.images

            displayAllLexicaImages(lexica_items)
        } catch (e) {
            console.warn(e)
        }
    }
    thumbnail.Thumbnail.addSPButtonToContainer(
        thumbnail_container,
        'svg_sp_btn_canvas',
        'Load on Canvas',
        loadOnCanvas,
        lexica_item
    )
    thumbnail.Thumbnail.addSPButtonToContainer(
        thumbnail_container,
        'svg_sp_btn',
        'load settings',
        loadSettingsToUI,
        lexica_item
    )
    thumbnail.Thumbnail.addSPButtonToContainer(
        thumbnail_container,
        'svg_sp_btn_search',
        'Search for Similar Image',
        searchForSimilarImage,
        lexica_item
    )
    thumbnail_container.addEventListener('click', () => {
        setLexicaPromptValue(lexica_item.prompt)
        // taLexicaPrompt.style.position = 'fixed'
        const originalPosition = taLexicaPrompt.offsetTop
        const currentPosition = document.querySelector('body > div').scrollTop

        const isScrolledPast = currentPosition > originalPosition

        if (isScrolledPast) {
            taLexicaPrompt.style.position = 'fixed'
        } else {
            taLexicaPrompt.style.position = 'static'
        }
    })

    lexicaMasterImageContainer.appendChild(thumbnail_container)
}

const taLexicaPrompt = document.querySelector('#lexicaPrompt')
function setLexicaPromptValue(input) {
    taLexicaPrompt.value = input
}
function getLexicaPromptValue() {
    return taLexicaPrompt.value
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

document
    .getElementById('btnReverseSearchLexica')
    .addEventListener('click', async () => {
        //*) check if selection is valid
        //*) get base64 from selection
        //*) request global url from base64
        //*) request Lexica search

        try {
            const width = html_manip.getWidth()
            const height = html_manip.getHeight()
            const selectionInfo = await psapi.getSelectionInfoExe()

            const base64 =
                await io.IO.getSelectionFromCanvasAsBase64Interface_New(
                    width,
                    height,
                    selectionInfo,
                    true
                )
            const hosted_url = await requestHostedUrl(base64)

            const result_json = await requestLexica(hosted_url)

            const lexica_items = result_json.images

            displayAllLexicaImages(lexica_items)
        } catch (e) {
            console.warn(e)
        }
    })

const windowEventListener = document
    .querySelector('body > div')
    .addEventListener('scroll', () => {
        const originalPosition = taLexicaPrompt.offsetTop
        const currentPosition = document.querySelector('body > div').scrollTop
        taLexicaPrompt.style.position = 'static'
        // const isScrolledPast = currentPosition > originalPosition

        // if (isScrolledPast) {
        //     taLexicaPrompt.style.position = 'fixed'
        // } else {
        //     taLexicaPrompt.style.position = 'static'
        // }
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
