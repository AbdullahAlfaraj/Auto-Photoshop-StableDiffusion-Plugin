////// Start Prompt//////////

function getPrompt() {
    const prompt = document.getElementById('taPrompt').value
    return prompt
}

function autoFillInPrompt(prompt_value) {
    document.getElementById('taPrompt').value = prompt_value
}

////// End Prompt//////////

////// Start Negative Prompt//////////

function getNegativePrompt() {
    const negative_prompt = document.getElementById('taNegativePrompt').value
    return negative_prompt
}

function autoFillInNegativePrompt(negative_prompt_value) {
    document.getElementById('taNegativePrompt').value = negative_prompt_value
}

////// End Negative Prompt//////////

////// Start Width//////////

document.getElementById('slWidth').addEventListener('input', (evt) => {
    const width = evt.target.value * 64

    document.getElementById('lWidth').textContent = parseInt(width)
    // widthSliderOnChangeEventHandler(evt)
    updateResDifferenceLabel()
})

document.getElementById('slHeight').addEventListener('input', (evt) => {
    const height = evt.target.value * 64

    document.getElementById('lHeight').textContent = parseInt(height)
    // heightSliderOnChangeEventHandler(evt)
    updateResDifferenceLabel()
})

function widthSliderOnChangeEventHandler(evt) {
    let new_width = evt.target.value * 64
    const b_link = getLinkWidthHeightState()
    let final_width = new_width
    let final_height
    if (b_link) {
        const current_height = html_manip.getHeight()
        ;[final_width, final_height] = general.scaleToRatio(
            new_width,
            g_old_slider_width,
            _,
            current_height,
            parseInt(evt.target.max * 64),
            parseInt(evt.target.min * 64)
        )

        evt.target.value = parseInt(final_width / 64)
        html_manip.autoFillInHeight(final_height)
    }

    g_old_slider_width = final_width // update the old value, so we can use it later
    document.getElementById('lWidth').textContent = parseInt(final_width)
}
document.getElementById('slWidth').addEventListener('change', (evt) => {
    widthSliderOnChangeEventHandler(evt)
})
// document.getElementById('slWidth').addEventListener('change', (evt) => {
//     let new_width = evt.target.value * 64
//     const b_link = getLinkWidthHeightState()
//     let final_width = new_width
//     let final_height
//     if (b_link) {
//         const current_height = html_manip.getHeight()
//         ;[final_width, final_height] = general.scaleToRatio(
//             new_width,
//             g_old_slider_width,
//             _,
//             current_height,
//             parseInt(evt.target.max * 64),
//             parseInt(evt.target.min * 64)
//         )

//         evt.target.value = parseInt(final_width / 64)
//         html_manip.autoFillInHeight(final_height)
//     }

//     g_old_slider_width = final_width // update the old value, so we can use it later
//     document.getElementById('lWidth').textContent = parseInt(final_width)
// })

function heightSliderOnChangeEventHandler(evt) {
    let new_height = evt.target.value * 64

    let final_width
    let final_height = new_height
    const b_link = getLinkWidthHeightState()
    if (b_link) {
        const current_width = html_manip.getWidth()
        ;[final_height, final_width] = general.scaleToRatio(
            new_height,
            g_old_slider_height,
            _,
            current_width,
            parseInt(evt.target.max * 64),
            parseInt(evt.target.min * 64)
        )

        evt.target.value = parseInt(final_height / 64)
        html_manip.autoFillInWidth(final_width)
    }
    g_old_slider_height = final_height // update the old value, so we can use it later
    document.getElementById('lHeight').textContent = parseInt(final_height)
}
document.getElementById('slHeight').addEventListener('change', (evt) => {
    heightSliderOnChangeEventHandler(evt)
})

function getWidth() {
    slider_width = document.getElementById('slWidth').value
    const width = slider_width * 64
    return width
}

function getHrWidth() {
    slider_width = document.getElementById('hrWidth').value
    const width = slider_width * 64
    return width
}

function getHrHeight() {
    slider_width = document.getElementById('hrHeight').value
    const width = slider_width * 64
    return width
}
function autoFillInWidth(width_value) {
    const width_slider = document.getElementById('slHeight')

    // g_old_slider_width = width_slider.value * 64 //store the old value
    g_old_slider_width = width_value

    document.getElementById('slWidth').value = `${width_value / 64}`
    //update the label
    document.getElementById('lWidth').innerHTML = `${parseInt(width_value)}`
    updateResDifferenceLabel()
}
////// End Width//////////

