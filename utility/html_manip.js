////// Start Prompt//////////

function autoFillInPrompt(prompt_value) {
    // document.getElementById('taPrompt').value = prompt_value
    multiPrompts.setPrompt({ positive: prompt_value })
}

////// End Prompt//////////

////// Start Negative Prompt//////////

function autoFillInNegativePrompt(negative_prompt_value) {
    // document.getElementById('taNegativePrompt').value = negative_prompt_value
    multiPrompts.setPrompt({ negative: negative_prompt_value })
}

////// End Negative Prompt//////////

////// Start Width//////////

function getWidth() {
    return sd_tab_store.data.width
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
async function autoFillInWidth(width_value) {
    sd_tab_store.data.width = width_value
    sd_tab_util.helper_store.data.previous_width = width_value

    sd_tab_store.data.ratio =
        await selection.Selection.getImageToSelectionDifference()
}
////// End Width//////////

////// Start Height//////////

function getHeight() {
    // slider_value = document.getElementById('slHeight').value
    // const height = slider_value * 64
    return sd_tab_store.data.height
}

async function autoFillInHeight(height_value) {
    sd_tab_util.helper_store.data.previous_height = height_value
    sd_tab_store.data.height = height_value
    //update the label
    sd_tab_store.data.ratio =
        await selection.Selection.getImageToSelectionDifference()
}

function autoFillInHRHeight(height_value) {
    sd_tab_store.data.hr_resize_y = height_value
}

function autoFillInHRWidth(width_value) {
    sd_tab_store.data.hr_resize_x = width_value
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
function getSliderSdValueByElement(
    slider_element,
    slider_start,
    slider_end,
    sd_start,
    sd_end
) {
    const slider_value = slider_element.value
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
function setSliderSdValueByElements(
    slider_element,
    label_element,
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
    slider_element.value = slider_value.toString()
    label_element.innerHTML = sd_value.toString()
}

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
    const control_net_image_element = document.querySelector(
        `#controlnet_settings_${element_index} .control_net_image_`
    )
    // const control_net_image_element = document.getElementById(
    //     'control_net_image' + '_' + element_index
    // )
    control_net_image_element.src = image_src
}

function setProgressImageSrc(image_src) {
    // const progress_image_element = document.getElementById('progressImage')

    const progress_image_element = document.getElementById(
        'divProgressImageViewerContainer'
    )
    // progress_image_element.src = image_src

    progress_image_element.style.backgroundSize = 'contain'
    progress_image_element.style.height = '500px'

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

////// Start Reset Settings Button //////////

function getBatchNumber() {
    // return document.getElementById('tiNumberOfImages').value
    return document.getElementById('tiNumberOfBatchSize').value
}
function autoFillInBatchNumber(batch_number) {
    // document.getElementById('tiNumberOfImages').value = String(batch_number)
    document.getElementById('tiNumberOfBatchSize').value = String(batch_number)
}

function setCFG(cfg_value) {
    sd_tab_store.data.cfg = cfg_value
}
function getCFG() {
    return sd_tab_store.data.cfg
}

function autoFillSettings(settings) {
    try {
        //reset all UI settings except model selection and sampler selection

        multiPrompts.setPrompt({ positive: settings['positive_prompt'] })
        multiPrompts.setPrompt({ negative: settings['negative_prompt'] })
        autoFillInBatchNumber(settings['batch_number'])
        sd_tab_store.data.steps = settings['steps']
        autoFillInWidth(settings['width'])
        autoFillInHeight(settings['height'])
        autoFillInHiResFixs(
            settings['firstphase_width'],
            settings['firstphase_height']
        )
        sd_tab_store.data.cfg = settings['cfg']
        sd_tab_store.data.denoising_strength = settings['denoising_strength']
        autoFillInSliderUi(
            settings['hi_res_denoising_strength'],
            'hrDenoisingStrength',
            'hDenoisingStrength',
            100
        )
        sd_tab_store.data.mask_blur = settings['mask_blur']
        sd_tab_store.data.inpaint_full_res = settings['inpaint_at_full_res']
        sd_tab_store.data.enable_hr = settings['hi_res_fix']
        sd_tab_store.data.seed = String(settings['seed'])
    } catch (e) {
        console.warn(e)
    }
}
////// End Reset Settings Button //////////

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

function isSquareThumbnail() {
    return document.getElementById('chSquareThumbnail').checked
}

async function populateMenu(
    html_menu_id,
    menu_item_class,
    items,
    createMenuItemHtml,
    b_keep_old_selection = false,
    label = ''
) {
    // function createMenuItemHtml(item, item_html_element) {
    //     // menu_item_element.innerHTML = item.title
    //     // menu_item_element.dataset.model_hash = model.hash
    //     // menu_item_element.dataset.model_title = model.title
    // }

    try {
        const html_menu_element = document.getElementById(html_menu_id)
        html_menu_element.innerHTML = '' // empty the menu
        if (label) {
            const label_item = document.createElement('sp-menu-item')
            label_item.selected = true
            label_item.disabled = true
            label_item.innerText = label
            html_menu_element.appendChild(label_item)
        }
        for (let item of items) {
            const menu_item_element = document.createElement('sp-menu-item')
            menu_item_element.className = menu_item_class
            createMenuItemHtml(item, menu_item_element)
            html_menu_element.appendChild(menu_item_element)
        }
    } catch (e) {
        b_result = false
        console.warn(e)
    }
    return b_result
}
async function populateMenuByElement(
    html_menu_element,
    menu_item_class,
    items,
    createMenuItemHtml,
    b_keep_old_selection = false,
    label = ''
) {
    // function createMenuItemHtml(item, item_html_element) {
    //     // menu_item_element.innerHTML = item.title
    //     // menu_item_element.dataset.model_hash = model.hash
    //     // menu_item_element.dataset.model_title = model.title
    // }

    try {
        html_menu_element.innerHTML = '' // empty the menu
        if (label) {
            const label_item = document.createElement('sp-menu-item')
            label_item.selected = true
            label_item.disabled = true
            label_item.innerText = label
            html_menu_element.appendChild(label_item)
        }
        for (let item of items) {
            const menu_item_element = document.createElement('sp-menu-item')
            menu_item_element.className = menu_item_class
            createMenuItemHtml(item, menu_item_element)
            html_menu_element.appendChild(menu_item_element)
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
function getSelectedMenuItemByElement(menu_element) {
    try {
        // const menu_element = document.getElementById(menu_id)
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
function selectMenuItemByElement(menu_element, item) {
    try {
        const option = Array.from(menu_element.options).filter(
            (element) => element.value === item
        )[0]

        option.selected = true
        // option.dispatchEvent(new Event('click'))
        // option.click()
    } catch (e) {
        unselectMenuItemByElement(menu_element)
        console.warn(e)
    }
}
function getSelectedMenuItemTextContent(menu_id) {
    try {
        const selected_item = getSelectedMenuItem(menu_id)
        if (selected_item.disabled === true) return '' // ignore the label item

        const text_content = selected_item.textContent
        return text_content
    } catch (e) {
        console.warn(e)
    }
}
function getSelectedMenuItemTextContentByElement(menu_element) {
    try {
        const selected_item = getSelectedMenuItemByElement(menu_element)
        if (selected_item.disabled === true) return ''
        const text_content = selected_item.textContent
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
function unselectMenuItemByElement(menu_element) {
    try {
        menu_element.selectedIndex = null
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
    autoFillInPrompt,

    autoFillInNegativePrompt,

    getWidth,
    autoFillInWidth,
    getHeight,
    autoFillInHeight,
    getSliderSdValue,
    setSliderSdValue,
    autoFillInHiResFixs,

    autoFillInSliderUi,

    autoFillInSampler,

    setInitImageSrc,
    setInitImageMaskSrc,

    setAutomaticStatus,
    setProxyServerStatus,

    autoFillSettings,

    setMaskBlur,

    autoFillInHRHeight,
    autoFillInHRWidth,
    getPromptShortcut,
    setPromptShortcut,
    getModelHashByTitle,

    autoFillInInpaintMaskWeight,

    getBatchNumber,
    autoFillInBatchNumber,
    getHrWidth,
    getHrHeight,
    setCFG,
    getCFG,
    getMaskContent,
    setMaskContent,
    addHistoryButtonsHtml,

    updateProgressBarsHtml,
    getBackendType,
    getHordeApiKey,
    setProgressImageSrc,

    isSquareThumbnail,
    setControlImageSrc,

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

    getSliderSdValueByElement,
    setSliderSdValueByElements,
    populateMenuByElement,
    selectMenuItemByElement,
    unselectMenuItemByElement,
    getSelectedMenuItemByElement,
    getSelectedMenuItemTextContentByElement,
}
