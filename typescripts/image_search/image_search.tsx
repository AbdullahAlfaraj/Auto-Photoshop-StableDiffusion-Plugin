import React from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'
import { Grid } from '../util/grid'
import { MoveToCanvasSvg } from '../util/elements'
import { io } from '../util/oldSystem'

export const store = new AStore({
    images: [],
    refresh: false,
    width: 50,
    height: 50,
})

async function urlToCanvas(url: string) {
    const image_file_name = 'search_image_temp.png'
    await io.IO.urlToLayer(url, image_file_name)
}

const ImageSearch = observer(() => {
    console.log('rendered')
    return (
        <div>
            <sp-slider
                min={85}
                max={300}
                onInput={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const new_value = event.target.value
                    store.updateProperty('height', new_value)
                    store.updateProperty('width', new_value)
                }}
                show-value="true"
            >
                <sp-label slot="label">Image Size:</sp-label>
            </sp-slider>
            <Grid
                // thumbnails_data={store.data.images}
                thumbnails={store.data.thumbnails}
                width={store.data.width}
                height={store.data.height}
                action_buttons={[
                    {
                        ComponentType: MoveToCanvasSvg,
                        callback: (index: number) => {
                            urlToCanvas(store.data.images[index])
                        },
                    },
                ]}
            ></Grid>
        </div>
    )
})

const gridContainerNode = document.getElementById(
    'divImageSearchImagesContainer'
    // 'search_second_panel'
)!
const gridRoot = ReactDOM.createRoot(gridContainerNode)

let images: string[] = []
gridRoot.render(
    <React.StrictMode>
        <ImageSearch></ImageSearch>
    </React.StrictMode>
)
