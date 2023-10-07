import React from 'react'
import ReactDOM from 'react-dom/client'

import { observer } from 'mobx-react'

import { GenerationModeEnum, ScriptMode } from '../util/ts/enum'
import { reaction } from 'mobx'
import { SpCheckBox, SpMenu, SpSlider, SpTextfield } from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'
import { Collapsible } from '../util/collapsible'

import {
    store,
    refreshModels,
    updateClickEventHandler,
    tempDisableElement,
    refreshUI,
    getLoraModelPrompt,
    requestLoraModels,
    mode_config,
    onModeChange,
    initInitMaskElement,
    widthSliderOnChangeEventHandler,
    initPlugin,
    helper_store,
    viewMaskExpansion,
    scaleFromToLabel,
    mask_content_config,
    requestGetHiResUpscalers,
    selection_mode_config,
    onWidthSliderInput,
    onHeightSliderInput,
    heightSliderOnChangeEventHandler,
    loadPresetSettings,
} from './util'
import { general } from '../util/oldSystem'
import { requestSwapModel, setInpaintMaskWeight } from '../util/ts/sdapi'
import { GenerateButtons } from '../session/generate'
import { MultiTextArea } from '../multiTextarea'
import { store as progress_store } from '../session/progress'
import { store as session_store } from '../session/session_store'
import { multiPrompts, settings_tab_ts } from '../entry'
import { getExpandedMask } from '../session/session'
import { mapRange } from '../controlnet/util'

import { store as preset_store } from '../preset/shared_ui_preset'

declare let g_version: string

reaction(
    () =>
        [store.data.is_lasso_mode, store.data.mode] as [
            boolean,
            GenerationModeEnum
        ],
    ([is_lasso_mode, mode]: [boolean, GenerationModeEnum]) => {
        if (is_lasso_mode && mode === GenerationModeEnum.Inpaint) {
            store.data.mode = GenerationModeEnum.LassoInpaint
        } else if (!is_lasso_mode && mode === GenerationModeEnum.LassoInpaint) {
            store.data.mode = GenerationModeEnum.Inpaint
        }
        // if (is_lasso_mode && mode === GenerationModeEnum.Outpaint) {
        //     store.data.mode = GenerationModeEnum.LassoOutpaint
        // } else if (
        //     !is_lasso_mode &&
        //     mode === GenerationModeEnum.LassoOutpaint
        // ) {
        //     store.data.mode = GenerationModeEnum.Outpaint
        // }
        console.log('store.data.is_lasso_mode:', store.data.is_lasso_mode)
        console.log('store.data.mode:', store.data.mode)
    }
)

const handleLassoModeChange = (event: any) => {
    store.updateProperty('is_lasso_mode', event.target.checked)
}
const Modes = observer(() => {
    const renderLassoModeElement = () => {
        if (
            [
                GenerationModeEnum.Inpaint,
                // GenerationModeEnum.Outpaint,
                GenerationModeEnum.LassoInpaint,
                // GenerationModeEnum.LassoOutpaint,
            ].includes(store.data.mode)
        ) {
            return (
                <>
                    <div>
                        <SpCheckBox
                            // style={{ marginRight: '10px' }}
                            onChange={handleLassoModeChange}
                            checked={store.data.is_lasso_mode}
                            // id={`chEnableControlNet_${this.props.index}`}
                        >
                            Lasso Mode
                        </SpCheckBox>

                        <SpSlider
                            show-value="false"
                            id="lasso_offset"
                            min="0"
                            max="100"
                            value={helper_store.data.lasso_offset}
                            onInput={(evt: any) => {
                                helper_store.data.lasso_offset = Number(
                                    evt.target.value
                                )
                            }}
                            style={{
                                display: store.data.is_lasso_mode
                                    ? void 0
                                    : 'none',
                            }}
                        >
                            <sp-label slot="label" class="title">
                                Lasso Offset:
                            </sp-label>
                            <sp-label slot="label">
                                {helper_store.data.lasso_offset}
                            </sp-label>
                        </SpSlider>
                    </div>
                </>

                // <sp-checkbox checked={store.data.is_lasso_mode ? true : void 0}>
                //     lasso mode
                // </sp-checkbox>
            )
        }
    }
    return <div>{renderLassoModeElement()}</div>
})

// const container = document.getElementById('reactModesContainer')!
// const root = ReactDOM.createRoot(container)

