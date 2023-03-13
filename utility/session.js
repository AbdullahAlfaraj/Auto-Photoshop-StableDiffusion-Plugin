const psapi = require('../psapi')
const io = require('./io')
const Enum = require('../enum')
const { base64ToBase64Url } = require('./general')
const html_manip = require('./html_manip')
const layer_util = require('./layer')
// const ui = require('./ui')
const selection = require('../selection')
const GenerationSettings = require('./generation_settings')
const document_util = require('./document_util')
const file_util = require('../utility/file_util')
const app_events = require('../utility/app_events')
const { executeAsModal } = require('photoshop').core
const app = require('photoshop').app
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
    static #instance = null

    static instance() {
        if (!GenerationSession.#instance) {
            GenerationSession.#instance = new GenerationSession()
        }
        return GenerationSession.#instance
    }

    constructor() {
        if (!GenerationSession.#instance) {
            GenerationSession.#instance = this
        }
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
        this.activeBase64InitImage
        this.activeBase64MaskImage
        this.image_paths_to_layers = {}
        this.progress_layer = {}
        this.last_settings //the last settings been used for generation
        this.controlNetImage = [] // base64 images (one for each control net)
        this.controlNetMask = [] // base64 images (one for each control net)
        this.request_status = Enum.RequestStateEnum['Finished'] //finish or ideal state
        this.is_control_net = false
        this.control_net_selection_info
        this.random_session_id = Math.floor(Math.random() * 1000000 + 1)
        this.init_image_name = ''
        this.init_image_mask_name = ''
        this.init_images_dir = './server/python_server/init_images'
        this.currentImagePath = ''
        return GenerationSession.#instance
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
                await app_events.acceptAllEvent.raise()
                // await viewer.ViewerManager.instance().acceptAll()
            } else if (
                garbage_collection_state === GarbageCollectionState['Discard']
            ) {
                await app_events.discardAllEvent.raise()
                // await viewer.ViewerManager.instance().discardAll()
            } else if (
                garbage_collection_state ===
                GarbageCollectionState['DiscardSelected']
            ) {
                //this should be discardAllExcept(selectedLayers)
                await app_events.discardSelectedEvent.raise()
                // await viewer.ViewerManager.instance().discardSelected() //this will discard what is not been highlighted
            } else if (
                garbage_collection_state ===
                GarbageCollectionState['AcceptSelected']
            ) {
                await app_events.discardEvent.raise()
                //this should be discardAllExcept(selectedLayers)
                // await viewer.ViewerManager.instance().discard() //this will discard what is not been highlighted
            }

            this.isFirstGeneration = true // only before the first generation is requested should this be true
            // const is_visible = await this.outputGroup.visible
            await app_events.endSessionEvent.raise()
            await psapi.collapseFolderExe([this.outputGroup], false) // close the folder group
            // this.outputGroup.visible = is_visible

            if (
                this.mode === Enum.generationMode['Inpaint'] &&
                GenerationSettings.sd_mode === Enum.generationMode['Inpaint']
            ) {
                //create "Mask -- Paint White to Mask -- temporary" layer if current session was inpiant and the selected session is inpaint
                // the current inpaint session ended on inpaint
                psapi.mask_layer_exist = false
                await layer_util.cleanLayers([psapi.inpaint_mask_layer])
                await psapi.createTempInpaintMaskLayer()
            }
        } catch (e) {
            console.warn(e)
        }
    }
    async closePreviousOutputGroup() {
        try {
            //close the previous output folder

            if (this.prevOutputGroup) {
                // const is_visible = await this.prevOutputGroup.visible
                await psapi.collapseFolderExe([this.prevOutputGroup], false) // close the folder group
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
            await layer_util.cleanLayers([this.progress_layer]) // delete the old progress layer
        } catch (e) {
            console.warn(e)
        }
    }
    deleteProgressImageHtml() {
        try {
            document.getElementById('progressImage').style.width = '0px'
            document.getElementById('progressImage').style.height = '0px'
        } catch (e) {
            console.warn(e)
        }
    }
    async deleteProgressImage() {
        this.deleteProgressImageHtml()
        await this.deleteProgressLayer()
    }
    async setControlNetImage(control_net_index = 0) {
        //check if the selection area is active
        //convert layer to base64
        //the width and height of the exported image

        const width = html_manip.getWidth()
        const height = html_manip.getHeight()

        //get the selection from the canvas as base64 png, make sure to resize to the width and height slider
        const selectionInfo = await selection.Selection.getSelectionInfoExe()
        this.control_net_selection_info = selectionInfo

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

        await layer_util.cleanLayers([layer]) //delete the snapshot layer if it exists

        this.controlNetImage[control_net_index] = base64_image
        html_manip.setControlImageSrc(
            base64ToBase64Url(base64_image),
            control_net_index
        )
    }
    async hasSessionSelectionChanged() {
        try {
            const isSelectionActive = await psapi.checkIfSelectionAreaIsActive()
            if (isSelectionActive) {
                const current_selection = isSelectionActive // Note: don't use checkIfSelectionAreaIsActive to return the selection object, change this.

                if (
                    await this.hasSelectionChanged(
                        current_selection,
                        this.selectionInfo
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

    async hasSelectionChanged(new_selection, old_selection) {
        if (
            new_selection !== null &&
            old_selection !== null &&
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

    async selectionEventHandler(event, descriptor) {
        try {
            console.log(event, descriptor)
            const isSelectionActive = await psapi.checkIfSelectionAreaIsActive()
            if (isSelectionActive) {
                const current_selection = isSelectionActive // Note: don't use checkIfSelectionAreaIsActive to return the selection object, change this.
                await selection.calcWidthHeightFromSelection()
                if (
                    await GenerationSession.instance().hasSelectionChanged(
                        current_selection,
                        GenerationSession.instance().selectionInfo
                    ) //new selection
                ) {
                    const selected_mode =
                        GenerationSession.instance().getCurrentGenerationModeByValue(
                            GenerationSettings.sd_mode
                        )
                    await app_events.selectionModeChangedEvent.raise(
                        selected_mode
                    )
                    // ui.UI.instance().generateModeUI(selected_mode)
                } else {
                    // it's the same selection and the session is active
                    //indicate that the session will continue. only if the session we are in the same mode as the session's mode
                    // startSessionUI// green color
                    const current_mode = html_manip.getMode()
                    if (
                        GenerationSession.instance().isActive() && // the session is active
                        GenerationSession.instance().isSameMode(current_mode) //same mode
                    ) {
                        await app_events.generateMoreEvent.raise()
                        // ui.UI.instance().generateMoreUI()
                    }
                }
            }
        } catch (e) {
            console.warn(e)
        }
    }

    getCurrentGenerationModeByValue(value) {
        for (let key in Enum.generationMode) {
            if (
                Enum.generationMode.hasOwnProperty(key) &&
                Enum.generationMode[key] === value
            ) {
                return key
            }
        }
        return undefined
    }

    async silentSetInitImage(layer, session_id) {
        try {
            // const layer = await app.activeDocument.activeLayers[0]
            const old_name = layer.name

            // image_name = await app.activeDocument.activeLayers[0].name

            //convert layer name to a file name
            let image_name = psapi.layerNameToFileName(
                old_name,
                layer.id,
                session_id
            )
            image_name = `${image_name}.png`

            //the width and height of the exported image
            const width = html_manip.getWidth()
            const height = html_manip.getHeight()

            //get the selection from the canvas as base64 png, make sure to resize to the width and height slider
            const selectionInfo = GenerationSession.instance().selectionInfo

            const use_silent_mode = html_manip.getUseSilentMode()
            const base64_image =
                await io.IO.getSelectionFromCanvasAsBase64Interface(
                    width,
                    height,
                    layer,
                    selectionInfo,
                    true,
                    use_silent_mode,
                    image_name
                )
            //save base64 as file in the init_images directory
            const init_entry = await document_util.getInitImagesDir()
            await io.IO.base64PngToPngFile(base64_image, init_entry, image_name)

            this.init_image_name = image_name
            console.log(image_name)

            const path = `${this.init_images_dir}/${image_name}`

            //store the base64 init image and also set it as the active/latest init image
            GenerationSession.instance().base64initImages[path] = base64_image
            GenerationSession.instance().activeBase64InitImage = base64_image

            const init_src = file_util.base64ToSrc(
                GenerationSession.instance().activeBase64InitImage
            )
            html_manip.setInitImageSrc(init_src)

            return { name: image_name, base64: base64_image }
        } catch (e) {
            console.error(`psapi.js silentSetInitImage error:, ${e}`)
        }
    }

    async silentSetInitImageMask(layer, session_id) {
        try {
            // const layer = await app.activeDocument.activeLayers[0]
            const old_name = layer.name

            let image_name = psapi.layerNameToFileName(
                old_name,
                layer.id,
                session_id
            )
            image_name = `${image_name}.png`
            const width = html_manip.getWidth()
            const height = html_manip.getHeight()

            //get the selection from the canvas as base64 png, make sure to resize to the width and height slider
            const selectionInfo = this.selectionInfo

            const use_silent_mode = html_manip.getUseSilentMode()

            const base64_image =
                await io.IO.getSelectionFromCanvasAsBase64Interface(
                    width,
                    height,
                    layer,
                    selectionInfo,
                    true,
                    use_silent_mode,
                    image_name
                )

            //save base64 as file in the init_images directory
            const init_entry = await document_util.getInitImagesDir()
            await io.IO.base64PngToPngFile(base64_image, init_entry, image_name)

            this.init_image_mask_name = image_name // this is the name we will send to the server

            console.log(image_name)

            const path = `${this.init_images_dir}/${image_name}`
            this.base64maskImage[path] = base64_image
            this.activeBase64MaskImage = base64_image

            const mask_src = file_util.base64ToSrc(this.activeBase64MaskImage)
            html_manip.setInitImageMaskSrc(mask_src)
            return { name: image_name, base64: base64_image }
        } catch (e) {
            console.error(`psapi.js setInitImageMask error: `, e)
        }
    }

    async setInitImageMask(layer, session_id) {
        try {
            // const layer = await app.activeDocument.activeLayers[0]
            const old_name = layer.name

            let image_name = psapi.layerNameToFileName(
                old_name,
                layer.id,
                session_id
            )
            image_name = `${image_name}.png`
            const width = html_manip.getWidth()
            const height = html_manip.getHeight()
            let image_buffer = await psapi.newExportPng(
                layer,
                image_name,
                width,
                height
            )
            this.init_image_mask_name = image_name // this is the name we will send to the server

            console.log(image_name)
            let base64_image = file_util._arrayBufferToBase64(image_buffer) //convert the buffer to base64
            //send the base64 to the server to save the file in the desired directory
            await io.IO.requestSavePng(base64_image, image_name)

            // const image_src = await sdapi.getInitImage(
            //     this.init_image_mask_name
            // ) // we should replace this with getInitImagePath which return path to local disk
            // const ini_image_mask_element =
            //     document.getElementById('init_image_mask')
            // ini_image_mask_element.src = image_src
            // ini_image_mask_element.dataset.layer_id = layer.id

            const path = `${this.init_images_dir}/${image_name}`
            this.base64maskImage[path] = base64_image
            this.activeBase64MaskImage = this.base64maskImage[path]
            // return image_name
            const mask_src = file_util.base64ToSrc(this.activeBase64MaskImage)
            html_manip.setInitImageMaskSrc(mask_src)
            return { name: image_name, base64: base64_image }
        } catch (e) {
            console.error(`psapi.js setInitImageMask error: `, e)
        }
    }

    async silentImagesToLayersExe(images_info) {
        //use active layer instead of placeEventResult
        try {
            this.isLoadingActive = true

            await selection.reSelectMarqueeExe(this.selectionInfo) //why do we reselect the session selection area
            let image_path_to_layer = {}
            console.log(
                'silentImagesToLayersExe: images_info.images_paths: ',
                images_info.images_paths
            )
            // Returns a Promise that resolves after "ms" Milliseconds
            // const timer = (ms) => new Promise((res) => setTimeout(res, ms)) //Todo: move this line to it's own utilit function

            for (const image_info of images_info) {
                console.log(this.currentImagePath)
                //unselect all layers so that the imported layer get place at the top of the document
                await psapi.unselectActiveLayersExe()

                let imported_layer
                const selection_info = await this.selectionInfo

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

                let timer_count = 0

                console.log('imported_layer: ', imported_layer)

                if (psapi.use_smart_object === false) {
                    await executeAsModal(async () => {
                        await imported_layer.rasterize() //rastrize the active layer
                    })
                }

                await this.moveToTopOfOutputGroup(imported_layer)
                await psapi.setVisibleExe(imported_layer, false) // turn off the visibility for the layer
                image_path_to_layer[image_info.path] = imported_layer
            }
            return image_path_to_layer
        } catch (e) {
            console.warn(e)
        }
        this.isLoadingActive = false
    }
    async activateSessionSelectionArea() {
        try {
            if (
                selection.Selection.isSelectionValid(
                    GenerationSession.instance().selectionInfo
                )
            ) {
                await selection.reSelectMarqueeExe(
                    GenerationSession.instance().selectionInfo
                )
                await GenerationSession.instance().selectionEventHandler()
            }
        } catch (e) {
            console.warn(e)
        }
    }
}

module.exports = {
    GenerationSession,
    GarbageCollectionState,
    SessionState,
}
