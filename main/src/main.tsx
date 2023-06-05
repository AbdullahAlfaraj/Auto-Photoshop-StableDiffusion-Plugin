import React, { ReactEventHandler } from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore } from './astore'
import { SpMenu } from '../../ultimate_sd_upscaler/src/elements'

import { getExtensionUrl } from '../../utility/sdapi/python_replacement'
import * as api from '../../utility/api'
declare let g_sd_url: string
// class SDStore extends AStore {
//     constructor(data: any) {
//         super(data)
//     }
// }

// const configValues = Object.entries(ui_config).reduce(
//     (acc, [key, value]) => ({ ...acc, [key]: value.value }),
//     {}
// )
// const default_values: any = {
//     _: '',
//     ...configValues,
// }

const default_values: any = {
    vae_model_list: [],
    current_vae: '',
}

export const store = new AStore(default_values)

@observer
export class VAEComponent extends React.Component<{
    // store: AStore
}> {
    componentDidMount(): void {}
    changeVAEModel(vae_model: string) {
        try {
            const full_url = `${g_sd_url}/sdapi/v1/options`
            api.requestPost(full_url, { sd_vae: vae_model })
        } catch (e) {
            console.warn('changeVAEModel: vae_model: ', vae_model, e)
        }
    }
    handleRefresh() {
        populateVAE()
    }
    render(): React.ReactNode {
        return (
            <div style={{ display: 'flex' }}>
                <SpMenu
                    title="vae models"
                    items={store.data.vae_model_list}
                    // disabled={script_store.disabled}
                    // style="width: 199px; margin-right: 5px"
                    label_item="Select A VAE"
                    // id={'model_list'}
                    selected_index={store.data.vae_model_list.indexOf(
                        store.data.current_vae
                    )}
                    onChange={(id: any, value: any) => {
                        // script_store.setSelectedScript(value.item)
                        console.log('onChange value: ', value)
                        this.changeVAEModel(value.item)
                    }}
                ></SpMenu>
                <button
                    className="btnSquare refreshButton"
                    title="Refresh VAE Models List"
                    onClick={this.handleRefresh}
                ></button>
            </div>
        )
    }
}
const vaeContainerNode = document.getElementById('settingsVAEContainer')!
const vaeRoot = ReactDOM.createRoot(vaeContainerNode)

// let vae_model_list = ['None']

async function requestGetVAE() {
    const full_url = `${g_sd_url}/sdapi/v1/options`

    const options = await api.requestGet(full_url)
    return options?.sd_vae
}
export async function populateVAE() {
    const extension_url = getExtensionUrl()

    const full_url = `${extension_url}/vae/list`
    const vae_models = await api.requestGet(full_url)

    console.log('populateVAE vae_models: ', vae_models)
    store.updateProperty('vae_model_list', vae_models)

    const current_vae = await requestGetVAE()
    if (current_vae && vae_models.includes(current_vae)) {
        store.updateProperty('current_vae', current_vae)
    }
}
// populateVAE()

vaeRoot.render(
    <React.StrictMode>
        <VAEComponent></VAEComponent>
    </React.StrictMode>
)
