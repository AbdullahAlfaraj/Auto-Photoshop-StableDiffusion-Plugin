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

document.getElementById('btnSdUrl').addEventListener('click', async () => {
    //change the sdUrl in server in proxy server
    // console.log('you clicked btnSdUrl')
    let new_sd_url = document.getElementById('tiSdUrl').value
    changeSdUrl(new_sd_url)
})

function getSdUrlHtml() {
    let sd_url = document.getElementById('tiSdUrl').value
    return sd_url
}
function setSdUrlHtml(sd_url) {
    document.getElementById('tiSdUrl').value = sd_url
}
async function changeSdUrl(sd_url) {
    sd_url = sd_url.trim()
    console.log('sd_url.trim(): ', sd_url)

    if (sd_url.length > 0) {
        //check if the last character of the url has "/" or '\' and remove it

        last_index = sd_url.length - 1

        if (sd_url[last_index] === '/' || sd_url[last_index] === '\\') {
            sd_url = sd_url.slice(0, -1)
        }

        //submit the change
        await sdapi.changeSdUrl(sd_url)
    }
}

async function saveSettings() {
    const settings_tab_settings = {
        use_sharp_mask: settings_tab_ts.store.data.use_sharp_mask,
        extension_type: settings_tab_ts.store.data.extension_type,
        sd_url: getSdUrlHtml(),
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
        setSdUrlHtml(settings_tab_settings['sd_url'])
        await changeSdUrl(settings_tab_settings['sd_url'])
    } catch (e) {
        console.warn(e)
    }
}

function getUseOriginalPrompt() {
    const b_use_original_prompt = document.getElementById(
        'chUseOriginalPrompt'
    ).checked
    return b_use_original_prompt
}

document
    .getElementById('btnSaveSettingsTabs')
    .addEventListener('click', async () => {
        await saveSettings()
    })

module.exports = {
    setUseSharpMask,

    getSdUrlHtml,
    setSdUrlHtml,
    changeSdUrl,
    loadSettings,
    saveSettings,

    getUseOriginalPrompt,
}
