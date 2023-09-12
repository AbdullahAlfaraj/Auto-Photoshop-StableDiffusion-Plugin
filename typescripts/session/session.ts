import { app } from 'photoshop'
// import { control_net, preview, viewer, progress } from '../entry'
import * as progress from '../session/progress'

import {
    // store as viewer_store,
    mask_store as viewer_mask_store,
    init_store as viewer_init_store,
} from '../viewer/viewer_util'
import Locale from '../locale/locale'
import { store } from './session_store'
import { html_manip, io, python_replacement } from '../util/oldSystem'
import { GenerationModeEnum } from '../util/ts/enum'
import {
    Img2ImgMode,
    InpaintMode,
    LassoInpaintMode,
    OutpaintMode,
    Txt2ImgMode,
    UpscaleMode,
} from './modes'

import { reaction } from 'mobx'
import {
    resetViewer,
    updateViewerStoreImageAndThumbnail,
} from '../viewer/viewer_util'
import { sd_tab_store } from '../stores'

declare let g_inpaint_mask_layer: any
declare const g_image_not_found_url: string
declare let g_current_batch_index: number

reaction(
    () => {
        return [store.data.init_image, store.data.mask] as [string, string]
    },
    ([init_image, mask]: [string, string]) => {
        html_manip.setInitImageSrc(
            init_image
                ? 'data:image/png;base64,' + init_image
                : g_image_not_found_url
        )
        html_manip.setInitImageMaskSrc(
            mask ? 'data:image/png;base64,' + mask : g_image_not_found_url
        )
    }
)
reaction(
    () => {
        return store.data.auto_photoshop_sd_extension_status
    },
    (auto_photoshop_sd_extension_status: boolean) => {
        if (auto_photoshop_sd_extension_status) {
        } else {
            app.showAlert(
                'Please install the Auto-Photoshop-SD Extension from Automatic1111 Extensions tab '
            )
        }
    }
)
function hasSelectionChanged(new_selection: any, old_selection: any) {
    try {
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
    } catch (e) {
        //if any properties is missing

        // console.warn(e)
        return false
    }
}

reaction(
    () => {
        return store.data.current_selection_info
    },
    (new_selection_info) => {
        console.log(
            'store.data.current_selection_info: reaction is triggered ',
            store.data.current_selection_info
        )
        if (hasSelectionChanged(new_selection_info, store.data.selectionInfo)) {
            store.data.can_generate_more = false
        } else {
            if (store.data.is_active) store.data.can_generate_more = true
        }
    }
)
reaction(
    () => {
        return store.data.is_active
    },
    (is_active) => {
        console.log(
            'store.data.is_active: reaction is triggered ',
            store.data.is_active
        )

        if (is_active) {
            store.data.can_generate_more = true
        } else {
            store.data.can_generate_more = false
        }
    }
)

interface ModeToClassMap {
    [key: string]:
        | typeof Txt2ImgMode
        | typeof Img2ImgMode
        | typeof InpaintMode
        | typeof LassoInpaintMode
        | typeof OutpaintMode
        | typeof UpscaleMode
}

const modeToClassMap: ModeToClassMap = {
    [GenerationModeEnum.Txt2Img]: Txt2ImgMode,
    [GenerationModeEnum.Img2Img]: Img2ImgMode,
    [GenerationModeEnum.Inpaint]: InpaintMode,
    [GenerationModeEnum.LassoInpaint]: LassoInpaintMode,
    [GenerationModeEnum.Outpaint]: OutpaintMode,
    [GenerationModeEnum.Upscale]: UpscaleMode,
}

export async function getExpandedMask(
    mask: string,
    expansion_value: number,
    blur: number
) {
    let expanded_mask = mask
    try {
        let use_sharp_mask = false

        if (
            use_sharp_mask === false &&
            mask &&
            expansion_value >= 0 &&
            blur >= 0
        ) {
            //only if mask is available and sharp_mask is off
            // use blurry and expanded mask
            const iterations = expansion_value
            expanded_mask = await python_replacement.maskExpansionRequest(
                mask,
                iterations,
                blur
            )
        }

        // return expanded_mask
    } catch (e) {
        console.warn(e)
    } finally {
        return expanded_mask
    }
}

