const sdapi = require('../../sdapi_py_re')
const { image_search } = require('../../typescripts/dist/bundle')

const storage = require('uxp').storage
const fs = storage.localFileSystem

//REFACTOR: move to events.js
document
    .getElementById('btnImageSearch')
    .addEventListener('click', async function () {
        try {
            const keywords = document.getElementById('imageSearchField').value
            const image_search_objs = await sdapi.imageSearch(keywords)

            const thumbnails = image_search_objs.map((obj) => obj.thumbnail)
            const src_list = image_search_objs.map((obj) => obj.image)
            image_search.store.updateProperty('thumbnails', thumbnails)
            image_search.store.updateProperty('images', src_list)
        } catch (e) {
            console.warn(`imageSearch warning: ${e}`)
        }
    })
