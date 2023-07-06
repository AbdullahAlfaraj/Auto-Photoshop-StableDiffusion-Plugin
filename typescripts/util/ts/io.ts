import { io } from '../oldSystem'

export async function moveImageToLayer(
    base64_image: string,
    selection_info: any,
    layer_name: string = 'output_image'
) {
    let layer
    try {
        const to_x = selection_info?.left
        const to_y = selection_info?.top
        const width = selection_info?.width
        const height = selection_info?.height
        layer = await io.IO.base64ToLayer(
            base64_image,
            layer_name,
            to_x,
            to_y,
            width,
            height
        )
    } catch (e) {
        console.warn(e)
        layer = null
    }
    return layer
}
