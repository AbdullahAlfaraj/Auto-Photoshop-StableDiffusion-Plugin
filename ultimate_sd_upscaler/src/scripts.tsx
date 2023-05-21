import React, { ReactEventHandler, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { action, makeAutoObservable, reaction, toJS } from 'mobx'
import { Provider, inject, observer } from 'mobx-react'

import { SpMenu } from './elements'
import * as ultimate_sd_upscale_script from './ultimate_sd_upscaler'

export function toJsFunc(store: any) {
    return toJS(store)
}

class ScriptStore {
    scripts_list
    selected_script_name
    selected_store: any
    is_active: boolean
    selected_args_name: string[]
    scripts: any = {
        None: { store: null, args_names: [] },
        'Ultimate SD upscale': {
            store: ultimate_sd_upscale_script.ultimate_sd_upscaler_store,
            args_names: ultimate_sd_upscale_script.script_args_ordered,
        },
    }

    constructor() {
        this.scripts_list = ['None', ultimate_sd_upscale_script.script_name]
        this.selected_script_name = 'None'
        this.selected_store = null
        this.is_active = true
        this.selected_args_name = []
        makeAutoObservable(this)
    }
    setSelectedScript(name: string) {
        this.selected_script_name = name
        this.selected_store = this.scripts[name].store
        this.selected_args_name = this.scripts[name].args_names
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
}

export const script_store = new ScriptStore()
@observer
class ScriptComponent extends React.Component<{}> {
    render(): React.ReactNode {
        return (
            <>
                <SpMenu
                    title="Scripts"
                    items={script_store.scripts_list}
                    // style="width: 199px; margin-right: 5px"
                    label_item="Select A Script"
                    id={'script_list'}
                    onChange={(id: any, value: any) => {
                        script_store.setSelectedScript(value.item)
                    }}
                />
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
                                ultimate_sd_upscale_script.ultimate_sd_upscaler_store
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
        <ScriptComponent></ScriptComponent>

        {/* <SliderValuesDisplay /> */}
    </React.StrictMode>
)
