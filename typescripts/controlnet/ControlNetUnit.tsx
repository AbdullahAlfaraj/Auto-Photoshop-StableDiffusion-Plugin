import { observer } from 'mobx-react'
import React from 'react'
import {
    MoveToCanvasSvg,
    ActionButtonSVG,
    SpCheckBox,
    SpMenu,
    SpSlider,
    Thumbnail,
    PenSvg,
    PreviewSvg,
    SpSliderWithLabel,
    SliderType,
} from '../util/elements'
import ControlNetStore, { ControlnetMode, controlnetModes } from './store'
import { mapRange, versionCompare } from './util'
import {
    note,
    selection,
    html_manip,
    psapi,
    api,
    general,
} from '../util/oldSystem'
import Locale from '../locale/locale'
import { requestControlNetFiltersKeywords } from './entry'

declare const g_generation_session: any
declare const io: any
declare const app: any
declare let g_sd_url: string

@observer
export default class ControlNetUnit extends React.Component<
    { index: number; appState: typeof ControlNetStore },
    {}
> {
    onEnableChange(event: any) {
        event.preventDefault()
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.enabled = !storeData.enabled
    }
    onLowVRamChange(event: any) {
        event.preventDefault()
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.lowvram = !storeData.lowvram
    }
    onGuessModeChange(event: any) {
        event.preventDefault()
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.guessmode = !storeData.guessmode
    }
    onPixelPerfectChange(event: any) {
        event.preventDefault()
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        console.log('onPixelPerfectChange', storeData.pixel_perfect)
        storeData.pixel_perfect = !storeData.pixel_perfect
    }
    onAutoImageChange(event: any) {
        event.preventDefault()
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        console.log('onAutoImageChange', storeData.auto_image)
        storeData.auto_image = !storeData.auto_image
    }
    onWeightMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.weight = +mapRange(
            event.target.value,
            0,
            200,
            0,
            2,
            0.01
        ).toFixed(2)
    }
    onGuidanceStartMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.guidance_start = +mapRange(
            event.target.value,
            0,
            10,
            0,
            1,
            0.1
        ).toFixed(1)
    }
    onGuidanceEndMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.guidance_end = +mapRange(
            event.target.value,
            0,
            10,
            0,
            1,
            0.1
        ).toFixed(1)
    }
    async onFilterChange(
        event: any,
        { index, item }: { index: number; item: string }
    ) {
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.filter_keyword = item
        if (storeData.filter_keyword.toLowerCase() === 'none') {
            storeData.module_list = this.props.appState.supportedPreprocessors
            storeData.model_list = ['None'].concat(
                this.props.appState.supportedModels
            )
        } else {
            const filters = await requestControlNetFiltersKeywords(
                storeData.filter_keyword,
                this.props.appState.supportedPreprocessors,
                this.props.appState.supportedModels
            )

            storeData.module_list = filters.module_list
            storeData.model_list = filters.model_list
            storeData.model = filters.default_model
            storeData.module = filters.default_option
            storeData.model = filters.default_model
        }
    }
    onPreprocsesorChange(
        event: any,
        { index, item }: { index: number; item: string }
    ) {
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.module = item
    }
    onModelChange(
        event: any,
        { index, item }: { index: number; item: string }
    ) {
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        storeData.model = item
    }
    onResolutionMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        let resolutionConfig =
            this.props.appState.preprocessorDetail[storeData.module] || {}
        let sliderConfig = resolutionConfig.sliders[0]
        storeData.processor_res = +(
            event.target.value * (sliderConfig.step || 1)
        )
    }
    onThresholdAMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        let resolutionConfig =
            this.props.appState.preprocessorDetail[storeData.module] || {}
        let sliderConfig = resolutionConfig.sliders[1]
        storeData.threshold_a = +(event.target.value * (sliderConfig.step || 1))
    }
    onThresholdBMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        let resolutionConfig =
            this.props.appState.preprocessorDetail[storeData.module] || {}
        let sliderConfig = resolutionConfig.sliders[2]
        storeData.threshold_b = +(event.target.value * (sliderConfig.step || 1))
    }
    async onSetImageButtonClick() {
        const selectionInfo = await selection.Selection.getSelectionInfoExe()
        if (selectionInfo) {
            const base64_image =
                await g_generation_session.setControlNetImageHelper()

            const storeData =
                this.props.appState.controlNetUnitData[this.props.index]
            storeData.input_image = base64_image
            storeData.selection_info = selectionInfo
        } else {
            await note.Notification.inactiveSelectionArea()
        }
    }
    async onMaskButtonClick() {
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        if (storeData.selection_info && storeData.mask) {
            const selection_info = storeData.selection_info
            const layer = await io.IO.base64ToLayer(
                storeData.mask,
                'ControlNet Mask.png',
                selection_info.left,
                selection_info.top,
                selection_info.width,
                selection_info.height
            )
        } else {
            // await note.Notification.inactiveSelectionArea()
            app.showAlert('Mask Image is not available')
        }
    }

    async requestControlNetDetectMap(
        controlnet_init_image: string,
        _module: string,
        processor_res: number,
        threshold_a: number,
        threshold_b: number
    ) {
        try {
            const payload = {
                controlnet_module: _module,
                controlnet_input_images: [controlnet_init_image],
                controlnet_processor_res: processor_res,
                controlnet_threshold_a: threshold_a,
                controlnet_threshold_b: threshold_b,
            }
            const full_url = `${g_sd_url}/controlnet/detect`

            const response_data = await api.requestPost(full_url, payload)

            // update the mask preview with the new detectMap
            if (response_data['images'].length === 0) {
                app.showAlert(response_data['info'])
            }
            return response_data['images'][0]
        } catch (e) {
            console.warn('requestControlNetDetectMap(): ', _module, e)
        }
    }

    async previewAnnotator() {
        const index = this.props.index
        try {
            const storeData = this.props.appState.controlNetUnitData[index]

            const controlnet_init_image = storeData.input_image

            const _module = storeData.module || 'none'
            const processor_res = storeData.processor_res
            const threshold_a = storeData.threshold_a
            const threshold_b = storeData.threshold_b

            if (!controlnet_init_image) {
                const error = 'ControlNet initial image is empty'
                app.showAlert(error)
                throw error
            }
            if (!_module || _module === 'none') {
                const error = 'select a valid controlnet module (preprocessor)'
                app.showAlert(error)
                throw error
            }

            const detect_map = await this.requestControlNetDetectMap(
                controlnet_init_image,
                _module,
                processor_res,
                threshold_a,
                threshold_b
            )

            const rgb_detect_map_url =
                await io.convertBlackAndWhiteImageToRGBChannels3(detect_map)
            const rgb_detect_map = general.base64UrlToBase64(rgb_detect_map_url)
            // g_generation_session.controlNetMask[index] = rgb_detect_map
            storeData.detect_map = rgb_detect_map
        } catch (e) {
            console.warn('PreviewAnnotator click(): index: ', index, e)
        }
    }
    async setMask() {
        try {
            const selectionInfo = await psapi.getSelectionInfoExe()
            if (selectionInfo) {
                const mask_base64 = await io.getMaskFromCanvas()
                this.props.appState.controlNetUnitData[this.props.index].mask =
                    mask_base64
            } else {
                // await note.Notification.inactiveSelectionArea()
                app.showAlert('No Selection is available')
            }
        } catch (e) {
            console.warn(e)
        }
    }
    async resetMask() {
        this.props.appState.controlNetUnitData[this.props.index].mask = ''
    }
    async toCanvas() {
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        if (storeData.selection_info && storeData.detect_map) {
            const selection_info = storeData.selection_info

            const layer = await io.IO.base64ToLayer(
                storeData.detect_map,
                'ControlNet Detection Map.png',
                selection_info.left,
                selection_info.top,
                selection_info.width,
                selection_info.height
            )
        } else {
            // await note.Notification.inactiveSelectionArea()
            app.showAlert('Detection Map is not available')
        }
    }
    async toControlNetInitImage() {
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]

        storeData.input_image = storeData.detect_map
    }
    async previewAnnotatorFromCanvas() {
        try {
            const storeData =
                this.props.appState.controlNetUnitData[this.props.index]
            const _module = storeData.module || 'none'

            const width = html_manip.getWidth()
            const height = html_manip.getHeight()
            const selectionInfo = await psapi.getSelectionInfoExe()
            storeData.selection_info = selectionInfo
            const base64 =
                await io.IO.getSelectionFromCanvasAsBase64Interface_New(
                    width,
                    height,
                    selectionInfo,
                    true
                )

            if (!_module || _module === 'none') {
                const error = 'select a valid controlnet module (preprocessor)'
                app.showAlert(error)
                throw error
            }

            const processor_res = storeData.processor_res
            const threshold_a = storeData.threshold_a
            const threshold_b = storeData.threshold_b

            const detect_map = await this.requestControlNetDetectMap(
                base64,
                _module,
                processor_res,
                threshold_a,
                threshold_b
            )

            const rgb_detect_map_url =
                await io.convertBlackAndWhiteImageToRGBChannels3(detect_map)
            g_generation_session.controlNetMask[this.props.index] = detect_map

            storeData.detect_map = general.base64UrlToBase64(rgb_detect_map_url)
        } catch (e) {
            console.warn(
                'PreviewAnnotator click(): index: ',
                this.props.index,
                e
            )
        }
    }
    render() {
        const storeData =
            this.props.appState.controlNetUnitData[this.props.index]
        const pd =
            this.props.appState.preprocessorDetail[storeData.module] || {}
        const ppSlider = pd.sliders || []

        return (
            <div id={`controlnet_settings_${this.props.index}`}>
                {/* <div className="flexContainer">
                    <SpCheckBox
                        style={{ marginRight: '10px' }}
                        onChange={this.onEnableChange.bind(this)}
                        checked={storeData.enabled}
                        id={`chEnableControlNet_${this.props.index}`}
                        value={
                            this.props.appState.controlNetUnitData[
                                this.props.index
                            ].enabled
                        }
                    >
                        ControlNet Unit {this.props.index}{' '}
                        {storeData.module && storeData.module !== 'none'
                            ? `(${storeData.module})`
                            : void 0}
                    </SpCheckBox>
                </div> */}
                <div
                    style={{
                        display: 'block',
                        // display: storeData.enabled ? 'block' : 'none'
                    }}
                >
                    <div style={{ display: 'flex' }}>
                        <div
                            id={`control_net_image_container_${this.props.index}`}
                            className="imgContainer controlNetImaageContainer"
                        >
                            <div>
                                <img
                                    id={`control_net_image_${this.props.index}`}
                                    className="column-item-image"
                                    src={
                                        storeData.input_image
                                            ? 'data:image/png;base64,' +
                                              storeData.input_image
                                            : 'https://source.unsplash.com/random'
                                    }
                                    width="300px"
                                    height="100px"
                                />
                            </div>
                            <div className="imgButton">
                                <button
                                    className="column-item button-style btnSquare"
                                    id={`bSetControlImage_${this.props.index}`}
                                    onClick={this.onSetImageButtonClick.bind(
                                        this
                                    )}
                                    title="Set CtrlNet Img"
                                >
                                    {Locale('Set CtrlImg')}
                                </button>
                            </div>
                        </div>
                        <div
                            id={`control_net_mask_container_${this.props.index}`}
                            className="imgContainer controlNetImaageContainer"
                        >
                            <div>
                                <Thumbnail>
                                    <img
                                        id={`control_net_mask_${this.props.index}`}
                                        className="column-item-image"
                                        src={
                                            storeData.detect_map
                                                ? 'data:image/png;base64,' +
                                                  storeData.detect_map
                                                : 'https://source.unsplash.com/random'
                                        }
                                        width="300px"
                                        height="100px"
                                    />
                                    <ActionButtonSVG
                                        ComponentType={PenSvg}
                                        onClick={this.toControlNetInitImage.bind(
                                            this
                                        )}
                                        title={Locale(
                                            'use as controlnet input image'
                                        )}
                                    ></ActionButtonSVG>
                                    <ActionButtonSVG
                                        ComponentType={MoveToCanvasSvg}
                                        onClick={this.toCanvas.bind(this)}
                                        title={Locale('Copy Image to Canvas')}
                                    ></ActionButtonSVG>
                                    <ActionButtonSVG
                                        ComponentType={PreviewSvg}
                                        onClick={this.previewAnnotatorFromCanvas.bind(
                                            this
                                        )}
                                        title={Locale(
                                            'Preview Annotation From the Selected Area on Canvas'
                                        )}
                                    ></ActionButtonSVG>
                                </Thumbnail>
                            </div>
                            <div className="imgButton btnClass">
                                <button
                                    className="column-item button-style btnSquare"
                                    id={`bControlMask_${this.props.index}`}
                                    onClick={this.previewAnnotator.bind(this)}
                                    title="Preview Annotator"
                                >
                                    {Locale('Preview Annotator')}
                                </button>
                            </div>
                        </div>

                        {!this.props.appState.controlNetUnitData[
                            this.props.index
                        ].model
                            .toLowerCase()
                            .includes('inpaint') ? (
                            void 0
                        ) : (
                            <div className="imgContainer controlNetImaageContainer">
                                <div>
                                    <Thumbnail>
                                        <img
                                            className="column-item-image"
                                            src={
                                                storeData.mask
                                                    ? 'data:image/png;base64,' +
                                                      storeData.mask
                                                    : 'https://source.unsplash.com/random'
                                            }
                                            width="300px"
                                            height="100px"
                                        />

                                        <ActionButtonSVG
                                            ComponentType={PenSvg}
                                            onClick={this.setMask.bind(this)}
                                            title={Locale(
                                                'set the mask for controlnet inpaint mode'
                                            )}
                                        ></ActionButtonSVG>
                                        <ActionButtonSVG
                                            ComponentType={PenSvg}
                                            onClick={this.resetMask.bind(this)}
                                            title={Locale('reset the mask')}
                                        ></ActionButtonSVG>
                                    </Thumbnail>
                                </div>
                                <div className="imgButton btnClass">
                                    <button
                                        className="column-item button-style btnSquare"
                                        id={`bControlMask_${this.props.index}`}
                                        onClick={this.setMask.bind(this)}
                                        title="Preview Annotator"
                                    >
                                        {Locale('Set Mask')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <SpCheckBox
                        style={{ marginRight: '10px' }}
                        onChange={this.onLowVRamChange.bind(this)}
                        checked={storeData.lowvram}
                        id={`chlowVram_${this.props.index}`}
                    >
                        {Locale('Low VRAM')}
                    </SpCheckBox>
                    <SpCheckBox
                        style={{
                            display:
                                this.props.appState.controlnetApiVersion > 1
                                    ? 'none'
                                    : void 0,
                            marginRight: '10px',
                        }}
                        onChange={this.onGuessModeChange.bind(this)}
                        checked={storeData.guessmode}
                        id={`chGuessMode_${this.props.index}`}
                    >
                        {Locale('Guess Mode')}
                    </SpCheckBox>
                    <SpCheckBox
                        style={{
                            display:
                                this.props.appState.controlnetApiVersion > 1
                                    ? void 0
                                    : 'none',
                            marginRight: '10px',
                        }}
                        onChange={this.onPixelPerfectChange.bind(this)}
                        checked={storeData.pixel_perfect}
                        id={`chPixelPerfect_${this.props.index}`}
                    >
                        {Locale('Pixel Perfect')}
                    </SpCheckBox>
                    <SpCheckBox
                        style={{
                            marginRight: '10px',
                        }}
                        onChange={this.onAutoImageChange.bind(this)}
                        checked={storeData.auto_image}
                        // id={`chPixelPerfect_${this.props.index}`}
                        title={Locale(
                            'load the input image from canvas automatically'
                        )}
                    >
                        {
                            //@ts-ignore
                            Locale('Auto Image')
                        }
                    </SpCheckBox>
                    {this.props.appState.controlnetApiVersion > 1 && (
                        <sp-radio-group
                            style={{ display: 'flex' }}
                            selected={
                                this.props.appState.controlNetUnitData[
                                    this.props.index
                                ].control_mode
                            }
                            onClick={(event: any) => {
                                this.props.appState.controlNetUnitData[
                                    this.props.index
                                ].control_mode = event.target.value
                            }}
                        >
                            <sp-label slot="label">
                                {Locale('Control Mode')}
                            </sp-label>
                            {controlnetModes.map(
                                (mode: ControlnetMode, index: number) => {
                                    // console.log('mode:', mode, ' index:', index)
                                    return (
                                        <sp-radio
                                            key={`mode-${index}`}
                                            checked={
                                                this.props.appState
                                                    .controlNetUnitData[
                                                    this.props.index
                                                ].control_mode === mode
                                                    ? true
                                                    : void 0
                                            }
                                            value={`${mode}`}
                                        >
                                            {Locale(mode)}
                                        </sp-radio>
                                    )
                                }
                            )}
                        </sp-radio-group>
                    )}

                    <div>
                        <div>
                            <SpSlider
                                show-value="false"
                                min={0}
                                max={200}
                                value={storeData.weight * 100}
                                onInput={this.onWeightMove.bind(this)}
                                title="2 will keep the composition; 0 will allow composition to change"
                            >
                                <sp-label slot="label">
                                    {Locale('Control Weight')}
                                </sp-label>
                                <sp-label slot="label">
                                    {storeData.weight}
                                </sp-label>
                            </SpSlider>
                            <SpSlider
                                show-value="false"
                                min="0"
                                max="10"
                                value={
                                    +mapRange(
                                        storeData.guidance_start,
                                        0,
                                        1,
                                        0,
                                        10,
                                        1
                                    ).toFixed(1)
                                }
                                onInput={this.onGuidanceStartMove.bind(this)}
                            >
                                <sp-label slot="label">
                                    {Locale('Guidance Start (T)')}
                                </sp-label>
                                <sp-label
                                    slot="label"
                                    id={`lControlNetGuidanceStrengthStart_${this.props.index}`}
                                >
                                    {storeData.guidance_start}
                                </sp-label>
                            </SpSlider>
                            <SpSlider
                                show-value="false"
                                min="0"
                                max="10"
                                value={
                                    +mapRange(
                                        storeData.guidance_end,
                                        0,
                                        1,
                                        0,
                                        10,
                                        1
                                    ).toFixed(1)
                                }
                                onInput={this.onGuidanceEndMove.bind(this)}
                            >
                                <sp-label slot="label">
                                    {Locale('Guidance End (T)')}
                                </sp-label>
                                <sp-label
                                    slot="label"
                                    id={`lControlNetGuidanceStrengthEnd_${this.props.index}`}
                                >
                                    {storeData.guidance_end}
                                </sp-label>
                            </SpSlider>
                            {ppSlider &&
                                ppSlider[0] &&
                                !storeData.pixel_perfect && (
                                    <SpSlider
                                        show-value="false"
                                        min={
                                            ppSlider[0].min /
                                            (ppSlider[0].step || 1)
                                        }
                                        max={
                                            ppSlider[0].max /
                                            (ppSlider[0].step || 1)
                                        }
                                        value={
                                            storeData.processor_res /
                                            (ppSlider[0].step || 1)
                                        }
                                        onInput={this.onResolutionMove.bind(
                                            this
                                        )}
                                    >
                                        <sp-label slot="label">
                                            {ppSlider[0].name}:
                                        </sp-label>
                                        <sp-label slot="label">
                                            {storeData.processor_res.toFixed(2)}
                                        </sp-label>
                                    </SpSlider>
                                )}
                            {ppSlider && ppSlider[1] && (
                                <SpSlider
                                    show-value="false"
                                    min={
                                        ppSlider[1].min /
                                        (ppSlider[1].step || 1)
                                    }
                                    max={
                                        ppSlider[1].max /
                                        (ppSlider[1].step || 1)
                                    }
                                    value={
                                        storeData.threshold_a /
                                        (ppSlider[1].step || 1)
                                    }
                                    onInput={this.onThresholdAMove.bind(this)}
                                >
                                    <sp-label slot="label">
                                        {ppSlider[1].name}:
                                    </sp-label>
                                    <sp-label slot="label">
                                        {storeData.threshold_a.toFixed(2)}
                                    </sp-label>
                                </SpSlider>
                            )}
                            {ppSlider && ppSlider[2] && (
                                <SpSlider
                                    show-value="false"
                                    min={
                                        ppSlider[2].min /
                                        (ppSlider[2].step || 1)
                                    }
                                    max={
                                        ppSlider[2].max /
                                        (ppSlider[2].step || 1)
                                    }
                                    value={
                                        storeData.threshold_b /
                                        (ppSlider[2].step || 1)
                                    }
                                    onInput={this.onThresholdBMove.bind(this)}
                                >
                                    <sp-label slot="label">
                                        {ppSlider[2].name}:
                                    </sp-label>
                                    <sp-label slot="label">
                                        {storeData.threshold_b.toFixed(2)}
                                    </sp-label>
                                </SpSlider>
                            )}
                        </div>
                    </div>
                    <div style={{ width: '50%', display: 'flex' }}>
                        <SpMenu
                            onChange={this.onFilterChange.bind(this)}
                            items={this.props.appState.filterKeywords}
                            label_item={Locale('Select Filter')}
                            selected_index={this.props.appState.filterKeywords.indexOf(
                                storeData.filter_keyword || 'All'
                            )}
                            // style={{ width: '50%', display: 'flex' }}
                        />
                    </div>
                    <div
                        id={`menu-bar-control_net_${this.props.index}`}
                        style={{ display: 'flex' }}
                    >
                        <div style={{ width: '50%', display: 'flex' }}>
                            <SpMenu
                                onChange={this.onPreprocsesorChange.bind(this)}
                                id={`mModulesMenuControlNet_${this.props.index}`}
                                items={storeData.module_list || ['none']}
                                label_item={Locale('Select Module')}
                                selected_index={storeData.module_list?.indexOf(
                                    storeData.module
                                )}
                                style={{ width: '100%' }}
                            />
                        </div>
                        {!pd.model_free && (
                            <div style={{ width: '50%', display: 'flex' }}>
                                <SpMenu
                                    onChange={this.onModelChange.bind(this)}
                                    id={`mModelsMenuControlNet_${this.props.index}`}
                                    items={storeData.model_list || []}
                                    label_item={Locale('Select Module')}
                                    selected_index={storeData.model_list?.indexOf(
                                        storeData.model
                                    )}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }
}
