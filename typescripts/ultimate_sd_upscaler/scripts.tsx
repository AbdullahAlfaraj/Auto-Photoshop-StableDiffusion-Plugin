import React from 'react'
import ReactDOM from 'react-dom/client'

import { makeAutoObservable, toJS } from 'mobx'
import { observer } from 'mobx-react'

import { SpMenu } from './elements'
import * as ultimate_sd_upscale_script from './ultimate_sd_upscaler'
import { ScriptMode } from './ultimate_sd_upscaler'
export function toJsFunc(store: any) {
    return toJS(store)
}

class ScriptStore {
    scripts_list
    disabled: boolean[]
    selected_script_name
    is_selected_script_available: boolean
    selected_store: any
    is_active: boolean
    selected_args_name: string[]
    mode: ScriptMode

    scripts: any = {
        None: { store: null, args_names: [], mode: [] },
        'ultimate sd upscale': {
            store: ultimate_sd_upscale_script.ultimate_sd_upscaler_store,
            args_names: ultimate_sd_upscale_script.script_args_ordered,
            mode: ultimate_sd_upscale_script.script_mode,
        },
    }

    constructor() {
        this.scripts_list = ['None', ultimate_sd_upscale_script.script_name]
        this.disabled = [false, true]
        this.selected_script_name = 'None'
        this.is_selected_script_available = true
        this.selected_store = null
        this.is_active = true
        this.selected_args_name = []
        this.mode = ScriptMode.Txt2Img

        makeAutoObservable(this)
    }
    setSelectedScript(name: string) {
        this.selected_script_name = name
        this.selected_store = this.scripts[name].store
        this.selected_args_name = this.scripts[name].args_names
        this.is_selected_script_available = true
    }
    setIsActive(new_value: boolean) {
        this.is_active = new_value
    }
    updateProperty(id: any, value: any) {}

    orderedValues() {
        const values: any = []
        if (!this.selected_store) return values

        for (const key of this.selected_args_name) {
            // console.log(key, this.data[key])
            values.push((this.selected_store.data as any)[key])
        }
        return values
    }
    setDisabled(newDisabled: boolean[]) {
        console.log('this.disabled:', this.disabled)
        console.log('newDisabled:', newDisabled)

        this.disabled = newDisabled
    }
    setMode(newMode: ScriptMode) {
        this.mode = newMode

        // let index = 0
        // Object.keys(this.scripts).forEach((key, index) => {
        //     const script = this.scripts[key]
        //     this.disabled[index] = script.mode.includes(newMode) ? false : true

        //     // console.log(key, script)
        // })
        const names = Object.keys(this.scripts)
        let index = 0
        for (let name of names) {
            const script = this.scripts[name]
            this.disabled[index] = script.mode.includes(newMode) ? false : true
            index += 1
        }

        this.disabled[0] = false // None is always enabled
        const selected_index = this.scripts_list.indexOf(
            this.selected_script_name
        )
        this.is_selected_script_available = !this.disabled?.[selected_index]
        this.setDisabled([...this.disabled])
    }
    isInstalled() {
        return this.selected_store?.isInstalled() ?? false
    }
}

export const script_store = new ScriptStore()

@observer
class ScriptComponent extends React.Component<{}> {
    render(): React.ReactNode {
        // const script_message = index !== -1 ? script_store.disabled[index] : undefined;
        const script_message =
            script_store.is_selected_script_available ? undefined : (
                <span style={{ color: '#ff595e' }}>
                    {'the script is not available in the current Mode'}
                </span>
            )

        return (
            <>
                <SpMenu
                    title="Scripts"
                    items={script_store.scripts_list}
                    disabled={script_store.disabled}
                    // style="width: 199px; margin-right: 5px"
                    label_item="Select A Script"
                    id={'script_list'}
                    onChange={(id: any, value: any) => {
                        script_store.setSelectedScript(value.item)
                    }}
                />
                <div>
                    {script_message}

                    {/* {script_store.disabled.map((value, index) => (
                        <li key={index}> {value ? 'true' : 'false'}</li>
                    ))} */}
                </div>
                <sp-checkbox
                    checked={script_store.is_active ? true : undefined}
                    onClick={(event: React.ChangeEvent<HTMLInputElement>) => {
                        script_store.setIsActive(event.target.checked)
                    }}
                >
                    {'Activate'}
                </sp-checkbox>
                <>
                    {script_store.selected_script_name === 'None' && <></>}
                    {script_store.selected_script_name ===
                        ultimate_sd_upscale_script.script_name && (
                        <ultimate_sd_upscale_script.UltimateSDUpscalerForm
                            store={
                                // ultimate_sd_upscale_script.ultimate_sd_upscaler_store
                                script_store.scripts[
                                    script_store.selected_script_name
                                ].store
                            }
                        />
                    )}
                    {/* ... other conditions for other components */}
                </>
            </>
        )
    }
}
const domNode = document.getElementById('scriptsContainer')!
const root = ReactDOM.createRoot(domNode)

root.render(
    <React.StrictMode>
        <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
            <ScriptComponent></ScriptComponent>
        </div>

        {/* <SliderValuesDisplay /> */}
    </React.StrictMode>
)
