const general = require('../general')
const thumbnail = require('../../thumbnail')
const html_manip = require('../html_manip')
//REFACTOR: move to notification.js
async function promptForUpdate(header_message, long_message) {
    const shell = require('uxp').shell

    ;(async () => {
        const buttons = ['Cancel', 'OK']
        const r1 = await dialog_box.prompt(
            header_message,
            long_message,
            buttons
            // 'Please Update you Plugin. it will take about 10 seconds to update',
            // 'update from discord, update from github'[
            // ['Cancel', 'Discord', 'Github']
            // ('Cancel', 'OK')
            // ]
        )
        try {
            let url
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
            } else if (r1 === 'Github') {
                url =
                    'https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin'
                // await py_re.openUrlRequest(url)
            } else if (r1 === 'Discord') {
                console.log('Discord')
                // url = 'https://discord.gg/3mVEtrddXJ'
                // url = 'https://discord.gg/YkUJXYWK3c'
                // await py_re.openUrlRequest(url)
            } else if (r1 === 'Ok') {
            }
            // console.log('url: ', url)
        } catch (e) {
            console.warn(e, url)
        }
    })()
}

async function updateClickEventHandler(current_version) {
    try {
        const online_data = await general.requestOnlineData()
        const b_need_update = general.compareVersions(
            current_version,
            online_data.new_version
        )

        let header_message = "You're Plugin is up to date."
        let long_message = ''
        if (b_need_update) {
            header_message = `New Version is Available (${online_data.new_version})`
            long_message = online_data.update_message
        }

        await promptForUpdate(header_message, long_message)
    } catch (e) {
        console.warn(e)
    }
}

function viewMaskExpansion() {
    if (g_generation_session.base64maskExpansionImage) {
        const mask_src = general.base64ToBase64Url(
            g_generation_session.base64maskExpansionImage
        )
        html_manip.setInitImageMaskSrc(mask_src)
    } else {
        console.log(
            'the mask has not been expanded, g_generation_session.base64maskExpansionImage is empty'
        )
    }
}
function viewDrawnMask() {
    //this is the generated mask or user drawn mask, but it's not the mask after expansion
    if (g_generation_session.activeBase64MaskImage) {
        const mask_src = general.base64ToBase64Url(
            g_generation_session.activeBase64MaskImage
        )
        html_manip.setInitImageMaskSrc(mask_src)
    } else {
        console.log('no mask is available')
    }
}

function initInitMaskElement() {
    //make init mask image use the thumbnail class with buttons
    const mask_image_html = html_manip.getInitImageMaskElement()
    const mask_parent_element = mask_image_html.parentElement

    this.thumbnail_container = thumbnail.Thumbnail.wrapImgInContainer(
        mask_image_html,
        'viewer-image-container'
    )
    mask_parent_element.appendChild(thumbnail_container)
    thumbnail.Thumbnail.addSPButtonToContainer(
        this.thumbnail_container,
        'svg_sp_btn',
        'view original mask',

        viewDrawnMask,
        null
    )
    thumbnail.Thumbnail.addSPButtonToContainer(
        this.thumbnail_container,
        'svg_sp_btn',
        'view modified mask',

        viewMaskExpansion,
        null
    )
}
document.getElementById('btnUpdate').addEventListener('click', async () => {
    await updateClickEventHandler(g_version)
})

document
    .getElementById('slMaskExpansion')
    .addEventListener('change', async (evt) => {
        document.getElementById('slMaskExpansion')
        const original_mask = g_generation_session.activeBase64MaskImage
        if (original_mask) {
            //only if mask is available
            // use blurry and expanded mask
            const iterations = evt.target.value
            const modified_mask = await py_re.maskExpansionRequest(
                original_mask,
                iterations
            )
            if (modified_mask) {
                g_generation_session.base64maskExpansionImage = modified_mask
                viewMaskExpansion()
            }
        }
    })

function initSDTab() {
    initInitMaskElement()
}

initSDTab()
module.exports = { updateClickEventHandler, viewMaskExpansion, viewDrawnMask }
