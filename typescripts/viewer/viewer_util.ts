import { AStore } from '../main/astore'
import { io } from '../util/oldSystem'

export enum ClickTypeEnum {
    Click = 'click',
    ShiftClick = 'shift_click',
    AltClick = 'alt_click',
    SecondClick = 'second_click', //when we click a thumbnail that is active/ has orange border
}

export enum OutputImageStateEnum {
    Add = 'add',
    remove = 'remove',
}
export enum ClassNameEnum {
    Green = 'viewerImgSelected',
    Orange = 'viewerImgActive',
    None = '',
}
interface AStoreData {
    images: string[]
    thumbnails: string[]
    metadata: any[] // metadata for each image
    width: number
    height: number

    prev_layer: any
    clicked_index: number | undefined

    permanent_indices: number[]

    prev_index: number
    is_stored: boolean[]
    layers: any[]
    class_name: ClassNameEnum[]
    can_click: boolean
    auto_mask: boolean
}
export const store = new AStore<AStoreData>({
    images: [],
    thumbnails: [],
    metadata: [], // metadata for each image
    width: 50,
    height: 50,

    prev_layer: null,
    clicked_index: undefined,

    permanent_indices: [],

    prev_index: -1,

    is_stored: [],
    layers: [],
    class_name: [],
    can_click: true,
    auto_mask: true,
})
export const init_store = new AStore({
    images: [],
    thumbnails: [],

    width: 50,
    height: 50,

    prev_layer: null,
    clicked_index: null,

    permanent_indices: [],

    prev_index: -1,
    output_image_obj_list: [],
    is_stored: [],
    layers: [],
    class_name: [],
    can_click: true,
})
export const mask_store = new AStore({
    images: [],
    thumbnails: [],
    output_images_masks: [] as string[],

    width: 50,
    height: 50,
    expand_by: 0,
    prev_layer: null,
    clicked_index: null,

    permanent_indices: [],

    prev_index: -1,
    output_image_obj_list: [],
    is_stored: [],
    layers: [],
    class_name: [],
    can_click: true,
})

interface AStoreDataWithImagesAndThumbnails {
    images: string[]
    thumbnails: string[]
}

export async function updateViewerStoreImageAndThumbnail<
    T extends AStoreDataWithImagesAndThumbnails
>(store: AStore<T>, images: string[]) {
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

export const resetViewer = () => {
    store.updateProperty('images', [])
    store.data.thumbnails = []
    store.data.prev_index = -1
    store.data.is_stored = []
    store.data.layers = []
    store.data.class_name = []
    store.data.can_click = true

    mask_store.data.images = []
    mask_store.data.thumbnails = []
    init_store.data.images = []
    init_store.data.thumbnails = []
}
