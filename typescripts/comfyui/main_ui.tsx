import txt2img from './txt2img_workflow_v0.0.2.json'
import txt2img_api from './txt2img_api_v0.0.2.json'

import vae_settings from '../settings/vae'
import sd_tab_util from '../sd_tab/util'
import comfyui_util from './util'
import util from './util'
import { store } from './util'

import { base64UrlToBase64, copyJson } from '../util/ts/general'
// Function to parse metadata from a title string
function parseMetadata(title: string) {
    if (!title) return {}
    // Split the title into parts using the "|" character and trim whitespace from each part

    var parts = title.split('|').map((part) => part.trim())
    // Take the last part as the metadata
    var metadataPart = parts[parts.length - 1]
    // Initialize an empty object to store the key-value pairs
    var result: Record<string, string> = {}
    // If there is more than one part, there is metadata to parse
    if (parts.length > 1) {
        // Split the metadata into pairs using the "," character and trim whitespace from each pair
        var pairs = metadataPart.split(',').map((pair) => pair.trim())

        // For each pair...
        for (var i = 0; i < pairs.length; i++) {
            // If the pair includes a ":" character, it is a key-value pair
            if (pairs[i].includes(':')) {
                // Split the pair into a key and a value using the ":" character and trim whitespace
                var pair = pairs[i].split(':').map((part) => part.trim())

                // Add the key-value pair to the result object
                result[pair[0]] = pair[1]
            }
        }
    }

    // Return the result object containing the key-value pairs
    return result
}

// Example usage:
var title = 'original title | key1:value1, key2:value2'
console.log(parseMetadata(title)) // Output: {key1: 'value1', key2: 'value2'}

const nodes = txt2img.nodes
function getInput(node: any, name: string) {
    const input = node.inputs.filter((input: any) => {
        return input?.widget?.name === name
    })?.[0]
    return input
}
function getNode(nodes: any[], node_id: string) {
    const node = nodes.filter((node: any) => {
        return parseInt(node.id) === parseInt(node_id)
    })?.[0]
    return node
}
function getNodeByNameId(nodes: any[], node_name_id: string) {
    const node = nodes.filter((node: any) => {
        const node_metadata = parseMetadata(node.title)
        return node_metadata.id === node_name_id
    })?.[0]
    return node
}

function getPromptNodeByNameId(
    nodes: any[], //nodes from workflow.json
    prompt: any, //prompt from api.json
    node_name_id: string // name_id I'm using to get access to nodes by their name
) {
    const node = getNodeByNameId(nodes, node_name_id)
    const prompt_node = node?.id ? prompt[node.id] : {}

    return prompt_node
}
function setInputValue(
    nodes: any[],
    prompt: any,
    node_name_id: string,
    input_name: string,
    new_value: any
) {
    const prompt_node = getPromptNodeByNameId(nodes, prompt, node_name_id)
    prompt_node.inputs[input_name] = new_value
}
function getLink(links: any[], link_id: number) {
    return links.filter((link: any) => {
        return link[0] === link_id
    })?.[0]
}

function getNodesFromLink(link: any) {
    return {
        from_node: { id: link[1], input_index: link[2] },
        to_node: { id: link[3], input_index: link[4] },
    }
}

const txt2img_map: Record<string, any> = {
    model: 'checkpoint.ckpt_name',
    vae: 'vae.vae_name',
    width: 'latent_image.width',
    height: 'latent_image.height',
    batch_size: 'latent_image.batch_size',
    prompt: 'positive_prompt.text',
    negative_prompt: 'negative_prompt.text',

    //sampler node

    seed: 'sampler.seed',
    steps: 'sampler.steps',
    cfg: 'sampler.cfg',
    sampler_index: 'sampler.sampler_name',
    // scheduler: 'normal',
    // denoise: 'sampler.denoise', // keep it at default value 1.0

    //hires_node node:
    hr_scale: 'scaler.scale_by',
    upscale_method: 'nearest_exact',

    hr_seed: 'hires_sampler.seed',
    hr_second_pass_steps: 'hires_sampler.steps',
    // hr_cfg: 'hires_sampler.cfg', // keep at default value 0.5
    // hr_sampler_name: 'hires_sampler.sampler_name',
    // hr_scheduler: 'normal',
    hr_denoising_strength: 'hires_sampler.denoise',
}

