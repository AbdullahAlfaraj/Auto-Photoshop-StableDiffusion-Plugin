const { cleanLayers } = require('../psapi')
const psapi = require('../psapi')
const io = require('./io')
const Enum = require('../enum')
const { ViewerManager } = require('../viewer')
const { base64ToBase64Url } = require('./general')
const html_manip = require('./html_manip')
const layer_util = require('./layer')
const SessionState = {
    Active: 'active',
    Inactive: 'inactive',
}
const GarbageCollectionState = {
    Accept: 'accept', // accept all generated images
    Discard: 'discard', //discard all generated images
    DiscardSelected: 'discard_selected',
    AcceptSelected: 'accept_selected', //accept_selected only chosen images
}

class GenerationSession {
    constructor() {
        //this should be unique session id and it also should act as the total number of sessions been created in the project
        this.id = 0
        this.state = SessionState['Inactive']
        this.mode = 'txt2img'
        this.selectionInfo = null
        this.isFirstGeneration = true // only before the first generation is requested should this be true
        this.outputGroup
        this.prevOutputGroup
        this.isLoadingActive = false
        this.base64OutputImages = {} //image_id/path => base64_image
        this.base64initImages = {} //init_image_path => base64
        this.base64maskImage = []
        this.base64maskExpansionImage
        this.activeBase64InitImage
        this.activeBase64MaskImage
        this.image_paths_to_layers = {}
        this.progress_layer
        this.last_settings //the last settings been used for generation
        this.controlNetImage = [] // base64 images (one for each control net)
        this.controlNetMask = [] // base64 images (one for each control net)
        this.request_status = Enum.RequestStateEnum['Finished'] //finish or ideal state
        this.is_control_net = false
        this.control_net_selection_info
        this.control_net_preview_selection_info
    }
    isActive() {
        return this.state === SessionState['Active']
    }
    isInactive() {
        return this.state === SessionState['Inactive']
    }
    activate() {
        this.state = SessionState['Active']
    }
    deactivate() {
        this.state = SessionState['Inactive']
    }
    name() {
        return `session - ${this.id}`
    }
    async startSession() {
        this.id += 1 //increment the session id for each session we start
        this.activate()
        this.isFirstGeneration = true // only before the first generation is requested should this be true

        console.log('current session id: ', this.id)
        try {
            const session_name = this.name()
            const activeLayers = await app.activeDocument.activeLayers
            await psapi.unselectActiveLayersExe() // unselect all layer so the create group is place at the top of the document
            this.prevOutputGroup = this.outputGroup
            const outputGroup = await psapi.createEmptyGroup(session_name)
            await executeAsModal(async () => {
                outputGroup.allLocked = true //lock the session folder so that it can't move
            })
            this.outputGroup = outputGroup
            await psapi.selectLayersExe(activeLayers)
        } catch (e) {
            console.warn(e)
        }
    }

