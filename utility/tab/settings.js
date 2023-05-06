const io = require('../io')

function getUseSharpMask() {
    const isChecked = document.getElementById('chUseSharpMask').checked
    return isChecked
}
function setUseSharpMask() {
    console.warn('setUseSharpMask is not setup')
}

function getUseLiveProgressImage() {
    const b_live_update = document.getElementById('chLiveProgressImage').checked
    return b_live_update
}
function setUseLiveProgressImage(b_live_update) {
    document.getElementById('chLiveProgressImage').checked = b_live_update
}

function getExtensionType() {
    return [...document.getElementsByClassName('rbExtensionType')].filter(
        (e) => e.checked == true
    )[0].value
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
        use_sharp_mask: getUseSharpMask(),
        extension_type: getExtensionType(),
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

document.getElementById('chUseSharpMask').addEventListener('change', (ev) => {
    const isChecked = ev.target.checked
    if (isChecked) {
        document.getElementById('slMaskBlur').setAttribute('disabled')
    } else {
        document.getElementById('slMaskBlur').removeAttribute('disabled')
    }
})

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

document
    .getElementById('btnSaveSettingsTabs')
    .addEventListener('click', async () => {
        await saveSettings()
    })

module.exports = {
    getUseSharpMask,
    setUseSharpMask,
    getExtensionType,
    getSdUrlHtml,
    setSdUrlHtml,
    changeSdUrl,
    loadSettings,
    saveSettings,
    getUseLiveProgressImage,
    setUseLiveProgressImage,
    getUseOriginalPrompt,
}
