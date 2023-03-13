let g_version = 'v1.2.1'
let g_online_data_url =
    'https://raw.githubusercontent.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin/master/utility/online_data.json'
const Enum = require('./enum')
const helper = require('./helper')
const sd_tab = require('./utility/tab/sd')
const sdapi = require('./sdapi_py_re')

// const exportHelper = require('./export_png')
const outpaint = require('./outpaint')
const psapi = require('./psapi')
const app = window.require('photoshop').app

const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core
const dialog_box = require('./dialog_box')
const html_manip = require('./utility/html_manip')
const viewer = require('./viewer')
const selection = require('./selection')
const layer_util = require('./utility/layer')
const sd_options = require('./utility/sdapi/options')
const sd_config = require('./utility/sdapi/config')
const session = require('./utility/session')
const ui = require('./utility/ui')
const script_horde = require('./utility/sd_scripts/horde')
const prompt_shortcut = require('./utility/sdapi/prompt_shortcut')
const formats = require('uxp').storage.formats
const storage = require('uxp').storage
const fs = storage.localFileSystem
const horde_native = require('./utility/sdapi/horde_native')
const io = require('./utility/io')
const dummy = require('./utility/dummy')
const general = require('./utility/general')
const thumbnail = require('./thumbnail')
const note = require('./utility/notification')
const sampler_data = require('./utility/sampler')
const settings_tab = require('./utility/tab/settings')
const control_net = require('./utility/tab/control_net')
const notification = require('./utility/notification')

let g_horde_generator = new horde_native.hordeGenerator()
let g_automatic_status = Enum.AutomaticStatusEnum['Offline']
let g_models_status = false

// let session.GenerationSession.instance() = new session.GenerationSession(0) //session manager
session.GenerationSession.instance().deactivate() //session starte as inactive

require('photoshop').action.addNotificationListener(
    ['set', 'move'],
    session.GenerationSession.instance().selectionEventHandler
)
document.getElementById('sp-viewer-tab').addEventListener('click', async () => {
    if (
        session.GenerationSession.instance().isActive() &&
        session.GenerationSession.instance().mode === 'upscale'
    ) {
        GenerationSettings.sd_mode = 'upscale'
    } else {
        GenerationSettings.sd_mode = html_manip.getMode()
    }
})
//REFACTOR: move to events.js
document.getElementById('sp-viewer-tab').addEventListener('click', async () => {
    psapi.moveElementToAnotherTab(
        'batchNumberUi',
        'batchNumberViewerTabContainer'
    )
    await displayUpdate()
})
//REFACTOR: move to events.js
document
    .getElementById('sp-stable-diffusion-ui-tab')
    .addEventListener('click', () => {
        psapi.moveElementToAnotherTab(
            'batchNumberUi',
            'batchNumber-steps-container'
        )
    })