////// Start Height//////////

function getHeight() {
    slider_value = document.getElementById('slHeight').value
    const height = slider_value * 64
    return height
}

function autoFillInHeight(height_value) {
    const height_slider = document.getElementById('slHeight')
    // g_old_slider_height = height_slider.value * 64
    g_old_slider_height = height_value //store the current value as old value. counterintuitive!. only use old value when the user directly manipulate the slider

    height_slider.value = `${height_value / 64}`
    //update the label
    document.getElementById('lHeight').innerHTML = `${parseInt(height_value)}`
    updateResDifferenceLabel()
}

function autoFillInHRHeight(height_value) {
    document.getElementById('hrHeight').value = `${height_value / 64}`
    //update the label
    document.getElementById('hHeight').innerHTML = `${height_value}`
}

function autoFillInHRWidth(height_value) {
    document.getElementById('hrWidth').value = `${height_value / 64}`
    //update the label
    document.getElementById('hWidth').innerHTML = `${height_value}`
}

////// End Height//////////

////// Start Denoising Strength//////////
document
    .querySelector('#slDenoisingStrength')
    .addEventListener('input', (evt) => {
        const label_value = evt.target.value / 100
        // console.log("label_value: ", label_value)
        document.getElementById(
            'lDenoisingStrength'
        ).innerHTML = `${label_value}`
    })

//get the value that is relevant to stable diffusion
function getDenoisingStrength() {
    const slider_value = document.getElementById('slDenoisingStrength').value
    const denoising_strength_value = slider_value / 100.0
    return denoising_strength_value
}

// display the value the user need to see in all elements related to denoising strength attribute
function autoFillInDenoisingStrength(denoising_strength_value) {
    //sd denoising strength value range from [0,1] slider range from [0, 100]
    //update the slider
    document.getElementById('slDenoisingStrength').value = `${
        denoising_strength_value * 100
    }`
    //update the label
    document.getElementById(
        'lDenoisingStrength'
    ).innerHTML = `${denoising_strength_value}`
}

////// End Denoising Strength//////////

////// Start Hi Res Fix//////////

document.getElementById('chInpaintFullRes').addEventListener('click', (ev) => {
    const inpaint_padding_slider = document.getElementById('slInpaintPadding')

    if (ev.target.checked) {
        inpaint_padding_slider.style.display = 'block'
    } else {
        inpaint_padding_slider.style.display = 'none'
    }
})
document.getElementById('chHiResFixs').addEventListener('click', (ev) => {
    const container = document.getElementById('hi-res-sliders-container')

    if (ev.target.checked) {
        container.style.display = 'flex'
    } else {
        container.style.display = 'none'
    }
})
//get the value that is relevant to stable diffusion
function getHiResFixs() {
    const isChecked = document.getElementById('chHiResFixs').checked
    return isChecked
}

function setHiResFixs(isChecked) {
    document.getElementById('chHiResFixs').checked = isChecked
}

function sliderAddEventListener(
    slider_id,
    label_id,
    multiplier,
    fractionDigits = 2
) {
    document.getElementById(slider_id).addEventListener('input', (evt) => {
        const sd_value = evt.target.value * multiplier // convert slider value to SD ready value
        document.getElementById(label_id).textContent =
            Number(sd_value).toFixed(fractionDigits)
    })
}

//get the stable diffusion ready value from the slider with  "slider_id"
//REFACTOR: delete, getSliderSdValue_Old is deprecated, instead use getSliderSdValue
function getSliderSdValue_Old(slider_id, multiplier) {
    // console.warn(
    //     'getSliderSdValue_Old is deprecated, instead use getSliderSdValue'
    // )
    const slider_value = document.getElementById(slider_id).value
    const sd_value = slider_value * multiplier
    return sd_value
}
//REFACTOR: delete, autoFillInSliderUi is deprecated, instead use setSliderSdValue
function autoFillInSliderUi(sd_value, slider_id, label_id, multiplier) {
    // console.warn(
    //     'autoFillInSliderUi is deprecated, instead use setSliderSdValue'
    // )
    //update the slider
    document.getElementById(slider_id).value = `${sd_value * multiplier}`
    //update the label
    document.getElementById(label_id).innerHTML = `${sd_value}`
}

