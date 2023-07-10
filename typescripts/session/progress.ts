import { reaction } from 'mobx'
import { AStore } from '../main/astore'
import { io, layer_util } from '../util/oldSystem'
import Locale from '../locale/locale'
import { session_ts } from '../entry'
import { app, core } from 'photoshop'

const executeAsModal = core.executeAsModal

export const store = new AStore({
    progress_layer: null,
    timer_id: null,
    progress_value: 0,
    progress_image: '',
    progress_image_height: 0,
    progress_label: Locale('Progress..'),
    can_update: true,
    can_update_progress_layer: true,
})
declare let g_sd_url: string

async function updateProgressImage(progress_base64: string) {
    try {
        store.data.can_update_progress_layer = false
        await executeAsModal(
            async (context: any) => {
                const history_id = await context.hostControl.suspendHistory({
                    documentID: app.activeDocument.id, //TODO: change this to the session document id
                    name: 'Progress Image',
                })
                await Progress.deleteProgressLayer() // delete the old progress layer

                //update the progress image
                const selection_info = await session_ts.store.data.selectionInfo

                const b_exsit = layer_util.Layer.doesLayerExist(
                    store.data.progress_layer
                )
                if (!b_exsit && progress_base64) {
                    const layer = await io.IO.base64ToLayer(
                        progress_base64,
                        'temp_progress_image.png',
                        selection_info.left,
                        selection_info.top,
                        selection_info.width,
                        selection_info.height
                    )
                    store.data.progress_layer = layer // sotre the new progress layer// TODO: make sure you delete the progress layer when the geneeration request end
                }
                await context.hostControl.resumeHistory(history_id)
            },
            { commandName: 'update progress layer' }
        )
    } catch (e) {
        console.warn(e)
    } finally {
        store.data.can_update_progress_layer = true
    }
}
reaction(
    () => {
        return store.data.progress_image
    },
    async (progress_image) => {
        if (store.data.progress_image_height === 0) {
            const { width, height } = await io.getImageSize(progress_image)
            store.data.progress_image_height = height
        }
        const b_update_progress_layer: Boolean = (
            document.querySelector('.chLiveProgressImageClass') as any
        ).checked
        if (
            b_update_progress_layer &&
            parseInt(session_ts.store.data.ui_settings?.batch_size) === 1 &&
            store.data.can_update_progress_layer
        ) {
            await updateProgressImage(progress_image)
        }
    }
)

export async function requestProgress() {
    try {
        console.log('requestProgress: ')

        const full_url = `${g_sd_url}/sdapi/v1/progress?skip_current_image=false`
        let request = await fetch(full_url)
        const json = await request.json()
        // console.log('progress json:', json)

        return json
    } catch (e) {
        console.warn(e)
        // console.log('json: ', json)
    }
    return null
}

export class Progress {
    static timer_id: any = null
    static async deleteProgressImage() {
        // preview.store.updateProperty('image', null)

        await this.deleteProgressLayer()
    }

    static async deleteProgressLayer() {
        try {
            await layer_util.deleteLayers([store.data.progress_layer]) // delete the old progress layer
        } catch (e) {
            console.warn(e)
        }
    }

    static startTimer(callback: any, interval: number = 1000) {
        store.data.can_update = true
        //clear the old timer if it exist
        try {
            store.data.progress_value = 0
            store.data.progress_image = ''
            store.data.progress_image_height = 0
            store.data.progress_label = ''
            this.timer_id = clearInterval(this.timer_id)
        } catch (e) {
            console.warn(e)
        }

        this.timer_id = setInterval(callback, interval)
    }

    static endTimer(callback: any) {
        try {
            this.timer_id = clearInterval(this.timer_id)
            store.data.can_update = false
        } catch (e) {
            console.warn(e)
        }
        try {
            callback() // may cause an issue if this an async
        } catch (e) {
            console.warn(e)
        }
    }
}

export class ProgressAutomatic extends Progress {}

export class ProgressHordeNative {}