    async endSession(garbage_collection_state) {
        try {
            if (!this.isActive()) {
                //return if the session is not active
                return null
            }
            this.state = SessionState['Inactive'] // end the session by deactivate it

            this.deactivate()

            if (garbage_collection_state === GarbageCollectionState['Accept']) {
                await acceptAll()
            } else if (
                garbage_collection_state === GarbageCollectionState['Discard']
            ) {
                //this should be discardAll()

                await discardAll()
            } else if (
                garbage_collection_state ===
                GarbageCollectionState['DiscardSelected']
            ) {
                //this should be discardAllExcept(selectedLayers)
                await discardSelected() //this will discard what is not been highlighted
            } else if (
                garbage_collection_state ===
                GarbageCollectionState['AcceptSelected']
            ) {
                //this should be discardAllExcept(selectedLayers)
                await discard() //this will discard what is not been highlighted
            }

            //delete the old selection area
            // g_generation_session.selectionInfo = {}

            this.isFirstGeneration = true // only before the first generation is requested should this be true
            // const is_visible = await this.outputGroup.visible
            g_viewer_manager.last_selected_viewer_obj = null // TODO: move this in viewerManager endSession()
            g_viewer_manager.onSessionEnd()
            await layer_util.collapseFolderExe([this.outputGroup], false) // close the folder group
            await executeAsModal(async () => {
                this.outputGroup.allLocked = false //unlock the session folder on session end
            })
            // this.outputGroup.visible = is_visible

            if (
                this.mode === generationMode['Inpaint'] &&
                g_sd_mode === generationMode['Inpaint']
            ) {
                //create "Mask -- Paint White to Mask -- temporary" layer if current session was inpiant and the selected session is inpaint
                // the current inpaint session ended on inpaint
                g_b_mask_layer_exist = false
                await layer_util.deleteLayers([g_inpaint_mask_layer])
                await createTempInpaintMaskLayer()
            }
            //delete controlNet image, Note: don't delete control net, let the user disable controlNet if doesn't want to use it
            // this.controlNetImage = null
            // html_manip.setControlImageSrc('https://source.unsplash.com/random')
        } catch (e) {
            console.warn(e)
        }
    }
    // initializeInitImage(group, snapshot, solid_background, path) {
    //     this.initGroup = group
    //     this.init_solid_background = solid_background
    //     this.InitSnapshot = snapshot
    // }
    deleteInitImageLayers() {}
    async closePreviousOutputGroup() {
        try {
            //close the previous output folder

            if (this.prevOutputGroup) {
                // const is_visible = await this.prevOutputGroup.visible
                await layer_util.collapseFolderExe(
                    [this.prevOutputGroup],
                    false
                ) // close the folder group
                // and reselect the current output folder for clarity
                await psapi.selectLayersExe([this.outputGroup])
                // this.prevOutputGroup.visible = is_visible
            }
        } catch (e) {
            console.warn(e)
        }
    }
    isSameMode(selected_mode) {
        if (this.mode === selected_mode) {
            return true
        }
        return false
    }
    loadLastSession() {
        //load the last session from the server
    }
    saveCurrentSession() {
        //all session info will be saved in a json file in the project folder
    }
    async moveToTopOfOutputGroup(layer) {
        const output_group_id = await this.outputGroup.id
        let group_index = await psapi.getLayerIndex(output_group_id)
        const indexOffset = 1 //1 for background, 0 if no background exist
        await executeAsModal(async () => {
            await psapi.selectLayersExe([layer]) //the move command is selection selection sensitive
            await psapi.moveToGroupCommand(group_index - indexOffset, layer.id)
        })
    }

    async deleteProgressLayer() {
        try {
            await layer_util.deleteLayers([this.progress_layer]) // delete the old progress layer
        } catch (e) {
            console.warn(e)
        }
    }
    deleteProgressImageHtml() {
        try {
            // await layer_util.deleteLayers([this.progress_layer]) // delete the old progress layer
            // document.getElementById('progressImage').style.width = '0px'
            // document.getElementById('progressImage').style.height = '0px'

            document.getElementById(
                'divProgressImageViewerContainer'
            ).style.height = '0px'
        } catch (e) {
            console.warn(e)
        }
    }
    async deleteProgressImage() {
        preview.store.updateProperty('image', null)
        this.deleteProgressImageHtml()
        await this.deleteProgressLayer()
    }
    async setControlNetImageHelper() {
        const width = html_manip.getWidth()
        const height = html_manip.getHeight()

        //get the selection from the canvas as base64 png, make sure to resize to the width and height slider
        const selectionInfo = await psapi.getSelectionInfoExe()
        this.control_net_selection_info = selectionInfo
        this.control_net_preview_selection_info = selectionInfo
        // const base64_image = await io.IO.getSelectionFromCanvasAsBase64Silent(
        //     selectionInfo,
        //     true,
        //     width,
        //     height
        // )

        const use_silent_mode = html_manip.getUseSilentMode()
        let layer = null
        if (!use_silent_mode) {
            await psapi.snapshot_layerExe()
            const snapshotLayer = await app.activeDocument.activeLayers[0]
            layer = snapshotLayer
        }
        const base64_image =
            await io.IO.getSelectionFromCanvasAsBase64Interface(
                width,
                height,
                layer,
                selectionInfo,
                true,
                use_silent_mode
            )

        await layer_util.deleteLayers([layer]) //delete the snapshot layer if it exists
        return base64_image
    }
    async setControlNetImage(control_net_index = 0, base64_image) {
        //check if the selection area is active
        //convert layer to base64
        //the width and height of the exported image
        // const base64_image = this.setControlNetImageHelper()
        this.controlNetImage[control_net_index] = base64_image
        html_manip.setControlImageSrc(
            base64ToBase64Url(base64_image),
            control_net_index
        )
        // console.log('base64_img:', base64_image)
        // await io.IO.base64ToLayer(base64_image)
    }
}