function getSliderSdValue(
    slider_id,
    slider_start,
    slider_end,
    sd_start,
    sd_end
) {
    const slider_value = document.getElementById(slider_id).value
    // const sd_value = general.mapRange(slider_value, 0, 100, 0, 1) // convert slider value to SD ready value
    const sd_value = general.mapRange(
        slider_value,
        slider_start,
        slider_end,
        sd_start,
        sd_end
    ) // convert slider value to SD ready value

    return sd_value
}
function setSliderSdValue(
    slider_id,
    label_id,
    sd_value,
    slider_start,
    slider_end,
    sd_start,
    sd_end
) {
    const slider_value = general.mapRange(
        sd_value,
        sd_start,
        sd_end,
        slider_start,
        slider_end
    ) // convert slider value to SD ready value
    document.getElementById(slider_id).value = slider_value.toString()
    document.getElementById(label_id).innerHTML = sd_value.toString()
}

//hrWidth is from [1 to 32] * 64 => [64 to 2048]
sliderAddEventListener('hrWidth', 'hWidth', 64)
sliderAddEventListener('hrHeight', 'hHeight', 64)

//convert hrDenoisingStrength  from  [1, 100] * 0.01 => [0.01 to 1]
sliderAddEventListener('hrDenoisingStrength', 'hDenoisingStrength', 0.01)

function autoFillInHiResFixs(firstphase_width, firstphase_height) {
    //update the firstphase width slider and label
    autoFillInSliderUi(firstphase_width, 'hrWidth', 'hWidth', 1.0 / 64)
    //update the firstphase height slider and label
    autoFillInSliderUi(firstphase_height, 'hrHeight', 'hHeight', 1.0 / 64)
}
////// End Hi Res Fix//////////

////// Start Inpaint Mask Weight//////////
function autoFillInInpaintMaskWeight(sd_value) {
    //update the inpaint mask weight
    autoFillInSliderUi(
        sd_value,
        'slInpaintingMaskWeight',
        'lInpaintingMaskWeight',
        100
    )
}
////// End Inpaint Mask Weight//////////

////// Start Samplers//////////
function unCheckAllSamplers() {
    document
        .getElementsByClassName('rbSampler')

        .forEach((e) => e.removeAttribute('checked'))
}

function getSelectedRadioButtonElement(rbClass) {
    try {
        const rb_element = [...document.getElementsByClassName(rbClass)].filter(
            (e) => e.checked == true
        )[0]
        return rb_element
    } catch (e) {
        console.warn(e)
    }
}
function getSamplerElementByName(sampler_name) {
    try {
        //assume the sampler_name is valid
        //return the first
        //convert htmlCollection into an array, then user filter to get the radio button with the value equals to sampler_name
        const sampler_element = [
            ...document.getElementsByClassName('rbSampler'),
        ].filter((e) => e.value == sampler_name)[0]
        return sampler_element
    } catch (e) {
        console.warn(`Sampler '${sampler_name}' not found ${e}`)
    }
}

function getCheckedSamplerName() {
    //we assume that the samplers exist and loaded in html
    //return the name of the first checked sampler
    try {
        return [...document.getElementsByClassName('rbSampler')].filter(
            (elm) => elm.checked == true
        )[0].value
    } catch (e) {
        console.warn(e)
    }
}
function getMode() {
    return [...document.getElementsByClassName('rbMode')].filter(
        (e) => e.checked == true
    )[0].value
}

function getBackendType() {
    return [...document.getElementsByClassName('rbBackendType')].filter(
        (e) => e.checked == true
    )[0].value
}

function getHordeApiKey() {
    let key = document.getElementById('tiHordeApiKey').value
    const valid_key = key ? key : '0000000000'
    return valid_key
}

function setHordeApiKey(key) {
    document.getElementById('tiHordeApiKey').value = key
}
function checkSampler(sampler_name) {
    sampler_element = getSamplerElementByName(sampler_name)
    sampler_element.checked = true
}
function autoFillInSampler(sampler_name) {
    // unCheckAllSamplers()
    checkSampler(sampler_name)
}
////// End Samplers//////////

////// Start Models//////////

