const settings_tab = require('./utility/tab/settings')

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

module.exports = {
    getHistoryMetadata,
}
