const settings_tab = require('./settings')
const sdapi = require('../../sdapi_py_re')
const thumbnail = require('../../thumbnail')

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
            const output_dir_relative = './server/python_server/'
            const container = document.getElementById(
                'divHistoryImagesContainer'
            )
            const uniqueDocumentId = await getUniqueDocumentId()
            const [image_paths, metadata_jsons, base64_images] =
                await sdapi.loadHistory(uniqueDocumentId)

            while (container.firstChild) {
                container.removeChild(container.firstChild)
            }

            const length = image_paths.length
            // let i = length -1

            // for (image_path of image_paths) {
            for (let i = length - 1; i >= 0; --i) {
                const img = document.createElement('img')
                // img.src = `${output_dir_relative}/${image_path}`
                const image_src = `data:image/png;base64, ${base64_images[i]}`
                img.src = image_src

                img.dataset.path = `${output_dir_relative}/${image_paths[i]}`
                img.className = 'history-image'
                img.dataset.metadata_json_string = JSON.stringify(
                    metadata_jsons[i]
                )
                console.log(`metadata_jsons[${i}]: `, metadata_jsons[i])

                const img_container = thumbnail.Thumbnail.wrapImgInContainer(
                    img,
                    'viewer-image-container'
                )
                thumbnail.Thumbnail.addSPButtonToContainer(
                    img_container,
                    'svg_sp_btn',
                    'copy metadata to settings',
                    history_tab.getHistoryMetadata,
                    img
                )
                thumbnail.Thumbnail.addSPButtonToContainer(
                    img_container,
                    'svg_sp_btn_datadownload',
                    'place the image on the canvas',
                    moveHistoryImageToLayer,
                    img
                )
                container.appendChild(img_container)
                // i++
            }
        } catch (e) {
            console.warn(`loadHistory warning: ${e}`)
        }
    })

module.exports = {
    getHistoryMetadata,
}