export class Session {
    constructor() {}
    static async initializeSession(mode: GenerationModeEnum): Promise<any> {
        try {
            //TODO: refactor incrementSessionID() to io.ts
            async function incrementSessionID() {
                const uuid = await io.getUniqueDocumentId()
                const last_session_id = await io.IOJson.loadSessionIDFromFile(
                    uuid
                )
                const current_session_id = last_session_id + 1
                await io.IOJson.saveSessionID(current_session_id, uuid)
                return current_session_id
            }
            store.data.current_session_id = await incrementSessionID()

            store.data.mode = mode

            if (modeToClassMap.hasOwnProperty(store.data.mode)) {
                const { selectionInfo, init_image, mask } =
                    await modeToClassMap[store.data.mode].initializeSession()
                store.data.selectionInfo = selectionInfo
                if (init_image) {
                    // const opaque_init_image = await io.fixTransparentEdges(
                    //     init_image
                    // )
                    store.data.init_image = init_image
                    // store.data.init_image = opaque_init_image

                    await updateViewerStoreImageAndThumbnail(
                        viewer_init_store,
                        [store.data.init_image]
                    )
                }

                if (mask) {
                    // store.data.mask = mask
                    const mask_monochrome =
                        await io.convertGrayscaleToMonochrome(mask)
                    store.data.monoMask = mask_monochrome
                    store.data.mask = mask

                    const expansion_value: number =
                        sd_tab_store.data.mask_expansion

                    const mask_blur = sd_tab_store.data.mask_blur
                    store.data.expanded_mask = await getExpandedMask(
                        mask,
                        expansion_value,
                        mask_blur
                    )
                    store.data.preprocessed_mask = mask

                    await updateViewerStoreImageAndThumbnail(
                        viewer_mask_store,

                        [
                            store.data.preprocessed_mask,
                            store.data.monoMask,
                            store.data.expanded_mask,
                        ]
                    )
                }

                return {
                    selectionInfo,
                    init_image,
                    mask: store.data.preprocessed_mask,
                }
            }
        } catch (e) {
            console.warn(e)
        }
    }
    static async getSettings(session_data: any) {
        const ui_settings = await modeToClassMap[store.data.mode].getSettings(
            session_data
        )
        ui_settings['session_id'] = store.data.current_session_id
        store.data.ui_settings = ui_settings
        return ui_settings
    }
    static processOutput() {}
    static validate() {
        if (store.data.is_active) {
            //@ts-ignore
            app.showAlert('You forgot to select images!')
            return false
        }
        return true
    }
    static async initializeGeneration() {
        store.data.is_interrupted = false
        store.data.can_generate = false
        store.data.generation_number += 1
        g_current_batch_index += 1
    }
    static async generate(mode: GenerationModeEnum): Promise<{
        output_images: any
        response_json: any
        ui_settings: any
    }> {
        if (!store.data.can_generate) {
            // return null
            throw Error(
                'A Generation is progress, wait for to finish be fore you generate again'
            )
        }
        if (store.data.is_active) {
            //you can only use the generate button once per session
            //@ts-ignore
            app.showAlert(
                'You must end the current session before starting a new one'
            )
            throw Error(
                'Session is still Active. Need to end the Session before starting a new Session'
            )
        }

        try {
            this.initializeGeneration()

            store.data.is_active = true
            this.getProgress()

            const { selectionInfo, init_image, mask } =
                await this.initializeSession(mode)
            var ui_settings = await this.getSettings({
                selectionInfo,
                init_image,
                mask,
            })

            //this should be part of initialization method or gettingSettings()
            //calculate the expanded mask from mask
            if (
                [
                    GenerationModeEnum.Inpaint,
                    GenerationModeEnum.LassoInpaint,
                    GenerationModeEnum.Outpaint,
                ].includes(mode)
            ) {
                const expansion_value: number = sd_tab_store.data.mask_expansion
                const mask_blur = sd_tab_store.data.mask_blur
                store.data.expanded_mask = await getExpandedMask(
                    mask,
                    expansion_value,
                    mask_blur
                )

                ui_settings['mask'] = store.data.expanded_mask
                store.data.ui_settings = ui_settings
            }
            var { output_images, response_json } = await modeToClassMap[
                mode
            ].generate(ui_settings)
        } catch (e) {
            console.warn(e)
        } finally {
            store.data.can_generate = true
            await this.endProgress()
        }

        return { output_images, response_json, ui_settings }
    }

