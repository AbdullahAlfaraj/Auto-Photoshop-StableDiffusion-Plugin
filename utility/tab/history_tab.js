const settings_tab = require('./settings')
const sdapi = require('../../sdapi_py_re')
const thumbnail = require('../../thumbnail')
const { history } = require('../../typescripts/dist/bundle')
//REFACTORED: moved to history_tab.js
function getHistoryMetadata(img) {
    //auto fill the ui with metadata
    const metadata_json = JSON.parse(img.dataset.metadata_json_string)
    console.log('metadata_json: ', metadata_json)
    // document.querySelector('#tiSeed').value = metadata_json.Seed

    //extract auto_metadata into the preset metadata
    function convertAutoMetadataToPresset(metadata_json) {
        metadata_json['seed'] = metadata_json?.auto_metadata?.Seed
    }
    convertAutoMetadataToPresset(metadata_json)

    const b_use_original_prompt = settings_tab.getUseOriginalPrompt()
    if (b_use_original_prompt) {
        metadata_json['prompt'] = metadata_json?.original_prompt
            ? metadata_json['original_prompt']
            : metadata_json['prompt']

        metadata_json['negative_prompt'] =
            metadata_json?.original_negative_prompt
                ? metadata_json['original_negative_prompt']
                : metadata_json['negative_prompt']
    }
    document.querySelector('#historySeedLabel').textContent =
        metadata_json?.seed

    g_ui_settings_object.autoFillInSettings(metadata_json)
}

document
    .getElementById('btnLoadHistory')
    .addEventListener('click', async function () {
        try {
            const uniqueDocumentId = await getUniqueDocumentId()
            const [image_paths, metadata_jsons, base64_images] =
                await sdapi.loadHistory(uniqueDocumentId)

            history.store.updateProperty('images', base64_images)
            history.store.updateProperty('thumbnails', base64_images)
            history.store.updateProperty('metadata_jsons', metadata_jsons)
        } catch (e) {
            console.warn(`loadHistory warning: ${e}`)
        }
    })
document
    .getElementById('btnClearHistoryCache')
    .addEventListener('click', () => {
        history.store.updateProperty('images', [])
        history.store.updateProperty('thumbnails', [])
        history.store.updateProperty('metadata_jsons', [])
    })
module.exports = {
    getHistoryMetadata,
}