//REFACTOR: move to generation_settings.js
async function getSettings(session_data) {
    let payload = {}

    try {
        const extension_type = settings_tab.getExtensionType() // get the extension type
        payload['selection_info'] = session_data.selectionInfo
        const numberOfBatchSize = parseInt(
            document.querySelector('#tiNumberOfBatchSize').value
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

        function calculateSeed(init_seed, batch_index, batch_size) {
            if (init_seed === -1) return -1
            const seed = init_seed + batch_index * batch_size
            return seed
        }

        const init_seed = parseInt(document.querySelector('#tiSeed').value)
        const seed = calculateSeed(
            init_seed,
            g_current_batch_index,
            numberOfBatchSize
        )

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
        const original_width = html_manip.getWidth()
        const original_height = html_manip.getHeight()

        const width = general.nearestMultiple(original_width, 64)
        const height = general.nearestMultiple(original_height, 64)

        const hWidth = html_manip.getSliderSdValue_Old('hrWidth', 64)
        const hHeight = html_manip.getSliderSdValue_Old('hrHeight', 64)
        const hSteps = html_manip.getSliderSdValue_Old('hrNumberOfSteps', 1)
        //const hScale = html_manip.getSliderSdValue_Old('hrScale',1)
        console.log('Check')

        const uniqueDocumentId = await getUniqueDocumentId()
        const h_denoising_strength = html_manip.getSliderSdValue_Old(
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
            console.log('g_init_image_mask_name is ', g_init_image_mask_name)
            payload['init_image_mask_name'] = g_init_image_mask_name
            payload['inpainting_fill'] = html_manip.getMaskContent()
            payload['mask_expansion'] = mask_expansion
            // payload['mask'] = g_generation_session.activeBase64MaskImage
            payload['mask'] = session_data?.mask
            payload['expanded_mask'] = session_data?.mask
            if (
                use_sharp_mask === false &&
                payload['mask'] &&
                mask_expansion > 0
            ) {
                //only if mask is available and sharp_mask is off
                // use blurry and expanded mask

                const expanded_mask = await py_re.maskExpansionRequest(
                    payload['mask'],
                    payload['mask_expansion'],
                    mask_blur
                )
                if (expanded_mask) {
                    payload['expanded_mask'] = expanded_mask
                    payload['mask'] = expanded_mask
                    session_ts.store.data.expanded_mask = expanded_mask
                }
            }
            // viewer.store.mask = payload['mask'] // make sure
        } else if (mode == 'img2img') {
            var g_use_mask_image = false
            delete payload['inpaint_full_res'] //  inpaint full res is not available in img2img mode
            delete payload['inpaint_full_res_padding']
            delete payload['init_image_mask_name']
            delete payload['inpainting_fill']
        }

        if (
            g_sd_mode == 'img2img' ||
            g_sd_mode == 'inpaint' ||
            g_sd_mode == 'outpaint'
        ) {
            // const { init_image, mask } =  io.getOutpaintInitImageAndMask()
            console.log(`g_use_mask_image:? ${g_use_mask_image}`)

            denoising_strength = html_manip.getDenoisingStrength()
            payload['denoising_strength'] = denoising_strength
            payload['init_image_name'] = g_init_image_name

            payload['init_images'] = [session_data?.init_image]
            // payload['init_images'] = [
            //     g_generation_session.activeBase64InitImage,
            //     // init_image,
            // ]
            payload['image_cfg_scale'] = sd_tab.getImageCfgScaleSDValue() // we may need to check if model is pix2pix

            if (
                scripts.script_store.isInstalled() &&
                scripts.script_store.is_active &&
                scripts.script_store.selected_script_name !== 'None' &&
                scripts.script_store.is_selected_script_available
            ) {
                payload['script_args'] = scripts.script_store.orderedValues()

                payload['script_name'] =
                    scripts.script_store.selected_script_name //'Ultimate SD upscale'
            }
        } else {
            delete payload['script_args']
            delete payload['script_name']
        }

        // payload['script_args'] = []

        // payload['script_name'] = 'after detailer'
        function setAlwaysOnScripts() {
            const data = after_detailer_script.store.toJsFunc().data
            // console.log('setAlwaysOnScripts=> data:', data)

            const alwayson_scripts = {
                adetailer: {
                    args: [
                        data.is_enabled,
                        {
                            // ad_model: 'face_yolov8n.pt',
                            ad_model: data.ad_model,
                            ad_prompt: data.prompt,
                            ad_negative_prompt: data.negativePrompt,
                            ad_conf: data.ad_conf,
                            ad_mask_min_ratio: 0.0,
                            ad_mask_max_ratio: 1.0,
                            ad_dilate_erode: 32,
                            ad_x_offset: 0,
                            ad_y_offset: 0,
                            ad_mask_merge_invert: 'None',
                            ad_mask_blur: 4,
                            ad_denoising_strength: 0.4,
                            ad_inpaint_full_res: true,
                            ad_inpaint_full_res_padding: 0,
                            ad_use_inpaint_width_height: false,
                            ad_inpaint_width: 512,
                            ad_inpaint_height: 512,
                            ad_use_steps: true,
                            ad_steps: 28,
                            ad_use_cfg_scale: false,
                            ad_cfg_scale: 7.0,
                            ad_restore_face: false,
                            ad_controlnet_model: data.controlnet_model,
                            ad_controlnet_weight: data.controlNetWeight,
                        },
                    ],
                },
            }
            if (!data?.is_installed) {
                delete alwayson_scripts['adetailer']
            }
            return alwayson_scripts
        }

        const alwyason_scripts = setAlwaysOnScripts()
        payload['alwayson_scripts'] = {
            ...(payload['alwayson_scripts'] || {}),
            ...alwyason_scripts,
        }

        if (hi_res_fix && width >= 512 && height >= 512) {
            const hr_scale = sd_tab.getHrScaleSliderSDValue()

            payload['enable_hr'] = hi_res_fix
            // payload['firstphase_width'] = width
            // payload['firstphase_height'] = height
            // payload['hr_resize_x'] = hWidth
            // payload['hr_resize_y'] = hHeight
            payload['hr_scale'] = hr_scale // Scale
            payload['hr_upscaler'] = upscaler // Upscaler
            payload['hr_second_pass_steps'] = hSteps // Number of Steps
        } else {
            //fix hi res bug: if we include firstphase_width or firstphase_height in the payload,
            // sd api will use them instead of using width and height variables, even when enable_hr is set to "false"
            delete payload['enable_hr']
            // delete payload['firstphase_width']
            // delete payload['firstphase_height']
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
        } else if (
            payload['script_name'] === script_horde.script_name &&
            backend_type !== backendTypeEnum['Auto1111HordeExtension']
        ) {
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
            batch_size: numberOfBatchSize,
            cfg_scale: cfg_scale,
            seed: seed,
            // mask_blur: mask_blur, // don't use auto1111 blur, instead use Auto-Photoshop-SD blur
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

module.exports = {
    GenerationSession,
    GarbageCollectionState,
    SessionState,
    getSettings,
}
