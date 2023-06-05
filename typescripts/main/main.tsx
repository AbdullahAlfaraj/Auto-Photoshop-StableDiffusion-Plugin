import React, { ReactEventHandler } from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore } from './astore'
import { SpMenu } from '../util/elements'

import { api, python_replacement } from '../util/oldSystem'
const { getExtensionUrl } = python_replacement
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
}

export const sd_store = new AStore(default_values)

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
    render(): React.ReactNode {
        return (
            <SpMenu
                title="vae models"
                items={sd_store.data.vae_model_list}
                // disabled={script_store.disabled}
                // style="width: 199px; margin-right: 5px"
                label_item="Select A VAE"
                // id={'model_list'}
                onChange={(id: any, value: any) => {
                    // script_store.setSelectedScript(value.item)
                    console.log('onChange value: ', value)
                    this.changeVAEModel(value.item)
                }}
            ></SpMenu>
        )
    }
}
const vaeContainerNode = document.getElementById('settingsVAEContainer')!
const vaeRoot = ReactDOM.createRoot(vaeContainerNode)

let vae_model_list = ['None']
declare let g_sd_url: string

async function populateVAE() {
    const extension_url = getExtensionUrl()

    const full_url = `${extension_url}/vae/list`

    const vae_models = await api.requestGet(full_url)
    console.log('populateVAE vae_models: ', vae_models)
    // vae_model_list = vae_models
    sd_store.updateProperty('vae_model_list', vae_models)
}
populateVAE()

vaeRoot.render(
    <React.StrictMode>
        <VAEComponent></VAEComponent>
    </React.StrictMode>
)