function getModelElementByHash(model_hash) {
    try {
        //assume the model_hash is valid
        //return the first model menu item element with model_hash
        const model_element = [
            ...document.getElementsByClassName('mModelMenuItem'),
        ].filter((e) => e.dataset.model_hash == model_hash)[0]
        return model_element
    } catch (e) {
        console.warn(`Model '${model_hash}' not found ${e}`)
    }
}
function getModelHashByTitle(model_title) {
    //return find the model hash by it's title
    try {
        return [...document.getElementsByClassName('mModelMenuItem')].filter(
            (e) => e.dataset.model_title == model_title
        )[0].dataset.model_hash
    } catch (e) {
        console.warn(e)
    }
}

function getSelectedModelHash() {
    //return the hash of the first selected model menu item
    try {
        return [...document.getElementsByClassName('mModelMenuItem')].filter(
            (e) => e.selected == true
        )[0].dataset.model_hash
    } catch (e) {
        console.warn(e)
    }
}

function selectModelUi(model_hash) {
    model_element = getModelElementByHash(model_hash)
    model_element.selected = true
}

function autoFillInModel(model_hash) {
    try {
        // unCheckAllSamplers()
        model_element = getModelElementByHash(model_hash)
        selectModelUi(model_hash)
        // model_element.
        const model_title = model_element.dataset.model_title
        return model_title
    } catch (e) {
        console.warn(e)
    }
}
////// End Models//////////

////// Start Init Image && Init Image Mask//////////

function getInitImageElement() {
    const ini_image_element = document.getElementById('init_image')
    return ini_image_element
}
function setInitImageSrc(image_src) {
    const ini_image_element = getInitImageElement()
    ini_image_element.src = image_src
}
function setControlImageSrc(image_src, element_index = 0) {
    const control_net_image_element = document.getElementById(
        'control_net_image' + '_' + element_index
    )
    control_net_image_element.src = image_src
}
function setControlMaskSrc(image_src, element_index = 0) {
    const control_net_image_element = document.getElementById(
        'control_net_mask' + '_' + element_index
    )
    control_net_image_element.src = image_src
}

function setProgressImageSrc(image_src) {
    // const progress_image_element = document.getElementById('progressImage')

    const progress_image_element = document.getElementById(
        'divProgressImageViewerContainer'
    )
    // progress_image_element.src = image_src

    progress_image_element.style.backgroundSize = 'contain'
    progress_image_element.style.height = '10000px'

    progress_image_element.style.backgroundImage = `url('${image_src}')`
}

function getInitImageMaskElement() {
    const ini_image_mask_element = document.getElementById('init_image_mask')
    return ini_image_mask_element
}
function setInitImageMaskSrc(image_src) {
    const ini_image_mask_element = getInitImageMaskElement()
    ini_image_mask_element.src = image_src
}
////// End Init Image && Init Image Mask//////////

////// Start Generate Buttons //////////

function getGenerateButtonsElements() {
    generate_buttons = [...document.getElementsByClassName('btnGenerateClass')]
    return generate_buttons
}
function setGenerateButtonsColor(addClassName, removeClassName) {
    const buttons = getGenerateButtonsElements()
    buttons.forEach((button) => {
        button.classList.add(addClassName)
        button.classList.remove(removeClassName)
    })
}

////// End Generate Buttons //////////

////// Start Servers Status //////////

function setAutomaticStatus(newStatusClass, oldStatusClass) {
    document.getElementById('automaticStatus').classList.add(newStatusClass)
    document.getElementById('automaticStatus').classList.remove(oldStatusClass)
}
function setProxyServerStatus(newStatusClass, oldStatusClass) {
    document.getElementById('proxyServerStatus').classList.add(newStatusClass)
    document
        .getElementById('proxyServerStatus')
        .classList.remove(oldStatusClass)
}
////// End Servers Status //////////

////// Start Extras //////////

sliderAddEventListener('slUpscaleSize', 'lUpscaleSize', 0.1, 1)

function getUpscaleSize() {
    slider_width = document.getElementById('slUpscaleSize').value
    const size = slider_width / 10
    return size
}

sliderAddEventListener('slUpscaler2Visibility', 'lUpscaler2Visibility', 0.1, 1)

function getUpscaler2Visibility() {
    slider_width = document.getElementById('slUpscaler2Visibility').value
    const size = slider_width / 10
    return size
}

