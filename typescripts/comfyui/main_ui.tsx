import txt2img from './txt2img_workflow_v0.0.6.json'
import txt2img_api from './txt2img_api_v0.0.6.json'

import img2img from './img2img_workflow_v0.0.6.json'
import img2img_api from './img2img_api_v0.0.6.json'

import inpaint from './inpaint_workflow.json'
import inpaint_api from './inpaint_api.json'

import vae_settings from '../settings/vae'
import sd_tab_util from '../sd_tab/util'
import comfyui_util from './util'
import util from './util'
import { store } from './util'

import { base64UrlToBase64, copyJson } from '../util/ts/general'
import { session_store } from '../stores'
import ControlNetStore from '../controlnet/store'
import { setControlDetectMapSrc } from '../controlnet/entry'

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
    try {
        var prompt_node = getPromptNodeByNameId(nodes, prompt, node_name_id)
        prompt_node.inputs[input_name] = new_value
    } catch (e) {
        console.error(
            `Node Name ID:\n${node_name_id}\n` +
                `Input Name:\n${input_name}\n` +
                `New Value:\n${new_value}\n` +
                `Prompt Node:\n${prompt_node}\n` +
                `Error:\n${e}`
        )
    }
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
function mutePromptNode(nodes: any[], prompt: any, node_name_id: string) {
    const node = getNodeByNameId(nodes, node_name_id)
    delete prompt[node.id]
    return prompt
}
const txt2img_map: Record<string, any> = {
    model: 'checkpoint.ckpt_name',
    vae: 'vae.vae_name',
    width: 'latent_image.width',
    height: 'latent_image.height',
    batch_size: 'latent_image.batch_size',
    prompt: 'multi_loras_positive_prompt.prompt',
    negative_prompt: 'multi_loras_negative_prompt.prompt',

    //sampler node

    seed: 'sampler.seed',
    steps: 'sampler.steps',
    cfg: 'sampler.cfg',
    sampler_index: 'sampler.sampler_name',
    // scheduler: 'normal',
    // denoising_strength: 'sampler.denoise', // keep it at default value 1.0

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
const controlnet_txt2img_map: Record<string, any> = {
    comfy_input_image: 'controlnet_script.image', //map controlnet_units[unit_index].input_image from base64 string to comfy image filename
    comfy_mask: 'controlnet_script.mask', //map controlnet_units[unit_index].mask from base64 string to comfy image filename
    comfy_enabled: 'controlnet_script.is_enabled', //map controlnet_units[unit_index].enabled from boolean [true,false] to ['enable', 'disable']
    module: 'controlnet_script.preprocessor_name',
    model: 'controlnet_script.control_net_name',
    weight: 'controlnet_script.strength',
    guidance_start: 'controlnet_script.start_percent',
    guidance_end: 'controlnet_script.end_percent',
    processor_res: 'controlnet_script.resolution',
    // "threshold_a": 0,
    // "threshold_b": 0,
}
const img2img_map: Record<string, any> = {
    init_image: 'init_image.image', // note: this is not init_images but init_image
    model: 'checkpoint.ckpt_name',
    vae: 'vae.vae_name',
    width: 'init_image_scale.width',
    height: 'init_image_scale.height',
    batch_size: 'latent_batch.amount',
    // prompt: 'positive_prompt.text',
    prompt: 'multi_loras_positive_prompt.prompt',
    negative_prompt: 'multi_loras_negative_prompt.prompt',

    //sampler node

    seed: 'sampler.seed',
    steps: 'sampler.steps',
    cfg: 'sampler.cfg',
    sampler_index: 'sampler.sampler_name',
    // scheduler: 'normal',
    denoising_strength: 'sampler.denoise',

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
const inpaint_map: Record<string, any> = {
    init_image: 'init_image.image', // note: this is not init_images but init_image
    comfy_mask: 'mask_image.image',

    model: 'checkpoint.ckpt_name',
    vae: 'vae.vae_name',
    width: 'width.Value',
    height: 'height.Value',
    batch_size: 'latent_batch.amount',
    // prompt: 'positive_prompt.text',
    prompt: 'multi_loras_positive_prompt.prompt',
    negative_prompt: 'multi_loras_negative_prompt.prompt',

    comfy_content_mask: 'content_mask_latent.content_mask',

    //sampler node

    seed: 'first_pass_seed.seed',
    steps: 'sampler.steps',
    cfg: 'sampler.cfg',
    sampler_index: 'sampler.sampler_name',
    // scheduler: 'normal',
    denoising_strength: 'sampler.denoise',

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
async function reuseOrUploadComfyImage(
    base64: string,
    all_uploaded_images: Record<string, any>
) {
    let image_name: string = ''
    if (all_uploaded_images[base64]) {
        image_name = all_uploaded_images[base64]
    } else {
        const new_loaded_image = await util.uploadImage(false, base64)
        console.log('new_loaded_image: ', new_loaded_image)
        if (new_loaded_image) {
            store.data.uploaded_images_list = [
                ...store.data.uploaded_images_list,
                new_loaded_image.name,
            ]
            image_name = new_loaded_image.name
            all_uploaded_images[base64] = new_loaded_image.name
        }
    }
    return image_name
}
async function addMissingSettings(plugin_settings: Record<string, any>) {
    plugin_settings['vae'] = vae_settings.store.data.current_vae
    plugin_settings['model'] = sd_tab_util.store.data.selected_model
    plugin_settings['hr_denoising_strength'] =
        sd_tab_util.store.data.hr_denoising_strength
    plugin_settings['hr_sampler_name'] = sd_tab_util.store.data.sampler_name // use the same sampler for the first and second pass (hires) upscale sampling steps
    if ('init_images' in plugin_settings) {
        const base64 = plugin_settings['init_images'][0]

        plugin_settings['init_image'] = await reuseOrUploadComfyImage(
            base64,
            store.data.base64_to_uploaded_images_names
        )
    }
    if ('mask' in plugin_settings) {
        const base64 = plugin_settings['mask']

        plugin_settings['comfy_mask'] = await reuseOrUploadComfyImage(
            base64,
            store.data.base64_to_uploaded_images_names
        )
    }

    //calculate positive random seed if seed is -1
    const random_seed: bigint = util.getRandomBigIntApprox(
        0n,
        18446744073709552000n
    )

    plugin_settings['seed'] =
        parseInt(plugin_settings['seed']) === -1
            ? random_seed.toString()
            : plugin_settings['seed'] // use the same as the main seed

    session_store.data.last_seed = plugin_settings['seed']
    plugin_settings['hr_seed'] = plugin_settings['seed']

    return plugin_settings
}

async function addMissingControlnetSettings(
    plugin_settings: Record<string, any>
) {
    plugin_settings['disableControlNetTab'] =
        ControlNetStore.disableControlNetTab
    for (const unit of plugin_settings['controlnet_units']) {
        unit['comfy_enabled'] =
            !plugin_settings['disableControlNetTab'] && unit.enabled
                ? 'enable'
                : 'disable'

        unit['comfy_input_image'] = ''
        unit['comfy_mask'] = ''
        if ('input_image' in unit && unit['input_image'] !== '') {
            const base64 = unit['input_image']
            unit['comfy_input_image'] = await reuseOrUploadComfyImage(
                base64,
                store.data.base64_to_uploaded_images_names
            )
        }
        if ('mask' in unit && unit['mask'] !== '') {
            //if mask have been set manually
            const base64 = unit['mask']

            unit['comfy_mask'] = await reuseOrUploadComfyImage(
                base64,
                store.data.base64_to_uploaded_images_names
            )
        } else if ('comfy_mask' in plugin_settings) {
            // use the mask from the main ui (inpaint and outpaint mode)

            unit['comfy_mask'] = plugin_settings['comfy_mask']
        }

        //set model and module to 'None' if no item has been selection, so comfyui won't through an error
        unit['model'] = unit['model'] === '' ? 'None' : unit['model']
        unit['module'] = unit['module'] === '' ? 'None' : unit['module']
    }
    return plugin_settings
}
async function mapPluginSettingsToComfyuiPrompt(
    nodes: any[],
    prompt: any,
    plugin_settings: any,
    mode_map: any
) {
    try {
        // const plugin_param = 'steps'
        plugin_settings = await addMissingSettings(plugin_settings)
        function mapPluginInputToComfyInput(
            plugin_settings: Record<string, any>,
            plugin_param: string,
            node_name_id: string,
            input_name: string
        ) {
            if (plugin_param in plugin_settings) {
                setInputValue(
                    nodes,
                    prompt,
                    node_name_id,
                    input_name,
                    plugin_settings[plugin_param]
                )
            }
        }

        Object.keys(mode_map).forEach((plugin_param: string) => {
            const [node_name_id, input_name] = mode_map[plugin_param].split('.')
            mapPluginInputToComfyInput(
                plugin_settings,
                plugin_param,
                node_name_id,
                input_name
            )
        })

        plugin_settings = await addMissingControlnetSettings(plugin_settings)
        for (let i = 0; i < 3; ++i) {
            const unit = plugin_settings['controlnet_units'][i]
            // one for each controlnet unit
            Object.keys(controlnet_txt2img_map).forEach(
                (plugin_param: string) => {
                    let [node_name_id, input_name] =
                        controlnet_txt2img_map[plugin_param].split('.')
                    // if (
                    //     node_name_id === 'controlnet_image' ||
                    //     node_name_id === 'controlnet_mask'
                    // ) {
                    //     // the input images and masks are each in separate nodes
                    //     node_name_id = `${node_name_id}_${i + 1}` //ex: 'controlnet_image.image' -> controlnet_image_1.image
                    // } else {
                    //     //all other inputs present in the controlnet script
                    //     input_name = `${input_name}_${i + 1}` //ex: preprocessor_name -> preprocessor_name_1
                    // }
                    input_name = `${input_name}_${i + 1}` //ex: preprocessor_name -> preprocessor_name_1

                    mapPluginInputToComfyInput(
                        unit,
                        plugin_param,
                        node_name_id,
                        input_name
                    )
                }
            )
        }
    } catch (e) {
        console.error(e)
    }
    return prompt
}

async function generateComfyMode(
    nodes: any[],
    api_prompt: Record<string, any>,
    plugin_settings: Record<string, any>,
    mode_map: Record<string, string>
): Promise<{ image_base64_list: string[]; image_url_list: string[] }> {
    let image_url_list: string[] = []
    let image_base64_list: string[] = []
    try {
        // const controlnet_settings =
        //     mapPluginSettingsToControlNet(plugin_settings)

        // console.log('controlnet_settings:', controlnet_settings)
        const prompt = await mapPluginSettingsToComfyuiPrompt(
            nodes,
            copyJson(api_prompt),
            plugin_settings,
            mode_map
        )
        const final_prompt = copyJson(prompt)
        if (!plugin_settings['enable_hr']) {
            //get node_id
            const hire_output_node = getNodeByNameId(nodes, 'hires_output')

            delete final_prompt[hire_output_node.id]
        }

        const separated_output_node_ids: string[] = []
        const node_id_to_controlnet_unit_index: Record<string, number> = {}
        for (const [index, unit] of plugin_settings[
            'controlnet_units'
        ].entries()) {
            const node_name_id = `preprocessor_output_${index + 1}`
            const node = getNodeByNameId(nodes, node_name_id)
            const node_id = node.id.toString()
            node_id_to_controlnet_unit_index[node_id] = index

            if (unit['comfy_enabled'] === 'disable') {
                mutePromptNode(nodes, final_prompt, node_name_id)
            } else if (unit['comfy_enabled'] === 'enable') {
                separated_output_node_ids.push(node_id)
            }
        }
        // for (let i = 0; i < 3; ++i) {
        //     const unit = plugin_settings['controlnet_units'][i]
        //     if (unit['input_image'] === '') {
        //         mutePromptNode(nodes, final_prompt, `controlnet_image_${i + 1}`)
        //     }
        //     if (unit['mask'] === '') {
        //         mutePromptNode(nodes, final_prompt, `controlnet_mask_${i + 1}`)
        //     }
        // }
        console.log('final_prompt: ', final_prompt)
        const { outputs, separated_outputs } =
            await comfyui_util.postPromptAndGetBase64JsonResult(
                final_prompt,
                separated_output_node_ids
            )

        if (outputs) {
            image_url_list = Object.values(outputs).flat()
            image_base64_list = image_url_list.map((image_url) => {
                return base64UrlToBase64(image_url)
            })
        }
        if (separated_outputs) {
            Object.entries(separated_outputs).forEach(([node_id, images]) => {
                const controlnet_unit_index =
                    node_id_to_controlnet_unit_index[node_id]
                setControlDetectMapSrc(
                    base64UrlToBase64(images[0]),
                    controlnet_unit_index
                )
            })
        }
    } catch (e) {
        console.error(e)
    }
    return { image_base64_list, image_url_list }
}
async function generateComfyTxt2Img(
    plugin_settings: any
): Promise<{ image_base64_list: string[]; image_url_list: string[] }> {
    return generateComfyMode(
        txt2img.nodes,
        txt2img_api,
        plugin_settings,
        txt2img_map
    )
}
async function generateComfyImg2Img(
    plugin_settings: any
): Promise<{ image_base64_list: string[]; image_url_list: string[] }> {
    return generateComfyMode(
        img2img.nodes,
        img2img_api,
        plugin_settings,
        img2img_map
    )
}
async function generateComfyInpaint(
    plugin_settings: any
): Promise<{ image_base64_list: string[]; image_url_list: string[] }> {
    if ('inpainting_fill' in plugin_settings) {
        const index = plugin_settings['inpainting_fill']
        const content_mask_option = [
            'fill',
            'original',
            'latent_noise',
            'latent_nothing',
        ]
        plugin_settings['comfy_content_mask'] = content_mask_option[index]

        // const content_mask = [
        //     ['fill', ''],
        //     ['original', 'content_mask_original_output'],
        //     ['latent_noise', 'content_mask_latent_noise_output'],
        //     ['latent_nothing', 'content_mask_latent_nothing_output'],
        // ]

        // const comfy_node_name_id = content_mask[index][1]
        // const content_mask_node = getNodeByNameId(
        //     inpaint.nodes,
        //     comfy_node_name_id
        // )

        // if (index > 0 && index <= 3 && content_mask_node) {
        //     plugin_settings['comfy_content_mask'] = [
        //         content_mask_node.id.toString(),
        //         0,
        //     ]
        // }
    }
    return generateComfyMode(
        inpaint.nodes,
        inpaint_api,
        plugin_settings,
        inpaint_map
    )
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
    generateComfyTxt2Img,
    generateComfyImg2Img,
    generateComfyInpaint,
    txt2img,
    txt2img_api,
    img2img,
    img2img_api,
    inpaint,
    inpaint_api,
}