// root.render(
//     //<React.StrictMode>
//         <ErrorBoundary>
//             <Modes />
//         </ErrorBoundary>
//     //</React.StrictMode>
// )
@observer
class SDTab extends React.Component<{}> {
    async componentDidMount() {
        try {
            await refreshUI()
            await refreshModels()
            await initPlugin()
            helper_store.data.loras = await requestLoraModels()
            initInitMaskElement()
            helper_store.data.hr_upscaler_list =
                await requestGetHiResUpscalers()
            const btnSquareClass = document.getElementsByClassName('btnSquare')
            //REFACTOR: move to events.js
            for (let btnSquareButton of btnSquareClass) {
                btnSquareButton.addEventListener('click', async (evt) => {
                    // document.activeElement.blur()
                    setTimeout(() => {
                        try {
                            //@ts-ignore
                            evt.target.blur()
                        } catch (e) {
                            console.warn(e)
                        }
                    }, 500)
                })
            }

            // html_manip.sliderAddEventListener_new(
            //     'slImageCfgScale',
            //     'lImageCfgScale',
            //     0,
            //     30,
            //     0,
            //     3
            // )
        } catch (e) {
            console.warn(e)
        }
    }
    render() {
        const styles = {
            menuBarContainer: {
                // display: 'flex',
            },
            spMenu: {
                // flex: 1,
                width: '199px',
                marginRight: '3px',
            },
            button: {
                marginLeft: '3px',
                // flex: 0.5,
            },
        }
        return (
            <div>
                <div id="menu-bar-container" style={styles.menuBarContainer}>
                    <SpMenu
                        title="Stable Diffusion Models"
                        items={helper_store.data.models.map((model) => {
                            return model.model_name
                        })}
                        label_item="Select a Model"
                        style={{ ...styles.spMenu }}
                        selected_index={helper_store.data.models
                            .map((model) => {
                                return model.title
                            })
                            .indexOf(store.data.selected_model)}
                        onChange={(id: any, value: any) => {
                            // console.log('onChange value: ', value)
                            // store.updateProperty('subject', value.item)
                            console.log('value:', value)
                            store.data.selected_model = value.item

                            //REFACTOR: move to events.js
                            const model_index = value.index
                            let model = helper_store.data.models[model_index]

                            // g_model_name = `${model.model_name}.ckpt`

                            requestSwapModel(store.data.selected_model)
                        }}
                    ></SpMenu>

                    <button
                        title="Refresh the plugin, only fixes minor issues."
                        id="btnRefreshModels"
                        style={styles.button}
                        onClick={async (e) => {
                            await refreshUI()

                            tempDisableElement(e.target, 3000)
                        }}
                    >
                        Refresh
                    </button>
                    <button
                        title="Update the plugin if you encounter bugs. Get the latest features"
                        className="btnSquare"
                        id="btnUpdate"
                        style={styles.button}
                        onClick={async () => {
                            await updateClickEventHandler(g_version)
                        }}
                    >
                        Update
                    </button>
                </div>
                <div id="sdBtnContainer">
                    <SpMenu
                        title="use lora in your prompt"
                        style={{ ...styles.spMenu }}
                        items={helper_store.data.loras.map((lora: any) => {
                            return lora.name
                        })}
                        label_item="Select Lora"
                        // selected_index={store.data.models
                        //     .map((model) => {
                        //         return model.title
                        //     })
                        //     .indexOf(store.data.selected_model)}
                        onChange={(id: any, value: any) => {
                            const lora_prompt = getLoraModelPrompt(value.item)
                            const prompt = multiPrompts.getPrompt().positive
                            multiPrompts.setPrompt({
                                positive: `${prompt} ${lora_prompt}`,
                            })
                        }}
                    ></SpMenu>
                    <SpMenu
                        title="use textual inversion in your prompt"
                        style={{ ...styles.spMenu }}
                        items={helper_store.data.embeddings}
                        label_item="Select Textual Inversion"
                        onChange={(id: any, value: any) => {
                            const prompt = multiPrompts.getPrompt().positive
                            multiPrompts.setPrompt({
                                positive: `${prompt} ${value.item}`,
                            })
                        }}
                    ></SpMenu>

                    <sp-checkbox
                        title="use {keyword} form the prompts library"
                        id="chUsePromptShortcut"
                        checked={
                            settings_tab_ts.store.data.use_prompt_shortcut
                                ? true
                                : void 0
                        }
                        style={{ display: 'none' }}
                        onClick={(
                            event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                            settings_tab_ts.store.data.use_prompt_shortcut =
                                event.target.checked
                        }}
                    >
                        prompt shortcut
                    </sp-checkbox>
                </div>
                <div>
                    <div id="progressContainer">
                        <div style={{ display: 'flex' }}>
                            <sp-progressbar
                                class="pProgressBars"
                                id="pProgressBar"
                                max="100"
                                value="0"
                                style={{ width: '120px' }}
                            >
                                <sp-label slot="label" class="lProgressLabel">
                                    Progress...
                                </sp-label>
                            </sp-progressbar>
                            <input
                                title="Toggle the visibility of the Preview Image on the canvas"
                                type="checkbox"
                                name="optionCheckbox"
                                checked={
                                    progress_store.data.live_progress_image
                                }
                                onChange={(evt) => {
                                    progress_store.data.live_progress_image =
                                        evt.target.checked
                                }}
                            />
                        </div>
                    </div>
                    <GenerateButtons></GenerateButtons>

                    <div
                        style={{
                            border: '2px solid #6d6c6c',
                            padding: '3px',
                        }}
                    >
                        <Collapsible defaultIsOpen={true} label={'Prompts'}>
                            <MultiTextArea />
                        </Collapsible>
                    </div>

                    <sp-radio-group>
                        {mode_config.map((config: any, index: number) => {
                            return (
                                <sp-radio
                                    key={index}
                                    title={config.title}
                                    value={config.name}
                                    id={config.id ?? void 0}
                                    onClick={async (evt: any) => {
                                        await onModeChange(evt.target.value)
                                    }}
                                    checked={
                                        store.data.rb_mode === config.name
                                            ? true
                                            : void 0
                                    }
                                >
                                    {config.name}
                                </sp-radio>
                            )
                        })}
                    </sp-radio-group>
                    <Modes />
                    <div id="image_viewer">
                        <div className="imgButton"></div>

                        <table id="tableInitImageContainer">
                            <tbody>
                                <tr>
                                    <td id="initImageColumn">
                                        <div
                                            id="init_image_container"
                                            className="imgContainer"
                                            style={{
                                                display: [
                                                    ScriptMode.Img2Img,
                                                    ScriptMode.Inpaint,
                                                    ScriptMode.Outpaint,
                                                ].includes(store.data.rb_mode)
                                                    ? void 0
                                                    : 'none',
                                            }}
                                        >
                                            <div>
                                                <img
                                                    id="init_image"
                                                    className="column-item-image"
                                                    src="https://source.unsplash.com/random"
                                                    width="300px"
                                                    height="100px"
                                                />
                                            </div>
                                            <div className="imgButton">
                                                <button
                                                    className="column-item button-style disabled-btn"
                                                    disabled
                                                    id="bSetInitImage"
                                                >
                                                    Image
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            id="init_image_mask_container"
                                            className="imgContainer"
                                            style={{
                                                display: [
                                                    ScriptMode.Inpaint,
                                                    ScriptMode.Outpaint,
                                                ].includes(store.data.rb_mode)
                                                    ? void 0
                                                    : 'none',
                                            }}
                                        >
                                            <div>
                                                <img
                                                    id="init_image_mask"
                                                    className="column-item-image"
                                                    src="https://source.unsplash.com/random"
                                                    width="100px"
                                                    height="100px"
                                                />
                                            </div>
                                            <div className="imgButton">
                                                <button
                                                    className="column-item button-style disabled-btn"
                                                    disabled
                                                    id="bSetInitImageMask"
                                                >
                                                    Mask
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div>
                    <div id="batchNumberUi">
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-around',
                            }}
                        >
                            <div
                                id="batchNumberSdUiTabContainer"
                                style={{
                                    width: '35%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <sp-label>Batch Size:</sp-label>
                                <SpTextfield
                                    style={{ width: '100%' }}
                                    title="the number of images to generate at once.The larger the number more VRAM stable diffusion will use."
                                    id="tiNumberOfBatchSize"
                                    type="number"
                                    placeholder="1"
                                    value={store.data.batch_size.toFixed(0)}
                                    onChange={(evt: any) => {
                                        let value = parseInt(evt.target.value)
                                        if (!isFinite(value) || value < 1)
                                            value = 1
                                        // evt.target.value = value
                                        store.data.batch_size = value
                                    }}
                                ></SpTextfield>
                            </div>
                            <div
                                id="batchCountSdUiTabContainer"
                                style={{
                                    width: '20%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <sp-label>Batch Count:</sp-label>
                                <SpTextfield
                                    style={{ width: '100%' }}
                                    title="the number of images to generate in queue. The larger the number the longer will take."
                                    id="tiNumberOfBatchCount"
                                    type="number"
                                    placeholder="1"
                                    value={store.data.batch_count}
                                    onChange={(evt: any) => {
                                        store.data.batch_count = parseInt(
                                            evt.target.value
                                        )
                                    }}
                                ></SpTextfield>
                            </div>
                            <div
                                style={{
                                    width: '35%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <sp-label id="sdLabelSampleStep">
                                    Sampling Steps
                                </sp-label>
                                <SpTextfield
                                    style={{ width: '100%' }}
                                    title="the higher the steps the longer it will take to generate an image"
                                    id="tiNumberOfSteps"
                                    type="number"
                                    placeholder="20"
                                    value={store.data.steps.toFixed(0)}
                                    onChange={(evt: any) => {
                                        let value = evt.target.value
                                        store.data.steps = parseInt(value)
                                    }}
                                ></SpTextfield>
                            </div>
                        </div>
                    </div>
                    <div id="selectionMode">
                        <div>
                            <sp-label id="rbSelectionModeLabel" slot="label">
                                Selection Mode:
                            </sp-label>
                        </div>

                        <div
                            id="menu-bar-container_preset"
                            style={{ display: 'inline-flex' }}
                        >
                            <sp-radio-group id="selectionModeGroup" class="">
                                {selection_mode_config.map(
                                    (selection_mode, index) => {
                                        return (
                                            <sp-radio
                                                key={index}
                                                class="rbSelectionMode"
                                                checked={
                                                    store.data
                                                        .selection_mode ===
                                                    selection_mode.value
                                                        ? true
                                                        : void 0
                                                }
                                                value={selection_mode.value}
                                                title={selection_mode.title}
                                                onClick={async (evt: any) => {
                                                    store.data.selection_mode =
                                                        selection_mode.value
                                                    try {
                                                        const selectionInfo =
                                                            //@ts-ignore
                                                            await psapi.getSelectionInfoExe()
                                                        //@ts-ignore
                                                        await calcWidthHeightFromSelection(
                                                            selectionInfo
                                                        )
                                                    } catch (e) {
                                                        console.warn(e)
                                                    }
                                                }}
                                            >
                                                {selection_mode.name}
                                            </sp-radio>
                                        )
                                    }
                                )}
                            </sp-radio-group>

                            <div id="sdPresetContainer">
                                <SpMenu
                                    size="s"
                                    title="Custom Presets"
                                    items={Object.keys({
                                        ...helper_store.data.native_presets,
                                        ...preset_store.data.custom_presets,
                                    })}
                                    label_item="Select a Custom Preset"
                                    selected_index={Object.keys({
                                        ...helper_store.data.native_presets,
                                        ...preset_store.data.custom_presets,
                                    }).indexOf(
                                        preset_store.data
                                            .selected_sd_preset_name
                                    )}
                                    onChange={(id: any, value: any) => {
                                        console.log('value:', value)
                                        preset_store.data.selected_sd_preset_name =
                                            value.item
                                        preset_store.data.selected_sd_preset = {
                                            ...helper_store.data.native_presets,
                                            ...preset_store.data.custom_presets,
                                        }[value.item]
                                        console.log(
                                            'preset_store.data.selected_sd_preset:',
                                            preset_store.data.selected_sd_preset
                                        )
                                        loadPresetSettings(
                                            preset_store.data.selected_sd_preset
                                        )
                                    }}
                                ></SpMenu>
                                {/* <sp-picker
                                    title="auto fill the plugin with smart settings, to speed up your working process."
                                    size="s"
                                    label="Smart Preset"
                                >
                                    <sp-menu
                                        id="mPresetMenu"
                                        slot="options"
                                    ></sp-menu>
                                </sp-picker> */}
                            </div>
                        </div>
                        <div>
                            <sp-radio-group
                                id="baseSizeGroup"
                                class=""
                                style={{
                                    display:
                                        store.data.selection_mode !== 'ratio'
                                            ? 'hidden'
                                            : undefined,
                                }}
                            >
                                {[512, 768, 1024].map(
                                    (base_size: number, index) => {
                                        return (
                                            <sp-radio
                                                key={index}
                                                class="rbBaseSize"
                                                checked={
                                                    helper_store.data
                                                        .base_size === base_size
                                                        ? true
                                                        : void 0
                                                }
                                                value={base_size}
                                                title={base_size}
                                                onClick={async (evt: any) => {
                                                    helper_store.data.base_size =
                                                        base_size

                                                    try {
                                                        const selectionInfo =
                                                            //@ts-ignore
                                                            await psapi.getSelectionInfoExe()
                                                        //@ts-ignore
                                                        await calcWidthHeightFromSelection(
                                                            selectionInfo
                                                        )
                                                    } catch (e) {
                                                        console.warn(e)
                                                    }
                                                }}
                                            >
                                                {base_size}
                                            </sp-radio>
                                        )
                                    }
                                )}
                            </sp-radio-group>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <SpSlider
                                show-value="false"
                                id="slWidth"
                                min="1"
                                max="32"
                                value={store.data.width / 64}
                                // data-old_value="512"
                                onInput={(evt: any) => {
                                    onWidthSliderInput(evt.target.value * 64)
                                }}
                                onChange={(evt: any) => {
                                    store.data.width
                                    widthSliderOnChangeEventHandler(
                                        evt.target.value * 64,
                                        64,
                                        2048
                                    )
                                    helper_store.data.previous_width =
                                        store.data.width
                                }}
                            >
                                <sp-label slot="label" class="title">
                                    Width:
                                </sp-label>
                                <sp-label
                                    class="labelNumber"
                                    slot="label"
                                    id="lWidth"
                                >
                                    {parseInt(store.data.width as any)}
                                </sp-label>
                            </SpSlider>
                            <button
                                className="btnSquare linkSlider whiteChain"
                                id="linkWidthHeight"
                                title="maintain the ratio between width and height slider"
                                onClick={(evt: any) => {
                                    evt.target.classList.toggle('blackChain')
                                    const b_state =
                                        !evt.target.classList.contains(
                                            'blackChain'
                                        ) //if doesn't has blackChain means => it's white => b_state == true
                                    store.data.b_width_height_link = b_state
                                }}
                            ></button>
                            <SpSlider
                                show-value="false"
                                id="slHeight"
                                min="1"
                                max="32"
                                value={store.data.height / 64}
                                onInput={async (evt: any) => {
                                    onHeightSliderInput(evt.target.value * 64)
                                }}
                                onChange={(evt: any) => {
                                    heightSliderOnChangeEventHandler(
                                        evt.target.value * 64,
                                        64,
                                        2048
                                    )
                                }}
                            >
                                <sp-label slot="label" class="title">
                                    Height:
                                </sp-label>
                                <sp-label
                                    class="labelNumber"
                                    slot="label"
                                    id="lHeight"
                                >
                                    {parseInt(store.data.height as any)}
                                </sp-label>

                                <sp-label
                                    class={
                                        'res-increase ' +
                                        (store.data.ratio < 1
                                            ? 'res-decrease'
                                            : void 0)
                                    }
                                    id="res-difference"
                                    slot="label"
                                >
                                    {store.data.ratio < 1 ? '↓' : '↑'}
                                    {'x'}
                                    {(store.data.ratio < 1
                                        ? 1 / store.data.ratio
                                        : store.data.ratio
                                    ).toFixed(2)}
                                </sp-label>
                            </SpSlider>
                        </div>

                        <div style={{ display: 'flex' }}>
                            <SpSlider
                                title="larger value will put more emphasis on the prompt"
                                show-value="true"
                                id="slCfgScale"
                                min="1"
                                max="30"
                                value={store.data.cfg}
                                onInput={(evt: any) => {
                                    store.data.cfg = evt.target.value
                                }}
                            >
                                <sp-label slot="label" class="title">
                                    CFG Scale:
                                </sp-label>
                            </SpSlider>

                            <SpSlider
                                show-value="false"
                                id="slDenoisingStrength"
                                min="0"
                                max="100"
                                value={store.data.denoising_strength * 100}
                                style={{
                                    display: [
                                        ScriptMode.Img2Img,
                                        ScriptMode.Inpaint,
                                        ScriptMode.Outpaint,
                                    ].includes(store.data.rb_mode)
                                        ? void 0
                                        : 'none',
                                }}
                                onInput={(evt: any) => {
                                    store.data.denoising_strength =
                                        evt.target.value / 100
                                }}
                            >
                                <sp-label slot="label" class="title">
                                    Denoising Strength:
                                </sp-label>
                                <sp-label slot="label" id="lDenoisingStrength">
                                    {store.data.denoising_strength.toFixed(2)}
                                </sp-label>
                            </SpSlider>
                        </div>
                        <SpSlider
                            title="Pix2Pix CFG Scale (larger value will put more emphasis on the image)"
                            show-value="false"
                            id="slImageCfgScale"
                            min="0"
                            max="30"
                            value={general.mapRange(
                                store.data.image_cfg_scale,
                                0,
                                3,
                                0,
                                30
                            )}
                            style={{
                                display:
                                    [
                                        ScriptMode.Img2Img,
                                        ScriptMode.Inpaint,
                                    ].includes(store.data.rb_mode) &&
                                    settings_tab_ts.store.data
                                        .use_image_cfg_scale_slider
                                        ? void 0
                                        : 'none',
                            }}
                            onInput={(evt: any) => {
                                store.data.image_cfg_scale = general.mapRange(
                                    evt.target.value,
                                    0,
                                    30,
                                    0,
                                    3
                                )
                            }}
                        >
                            <sp-label slot="label" class="title">
                                Image CFG Scale:
                            </sp-label>
                            <sp-label slot="label" id="lImageCfgScale">
                                {store.data.image_cfg_scale}
                            </sp-label>
                        </SpSlider>

                        <SpSlider
                            show-value="true"
                            id="slMaskBlur"
                            min="0"
                            max="64"
                            value={store.data.mask_blur}
                            style={{
                                display: [
                                    ScriptMode.Inpaint,
                                    ScriptMode.Outpaint,
                                ].includes(store.data.rb_mode)
                                    ? void 0
                                    : 'none',
                            }}
                            disabled={
                                settings_tab_ts.store.data.use_sharp_mask
                                    ? true
                                    : void 0
                            }
                            onChange={async (evt: any) => {
                                const mask =
                                    session_store.data.preprocessed_mask
                                const iterations = store.data.mask_expansion
                                const mask_blur = parseInt(evt.target.value)
                                store.data.mask_blur = mask_blur
                                session_store.data.expanded_mask =
                                    await getExpandedMask(
                                        mask,
                                        iterations,
                                        mask_blur
                                    )
                                if (session_store.data.expanded_mask) {
                                    viewMaskExpansion()
                                }
                            }}
                        >
                            <sp-label slot="label">Mask Blur:</sp-label>
                        </SpSlider>
                        <SpSlider
                            show-value="true"
                            id="slMaskExpansion"
                            min="0"
                            max="256"
                            value={store.data.mask_expansion}
                            title="the larger the value the more the mask will expand, '0' means use precise masking, use in combination with the mask blur"
                            style={{
                                display: [
                                    ScriptMode.Inpaint,
                                    ScriptMode.Outpaint,
                                ].includes(store.data.rb_mode)
                                    ? void 0
                                    : 'none',
                            }}
                            onChange={async (evt: any) => {
                                const mask =
                                    session_store.data.preprocessed_mask
                                const iterations = parseInt(evt.target.value)
                                store.data.mask_expansion = iterations
                                const mask_blur = store.data.mask_blur
                                session_store.data.expanded_mask =
                                    await getExpandedMask(
                                        mask,
                                        iterations,
                                        mask_blur
                                    )
                                if (session_store.data.expanded_mask) {
                                    viewMaskExpansion()
                                }
                            }}
                        >
                            <sp-label slot="label">Mask Expansion:</sp-label>
                        </SpSlider>

                        <div style={{ display: 'flex' }}>
                            <SpSlider
                                show-value="false"
                                id="slInpaintingMaskWeight"
                                min="0"
                                max="100"
                                value={store.data.inpainting_mask_weight * 100}
                                title="0 will keep the composition; 1 will allow composition to change"
                                style={{
                                    display: [
                                        ScriptMode.Img2Img,
                                        ScriptMode.Inpaint,
                                        ScriptMode.Outpaint,
                                    ].includes(store.data.rb_mode)
                                        ? void 0
                                        : 'none',
                                }}
                                onInput={async (evt: any) => {
                                    store.data.inpainting_mask_weight =
                                        evt.target.value / 100
                                }}
                                onChange={async (evt: any) => {
                                    try {
                                        store.data.inpainting_mask_weight =
                                            evt.target.value / 100

                                        await setInpaintMaskWeight(
                                            store.data.inpainting_mask_weight
                                        )
                                    } catch (e) {
                                        console.warn(e)
                                    }
                                }}
                            >
                                <sp-label slot="label" class="title">
                                    Inpainting conditioning mask strength:
                                </sp-label>
                                <sp-label
                                    slot="label"
                                    id="lInpaintingMaskWeight"
                                >
                                    {store.data.inpainting_mask_weight}
                                </sp-label>
                            </SpSlider>
                        </div>

                        <div
                            id="slInpainting_fill"
                            style={{
                                display: [
                                    ScriptMode.Inpaint,
                                    ScriptMode.Outpaint,
                                ].includes(store.data.rb_mode)
                                    ? void 0
                                    : 'none',
                            }}
                        >
                            <sp-radio-group id="Inpainting_fill_group" class="">
                                <sp-label class="title" slot="label">
                                    Mask Content:
                                </sp-label>
                                {mask_content_config.map(
                                    (mask_content, index: number) => {
                                        return (
                                            <sp-radio
                                                key={index}
                                                class="rbMaskContent"
                                                checked={
                                                    store.data
                                                        .inpainting_fill ===
                                                    mask_content.value
                                                        ? true
                                                        : void 0
                                                }
                                                value={mask_content.value}
                                                onClick={(evt: any) => {
                                                    store.data.inpainting_fill =
                                                        mask_content.value
                                                }}
                                            >
                                                {mask_content.name}
                                            </sp-radio>
                                        )
                                    }
                                )}
                            </sp-radio-group>
                        </div>

                        <div style={{ display: 'flex' }}>
                            <SpCheckBox
                                class="checkbox"
                                id="chInpaintFullRes"
                                style={{
                                    display: [
                                        ScriptMode.Inpaint,
                                        ScriptMode.Outpaint,
                                    ].includes(store.data.rb_mode)
                                        ? 'inline-flex' //void 0
                                        : 'none',
                                }}
                                checked={store.data.inpaint_full_res}
                                onClick={(evt: any) => {
                                    store.data.inpaint_full_res =
                                        evt.target.checked
                                }}
                            >
                                Inpaint at Full Res
                            </SpCheckBox>
                            <SpCheckBox
                                class="checkbox"
                                id="chRestoreFaces"
                                checked={store.data.restore_faces}
                                onClick={(evt: any) => {
                                    store.data.restore_faces =
                                        evt.target.checked
                                }}
                            >
                                Restore Faces
                            </SpCheckBox>
                            <SpCheckBox
                                class="checkbox"
                                id="chHiResFixs"
                                style={{
                                    display: [ScriptMode.Txt2Img].includes(
                                        store.data.rb_mode
                                    )
                                        ? 'flex'
                                        : 'none',
                                }}
                                checked={store.data.enable_hr}
                                onClick={(evt: any) => {
                                    store.data.enable_hr = evt.target.checked
                                }}
                            >
                                Hi Res Fix
                            </SpCheckBox>
                            <SpCheckBox
                                class="checkbox"
                                id=""
                                checked={store.data.tiling}
                                onClick={(evt: any) => {
                                    store.data.tiling = evt.target.checked
                                }}
                            >
                                tiling
                            </SpCheckBox>
                        </div>
                        <div
                            id="HiResDiv"
                            style={{
                                display:
                                    [ScriptMode.Txt2Img].includes(
                                        store.data.rb_mode
                                    ) && store.data.enable_hr
                                        ? void 0
                                        : 'none',
                            }}
                        >
                            <div style={{ display: 'flex' }}>
                                <div>
                                    <sp-label
                                        id="lHiResUpscaler"
                                        style={{ marginBottom: '3px' }}
                                    >
                                        Upscaler:
                                    </sp-label>
                                    <SpMenu
                                        title="select an upscaler model"
                                        items={
                                            helper_store.data.hr_upscaler_list
                                        }
                                        label_item="Select an Upscaler"
                                        selected_index={helper_store.data.hr_upscaler_list.indexOf(
                                            store.data.hr_upscaler
                                        )}
                                        onChange={(id: any, value: any) => {
                                            store.data.hr_upscaler = value.item
                                        }}
                                    ></SpMenu>
                                </div>
                                <div>
                                    <sp-label id="HiResStep">
                                        Hi Res Steps:
                                    </sp-label>
                                    <SpTextfield
                                        id="hrNumberOfSteps"
                                        type="number"
                                        placeholder="0"
                                        value={store.data.hr_second_pass_steps}
                                        style={{
                                            marginTop: '3px',
                                            width: 'auto',
                                        }}
                                        onChange={(evt: any) => {
                                            store.data.hr_second_pass_steps =
                                                parseInt(evt.target.value)
                                        }}
                                    ></SpTextfield>
                                </div>
                            </div>
                            <div
                                id="hi-res-sliders-container"
                                style={{ display: 'flex' }}
                            >
                                <SpSlider
                                    show-value="false"
                                    id="hrScaleSlider"
                                    min="1"
                                    max="100"
                                    value="50"
                                    onInput={(evt: any) => {
                                        store.data.hr_scale = mapRange(
                                            evt.target.value,
                                            1,
                                            100,
                                            1,
                                            4,
                                            0.1
                                        )
                                    }}
                                >
                                    <sp-label slot="label" class="title">
                                        Hi Res Scale:
                                    </sp-label>
                                    <sp-label
                                        class="labelNumber"
                                        slot="label"
                                        id="hrScaleLabel"
                                    >
                                        {store.data.hr_scale.toFixed(2)}
                                    </sp-label>
                                    <sp-label
                                        class="labelNumber"
                                        slot="label"
                                        id="lHrScaleFromTo"
                                    >
                                        {scaleFromToLabel(
                                            store.data.width,
                                            store.data.height,
                                            store.data.hr_scale
                                        )}
                                    </sp-label>
                                </SpSlider>
                                <SpSlider
                                    show-value="false"
                                    id="hrDenoisingStrength"
                                    min="0"
                                    max="100"
                                    value={mapRange(
                                        store.data.hr_denoising_strength,
                                        0,
                                        1,
                                        0,
                                        100,
                                        1
                                    ).toFixed(2)}
                                    onInput={(evt: any) => {
                                        store.data.hr_denoising_strength =
                                            mapRange(
                                                evt.target.value,
                                                0,
                                                100,
                                                0,
                                                1,
                                                0.01
                                            )
                                    }}
                                >
                                    <sp-label slot="label" class="title">
                                        High Res Denoising Strength:
                                    </sp-label>
                                    <sp-label
                                        slot="label"
                                        id="hDenoisingStrength"
                                    >
                                        {store.data.hr_denoising_strength.toFixed(
                                            2
                                        )}
                                    </sp-label>
                                </SpSlider>

                                <SpSlider
                                    show-value="false"
                                    id="hrWidth"
                                    min="1"
                                    max="32"
                                    value={store.data.hr_resize_x / 64}
                                    style={{ display: 'none' }}
                                    onInput={(evt: any) => {
                                        store.data.hr_resize_x = Math.floor(
                                            evt.target.value * 64
                                        )
                                    }}
                                >
                                    <sp-label slot="label" class="title">
                                        Hi Res Output Width:
                                    </sp-label>
                                    <sp-label
                                        class="labelNumber"
                                        slot="label"
                                        id="hWidth"
                                    >
                                        {store.data.hr_resize_x}
                                    </sp-label>
                                </SpSlider>

                                <SpSlider
                                    show-value="false"
                                    id="hrHeight"
                                    min="1"
                                    max="32"
                                    value={store.data.hr_resize_y / 64}
                                    style={{ display: 'none' }}
                                    onInput={(evt: any) => {
                                        store.data.hr_resize_y = Math.floor(
                                            evt.target.value * 64
                                        )
                                    }}
                                >
                                    <sp-label slot="label">
                                        Hi Res Output Height:
                                    </sp-label>
                                    <sp-label
                                        class="labelNumber"
                                        slot="label"
                                        id="hHeight"
                                    >
                                        {store.data.hr_resize_y}
                                    </sp-label>
                                </SpSlider>
                            </div>
                        </div>
                        <SpSlider
                            show-value="false"
                            id="slInpaintPadding"
                            min="0"
                            max="64"
                            value={store.data.inpaint_full_res_padding}
                            style={{
                                display:
                                    [
                                        ScriptMode.Inpaint,
                                        ScriptMode.Outpaint,
                                    ].includes(store.data.rb_mode) &&
                                    store.data.inpaint_full_res
                                        ? void 0
                                        : 'none',
                            }}
                            onInput={(evt: any) => {
                                const padding = evt.target.value * 4
                                store.data.inpaint_full_res_padding = padding
                            }}
                        >
                            <sp-label slot="label" id="lNameInpaintPdding">
                                Inpaint Padding:
                            </sp-label>
                            <sp-label
                                class="labelNumber"
                                slot="label"
                                id="lInpaintPadding"
                            >
                                {store.data.inpaint_full_res_padding}
                            </sp-label>
                        </SpSlider>
                    </div>

                    <div>
                        <div style={{ display: 'flex' }}>
                            <sp-label id="sdLabelSeed">Seed:</sp-label>
                            <sp-textfield
                                id="tiSeed"
                                placeholder="Seed"
                                value={store.data.seed}
                                onInput={(evt: any) => {
                                    store.data.seed = evt.target.value
                                }}
                            ></sp-textfield>
                            <button
                                className="btnSquare"
                                id="btnRandomSeed"
                                style={{
                                    marginRight: '3px',
                                    marginLeft: '3px',
                                }}
                                onClick={(evt: any) => {
                                    store.data.seed = '-1'
                                }}
                            >
                                Random
                            </button>
                            <button
                                className="btnSquare"
                                id="btnLastSeed"
                                onClick={() => {
                                    store.data.seed =
                                        session_store.data.last_seed
                                }}
                            >
                                Last
                            </button>
                        </div>
                        <button
                            type="button"
                            id="collapsible"
                            onClick={(evt: any) => {
                                helper_store.data.b_show_sampler =
                                    !helper_store.data.b_show_sampler
                            }}
                        >
                            {helper_store.data.b_show_sampler ? 'Hide' : 'Show'}
                            {' Samplers'} ({store.data.sampler_name})
                        </button>
                        <sp-radio-group
                            id="sampler_group"
                            class="content"
                            selected={store.data.sampler_name}
                            style={{
                                display: helper_store.data.b_show_sampler
                                    ? 'block'
                                    : 'none',
                            }}
                        >
                            <sp-label slot="label">Select Sampler:</sp-label>
                            {helper_store.data.sampler_list.map(
                                (sampler: any, index: number) => {
                                    return (
                                        <sp-radio
                                            class="rbSampler"
                                            checked={
                                                sampler.name ===
                                                store.data.sampler_name
                                                    ? true
                                                    : void 0
                                            }
                                            value={sampler.name}
                                            key={index}
                                            onClick={(evt: any) => {
                                                store.data.sampler_name =
                                                    sampler.name
                                            }}
                                        >
                                            {sampler.name}
                                        </sp-radio>
                                    )
                                }
                            )}
                        </sp-radio-group>
                    </div>
                </div>
            </div>
        )
    }
}

const sdTabContainer = document.getElementById('sdTabContainer')!
const sdTabRoot = ReactDOM.createRoot(sdTabContainer)
sdTabRoot.render(
    //<React.StrictMode>
    <ErrorBoundary>
        {/* <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible
                    defaultIsOpen={true}
                    label={Locale('Stable Diffusion Tab')}
                >
                    <SDTab></SDTab>
                </Collapsible>
            </div> */}
        <SDTab></SDTab>
    </ErrorBoundary>
    //</React.StrictMode>
)