sliderAddEventListener('slGFPGANVisibility', 'lGFPGANVisibility', 0.1, 1)

function getGFPGANVisibility() {
    slider_width = document.getElementById('slGFPGANVisibility').value
    const size = slider_width / 10
    return size
}

sliderAddEventListener(
    'slCodeFormerVisibility',
    'lCodeFormerVisibility',
    0.1,
    1
)

function getCodeFormerVisibility() {
    slider_width = document.getElementById('slCodeFormerVisibility').value
    const size = slider_width / 10
    return size
}

sliderAddEventListener('slCodeFormerWeight', 'lCodeFormerWeight', 0.1, 1)

function getCodeFormerWeight() {
    slider_width = document.getElementById('slCodeFormerWeight').value
    const size = slider_width / 10
    return size
}

////// End Extras //////////

////// Start Reset Settings Button //////////

const defaultSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: '',
    negative_prompt: '',
    selection_mode: null,
    batch_number: 1,
    steps: 20,
    width: 512,
    height: 512,
    firstphase_width: 512,
    firstphase_height: 512,
    cfg: 7,
    denoising_strength: 0.7,
    hi_res_denoising_strength: 0.7,
    mask_blur: 8,
    inpaint_at_full_res: false,
    hi_res_fix: false,
    inpaint_padding: 0,
    seed: -1,
    samplers: null,
    mask_content: null,
}

const snapshot_btns = Array.from(
    document.getElementsByClassName('snapshotButton')
)
snapshot_btns.forEach((element) =>
    element.addEventListener('click', async () => {
        try {
            await psapi.snapshot_layerExe()
        } catch (e) {
            console.warn(e)
        }
    })
)

const reset_btns = Array.from(document.getElementsByClassName('resetButton'))
reset_btns.forEach((element) =>
    element.addEventListener('click', async () => {
        try {
            autoFillDefaultSettings(defaultSettings)
        } catch (e) {
            console.warn(e)
        }
    })
)

function getBatchNumber() {
    return document.getElementById('tiNumberOfImages').value
}
function autoFillInBatchNumber(batch_number) {
    document.getElementById('tiNumberOfImages').value = String(batch_number)
}

function getSteps() {
    return document.getElementById('tiNumberOfSteps').value
}
function autoFillInSteps(steps) {
    document.getElementById('tiNumberOfSteps').value = String(steps)
}
function autoFillDefaultSettings(default_settings) {
    autoFillSettings(default_settings)
}

function setCFG(cfg_value) {
    document.getElementById('slCfgScale').value = cfg_value
}
function getCFG() {
    return document.getElementById('slCfgScale').value
}

function autoFillSettings(settings) {
    try {
        //reset all UI settings except model selection and sampler selection
        autoFillInPrompt(settings['positive_prompt'])
        autoFillInNegativePrompt(settings['negative_prompt'])
        autoFillInBatchNumber(settings['batch_number'])
        autoFillInSteps(settings['steps'])
        autoFillInWidth(settings['width'])
        autoFillInHeight(settings['height'])
        autoFillInHiResFixs(
            settings['firstphase_width'],
            settings['firstphase_height']
        )
        document.getElementById('slCfgScale').value = settings['cfg']
        autoFillInDenoisingStrength(settings['denoising_strength'])
        autoFillInSliderUi(
            settings['hi_res_denoising_strength'],
            'hrDenoisingStrength',
            'hDenoisingStrength',
            100
        )
        document.getElementById('slMaskBlur').value = settings['mask_blur']
        document.getElementById('chInpaintFullRes').checked =
            settings['inpaint_at_full_res']
        setHiResFixs(settings['hi_res_fix'])
        document.getElementById('tiSeed').value = String(settings['seed'])
    } catch (e) {
        console.warn(e)
    }
}
////// End Reset Settings Button //////////

function getMaskBlur() {
    const isDisabled = document
        .getElementById('slMaskBlur')
        .hasAttribute('disabled')
    let mask_blur = 0
    if (isDisabled) {
        mask_blur = 0
    } else {
        mask_blur = document.getElementById('slMaskBlur').value
    }
    return mask_blur
}
function setMaskBlur(mask_blur) {
    document.getElementById('slMaskBlur').value = mask_blur
}

