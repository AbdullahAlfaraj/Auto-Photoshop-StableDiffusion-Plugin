// import {helloHelper} from 'helper.js'
// helloHelper2 = require('./helper.js')
// for organizational proposes
// let g_sdapi_path = 'sdapi'
const g_image_not_found_url =
    'https://images.unsplash.com/source-404?fit=crop&fm=jpg&h=800&q=60&w=1200'
const _log = console.log
const _warn = console.warn
const _error = console.error
let g_timer_value = 300 // temporary global variable for testing the timer pause function
let g_version = 'v1.3.0'
let g_sd_url = 'http://127.0.0.1:7860'
let g_online_data_url =
    'https://raw.githubusercontent.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin/master/utility/online_data.json'
const Jimp = require('./jimp/browser/lib/jimp.min')
const Enum = require('./enum')
const helper = require('./helper')
const sd_tab = require('./utility/tab/sd')

const sdapi = require('./sdapi_py_re')

// const exportHelper = require('./export_png')
const outpaint = require('./outpaint')
const psapi = require('./psapi')
const app = window.require('photoshop').app
const constants = require('photoshop').constants
const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core
const dialog_box = require('./dialog_box')
// const {entrypoints} = require('uxp')
const html_manip = require('./utility/html_manip')
// const export_png = require('./export_png')
const viewerJs = require('./viewer')
const selection = require('./selection')
const layer_util = require('./utility/layer')
const sd_options = require('./utility/sdapi/options')
// const sd_config = require('./utility/sdapi/config')
const session = require('./utility/session')
const { getSettings } = require('./utility/session')

const ui = require('./utility/ui')
const preset_util = require('./utility/presets/preset')
const script_horde = require('./utility/sd_scripts/horde')
const prompt_shortcut = require('./utility/sdapi/prompt_shortcut')
const formats = require('uxp').storage.formats
const storage = require('uxp').storage
const shell = require('uxp').shell
const fs = storage.localFileSystem
const horde_native = require('./utility/sdapi/horde_native')

const dummy = require('./utility/dummy')
const general = require('./utility/general')
const thumbnail = require('./thumbnail')
const note = require('./utility/notification')
const sampler_data = require('./utility/sampler')
const settings_tab = require('./utility/tab/settings')
//load tabs
const history_tab = require('./utility/tab/history_tab')
const image_search_tab = require('./utility/tab/image_search_tab')
const lexica_tab = require('./utility/tab/lexica_tab')
const share_tab = require('./utility/tab/share_tab')
const api = require('./utility/api')
// const ultimate_sd_upscaler = require('./ultimate_sd_upscaler/dist/ultimate_sd_upscaler')
// const ultimate_sd_upscaler_script = require('./ultimate_sd_upscaler/dist/ultimate_sd_upscaler.bundle')
const {
    scripts,
    main,
    after_detailer_script,
    control_net,
    logger,
    toJS,
    viewer,
    preview,
    session_ts,
    progress,
    sd_tab_ts,
    sam,
    settings_tab_ts,
    one_button_prompt,
    enum_ts,
} = require('./typescripts/dist/bundle')

const io = require('./utility/io')

function setLogMethod(should_log_to_file = true) {
    let timer_id
    if (should_log_to_file) {
        console.log = (data, ...optional_param) => {
            try {
                _log(data, ...optional_param)

                // const error = new Error({ data, ...optional_param });
                const formattedOutput = logger.formateLog(
                    data,
                    ...optional_param
                )
                io.IOLog.saveLogToFile({ log: formattedOutput }, 'log.txt')
            } catch (e) {
                _warn('error while logging: ')
                _warn(e)
            }
        }

        console.warn = (data, ...optional_param) => {
            try {
                _warn(data, ...optional_param)
                const error = new Error()
                const stackTrace = error.stack
                const formattedOutput = logger.formateLog(
                    data,
                    ...optional_param
                )
                io.IOLog.saveLogToFile(
                    { warning: formattedOutput, stackTrace },
                    'log.txt'
                )
            } catch (e) {
                _warn('error while logging: ')
                _warn(e)
            }
        }

        console.error = (data, ...optional_param) => {
            try {
                _error(data, ...optional_param)
                const error = new Error()
                const stackTrace = error.stack
                const formattedOutput = logger.formateLog(
                    data,
                    ...optional_param
                )
                io.IOLog.saveLogToFile(
                    { error: formattedOutput, stackTrace },
                    'log.txt'
                )
            } catch (e) {
                _error('error while logging: ')
                _error(e)
            }
        }
    } else {
        console.log = _log
        console.warn = _warn
        console.error = _error
    }
}
setLogMethod(settings_tab_ts.store.data.should_log_to_file)
// const ultimate_sd_upscaler_script_test = require('./ultimate_sd_upscaler/dist/main')

// const {
//     script_args,
//     script_name,
// } = require('./ultimate_sd_upscaler/dist/ultimate_sd_upscaler')