//REFACTOR: move to sdapi.js
async function checkAutoStatus() {
    try {
        const options = await g_sd_options_obj.getOptions()
        if (options) {
            //means both automatic1111 and proxy server are online
            html_manip.setAutomaticStatus('connected', 'disconnected')
            g_automatic_status = Enum.AutomaticStatusEnum['RunningWithApi']
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
        await notification.displayWebUIStatusNotification(g_automatic_status)

        const bSamplersStatus = await initSamplers()

        g_models_status = await refreshModels()
        await refreshExtraUpscalers()
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

        await control_net.initializeControlNetTab(g_controlnet_max_models)
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
            console.log(model.title)
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
                console.log(model + ' added to ' + hrModelsMenuClass[i].id)
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
            console.log(sampler)
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
// let g_init_mask_layer;
// let g_mask_related_layers = {}
// let g_init_image_related_layers = {}
//REFACTOR: move to generationSettings.js, Note: numberOfImages deprecated global variable
// let numberOfImages = document.querySelector('#tiNumberOfImages').value
// let g_sd_mode_last = g_sd_mode
//REFACTOR: move to generationSettings.js
// let g_sd_mode_last = g_sd_mode
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
let g_is_active_layers_stored = false

let g_number_generation_per_session = 0
let g_isViewerMenuDisabled = false // disable the viewer menu and viewerImage when we're importing images into the current document

// let g_selection = {}
//REFACTOR: move to session.js
let g_selection = {}
let g_sd_options_obj = new sd_options.SdOptions()

g_sd_options_obj.getOptions()
// let g_sd_config_obj = new sd_config.SdConfig()
// g_sd_config_obj.getConfig();

// let g_width_slider = new ui.UIElement()
// g_width_slider.getValue = html_manip.getWidth
// ui_settings.uiElements.push =
let g_old_slider_width = 512
let g_old_slider_height = 512
let g_sd_config_obj
let g_hi_res_upscaler_models
let g_controlnet_max_models
    // let g_controlnet_preprocessors
;(async function () {
    let temp_config = new sd_config.SdConfig()
    await temp_config.getConfig()
    g_hi_res_upscaler_models = temp_config.getUpscalerModels()
    g_controlnet_max_models = temp_config.getControlNetMaxModelsNum()
    // g_controlnet_preprocessors = temp_config.getControlNetPreprocessors()
    g_sd_config_obj = temp_config

    for (let model of g_hi_res_upscaler_models) {
        //update the hi res upscaler models menu
        let hrModelsMenuClass =
            document.getElementsByClassName('hrModelsMenuClass')
        for (let i = 0; i < hrModelsMenuClass.length; i++) {
            const menu_item_element = document.createElement('sp-menu-item')
            menu_item_element.className = 'hrModelsMenuItem'
            menu_item_element.innerHTML = model
            hrModelsMenuClass[i].appendChild(menu_item_element)
            console.log(model + ' added to ' + hrModelsMenuClass[i].id)
        }
    }
})()

//REFACTOR: replace all ref to g_ui with UI singleton
let g_ui = ui.UI.instance()
let g_ui_settings = new ui.UISettings()

const requestState = {
    Generate: 'generate',
    Interrupt: 'interrupt',
}

let g_request_status = '' //

const backendTypeEnum = {
    Auto1111: 'auto1111',
    HordeNative: 'horde_native',
    Auto1111HordeExtension: 'auto1111_horde_extension',
}

session.GenerationSession.instance().mode = Enum.generationMode['Txt2Img']

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
    await refreshUI()
    await displayUpdate()
    // promptShortcutExample()
    await loadPromptShortcut()
    await refreshPromptMenue()

    //init ControlNet Tab
    await control_net.initializeControlNetTab(g_controlnet_max_models)
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

//add click event on radio button mode, so that when a button is clicked it change GenerationSettings.sd_mode globally
//REFACTOR: move to events.js
rbModeElements = document.getElementsByClassName('rbMode')
for (let rbModeElement of rbModeElements) {
    rbModeElement.addEventListener('click', async (evt) => {
        try {
            GenerationSettings.sd_mode = evt.target.value
            // console.log(`You clicked: ${GenerationSettings.sd_mode}`)
            await displayUpdate()
            await postModeSelection() // do things after selection
        } catch (e) {
            console.warn(e)
        }
    })
}

//swaps GenerationSettings.sd_mode when clicking on extras tab and swaps it back to previous value when clicking on main tab
//REFACTOR: move to events.js
document
    .getElementById('sp-extras-tab')
    .addEventListener('click', async (evt) => {
        try {
            GenerationSettings.sd_mode = 'upscale'
            console.log(`You clicked: ${GenerationSettings.sd_mode}`)
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
            GenerationSettings.sd_mode = html_manip.getMode()
            console.log(`mode restored to: ${GenerationSettings.sd_mode}`)
            await displayUpdate()
            await postModeSelection() // do things after selection
        } catch (e) {
            console.warn(e)
        }
    })
//REFACTOR: move to ui.js
async function postModeSelection() {
    //
    try {
        if (GenerationSettings.sd_mode === Enum.generationMode['Inpaint']) {
            //check if the we already have created a mask layer
            await psapi.createTempInpaintMaskLayer()
        } else {
            // if we switch from inpaint mode, delete the mask layer
            // Find all history states after the creation of the inpaint mask and their name brush tool
            await layer_util.deleteTempInpaintMaskLayer()
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
            session.GenerationSession.instance().isActive() &&
            session.GenerationSession.instance().mode ===
                GenerationSettings.sd_mode
        ) {
            //if the generation session is active and the selected mode is still the same as the generation mode

            console.log('hover on window')

            const new_selection =
                await selection.Selection.getSelectionInfoExe() //get the current active selection if there is any

            if (
                new_selection &&
                (await session.GenerationSession.instance().hasSelectionChanged(
                    new_selection,
                    session.GenerationSession.instance().selectionInfo
                ))
            ) {
                // if there is an active selection and if the selection has changed

                await selection.calcWidthHeightFromSelection()

                if (
                    session.GenerationSession.instance().state ===
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
        if (GenerationSettings.sd_mode == 'txt2img') {
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
            // document.getElementById('btnSnapAndFill').style.display = 'none'//"none" will  misaligned the table // hide snap and fill button
        }

        if (GenerationSettings.sd_mode == 'img2img') {
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
        }
        if (
            GenerationSettings.sd_mode == 'inpaint' ||
            GenerationSettings.sd_mode == 'outpaint'
        ) {
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

        if (session.GenerationSession.instance().isActive()) {
            //Note: remove the "or" operation after refactoring the code
            //if the session is active

            if (
                session.GenerationSession.instance().mode !==
                GenerationSettings.sd_mode
            ) {
                //if a generation session is active but we changed mode. the generate button will reflect that
                //Note: add this code to the UI class
                const generate_btns = Array.from(
                    document.getElementsByClassName('btnGenerateClass')
                )
                generate_btns.forEach((element) => {
                    const selected_mode =
                        session.GenerationSession.instance().getCurrentGenerationModeByValue(
                            GenerationSettings.sd_mode
                        )
                    element.textContent = `Generate ${selected_mode}`
                })

                html_manip.setGenerateButtonsColor('generate', 'generate-more')
            } else {
                //1) and the session is active
                //2) is the same generation mode

                if (
                    !(await session.GenerationSession.instance().hasSessionSelectionChanged())
                ) {
                    //3a) and the selection hasn't change

                    const generate_btns = Array.from(
                        document.getElementsByClassName('btnGenerateClass')
                    )

                    // const selected_mode =
                    //     getCurrentGenerationModeByValue(GenerationSettings.sd_mode)
                    const generation_mode =
                        session.GenerationSession.instance().mode
                    const generation_name =
                        session.GenerationSession.instance().getCurrentGenerationModeByValue(
                            generation_mode
                        )
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
            const selected_mode =
                session.GenerationSession.instance().getCurrentGenerationModeByValue(
                    GenerationSettings.sd_mode
                )
            g_ui.setGenerateBtnText(`Generate ${selected_mode}`)
            html_manip.setGenerateButtonsColor('generate', 'generate-more')
        }
    } catch (e) {
        console.warn(e)
    }
}
//Refactor: Delete testServerPath() method
async function testServerPath() {
    // const serverPath = "https://api.github.com/users/abdullah"

    try {
        // const serverPath = 'https://api.weather.gov/points/123.4,342.5'
        // const serverPath = 'https://api.github.com/users/abdullah'
        // const serverPath = "https://api.coindesk.com/v1/bpi/currentprice.json"
        // const serverPath = "http://127.0.0.1:3000"
        // const serverPath = "http://localhost:3000"
        const serverPath = 'http://127.0.0.1:8000/txt2img/random%20prompt'
        // const serverPath = "https://3330-37-106-100-102.eu.ngrok.io"
        console.log('testServerPath function was called')

        let response = await fetch(serverPath)
        console.log('testServerPath finished fetch')

        if (!response.ok) {
            throw new Error(
                `HTTP error fetching weather station; status: ${response.status}`
            )
        }
        let stationJson = await response.json()
        console.dir(stationJson)
    } catch (err) {
        console.error('testServerPath error: ' + err.message)
    }
}

//REFACTOR: move to ui.js
function sliderToResolution(sliderValue) {
    return sliderValue * 64
}

// document.querySelector('#slHeight').addEventListener('input', evt => {
//   gHeight = sliderToResolution(evt.target.value)
//   document.querySelector('#lHeight').textContent = gHeight
// })

// function getWidthFromSlider(slider_value){
//   // slider_width = document.querySelector('#slWidth').value
//   const width = sliderToResolution(slider_value)
//   return width
// }
// //avoid using global width gWidth in "input" incase the slider get changed using autoFillInSettings
// document.querySelector('#slWidth').addEventListener('input', evt => {
//   const width = getWidthFromSlider(evt.target.value)
//   // gWidth = sliderToResolution(evt.target.value)
//   document.querySelector('#lWidth').textContent = width
// })
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
//document.querySelector('#hrScale').addEventListener('input', evt => {
//  hScale = sliderToResolution(evt.target.value)
//  document.querySelector('#hScale').textContent = hScale
//})
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

// document
//   .getElementById('btnSnapAndFill')
//   .addEventListener('click', async () => {

//   await snapAndFillHandler()
//   })
//REFACTOR: move to generation.js
async function easyModeOutpaint() {
    try {
        if (session.GenerationSession.instance().isFirstGeneration) {
            // clear the layers related to the last mask operation.
            // g_last_outpaint_layers = await psapi.cleanLayers(g_last_outpaint_layers)

            // create new layers related to the current mask operation.
            // g_last_outpaint_layers = await outpaint.outpaintExe(random_session_id)
            await outpaint.outpaintExe(
                session.GenerationSession.instance().random_session_id
            )
        }
    } catch (e) {
        console.warn(e)
    }
}
//REFACTOR: move to generation.js
async function btnInitInpaintHandler() {
    try {
        if (session.GenerationSession.instance().isFirstGeneration) {
            // delete the layers of the previous mask operation
            // g_last_inpaint_layers = await psapi.cleanLayers(g_last_inpaint_layers)
            // store the layer of the current mask operation
            // g_last_inpaint_layers =  await outpaint.inpaintFasterExe(random_session_id)
            await outpaint.inpaintFasterExe(
                session.GenerationSession.instance().random_session_id
            )

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
        console.log('first_class_btns: ', first_class_btns)
    } else {
        //show generate or generate more button
        first_class_btns.forEach(
            (element) => (element.style.display = 'inline-block')
        )
        if (session.GenerationSession.instance().isActive()) {
            //show generate more
            // const selected_mode = getCurrentGenerationModeByValue(GenerationSettings.sd_mode)
            const generation_mode = session.GenerationSession.instance().mode
            const generation_name =
                session.GenerationSession.instance().getCurrentGenerationModeByValue(
                    generation_mode
                )
            first_class_btns.forEach(
                (element) =>
                    (element.textContent = `Generate More ${generation_name}`)
            )
        } else {
            //show generate button
            first_class_btns.forEach(
                (element) =>
                    (element.textContent = `Generate ${session.GenerationSession.instance().getCurrentGenerationModeByValue(
                        GenerationSettings.sd_mode
                    )}`)
            )
        }
        second_class_btns.forEach((element) => (element.style.display = 'none'))
    }
    return isVisible
}
//REFACTOR: move to events.js
const discard_selected_class_btns = Array.from(
    document.getElementsByClassName('discardSelectedClass')
)
//REFACTOR: move to events.js
discard_selected_class_btns.forEach((element) =>
    element.addEventListener('click', async () => {
        try {
            await session.GenerationSession.instance().endSession(
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
            await session.GenerationSession.instance().endSession(
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
            await session.GenerationSession.instance().endSession(
                session.GarbageCollectionState['Accept']
            ) //end session and accept all images
            g_ui.onEndSessionUI()
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
        console.log('click on Last seed')
        let seed = '-1'

        if (g_last_seed >= 0) {
            seed = g_last_seed.toString() //make sure the seed is a string
        }

        console.log('seed:', seed)
        document.querySelector('#tiSeed').value = seed
    } catch (e) {
        console.warn(e)
    }
})
//REFACTOR: move to events.js
Array.from(document.getElementsByClassName('discardClass')).forEach(
    (element) => {
        element.addEventListener('click', async () => {
            //end session here
            await session.GenerationSession.instance().endSession(
                session.GarbageCollectionState['Discard']
            ) //end session and remove all images
            g_ui.onEndSessionUI()

            // await discard()
        })
    }
)
//REFACTOR: move to events.js
Array.from(document.getElementsByClassName('btnInterruptClass')).forEach(
    (element) => {
        element.addEventListener('click', async () => {
            try {
                if (
                    session.GenerationSession.instance().request_status ===
                    Enum.RequestStateEnum['Finished']
                ) {
                    toggleTwoButtonsByClass(
                        false,
                        'btnGenerateClass',
                        'btnInterruptClass'
                    )
                    g_can_request_progress = false

                    return null // cann't inturrept a finished generation
                }
                session.GenerationSession.instance().request_status =
                    Enum.RequestStateEnum['Interrupted']

                const backend_type = html_manip.getBackendType()

                if (backend_type === backendTypeEnum['HordeNative']) {
                    //interrupt the horde

                    await g_horde_generator.interrupt()
                } else {
                    //interrupt auto1111

                    json = await sdapi.requestInterrupt()
                }

                toggleTwoButtonsByClass(
                    false,
                    'btnGenerateClass',
                    'btnInterruptClass'
                )
                g_can_request_progress = false

                // g_can_request_progress = toggleTwoButtons(false,'btnGenerate','btnInterrupt')
            } catch (e) {
                // g_can_request_progress = toggleTwoButtons(false,'btnGenerate','btnInterrupt')
                toggleTwoButtonsByClass(
                    false,
                    'btnGenerateClass',
                    'btnInterruptClass'
                )
                g_can_request_progress = false
                console.warn(e)
            }
        })
    }
)

//REFACTOR: move to events.js
document.querySelector('#taPrompt').addEventListener('focus', async () => {
    // if (!session.GenerationSession.instance().isLoadingActive) {
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
        // if (!session.GenerationSession.instance().isLoadingActive) {
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
async function getSettings() {
    let payload = {}

    try {
        const extension_type = settings_tab.getExtensionType() // get the extension type
        const selectionInfo = await selection.Selection.getSelectionInfoExe()
        payload['selection_info'] = selectionInfo
        const numberOfImages = parseInt(
            document.querySelector('#tiNumberOfImages').value
        )
        const numberOfSteps = document.querySelector('#tiNumberOfSteps').value
        const prompt = html_manip.getPrompt()
        const negative_prompt = html_manip.getNegativePrompt()
        const hi_res_fix = html_manip.getHiResFixs()
        // console.log("prompt:",prompt)
        // console.log("negative_prompt:",negative_prompt)
        const model_index = document.querySelector('#mModelsMenu').selectedIndex
        const upscaler = document.querySelector('#hrModelsMenu').value
        const cfg_scale = document.querySelector('#slCfgScale').value
        //  const model_index = document.querySelector("#")
        const seed = document.querySelector('#tiSeed').value
        // const mask_blur = document.querySelector('#slMaskBlur').value
        const use_sharp_mask = settings_tab.getUseSharpMask()
        const mask_blur = html_manip.getMaskBlur()
        const mask_expansion = document.getElementById('slMaskExpansion').value

        const inpaint_full_res_padding =
            document.querySelector('#slInpaintPadding').value

        // console.dir(numberOfImages)
        const bUsePromptShortcut = document.getElementById(
            'chUsePromptShortcut'
        ).checked
        let prompt_shortcut_ui_dict = {}
        try {
            let prompt_shortcut_string =
                document.getElementById('taPromptShortcut').value
            prompt_shortcut_ui_dict = JSON.parse(prompt_shortcut_string)
        } catch (e) {
            console.warn(
                `warning prompt_shortcut_ui_dict is not valid Json obj: ${e}`
            )
            prompt_shortcut_ui_dict = {}
        }

        // const slider_width = document.getElementById("slWidth").value
        // gWidth = getWidthFromSlider(slider_width)
        const width = html_manip.getWidth()
        const height = html_manip.getHeight()
        const hWidth = html_manip.getSliderSdValue('hrWidth', 64)
        const hHeight = html_manip.getSliderSdValue('hrHeight', 64)
        const hSteps = html_manip.getSliderSdValue('hrNumberOfSteps', 1)
        //const hScale = html_manip.getSliderSdValue('hrScale',1)
        console.log('Check')

        const uniqueDocumentId = await document_util.getUniqueDocumentId()
        const h_denoising_strength = html_manip.getSliderSdValue(
            'hrDenoisingStrength',
            0.01
        )
        console.log('Check2')

        //Note: store the sampler names in json file if auto is offline or auto api is unmounted

        const sampler_name = html_manip.getCheckedSamplerName()

        const mode = html_manip.getMode()
        const b_restore_faces =
            document.getElementById('chRestoreFaces').checked

        let denoising_strength = h_denoising_strength
        if (mode == 'inpaint' || mode == 'outpaint') {
            var g_use_mask_image = true
            payload['inpaint_full_res'] =
                document.getElementById('chInpaintFullRes').checked
            payload['inpaint_full_res_padding'] = inpaint_full_res_padding * 4

            console.log('g_use_mask_image is ', g_use_mask_image)
            console.log(
                'init_image_mask_name is ',
                session.GenerationSession.instance().init_image_mask_name
            )
            payload['init_image_mask_name'] =
                session.GenerationSession.instance().init_image_mask_name
            payload['inpainting_fill'] = html_manip.getMaskContent()
            payload['mask_expansion'] = mask_expansion
            payload['mask'] =
                session.GenerationSession.instance().activeBase64MaskImage

            if (use_sharp_mask === false && payload['mask']) {
                //only if mask is available and sharp_mask is off
                // use blurry and expanded mask
                const iterations = payload['mask_expansion']
                const mask = await py_re.maskExpansionRequest(
                    payload['mask'],
                    iterations
                )
                if (mask) {
                    payload['mask'] = mask
                }
            }
        } else if (mode == 'img2img') {
            var g_use_mask_image = false
            delete payload['inpaint_full_res'] //  inpaint full res is not available in img2img mode
            delete payload['inpaint_full_res_padding']
            delete payload['init_image_mask_name']
            delete payload['inpainting_fill']
        }

        if (
            GenerationSettings.sd_mode == 'img2img' ||
            GenerationSettings.sd_mode == 'inpaint' ||
            GenerationSettings.sd_mode == 'outpaint'
        ) {
            console.log(`g_use_mask_image:? ${g_use_mask_image}`)

            denoising_strength = html_manip.getDenoisingStrength()
            payload['denoising_strength'] = denoising_strength
            payload['init_image_name'] =
                session.GenerationSession.instance().init_image_name

            payload['init_images'] = [
                session.GenerationSession.instance().activeBase64InitImage,
            ]
        }

        if (hi_res_fix && width >= 512 && height >= 512) {
            payload['enable_hr'] = hi_res_fix
            payload['firstphase_width'] = width
            payload['firstphase_height'] = height
            payload['hr_resize_x'] = hWidth
            payload['hr_resize_y'] = hHeight
            // payload['hr_scale'] =  hScale // Scale
            payload['hr_upscaler'] = upscaler // Upscaler
            payload['hr_second_pass_steps'] = hSteps // Number of Steps
        } else {
            //fix hi res bug: if we include firstphase_width or firstphase_height in the payload,
            // sd api will use them instead of using width and height variables, even when enable_hr is set to "false"
            delete payload['enable_hr']
            delete payload['firstphase_width']
            delete payload['firstphase_height']
        }

        //work with the hord

        // const script_args_json = {
        //   model: "Anything Diffusion",
        //   nsfw: false,
        //   shared_laion: false,
        //   seed_variation: 1,
        //   post_processing_1: "None",
        //   post_processing_2: "None",
        //   post_processing_3: "None"
        // }
        // const script_args = Object.values(script_args_json)

        const backend_type = html_manip.getBackendType()
        if (backend_type === backendTypeEnum['Auto1111HordeExtension']) {
            payload['script_name'] = script_horde.script_name
            payload['script_args'] = script_horde.getScriptArgs()
        } else {
            delete payload['script_name']
            delete payload['script_args']
        }

        if (bUsePromptShortcut) {
            //replace the prompt with the prompt shortcut equivalent
            const [new_prompt, new_negative_prompt] =
                py_re.replacePromptsWithShortcuts(
                    prompt,
                    negative_prompt,
                    prompt_shortcut_ui_dict
                )

            //used in generation
            payload['prompt'] = new_prompt
            payload['negative_prompt'] = new_negative_prompt

            //used to when resote settings from metadata
            payload['original_prompt'] = prompt
            payload['original_negative_prompt'] = negative_prompt
        } else {
            //use the same prompt as in the prompt textarea
            payload['prompt'] = prompt
            payload['negative_prompt'] = negative_prompt

            payload['original_prompt'] = prompt
            payload['original_negative_prompt'] = negative_prompt
        }

        payload = {
            ...payload,
            // prompt: prompt,
            // negative_prompt: negative_prompt,
            steps: numberOfSteps,
            // n_iter: numberOfImages,
            sampler_index: sampler_name,
            width: width,
            height: height,
            denoising_strength: denoising_strength,
            batch_size: numberOfImages,
            cfg_scale: cfg_scale,
            seed: seed,
            mask_blur: mask_blur,
            use_sharp_mask: use_sharp_mask,
            use_prompt_shortcut: bUsePromptShortcut,
            prompt_shortcut_ui_dict: prompt_shortcut_ui_dict,
            uniqueDocumentId: uniqueDocumentId,
            mode: mode,
            restore_faces: b_restore_faces,
            // script_args: script_args,
            // script_name:"Run on Stable Horde"
        }
    } catch (e) {
        console.error(e)
    }
    return payload
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
        const selection_info = await selection.Selection.getSelectionInfoExe()
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
        const uniqueDocumentId = await document_util.getUniqueDocumentId()
        payload['uniqueDocumentId'] = uniqueDocumentId

        // const layer = await app.activeDocument.activeLayers[0]
        const layer = await app.activeDocument.activeLayers[0]
        const old_name = layer.name

        // image_name = await app.activeDocument.activeLayers[0].name

        //convert layer name to a file name
        let image_name = psapi.layerNameToFileName(
            old_name,
            layer.id,
            session.GenerationSession.instance().random_session_id
        )
        image_name = `${image_name}.png`

        const base64_image =
            session.GenerationSession.instance().activeBase64InitImage

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
            const b_enable_control_net = control_net.getEnableControlNet(0)

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
            const b_enable_control_net = control_net.getEnableControlNet()

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

//REFACTOR: move to generation.js
async function easyModeGenerate(mode) {
    try {
        if (
            session.GenerationSession.instance().request_status !==
            Enum.RequestStateEnum['Finished']
        ) {
            app.showAlert(
                'A generation is still active in the background. \nPlease check your Automatic1111 command line.'
            )
            return null
        }

        session.GenerationSession.instance().request_status =
            Enum.RequestStateEnum['Generating']
        await executeAsModal(async (context) => {
            const document_type = await findDocumentType()

            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id, //TODO: change this to the session document id
                name: 'Correct Background',
            })
            //store selection
            //store active layer
            const selectionInfo =
                await selection.Selection.getSelectionInfoExe()
            await psapi.unSelectMarqueeExe()
            const active_layers = app.activeDocument.activeLayers

            //1)check if the documnet has a background layer

            await correctDocumentType(document_type)

            //retore selection
            //restore active layer
            await selection.reSelectMarqueeExe(selectionInfo)
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
            await notification.displayWebUIStatusNotification(
                g_automatic_status
            )
            if (
                g_automatic_status === Enum.AutomaticStatusEnum['Offline'] ||
                g_automatic_status === Enum.AutomaticStatusEnum['RunningNoApi']
            ) {
                session.GenerationSession.instance().request_status =
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
                session.GenerationSession.instance().isActive()
            )) === false // means did not activate the session selection area if it's available
        ) {
            session.GenerationSession.instance().request_status =
                Enum.RequestStateEnum['Finished']
            return null
        }

        console.log('easyModeGenerate mdoe: ', mode)
        if (
            selection.Selection.isSelectionValid(
                session.GenerationSession.instance().selectionInfo
            )
        ) {
            // check we have an old selection stored
            const new_selection =
                await selection.Selection.getSelectionInfoExe()
            if (
                await session.GenerationSession.instance().hasSelectionChanged(
                    new_selection,
                    session.GenerationSession.instance().selectionInfo
                )
            ) {
                // check the new selection is difference than the old
                // end current session
                session.GenerationSession.instance().selectionInfo =
                    new_selection
                try {
                    await session.GenerationSession.instance().endSession(
                        session.GarbageCollectionState['Accept']
                    ) //end session and accept all images
                    g_ui.onEndSessionUI()
                } catch (e) {
                    console.warn(e)
                }
            }
        } else {
            // store selection value
            session.GenerationSession.instance().selectionInfo =
                await selection.Selection.getSelectionInfoExe()
        }

        if (session.GenerationSession.instance().isActive()) {
            //active session
            //
            if (session.GenerationSession.instance().mode !== mode) {
                //active session but it's a new mode

                await session.GenerationSession.instance().endSession(
                    session.GarbageCollectionState['Accept']
                )
                g_ui.onEndSessionUI()
                //start new session after you ended the old one
                await session.GenerationSession.instance().startSession()

                session.GenerationSession.instance().mode = mode
            }
        } else {
            // new session
            session.GenerationSession.instance().mode = mode
            await session.GenerationSession.instance().startSession() //start the session and create a output folder
        }

        await psapi.selectLayersExe([active_layer]) //reselect the active layer since the clean up of the session sometime will change which layer is selected
        if (mode === 'txt2img') {
            //Note: keep it for clearity/ readibility
        } else if (mode === 'img2img' || mode === 'upscale') {
            await outpaint.snapAndFillHandler()
        } else if (mode === 'inpaint') {
            await btnInitInpaintHandler()
        } else if (mode === 'outpaint') {
            await easyModeOutpaint()
        }

        //safe to close the previous generation_session outputfolder, since closing a folder will unselect any layer in it.
        ////and the plugin may still need those layers for inpainting mode for example.

        await session.GenerationSession.instance().closePreviousOutputGroup()

        const settings =
            mode === 'upscale' ? await getExtraSettings() : await getSettings()

        session.GenerationSession.instance().last_settings = settings
        session.GenerationSession.instance().is_control_net =
            control_net.getEnableControlNet()
        await generate(settings, mode)

        // await session.GenerationSession.instance().deleteProgressLayer() // delete the old progress layer
        await session.GenerationSession.instance().deleteProgressImage()
    } catch (e) {
        await session.GenerationSession.instance().deleteProgressImage()
        console.warn(e)
        session.GenerationSession.instance().request_status =
            Enum.RequestStateEnum['Finished']
    }
    toggleTwoButtonsByClass(false, 'btnGenerateClass', 'btnInterruptClass')
    g_can_request_progress = false

    session.GenerationSession.instance().request_status =
        Enum.RequestStateEnum['Finished']

    if (session.GenerationSession.instance().sudo_timer_id) {
        //disable the sudo timer at the end of the generation
        session.GenerationSession.instance().sudo_timer_id = clearInterval(
            session.GenerationSession.instance().sudo_timer_id
        )
    }
}

//REFACTOR: move to generation.js
async function generate(settings, mode) {
    try {
        //pre generation
        // toggleGenerateInterruptButton(true)

        // const isFirstGeneration = !(g_is_generation_session_active) // check if this is the first generation in the session
        // const isFirstGeneration = !(session.GenerationSession.instance().isActive()) // check if this is the first generation in the session
        const isFirstGeneration =
            session.GenerationSession.instance().isFirstGeneration

        // session.GenerationSession.instance().startSession()
        session.GenerationSession.instance().activate()

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

        console.log(settings)

        session.GenerationSession.instance().request_status =
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

        // if (GenerationSettings.sd_mode == 'outpaint') {
        //     // await easyModeOutpaint()
        //     json = await sdapi.requestImg2Img(settings)

        //     // await setTimeout(async ()=> {
        //     //   json = await sdapi.requestImg2Img(settings)

        //     // },5000)
        // }
        if (
            session.GenerationSession.instance().request_status ===
            Enum.RequestStateEnum['Interrupted']
        ) {
            //when generate request get interrupted. reset progress bar to 0, discard any meta data and images returned from the proxy server by returning from the function.
            html_manip.updateProgressBarsHtml(0)
            console.log(
                'before delete session.GenerationSession.instance().progress_layer: ',
                session.GenerationSession.instance().progress_layer
            )
            await session.GenerationSession.instance().deleteProgressImage()
            console.log(
                'after delete session.GenerationSession.instance().progress_layer: ',
                session.GenerationSession.instance().progress_layer
            )
            //check whether request was "generate" or "generate more"
            //if it's generate discard the session
            if (isFirstGeneration) {
                await loadViewerImages()
                await session.GenerationSession.instance().endSession(
                    session.GarbageCollectionState['Discard']
                ) //end session and delete all images
                g_ui.onEndSessionUI()

                // //delete all mask related layers
            }
            session.GenerationSession.instance().request_status =
                Enum.RequestStateEnum['Finished']
            return null
        }

        // check if json is empty {}, {} means the proxy server didn't return a valid data
        if (Object.keys(json).length === 0) {
            if (isFirstGeneration) {
                await session.GenerationSession.instance().endSession(
                    session.GarbageCollectionState['Discard']
                ) //end session and delete all images
                g_ui.onEndSessionUI()

                // //delete all mask related layers
            }
            session.GenerationSession.instance().request_status =
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

            session.GenerationSession.instance().image_paths_to_layers =
                await session.GenerationSession.instance().silentImagesToLayersExe(
                    images_info
                )

            session.GenerationSession.instance().base64OutputImages = {} //delete all previouse images, Note move this to session end ()
            for (const image_info of images_info) {
                const path = image_info['path']
                const base64_image = image_info['base64']
                session.GenerationSession.instance().base64OutputImages[path] =
                    base64_image
                const [document_name, image_name] = path.split('/')
                await document_util.saveFileInSubFolder(
                    base64_image,
                    document_name,
                    image_name
                ) //save the output image
                const json_file_name = `${image_name.split('.')[0]}.json`
                settings['auto_metadata'] = image_info?.auto_metadata
                await document_util.saveJsonFileInSubFolder(
                    settings,
                    document_name,
                    json_file_name
                ) //save the settings
            }

            g_number_generation_per_session = 1
            session.GenerationSession.instance().isFirstGeneration = false
        } else {
            // generation session is active so we will generate more

            let last_images_paths =
                await session.GenerationSession.instance().silentImagesToLayersExe(
                    images_info
                )

            for (const image_info of images_info) {
                const path = image_info['path']
                const base64_image = image_info['base64']
                session.GenerationSession.instance().base64OutputImages[path] =
                    base64_image
                const [document_name, image_name] = path.split('/')
                await document_util.saveFileInSubFolder(
                    base64_image,
                    document_name,
                    image_name
                )
                const json_file_name = `${image_name.split('.')[0]}.json`
                settings['auto_metadata'] = image_info?.auto_metadata
                await document_util.saveJsonFileInSubFolder(
                    settings,
                    document_name,
                    json_file_name
                ) //save the settings
            }

            session.GenerationSession.instance().image_paths_to_layers = {
                ...session.GenerationSession.instance().image_paths_to_layers,
                ...last_images_paths,
            }
            g_number_generation_per_session++
        }
        await selection.reSelectMarqueeExe(
            session.GenerationSession.instance().selectionInfo
        )
        //update the viewer
        await loadViewerImages()

        //esnures that progress bars are set to 0 (as last progress request call might have returned less than 100%)
        updateProgressBarsHtml(0)
    } catch (e) {
        console.error(`btnGenerate.click(): `, e)
        session.GenerationSession.instance().request_status =
            Enum.RequestStateEnum['Finished']
    }
    session.GenerationSession.instance().request_status =
        Enum.RequestStateEnum['Finished']
}
//REFACTOR: move to events.js
Array.from(document.getElementsByClassName('btnGenerateClass')).forEach(
    (btn) => {
        btn.addEventListener('click', async (evt) => {
            html_manip.tempDisableElement(evt.target, 5000)
            await easyModeGenerate(GenerationSettings.sd_mode)
        })
    }
) //REFACTOR: move to events.js

document
    .getElementById('btnRefreshModels')
    .addEventListener('click', async (e) => {
        await refreshUI()
        html_manip.tempDisableElement(e.target, 3000)
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
document
    .getElementById('btnLayerToSelection')
    .addEventListener('click', async () => {
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
//REFACTOR: move to events.js
document
    .getElementById('btnSetInitImageViewer')
    .addEventListener('click', async () => {
        //set init image event listener, use when session is active
        const layer = await app.activeDocument.activeLayers[0]
        const image_info =
            await session.GenerationSession.instance().silentSetInitImage(
                layer,
                session.GenerationSession.instance().random_session_id
            )
        const image_name = image_info['name']
        const path = `./server/python_server/init_images/${image_name}`
        viewer.ViewerManager.instance().addInitImageLayers(layer, path, false)
        await viewer.ViewerManager.instance().loadInitImageViewerObject(path)
        // await loadInitImageViewerObject(
        //     group,
        //     snapshot,
        //     solid_background,
        //     path,
        //     auto_delete,
        //     base64_image
        // )
    })
//REFACTOR: move to events.js
document
    .getElementById('btnSetMaskViewer')
    .addEventListener('click', async () => {
        await viewer.ViewerManager.instance().setMaskViewer()
    })

// document.getElementById('bSetInitImage').addEventListener('click', async () => {
//     const layer = await app.activeDocument.activeLayers[0]
//     await psapi.setInitImage(layer, random_session_id)
// })

// document
//     .getElementById('bSetInitImageMask')
//     .addEventListener('click', async () => {
//         const layer = await app.activeDocument.activeLayers[0]
//         await psapi.setInitImageMask(layer, random_session_id)
//     })

// psapi.moveElementToAnotherTab("batchNumberUi","batchNumberViewerTabContainer")
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
            await session.GenerationSession.instance().deleteProgressLayer() // delete the old progress layer

            //update the progress image
            const selection_info = await session.GenerationSession.instance()
                .selectionInfo
            const b_exsit = layer_util.Layer.doesLayerExist(
                session.GenerationSession.instance().progress_layer
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
                session.GenerationSession.instance().progress_layer = layer // sotre the new progress layer// TODO: make sure you delete the progress layer when the geneeration request end
            } else {
                // if ,somehow, the layer still exsit
                await layer_util.cleanLayers([
                    session.GenerationSession.instance().progress_layer,
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
        progress_value = json.progress * 100
        html_manip.updateProgressBarsHtml(progress_value)
        if (
            json?.current_image &&
            session.GenerationSession.instance().request_status ===
                Enum.RequestStateEnum['Generating']
        ) {
            const base64_url = general.base64ToBase64Url(json.current_image)

            const progress_image_html = document.getElementById('progressImage')
            const container_width = document.querySelector(
                '#divProgressImageViewerContainer'
            ).offsetWidth
            //*) find the parent container width
            //*) set the width of the image to auto
            //*) scale to closest while keeping the ratio, the hieght should not be larger than the width of the container

            // const progress_image_container = document.getElementById(
            //     'divProgressImageViewerContainer'
            // )
            // progress_image_container.style.width =
            //     progress_image_html.naturalWidth
            // progress_image_container.style.height =
            //     progress_image_html.naturalHeight
            html_manip.setProgressImageSrc(base64_url)

            // const [new_width, new_height] = general.scaleToClosestKeepRatio(
            //     progress_image_html.naturalWidth,
            //     progress_image_html.naturalHeight,
            //     container_width,
            //     container_width
            // )

            // progress_image_html.style.width = '100%'
            if (progress_image_html.style.width !== 'auto') {
                progress_image_html.style.width = 'auto'
            }
            if ((progress_image_html.style.height = 'auto' !== 'auto')) {
                progress_image_html.style.height = 'auto'
            }

            // progress_image_html = new_height
            // progress_image_html.style.width = progress_image_html.naturalWidth
            // progress_image_html.style.height = progress_image_html.naturalHeight

            if (
                session.GenerationSession.instance().last_settings
                    .batch_size === 1 &&
                settings_tab.getUseLiveProgressImage()
            ) {
                //only update the canvas if the number of images are one
                //don't update the canvas with multiple images.
                await updateProgressImage(json.current_image)
            }
        }
        if (
            session.GenerationSession.instance().isActive() &&
            g_can_request_progress == true
        ) {
            //refactor this code
            setTimeout(async () => {
                await progressRecursive()
            }, 1000)
        }
    } catch (e) {
        if (
            session.GenerationSession.instance().isActive() &&
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

// document.getElementById('btnNewLayer').addEventListener('click', psapi.imageToSmartObject )

// document.getElementById('btnImagesToLayers').addEventListener('click',psapi.openImageExe)

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

// document.getElementById('btnLoadImages').addEventListener('click',ImagesToLayersExe)

//stack layer to original document
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
    img.src = file_util.base64ToSrc(base64_image)
    img.className = 'viewer-image'
    console.log('image_path: ', image_path)
    // img.dataset.image_id = layer_id
    // img.dataset.image_path = image_path // image_path is not the same as src
    return img
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
    const initImage = viewer.ViewerManager.instance().addInitImage(
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
    viewer.ViewerManager.instance().init_image_container.appendChild(
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
            'session.GenerationSession.instance().image_paths_to_layers:',
            session.GenerationSession.instance().image_paths_to_layers
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
        image_paths = Object.keys(
            session.GenerationSession.instance().image_paths_to_layers
        )
        console.log('image_paths: ', image_paths)
        let i = 0

        // const viewer_layers = []

        // if(viewer.ViewerManager.instance().g_init_image_related_layers.hasOwnProperty('init_image_group') )
        if (viewer.ViewerManager.instance().initGroup) {
            //it means we are in an img2img related mode

            const paths = Object.keys(
                viewer.ViewerManager.instance().initImageLayersJson
            )
            for (const path of paths) {
                if (!viewer.ViewerManager.instance().hasViewerImage(path)) {
                    // const group =
                    //     viewer.ViewerManager.instance().initImageLayersJson[path].group
                    // const snapshot =
                    //     viewer.ViewerManager.instance().initImageLayersJson[path].snapshot
                    // const solid_background =
                    //     viewer.ViewerManager.instance().initImageLayersJson[path]
                    //         .solid_background
                    // const auto_delete =
                    //     viewer.ViewerManager.instance().initImageLayersJson[path].autoDelete
                    // const base64_image =
                    //     session.GenerationSession.instance().base64initImages[path]
                    // await loadInitImageViewerObject(
                    //     group,
                    //     snapshot,
                    //     solid_background,
                    //     path,
                    //     auto_delete,
                    //     base64_image
                    // )
                    await viewer.ViewerManager.instance().loadInitImageViewerObject(
                        path
                    )

                    // await NewViewerImageClickHandler(init_img_html, initImage) // create click handler for each images
                }
            }
        }

        // if (g_mask_related_layers.hasOwnProperty('mask_group')) {
        if (viewer.ViewerManager.instance().maskGroup) {
            const path = `./server/python_server/init_images/${
                session.GenerationSession.instance().init_image_mask_name
            }`
            if (!viewer.ViewerManager.instance().hasViewerImage(path)) {
                // const group = g_mask_related_layers['mask_group']
                // const white_mark = g_mask_related_layers['white_mark']
                // const solid_background = g_mask_related_layers['solid_black']

                const group =
                    viewer.ViewerManager.instance().maskLayersJson[path].group
                const white_mark =
                    viewer.ViewerManager.instance().maskLayersJson[path]
                        .white_mark
                const solid_background =
                    viewer.ViewerManager.instance().maskLayersJson[path]
                        .solid_background
                const mask_obj = viewer.ViewerManager.instance().addMask(
                    group,
                    white_mark,
                    solid_background,
                    path
                )

                const mask_img_html = createViewerImgHtml(
                    './server/python_server/init_images/',
                    session.GenerationSession.instance().init_image_mask_name,
                    session.GenerationSession.instance().base64maskImage[path]
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

        console.log('image_paths: ', image_paths)
        let lastOutputImage
        for (const path of image_paths) {
            // const path = image_path
            //check if viewer obj already exist by using the path on hard drive
            if (!viewer.ViewerManager.instance().hasViewerImage(path)) {
                //create viewer object if it doesn't exist

                //create an html image element and attach it container, and link it to the viewer obj

                const layer =
                    session.GenerationSession.instance().image_paths_to_layers[
                        path
                    ]
                const img = createViewerImgHtml(
                    output_dir_relative,
                    path,
                    session.GenerationSession.instance().base64OutputImages[
                        path
                    ]
                )
                const output_image_obj =
                    viewer.ViewerManager.instance().addOutputImage(layer, path)
                lastOutputImage = output_image_obj
                const b_button_visible =
                    session.GenerationSession.instance().mode !==
                    Enum.generationMode['Txt2Img']
                        ? true
                        : false

                output_image_obj.createThumbnailNew(img, b_button_visible)
                // output_image_obj.setImgHtml(img)
                // if (session.GenerationSession.instance().mode !== generationMode['Txt2Img']) {
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

// document.getElementById('btnLoadViewer').addEventListener('click', loadViewerImages)
//REFACTOR: move to events.js
document
    .getElementById('btnLoadHistory')
    .addEventListener('click', async function () {
        try {
            const output_dir_relative = './server/python_server/'
            const container = document.getElementById(
                'divHistoryImagesContainer'
            )
            const uniqueDocumentId = await document_util.getUniqueDocumentId()
            const [image_paths, metadata_jsons, base64_images] =
                await sdapi.loadHistory(uniqueDocumentId)

            while (container.firstChild) {
                container.removeChild(container.firstChild)
            }

            const length = image_paths.length
            // let i = length -1

            // for (image_path of image_paths) {
            for (let i = length - 1; i >= 0; --i) {
                const img = document.createElement('img')
                // img.src = `${output_dir_relative}/${image_path}`
                const image_src = `data:image/png;base64, ${base64_images[i]}`
                img.src = image_src

                img.dataset.path = `${output_dir_relative}/${image_paths[i]}`
                img.className = 'history-image'
                img.dataset.metadata_json_string = JSON.stringify(
                    metadata_jsons[i]
                )
                console.log(`metadata_jsons[${i}]: `, metadata_jsons[i])

                const img_container = thumbnail.Thumbnail.wrapImgInContainer(
                    img,
                    'viewer-image-container'
                )
                thumbnail.Thumbnail.addSPButtonToContainer(
                    img_container,
                    'svg_sp_btn',
                    'copy metadata to settings',
                    getHistoryMetadata,
                    img
                )
                thumbnail.Thumbnail.addSPButtonToContainer(
                    img_container,
                    'svg_sp_btn_datadownload',
                    'place the image on the canvas',
                    moveHistoryImageToLayer,
                    img
                )
                container.appendChild(img_container)
                // i++
            }
        } catch (e) {
            console.warn(`loadHistory warning: ${e}`)
        }
    })
//REFACTOR: move to document_util.js
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
    // autoFillInSettings(metadata_json)
    g_ui_settings.autoFillInSettings(metadata_json)
}
//REFACTOR: move to document_util.js
async function moveHistoryImageToLayer(img) {
    let image_path = img.dataset.path
    const image_path_escape = image_path.replace(/\o/g, '/o') //escape string "\o" in "\output"

    // load the image from "data:image/png;base64," base64_str
    const base64_image = img.src.replace('data:image/png;base64,', '')
    // await base64ToFile(base64_image)
    const metadata_json = JSON.parse(img.dataset.metadata_json_string)
    const to_x = metadata_json['selection_info']?.left
    const to_y = metadata_json['selection_info']?.top
    const width = metadata_json['selection_info']?.width
    const height = metadata_json['selection_info']?.height
    await io.IO.base64ToLayer(
        base64_image,
        'History Image',
        to_x,
        to_y,
        width,
        height
    )
}
//REFACTOR: move to events.js
document
    .getElementById('btnImageSearch')
    .addEventListener('click', async function () {
        try {
            // const output_dir_relative = "./server/python_server/"
            const container = document.getElementById(
                'divImageSearchImagesContainer'
            )
            // const uniqueDocumentId = await getUniqueDocumentId()
            // const [image_paths, metadata_jsons] = await sdapi.loadHistory(uniqueDocumentId)
            const keywords = document.getElementById('imageSearchField').value
            const image_search_objs = await sdapi.imageSearch(keywords)
            while (container.firstChild) {
                container.removeChild(container.firstChild)
            }

            // let i = 0
            const temp_entry = await fs.getTemporaryFolder()
            for (let image_search_obj of image_search_objs) {
                const img = document.createElement('img')
                // img.src = image_search_obj['image']

                img.src = image_search_obj['thumbnail']

                img.className = 'image-search'
                // img.dataset.metadata_json_string = JSON.stringify(metadata_jsons[i])
                container.appendChild(img)
                img.addEventListener('click', async (e) => {
                    console.log(`the image url: ${img.src}`)
                    const link = img.src
                    const image_file_name = 'search_image_temp.png'
                    await downloadItExe(link, temp_entry, image_file_name)
                    // const metadata_json = JSON.parse(e.target.dataset.metadata_json_string)
                    // console.log("metadata_json: ",metadata_json)
                    // document.querySelector('#tiSeed').value = metadata_json.Seed
                    // document.querySelector('#historySeedLabel').textContent = metadata_json.Seed
                    // autoFillInSettings(metadata_json)
                })
                // i++
            }
        } catch (e) {
            console.warn(`imageSearch warning: ${e}`)
        }
    })
//REFACTOR: move to document_util.js
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

// Hi res fix stuff

// var hr_models = [
//     'Latent',
//     'Latent (antialiased)',
//     'Latent (bicubic)',
//     'Latent (bicubic antialiased)',
//     'Latent (nearest)',
//     'Latent (nearest-exact)',
//     'None',
//     'Lanczos',
//     'Nearest',
//     'ESRGAN_4x',
//     'R-ESRGAN 4x+',
//     'R-ESRGAN 4x+ Anime6B',
//     'LDSR',
//     'SwinIR 4x',
// ]

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

            //get the inpaint mask weight from the webui sd
            await g_sd_options_obj.getOptions()
            const inpainting_mask_weight =
                await g_sd_options_obj.getInpaintingMaskWeight()
            // html_manip.autoFillInInpaintingMaskWeight(inpainting_mask_weight)
            // const slider_value = inpainting_mask_weight * 100
            // evt.target.value = inpainting_mask_weight * 100
            // document.getElementById('lInpaintingMaskWeight').innerHTML = `${inpainting_mask_weight}`
            console.log('inpainting_mask_weight: ', inpainting_mask_weight)
            html_manip.autoFillInInpaintMaskWeight(inpainting_mask_weight)
        } catch (e) {
            console.warn(e)
        }
    })
//REFACTOR: move to document_util.js
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
//REFACTOR: move to document_util.js
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

//REFACTOR: move to events.js
document
    .getElementById('btnSelectionArea')
    .addEventListener('click', async () => {
        // try {
        //     if (psapi.isSelectionValid(session.GenerationSession.instance().selectionInfo)) {
        //         await psapi.reSelectMarqueeExe(
        //             session.GenerationSession.instance().selectionInfo
        //         )
        //         await eventHandler()
        //     }
        // } catch (e) {
        //     console.warn(e)
        // }
        await session.GenerationSession.instance().activateSessionSelectionArea()
    })
//REFACTOR: move to ui.js
function addPresetMenuItem(preset_title) {
    // console.log(model_title,model_name)
    const menu_item_element = document.createElement('sp-menu-item')
    menu_item_element.className = 'mPresetMenuItem'
    menu_item_element.innerHTML = preset_title

    // menu_item_element.addEventListener('select',()=>{
    //   preset_func(g_ui_settings)
    // })
    return menu_item_element
}
//REFACTOR: move to ui.js
function populatePresetMenu() {
    const divider_elem = document.createElement('sp-menu-divider')
    const preset_name = 'Select Smart Preset'
    const preset_func = () => {}
    const dummy_preset_item = addPresetMenuItem(preset_name, preset_func)
    dummy_preset_item.setAttribute('selected', 'selected')
    // dummy_preset_item.setAttribute('disabled')
    document.getElementById('mPresetMenu').appendChild(dummy_preset_item)
    document.getElementById('mPresetMenu').appendChild(divider_elem)
    for ([key, value] of Object.entries(ui.loadedPresets)) {
        const preset_menu_item = addPresetMenuItem(key, value)
        document.getElementById('mPresetMenu').appendChild(preset_menu_item)
    }
}
//REFACTOR: move to ui.js
populatePresetMenu()
//REFACTOR: move to events.js
document
    .getElementById('mPresetMenu')
    .addEventListener('change', async (evt) => {
        const preset_index = evt.target.selectedIndex
        const preset_name = evt.target.options[preset_index].textContent
        if (ui.loadedPresets.hasOwnProperty(preset_name)) {
            const loader = ui.loadedPresets[preset_name]
            if (loader.constructor.name === 'AsyncFunction') {
                await loader(g_ui_settings)
            } else {
                loader(g_ui_settings)
            }
        }
    })

const py_re = require('./utility/sdapi/python_replacement')
const { UI } = require('./utility/ui')
const GenerationSettings = require('./utility/generation_settings')
const document_util = require('./utility/document_util')
const file_util = require('./utility/file_util')

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
    viewer.ViewerManager.instance().thumbnail_scaler = scaler_value

    try {
        viewer.ViewerManager.instance().scaleThumbnails(
            0,
            0,
            0,
            0,
            viewer.ViewerManager.instance().thumbnail_scaler
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
            viewer.ViewerManager.instance().isSquareThumbnail = true
        } else {
            viewer.ViewerManager.instance().isSquareThumbnail = false
        }
        const thumbnail_size_slider = document.getElementById('slThumbnailSize')
        scaleThumbnailsEvenHandler(
            thumbnail_size_slider.value,
            thumbnail_size_slider.max,
            thumbnail_size_slider.min
        )
    })
//REFACTOR: move to events.js
Array.from(document.querySelectorAll('.rbSubTab')).forEach((rb) => {
    const tab_button_name = rb.dataset['tab-name']
    const tab_page_name = `${tab_button_name}-page`

    try {
        document
            .getElementById(tab_button_name)
            .addEventListener('click', () => {
                document.getElementById(tab_button_name)
                const option_container = document
                    .getElementById(tab_page_name)
                    .querySelector('.subTabOptionsContainer')
                const radio_group = document.getElementById('rgSubTab')
                rb.checked = true
                option_container.appendChild(radio_group)
            })

        rb.onclick = () => {
            document.getElementById(tab_button_name).click()
        }
    } catch (e) {
        console.warn(e)
    }
})
//REFACTOR: move to ui.js
//REFACTOR: move to events.js
document
    .getElementById('btnSaveHordeSettings')
    .addEventListener('click', async () => {
        await horde_native.HordeSettings.saveSettings()
    })
//REFACTOR: move to document_util.js
async function findDocumentType() {
    //check if the background layer exsit
    //if it doesn't return false
    //if it does:
    //duplicate the background layer and place it on the top of the document.
    //sampler 10 random pixles
    //and check if all the pixels has the same values.
    //if it doesn't duplicate the background layer and place it above the background layer.
    // make a white background layer.
    //return true

    let document_type
    const background_layer = await app.activeDocument.backgroundLayer
    const artboards = Array.from(await app.activeDocument.artboards)
    if (artboards.length > 0) {
        document_type = Enum.DocumentTypeEnum['ArtBoard']
    } else if (layer_util.Layer.doesLayerExist(background_layer)) {
        //assume it's solid white background if correctHistory > 1 || layers.length > 5
        const b_correct_background = await isCorrectBackground() // check the history for correct operation
        if (b_correct_background) {
            document_type = Enum.DocumentTypeEnum['SolidBackground']
        } else {
            //else

            //background layer does exist
            //check if it's solid color background or an image background
            //sampler 10 random pixels
            let width = app.activeDocument.width
            let height = app.activeDocument.height
            let old_rgb
            let same_color = true

            await executeAsModal(async () => {
                await layer_util.toggleBackgroundLayerExe() // hide all layers except the background layer
                for (let i = 0; i < 10; ++i) {
                    let x = Math.floor(Math.random() * width)
                    let y = Math.floor(Math.random() * height)

                    const rgb = await psapi.getColor(x, y)
                    if (old_rgb) {
                        if (
                            Math.round(old_rgb[0]) === Math.round(rgb[0]) &&
                            Math.round(old_rgb[1]) === Math.round(rgb[1]) &&
                            Math.round(old_rgb[2]) === Math.round(rgb[2])
                        ) {
                        } else {
                            same_color = false //it's an image background
                            break
                        }
                    }
                    old_rgb = rgb
                }
                await layer_util.toggleBackgroundLayerExe() // undo the toggle operation
            })

            document_type = same_color
                ? Enum.DocumentTypeEnum['SolidBackground']
                : Enum.DocumentTypeEnum['ImageBackground']
        }
    } else {
        //create the background layer since it doesn't exsit
        document_type = Enum.DocumentTypeEnum['NoBackground']
    }

    return document_type
}
//REFACTOR: move to document_util.js
async function correctDocumentType(documentType) {
    if (documentType === Enum.DocumentTypeEnum['SolidBackground']) {
        //do nothing
    } else if (documentType === Enum.DocumentTypeEnum['ImageBackground']) {
        //duplicate the layer
        await executeAsModal(async () => {
            const image_layer =
                await app.activeDocument.backgroundLayer.duplicate() //
            image_layer.name = 'Image'
            await app.activeDocument.backgroundLayer.delete()
            await psapi.createBackgroundLayer(255, 255, 255)
        })
    } else if (documentType === Enum.DocumentTypeEnum['ArtBoard']) {
        //duplicate the layer
        await app.showAlert(
            "the plugin doesn't work with artboards, create normal document with no artboard to use the plugin"
        )
        throw "the plugin doesn't work with artboards, create normal document with no artboard to use the plugin"
    } else if (documentType === Enum.DocumentTypeEnum['NoBackground']) {
        await psapi.createBackgroundLayer(255, 255, 255)
    }
}

async function isCorrectBackground() {
    const historylist = app.activeDocument.historyStates.filter(
        (h) => h.name === 'Correct Background'
    )
    console.log('historylist:', historylist)
    const is_correct_background = historylist.length > 0 ? true : false
    return is_correct_background
}

document
    .getElementById('btnSaveHordeSettings')
    .addEventListener('click', async () => {
        await horde_native.HordeSettings.saveSettings()
    })

// async function findDocumentType() {
//     //check if the background layer exsit
//     //if it doesn't return false
//     //if it does:
//     //duplicate the background layer and place it on the top of the document.
//     //sampler 10 random pixles
//     //and check if all the pixels has the same values.
//     //if it doesn't duplicate the background layer and place it above the background layer.
//     // make a white background layer.
//     //return true

//     let document_type
//     const background_layer = await app.activeDocument.backgroundLayer
//     const artboards = Array.from(await app.activeDocument.artboards)
//     if (artboards.length > 0) {
//         document_type = Enum.DocumentTypeEnum['ArtBoard']
//     } else if (layer_util.Layer.doesLayerExist(background_layer)) {
//         //assume it's solid white background if correctHistory > 1 || layers.length > 5
//         const b_correct_background = await isCorrectBackground()
//         if (b_correct_background) {
//             document_type = Enum.DocumentTypeEnum['SolidBackground']
//         } else {
//             //else

//             //background layer does exist
//             //check if it's solid color background or an image background
//             //sampler 10 random pixels
//             let width = app.activeDocument.width
//             let height = app.activeDocument.height
//             let old_rgb
//             let same_color = true
//             await executeAsModal(async () => {
//                 for (let i = 0; i < 10; ++i) {
//                     let x = Math.floor(Math.random() * width)
//                     let y = Math.floor(Math.random() * height)

//                     const rgb = await getColor(x, y)
//                     if (old_rgb) {
//                         if (
//                             Math.round(old_rgb[0]) === Math.round(rgb[0]) &&
//                             Math.round(old_rgb[1]) === Math.round(rgb[1]) &&
//                             Math.round(old_rgb[2]) === Math.round(rgb[2])
//                         ) {
//                         } else {
//                             same_color = false //it's an image background
//                             break
//                         }
//                     }
//                     old_rgb = rgb
//                 }
//             })

//             document_type = same_color
//                 ? Enum.DocumentTypeEnum['SolidBackground']
//                 : Enum.DocumentTypeEnum['ImageBackground']
//         }
//     } else {
//         //create the background layer since it doesn't exsit
//         document_type = Enum.DocumentTypeEnum['NoBackground']
//     }

//     return document_type
// }

async function correctDocumentType(documentType) {
    if (documentType === Enum.DocumentTypeEnum['SolidBackground']) {
        //do nothing
    } else if (documentType === Enum.DocumentTypeEnum['ImageBackground']) {
        //duplicate the layer
        await executeAsModal(async () => {
            const image_layer =
                await app.activeDocument.backgroundLayer.duplicate() //
            image_layer.name = 'Image'
            await app.activeDocument.backgroundLayer.delete()
            await psapi.createBackgroundLayer(255, 255, 255)
        })
    } else if (documentType === Enum.DocumentTypeEnum['ArtBoard']) {
        //duplicate the layer
        await app.showAlert(
            "the plugin doesn't work with artboards, create normal document with no artboard to use the plugin"
        )
        throw "the plugin doesn't work with artboards, create normal document with no artboard to use the plugin"
    } else if (documentType === Enum.DocumentTypeEnum['NoBackground']) {
        await psapi.createBackgroundLayer(255, 255, 255)
    }
}

async function isCorrectBackground() {
    const historylist = app.activeDocument.historyStates.filter(
        (h) => h.name === 'Correct Background'
    )
    console.log('historylist:', historylist)
    const is_correct_background = historylist.length > 0 ? true : false
    return is_correct_background
}
