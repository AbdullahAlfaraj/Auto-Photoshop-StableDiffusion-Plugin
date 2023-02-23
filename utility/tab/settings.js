const io = require('../io')

function getUseSharpMask() {
    const isChecked = document.getElementById('chUseSharpMask').checked
    return isChecked
}
function setUseSharpMask() {
    console.warn('setUseSharpMask is not setup')
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

function getExtensionType() {
    return [...document.getElementsByClassName('rbExtensionType')].filter(
        (e) => e.checked == true
    )[0].value
}

document.getElementById('btnGetDocPath').addEventListener('click', async () => {
    const docPath = await io.IOFolder.getDocumentFolderNativePath()
    document.getElementById('tiDocPath').value = docPath
})
module.exports = { getUseSharpMask, setUseSharpMask, getExtensionType }