function addMissingSettings(plugin_settings: Record<string, any>) {
    plugin_settings['vae'] = vae_settings.store.data.current_vae
    plugin_settings['model'] = sd_tab_util.store.data.selected_model
    plugin_settings['hr_denoising_strength'] =
        sd_tab_util.store.data.hr_denoising_strength
    plugin_settings['hr_sampler_name'] = sd_tab_util.store.data.sampler_name // use the same sampler for the first and second pass (hires) upscale sampling steps

    //calculate positive random seed if seed is -1
    const random_seed: bigint = util.getRandomBigIntApprox(
        0n,
        18446744073709552000n
    )

    plugin_settings['seed'] =
        parseInt(plugin_settings['seed']) === -1
            ? random_seed.toString()
            : plugin_settings['seed'] // use the same as the main seed

    plugin_settings['hr_seed'] = plugin_settings['seed']

    return plugin_settings
}
function mapPluginSettingsToComfyuiPrompt(
    nodes: any[],
    prompt: any,
    plugin_settings: any
) {
    // const plugin_param = 'steps'
    plugin_settings = addMissingSettings(plugin_settings)
    function mapPluginInputToComfyInput(plugin_param: string) {
        if (plugin_settings[plugin_param]) {
            const [node_name_id, input_name] =
                txt2img_map[plugin_param].split('.')
            setInputValue(
                nodes,
                prompt,
                node_name_id,
                input_name,
                plugin_settings[plugin_param]
            )
        }
    }
    Object.keys(txt2img_map).map((plugin_parm: string) => {
        mapPluginInputToComfyInput(plugin_parm)
    })

    return prompt
}

// comfyui_util.postPromptAndGetBase64JsonResult(
//     comfyui_util.store.data.comfy_server,
//     prompt
// )

// const plugin_settings: Record<string, any> = {}
// const prompt = txt2img_api
// const node_name_id = 'sampler'
// const node = getNodeByNameId(txt2img.nodes, node_name_id)
// console.log('node: ', node)
// prompt[3].inputs.steps = plugin_settings.steps
// setInputValue(txt2img.nodes, prompt, 'sampler', 'seed', 3)

async function generateComfyTxt2img(
    plugin_settings: any
): Promise<{ image_base64_list: string[]; image_url_list: string[] }> {
    // Your function implementation goes here
    const prompt = mapPluginSettingsToComfyuiPrompt(
        txt2img.nodes,
        txt2img_api,
        plugin_settings
    )
    const final_prompt = copyJson(prompt)
    if (!plugin_settings['enable_hr']) {
        //get node_id
        const hire_output_node = getNodeByNameId(txt2img.nodes, 'hires_output')

        delete final_prompt[hire_output_node.id]
    }
    const outputs = await comfyui_util.postPromptAndGetBase64JsonResult(
        store.data.comfy_server,
        final_prompt
    )
    let image_url_list: string[] = []
    let image_base64_list: string[] = []
    if (outputs) {
        image_url_list = Object.values(outputs).flat()
        image_base64_list = image_url_list.map((image_url) => {
            return base64UrlToBase64(image_url)
        })
    }
    return { image_base64_list, image_url_list }
}

export default {
    parseMetadata,
    getNode,
    getInput,
    getLink,
    getNodesFromLink,
    getNodeByNameId,
    mapPluginSettingsToComfyuiPrompt,
    getPromptNodeByNameId,
    setInputValue,
    addMissingSettings,
    generateComfyTxt2img,
    txt2img,
    txt2img_api,
}
