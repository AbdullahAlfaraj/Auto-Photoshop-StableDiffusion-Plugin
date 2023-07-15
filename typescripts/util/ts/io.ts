import { app, core, action } from 'photoshop'
import { Jimp, io, psapi } from '../oldSystem'
import { base64ToFileAndGetLayer } from './document'
import { transformCurrentLayerTo } from './layer'
import { Layer } from 'photoshop/dom/Layer'
const executeAsModal = core.executeAsModal

export async function moveImageToLayer_old(
    base64_image: string,
    selection_info: any,
    layer_name: string = 'output_image.png'
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
export async function moveImageToLayer(
    base64_image: string,
    selection_info: any,
    layer_name: string = 'output_image.png'
): Promise<Layer> {
    if (!base64_image) throw new Error('moveImageToLayer: image is empty')
    let layer: Layer | null
    try {
        const to_x = selection_info?.left
        const to_y = selection_info?.top
        const width = selection_info?.width
        const height = selection_info?.height

        const res = await base64ToFileAndGetLayer(base64_image, {
            image_name: layer_name,
        })
        layer = res.layer

        await psapi.setVisibleExe(layer, true)
        await transformCurrentLayerTo(
            {
                left: to_x,
                top: to_y,
                width,
                height,
            },
            {
                width: res.width,
                height: res.height,
                left: 0,
                top: 0,
            }
        )
        await psapi.setVisibleExe(layer, true)
    } catch (e) {
        console.warn(e)
        layer = null
    }
    if (!layer) {
        throw new Error('moveImageToLayer failed: layer is empty')
    }
    return layer
}

export async function convertGrayscaleToWhiteAndTransparent(
    base64: string
): Promise<{
    base64: string
    width: number
    height: number
}> {
    function grayToWhiteAndTransparent(
        this: Jimp,
        x: number,
        y: number,
        idx: number
    ) {
        let color
        if (
            this.bitmap.data[idx] !== 0 &&
            this.bitmap.data[idx + 1] !== 0 &&
            this.bitmap.data[idx + 2] !== 0
        ) {
            color = 0xffffffff
        } else {
            color = 0x00000000
        }
        this.setPixelColor(color, x, y)
    }
    try {
        const jimp_image = await Jimp.read(Buffer.from(base64, 'base64'))

        const jimp_mask = await jimp_image.scan(
            0,
            0,
            jimp_image.bitmap.width,
            jimp_image.bitmap.height,
            grayToWhiteAndTransparent
        )

        const base64_monochrome_mask = await getBase64FromJimp(jimp_mask)

        return {
            base64: base64_monochrome_mask,
            height: jimp_image.bitmap.height,
            width: jimp_image.bitmap.width,
        }
    } catch (e) {
        console.warn(e)
        throw e
    }
}

async function getBase64FromJimp(jimp_image: Jimp) {
    const dataURL = await jimp_image.getBase64Async(Jimp.MIME_PNG)
    const base64 = dataURL.replace(/^data:image\/png;base64,/, '')
    return base64
}