function getPromptShortcut() {
    //read json string
    //converted into json object
    const prompt_shortcut_string =
        document.getElementById('taPromptShortcut').value
    const prompt_shortcut = JSON.parse(prompt_shortcut_string)
    return prompt_shortcut
}
function setPromptShortcut(prompt_shortcut) {
    //prompt_shortcut is json object
    //convert it into pretty json string and save it in the prompt shortcut textarea
    var JSONInPrettyFormat = JSON.stringify(prompt_shortcut, undefined, 7)
    document.getElementById('taPromptShortcut').value = JSONInPrettyFormat
}

////start selection mode/////
function getSelectionMode() {
    return [...document.getElementsByClassName('rbSelectionMode')].filter(
        (e) => e.checked == true
    )[0].value
}
function getMaskContent() {
    return [...document.getElementsByClassName('rbMaskContent')].filter(
        (e) => e.checked == true
    )[0].value
}
function setMaskContent(value) {
    try {
        //assume the sampler_name is valid
        //return the first
        //convert htmlCollection into an array, then user filter to get the radio button with the value equals to sampler_name
        const mask_content_element = [
            ...document.getElementsByClassName('rbMaskContent'),
        ].filter((e) => e.value == value)[0]
        mask_content_element.checked = true
        return mask_content_element
    } catch (e) {
        console.warn(e)
    }
}

function addHistoryButtonsHtml(img_html) {
    // Create new container element
    const container = document.createElement('div')

    container.className = 'viewer-image-container'

    const elem = document.getElementById('svg_sp_btn')
    // Create a copy of it
    const clone = elem.cloneNode(true)
    const button = clone
    button.style.display = null
    button.removeAttribute('id')

    button.setAttribute('title', 'place the image on the canvas')

    // Create button element
    // const button = document.createElement('sp-button');
    button.className = 'viewer-image-button'
    // button.innerHTML = "Button";

    button.addEventListener('click', async () => {
        //set init image event listener, use when settion is active
        let image_path = img_html.dataset.path
        const image_path_escape = image_path.replace(/\o/g, '/o') //escape string "\o" in "\output"

        // load the image from "data:image/png;base64," base64_str
        const base64_image = img_html.src.replace('data:image/png;base64,', '')
        await base64ToFile(base64_image)
    })

    // Append elements to container
    container.appendChild(img_html)
    container.appendChild(button)

    return container
}
function getSeed() {
    const seed = document.getElementById('tiSeed').value
    return seed
}
function setSeed(new_seed) {
    document.getElementById('tiSeed').value = new_seed
}

function getMaskExpansion() {
    const mask_expansion = document.getElementById('slMaskExpansion').value
    return mask_expansion
}

function setMaskExpansion(mask_expansion) {
    document.getElementById('slMaskExpansion').value = mask_expansion
}

function updateProgressBarsHtml(new_value, progress_text = 'Progress...') {
    document.querySelectorAll('.pProgressBars').forEach((bar_elm) => {
        // id = el.getAttribute("id")
        // console.log("progressbar id:", id)
        try {
            bar_elm.setAttribute('value', new_value)
            document
                .querySelectorAll('.lProgressLabel')
                .forEach((lable_elm) => {
                    lable_elm.innerHTML = progress_text
                    // else el.innerHTML = 'No work in progress'
                })
        } catch (e) {
            console.warn(e) //value is not valid
        }
    })

    // document.querySelector('#pProgressBar').value
}
///end selection mode////
function getLinkWidthHeightState() {
    const state_str = document.getElementById('linkWidthHeight').dataset.b_link // sometime it's true and other time it's "true"
    const b_state = state_str.toString() === 'true' ? true : false
    return b_state
}
function setLinkWidthHeightState(state) {
    document.getElementById('linkWidthHeight').dataset.b_link = state
}
function isSquareThumbnail() {
    return document.getElementById('chSquareThumbnail').checked
}

