import { app, core, imaging } from 'photoshop'
import { io, psapi } from '../oldSystem'
import { host } from 'uxp'

export function autoResize(textarea: any, text_content: string, delay = 300) {
    try {
        let g_style_timeout: any
        const measure_id = `measure-${textarea.id}`
        let measure = document.getElementById('measure')!
        if (!measure) {
            measure = document.createElement('div')
            measure.setAttribute('id', measure_id)
            measure.style.visibility = 'hidden'
            measure.style.whiteSpace = 'pre-wrap'
            measure.style.position = 'absolute'
            measure.style.fontSize = '14px'
            document.body.appendChild(measure)
        }
        measure.style.width = textarea.offsetWidth + 'px'
        measure.textContent = text_content

        let checkCount = 0
        const checkHeight = () => {
            if (measure.offsetHeight > 0 || checkCount >= 50) {
                clearTimeout(g_style_timeout)
                g_style_timeout = setTimeout(() => {
                    console.log('textarea id: ', textarea.id)
                    let height = measure.offsetHeight
                    height = Math.max(100, height)
                    height = Math.min(450, height)
                    textarea.style.height = height + 'px'
                    console.log('height: ', height)
                }, delay)
            } else {
                checkCount++
                setTimeout(checkHeight, delay)
            }
        }
        checkHeight()
    } catch (e) {
        console.warn(
            'failed to autoResize()',
            textarea.id,
            text_content,
            delay,
            e
        )
    }
}

export async function urlToCanvas(url: string, image_name = 'image.png') {
    await io.IO.urlToLayer(url, image_name)
}

export const copyJson = (originalObject: any) =>
    JSON.parse(JSON.stringify(originalObject))

export function base64ToBase64Url(base64_image: string) {
    return 'data:image/png;base64,' + base64_image
}
export function base64UrlToBase64(base64_url: string) {
    const base64 = base64_url.replace(/data:image\/.*;base64,/, '')
    return base64
}

export function newOutputImageName(format = 'png') {
    const random_id = Math.floor(Math.random() * 100000000000 + 1) // Date.now() doesn't have enough resolution to avoid duplicate
    const image_name = `output- ${Date.now()}-${random_id}.${format}`
    console.log('generated image name:', image_name)
    return image_name
}

export function isValidVersion(minMajorVersion: number) {
    const current_major_version = host.version.split('.')[0]
    if (parseInt(current_major_version) >= minMajorVersion) {
        return true
    } else {
        return false
    }
}

async function getImageFromLayer(
    sourceBounds: any,
    layer_id: number | undefined,
    components: any
) {
    const image_obj = await imaging.getPixels({
        ...(sourceBounds && {
            sourceBounds: {
                left: sourceBounds.left,
                top: sourceBounds.top,
                right: sourceBounds.right,
                bottom: sourceBounds.bottom,
            },
        }),
        ...(layer_id && { layerID: layer_id }),
        components: components,
        applyAlpha: true,
        colorSpace: 'RGB',
    })

    return image_obj
}

async function imageObjectToBase64(imgObj: any) {
    const pixelData = await imgObj.imageData.getData()
    // const base64 = Buffer.from(pixelData).toString('base64')
    // const base64 = _arrayBufferToBase64(pixelData)
    const jpegData = await imaging.encodeImageData({
        imageData: imgObj.imageData,
        base64: true,
        // pixelFormat: 'RGBA',
        // applyAlpha: true,
    })
    return jpegData
    // return base64
}

async function imageObjectToBase64Url(imgObj: any) {
    const jpegData = await imageObjectToBase64(imgObj)
    const dataUrl = 'data:image/jpeg;base64,' + jpegData
    // const dataUrl = 'data:image/png;base64,' + jpegData

    return dataUrl
}

export async function getImageFromCanvas_new(layer_id?: number) {
    let data_url
    if (!isValidVersion(25)) {
        const errorMessage = `Real-time img2img Require Adobe Photoshop version 25 or higher. Your current version is ${host.version}. Please update Adobe Photoshop to use this feature. You can still use realtime txt2img.`
        // app.showAlert(errorMessage)
        throw errorMessage
    }
    await core.executeAsModal(
        async () => {
            const selection_info = await psapi.getSelectionInfoExe()
            // let imgObj = await getImageFromLayer({},app.activeDocument.activeLayers[0].id,3)
            let imgObj = await getImageFromLayer(selection_info, layer_id, 3)

            data_url = await imageObjectToBase64Url(imgObj)
            // console.log('data_url:', data_url)
            // html_manip.setInitImageSrc(data_url)
            console.log('getImageFromCanvas: triggered')
        },
        { commandName: 'Get  Image from Canvas' }
    )
    return data_url
}

export function deleteKeys(obj: Record<string, any>, keys: string[]) {
    keys.forEach((key) => {
        if (obj.hasOwnProperty(key)) {
            delete obj[key]
        }
    })
    return obj
}
