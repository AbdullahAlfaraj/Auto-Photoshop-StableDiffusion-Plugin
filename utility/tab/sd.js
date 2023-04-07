const general = require('../general')
const thumbnail = require('../../thumbnail')
const html_manip = require('../html_manip')
const api = require('../api')
const psapi = require('../../psapi')
const sdapi = require('../../sdapi_py_re')
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

async function clipInterrogate() {
    try {
        const width = html_manip.getWidth()
        const height = html_manip.getHeight()
        const selectionInfo = await psapi.getSelectionInfoExe()

        const base64 = await io.IO.getSelectionFromCanvasAsBase64Interface_New(
            width,
            height,
            selectionInfo,
            true
        )

        const url = 'http://127.0.0.1:7860/sdapi/v1/interrogate'

        const payload = {
            image: base64,
            model: 'clip',
        }
        const result_json = await api.requestPost(url, payload)
        console.log(result_json)
        return result_json
    } catch (e) {
        console.warn(e)
    }
}

function getHrScaleSliderSDValue() {
    sd_value = html_manip.getSliderSdValue('hrScaleSlider', 1, 100, 1, 4)
    return sd_value
}
function setHrScaleSliderSDValue(sd_value) {
    const slider_id = 'hrScaleSlider'
    const label_id = 'hrScaleLabel'
    html_manip.setSliderSdValue(slider_id, label_id, sd_value, 1, 100, 1, 4)
}

function updateHrScaleFromToLabel() {
    //get width and height
    //get hr scale by
    //find the hr scale and height

    const hr_scale = getHrScaleSliderSDValue()
    const [width, height] = [html_manip.getWidth(), html_manip.getHeight()]
    const [hr_width, hr_height] = [
        parseInt(width * hr_scale),
        parseInt(height * hr_scale),
    ]
    document.getElementById(
        'lHrScaleFromTo'
    ).textContent = `${width}x${height} -> ${hr_width}x${hr_height}`
}
function getLoraModelPrompt(lora_model_name) {
    return `<lora:${lora_model_name}:1>`
}
async function populateLoraModelMenu() {
    const lora_models_json = await sdapi.requestLoraModels()
    const lora_models_names = Object.keys(lora_models_json)
    html_manip.populateMenu(
        'mLoraModelMenu',
        'mLoraModelItemClass',
        lora_models_names,
        (item, item_html_element) => {
            item_html_element.innerHTML = item
            item_html_element.onclick = () => {
                const lora_prompt = getLoraModelPrompt(item)
                const prompt = html_manip.getPrompt()
                html_manip.autoFillInPrompt(`${prompt} ${lora_prompt}`)
            }
        }
    )
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
    populateLoraModelMenu() // no need for await
}

document.getElementById('hrScaleSlider').addEventListener('input', (evt) => {
    const sd_value = getHrScaleSliderSDValue()
    setHrScaleSliderSDValue(sd_value.toFixed(2))
    updateHrScaleFromToLabel()
})
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

document
    .getElementById('btnInterrogate')
    .addEventListener('click', async () => {
        // start sudo timer after 1 seconds delay
        setTimeout(() => {
            g_generation_session.sudo_timer_id =
                general.sudoTimer('Interrogate')
        }, 1000)
        const interrogate_result = await clipInterrogate()

        if (interrogate_result.caption) {
            html_manip.autoFillInPrompt(interrogate_result.caption)
        }

        // after the clipInterrogate finish stop the timer

        html_manip.updateProgressBarsHtml(0, 'No work in progress')
        g_generation_session.sudo_timer_id = clearInterval(
            g_generation_session.sudo_timer_id
        )
    })

function initSDTab() {
    initInitMaskElement()
}

initSDTab()
module.exports = {
    updateClickEventHandler,
    viewMaskExpansion,
    viewDrawnMask,
    clipInterrogate,
    getHrScaleSliderSDValue,
    getLoraModelPrompt,
    populateLoraModelMenu,
}
