const io = require('../io')

function setUseSharpMask() {
    console.warn('setUseSharpMask is not setup')
}

document.getElementById('btnGetDocPath').addEventListener('click', async () => {
    const docPath = await io.IOFolder.getDocumentFolderNativePath()
    document.getElementById('tiDocPath').value = docPath

    const uuid = await getUniqueDocumentId()
    doc_entry = await io.IOFolder.getDocFolder(uuid)
    await shell.openPath(doc_entry.nativePath)
})


async function saveSettings(sd_url) {
    const settings_tab_settings = {
        use_sharp_mask: settings_tab_ts.store.data.use_sharp_mask,
        extension_type: settings_tab_ts.store.data.extension_type,
        sd_url: sd_url || getSdUrlHtml(),
    }

    const folder = await io.IOFolder.getSettingsFolder()
    await io.IOJson.saveJsonToFile(
        settings_tab_settings,
        folder,
        'settings_tab.json'
    )
}
async function loadSettings() {
    try {
        const folder = await io.IOFolder.getSettingsFolder()
        let settings_tab_settings = await io.IOJson.loadJsonFromFile(
            folder,
            'settings_tab.json'
        )
        return settings_tab_settings
    } catch (e) {
        console.warn(e)
    }
}

document.getElementById('chUseSmartObject').addEventListener('change', (ev) => {
    const isChecked = ev.target.checked
    if (isChecked) {
        g_b_use_smart_object = true
    } else {
        g_b_use_smart_object = false
    }
})

function getUseOriginalPrompt() {
    const b_use_original_prompt = document.getElementById(
        'chUseOriginalPrompt'
    ).checked
    return b_use_original_prompt
}

module.exports = {
    setUseSharpMask,

    loadSettings,
    saveSettings,

    getUseOriginalPrompt,
}