async function populateMenu(
    html_menu_id,
    menu_item_class,
    items,
    createMenuItemHtml,
    b_keep_old_selection = false
) {
    // function createMenuItemHtml(item, item_html_element) {
    //     // menu_item_element.innerHTML = item.title
    //     // menu_item_element.dataset.model_hash = model.hash
    //     // menu_item_element.dataset.model_title = model.title
    // }

    try {
        document.getElementById(html_menu_id).innerHTML = '' // empty the menu

        for (let item of items) {
            const menu_item_element = document.createElement('sp-menu-item')
            menu_item_element.className = menu_item_class
            createMenuItemHtml(item, menu_item_element)
            document.getElementById(html_menu_id).appendChild(menu_item_element)
        }
    } catch (e) {
        b_result = false
        console.warn(e)
    }
    return b_result
}
function getSelectedMenuItem(menu_id) {
    try {
        const menu_element = document.getElementById(menu_id)
        return menu_element.selectedOptions[0]
    } catch (e) {
        console.warn(e)
    }
}
function selectMenuItem(menu_id, item) {
    try {
        const menu_element = document.getElementById(menu_id)
        const option = Array.from(menu_element.options).filter(
            (element) => element.value === item
        )[0]
        option.selected = true
    } catch (e) {
        unselectMenuItem(menu_id)
        console.warn(e)
    }
}
function getSelectedMenuItemTextContent(menu_id) {
    try {
        const text_content = getSelectedMenuItem(menu_id).textContent
        return text_content
    } catch (e) {
        console.warn(e)
    }
}
function unselectMenuItem(menu_id) {
    try {
        document.getElementById(menu_id).selectedIndex = null
    } catch (e) {
        console.warn(e)
    }
}

function getUseNsfw() {
    //this method is shared between horde native and horde script
    const b_nsfw = document.getElementById('chUseNSFW').checked
    return b_nsfw
}
function getUseSilentMode_Old() {
    const b_use_silent_mode = document.getElementById('chUseSilentMode').checked
    return b_use_silent_mode
}
function getUseSilentMode() {
    let b_use_silent_mode = true //fast machine
    const pc_speed = getSelectedRadioButtonElement('rbPCSpeed').value
    if (pc_speed === 'slow') {
        b_use_silent_mode = false // use noisy mode
    } else if (pc_speed === 'fast') {
        b_use_silent_mode = true // use silent mode
    }
    // const b_use_silent_mode = document.getElementById('chUseSilentMode').checked
    return b_use_silent_mode
}

module.exports = {
    getPrompt,
    autoFillInPrompt,
    getNegativePrompt,
    autoFillInNegativePrompt,
    getDenoisingStrength,
    autoFillInDenoisingStrength,
    getWidth,
    autoFillInWidth,
    getHeight,
    autoFillInHeight,
    getSliderSdValue,
    setSliderSdValue,
    autoFillInHiResFixs,
    getHiResFixs,
    setHiResFixs,
    autoFillInSliderUi,
    getCheckedSamplerName,
    autoFillInSampler,
    autoFillInModel,
    getMode,
    setInitImageSrc,
    setInitImageMaskSrc,
    setGenerateButtonsColor,
    setAutomaticStatus,
    setProxyServerStatus,
    defaultSettings,
    autoFillDefaultSettings,
    autoFillSettings,
    getMaskBlur,
    setMaskBlur,

    autoFillInHRHeight,
    autoFillInHRWidth,
    getPromptShortcut,
    setPromptShortcut,
    getModelHashByTitle,
    getSelectionMode,
    autoFillInInpaintMaskWeight,
    autoFillInSteps,
    getSteps,
    getBatchNumber,
    autoFillInBatchNumber,
    getHrWidth,
    getHrHeight,
    setCFG,
    getCFG,
    getMaskContent,
    setMaskContent,
    addHistoryButtonsHtml,

    getSeed,
    setSeed,
    getMaskExpansion,
    setMaskExpansion,
    getUpscaleSize,
    getUpscaler2Visibility,
    getCodeFormerVisibility,
    getGFPGANVisibility,
    getCodeFormerWeight,
    updateProgressBarsHtml,
    getBackendType,
    getHordeApiKey,
    setProgressImageSrc,
    getLinkWidthHeightState,
    setLinkWidthHeightState,
    isSquareThumbnail,
    setControlImageSrc,
    setControlMaskSrc,

    setHordeApiKey,
    populateMenu,
    getSelectedMenuItem,
    getSelectedMenuItemTextContent,
    getUseNsfw,
    getUseSilentMode,
    unselectMenuItem,
    selectMenuItem,
    getSliderSdValue_Old,
    getSelectedRadioButtonElement,
    getInitImageMaskElement,
}