let g_horde_generator = new horde_native.hordeGenerator()
let g_automatic_status = Enum.AutomaticStatusEnum['Offline']
let g_models_status = false
let g_current_batch_index = 0
let g_is_laso_inapint_mode = true
//REFACTOR: move to session.js
async function hasSessionSelectionChanged() {
    try {
        const isSelectionActive = await psapi.checkIfSelectionAreaIsActive()
        if (isSelectionActive) {
            const current_selection = isSelectionActive // Note: don't use checkIfSelectionAreaIsActive to return the selection object, change this.

            if (
                await hasSelectionChanged(
                    current_selection,
                    g_generation_session.selectionInfo
                )
            ) {
                return true
            } else {
                //selection has not changed
                return false
            }
        }
    } catch (e) {
        console.warn(e)
        return false
    }
}
//REFACTOR: move to selection.js, add selection mode as attribute (linked to rbSelectionMode event)
async function calcWidthHeightFromSelection() {
    //set the width and height, hrWidth, and hrHeight using selection info and selection mode
    const selection_mode = html_manip.getSelectionMode()
    if (selection_mode === 'ratio') {
        //change (width and height) and (hrWidth, hrHeight) to match the ratio of selection
        const [width, height, hr_width, hr_height] =
            await selection.selectionToFinalWidthHeight()
        // console.log('width,height: ', width, height)
        html_manip.autoFillInWidth(width)
        html_manip.autoFillInHeight(height)
        html_manip.autoFillInHRWidth(hr_width)
        html_manip.autoFillInHRHeight(hr_height)
    } else if (selection_mode === 'precise') {
        const selectionInfo = await psapi.getSelectionInfoExe()
        const [width, height, hr_width, hr_height] = [
            selectionInfo.width,
            selectionInfo.height,
            0,
            0,
        ]
        html_manip.autoFillInWidth(width)
        html_manip.autoFillInHeight(height)
    }
}
//REFACTOR: rename to newSelectionEventHandler and move to session.js
const eventHandler = async (event, descriptor) => {
    try {
        console.log(event, descriptor)
        const new_selection_info = await psapi.getSelectionInfoExe()
        session_ts.store.updateProperty(
            'current_selection_info',
            new_selection_info
        )

        // const isSelectionActive = await psapi.checkIfSelectionAreaIsActive()
        if (new_selection_info) {
            const current_selection = new_selection_info // Note: don't use checkIfSelectionAreaIsActive to return the selection object, change this.

            await calcWidthHeightFromSelection()
        }
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to generation_settings.js
function getCurrentGenerationModeByValue(value) {
    for (let key in generationMode) {
        if (
            generationMode.hasOwnProperty(key) &&
            generationMode[key] === value
        ) {
            return key
        }
    }
    return undefined
}

require('photoshop').action.addNotificationListener(
    ['set', 'move', 'addTo', 'subtractFrom'],
    eventHandler
)
//REFACTOR: move to document.js
async function getUniqueDocumentId() {
    console.warn(
        'getUniqueDocumentId is deprecated, instead use the methods in IOFolder'
    )
    try {
        let uniqueDocumentId = await psapi.readUniqueDocumentIdExe()

        console.log(
            'getUniqueDocumentId():  uniqueDocumentId: ',
            uniqueDocumentId
        )

        // Regular expression to check if string is a valid UUID
        const regexExp =
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi

        // String with valid UUID separated by dash
        // const str = 'a24a6ea4-ce75-4665-a070-57453082c256'

        const isValidId = regexExp.test(uniqueDocumentId) // true
        console.log('isValidId: ', isValidId)
        if (isValidId == false) {
            let uuid = self.crypto.randomUUID()
            console.log(uuid) // for example "36b8f84d-df4e-4d49-b662-bcde71a8764f"
            await psapi.saveUniqueDocumentIdExe(uuid)
            uniqueDocumentId = uuid
        }
        return uniqueDocumentId
    } catch (e) {
        console.warn('warning Document Id may not be valid', e)
    }
}

// document
//   .getElementById('btnLinkCurrentDocument')
//   .addEventListener('click', async () => {
//     await getUniqueDocumentId()
//   })

// attach event listeners for tabs
//REFACTOR: move to html_manip.js (?) - if there is no business logic here and it's only for UI.
Array.from(document.querySelectorAll('.sp-tab')).forEach((theTab) => {
    theTab.onclick = () => {
        try {
            // localStorage.setItem("currentTab", theTab.getAttribute("id"));
            Array.from(document.querySelectorAll('.sp-tab')).forEach((aTab) => {
                if (aTab.getAttribute('id') === theTab.getAttribute('id')) {
                    aTab.classList.add('selected')
                } else {
                    aTab.classList.remove('selected')
                }
            })
            Array.from(document.querySelectorAll('.sp-tab-page')).forEach(
                (tabPage) => {
                    if (
                        tabPage
                            .getAttribute('id')
                            .startsWith(theTab.getAttribute('id'))
                    ) {
                        tabPage.classList.add('visible-hack')
                    } else {
                        tabPage.classList.remove('visible-hack')
                    }
                }
            )
        } catch (e) {
            console.warn(e)
        }
    }
})
//REFACTOR: move to events.js
document.getElementById('sp-viewer-tab').addEventListener('click', async () => {
    if (
        g_generation_session.isActive() &&
        g_generation_session.mode === 'upscale'
    ) {
        g_sd_mode = 'upscale'
    } else {
        g_sd_mode = html_manip.getMode()
    }
})
//REFACTOR: move to events.js
document.getElementById('sp-viewer-tab').addEventListener('click', async () => {
    moveElementToAnotherTab('batchNumberUi', 'batchNumberViewerTabContainer')
    await displayUpdate()
})
//REFACTOR: move to events.js
document
    .getElementById('sp-stable-diffusion-ui-tab')
    .addEventListener('click', () => {
        moveElementToAnotherTab('batchNumberUi', 'batchNumber-steps-container')
    })
// entrypoints.setup({

//   panels:{
//     vanilla: ()=>{
//       console.log("you are in the vanilla panel")
//     },
//     experimental_1: ()=>{
//       console.log("you are in the experimental_1 panel")

//     }
//   }
// }
//   )
// just a number that shouldn't unique enough that we will use when save files.
// each session will get a number from 1 to 1000000
//REFACTOR: move to session.js
const random_session_id = Math.floor(Math.random() * 1000000 + 1)
//REFACTOR: move to helpers.js (or other utility file)
function getSelectedText() {
    // JavaScript
    //     // Obtain the object reference for the <textarea>
    // const txtarea = document.getElementById("taPrompt");
    const promptTextarea = document.querySelector('#taPrompt')
    console.log('promptTextarea: ', promptTextarea.value)
    //     // Obtain the index of the first selected character
    var start = promptTextarea.selectionStart
    console.log('start: ', start)
    //     // Obtain the index of the last selected character
    //     var finish = txtarea.selectionEnd;
    //     console.log("finish: ",finish)

    //     // Obtain the selected text
    //     var sel = txtarea.value.substring(start, finish);
    //     console.log("selected textarea: ", sel)

    // Do something with the selected content
}
//REFACTOR: move to helpers.js
// setInterval(getSelectedText,2000)
function getCommentedString() {
    // const text = document.getElementById("taPrompt").value
    // let text = `Visit /*W3Schools
    // cute, girl, painterly
    // *\\ any text
    // and prompt`;
    // let text = `cute cat /*by greg

    // and artgerm

    //  */ and famous artist`
    let text = `Visit /*W3Schools 
  cute, girl, painterly   
  */ any text
  and prompt




 cute cat  /*by greg 

  and artgerm 
  
   */ and famous artist`
    console.log('getCommentedString: text: ', text)

    // let pattern = /(\/)(\*)(\s|\S)*\*\\/g;
    let pattern = /(\/)(\*)(\s|\S)*?(\*\/)/g

    let result = text.match(pattern)
    console.log('getCommentedString: ', result)
}

//REFACTOR: move to helpers.js
function tempDisableElement(element, time) {
    element.classList.add('disableBtn')
    element.disabled = true
    // element.style.opacity = '0.65'
    // element.style.cursor = 'not-allowed'
    setTimeout(function () {
        element.disabled = false
        element.classList.remove('disableBtn')
        // element.style.opacity = '1.0'
        // element.style.cursor = 'default'
    }, time)
}

//REFACTOR: move to the notfication.js
async function displayNotification(automatic_status) {
    if (automatic_status === Enum.AutomaticStatusEnum['RunningWithApi']) {
        //do nothing
    } else if (
        g_automatic_status === Enum.AutomaticStatusEnum['RunningNoApi']
    ) {
        await note.Notification.webuiAPIMissing()
    } else if (g_automatic_status === Enum.AutomaticStatusEnum['Offline']) {
        await note.Notification.webuiIsOffline()
    }
}
//REFACTOR: move to sdapi.js
async function checkAutoStatus() {
    try {
        const options = await g_sd_options_obj.getOptions()
        if (options) {
            //means both automatic1111 and proxy server are online
            html_manip.setAutomaticStatus('connected', 'disconnected')

            g_automatic_status = Enum.AutomaticStatusEnum['RunningWithApi']

            const extension_url = py_re.getExtensionUrl()
            const full_url = `${extension_url}/heartbeat`
            const heartbeat = (await api.requestGet(full_url))?.heartbeat

            if (heartbeat) {
                html_manip.setProxyServerStatus('connected', 'disconnected')
                session_ts.store.data.auto_photoshop_sd_extension_status = true
            } else {
                html_manip.setProxyServerStatus('disconnected', 'connected')
                g_automatic_status =
                    Enum.AutomaticStatusEnum['AutoPhotoshopSDExtensionMissing']
                session_ts.store.data.auto_photoshop_sd_extension_status = false
            }
            // html_manip.setProxyServerStatus('connected','disconnected')
        } else {
            html_manip.setAutomaticStatus('disconnected', 'connected')

            if (await sdapi.isWebuiRunning()) {
                //running with no api
                g_automatic_status = Enum.AutomaticStatusEnum['RunningNoApi']
                // await note.Notification.webuiAPIMissing()
            } else {
                //not running and of course no api
                g_automatic_status = Enum.AutomaticStatusEnum['Offline']
                // await note.Notification.webuiIsOffline()
            }

            return g_automatic_status
        }
    } catch (e) {
        console.warn(e)
    }
    return g_automatic_status
}

//REFACTOR: move to ui.js
async function refreshUI() {
    try {
        const b_proxy_server_status = await updateVersionUI()
        if (b_proxy_server_status) {
            html_manip.setProxyServerStatus('connected', 'disconnected')
            // g_automatic_status = Enum.AutomaticStatusEnum['RunningWithApi']
        } else {
            html_manip.setProxyServerStatus('disconnected', 'connected')
        }

        g_automatic_status = await checkAutoStatus()
        await displayNotification(g_automatic_status)

        const bSamplersStatus = await initSamplers()

        g_models_status = await refreshModels()
        await refreshExtraUpscalers()

        await sdapi.setInpaintMaskWeight(1.0) //set the inpaint conditional mask to 1 when the on plugin start

        //get the latest options

        await g_sd_options_obj.getOptions()
        //get the selected model
        const current_model_title = g_sd_options_obj.getCurrentModel()
        //update the ui with that model title
        const current_model_hash =
            html_manip.getModelHashByTitle(current_model_title)
        html_manip.autoFillInModel(current_model_hash)

        //fetch the inpaint mask weight from sd webui and update the slider with it.
        const inpainting_mask_weight =
            await g_sd_options_obj.getInpaintingMaskWeight()
        console.log('inpainting_mask_weight: ', inpainting_mask_weight)
        html_manip.autoFillInInpaintMaskWeight(inpainting_mask_weight)

        //init ControlNet Tab

        g_hi_res_upscaler_models = await sd_tab.requestGetHiResUpscalers()

        g_controlnet_max_models = await control_net.requestControlNetMaxUnits()
        await control_net.initializeControlNetTab(g_controlnet_max_models)
        await main.populateVAE()
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to generation_settings.js
async function refreshModels() {
    let b_result = false
    try {
        g_models = await sdapi.requestGetModels()
        if (g_models.length > 0) {
            b_result = true
        }

        // const models_menu_element = document.getElementById('mModelsMenu')
        // models_menu_element.value = ""
        document.getElementById('mModelsMenu').innerHTML = ''

        for (let model of g_models) {
            // console.log(model.title)//Log
            const menu_item_element = document.createElement('sp-menu-item')
            menu_item_element.className = 'mModelMenuItem'
            menu_item_element.innerHTML = model.title
            menu_item_element.dataset.model_hash = model.hash
            menu_item_element.dataset.model_title = model.title
            document
                .getElementById('mModelsMenu')
                .appendChild(menu_item_element)
        }
    } catch (e) {
        b_result = false
        console.warn(e)
    }
    return b_result
}
//REFACTOR: move to generation_settings.js
async function refreshExtraUpscalers() {
    try {
        //cycle through hrModelsMenuClass and reset innerHTML
        var hrModelsMenuClass = document.getElementsByClassName(
            'hrExtrasUpscaleModelsMenuClass'
        )
        for (let i = 0; i < hrModelsMenuClass.length; i++) {
            hrModelsMenuClass[i].innerHTML = ''
        }
        g_extra_upscalers = await sdapi.requestGetUpscalers()

        for (let model of g_extra_upscalers) {
            var hrModelsMenuClass = document.getElementsByClassName(
                'hrExtrasUpscaleModelsMenuClass'
            )
            for (let i = 0; i < hrModelsMenuClass.length; i++) {
                const menu_item_element = document.createElement('sp-menu-item')
                menu_item_element.className = 'hrExtrasUpscaleModelsMenuItem'
                menu_item_element.innerHTML = model.name
                hrModelsMenuClass[i].appendChild(menu_item_element)
                // console.log(model + ' added to ' + hrModelsMenuClass[i].id)//Log
            }
        }
    } catch (e) {
        console.warn(e)
    }
}

//REFACTOR: move to ui.js
async function updateVersionUI() {
    let bStatus = false
    try {
        version = await sdapi.getVersionRequest()
        document.getElementById('lVersionNumber').textContent = version
        if (version !== 'v0.0.0') {
            bStatus = true
        }
    } catch (e) {
        console.warn(e)
        document.getElementById('lVersionNumber').textContent = 'v0.0.0'
        bStatus = false
    }
    return bStatus
}
//REFACTOR: move to generation_settings.js
async function initSamplers() {
    let bStatus = false
    try {
        let sampler_group = document.getElementById('sampler_group')
        sampler_group.innerHTML = ''

        let samplers = await sdapi.requestGetSamplers()
        if (!samplers) {
            //if we failed to get the sampler list from auto1111, use the list stored in sampler.js

            samplers = sampler_data.samplers
        }

        for (let sampler of samplers) {
            // console.log(sampler)//Log
            // sampler.name
            // <sp-radio class="rbSampler" value="Euler">Euler</sp-radio>
            const rbSampler = document.createElement('sp-radio')

            rbSampler.innerHTML = sampler.name
            rbSampler.setAttribute('class', 'rbSampler')
            rbSampler.setAttribute('value', sampler.name)

            sampler_group.appendChild(rbSampler)
            //add click event on radio button for Sampler radio button, so that when a button is clicked it change g_sd_sampler globally

            //we could delete the click() event
            rbSampler.addEventListener('click', (evt) => {
                g_sd_sampler = evt.target.value
                console.log(`You clicked: ${g_sd_sampler}`)
            })
        }
        document
            .getElementsByClassName('rbSampler')[0]
            .setAttribute('checked', '')
        if (samplers.length > 0) {
            bStatus = true
        }
    } catch (e) {
        console.warn(e)
    }
    return bStatus
}
//REFACTOR: move to helper.js
function promptShortcutExample() {
    let prompt_shortcut_example = {
        game_like:
            'Unreal Engine, Octane Render, arcane card game ui, hearthstone art style, epic fantasy style art',
        large_building_1: 'castle, huge building, large building',
        painterly_style_1:
            'A full portrait of a beautiful post apocalyptic offworld arctic explorer, intricate, elegant, highly detailed, digital painting, artstation, concept art, smooth, sharp focus, illustration',
        ugly: ' ((((ugly)))), (((duplicate))), ((morbid)), ((mutilated)), out of frame, extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck)))',
    }
    var JSONInPrettyFormat = JSON.stringify(
        prompt_shortcut_example,
        undefined,
        7
    )
    document.getElementById('taPromptShortcut').value = JSONInPrettyFormat
    return prompt_shortcut_example
}

//**********Start: global variables
let prompt_dir_name = ''
let gImage_paths = []
let g_image_path_to_layer = {}
let g_init_images_dir = './server/python_server/init_images'
//REFACTOR: move to generationSettings.js
gCurrentImagePath = ''
//REFACTOR: move to generationSettings.js
let g_init_image_name = ''
// let g_init_mask_layer;
//REFACTOR: move to generationSettings.js
let g_init_image_mask_name = ''
// let g_mask_related_layers = {}
// let g_init_image_related_layers = {}
//REFACTOR: move to generationSettings.js, Note: numberOfImages deprecated global variable
// let numberOfImages = document.querySelector('#tiNumberOfImages').value
//REFACTOR: move to generationSettings.js
let g_sd_mode = 'txt2img'
// let g_sd_mode_last = g_sd_mode
//REFACTOR: move to generationSettings.js
let g_sd_mode_last = g_sd_mode
//REFACTOR: move to generationSettings.js
let g_sd_sampler = 'Euler a'
//REFACTOR: move to generationSettings.js
let g_denoising_strength = 0.7
//REFACTOR: move to generationSettings.js
let g_use_mask_image = false
let g_models = []
// let g_models_horde = []
let g_model_title = ''
// let gWidth = 512
// let gHeight = 512
//REFACTOR: move to generationSettings.js
let hWidth = 512
//REFACTOR: move to generationSettings.js
let hHeight = 512
//REFACTOR: move to generationSettings.js
let h_denoising_strength = 0.7
// let g_inpainting_fill = 0
// let g_last_outpaint_layers = []
// let g_last_inpaint_layers = []
// let g_last_snap_and_fill_layers = []

//REFACTOR: move to generationSettings.js
let g_metadatas = []
let g_last_seed = '-1'
//REFACTOR: move to generationSettings.js
let g_can_request_progress = true
let g_saved_active_layers = []
let g_saved_active_selection = {}
let g_is_active_layers_stored = false

let g_number_generation_per_session = 0
let g_isViewerMenuDisabled = false // disable the viewer menu and viewerImage when we're importing images into the current document
let g_b_mask_layer_exist = false // true if inpaint mask layer exist, false otherwise.
let g_inpaint_mask_layer
let g_inpaint_mask_layer_history_id //store the history state id when creating a new inpaint mask layer

// let g_selection = {}
//REFACTOR: move to session.js
let g_selection = {}
let g_b_use_smart_object = true // true to keep layer as smart objects, false to rasterize them
let g_sd_options_obj = new sd_options.SdOptions()

g_sd_options_obj.getOptions()

// let g_width_slider = new ui.UIElement()
// g_width_slider.getValue = html_manip.getWidth
// ui_settings.uiElements.push =
let g_old_slider_width = 512
let g_old_slider_height = 512

let g_hi_res_upscaler_models
let g_controlnet_max_models
;(async function () {
    g_hi_res_upscaler_models = await sd_tab.requestGetHiResUpscalers()

    g_controlnet_max_models = await control_net.requestControlNetMaxUnits()

    for (let model of g_hi_res_upscaler_models) {
        //update the hi res upscaler models menu
        let hrModelsMenuClass =
            document.getElementsByClassName('hrModelsMenuClass')
        for (let i = 0; i < hrModelsMenuClass.length; i++) {
            const menu_item_element = document.createElement('sp-menu-item')
            menu_item_element.className = 'hrModelsMenuItem'
            menu_item_element.innerHTML = model
            hrModelsMenuClass[i].appendChild(menu_item_element)
            // console.log(model + ' added to ' + hrModelsMenuClass[i].id)//Log
        }
    }
})()

let g_generation_session = new session.GenerationSession(0) //session manager
g_generation_session.deactivate() //session starte as inactive
let g_ui = new ui.UI()

let g_ui_settings_object = ui.getUISettingsObject()
let g_batch_count_interrupt_status = false
const requestState = {
    Generate: 'generate',
    Interrupt: 'interrupt',
}

let g_request_status = '' //

//REFACTOR: move to Enum.js
const generationMode = {
    Txt2Img: 'txt2img',
    Img2Img: 'img2img',
    Inpaint: 'inpaint',
    Outpaint: 'outpaint',
    Upscale: 'upscale',
}
const backendTypeEnum = {
    Auto1111: 'auto1111',
    HordeNative: 'horde_native',
    Auto1111HordeExtension: 'auto1111_horde_extension',
}

g_generation_session.mode = generationMode['Txt2Img']
let g_viewer_manager = new viewerJs.ViewerManager()

//********** End: global variables */

//***********Start: init function calls */
//REFACTOR: keep in index.js
async function initPlugin() {
    //*) load plugin settings
    //*) load horde settings
    //*)
    //*) initialize the samplers
    //*)
    await settings_tab.loadSettings()
    await horde_native.HordeSettings.loadSettings()
    const bSamplersStatus = await initSamplers() //initialize the sampler
    await sdapi.setInpaintMaskWeight(1.0) //set the inpaint conditional mask to 1 when the on plugin start
    await refreshUI()
    await displayUpdate()
    // promptShortcutExample()
    await loadPromptShortcut()
    await refreshPromptMenue()
}
initPlugin()
// refreshModels() // get the models when the plugin loads
// initSamplers()
// updateVersionUI()
// refreshUI()
// displayUpdate()
// loadPromptShortcut()
// // promptShortcutExample()

//***********End: init function calls */

//add click event on radio button mode, so that when a button is clicked it change g_sd_mode globally
//REFACTOR: move to events.js
rbModeElements = document.getElementsByClassName('rbMode')
for (let rbModeElement of rbModeElements) {
    rbModeElement.addEventListener('click', async (evt) => {
        try {
            g_sd_mode = evt.target.value
            scripts.script_store.setMode(g_sd_mode)
            sd_tab_ts.store.updateProperty('mode', g_sd_mode)
            // console.log(`You clicked: ${g_sd_mode}`)
            await displayUpdate()
            await postModeSelection() // do things after selection
        } catch (e) {
            console.warn(e)
        }
    })
}

//swaps g_sd_mode when clicking on extras tab and swaps it back to previous value when clicking on main tab
//REFACTOR: move to events.js
document
    .getElementById('sp-extras-tab')
    .addEventListener('click', async (evt) => {
        try {
            // g_sd_mode_last = g_sd_mode
            g_sd_mode = 'upscale'
            sd_tab_ts.store.updateProperty('mode', 'upscale')
            console.log(`You clicked: ${g_sd_mode}`)
            await displayUpdate()
            await postModeSelection() // do things after selection
        } catch (e) {
            console.warn(e)
        }
    })
//REFACTOR: move to events.js
document
    .getElementById('sp-stable-diffusion-ui-tab')
    .addEventListener('click', async (evt) => {
        try {
            // g_sd_mode = g_sd_mode_last
            g_sd_mode = html_manip.getMode()
            sd_tab_ts.store.updateProperty('mode', html_manip.getMode())
            console.log(`mode restored to: ${g_sd_mode}`)
            await displayUpdate()
            await postModeSelection() // do things after selection
        } catch (e) {
            console.warn(e)
        }
    })
//REFACTOR: move to psapi.js
async function createTempInpaintMaskLayer() {
    if (!g_b_mask_layer_exist) {
        //make new layer "Mask -- Paint White to Mask -- temporary"

        const name = 'Mask -- Paint White to Mask -- temporary'
        await psapi.unselectActiveLayersExe() // so that the mask layer get create at the top of the layer stocks
        const top_layer_doc = await app.activeDocument.layers[0]
        g_inpaint_mask_layer = await layer_util.createNewLayerExe(name, 60)
        await executeAsModal(async () => {
            await g_inpaint_mask_layer.moveAbove(top_layer_doc)
        })
        // g_inpaint_mask_layer.opacity = 50
        g_b_mask_layer_exist = true
        const index = app.activeDocument.historyStates.length - 1
        g_inpaint_mask_layer_history_id =
            app.activeDocument.historyStates[index].id
        console.log(
            'g_inpaint_mask_layer_history_id: ',
            g_inpaint_mask_layer_history_id
        )
    }
}
//REFACTOR: move to psapi.js
async function deleteTempInpaintMaskLayer() {
    console.log(
        'g_inpaint_mask_layer_history_id: ',
        g_inpaint_mask_layer_history_id
    )
    const historyBrushTools = app.activeDocument.historyStates
        .slice(-10)
        .filter(
            (h) =>
                h.id > g_inpaint_mask_layer_history_id &&
                h.name === 'Brush Tool'
        )
    console.log(historyBrushTools)
    if (historyBrushTools.length === 0 && g_b_mask_layer_exist) {
        await layer_util.deleteLayers([g_inpaint_mask_layer])

        g_b_mask_layer_exist = false
    }
}
//REFACTOR: move to ui.js
async function postModeSelection() {
    try {
        if (g_sd_mode === generationMode['Inpaint']) {
            //check if the we already have created a mask layer
            await createTempInpaintMaskLayer()
        } else {
            // if we switch from inpaint mode, delete the mask layer
            // Find all history states after the creation of the inpaint mask and their name brush tool
            await deleteTempInpaintMaskLayer()
        }
    } catch (e) {
        console.warn(e)
    }
}
rbMaskContentElements = document.getElementsByClassName('rbMaskContent')
//REFACTOR: move to events.js
for (let rbMaskContentElement of rbMaskContentElements) {
    rbMaskContentElement.addEventListener('click', async (evt) => {
        // g_inpainting_fill = evt.target.value
        // console.log(`You clicked: ${g_inpainting_fill}`)
    })
}

btnSquareClass = document.getElementsByClassName('btnSquare')
//REFACTOR: move to events.js
for (let btnSquareButton of btnSquareClass) {
    btnSquareButton.addEventListener('click', async (evt) => {
        // document.activeElement.blur()
        setTimeout(() => {
            try {
                evt.target.blur()
            } catch (e) {
                console.warn(e)
            }
        }, 500)
    })
}

btnRefreshModelsClass = document.getElementsByClassName('btnRefreshModels')
//REFACTOR: move to events.js
for (let btnRefreshModel of btnRefreshModelsClass) {
    btnRefreshModel.addEventListener('click', async (evt) => {
        // document.activeElement.blur()
        setTimeout(() => {
            try {
                evt.target.blur()
            } catch (e) {
                console.warn(e)
            }
        }, 500)
    })
}
//REFACTOR: move to events.js
document.addEventListener('mouseenter', async (event) => {
    try {
        //only check if the generation mode has not changed( e.g a session.mode === img2img and the current selection is "img2img"  ).
        // changing the mode will trigger it's own procedure, so doing it here again is redundant
        if (
            g_generation_session.isActive() &&
            g_generation_session.mode === g_sd_mode
        ) {
            //if the generation session is active and the selected mode is still the same as the generation mode

            console.log('hover on window')

            const new_selection = await psapi.getSelectionInfoExe() //get the current active selection if there is any

            if (
                new_selection &&
                (await hasSelectionChanged(
                    new_selection,
                    g_generation_session.selectionInfo
                ))
            ) {
                // if there is an active selection and if the selection has changed

                await calcWidthHeightFromSelection()

                if (
                    g_generation_session.state ===
                    session.SessionState['Active']
                ) {
                    //indicate that the session will end if you generate
                    //only if you move the selection while the session is active
                    // g_ui.endSessionUI()
                    const selected_mode = html_manip.getMode()
                    g_ui.generateModeUI(selected_mode)
                } else {
                    // move the selection while the session is inactive
                }
            } else {
                // sessionStartHtml(true)//generate more, green color
                //if you didn't move the selection.
                // g_ui.startSessionUI()
                g_ui.generateMoreUI()
            }
        }
    } catch (e) {
        console.warn(e)
    }
})
////add tips to element when mouse hover on an element
// function getToolTipElement(){
//   const tool_tip = document.getElementById("tool_tip")
//   return tool_tip
// }
// function moveTip(x,y){
//   var tool_tip = document.getElementById("tool_tip")

//     tool_tip.style.position =  'absolute';
//     tool_tip.style.left =  x;
//     tool_tip.style.top =  y;
// }
// document.getElementById('rbOutpaintMode').addEventListener("mouseover",(e)=>{

//   console.log("e.shiftKey:",e.shiftKey)

//   if(e.shiftKey)
//   {
//     const rect = e.target.getBoundingClientRect()
//     const tool_tip = getToolTipElement()
//     setTimeout(()=>{
//       tool_tip.style.display = "none"
//     },5000)
//     tool_tip.style.display = "inline-block"

//     tool_tip.style["z-index"] =  100;
//     console.log("Use this mode when you want to fill empty areas of the canvas")
//     // var x = e.pageX;
//     // var y = e.pageY;
//     console.log("(e.pageX,e.pageY): ",(e.pageX,e.pageY))
//     const tip_x = e.pageX - (tool_tip.offsetWidth/2)
//     // const tip_y = e.pageY + - tool_tip.offsetHeight
//     const tip_y = rect.top + - tool_tip.offsetHeight

//     moveTip(tip_x,tip_y)
//   }
//   else{// rlease the shift key
//     console.log("tip will disappear in 1 second")
//   }

// });

// document.getElementById('rbOutpaintMode').addEventListener("mouseout",(e)=>{

//   console.log("e.shiftKey:",e.shiftKey)

//   console.log("no tip, tip will disappear in 1 second")
//   // getToolTipElement().style.display = "none"

// });

// show the interface that need to be shown and hide the interface that need to be hidden
//REFACTOR: move to ui.js
async function displayUpdate() {
    try {
        sd_tab.displayImageCfgScaleSlider(g_sd_mode)
        if (g_sd_mode == 'txt2img') {
            document.getElementById('slDenoisingStrength').style.display =
                'none' // hide denoising strength slider
            // document.getElementById("image_viewer").style.display = 'none' // hide images
            document.getElementById('init_image_container').style.display =
                'none' // hide init image
            document.getElementById('init_image_mask_container').style.display =
                'none' // hide init mask
            document.getElementById('slInpainting_fill').style.display = 'none' // hide inpainting fill mode
            document.getElementById('chInpaintFullRes').style.display = 'none'

            document.getElementById('slInpaintingMaskWeight').style.display =
                'none' // hide inpainting conditional mask weight

            document.getElementById('chHiResFixs').style.display = 'flex'
            if (html_manip.getHiResFixs()) {
                document.getElementById('HiResDiv').style.display = 'block'
            }

            document.getElementById('slMaskExpansion').style.display = 'none'

            document.getElementById('slInpaintPadding').style.display = 'none'
            document.getElementById('slMaskBlur').style.display = 'none'
            // document.getElementById('slImageCfgScale').style.display = 'none'
            // document.getElementById('btnSnapAndFill').style.display = 'none'//"none" will  misaligned the table // hide snap and fill button
        }

        if (g_sd_mode == 'img2img') {
            document.getElementById('slDenoisingStrength').style.display =
                'block' // show denoising strength
            document.getElementById('slMaskExpansion').style.display = 'none'
            // document.getElementById("image_viewer").style.display = 'block'
            document.getElementById('init_image_container').style.display =
                'block' // hide init image

            document.getElementById('init_image_mask_container').style.display =
                'none' // hide mask
            document.getElementById('slInpainting_fill').style.display = 'none' // hide inpainting fill mode
            // document.getElementById('btnSnapAndFill').style.display = 'inline-flex' // hide snap and fill button mode
            document.getElementById('HiResDiv').style.display = 'none'
            document.getElementById('chInpaintFullRes').style.display = 'none'
            document.getElementById('slInpaintPadding').style.display = 'none'
            document.getElementById('slMaskBlur').style.display = 'none'
            document.getElementById('chHiResFixs').style.display = 'none'
            document.getElementById('slInpaintingMaskWeight').style.display =
                'block' // hide inpainting conditional mask weight

            // document.getElementById('slImageCfgScale').style.display = 'block'
        }

        if (g_sd_mode == 'inpaint' || g_sd_mode == 'outpaint') {
            ///fix the misalignment problem in the ui (init image is not aligned with init mask when switching from img2img to inpaint ). note: code needs refactoring
            // document.getElementById('btnSnapAndFill').style.display = 'none'//"none" will  misaligned the table // hide snap and fill button
            document.getElementById('tableInitImageContainer').style.display =
                'none' // hide the table
            document.getElementById('slMaskExpansion').style.display = 'block'
            setTimeout(() => {
                try {
                    document.getElementById(
                        'tableInitImageContainer'
                    ).style.display = 'table' // show the table after some time so it gets rendered.
                } catch (e) {
                    console.warn(e)
                }
            }, 100)

            document.getElementById('slDenoisingStrength').style.display =
                'block'
            document.getElementById('init_image_mask_container').style.display =
                'block'
            document.getElementById('slInpainting_fill').style.display = 'block'
            document.getElementById('init_image_container').style.display =
                'block' // hide init image
            document.getElementById('slInpaintingMaskWeight').style.display =
                'block' // hide inpainting conditional mask weight

            document.getElementById('HiResDiv').style.display = 'none'
            document.getElementById('chInpaintFullRes').style.display =
                'inline-flex'
            if (document.getElementById('chInpaintFullRes').checked) {
                document.getElementById('slInpaintPadding').style.display =
                    'block'
            } else {
                document.getElementById('slInpaintPadding').style.display =
                    'none'
            }
            document.getElementById('slMaskBlur').style.display = 'block'
            document.getElementById('chHiResFixs').style.display = 'none'

            // document.getElementById('btnInitOutpaint').style.display = 'inline-flex'
            // document.getElementById('btnInitInpaint').style.display = 'inline-flex'
            // document.getElementById('btnInitOutpaint').style.display = 'none'
            // document.getElementById('btnInitInpaint').style.display = 'none'
        } else {
            //txt2img or img2img
            // document.getElementById('btnInitOutpaint').style.display = 'none'
            // document.getElementById('btnInitInpaint').style.display = 'none'
        }

        if (g_generation_session.isActive()) {
            //Note: remove the "or" operation after refactoring the code
            //if the session is active

            if (g_generation_session.mode !== g_sd_mode) {
                //if a generation session is active but we changed mode. the generate button will reflect that
                //Note: add this code to the UI class
                const generate_btns = Array.from(
                    document.getElementsByClassName('btnGenerateClass')
                )
                generate_btns.forEach((element) => {
                    const selected_mode =
                        getCurrentGenerationModeByValue(g_sd_mode)
                    element.textContent = `Generate ${selected_mode}`
                })

                html_manip.setGenerateButtonsColor('generate', 'generate-more')
            } else {
                //1) and the session is active
                //2) is the same generation mode

                if (!(await hasSessionSelectionChanged())) {
                    //3a) and the selection hasn't change

                    const generate_btns = Array.from(
                        document.getElementsByClassName('btnGenerateClass')
                    )

                    // const selected_mode =
                    //     getCurrentGenerationModeByValue(g_sd_mode)
                    const generation_mode = g_generation_session.mode
                    const generation_name =
                        getCurrentGenerationModeByValue(generation_mode)
                    generate_btns.forEach((element) => {
                        element.textContent = `Generate More ${generation_name}`
                    })

                    html_manip.setGenerateButtonsColor(
                        'generate-more',
                        'generate'
                    )
                } else {
                    //3b) selection has change
                }
            }
        } else {
            //session is not active
            const selected_mode = getCurrentGenerationModeByValue(g_sd_mode)
            g_ui.setGenerateBtnText(`Generate ${selected_mode}`)
            html_manip.setGenerateButtonsColor('generate', 'generate-more')
        }
    } catch (e) {
        console.warn(e)
    }
}
// function showLayerNames () {
//   const app = window.require('photoshop').app
//   const allLayers = app.activeDocument.layers
//   const allLayerNames = allLayers.map(
//     layer => `${layer.name} (${layer.opacity} %)`
//   )

//   const sortedNames = allLayerNames.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
//   document.getElementById('layers').innerHTML = `
//         <ul>${sortedNames.map(name => `<li>${name}</li>`).join('')}</ul>`
// }
//REFACTOR: move to psapi.js
function selectTool() {
    var doc = app.activeDocument
    var activeTool = app.currentTool

    // if (activeTool !== toolName) {
    //   toolName = activeTool;
    //   doc.activeTool = toolName;
    // }
    // const util = require('util')

    // console.log(util.inspect(myObject, {showHidden: false, depth: null, colors: true}))
    console.dir(app, { depth: null })
    console.log('hello this is Abdullah')
    document.getElementById('layers').innerHTML = `<span>
    selectTool was called, ${activeTool}
    </span>`

    //rectanglemarquee
    // await require('photoshop').core.executeAsModal(newNormalLayer);
}

// User picks an image file
// open a explorer for user to select a image file
//REFACTOR: move to psapi.js
async function fillImage() {
    const storage = require('uxp').storage
    const fs = storage.localFileSystem
    let imageFile = await fs.getFileForOpening({
        types: storage.fileTypes.images,
    })

    // Create ImageFill for this image
    const ImageFill = require('scenegraph').ImageFill
    let fill = new ImageFill(imageFile)

    // Set fill of first selected item
    selection.items[0].fill = fill
}
// fillImage()
//REFACTOR: move to psapi.js
function pastImage2Layer() {
    const { batchPlay } = require('photoshop').action
    const { executeAsModal } = require('photoshop').core

    executeAsModal(
        () => {
            // batchPlay([command], {})
            const result = batchPlay(
                [
                    {
                        _obj: 'paste',
                        antiAlias: {
                            _enum: 'antiAliasType',
                            _value: 'antiAliasNone',
                        },
                        as: {
                            _class: 'pixel',
                        },
                        _options: {
                            dialogOptions: 'dontDisplay',
                        },
                    },
                ],
                {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                }
            )
        },
        {
            commandName: 'Create Label',
        }
    )
}
//REFACTOR: move to ui.js
function sliderToResolution(sliderValue) {
    return sliderValue * 64
}

//REFACTOR: move to events.js
document.querySelector('#hrHeight').addEventListener('input', (evt) => {
    hHeight = sliderToResolution(evt.target.value)
    document.querySelector('#hHeight').textContent = hHeight
})
//REFACTOR: move to events.js
document.querySelector('#hrWidth').addEventListener('input', (evt) => {
    hWidth = sliderToResolution(evt.target.value)
    document.querySelector('#hWidth').textContent = hWidth
})

//REFACTOR: move to events.js
document.querySelector('#slInpaintPadding').addEventListener('input', (evt) => {
    padding = evt.target.value * 4
    document.querySelector('#lInpaintPadding').textContent = padding
})

// document
//   .querySelector('#slDenoisingStrength')
//   .addEventListener('input', evt => {
//     const denoising_string_value = evt.target.value / 100.0
//     g_denoising_strength = denoising_string_value
//     // document.querySelector('#lDenoisingStrength').value= Number(denoising_string_value)
//     document.querySelector('#lDenoisingStrength').textContent =
//       denoising_string_value
//     document.getElementById(
//       'lDenoisingStrength'
//     ).innerHTML = `${denoising_string_value}`
//     // console.log(`New denoising_string_value: ${document.querySelector('#tiDenoisingStrength').value}`)
//   })
// document
//   .querySelector('#hrDenoisingStrength')
//   .addEventListener('input', evt => {
//     const denoising_string_value = evt.target.value / 100.0
//     h_denoising_strength = denoising_string_value

//     document.getElementById(
//       'hDenoisingStrength'
//     ).innerHTML = `${denoising_string_value}`
//     // console.log(`New denoising_string_value: ${document.querySelector('#tiDenoisingStrength').value}`)
//   })
// // document.getElementById('btnPopulate').addEventListener('click', showLayerNames)
//REFACTOR: move to psapi.js
async function snapAndFillHandler() {
    try {
        const isSelectionAreaValid = await psapi.checkIfSelectionAreaIsActive()
        if (isSelectionAreaValid) {
            if (g_generation_session.isFirstGeneration) {
                // clear the layers related to the last mask operation.
                // g_last_snap_and_fill_layers = await psapi.cleanLayers(
                //   g_last_snap_and_fill_layers
                // )
                // create new layers related to the current mask operation.
                await executeAsModal(
                    async () => {
                        // g_last_snap_and_fill_layers = await outpaint.snapAndFillExe(random_session_id)
                        await outpaint.snapAndFillExe(random_session_id)
                    },
                    { commandName: 'Snap And Fill' }
                )
                // console.log(
                //   'outpaint.snapAndFillExe(random_session_id):, g_last_snap_and_fill_layers: ',
                //   g_last_snap_and_fill_layers
                // )
            }
        } else {
            psapi.promptForMarqueeTool()
        }
    } catch (e) {
        console.warn(e)
    }
}

// document
//   .getElementById('btnSnapAndFill')
//   .addEventListener('click', async () => {

//   await snapAndFillHandler()
//   })
//REFACTOR: move to generation.js
async function easyModeOutpaint() {
    try {
        if (g_generation_session.isFirstGeneration) {
            // clear the layers related to the last mask operation.
            // g_last_outpaint_layers = await psapi.cleanLayers(g_last_outpaint_layers)

            // create new layers related to the current mask operation.
            // g_last_outpaint_layers = await outpaint.outpaintExe(random_session_id)
            await outpaint.outpaintExe(random_session_id)
        }
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to generation.js
async function btnInitInpaintHandler() {
    try {
        if (g_generation_session.isFirstGeneration) {
            // delete the layers of the previous mask operation
            // g_last_inpaint_layers = await psapi.cleanLayers(g_last_inpaint_layers)
            // store the layer of the current mask operation
            // g_last_inpaint_layers =  await outpaint.inpaintFasterExe(random_session_id)
            await outpaint.inpaintFasterExe(random_session_id)

            // console.log ("outpaint.inpaintFasterExe(random_session_id):, g_last_inpaint_layers: ",g_last_inpaint_layers)
        }
    } catch (e) {
        console.warn(e)
    }
}
// document
//   .getElementById('btnInitInpaint')
//   .addEventListener('click', async () => {
//  await btnInitInpaintHandler()
//   })
//REFACTOR: move to ui.js
function toggleTwoButtonsByClass(isVisible, first_class, second_class) {
    const first_class_btns = Array.from(
        document.getElementsByClassName(first_class)
    )
    const second_class_btns = Array.from(
        document.getElementsByClassName(second_class)
    )

    if (isVisible) {
        //show interrup button
        first_class_btns.forEach((element) => (element.style.display = 'none'))
        second_class_btns.forEach(
            (element) => (element.style.display = 'inline-block')
        )
        // console.log('first_class_btns: ', first_class_btns)
    } else {
        //show generate or generate more button
        first_class_btns.forEach(
            (element) => (element.style.display = 'inline-block')
        )
        if (g_generation_session.isActive()) {
            //show generate more
            // const selected_mode = getCurrentGenerationModeByValue(g_sd_mode)
            const generation_mode = g_generation_session.mode
            const generation_name =
                getCurrentGenerationModeByValue(generation_mode)
            first_class_btns.forEach(
                (element) =>
                    (element.textContent = `Generate More ${generation_name}`)
            )
        } else {
            //show generate button
            first_class_btns.forEach(
                (element) =>
                    (element.textContent = `Generate ${getCurrentGenerationModeByValue(
                        g_sd_mode
                    )}`)
            )
        }
        second_class_btns.forEach((element) => (element.style.display = 'none'))
    }
    return isVisible
}
//REFACTOR: move to session.js
async function discardAll() {
    //discard all generated images setting highlight to false
    //then call discard() to garbage collect the mask related layers
    try {
        for (const [path, viewer_image_obj] of Object.entries(
            g_viewer_manager.pathToViewerImage
        )) {
            try {
                viewer_image_obj.active(false) //deactivate the layer
                viewer_image_obj.setHighlight(false) // mark each layer as discarded
            } catch (e) {
                console.error(e)
            }
        }
        await discard() // clean viewer tab
        await layer_util.deleteLayers([g_generation_session.outputGroup]) //delete the group folder since it's empty
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to session.js
async function acceptAll() {
    //accept all generated images by highlighting them
    //then call discard() to garbage collect the mask related layers
    try {
        for (const [path, viewer_image_obj] of Object.entries(
            g_viewer_manager.pathToViewerImage
        )) {
            try {
                if (
                    viewer_image_obj.isActive() &&
                    viewer_image_obj instanceof viewerJs.OutputImage
                ) {
                    //check if the active viewer_image_obj is a type of OutputImage and move it to the top of the output group folder
                    //this is so when we accept all layers the canvas will look the same. otherwise the image could be cover by another generated image
                    if (
                        layer_util.Layer.doesLayerExist(viewer_image_obj.layer)
                    ) {
                        await g_generation_session.moveToTopOfOutputGroup(
                            viewer_image_obj.layer
                        )
                    }
                }
                viewer_image_obj.setHighlight(true) // mark each layer as accepted
            } catch (e) {
                console.error(e)
            }
        }
        await discard() // clean viewer tab
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to session.js
async function discardSelected() {
    //discard all generated images setting highlight to false
    //then call discard() to garbage collect the mask related layers
    try {
        for (const [path, viewer_image_obj] of Object.entries(
            g_viewer_manager.pathToViewerImage
        )) {
            try {
                if (viewer_image_obj.is_active) {
                    viewer_image_obj.active(false) //convert active to highlight
                    viewer_image_obj.setHighlight(true) //highlight the active image, since active images are not highlighted in the viewer
                }

                viewer_image_obj.toggleHighlight() // if invert the highlights on all images
            } catch (e) {
                console.error(e)
            }
        }
        await discard() // delete the images that currently highlighted
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to events.js
const discard_selected_class_btns = Array.from(
    document.getElementsByClassName('discardSelectedClass')
)
//REFACTOR: move to events.js
discard_selected_class_btns.forEach((element) =>
    element.addEventListener('click', async () => {
        try {
            await g_generation_session.endSession(
                session.GarbageCollectionState['DiscardSelected']
            ) //end session and accept only selected images
            g_ui.onEndSessionUI()
        } catch (e) {
            console.warn(e)
        }
    })
)

//REFACTOR: move to events.js
const accept_selected_class_btns = Array.from(
    document.getElementsByClassName('acceptSelectedClass')
)
//REFACTOR: move to events.js
accept_selected_class_btns.forEach((element) =>
    element.addEventListener('click', async () => {
        try {
            await g_generation_session.endSession(
                session.GarbageCollectionState['AcceptSelected']
            ) //end session and accept only selected images
            g_ui.onEndSessionUI()
        } catch (e) {
            console.warn(e)
        }
    })
)
//REFACTOR: move to events.js
const accept_class_btns = Array.from(
    document.getElementsByClassName('acceptClass')
)
//REFACTOR: move to events.js
accept_class_btns.forEach((element) =>
    element.addEventListener('click', async () => {
        try {
            await g_generation_session.endSession(
                session.GarbageCollectionState['Accept']
            ) //end session and accept all images
            g_ui.onEndSessionUI()

            // await acceptAll()
        } catch (e) {
            console.warn(e)
        }
    })
)
//REFACTOR: move to ui.js
function toggleTwoButtons(defaultVal, first_btn_id, second_btn_id) {
    if (defaultVal) {
        document.getElementById(first_btn_id).style.display = 'none' // hide generate button
        document.getElementById(second_btn_id).style.display = 'inline-block' // show interrupt button
    } else {
        document.getElementById(first_btn_id).style.display = 'inline-block' // hide generate button
        document.getElementById(second_btn_id).style.display = 'none' // show interrupt button
    }
    return defaultVal
}
//REFACTOR: move to events.js
document.getElementById('btnRandomSeed').addEventListener('click', async () => {
    document.querySelector('#tiSeed').value = '-1'
})
//REFACTOR: move to events.js
document.getElementById('btnLastSeed').addEventListener('click', async () => {
    try {
        // console.log('click on Last seed')
        let seed = '-1'

        if (g_last_seed >= 0) {
            seed = g_last_seed.toString() //make sure the seed is a string
        }

        // console.log('seed:', seed)
        document.querySelector('#tiSeed').value = seed
    } catch (e) {
        console.warn(e)
    }
})
//REFACTOR: move to session.js
async function discard() {
    try {
        await executeAsModal(async () => {
            await psapi.selectLayersExe([g_generation_session.outputGroup]) //must select the layer to change allLocked
            g_generation_session.outputGroup.allLocked = false //unlock the session folder on session end
        })

        // console.log(
        //   'click on btnCleanLayers,  g_last_outpaint_layers:',
        //   g_last_outpaint_layers
        // )
        // console.log(
        //   'click on btnCleanLayers,  g_last_inpaint_layers:',
        //   g_last_inpaint_layers
        // )

        // console.log(
        //   'click on btnCleanLayers,  g_last_snap_and_fill_layers:',
        //   g_last_snap_and_fill_layers
        // )

        // console.log('g_last_snap_and_fill_layers')
        // g_last_snap_and_fill_layers = await psapi.cleanLayers(
        //   g_last_snap_and_fill_layers
        // )

        // if (g_last_outpaint_layers.length > 0) {
        //   g_last_outpaint_layers = await psapi.cleanLayers(g_last_outpaint_layers)
        //   console.log('g_last_outpaint_layers has 1 layers')
        // }
        // if (g_last_inpaint_layers.length > 0) {
        //   g_last_inpaint_layers = await psapi.cleanLayers(g_last_inpaint_layers)
        //   g_b_mask_layer_exist = false

        // }
        const random_img_src = 'https://source.unsplash.com/random'
        html_manip.setInitImageSrc(random_img_src)
        html_manip.setInitImageMaskSrc(random_img_src)

        // psapi.cleanLayers(last_gen_layers)
        await deleteNoneSelected(g_viewer_manager.pathToViewerImage)
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to events.js
Array.from(document.getElementsByClassName('discardClass')).forEach(
    (element) => {
        element.addEventListener('click', async () => {
            //end session here
            await g_generation_session.endSession(
                session.GarbageCollectionState['Discard']
            ) //end session and remove all images
            g_ui.onEndSessionUI()

            // await discard()
        })
    }
)
//REFACTOR: move to events.js
// Array.from(document.getElementsByClassName('btnInterruptClass')).forEach(
//     (element) => {
//         element.addEventListener('click', async () => {
//             try {
//                 if (
//                     g_generation_session.request_status ===
//                     Enum.RequestStateEnum['Finished']
//                 ) {
//                     toggleTwoButtonsByClass(
//                         false,
//                         'btnGenerateClass',
//                         'btnInterruptClass'
//                     )
//                     g_can_request_progress = false

//                     return null // cann't inturrept a finished generation
//                 }
//                 g_generation_session.request_status =
//                     Enum.RequestStateEnum['Interrupted']

//                 g_batch_count_interrupt_status = true // interrupt batch count generations
//                 const backend_type = html_manip.getBackendType()

//                 if (backend_type === backendTypeEnum['HordeNative']) {
//                     //interrupt the horde

//                     await g_horde_generator.interrupt()
//                 } else {
//                     //interrupt auto1111

//                     json = await sdapi.requestInterrupt()
//                 }

//                 toggleTwoButtonsByClass(
//                     false,
//                     'btnGenerateClass',
//                     'btnInterruptClass'
//                 )
//                 g_can_request_progress = false

//                 // g_can_request_progress = toggleTwoButtons(false,'btnGenerate','btnInterrupt')
//             } catch (e) {
//                 // g_can_request_progress = toggleTwoButtons(false,'btnGenerate','btnInterrupt')
//                 toggleTwoButtonsByClass(
//                     false,
//                     'btnGenerateClass',
//                     'btnInterruptClass'
//                 )
//                 g_can_request_progress = false
//                 console.warn(e)
//             }
//         })
//     }
// )
//REFACTOR: move to psapi.js
//store active layers only if they are not stored.
async function storeActiveLayers() {
    setTimeout(async () => {
        const layers = await app.activeDocument.activeLayers
        console.log('storeActiveLayers: ', layers.length)

        if (layers.length > 0) {
            g_saved_active_layers = layers
            await psapi.unselectActiveLayersExe()
        }
    }, 200)

    // if (g_is_active_layers_stored == false) {
    //   g_saved_active_layers = await app.activeDocument.activeLayers
    //   g_is_active_layers_stored = true
    //   await psapi.unselectActiveLayersExe()
    // } else {
    // }
}
//REFACTOR: move to psapi.js
async function restoreActiveLayers() {
    const layers = await app.activeDocument.activeLayers
    console.log('restoreActiveLayers: ', layers.length)
    if (layers.length == 0) {
        await psapi.selectLayersExe(g_saved_active_layers)
        g_saved_active_layers = []
    }
    // if (g_is_active_layers_stored == true) {
    //   // g_saved_active_layers = await app.activeDocument.activeLayers
    //   await psapi.selectLayersExe(g_saved_active_layers)
    //   g_is_active_layers_stored = false
    //   g_saved_active_layers = []
    // }
}

//store active selection only if they are not stored.
//REFACTOR: move to psapi.js
async function storeActiveSelection() {
    try {
        setTimeout(async () => {
            const layers = await app.activeDocument.activeLayers
            const current_selection = await psapi.checkIfSelectionAreaIsActive()
            console.log('storeActiveSelection: ', current_selection)

            if (current_selection) {
                g_saved_active_selection = current_selection
                await psapi.unSelectMarqueeExe()
            }
        }, 200)
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to psapi.js
async function restoreActiveSelection() {
    try {
        const current_selection = await psapi.checkIfSelectionAreaIsActive()

        console.log('restoreActiveSelection: ', current_selection)
        if (
            !current_selection &&
            psapi.isSelectionValid(g_saved_active_selection)
        ) {
            await psapi.reSelectMarqueeExe(g_saved_active_selection)
            g_saved_active_selection = {}
        }
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to events.js
document.querySelector('#taPrompt').addEventListener('focus', async () => {
    // if (!g_generation_session.isLoadingActive) {
    //     console.log('taPrompt focus')
    //     // console.log('we are in prompt textarea')
    //     // console.log("g_is_active_layers_stored: ",g_is_active_layers_stored)
    //     await storeActiveLayers()
    //     await storeActiveSelection()
    //     // await psapi.unselectActiveLayersExe()
    // }
})
//REFACTOR: move to events.js
document.querySelector('#taPrompt').addEventListener('blur', async () => {
    // console.log('taPrompt blur')
    // // console.log('we are out of prompt textarea')
    // // await psapi.unselectActiveLayersExe()
    // // console.log("g_is_active_layers_stored: ",g_is_active_layers_stored)
    // await restoreActiveLayers()
    // await restoreActiveSelection()
})
//REFACTOR: move to events.js
document
    .querySelector('#taNegativePrompt')
    .addEventListener('focus', async () => {
        // if (!g_generation_session.isLoadingActive) {
        //     console.log('taNegativePrompt focus')
        //     // console.log('we are in prompt textarea')
        //     await storeActiveLayers()
        //     await storeActiveSelection()
        //     // await psapi.unselectActiveLayersExe()
        // }
    })
//REFACTOR: move to events.js
document
    .querySelector('#taNegativePrompt')
    .addEventListener('blur', async () => {
        // console.log('taNegativePrompt blur')
        // // console.log('we are out of prompt textarea')
        // // await psapi.unselectActiveLayersExe()
        // await restoreActiveLayers()
        // await restoreActiveSelection()
    })
//REFACTOR: unused, remove?
function updateMetadata(new_metadata) {
    const metadatas = []
    try {
        for (metadata of new_metadata) {
            metadata_json = JSON.parse(metadata)
            console.log('metadata_json:', metadata_json)
            metadatas.push(metadata_json)
        }
    } catch (e) {
        console.warn(e)
    }
    return metadatas
}

//REFACTOR: move to generation_settings.js
async function getExtraSettings() {
    let payload = {}
    try {
        const html_manip = require('./utility/html_manip')
        const upscaling_resize = html_manip.getUpscaleSize()
        const gfpgan_visibility = html_manip.getGFPGANVisibility()
        const codeformer_visibility = html_manip.getCodeFormerVisibility()
        const codeformer_weight = html_manip.getCodeFormerWeight()
        const selection_info = await psapi.getSelectionInfoExe()
        const width = selection_info.width * upscaling_resize
        const height = selection_info.height * upscaling_resize
        //resize_mode = 0 means "resize to upscaling_resize"
        //resize_mode = 1 means "resize to width and height"
        payload['resize_mode'] = 0
        payload['show_extras_results'] = 0
        payload['gfpgan_visibility'] = gfpgan_visibility
        payload['codeformer_visibility'] = codeformer_visibility
        payload['codeformer_weight'] = codeformer_weight
        payload['upscaling_resize'] = upscaling_resize
        payload['upscaling_resize_w'] = width
        payload['upscaling_resize_h'] = height
        payload['upscaling_crop'] = true
        const upscaler1 = document.querySelector('#hrModelsMenuUpscale1').value
        payload['upscaler_1'] = upscaler1 === undefined ? 'None' : upscaler1
        const upscaler2 = document.querySelector('#hrModelsMenuUpscale2').value
        payload['upscaler_2'] = upscaler2 === undefined ? 'None' : upscaler2
        const extras_upscaler_2_visibility = html_manip.getUpscaler2Visibility()
        payload['extras_upscaler_2_visibility'] = extras_upscaler_2_visibility
        payload['upscale_first'] = false
        const uniqueDocumentId = await getUniqueDocumentId()
        payload['uniqueDocumentId'] = uniqueDocumentId

        // const layer = await app.activeDocument.activeLayers[0]
        const layer = await app.activeDocument.activeLayers[0]
        const old_name = layer.name

        // image_name = await app.activeDocument.activeLayers[0].name

        //convert layer name to a file name
        let image_name = psapi.layerNameToFileName(
            old_name,
            layer.id,
            random_session_id
        )
        image_name = `${image_name}.png`

        const base64_image = g_generation_session.activeBase64InitImage

        payload['image'] = base64_image
    } catch (e) {
        console.error(e)
    }
    return payload
}
//REFACTOR: move to generation.js
async function generateImg2Img(settings) {
    let json = {}
    try {
        const backend_type = html_manip.getBackendType()
        if (backend_type === backendTypeEnum['HordeNative']) {
            json = await g_horde_generator.generate()
            // json = await g_horde_generator.toGenerationFormat(images_info)
            // json = { images_info: images_info }
        } else if (
            backend_type === backendTypeEnum['Auto1111'] ||
            backend_type === backendTypeEnum['Auto1111HordeExtension']
        ) {
            //checks on index 0 as if not enabled ingores the rest
            const b_enable_control_net = control_net.isControlNetModeEnable()

            if (b_enable_control_net) {
                //use control net
                json = await sdapi.requestControlNetImg2Img(settings)
            } else {
                json = await sdapi.requestImg2Img(settings)
            }
        }
    } catch (e) {
        console.warn(e)
        json = {}
    }

    return json
}
//REFACTOR: move to generation.js
async function generateTxt2Img(settings) {
    let json = {}
    try {
        const backend_type = html_manip.getBackendType()
        if (backend_type === backendTypeEnum['HordeNative']) {
            json = await g_horde_generator.generate()
            // json = await g_horde_generator.toGenerationFormat(images_info)
            // json = { images_info: images_info }
        } else if (
            backend_type === backendTypeEnum['Auto1111'] ||
            backend_type === backendTypeEnum['Auto1111HordeExtension']
        ) {
            // const b_enable_control_net = control_net.getEnableControlNet()
            const b_enable_control_net = control_net.isControlNetModeEnable()

            if (b_enable_control_net) {
                //use control net

                json = await sdapi.requestControlNetTxt2Img(settings)
            } else {
                json = await sdapi.requestTxt2Img(settings)
            }
        }
    } catch (e) {
        console.warn(e)
        json = {}
    }

    return json
}
//REFACTOR: move to selection.js
async function hasSelectionChanged(new_selection, old_selection) {
    if (
        new_selection.left === old_selection.left &&
        new_selection.bottom === old_selection.bottom &&
        new_selection.right === old_selection.right &&
        new_selection.top === old_selection.top
    ) {
        return false
    } else {
        return true
    }
}
//REFACTOR: move to generation.js
async function easyModeGenerate(mode) {
    try {
        //save laso selection
        if (g_is_laso_inapint_mode) {
            await selection.makeMaskChannelExe('mask')
        }
    } catch (e) {
        console.warn(e)
    }

    try {
        if (
            g_generation_session.request_status !==
            Enum.RequestStateEnum['Finished']
        ) {
            app.showAlert(
                'A generation is still active in the background. \nPlease check your Automatic1111 command line.'
            )
            return null
        }

        g_generation_session.request_status =
            Enum.RequestStateEnum['Generating']
        await executeAsModal(async (context) => {
            const document_type = await findDocumentType()

            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id, //TODO: change this to the session document id
                name: 'Correct Background',
            })
            //store selection
            //store active layer
            const selectionInfo = await psapi.getSelectionInfoExe()
            await psapi.unSelectMarqueeExe()
            const active_layers = app.activeDocument.activeLayers

            //1)check if the documnet has a background layer

            await correctDocumentType(document_type)

            //retore selection
            //restore active layer
            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.selectLayersExe(active_layers)
            await context.hostControl.resumeHistory(history_id)
        })

        // if (
        //     (await layer_util.hasBackgroundLayer()) === false && //doesn't have backround layer
        //     (await note.Notification.backgroundLayerIsMissing()) === false //and the user cancled the creation of background layer
        // ) {
        //     // const is_canceld  =
        //     //     await note.Notification.backgroundLayerIsMissing() //

        //     return false
        // }
        const backend_type = html_manip.getBackendType()
        if (
            backend_type === backendTypeEnum['Auto1111'] ||
            backend_type === backendTypeEnum['Auto1111HordeExtension']
        ) {
            g_automatic_status = await checkAutoStatus()
            await displayNotification(g_automatic_status)
            if (
                g_automatic_status === Enum.AutomaticStatusEnum['Offline'] ||
                g_automatic_status === Enum.AutomaticStatusEnum['RunningNoApi']
            ) {
                g_generation_session.request_status =
                    Enum.RequestStateEnum['Finished']
                return false
            }
        }

        let active_layer = await app.activeDocument.activeLayers[0] // store the active layer so we could reselected after the session end clean up
        //make sure you have selection area active on the canvas
        const isSelectionAreaValid = await psapi.checkIfSelectionAreaIsActive()
        if (
            !isSelectionAreaValid && // no selection area
            (await note.Notification.inactiveSelectionArea(
                g_generation_session.isActive()
            )) === false // means did not activate the session selection area if it's available
        ) {
            g_generation_session.request_status =
                Enum.RequestStateEnum['Finished']
            return null
        }

        console.log('easyModeGenerate mdoe: ', mode)
        if (psapi.isSelectionValid(g_generation_session.selectionInfo)) {
            // check we have an old selection stored
            const new_selection = await psapi.getSelectionInfoExe()
            if (
                await hasSelectionChanged(
                    new_selection,
                    g_generation_session.selectionInfo
                )
            ) {
                // check the new selection is difference than the old
                // end current session
                g_generation_session.selectionInfo = new_selection
                try {
                    await g_generation_session.endSession(
                        session.GarbageCollectionState['Accept']
                    ) //end session and accept all images
                    g_ui.onEndSessionUI()

                    // await acceptAll()
                } catch (e) {
                    console.warn(e)
                }
            }
        } else {
            // store selection value
            g_generation_session.selectionInfo =
                await psapi.getSelectionInfoExe()
        }

        if (g_generation_session.isActive()) {
            //active session

            if (g_generation_session.mode !== mode) {
                //active session but it's a new mode

                await g_generation_session.endSession(
                    session.GarbageCollectionState['Accept']
                )
                g_ui.onEndSessionUI()
                //start new session after you ended the old one
                await g_generation_session.startSession()

                g_generation_session.mode = mode
            }
        } else {
            // new session
            g_generation_session.mode = mode
            await g_generation_session.startSession() //start the session and create a output folder
        }

        await psapi.selectLayersExe([active_layer]) //reselect the active layer since the clean up of the session sometime will change which layer is selected
        let init_image
        let mask
        if (mode === 'txt2img') {
            //Note: keep it for clearity/ readibility
        } else if (mode === 'img2img' || mode === 'upscale') {
            // await snapAndFillHandler()
            init_image = await io.getImg2ImgInitImage()
            g_generation_session.activeBase64InitImage = init_image
        } else if (mode === 'inpaint') {
            // await btnInitInpaintHandler()

            if (g_is_laso_inapint_mode) {
                await selection.channelToSelectionExe('mask')
                const [init_image_base64, mask_base64] =
                    await selection.inpaintLassoInitImageAndMask()
                init_image = init_image_base64
                mask = mask_base64
                g_generation_session.activeBase64InitImage = init_image
                g_generation_session.activeBase64MaskImage = mask
            } else {
                //normal inpaint
                try {
                    await executeAsModal(async () => {
                        g_inpaint_mask_layer.opacity = 100
                    })
                } catch (e) {
                    console.warn(e)
                }
                const obj = await io.getInpaintInitImageAndMask()

                init_image = obj.init_image
                g_generation_session.activeBase64InitImage = init_image
                mask = obj.mask
                g_generation_session.activeBase64MaskImage = mask
            }
        } else if (mode === 'outpaint') {
            // await easyModeOutpaint()
            const obj = await io.getOutpaintInitImageAndMask()
            init_image = obj.init_image
            g_generation_session.activeBase64InitImage = init_image
            mask = obj.mask
            g_generation_session.activeBase64MaskImage = mask
        }

        //safe to close the previous generation_session outputfolder, since closing a folder will unselect any layer in it.
        ////and the plugin may still need those layers for inpainting mode for example.

        await g_generation_session.closePreviousOutputGroup()

        const settings =
            mode === 'upscale' ? await getExtraSettings() : await getSettings()

        if (mode === 'img2img') {
            // const init_image = await io.getImg2ImgInitImage()
            settings['init_images'] = [init_image]
        } else if (mode === 'inpaint') {
            // const { init_image, mask } = await io.getInpaintInitImageAndMask()
            settings['init_images'] = [init_image]
            // settings['mask'] = mask
        } else if (mode === 'outpaint') {
            settings['init_images'] = [init_image]
            // settings['mask'] = mask
        }
        g_generation_session.last_settings = settings

        async function updateViewerStore(store, images) {
            try {
                if (typeof images === 'undefined' || !images) {
                    return null
                }
                store.data.images = images
                const thumbnail_list = []
                for (const base64 of images) {
                    const thumbnail = await io.createThumbnail(base64, 300)
                    thumbnail_list.push(thumbnail)
                }

                store.data.thumbnails = thumbnail_list
            } catch (e) {
                console.warn(e)
                console.warn('images: ', images)
            }
        }

        await updateViewerStore(viewer.init_store, settings?.init_images)
        await updateViewerStore(viewer.mask_store, [settings?.mask])

        // g_generation_session.is_control_net = control_net.getEnableControlNet()
        g_generation_session.is_control_net =
            control_net.isControlNetModeEnable()

        await generate(settings, mode)

        // await g_generation_session.deleteProgressLayer() // delete the old progress layer
        await g_generation_session.deleteProgressImage()
    } catch (e) {
        await g_generation_session.deleteProgressImage()
        console.warn(e)
        g_generation_session.request_status = Enum.RequestStateEnum['Finished']
    }
    toggleTwoButtonsByClass(false, 'btnGenerateClass', 'btnInterruptClass')
    g_can_request_progress = false

    g_generation_session.request_status = Enum.RequestStateEnum['Finished']

    if (g_generation_session.sudo_timer_id) {
        //disable the sudo timer at the end of the generation
        g_generation_session.sudo_timer_id = clearInterval(
            g_generation_session.sudo_timer_id
        )
    }
}

//REFACTOR: move to generation.js
async function generate(settings, mode) {
    try {
        //pre generation
        // toggleGenerateInterruptButton(true)

        // const isFirstGeneration = !(g_is_generation_session_active) // check if this is the first generation in the session
        // const isFirstGeneration = !(g_generation_session.isActive()) // check if this is the first generation in the session
        const isFirstGeneration = g_generation_session.isFirstGeneration

        // g_generation_session.startSession()
        g_generation_session.activate()

        g_ui.onStartSessionUI()
        // toggleTwoButtons(true,'btnGenerate','btnInterrupt')
        toggleTwoButtonsByClass(true, 'btnGenerateClass', 'btnInterruptClass')
        g_can_request_progress = true
        //wait 2 seconds till you check for progress

        if (
            html_manip.getBackendType() !== backendTypeEnum['HordeNative'] // anything other than horde native
        ) {
            setTimeout(async function () {
                // change this to setInterval()
                await progressRecursive()
            }, 2000)
        }

        if (
            html_manip.getBackendType() === backendTypeEnum['Auto1111'] &&
            g_generation_session.is_control_net
        ) {
            g_generation_session.sudo_timer_id = general.sudoTimer()
        }

        console.log(settings)

        g_generation_session.request_status =
            Enum.RequestStateEnum['Generating']
        let json = {}
        if (mode == 'txt2img') {
            json = await generateTxt2Img(settings)
        } else if (
            mode == 'img2img' ||
            mode == 'inpaint' ||
            mode == 'outpaint'
        ) {
            // json = await sdapi.requestImg2Img(settings)

            json = await generateImg2Img(settings)
        } else if (mode == 'upscale') {
            json = await sdapi.requestExtraSingleImage(settings)
        }

        // if (g_sd_mode == 'outpaint') {
        //     // await easyModeOutpaint()
        //     json = await sdapi.requestImg2Img(settings)

        //     // await setTimeout(async ()=> {
        //     //   json = await sdapi.requestImg2Img(settings)

        //     // },5000)
        // }
        if (
            g_generation_session.request_status ===
            Enum.RequestStateEnum['Interrupted']
        ) {
            //when generate request get interrupted. reset progress bar to 0, discard any meta data and images returned from the proxy server by returning from the function.
            html_manip.updateProgressBarsHtml(0)
            console.log(
                'before delete g_generation_session.progress_layer: ',
                g_generation_session.progress_layer
            )
            await g_generation_session.deleteProgressImage()
            console.log(
                'after delete g_generation_session.progress_layer: ',
                g_generation_session.progress_layer
            )
            //check whether request was "generate" or "generate more"
            //if it's generate discard the session
            if (isFirstGeneration) {
                await loadViewerImages()
                await g_generation_session.endSession(
                    session.GarbageCollectionState['Discard']
                ) //end session and delete all images
                g_ui.onEndSessionUI()

                // //delete all mask related layers
            }
            g_generation_session.request_status =
                Enum.RequestStateEnum['Finished']
            return null
        }

        // check if json is empty {}, {} means the proxy server didn't return a valid data
        if (Object.keys(json).length === 0) {
            if (isFirstGeneration) {
                await g_generation_session.endSession(
                    session.GarbageCollectionState['Discard']
                ) //end session and delete all images
                g_ui.onEndSessionUI()

                // //delete all mask related layers
            }
            g_generation_session.request_status =
                Enum.RequestStateEnum['Finished']
            return null
        }

        //post generation: will execute only if the generate request doesn't get interrupted
        //get the updated metadata from json response

        // g_metadatas = updateMetadata(json.images_info.auto_metadata)
        g_last_seed = json.images_info[0]?.auto_metadata?.Seed
        //finished generating, set the button back to generate

        // toggleTwoButtons(false,'btnGenerate','btnInterrupt')
        toggleTwoButtonsByClass(false, 'btnGenerateClass', 'btnInterruptClass')
        g_can_request_progress = false
        html_manip.updateProgressBarsHtml(0)

        const images_info = json?.images_info
        // gImage_paths = images_info.images_paths
        //open the generated images from disk and load them onto the canvas
        // const b_use_silent_import =
        //     document.getElementById('chUseSilentMode').checked

        if (isFirstGeneration) {
            //this is new generation session

            // g_generation_session.image_paths_to_layers =
            //     await silentImagesToLayersExe(images_info)

            g_generation_session.base64OutputImages = {} //delete all previouse images, Note move this to session end ()
            for (const image_info of images_info) {
                const path = image_info['path']
                const base64_image = image_info['base64']
                g_generation_session.base64OutputImages[path] = base64_image
                const [document_name, image_name] = path.split('/')
                await io.saveFileInSubFolder(
                    base64_image,
                    document_name,
                    image_name
                ) //save the output image
                const json_file_name = `${image_name.split('.')[0]}.json`
                settings['auto_metadata'] = image_info?.auto_metadata
                await io.saveJsonFileInSubFolder(
                    settings,
                    document_name,
                    json_file_name
                ) //save the settings
            }

            g_number_generation_per_session = 1
            g_generation_session.isFirstGeneration = false
        } else {
            // generation session is active so we will generate more

            // let last_images_paths = await silentImagesToLayersExe(images_info)

            for (const image_info of images_info) {
                const path = image_info['path']
                const base64_image = image_info['base64']
                g_generation_session.base64OutputImages[path] = base64_image
                const [document_name, image_name] = path.split('/')
                await io.saveFileInSubFolder(
                    base64_image,
                    document_name,
                    image_name
                )
                const json_file_name = `${image_name.split('.')[0]}.json`
                settings['auto_metadata'] = image_info?.auto_metadata
                await io.saveJsonFileInSubFolder(
                    settings,
                    document_name,
                    json_file_name
                ) //save the settings
            }

            // g_generation_session.image_paths_to_layers = {
            //     ...g_generation_session.image_paths_to_layers,
            //     ...last_images_paths,
            // }
            g_number_generation_per_session++
        }
        await psapi.reSelectMarqueeExe(g_generation_session.selectionInfo)
        //update the viewer
        const base64_list = Object.entries(
            g_generation_session.base64OutputImages
        ).map((obj) => obj[1] ?? '')

        const thumbnail_list = []
        for (const base64 of base64_list) {
            const thumbnail = await io.createThumbnail(base64, 300)
            thumbnail_list.push(thumbnail)
        }

        viewer.store.updateProperty('thumbnails', thumbnail_list)
        viewer.store.updateProperty('images', base64_list)
        //load react viewer
        //*) extract thumbnails
        //*) extract images
        //*) on thumbnail click
        //*) delete previous layer if it exist
        //*) load image to canvas
        //*)

        //
        await loadViewerImages()

        //esnures that progress bars are set to 0 (as last progress request call might have returned less than 100%)
        updateProgressBarsHtml(0)
    } catch (e) {
        console.error(`btnGenerate.click(): `, e)
        g_generation_session.request_status = Enum.RequestStateEnum['Finished']
    }
    g_generation_session.request_status = Enum.RequestStateEnum['Finished']
}
//REFACTOR: move to events.js
Array.from(document.getElementsByClassName('btnGenerateClass')).forEach(
    (btn) => {
        btn.addEventListener('click', async (evt) => {
            tempDisableElement(evt.target, 5000)
            const numberOfBatchCount = parseInt(
                document.querySelector('#tiNumberOfBatchCount').value
            )
            for (let i = 0; i < numberOfBatchCount; i++) {
                if (g_batch_count_interrupt_status === true) {
                    break
                }
                g_current_batch_index = i
                await easyModeGenerate(g_sd_mode)
            }
            g_batch_count_interrupt_status = false // reset for next generation
            g_current_batch_index = 0 // reset curent_batch_number
        })
    }
) //REFACTOR: move to events.js

document
    .getElementById('btnRefreshModels')
    .addEventListener('click', async (e) => {
        await refreshUI()
        await sd_tab.refreshSDTab()
        tempDisableElement(e.target, 3000)
    })
//REFACTOR: move to events.js
document.querySelector('#mModelsMenu').addEventListener('change', (evt) => {
    const model_index = evt.target.selectedIndex
    console.log(`Selected item: ${evt.target.selectedIndex}`)
    let model = g_models[0]
    if (model_index < g_models.length) {
        model = g_models[model_index]
    }
    // g_model_name = `${model.model_name}.ckpt`
    g_model_title = model.title
    console.log('g_model_title: ', g_model_title)
    sdapi.requestSwapModel(g_model_title)
})
//REFACTOR: move to events.js
document.querySelectorAll('.btnLayerToSelection').forEach((el) => {
    el.addEventListener('click', async () => {
        try {
            const isSelectionAreaValid =
                await psapi.checkIfSelectionAreaIsActive()
            if (isSelectionAreaValid) {
                const validSelection = isSelectionAreaValid
                await psapi.layerToSelection(validSelection)
            } else {
                await psapi.promptForMarqueeTool()
            }
        } catch (e) {
            console.warn(e)
        }
    })
})

//REFACTOR: move to events.js
document
    .getElementById('btnSetInitImageViewer')
    .addEventListener('click', async () => {
        //set init image event listener, use when session is active
        const layer = await app.activeDocument.activeLayers[0]
        const image_info = await psapi.silentSetInitImage(
            layer,
            random_session_id
        )
        const image_name = image_info['name']
        const path = `./server/python_server/init_images/${image_name}`
        g_viewer_manager.addInitImageLayers(layer, path, false)
        await g_viewer_manager.loadInitImageViewerObject(path)
        // await loadInitImageViewerObject(
        //     group,
        //     snapshot,
        //     solid_background,
        //     path,
        //     auto_delete,
        //     base64_image
        // )
    })
//REFACTOR: move to psapi.js
async function setMaskViewer() {
    try {
        await executeAsModal(async () => {
            if (g_viewer_manager.mask_solid_background) {
                g_viewer_manager.mask_solid_background.visible = true
            }
        })
        const layer = g_viewer_manager.maskGroup
        // const layer = await app.activeDocument.activeLayers[0]
        const mask_info = await psapi.silentSetInitImageMask(
            layer,
            random_session_id
        )
        const image_name = mask_info['name']
        const path = `./server/python_server/init_images/${image_name}`
        g_viewer_manager.addMaskLayers(layer, path, false, mask_info['base64']) //can be autodeleted?
        await psapi.unselectActiveLayersExe()
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to events.js
document
    .getElementById('btnSetMaskViewer')
    .addEventListener('click', async () => {
        await setMaskViewer()
    })

//REFACTOR: move to psapi.js
function moveElementToAnotherTab(elementId, newParentId) {
    const element = document.getElementById(elementId)
    document.getElementById(newParentId).appendChild(element)
}

// moveElementToAnotherTab("batchNumberUi","batchNumberViewerTabContainer")
//REFACTOR: move to ui.js
function updateProgressBarsHtml(new_value) {
    document.querySelectorAll('.pProgressBars').forEach((el) => {
        // id = el.getAttribute("id")
        // console.log("progressbar id:", id)
        el.setAttribute('value', new_value)
    })
    document.querySelectorAll('.lProgressLabel').forEach((el) => {
        console.log('updateProgressBarsHtml: ', new_value)
        if (new_value > 0) el.innerHTML = 'In progress...'
        else el.innerHTML = 'No work in progress'
    })
    // document.querySelector('#pProgressBar').value
}
//REFACTOR: move to ui.js
async function updateProgressImage(progress_base64) {
    try {
        await executeAsModal(async (context) => {
            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id, //TODO: change this to the session document id
                name: 'Progress Image',
            })
            await g_generation_session.deleteProgressLayer() // delete the old progress layer

            //update the progress image
            const selection_info = await g_generation_session.selectionInfo
            const b_exsit = layer_util.Layer.doesLayerExist(
                g_generation_session.progress_layer
            )
            if (!b_exsit) {
                const layer = await io.IO.base64ToLayer(
                    progress_base64,
                    'temp_progress_image.png',
                    selection_info.left,
                    selection_info.top,
                    selection_info.width,
                    selection_info.height
                )
                g_generation_session.progress_layer = layer // sotre the new progress layer// TODO: make sure you delete the progress layer when the geneeration request end
            } else {
                // if ,somehow, the layer still exsit
                await layer_util.deleteLayers([
                    g_generation_session.progress_layer,
                ]) // delete the old progress layer
            }
            await context.hostControl.resumeHistory(history_id)
        })
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to ui.js
async function progressRecursive() {
    try {
        let json = await sdapi.requestProgress()
        // document.querySelector('#pProgressBar').value = json.progress * 100
        const progress_value = json.progress * 100
        if (g_generation_session.sudo_timer_id) {
            //for sudo timer update
            //for controlnet only: disable the sudo timer when the real timer start
            //
            if (progress_value > 1) {
                //disable the sudo timer at the end of the generation
                g_generation_session.sudo_timer_id = clearInterval(
                    g_generation_session.sudo_timer_id
                )
            }
        } else {
            //for normal progress bar

            html_manip.updateProgressBarsHtml(progress_value)
        }

        if (
            json?.current_image &&
            g_generation_session.request_status ===
                Enum.RequestStateEnum['Generating']
        ) {
            const base64_url = general.base64ToBase64Url(json.current_image)
            preview.store.updateProperty('image', json.current_image)

            const progress_image_html = document.getElementById('progressImage')
            const container_width = document.querySelector(
                '#divProgressImageViewerContainer'
            ).offsetWidth
            //*) find the parent container width
            //*) set the width of the image to auto
            //*) scale to closest while keeping the ratio, the hieght should not be larger than the width of the container

            // height: 10000px;
            // width: auto;
            // background-size: contain;

            // progress_image_html.style.backgroundSize = 'contain'
            // progress_image_html.style.height = '10000px'

            // document.getElementById(
            //     'divProgressImageViewerContainer'
            // ).style.backgroundImage = `url('${base64_url}')`

            html_manip.setProgressImageSrc(base64_url)

            // if (progress_image_html.style.width !== 'auto') {
            //     progress_image_html.style.width = 'auto'
            // }
            // if ((progress_image_html.style.height = 'auto' !== 'auto')) {
            //     progress_image_html.style.height = 'auto'
            // }

            // progress_image_html = new_height
            // progress_image_html.style.width = progress_image_html.naturalWidth
            // progress_image_html.style.height = progress_image_html.naturalHeight

            if (
                g_generation_session.last_settings.batch_size === 1 &&
                settings_tab.getUseLiveProgressImage()
            ) {
                //only update the canvas if the number of images are one
                //don't update the canvas with multiple images.
                await updateProgressImage(json.current_image)
            }
        }
        if (g_generation_session.isActive() && g_can_request_progress == true) {
            //refactor this code
            setTimeout(async () => {
                await progressRecursive()
            }, 1000)
        }
    } catch (e) {
        console.warn(e)
        if (
            g_generation_session.isActive() &&
            g_can_request_progress === true
        ) {
            setTimeout(async () => {
                await progressRecursive()
            }, 1000)
        }
    }
}
//REFACTOR: move to ui.js
function changeImage() {
    let img = document.getElementById('img1')
    img.src = 'https://source.unsplash.com/random'
}

// document.getElementById('btnChangeImage').addEventListener('click', changeImage)
//REFACTOR: move to psapi.js
async function imageToSmartObject() {
    const { batchPlay } = require('photoshop').action
    const { executeAsModal } = require('photoshop').core

    try {
        // const file = await fs.getFileForOpening()
        // token = await fs.getEntryForPersistentToken(file);
        // const entry = await fs.getEntryForPersistentToken(token);
        // const session_token = await fs.createSessionToken(entry);
        // // let token = await fs.createSessionToken(entry)
        await executeAsModal(
            async () => {
                console.log('imageToSmartObject():')
                const storage = require('uxp').storage
                const fs = storage.localFileSystem
                let pluginFolder = await fs.getPluginFolder()
                let img = await pluginFolder.getEntry(
                    'output- 1672730735.1670313.png'
                )
                const result = await batchPlay(
                    [
                        {
                            _obj: 'placeEvent',
                            ID: 95,
                            null: {
                                _path: img,
                                _kind: 'local',
                            },
                            freeTransformCenterState: {
                                _enum: 'quadCenterState',
                                _value: 'QCSAverage',
                            },
                            offset: {
                                _obj: 'offset',
                                horizontal: {
                                    _unit: 'pixelsUnit',
                                    _value: 0,
                                },
                                vertical: {
                                    _unit: 'pixelsUnit',
                                    _value: 0,
                                },
                            },
                            replaceLayer: {
                                _obj: 'placeEvent',
                                from: {
                                    _ref: 'layer',
                                    _id: 56,
                                },
                                to: {
                                    _ref: 'layer',
                                    _id: 70,
                                },
                            },
                            _options: {
                                dialogOptions: 'dontDisplay',
                            },
                        },
                    ],
                    {
                        synchronousExecution: true,
                        modalBehavior: 'execute',
                    }
                )
            },
            {
                commandName: 'Create Label',
            }
        )
    } catch (e) {
        console.log('imageToSmartObject() => error: ')
        console.warn(e)
    }
}

// document.getElementById('btnNewLayer').addEventListener('click', imageToSmartObject )
//REFACTOR: move to psapi.js
async function placeEmbedded(image_name, dir_entery) {
    //silent importer

    try {
        // console.log('placeEmbedded(): image_path: ', image_path)

        const formats = require('uxp').storage.formats
        const storage = require('uxp').storage
        const fs = storage.localFileSystem
        // const names = image_path.split('/')
        // const length = names.length
        // const image_name = names[length - 1]
        // const project_name = names[length - 2]
        let image_dir = dir_entery
        // const image_dir = `./server/python_server/output/${project_name}`
        // image_path = "output/f027258e-71b8-430a-9396-0a19425f2b44/output- 1674323725.126322.png"

        // let img_dir = await .getEntry(image_dir)
        // const file = await img_dir.createFile('output- 1674298902.0571606.png', {overwrite: true});

        const file = await image_dir.createFile(image_name, { overwrite: true })

        const img = await file.read({ format: formats.binary })
        const token = await storage.localFileSystem.createSessionToken(file)
        let place_event_result
        await executeAsModal(async () => {
            const result = await batchPlay(
                [
                    {
                        _obj: 'placeEvent',
                        ID: 6,
                        null: {
                            _path: token,
                            _kind: 'local',
                        },
                        freeTransformCenterState: {
                            _enum: 'quadCenterState',
                            _value: 'QCSAverage',
                        },
                        offset: {
                            _obj: 'offset',
                            horizontal: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                            vertical: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                        },
                        _isCommand: true,
                        _options: {
                            dialogOptions: 'dontDisplay',
                        },
                    },
                ],
                {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                }
            )
            console.log('placeEmbedd batchPlay result: ', result)

            place_event_result = result[0]
        })

        return place_event_result
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to psapi.js
function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64)
    var len = binary_string.length
    var bytes = new Uint8Array(len)
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
}
//REFACTOR: move to psapi.js
function _arrayBufferToBase64(buffer) {
    var binary = ''
    var bytes = new Uint8Array(buffer)
    var len = bytes.byteLength
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}

//REFACTOR: move to io.js
async function getDocFolder(doc_uuid) {
    try {
        // const uuid = await getUniqueDocumentId()
        const data_folder = await storage.localFileSystem.getDataFolder()

        let doc_folder
        try {
            doc_folder = await data_folder.getEntry(doc_uuid)
        } catch (e) {
            console.warn(e)
            //create document folder
            doc_folder = await data_folder.createFolder(doc_uuid)
        }

        return doc_folder
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to document.js
async function getCurrentDocFolder() {
    //move to a global utililty lib
    const uuid = await getUniqueDocumentId()

    let doc_folder = await getDocFolder(uuid)
    return doc_folder
}
//REFACTOR: move to document.js
async function getInitImagesDir() {
    const uuid = await getUniqueDocumentId()

    let doc_folder = await getDocFolder(uuid)
    let init_folder
    try {
        init_folder = await doc_folder.getEntry('init_images')
    } catch (e) {
        console.warn(e)
        //create document folder
        init_folder = await doc_folder.createFolder('init_images')
    }
    return init_folder
}

//REFACTOR: move to document.js
async function base64ToFile(b64Image, image_name = 'output_image.png') {
    // const b64Image =
    //     'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC'
    try {
        const img = _base64ToArrayBuffer(b64Image)

        const img_name = image_name

        const folder = await storage.localFileSystem.getTemporaryFolder()
        const file = await folder.createFile(img_name, { overwrite: true })

        await file.write(img, { format: storage.formats.binary })

        const token = await storage.localFileSystem.createSessionToken(file) // batchPlay requires a token on _path

        let place_event_result
        let imported_layer
        await executeAsModal(async () => {
            const result = await batchPlay(
                [
                    {
                        _obj: 'placeEvent',
                        // ID: 6,
                        null: {
                            _path: token,
                            _kind: 'local',
                        },
                        freeTransformCenterState: {
                            _enum: 'quadCenterState',
                            _value: 'QCSAverage',
                        },
                        offset: {
                            _obj: 'offset',
                            horizontal: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                            vertical: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                        },
                        _isCommand: true,
                        _options: {
                            dialogOptions: 'dontDisplay',
                        },
                    },
                ],
                {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                }
            )
            console.log('placeEmbedd batchPlay result: ', result)

            place_event_result = result[0]
            imported_layer = await app.activeDocument.activeLayers[0]
        })
        return imported_layer
    } catch (e) {
        console.warn(e)
    }

    // return place_event_result
}
//REFACTOR: move to psapi.js
async function placeImageB64ToLayer(image_path, entery) {
    //silent importer

    try {
        console.log('placeEmbedded(): image_path: ', image_path)

        const formats = require('uxp').storage.formats
        const storage = require('uxp').storage
        const fs = storage.localFileSystem

        const names = image_path.split('/')
        const length = names.length
        const image_name = names[length - 1]
        const project_name = names[length - 2]
        let pluginFolder = await fs.getPluginFolder()

        const image_dir = `./server/python_server/output/${project_name}`
        // image_path = "output/f027258e-71b8-430a-9396-0a19425f2b44/output- 1674323725.126322.png"

        let img_dir = await pluginFolder.getEntry(image_dir)
        // const file = await img_dir.createFile('output- 1674298902.0571606.png', {overwrite: true});

        const file = await img_dir.createFile(image_name, { overwrite: true })

        const img = await file.read({ format: formats.binary })
        const token = await storage.localFileSystem.createSessionToken(file)
        let place_event_result
        await executeAsModal(async () => {
            const result = await batchPlay(
                [
                    {
                        _obj: 'placeEvent',
                        ID: 6,
                        null: {
                            _path: token,
                            _kind: 'local',
                        },
                        freeTransformCenterState: {
                            _enum: 'quadCenterState',
                            _value: 'QCSAverage',
                        },
                        offset: {
                            _obj: 'offset',
                            horizontal: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                            vertical: {
                                _unit: 'pixelsUnit',
                                _value: 0,
                            },
                        },
                        _isCommand: true,
                        _options: {
                            dialogOptions: 'dontDisplay',
                        },
                    },
                ],
                {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                }
            )
            console.log('placeEmbedd batchPlay result: ', result)

            place_event_result = result[0]
        })

        return place_event_result
    } catch (e) {
        console.warn(e)
    }
}

// document.getElementById('btnImageFileToLayer').addEventListener('click', placeEmbedded)

// open an image in the plugin folder as new document
//REFACTOR: move to document.js
async function openImageAction() {
    const storage = require('uxp').storage
    const fs = storage.localFileSystem
    try {
        let pluginFolder = await fs.getPluginFolder()
        // let theTemplate = await pluginFolder.getEntry("/image1.png");
        //directory where all image's request folders are. one folder for each request
        const relative_dir_path = `./server/python_server/`

        const image_path = `${relative_dir_path}/${gCurrentImagePath}`
        // 'C:/Users/abdul/Desktop/photoshop_plugins/my_plugin_1/server/python_server/output- 1670544300.95411.png'
        let theTemplate = await pluginFolder.getEntry(image_path)

        await app.open(theTemplate)
    } catch (e) {
        console.warn("couldn't open image ", e)
    }
}
//REFACTOR: move to psapi.js
async function openImageExe() {
    await require('photoshop').core.executeAsModal(openImageAction)
}
// document.getElementById('btnImagesToLayers').addEventListener('click',openImageExe)

// convert a layer to a smart object
async function convertToSmartObjectAction() {
    const batchPlay = require('photoshop').action.batchPlay
    const result = await batchPlay(
        [
            {
                _obj: 'newPlacedLayer',
                _isCommand: true,
                _options: {
                    dialogOptions: 'dontDisplay',
                },
            },
        ],
        {}
    )
}
//REFACTOR: move to psapi.js
async function convertToSmartObjectExe() {
    await require('photoshop').core.executeAsModal(convertToSmartObjectAction)
}

async function ImagesToLayersExe(images_paths) {
    g_generation_session.isLoadingActive = true

    await psapi.reSelectMarqueeExe(g_generation_session.selectionInfo)
    image_path_to_layer = {}
    console.log('ImagesToLayersExe: images_paths: ', images_paths)
    for (image_path of images_paths) {
        gCurrentImagePath = image_path
        console.log(gCurrentImagePath)
        await openImageExe() //local image to new document
        await convertToSmartObjectExe() //convert the current image to smart object
        if (g_b_use_smart_object === false) {
            await executeAsModal(async () => {
                await app.activeDocument.activeLayers[0].rasterize() //rastrize the active layer
            })
        }
        await stackLayers() // move the smart object to the original/old document
        await psapi.layerToSelection(g_generation_session.selectionInfo) //transform the new smart object layer to fit selection area
        layer = await app.activeDocument.activeLayers[0]
        image_path_to_layer[image_path] = layer
        // await reselect(selectionInfo)
    }
    return image_path_to_layer
}
//REFACTOR: unused, remove?
async function silentImagesToLayersExe_old(images_info) {
    try {
        g_generation_session.isLoadingActive = true

        await psapi.reSelectMarqueeExe(g_generation_session.selectionInfo)
        image_path_to_layer = {}
        console.log(
            'silentImagesToLayersExe: images_info.images_paths: ',
            images_info.images_paths
        )
        // Returns a Promise that resolves after "ms" Milliseconds
        const timer = (ms) => new Promise((res) => setTimeout(res, ms))

        for (image_info of images_info) {
            console.log(gCurrentImagePath)
            //unselect all layers so that the imported layer get place at the top of the document
            await psapi.unselectActiveLayersExe()

            let placeEventResult
            // if (base64_images) {
            //     placeEventResult = await base64ToFile(base64_images) //silent import into the document
            // } else {
            //     placeEventResult = await placeEmbedded(image_path) //silent import into the document
            // }
            placeEventResult = await base64ToFile(image_info.base64) //silent import into the document

            let layer = await app.activeDocument.layers.filter(
                (l) => l.id === placeEventResult?.ID
            )[0]
            // await openImageExe() //local image to new document
            // await convertToSmartObjectExe() //convert the current image to smart object
            let timer_count = 0

            // let layer = await app.activeDocument.activeLayers[0]
            console.log('loaded layer: ', layer)
            console.log('placeEventResult?.ID: ', placeEventResult?.ID)

            while (!layer && timer_count <= 10000) {
                await timer(100) // then the created Promise can be awaited
                timer_count += 100
                // layer = await app.activeDocument.activeLayers[0]
                layer = await app.activeDocument.layers.filter(
                    (l) => l.id === placeEventResult?.ID
                )[0]
                const active_layer = await app.activeDocument.activeLayers[0]
                console.log('active_layer.id: ', active_layer.id)
                if (active_layer.id === placeEventResult?.ID) {
                    layer = active_layer
                }

                console.log('timer_count: ', timer_count)
                console.log('loaded layer: ', layer)
                console.log('placeEventResult?.ID: ', placeEventResult?.ID)
            }

            if (g_b_use_smart_object === false) {
                await executeAsModal(async () => {
                    await layer.rasterize() //rastrize the active layer
                })
            }

            await psapi.selectLayersExe([layer])
            await psapi.layerToSelection(g_generation_session.selectionInfo)

            // await stackLayers() // move the smart object to the original/old document
            // await psapi.layerToSelection(g_generation_session.selectionInfo) //transform the new smart object layer to fit selection area
            // layer = await app.activeDocument.activeLayers[0]
            await g_generation_session.moveToTopOfOutputGroup(layer)
            // const output_group_id = await g_generation_session.outputGroup.id
            // let group_index = await psapi.getLayerIndex(output_group_id)
            // const indexOffset = 1 //1 for background, 0 if no background exist
            // await executeAsModal(async ()=>{
            //   await psapi.moveToGroupCommand(group_index - indexOffset, layer.id)

            // })

            image_path_to_layer[image_info.path] = layer
            // await reselect(selectionInfo)
        }
        return image_path_to_layer
    } catch (e) {
        console.warn(e)
    }
    g_generation_session.isLoadingActive = false
}
//REFACTOR: move to psapi.js
async function silentImagesToLayersExe(images_info) {
    //use active layer instead of placeEventResult
    try {
        g_generation_session.isLoadingActive = true

        await psapi.reSelectMarqueeExe(g_generation_session.selectionInfo) //why do we reselect the session selection area
        image_path_to_layer = {}
        console.log(
            'silentImagesToLayersExe: images_info.images_paths: ',
            images_info.images_paths
        )
        // Returns a Promise that resolves after "ms" Milliseconds
        // const timer = (ms) => new Promise((res) => setTimeout(res, ms)) //Todo: move this line to it's own utilit function

        for (image_info of images_info) {
            console.log(gCurrentImagePath)
            //unselect all layers so that the imported layer get place at the top of the document
            await psapi.unselectActiveLayersExe()

            let imported_layer
            // if (base64_images) {
            //     placeEventResult = await base64ToFile(base64_images) //silent import into the document
            // } else {
            //     placeEventResult = await placeEmbedded(image_path) //silent import into the document
            // }
            // imported_layer = await base64ToFile(image_info.base64) //silent import into the document
            const selection_info = await g_generation_session.selectionInfo

            imported_layer = await io.IO.base64ToLayer(
                image_info.base64,
                'output_image.png',
                selection_info.left,
                selection_info.top,
                selection_info.width,
                selection_info.height
            )
            if (!layer_util.Layer.doesLayerExist(imported_layer)) {
                continue //skip if the import vailed
            }
            // let layer = await app.activeDocument.layers.filter(
            //     (l) => l.id === placeEventResult?.ID
            // )[0]

            let timer_count = 0

            // let layer = await app.activeDocument.activeLayers[0]
            console.log('imported_layer: ', imported_layer)

            // while (timer_count <= 10000) {
            //     await timer(100) // then the created Promise can be awaited
            //     timer_count += 100
            //     // layer = await app.activeDocument.activeLayers[0]

            //     console.log('timer_count: ', timer_count)
            //     console.log('loaded layer: ', imported_layer)
            // }

            if (g_b_use_smart_object === false) {
                await executeAsModal(async () => {
                    await imported_layer.rasterize() //rastrize the active layer
                })
            }

            // await psapi.selectLayersExe([imported_layer])
            // await psapi.layerToSelection(g_generation_session.selectionInfo)// not needed

            await g_generation_session.moveToTopOfOutputGroup(imported_layer)
            await psapi.setVisibleExe(imported_layer, false) // turn off the visibility for the layer
            image_path_to_layer[image_info.path] = imported_layer
            // await reselect(selectionInfo)
        }
        return image_path_to_layer
    } catch (e) {
        console.warn(e)
    }
    g_generation_session.isLoadingActive = false
}

// document.getElementById('btnLoadImages').addEventListener('click',ImagesToLayersExe)

//stack layer to original document
//REFACTOR: move to psapi.js
async function stackLayers() {
    //workingDoc is the project you are using stable diffusion in
    const workingDoc = app.documents[0]
    //you should not open two multiple projects this script assume there is only one project opened
    const docsToStack = app.documents.filter(
        (doc) => doc._id !== workingDoc._id
    )
    let docCounter = 0

    // execute as modal is required for functions that change the state of Photoshop or documents
    // think of it as a function that 'wraps' yours and tells Photoshop to go into a modal state and not allow anything to interrupt it from doing whatever is contained in the executeAsModal
    // we also call it with the await keyword to tell JS that we want to wait for it to complete before moving on to later code (in this case there isn't any though)
    await require('photoshop').core.executeAsModal(async () => {
        // increment counter
        docCounter++

        // loop through other open docs
        for (const doc of docsToStack) {
            // flatten
            // doc.flatten();

            // rename layer with counter
            doc.layers[0].name = `Layer ${docCounter}`

            // increment counter
            docCounter++

            // duplicate layer to docZero
            doc.layers[0].duplicate(workingDoc)

            // close doc
            await doc.closeWithoutSaving()
        }
    })
}
//REFACTOR: move to events.js
document.getElementById('collapsible').addEventListener('click', function () {
    this.classList.toggle('active')
    var content = this.nextElementSibling
    console.log('content:', content)
    if (content.style.display === 'block') {
        content.style.display = 'none'
        this.textContent = 'Show Samplers'
    } else {
        content.style.display = 'block'
        this.textContent = 'Hide Samplers'
    }
})

function removeInitImageFromViewer() {}
function removeMaskFromViewer() {}
//REFACTOR: move to viewer.js
async function viewerThumbnailclickHandler(e, viewer_obj_owner) {
    if (g_isViewerMenuDisabled) {
        return g_isViewerMenuDisabled
    }

    let click_type = Enum.clickTypeEnum['Click']

    if (e.shiftKey) {
        click_type = Enum.clickTypeEnum['ShiftClick']
    } else if (e.altKey) {
        click_type = Enum.clickTypeEnum['AltClick']
    }

    if (
        viewer_obj_owner.isActive() &&
        click_type === Enum.clickTypeEnum['Click']
    ) {
        //convert consecutive clicks to AltClick
        click_type = Enum.clickTypeEnum['SecondClick']
        console.log('converted click_type: ', click_type)
    }

    await executeAsModal(async () => {
        //get type of click

        await viewer_obj_owner.click(click_type)
    })
}
// async function NewViewerImageClickHandler(img, viewer_obj_owner) {
//     try {

//     } catch (e) {
//         console.warn(e)
//     }
// }
//REFACTOR: move to viewer.js
function createViewerImgHtml(output_dir_relative, image_path, base64_image) {
    const img = document.createElement('img')
    // img.src = `${output_dir_relative}/${image_path}`
    img.src = base64ToSrc(base64_image)
    img.className = 'viewer-image'
    console.log('image_path: ', image_path)
    // img.dataset.image_id = layer_id
    // img.dataset.image_path = image_path // image_path is not the same as src
    return img
}

//REFACTOR: move to psapi.js
function toggleLayerVisibility(layer, b_on) {
    try {
        layer.visible = b_on
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to psapi.js
async function turnMaskVisible(
    b_mask_group_on,
    b_white_mask_on,
    b_solid_black_mask_on
) {
    //will turn a mask group, white layer mask, and the solid black layer on and off
    try {
        await executeAsModal(() => {
            toggleLayerVisibility(g_mask_group, b_mask_group_on)
            toggleLayerVisibility(g_white_mask, b_white_mask_on)
            toggleLayerVisibility(g_solid_black_mask, b_solid_black_mask_on)
        })
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to viewer.js
async function loadInitImageViewerObject(
    group,
    snapshot,
    solid_background,
    path,
    auto_delete,
    base64_image
) {
    const initImage = g_viewer_manager.addInitImage(
        group,
        snapshot,
        solid_background,
        path,
        auto_delete
    )

    const init_img_html = createViewerImgHtml(
        './server/python_server/init_images/',
        path,
        base64_image
    )
    initImage.createThumbnailNew(init_img_html)
    g_viewer_manager.init_image_container.appendChild(
        initImage.thumbnail_container
    )
    initImage.setImgHtml(init_img_html)

    init_img_html.addEventListener('click', async (e) => {
        await viewerThumbnailclickHandler(e, initImage)
    })
}
//REFACTOR: move to viewer.js
async function loadViewerImages() {
    try {
        //get the images path
        console.log(
            'g_generation_session.image_paths_to_layers:',
            g_generation_session.image_paths_to_layers
        )

        const output_dir_relative = './server/python_server/'
        // const init_image_container = document.getElementById(
        //     'divInitImageViewerContainer'
        // )
        const mask_container = document.getElementById(
            'divInitMaskViewerContainer'
        )
        const output_image_container = document.getElementById(
            'divViewerImagesContainer'
        )

        // while(container.firstChild){
        // container.removeChild(container.firstChild);
        // }
        image_paths = Object.keys(g_generation_session.image_paths_to_layers)
        // console.log('image_paths: ', image_paths)
        let i = 0

        // const viewer_layers = []

        // if(g_viewer_manager.g_init_image_related_layers.hasOwnProperty('init_image_group') )
        if (g_viewer_manager.initGroup) {
            //it means we are in an img2img related mode

            const paths = Object.keys(g_viewer_manager.initImageLayersJson)
            for (const path of paths) {
                if (!g_viewer_manager.hasViewerImage(path)) {
                    // const group =
                    //     g_viewer_manager.initImageLayersJson[path].group
                    // const snapshot =
                    //     g_viewer_manager.initImageLayersJson[path].snapshot
                    // const solid_background =
                    //     g_viewer_manager.initImageLayersJson[path]
                    //         .solid_background
                    // const auto_delete =
                    //     g_viewer_manager.initImageLayersJson[path].autoDelete
                    // const base64_image =
                    //     g_generation_session.base64initImages[path]
                    // await loadInitImageViewerObject(
                    //     group,
                    //     snapshot,
                    //     solid_background,
                    //     path,
                    //     auto_delete,
                    //     base64_image
                    // )
                    await g_viewer_manager.loadInitImageViewerObject(path)

                    // await NewViewerImageClickHandler(init_img_html, initImage) // create click handler for each images
                }
            }
        }

        // if (g_mask_related_layers.hasOwnProperty('mask_group')) {
        if (g_viewer_manager.maskGroup) {
            const path = `./server/python_server/init_images/${g_init_image_mask_name}`
            if (!g_viewer_manager.hasViewerImage(path)) {
                // const group = g_mask_related_layers['mask_group']
                // const white_mark = g_mask_related_layers['white_mark']
                // const solid_background = g_mask_related_layers['solid_black']

                const group = g_viewer_manager.maskLayersJson[path].group
                const white_mark =
                    g_viewer_manager.maskLayersJson[path].white_mark
                const solid_background =
                    g_viewer_manager.maskLayersJson[path].solid_background
                const mask_obj = g_viewer_manager.addMask(
                    group,
                    white_mark,
                    solid_background,
                    path
                )

                const mask_img_html = createViewerImgHtml(
                    './server/python_server/init_images/',
                    g_init_image_mask_name,
                    g_generation_session.base64maskImage[path]
                )

                mask_obj.createThumbnailNew(mask_img_html)
                mask_container.appendChild(mask_obj.thumbnail_container)
                mask_obj.setImgHtml(mask_img_html)

                // await NewViewerImageClickHandler(mask_img_html, mask_obj) // create click handler for each images ,viewer_layers)// create click handler for each images

                mask_img_html.addEventListener('click', async (e) => {
                    await viewerThumbnailclickHandler(e, mask_obj)
                })

                // await viewerImageClickHandler(mask_img_html,viewer_layers)// create click handler for each images
            }
        }

        // console.log('image_paths: ', image_paths)
        let lastOutputImage
        for (const path of image_paths) {
            // const path = image_path
            //check if viewer obj already exist by using the path on hard drive
            if (!g_viewer_manager.hasViewerImage(path)) {
                //create viewer object if it doesn't exist

                //create an html image element and attach it container, and link it to the viewer obj

                const layer = g_generation_session.image_paths_to_layers[path]
                const img = createViewerImgHtml(
                    output_dir_relative,
                    path,
                    g_generation_session.base64OutputImages[path]
                )
                const output_image_obj = g_viewer_manager.addOutputImage(
                    layer,
                    path
                )
                lastOutputImage = output_image_obj
                const b_button_visible =
                    g_generation_session.mode !== generationMode['Txt2Img']
                        ? true
                        : false

                output_image_obj.createThumbnailNew(img, b_button_visible)
                // output_image_obj.setImgHtml(img)
                // if (g_generation_session.mode !== generationMode['Txt2Img']) {
                //     //we don't need a button in txt2img mode
                //     // output_image_obj.addButtonHtml()
                // }
                output_image_container.appendChild(
                    output_image_obj.thumbnail_container
                )
                //add on click event handler to the html img
                // await NewViewerImageClickHandler(img, output_image_obj)
                img.addEventListener('click', async (e) => {
                    await viewerThumbnailclickHandler(e, output_image_obj)
                })
            }

            // i++
        }

        const thumbnail_size_slider = document.getElementById('slThumbnailSize')
        scaleThumbnailsEvenHandler(
            thumbnail_size_slider.value,
            thumbnail_size_slider.max,
            thumbnail_size_slider.min
        )
        if (lastOutputImage) {
            //select the last generate/output image
            // lastOutputImage.img_html.click()
            await executeAsModal(async () => {
                await lastOutputImage.click(Enum.clickTypeEnum['Click'])
            })
        }
    } catch (e) {
        console.error(`loadViewer images: `, e)
    }
}
//REFACTOR: move to session.js
async function deleteNoneSelected(viewer_objects) {
    try {
        // visible layer
        //delete all hidden layers

        await executeAsModal(async () => {
            for (const [path, viewer_object] of Object.entries(
                viewer_objects
            )) {
                try {
                    // if (viewer_object.getHighlight() || viewer_object.is_active){//keep it if it's highlighted
                    // const path = viewer_object.path

                    viewer_object.visible(true) //make them visiable on the canvas

                    await viewer_object.delete() //delete the layer from layers stack

                    //   if(viewer_object.state ===  viewer.ViewerObjState['Unlink']){
                    //   viewer_object.unlink() // just delete the html image but keep the layer in the layers stack
                    //   viewer_object.visible(true)//make them visiable on the canvas
                    // }else if(viewer_object.state === viewer.ViewerObjState['Delete']){// delete it if it isn't  highlighted
                    //   await viewer_object.delete()//delete the layer from layers stack

                    // }
                    delete g_generation_session.image_paths_to_layers[path]
                } catch (e) {
                    console.warn(e)
                }
            }

            //Refactor: move to viewerManager.onSessionEnd()
            g_viewer_manager.pathToViewerImage = {}
            g_viewer_manager.initImageLayersJson = {}
            g_viewer_manager.outputImages = []

            g_generation_session.image_paths_to_layers = {}
        })
    } catch (e) {
        console.warn(e)
    }
}

// document.getElementById('btnLoadViewer').addEventListener('click', loadViewerImages)

//REFACTOR: move to document.js
// async function moveHistoryImageToLayer(img) {
//     let image_path = img.dataset.path
//     const image_path_escape = image_path.replace(/\o/g, '/o') //escape string "\o" in "\output"

//     // load the image from "data:image/png;base64," base64_str
//     const base64_image = img.src.replace('data:image/png;base64,', '')
//     // await base64ToFile(base64_image)
//     const metadata_json = JSON.parse(img.dataset.metadata_json_string)
//     const to_x = metadata_json['selection_info']?.left
//     const to_y = metadata_json['selection_info']?.top
//     const width = metadata_json['selection_info']?.width
//     const height = metadata_json['selection_info']?.height
//     await io.IO.base64ToLayer(
//         base64_image,
//         'History Image',
//         to_x,
//         to_y,
//         width,
//         height
//     )
// }

//REFACTOR: move to document.js
async function loadPromptShortcut() {
    try {
        let prompt_shortcut = await sdapi.loadPromptShortcut()
        if (!prompt_shortcut || prompt_shortcut === {}) {
            prompt_shortcut = promptShortcutExample()
        }

        // var JSONInPrettyFormat = JSON.stringify(prompt_shortcut, undefined, 4);
        // document.getElementById('taPromptShortcut').value = JSONInPrettyFormat
        html_manip.setPromptShortcut(prompt_shortcut) // fill the prompt shortcut textarea
        await refreshPromptMenue() //refresh the prompt menue
    } catch (e) {
        console.warn(`loadPromptShortcut warning: ${e}`)
    }
}
//REFACTOR: move to events.js
document
    .getElementById('btnLoadPromptShortcut')
    .addEventListener('click', async function () {
        await loadPromptShortcut()
    })
//REFACTOR: move to events.js
document
    .getElementById('btnUpdatePromptShortcut')
    .addEventListener('click', async function () {
        try {
            // prompt_shortcut = await sdapi.loadPromptShortcut()
            const prompt_shortcut_string =
                document.getElementById('taPromptShortcut').value
            const prompt_shortcut = JSON.parse(prompt_shortcut_string)
            var newKey = document.getElementById('KeyPromptShortcut').value
            var newValue = document.getElementById('ValuePromptShortcut').value
            console.log(newKey)
            console.log(newValue)
            prompt_shortcut[newKey] = newValue
            var JSONInPrettyFormat = JSON.stringify(
                prompt_shortcut,
                undefined,
                4
            )
            console.log(JSONInPrettyFormat)
            document.getElementById('taPromptShortcut').value =
                JSONInPrettyFormat
            await refreshPromptMenue()
        } catch (e) {
            console.warn(`loadPromptShortcut warning: ${e}`)
        }
    })
//REFACTOR: move to events.js
document
    .getElementById('btnSavePromptShortcut')
    .addEventListener('click', async function () {
        try {
            const r1 = await dialog_box.prompt(
                'Are you sure you want to save prompt shortcut?',
                "This will override your old prompt shortcut file, you can't undo this operation",
                ['Cancel', 'Save']
            )
            if ((r1 || 'Save') !== 'Save') {
                /* cancelled or No */
                console.log('cancel')
            } else {
                /* Yes */
                console.log('Save')

                prompt_shortcut_string =
                    document.getElementById('taPromptShortcut').value
                let prompt_shortcut = JSON.parse(prompt_shortcut_string)

                prompt_shortcut = await sdapi.savePromptShortcut(
                    prompt_shortcut
                )
                // var JSONInPrettyFormat = JSON.stringify(prompt_shortcut, undefined, 4);
                console.log('prompt_shortcut was saved: ', prompt_shortcut)
            }
        } catch (e) {
            console.warn(`savePromptShortcut warning: ${e}`)
        }
    })

var chHiResFixs = document.getElementById('chHiResFixs')
var div = document.getElementById('HiResDiv')
//REFACTOR: move to events.js
chHiResFixs.addEventListener('change', function () {
    if (chHiResFixs.checked) {
        div.style.display = 'block'
    } else {
        div.style.display = 'none'
    }
})
//REFACTOR: move to ui.js
async function refreshPromptMenue() {
    try {
        //get the prompt_shortcut_json
        //iterate over the each entery
        const prompt_shortcut = html_manip.getPromptShortcut()
        const prompt_shortcut_menu = document.getElementById(
            'mPromptShortcutMenu'
        )
        prompt_shortcut_menu.innerHTML = ''

        for (const [key, value] of Object.entries(prompt_shortcut)) {
            if (value.trim() === '') {
                //skip empty spaces
                continue
            }
            const menu_item_element = document.createElement('sp-menu-item')

            menu_item_element.innerHTML = key
            prompt_shortcut_menu.appendChild(menu_item_element)
        }
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to events.js
document
    .getElementById('mPromptShortcutMenu')
    .addEventListener('change', (evt) => {
        const prompt_shortcut = html_manip.getPromptShortcut()
        const key = evt.target.value
        console.log('key:', key)
        changePromptShortcutKey(key)
        changePromptShortcutValue(prompt_shortcut[key])
    })
//REFACTOR: move to events.js
document
    .getElementById('btnRefreshPromptShortcutMenu')
    .addEventListener('click', async () => {
        await refreshPromptMenue()
    })
//REFACTOR: move to ui.js
function changePromptShortcutKey(new_key) {
    document.getElementById('KeyPromptShortcut').value = new_key
}
//REFACTOR: move to ui.js
function changePromptShortcutValue(new_value) {
    document.getElementById('ValuePromptShortcut').value = new_value
}

// adding a listner here for the inpaint_mask_strengh to be able to use api calls, allowing to dynamicly change the value
// a set button could be added to the ui to reduce the number of api calls in case of a slow connection
//REFACTOR: move to events.js
document
    .querySelector('#slInpaintingMaskWeight')
    .addEventListener('input', async (evt) => {
        const label_value = evt.target.value / 100
        document.getElementById(
            'lInpaintingMaskWeight'
        ).innerHTML = `${label_value}`
        // await sdapi.setInpaintMaskWeight(label_value)
    })
//REFACTOR: move to events.js
document
    .querySelector('#slInpaintingMaskWeight')
    .addEventListener('change', async (evt) => {
        try {
            const label_value = evt.target.value / 100
            document.getElementById(
                'lInpaintingMaskWeight'
            ).innerHTML = `${label_value}`
            await sdapi.setInpaintMaskWeight(label_value)

            // //get the inpaint mask weight from the webui sd
            // await g_sd_options_obj.getOptions()
            // const inpainting_mask_weight =
            //     await g_sd_options_obj.getInpaintingMaskWeight()

            // console.log('inpainting_mask_weight: ', inpainting_mask_weight)
            // html_manip.autoFillInInpaintMaskWeight(inpainting_mask_weight)
        } catch (e) {
            console.warn(e)
        }
    })
//REFACTOR: move to document.js
async function downloadIt(link, writeable_entry, image_file_name) {
    const image = await fetch(link)
    console.log(link)
    const storage = require('uxp').storage
    const fs = storage.localFileSystem

    try {
        const img = await image.arrayBuffer()
        // const file = await fs.getFileForSaving("image.png");
        // const folder = await storage.localFileSystem.getTemporaryFolder()
        const file = await writeable_entry.createFile(image_file_name, {
            overwrite: true,
        })
        // const file = await fs.getTempFolder()

        await file.write(img)
        const currentDocument = app.activeDocument
        let newDocument
        let new_layer
        try {
            newDocument = await app.open(file)
            if (currentDocument) {
                new_layer = await newDocument.activeLayers[0].duplicate(
                    currentDocument
                )
                await newDocument.closeWithoutSaving()
            }
        } catch (e) {
            console.warn(e)
        }

        if (!file) {
            return
        }
        return new_layer
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to document.js
async function downloadItExe(link, writeable_entry, image_file_name) {
    let new_layer
    await executeAsModal(async () => {
        try {
            new_layer = await downloadIt(link, writeable_entry, image_file_name)
        } catch (e) {
            console.warn(e)
        }
    })
    return new_layer
}

//REFACTOR: move to session.js or selection.js
async function activateSessionSelectionArea() {
    try {
        if (psapi.isSelectionValid(session_ts.store.data.selectionInfo)) {
            await psapi.reSelectMarqueeExe(session_ts.store.data.selectionInfo)
            await eventHandler()
        }
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to events.js
document
    .getElementById('btnSelectionArea')
    .addEventListener('click', async () => {
        // try {
        //     if (psapi.isSelectionValid(g_generation_session.selectionInfo)) {
        //         await psapi.reSelectMarqueeExe(
        //             g_generation_session.selectionInfo
        //         )
        //         await eventHandler()
        //     }
        // } catch (e) {
        //     console.warn(e)
        // }
        await activateSessionSelectionArea()
    })

//REFACTOR: move to psapi.js
function base64ToSrc(base64_image) {
    const image_src = `data:image/png;base64, ${base64_image}`
    return image_src
}

const py_re = require('./utility/sdapi/python_replacement')

function getDimensions(image) {
    return new Promise((resolve, reject) => {
        var img = new Image()
        img.src = image

        img.addEventListener('load', function () {
            // image.width × image.height
            console.log('image loaded:', img.width, img.height)
            resolve({ width: img.width, height: img.height })
        })

        // img.onload = () => {

        //     resolve({ width: img.width, height: img.height })
        // }
    })
}
//REFACTOR: move to ui.js
function scaleThumbnailsEvenHandler(scale_index, max_index, min_index) {
    const slider_max = max_index
    const slider_min = min_index
    const scaler_value = general.mapRange(scale_index, 0, slider_max, 0, 2)
    g_viewer_manager.thumbnail_scaler = scaler_value

    try {
        g_viewer_manager.scaleThumbnails(
            0,
            0,
            0,
            0,
            g_viewer_manager.thumbnail_scaler
        )
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to events.js
document.getElementById('slThumbnailSize').addEventListener('input', (evt) => {
    scaleThumbnailsEvenHandler(evt.target.value, evt.target.max, evt.target.min)
})
//REFACTOR: move to events.js
document.getElementById('linkWidthHeight').addEventListener('click', (evt) => {
    evt.target.classList.toggle('blackChain')
    const b_state = !evt.target.classList.contains('blackChain') //if doesn't has blackChain means => it's white => b_state == true
    html_manip.setLinkWidthHeightState(b_state)
})
//REFACTOR: move to events.js
document
    .getElementById('chSquareThumbnail')
    .addEventListener('click', (evt) => {
        if (evt.target.checked) {
            g_viewer_manager.isSquareThumbnail = true
        } else {
            g_viewer_manager.isSquareThumbnail = false
        }
        const thumbnail_size_slider = document.getElementById('slThumbnailSize')
        scaleThumbnailsEvenHandler(
            thumbnail_size_slider.value,
            thumbnail_size_slider.max,
            thumbnail_size_slider.min
        )
    })
//REFACTOR: move to events.js

function switchMenu(rb) {
    const tab_button_name = rb.dataset['tab-name']
    const tab_page_name = `${tab_button_name}-page`

    try {
        const contianer_class = rb.parentElement.dataset['container-class']
        const radio_group = rb.parentElement
        document
            .getElementById(tab_button_name)
            .addEventListener('click', () => {
                document.getElementById(tab_button_name)
                const option_container = document
                    .getElementById(tab_page_name)
                    .querySelector(`.${contianer_class}`)
                // .querySelector('.subTabOptionsContainer')
                // const radio_group = document.getElementById('rgSubTab')
                rb.checked = true
                option_container.appendChild(radio_group)
            })

        rb.onclick = () => {
            document.getElementById(tab_button_name).click()
        }
    } catch (e) {
        console.warn(e)
    }
}

//REFACTOR: move to ui.js
async function updateResDifferenceLabel() {
    const ratio = await selection.Selection.getImageToSelectionDifference()
    const arrow = ratio >= 1 ? '↑' : '↓'
    let final_ratio = ratio // this ratio will always be >= 1
    if (ratio >= 1) {
        // percentage = percentage >= 1 ? percentage : 1 / percentage

        // const percentage_str = `${arrow}X${percentage.toFixed(2)}`

        // console.log('scale_info_str: ', scale_info_str)
        // console.log('percentage_str: ', percentage_str)
        document
            .getElementById('res-difference')
            .classList.remove('res-decrease')
    } else {
        final_ratio = 1 / ratio
        document.getElementById('res-difference').classList.add('res-decrease')
    }
    const ratio_str = `${arrow}x${final_ratio.toFixed(2)}`
    document.getElementById('res-difference').innerText = ratio_str
}
//REFACTOR: move to events.js
document
    .getElementById('btnSaveHordeSettings')
    .addEventListener('click', async () => {
        await horde_native.HordeSettings.saveSettings()
    })

document
    .getElementById('btnSaveHordeSettings')
    .addEventListener('click', async () => {
        await horde_native.HordeSettings.saveSettings()
    })

let g_viewer_sub_menu_list = []

const submenu = {
    viewer: {
        value: 'viewer',
        Label: 'Viewer',
        'data-tab-name': 'sp-viewer-tab',
    },
    prompts_library: {
        value: 'prompts-library',
        Label: 'Prompts Library',
        'data-tab-name': 'sp-prompts-library-tab',
    },
    history: {
        value: 'history',
        Label: 'History',
        'data-tab-name': 'sp-history-tab',
    },
    lexica: {
        value: 'lexica',
        Label: 'Lexica',
        'data-tab-name': 'sp-lexica-tab',
    },
    image_search: {
        value: 'image_search',
        Label: 'Image Search',
        'data-tab-name': 'sp-image_search-tab',
    },
}

{
    /* <li>
                                <input
                                    type="radio"
                                    id="option1"
                                    name="options"
                                    checked
                                    class="sub-menu-tab-class"
                                />
                                <label for="option1">Option 1</label>
                            </li> */
}

const viewer_sub_menu_html = document.getElementById('viewer-sub-menu')
// const li_elm = document.createElement('li')
// const input_option = document.createElement('input')
// const label_option = document.createElement('label')

// li_elm.appendChild(input_option)
// li_elm.appendChild(label_option)
// viewer_sub_menu_html.appendChild(li_elm)

for (const [option_id, option_data] of Object.entries(submenu)) {
    const li = document.createElement('li')

    li.innerHTML = `
    <input
        type="radio"
        id="${option_id}"
        name="options"
        checked
        class="sub-menu-tab-class"
        data-tab-name='${option_data['data-tab-name']}'
        
    />
    <label for="${option_id}">${option_data.Label}</label>
`

    viewer_sub_menu_html.appendChild(li)
}

function switchMenu_new(rb) {
    const tab_button_name = rb.dataset['tab-name']
    const tab_page_name = `${tab_button_name}-page`

    try {
        const contianer_class =
            rb.parentElement.parentElement.parentElement.dataset[
                'container-class'
            ] //input_option.li.ul.div.dataset['container-class']
        const radio_group = rb.parentElement.parentElement.parentElement //radio_group in this case is ul
        document
            .getElementById(tab_button_name)
            .addEventListener('click', () => {
                document.getElementById(tab_button_name)
                const option_container = document
                    .getElementById(tab_page_name)
                    .querySelector(`.${contianer_class}`)
                // .querySelector('.subTabOptionsContainer')
                // const radio_group = document.getElementById('rgSubTab')
                rb.checked = true
                option_container.appendChild(radio_group)
            })

        rb.parentElement.onclick = () => {
            document.getElementById(tab_button_name).click()
        }
    } catch (e) {
        console.warn(e)
    }
}

document.getElementsByClassName('sub-menu-tab-class').forEach((element) => {
    switchMenu_new(element)

    // const li_element = element.parentElement
    // li_element.addEventListener('click', (event) => {
    //     //doesn't get trigger don't know why
    //     console.log('sub menu clicked')
    //     element.checked = true
    // })
    // switchMenu_new(element)
})
Array.from(document.querySelectorAll('.rbSubTab')).forEach((rb) => {
    switchMenu(rb)
})

document.getElementById('scrollToPrompt').addEventListener('click', () => {
    document
        .querySelector('#search_second_panel > div.previewContainer')
        .scrollIntoView()
    // document.getElementById('taPrompt').scrollIntoView()
})

// document.getElementById('scrollToViewer').addEventListener('click', () => {

//     document
//         .querySelector('#sp-stable-diffusion-ui-tab-page .reactViewerContainer')
//         .scrollIntoView()
// })

// class CustomElement extends HTMLElement {
//     constructor() {
//         super()
//         this.attachShadow({ mode: 'open' })
//         this.shadowRoot.innerHTML = '<h1>Hello World!</h1>'
//     }
// }
// customElements.define('custom-element', CustomElement)
