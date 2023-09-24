import { io } from '../oldSystem'

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
