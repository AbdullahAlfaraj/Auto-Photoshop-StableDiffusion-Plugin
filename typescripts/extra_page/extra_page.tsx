import { observer } from 'mobx-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from '../util/errorBoundary'
import { Collapsible } from '../util/collapsible'
import { GenerateButtons } from '../session/generate'
import { AStore } from '../main/astore'
import { SpMenu, SpSlider } from '../util/elements'
import { mapRange } from '../controlnet/util'
import { requestGetUpscalers } from '../util/ts/sdapi'

export const store = new AStore({
    upscaling_resize: 2,
    upscaler_list: [] as string[],
    upscaler_1: '',
    upscaler_2: '',
    resize_mode: 0,
    show_extras_results: 0,
    gfpgan_visibility: 0,
    codeformer_visibility: 0,
    codeformer_weight: 0,
    upscaling_resize_w: 0,
    upscaling_resize_h: 0,
    upscaling_crop: true,
    extras_upscaler_2_visibility: 0,
    upscale_first: false,
})

export async function refreshExtraUpscalers() {
    try {
        const upscalers = await requestGetUpscalers()
        if (upscalers) {
            store.data.upscaler_list = upscalers.map(
                (upscaler: { name: any }) => upscaler.name
            )
        }
    } catch (e) {
        console.error(e)
    }
}
@observer
export class ExtraPage extends React.Component {
    componentDidMount(): void {}

    render(): React.ReactNode {
        return (
            <div>
                <div style={{ paddingBottom: '5px' }}>
                    <SpSlider
                        style={{ display: 'block' }}
                        show-value="false"
                        id="slUpscaleSize"
                        min="10"
                        max="80"
                        value={store.data.upscaling_resize * 10}
                        title="Resize scale of current selection size"
                        onInput={(evt: any) => {
                            store.data.upscaling_resize = mapRange(
                                evt.target.value,
                                10,
                                80,
                                1,
                                8,
                                0.01
                            )
                        }}
                    >
                        <sp-label slot="label">Resize</sp-label>
                        <sp-label
                            class="labelNumber"
                            slot="label"
                            id="lUpscaleSize"
                        >
                            {store.data.upscaling_resize.toFixed(2)}
                        </sp-label>
                    </SpSlider>
                </div>
                <GenerateButtons></GenerateButtons>

                <div
                    id="progressContainerUpscale"
                    style={{ paddingBottom: '5px' }}
                >
                    <sp-label slot="label" class="lProgressLabel">
                        No work in progress
                    </sp-label>
                </div>
                <div style={{ paddingBottom: '5px' }}>
                    <sp-label
                        class="title"
                        style={{ width: '60px', display: 'inline-block' }}
                    >
                        Upscaler 1:
                    </sp-label>
                    <SpMenu
                        size="m"
                        title="Upscaler 1"
                        items={store.data.upscaler_list}
                        label_item="Select an Upscaler Model"
                        selected_index={store.data.upscaler_list.indexOf(
                            store.data.upscaler_1
                        )}
                        onChange={(id: any, value: any) => {
                            store.data.upscaler_1 = value.item
                        }}
                    ></SpMenu>

                    <div></div>
                    <sp-label
                        class="title"
                        style={{ width: '60px', display: 'inline-block' }}
                    >
                        Upscaler 2:
                    </sp-label>
                    <SpMenu
                        size="m"
                        title="Upscaler 2"
                        items={store.data.upscaler_list}
                        label_item="Select an Upscaler Model"
                        selected_index={store.data.upscaler_list.indexOf(
                            store.data.upscaler_2
                        )}
                        onChange={(id: any, value: any) => {
                            store.data.upscaler_2 = value.item
                        }}
                    ></SpMenu>
                </div>
                <div style={{ paddingBottom: '5px' }}>
                    <SpSlider
                        style={{ display: 'block' }}
                        show-value="false"
                        id="slUpscaler2Visibility"
                        min="0"
                        max="10"
                        value={store.data.extras_upscaler_2_visibility * 10}
                        onInput={(evt: any) => {
                            store.data.extras_upscaler_2_visibility =
                                evt.target.value / 10
                        }}
                    >
                        <sp-label
                            class="title"
                            style={{ width: '110px', display: 'inline-block' }}
                            slot="label"
                        >
                            Upscaler 2 visibility:
                        </sp-label>
                        <sp-label
                            style={{ display: 'inline-block' }}
                            class="labelNumber"
                            slot="label"
                            id="lUpscaler2Visibility"
                        >
                            {store.data.extras_upscaler_2_visibility.toFixed(2)}
                        </sp-label>
                    </SpSlider>
                </div>
                <div style={{ paddingBottom: '5px' }}>
                    <SpSlider
                        style={{ display: 'block' }}
                        show-value="false"
                        id="slGFPGANVisibility"
                        min="0"
                        max="10"
                        value={store.data.gfpgan_visibility * 10}
                        onInput={(evt: any) => {
                            store.data.gfpgan_visibility = evt.target.value / 10
                        }}
                    >
                        <sp-label
                            class="title"
                            style={{ width: '110px', display: 'inline-block' }}
                            slot="label"
                        >
                            GFPGAN visibility:
                        </sp-label>
                        <sp-label
                            style={{ display: 'inline-block' }}
                            class="labelNumber"
                            slot="label"
                            id="lGFPGANVisibility"
                        >
                            {store.data.gfpgan_visibility.toFixed(2)}
                        </sp-label>
                    </SpSlider>
                </div>
                <div style={{ paddingBottom: '5px' }}>
                    <SpSlider
                        style={{ display: 'block' }}
                        show-value="false"
                        id="slCodeFormerVisibility"
                        min="0"
                        max="10"
                        value={store.data.codeformer_visibility * 10}
                        onInput={(evt: any) => {
                            store.data.codeformer_visibility =
                                evt.target.value / 10
                        }}
                    >
                        <sp-label
                            class="title"
                            style={{ width: '110px', display: 'inline-block' }}
                            slot="label"
                        >
                            CodeFormer visibility:
                        </sp-label>
                        <sp-label
                            style={{ display: 'inline-block' }}
                            class="labelNumber"
                            slot="label"
                            id="lCodeFormerVisibility"
                        >
                            {store.data.codeformer_visibility.toFixed(2)}
                        </sp-label>
                    </SpSlider>
                </div>
                <div style={{ paddingBottom: '5px' }}>
                    <SpSlider
                        style={{ display: 'block' }}
                        show-value="false"
                        id="slCodeFormerWeight"
                        min="0"
                        max="10"
                        value={store.data.codeformer_weight * 10}
                        onInput={(evt: any) => {
                            store.data.codeformer_weight = evt.target.value / 10
                        }}
                    >
                        <sp-label
                            class="title"
                            style={{ width: '110px', display: 'inline-block' }}
                            slot="label"
                        >
                            CodeFormer weight:
                        </sp-label>
                        <sp-label
                            style={{ display: 'inline-block' }}
                            class="labelNumber"
                            slot="label"
                            id="lCodeFormerWeight"
                        >
                            {store.data.codeformer_weight.toFixed(2)}
                        </sp-label>
                    </SpSlider>
                </div>
            </div>
        )
    }
}

const containers = document.querySelectorAll('.extraPageContainer')!

containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)

    root.render(
        //<React.StrictMode>
        <ErrorBoundary>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={true} label={'Extra Page'}>
                    <ExtraPage />
                </Collapsible>
            </div>
        </ErrorBoundary>
        //</React.StrictMode>
    )
})
