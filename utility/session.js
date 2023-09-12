const { cleanLayers } = require('../psapi')
const psapi = require('../psapi')
const io = require('./io')
const Enum = require('../enum')

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
        const extension_type = settings_tab_ts.store.data.extension_type // get the extension type
        payload['selection_info'] = session_data.selectionInfo
        const numberOfBatchSize = parseInt(sd_tab_store.data.batch_size)

        const prompt = multiPrompts.getPrompt().positive
        const negative_prompt = multiPrompts.getPrompt().negative
        const hi_res_fix = sd_tab_store.data.enable_hr

        const upscaler = sd_tab_store.data.hr_upscaler
        const cfg_scale = sd_tab_store.data.cfg

        function calculateSeed(init_seed, batch_index, batch_size) {
            if (init_seed === -1) return -1
            const seed = init_seed + batch_index * batch_size
            return seed
        }

        const init_seed = parseInt(sd_tab_store.data.seed)
        const seed = calculateSeed(
            init_seed,
            g_current_batch_index,
            numberOfBatchSize
        )

        const use_sharp_mask = settings_tab_ts.store.data.extension_type
        const mask_blur = settings_tab_ts.store.data.use_sharp_mask
            ? 0
            : sd_tab_store.data.mask_blur
        const mask_expansion = sd_tab_store.data.mask_expansion

        const inpaint_full_res_padding =
            sd_tab_store.data.inpaint_full_res_padding

        // console.dir(numberOfImages)
        const bUsePromptShortcut =
            settings_tab_ts.store.data.use_prompt_shortcut
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
        const original_width = sd_tab_store.data.width
        const original_height = sd_tab_store.data.height

        const width = general.nearestMultiple(original_width, 64)
        const height = general.nearestMultiple(original_height, 64)

        //const hScale = html_manip.getSliderSdValue_Old('hrScale',1)

        const uniqueDocumentId = await getUniqueDocumentId()
        const h_denoising_strength = sd_tab_store.data.hr_denoising_strength

        //Note: store the sampler names in json file if auto is offline or auto api is unmounted

        const sampler_name = sd_tab_store.data.sampler_name

        const mode = sd_tab_store.data.rb_mode
        const b_restore_faces = sd_tab_store.data.restore_faces

        let denoising_strength = h_denoising_strength
        if (mode == 'inpaint' || mode == 'outpaint') {
            payload['inpaint_full_res'] = sd_tab_store.data.inpaint_full_res

            payload['inpaint_full_res_padding'] = inpaint_full_res_padding

            payload['inpainting_fill'] = sd_tab_store.data.inpainting_fill
            payload['mask_expansion'] = mask_expansion

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
                    session_store.data.expanded_mask = expanded_mask
                }
            }
            // viewer.store.mask = payload['mask'] // make sure
        }

        if (mode == 'img2img' || mode == 'inpaint' || mode == 'outpaint') {
            denoising_strength = sd_tab_store.data.denoising_strength
            payload['denoising_strength'] = denoising_strength

            payload['init_images'] = [session_data?.init_image]

            if (settings_tab_ts.store.data.use_image_cfg_scale_slider) {
                payload['image_cfg_scale'] = sd_tab_store.data.image_cfg_scale // we may need to check if model is pix2pix
            }

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
        }

        function setAlwaysOnScripts() {
            const data = after_detailer_script.store.toJsFunc().data
            // console.log('setAlwaysOnScripts=> data:', data)
            let ad_controlnet_module = null
            if (data.controlnet_model?.includes('inpaint')) {
                ad_controlnet_module = 'inpaint_global_harmonious'
            }
            const alwayson_scripts = {
                ADetailer: {
                    args: [
                        data.is_enabled,
                        {
                            ad_model: data.ad_model,
                            ad_prompt: data.prompt,
                            ad_negative_prompt: data.negativePrompt,
                            ad_confidence: data.ad_conf,
                            ad_mask_min_ratio: 0.0,
                            ad_mask_max_ratio: 1.0,
                            ad_dilate_erode: 32,
                            ad_x_offset: 0,
                            ad_y_offset: 0,
                            ad_mask_merge_invert: 'None',
                            ad_mask_blur: 4,
                            ad_denoising_strength: 0.4,
                            ad_inpaint_only_masked: true,
                            ad_inpaint_only_masked_padding: 0,
                            ad_use_inpaint_width_height: false,
                            ad_inpaint_width: 512,
                            ad_inpaint_height: 512,
                            ad_use_steps: true,
                            ad_steps: 28,
                            ad_use_cfg_scale: false,
                            ad_cfg_scale: 7.0,
                            ad_use_sampler: false,
                            ad_sampler: sampler_name, //use the current sd sampler
                            ad_use_noise_multiplier: false,
                            ad_noise_multiplier: 1.0,
                            ad_restore_face: false,

                            ad_controlnet_model: data.controlnet_model,
                            // ad_controlnet_module: data.controlnet_module,
                            ad_controlnet_module: ad_controlnet_module,
                            ad_controlnet_weight: data.controlNetWeight,
                            ad_controlnet_guidance_start: 0.0,
                            ad_controlnet_guidance_end: 1.0,
                        },
                    ],
                },
            }
            if (!data?.is_installed) {
                delete alwayson_scripts['ADetailer']
            }
            return alwayson_scripts
        }

        const alwyason_scripts = setAlwaysOnScripts()
        payload['alwayson_scripts'] = {
            ...(payload['alwayson_scripts'] || {}),
            ...alwyason_scripts,
        }

        if (hi_res_fix && width >= 512 && height >= 512) {
            payload['enable_hr'] = hi_res_fix
            payload['hr_scale'] = sd_tab_store.data.hr_scale // Scale
            payload['hr_upscaler'] = upscaler // Upscaler
            payload['hr_second_pass_steps'] =
                sd_tab_store.data.hr_second_pass_steps
        }

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
            steps: sd_tab_store.data.steps,
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