    static async generateMore(): Promise<{
        output_images: any
        response_json: any
        ui_settings: any
    }> {
        if (!store.data.can_generate) {
            throw Error(
                'A Generation is progress, wait for to finish be fore you generate again'
            )
        }

        try {
            this.initializeGeneration()
            store.data.can_generate = false
            this.getProgress()
            const session_data = {
                init_image: store.data.init_image,
                mask: store.data.preprocessed_mask,
                selectionInfo: store.data.selectionInfo,
            }
            var ui_settings = await this.getSettings(session_data)
            if (
                [
                    GenerationModeEnum.Inpaint,
                    GenerationModeEnum.LassoInpaint,
                    GenerationModeEnum.Outpaint,
                ].includes(store.data.mode)
            ) {
                const expansion_value: number = sd_tab_store.data.mask_expansion
                const mask_blur = sd_tab_store.data.mask_blur
                store.data.expanded_mask = await getExpandedMask(
                    session_data.mask,
                    expansion_value,
                    mask_blur
                )

                ui_settings['mask'] = store.data.expanded_mask
                store.data.ui_settings = ui_settings
            }
            var { output_images, response_json } = await modeToClassMap[
                store.data.mode
            ].generate(ui_settings)
        } catch (e) {
            console.warn(e)
        } finally {
            store.data.can_generate = true
            await this.endProgress()
        }
        return { output_images, response_json, ui_settings }
    }
    static async interrupt(): Promise<any> {
        try {
            await modeToClassMap[store.data.mode].interrupt()
            store.data.is_interrupted = true
        } catch (e) {
            console.warn(e)
        } finally {
            //no need to reset progress since generate and generateMore will always finish executing after interrupt
            // store.data.can_generate = true
            // this.endProgress()
        }
    }
    static async getProgress() {
        // Progress.startSudoProgress()
        progress.Progress.startTimer(async () => {
            try {
                let json = await progress.requestProgress()
                const can_update = progress.store.data.can_update
                if (!can_update) {
                    return null
                }
                if (json?.progress) {
                    progress.store.updateProperty(
                        'progress_value',
                        json?.progress * 100
                    )
                }

                if (json?.current_image) {
                    progress.store.updateProperty(
                        'progress_image',
                        json?.current_image
                    )
                }

                progress.store.data.progress_label = Locale('Progress...')

                // console.log('progress object json: ', json)
            } catch (e) {
                console.warn(e)
            }
        }, 2000)
    }
    static async endProgress() {
        await progress.Progress.endTimer(async () => {
            progress.store.data.progress_value = 0
            progress.store.data.progress_image = ''
            progress.store.data.progress_image_height = 0
            await progress.Progress.deleteProgressLayer()
        })
    }
    static endSession() {
        resetViewer() //may cause circular dependency
        store.data.is_active = false //
        store.data.init_image = ''
        store.data.mask = ''
        store.data.expanded_mask = ''
        store.data.preprocessed_mask = ''
        store.data.generation_number = 0
        store.data.controlnet_input_image = ''
        g_current_batch_index = -1 // first generation will add +1 to get => 0
    }

    static async getOutput() {}
}
