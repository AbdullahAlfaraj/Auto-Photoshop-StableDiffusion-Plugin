import { control_net, preview, viewer, progress } from '../entry'
import { AStore } from '../main/astore'
import { io, psapi, sdapi } from '../util/oldSystem'
import { GenerationModeEnum } from '../util/ts/enum'
import {
    Img2ImgMode,
    InpaintMode,
    LassoInpaintMode,
    OutpaintMode,
    Txt2ImgMode,
    UpscaleMode,
} from './modes'
import { Progress } from './progress'
import { reaction } from 'mobx'

declare let g_inpaint_mask_layer: any

export const store = new AStore({
    // activeBase64InitImage: '',
    // activeBase64Mask: '',
    init_image: '',
    mask: '',
    expanded_mask: '',
    mode: '',
    ui_settings: {},
    selectionInfo: {}, //the session selection info
    current_selection_info: {}, // any new selection, could be undefined too
    can_generate: true, // is generation currently in progress
    can_generate_more: false, //
    is_active: false, // is session active
    is_interrupted: false, // did we interrupt the generation
})

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
export class Session {
    constructor() {}
    static async initializeSession(mode: GenerationModeEnum): Promise<any> {
        const selectionInfo = await psapi.getSelectionInfoExe()
        store.data.selectionInfo = selectionInfo
        store.data.mode = mode

        if (modeToClassMap.hasOwnProperty(store.data.mode)) {
            const { init_image, mask } = await modeToClassMap[
                store.data.mode
            ].initializeSession()

            if (init_image) {
                // const opaque_init_image = await io.fixTransparentEdges(
                //     init_image
                // )
                store.data.init_image = init_image
                // store.data.init_image = opaque_init_image

                await viewer.updateViewerStoreImageAndThumbnail(
                    viewer.init_store,
                    [store.data.init_image]
                )
            }

            if (mask) {
                store.data.mask = mask
                // store.data.mask = await io.maskFromInitImage(
                //     store.data.init_image
                // )
                // store.data.mask = await io.fixMaskEdges(mask)
                await viewer.updateViewerStoreImageAndThumbnail(
                    viewer.mask_store,

                    [store.data.mask]
                )
            }
            return { init_image, mask, selectionInfo }
        }
    }
    static async getSettings(session_data: any) {
        const ui_settings = await modeToClassMap[store.data.mode].getSettings(
            session_data
        )

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
    }
    static async generate(mode: GenerationModeEnum): Promise<{
        output_images: any
        response_json: any
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

            const { init_image, mask, selectionInfo } =
                await this.initializeSession(mode)
            const ui_settings = await this.getSettings({
                init_image,
                mask,
                selectionInfo,
            })

            var { output_images, response_json } = await modeToClassMap[
                mode
            ].generate(ui_settings)
        } catch (e) {
            console.warn(e)
        } finally {
            store.data.can_generate = true
            this.endProgress()
        }

        return { output_images, response_json }
    }

    static async generateMore(): Promise<{
        output_images: any
        response_json: any
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
                mask: store.data.mask,
                selectionInfo: store.data.selectionInfo,
            }
            const ui_settings = await this.getSettings(session_data)
            var { output_images, response_json } = await modeToClassMap[
                store.data.mode
            ].generate(ui_settings)
        } catch (e) {
            console.warn(e)
        } finally {
            store.data.can_generate = true
            this.endProgress()
        }
        return { output_images, response_json }
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

                console.log('progress object json: ', json)
            } catch (e) {
                console.warn(e)
            }
        }, 1000)
    }
    static endProgress() {
        progress.Progress.endTimer(() => {
            progress.store.data.progress_value = 0
            progress.store.data.progress_image = ''
        })
    }

    static async getOutput() {}
}
