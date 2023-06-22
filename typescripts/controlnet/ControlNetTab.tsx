import { observer } from 'mobx-react';
import React from 'react';
import ControlNetUnit from './ControlNetUnit';
import { store as ControlNetStore } from './main';
import { DefaultControlNetUnitData } from './store';
import { Enum, controlnet_preset, note, preset, selection } from '../util/oldSystem';
import {SpMenuComponent} from '../util/elements';
import Locale from '../locale/locale';

let g_controlnet_presets: any;
declare const g_generation_session: any;

@observer
class ControlNetTab extends React.Component<{ appState: typeof ControlNetStore }>{
    state = {
        maxControlNet: 0,
        presetMenuChildren: []
    }

    // private presetMenuChildren: JSX.Element[] = []

    onPresetMenuChange(evt: any) {
        
        const preset_index = evt.target.selectedIndex
        const preset_name = evt.target.options[preset_index].textContent
        ControlNetStore.controlNetUnitData.forEach((dataitem, index) => {
            const presetData = g_controlnet_presets[preset_name][index] || {}

            dataitem.enabled = presetData.enabled || DefaultControlNetUnitData.enabled
            dataitem.input_image = presetData.input_image || DefaultControlNetUnitData.input_image
            dataitem.mask = presetData.mask || DefaultControlNetUnitData.mask

            dataitem.module = presetData.module || DefaultControlNetUnitData.module
            dataitem.model = presetData.model || DefaultControlNetUnitData.model
            dataitem.weight = presetData.weight || DefaultControlNetUnitData.weight
            dataitem.resize_mode = presetData.resize_mode || DefaultControlNetUnitData.resize_mode
            dataitem.lowvram = presetData.lowvram || DefaultControlNetUnitData.lowvram
            dataitem.processor_res = presetData.processor_res || DefaultControlNetUnitData.processor_res
            dataitem.threshold_a = presetData.threshold_a || DefaultControlNetUnitData.threshold_a
            dataitem.threshold_b = presetData.threshold_b || DefaultControlNetUnitData.threshold_b
            dataitem.guidance_start = presetData.guidance_start || DefaultControlNetUnitData.guidance_start
            dataitem.guidance_end = presetData.guidance_end || DefaultControlNetUnitData.guidance_end
            dataitem.guessmode = presetData.guessmode || DefaultControlNetUnitData.guessmode

            dataitem.control_mode = presetData.control_mode || DefaultControlNetUnitData.control_mode
            dataitem.pixel_perfect = presetData.pixel_perfect || DefaultControlNetUnitData.pixel_perfect
        })
    }
  // function to update presetMenuChildren
  updatePresetMenuChildren(newChildren:any) {
    this.setState({ presetMenuChildren: newChildren });
  }
    async updatePresetMenuEvent() {
        
        const custom_presets = await preset.getAllCustomPresetsSettings(
            Enum.PresetTypeEnum['ControlNetPreset']
        )
        g_controlnet_presets = {
            'Select CtrlNet Preset': {},
            ...controlnet_preset.ControlNetNativePresets,
            ...custom_presets,
        }

        const presets_names = Object.keys(g_controlnet_presets)

        // debugger;
        const presetMenuChildren = presets_names.map(preset_name => {
            if (preset_name == "Select CtrlNet Preset")
                return <sp-menu-item key={preset_name} className="mControlNetPresetMenuItem" selected>{preset_name}</sp-menu-item>
            else
                return <sp-menu-item key={preset_name} className="mControlNetPresetMenuItem">{preset_name}</sp-menu-item>
        })
        this.updatePresetMenuChildren(presetMenuChildren)
    }

    async onSetAllControlImage() {
        const selectionInfo = await selection.Selection.getSelectionInfoExe()
        if (selectionInfo) {
            const base64_image = await g_generation_session.setControlNetImageHelper()

            ControlNetStore.controlNetUnitData.forEach(async (data) => {
                data.input_image = base64_image
            })
        } else {
            await note.Notification.inactiveSelectionArea()
        }
    }

    componentDidMount(): void {
        this.updatePresetMenuEvent()
    }

    render() {
        return (
            <div>
                <sp-picker
                    title="auto fill the ControlNet with smart settings, to speed up your working process."
                    size="m"
                    label="ControlNet Preset"
                >
                    <SpMenuComponent
                        id="mControlNetPresetMenu"
                        value="Select CtrlNet Preset"
                        onChange={this.onPresetMenuChange.bind(this)}
                        onUpdatePresetMenuEvent={this.updatePresetMenuEvent.bind(this)}
                    >
                        {this.state.presetMenuChildren.map(child => child)}
                    </SpMenuComponent>
                </sp-picker>
                <div></div>
                {
                    this.props.appState.maxControlNet == 0 && (
                        <sp-label
                            id="controlnetMissingError"
                            style={{ color: '#ff595e', whiteSpace: 'normal' }}
                        >
                            {Locale("The Controlnet Extension is missing from Automatic1111.\nPlease install it to use it through the plugin.")}
                        </sp-label>)
                }
                {/* <div
                    id="control_net_image_container"
                    className="imgContainer controlNetImaageContainer"
                >
                    <div className="imgButton">
                        <button
                            className="column-item btnSquare"
                            id="bSetAllControlImage"
                            onClick={this.onSetAllControlImage.bind(this)}
                        >
                            {Locale('controlnet.setall')}
                        </button>
                    </div>
                    <sp-checkbox id="chDisableControlNetTab"
                    >{Locale('controlnet.disableall')}</sp-checkbox>
                </div> */}
                <div>
                    {
                        Array(this.props.appState.maxControlNet).fill(0).map((v, index) => {
                            return <ControlNetUnit appState={this.props.appState} key={index} index={index} />
                        })
                    }
                </div>
            </div>
        );
    }
}


export default ControlNetTab;
