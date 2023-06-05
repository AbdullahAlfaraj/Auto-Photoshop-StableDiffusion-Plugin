import { observer } from 'mobx-react';
import React from 'react';
import { SpCheckBox, SpMenu, SpSlider } from '../util/elements';
import ControlNetStore from './store';
import { mapRange, versionCompare } from './util';
import { note, selection } from '../util/oldSystem';

declare const g_generation_session: any;
declare const io: any;
declare const app: any;


@observer
export default class ControlNetUnit extends React.Component<{ index: number, appState: typeof ControlNetStore }, {}> {

    onEnableChange(event: any) {
        event.preventDefault()
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.enabled = !storeData.enabled;
    }
    onLowVRamChange(event: any) {
        event.preventDefault()
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.lowvram = !storeData.lowvram;
    }
    onGuessModeChange(event: any) {
        event.preventDefault()
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.guessmode = !storeData.guessmode;
    }
    onPixelPerfectChange(event: any) {
        event.preventDefault()
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        console.log('onPixelPerfectChange', storeData.pixel_perfect);
        storeData.pixel_perfect = !storeData.pixel_perfect;
    }
    onWeightMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return;
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.weight = +mapRange(event.target.value, 0, 200, 0, 2, 0.01).toFixed(2);
    }
    onGuidanceStartMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return;
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.guidance_start = +mapRange(event.target.value, 0, 10, 0, 1, 0.1).toFixed(1);
    }
    onGuidanceEndMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return;
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.guidance_end = +mapRange(event.target.value, 0, 10, 0, 1, 0.1).toFixed(1);
    }
    onPreprocsesorChange(event: any, { index, item }: { index: number, item: string }) {
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.module = item
    }
    onModelChange(event: any, { index, item }: { index: number, item: string }) {
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        storeData.model = item
    }
    onResolutionMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return;
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        let resolutionConfig = this.props.appState.preprocessorDetail[storeData.module] || {};
        let sliderConfig = resolutionConfig.sliders[0];
        storeData.processor_res = +(event.target.value * (sliderConfig.step || 1));
    }
    onThresholdAMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return;
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        let resolutionConfig = this.props.appState.preprocessorDetail[storeData.module] || {};
        let sliderConfig = resolutionConfig.sliders[1];
        storeData.threshold_a = +(event.target.value * (sliderConfig.step || 1));
    }
    onThresholdBMove(event: any) {
        event.preventDefault()
        if (event.target.tagName != 'SP-SLIDER') return;
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        let resolutionConfig = this.props.appState.preprocessorDetail[storeData.module] || {};
        let sliderConfig = resolutionConfig.sliders[2];
        storeData.threshold_b = +(event.target.value * (sliderConfig.step || 1));
    }
    async onSetImageButtonClick() {
        const selectionInfo = await selection.Selection.getSelectionInfoExe()
        if (selectionInfo) {
            const base64_image = await g_generation_session.setControlNetImageHelper()

            this.props.appState.controlNetUnitData[this.props.index].input_image = base64_image
        } else {
            await note.Notification.inactiveSelectionArea()
        }
    }
    async onMaskButtonClick() {
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        if (
            g_generation_session.control_net_selection_info &&
            storeData.mask
        ) {
            const selection_info =
                g_generation_session.control_net_selection_info
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

    render() {
        const storeData = this.props.appState.controlNetUnitData[this.props.index];
        const pd = this.props.appState.preprocessorDetail[storeData.module] || {};
        const ppSlider = pd.sliders || [];

        console.log("pixel_perfect:" + storeData.pixel_perfect);

        return <div id={`controlnet_settings_${this.props.index}`}>
            <div className="flexContainer">
                <sp-label slot="label"
                >Control Net Settings Slot {this.props.index}</sp-label>
            </div>
            <div style={{ display: "flex" }}>
                <div
                    id={`control_net_image_container_${this.props.index}`}
                    className="imgContainer controlNetImaageContainer"
                >
                    <div>
                        <img
                            id={`control_net_image_${this.props.index}`}
                            className="column-item-image"
                            src={storeData.input_image ? 'data:image/png;base64,' + storeData.input_image : "https://source.unsplash.com/random"}
                            width="300px"
                            height="100px"
                        />
                    </div>
                    <div className="imgButton">
                        <button
                            className="column-item button-style btnSquare"
                            id={`bSetControlImage_${this.props.index}`}
                            onClick={this.onSetImageButtonClick.bind(this)}
                            title="Set CtrlNet Img"
                        >
                            Set CtrlNet Img
                        </button>
                    </div>
                </div>
                <div
                    id={`control_net_mask_container_${this.props.index}`}
                    className="imgContainer controlNetImaageContainer"
                >
                    <div>
                        <img
                            id={`control_net_mask_${this.props.index}`}
                            className="column-item-image"
                            src={storeData.mask ? 'data:image/png;base64,' + storeData.mask : "https://source.unsplash.com/random"}
                            width="300px"
                            height="100px"
                        />
                    </div>
                    <div className="imgButton btnClass">
                        <button
                            className="column-item button-style btnSquare"
                            id={`bControlMask_${this.props.index}`}
                            onClick={this.onMaskButtonClick.bind(this)}
                            title="Preview Annotator"
                        >
                            Preview Annotator
                        </button>
                    </div>
                </div>
            </div>

            <SpCheckBox onChange={this.onEnableChange.bind(this)} checked={storeData.enabled} id={`chEnableControlNet_${this.props.index}`} value={this.props.appState.controlNetUnitData[this.props.index].enabled}>Enable</SpCheckBox>
            <SpCheckBox onChange={this.onLowVRamChange.bind(this)} checked={storeData.lowvram} id={`chlowVram_${this.props.index}`}>Low VRAM</SpCheckBox>
            <SpCheckBox style={{display: this.props.appState.controlnetApiVersion > 1 ? 'none' : void 0}} onChange={this.onGuessModeChange.bind(this)} checked={storeData.guessmode} id={`chGuessMode_${this.props.index}`}>Guess Mode</SpCheckBox>
            <SpCheckBox style={{display: this.props.appState.controlnetApiVersion > 1 ? void 0 : 'none'}} onChange={this.onPixelPerfectChange.bind(this)} checked={storeData.pixel_perfect} id={`chPixelPerfect_${this.props.index}`}>Pixel Perfect</SpCheckBox>
            {
                this.props.appState.controlnetApiVersion > 1 &&
                <sp-radio-group id={`rgControlNetMode_${this.props.index}`} style={{ display: 'flex' }}>
                    <sp-label slot="label">Control Mode:</sp-label>
                    <sp-radio
                        checked
                        value="0"
                    >Balanced</sp-radio>
                    <sp-radio
                        title="My prompt is more important"
                        value="1"
                    >Prompt</sp-radio>
                    <sp-radio
                        title="ControlNet is more important"
                        value="2"
                    >ControlNet</sp-radio>
                </sp-radio-group>
            }

            <div>
                <div>
                    <SpSlider
                        show-value="false"
                        id={`slControlNetWeight_${this.props.index}`}
                        min="0"
                        max="200"
                        value="100"
                        onMousemove={this.onWeightMove.bind(this)}
                        title="2 will keep the composition; 0 will allow composition to change"
                    >
                        <sp-label slot="label">Weight:</sp-label>
                        <sp-label slot="label" id={`lControlNetWeight_${this.props.index}`}>{storeData.weight}</sp-label>
                    </SpSlider>
                    <SpSlider
                        show-value="false"
                        id={`slControlNetGuidanceStrengthStart_${this.props.index}`}
                        min="0"
                        max="10"
                        value="0"
                        onMousemove={this.onGuidanceStartMove.bind(this)}
                    >
                        <sp-label slot="label">Guidance strength start:</sp-label>
                        <sp-label
                            slot="label"
                            id={`lControlNetGuidanceStrengthStart_${this.props.index}`}
                        >{storeData.guidance_start}</sp-label>
                    </SpSlider>
                    <SpSlider
                        show-value="false"
                        id={`slControlNetGuidanceStrengthEnd_${this.props.index}`}
                        min="0"
                        max="10"
                        value="100"
                        onMousemove={this.onGuidanceEndMove.bind(this)}
                    >
                        <sp-label slot="label">Guidance strength end:</sp-label>
                        <sp-label
                            slot="label"
                            id={`lControlNetGuidanceStrengthEnd_${this.props.index}`}
                        >{storeData.guidance_end}</sp-label>
                    </SpSlider>
                    {ppSlider && ppSlider[0] && !storeData.pixel_perfect && <SpSlider
                        show-value="false"
                        min={ppSlider[0].min / (ppSlider[0].step || 1)}
                        max={ppSlider[0].max / (ppSlider[0].step || 1)}
                        value={storeData.processor_res / (ppSlider[0].step || 1)}
                        onMousemove={this.onResolutionMove.bind(this)}
                    >
                        <sp-label slot="label">{ppSlider[0].name}:</sp-label>
                        <sp-label slot="label">{storeData.processor_res.toFixed(2)}</sp-label>
                    </SpSlider>}
                    {ppSlider && ppSlider[1] && <SpSlider
                        show-value="false"
                        min={ppSlider[1].min / (ppSlider[1].step || 1)}
                        max={ppSlider[1].max / (ppSlider[1].step || 1)}
                        value={storeData.threshold_a / (ppSlider[1].step || 1)}
                        onMousemove={this.onThresholdAMove.bind(this)}
                    >
                        <sp-label slot="label">{ppSlider[1].name}:</sp-label>
                        <sp-label slot="label">{storeData.threshold_a.toFixed(2)}</sp-label>
                    </SpSlider>}
                    {ppSlider && ppSlider[2] && <SpSlider
                        show-value="false"
                        min={ppSlider[2].min / (ppSlider[2].step || 1)}
                        max={ppSlider[2].max / (ppSlider[2].step || 1)}
                        value={storeData.threshold_b / (ppSlider[2].step || 1)}
                        onMousemove={this.onThresholdBMove.bind(this)}
                    >
                        <sp-label slot="label">{ppSlider[2].name}:</sp-label>
                        <sp-label slot="label">{storeData.threshold_b.toFixed(2)}</sp-label>
                    </SpSlider>}
                </div>
            </div>
            <div id={`menu-bar-control_net_${this.props.index}`} style={{ display: "flex" }}>
                <SpMenu
                    onChange={this.onPreprocsesorChange.bind(this)}
                    id={`mModulesMenuControlNet_${this.props.index}`}
                    items={this.props.appState.supportedPreprocessors}
                    selected_index={this.props.appState.supportedPreprocessors.indexOf(storeData.module || 'none')}
                />
                {!pd.model_free && 
                (<SpMenu
                    onChange={this.onModelChange.bind(this)}
                    id={`mModelsMenuControlNet_${this.props.index}`}
                    items={['none'].concat(this.props.appState.supportedModels)}
                    selected_index={this.props.appState.supportedModels.indexOf(storeData.model || 'none')}
                />)
                }
            </div>
        </div>
    }
}
