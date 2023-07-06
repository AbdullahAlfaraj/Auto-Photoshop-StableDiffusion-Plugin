import { reaction } from 'mobx'
import { AStore } from '../main/astore'
import { io, layer_util } from '../util/oldSystem'

export const store = new AStore({
    progress_layer: null,
    timer_id: null,
    progress_value: 0,
    progress_image: '',
    progress_image_height: 0,
    progress_label: 'Progress..',
    can_update: true,
})
declare let g_sd_url: string

reaction(
    () => {
        return store.data.progress_image
    },
    async (progress_image) => {
        if (store.data.progress_image_height === 0) {
            const { width, height } = await io.getImageSize(progress_image)
            store.data.progress_image_height = height
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
            callback()
        } catch (e) {
            console.warn(e)
        }
    }
}

export class ProgressAutomatic extends Progress {}

export class ProgressHordeNative {}
