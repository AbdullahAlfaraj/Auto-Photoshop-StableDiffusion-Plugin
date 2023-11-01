import { diffusion_chain } from '../entry'
import { ComfyPrompt } from 'diffusion-chain/dist/backends/comfyui-api.mjs'
// import { ComfyPrompt } from 'diffusion-chain/dist/backends/comfyui-api.mjs'
// import { ComfyPrompt } from 'diffusion-chain/'

import { readdirSync, readFileSync } from 'fs'

let workflows2: Record<string, any> = {}

// Assuming the json files are in a directory named 'native_workflows'
const dir = 'plugin:/typescripts/comfyui/native_workflows' // specify the directory containing the .json files

readdirSync(dir).forEach((file) => {
    if (file.endsWith('.json')) {
        const fileContent = readFileSync(`${dir}/${file}`, 'utf8')
        const fileNameWithoutExtension = file.slice(0, -5)
        workflows2[fileNameWithoutExtension] = JSON.parse(fileContent)
    }
})
export function getWorkflow() {}

interface Workflow {}
export function getNodes(workflow: Workflow) {
    // Object.values(workflow).forEach((node) => {
    //     console.log(node.class_type)
    // })
    return Object.entries(workflow)
}

export enum ComfyInputType {
    TextField = 'TextField',
    TextArea = 'TextArea',
    Menu = 'Menu',
    Number = 'Number',
    Slider = 'Slider',
    BigNumber = 'BigNumber',
    TextFieldNumber = 'TextFieldNumber',
    Skip = 'Skip',
    Seed = 'Seed',
    CheckBox = 'CheckBox',
}
export enum ComfyNodeType {
    LoadImage = 'LoadImage',
    Normal = 'Normal',
    Skip = 'Skip',
}

interface ComfyOutputImage {
    filename: string
    subfolder: string
    type: string
}

export function getNodeType(node_name: any) {
    let node_type: ComfyNodeType = ComfyNodeType.Normal
    switch (node_name) {
        case 'LoadImage':
            node_type = ComfyNodeType.LoadImage
            break
        default:
            break
    }
    return node_type
}
export function parseComfyInput(
    name: string,
    input_info: any,
    prompt_value: any // the default value, set in the prompt api
): {
    type: ComfyInputType
    config: any
} {
    const value = input_info[0]

    let input_type: ComfyInputType = ComfyInputType.Skip
    let input_config

    if (name === 'seed' && !Array.isArray(prompt_value)) {
        input_type = ComfyInputType.Seed // similar to big number
        input_config = input_info[1]
    } else if (typeof value === 'string') {
        if (value === 'FLOAT' && !Array.isArray(prompt_value)) {
            input_type = ComfyInputType.Slider
            input_config = input_info[1]
        } else if (value === 'INT' && !Array.isArray(prompt_value)) {
            if (input_info[1].max > Number.MAX_SAFE_INTEGER) {
                input_type = ComfyInputType.BigNumber
                input_config = input_info[1]
            } else {
                input_type = ComfyInputType.TextFieldNumber
                input_config = input_info[1]
            }
        } else if (value === 'STRING' && !Array.isArray(prompt_value)) {
            if (input_info[1]?.multiline) {
                input_type = ComfyInputType.TextArea
                input_config = input_info[1]
            } else {
                input_type = ComfyInputType.TextField
                input_config = input_info[1]
            }
        } else if (value === 'BOOLEAN' && !Array.isArray(prompt_value)) {
            input_type = ComfyInputType.CheckBox
            input_config = input_info[1]
        }
    } else if (Array.isArray(value)) {
        input_type = ComfyInputType.Menu
        input_config = value
    }

    return { type: input_type, config: input_config }
}

export function makeHtmlInput() {}

async function getHistory(comfy_server: diffusion_chain.ComfyServer) {
    while (true) {
        const res = await diffusion_chain.ComfyApi.queue(comfy_server)
        if (res.queue_pending.length || res.queue_running.length) {
            await new Promise((resolve) => setTimeout(resolve, 500))
        } else {
            break
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
    const history = await diffusion_chain.ComfyApi.history(comfy_server)
    return history
}
export async function postPromptAndGetBase64JsonResult(
    comfy_server: diffusion_chain.ComfyServer,
    prompt: Record<string, any>
) {
    try {
        const res = await diffusion_chain.ComfyApi.prompt(comfy_server, {
            prompt,
        } as ComfyPrompt)
        if (res.error) {
            const readable_error = comfy_server.getReadableError(res)
            throw new Error(readable_error)
        }
        const prompt_id = res.prompt_id
        const history = await getHistory(comfy_server)
        const promptInfo = history[prompt_id]
        const store_output = await mapComfyOutputToStoreOutput(
            comfy_server,
            promptInfo.outputs
        )
        //         // [4][0] for output id.
        //         const fileName = promptInfo.outputs[promptInfo.prompt[4][0]].images[0].filename
        //         const resultB64 = await ComfyApi.view(this, fileName);
        //         resultImages.push(resultB64)
        //         if (option.imageFinishCallback) {
        //             try { option.imageFinishCallback(resultB64, index) } catch (e) { }
        //         }
        // }
        return store_output
    } catch (e) {
        console.error(e)
    }
}
export const getFileFormat = (fileName: string): string =>
    fileName.includes('.') ? fileName.split('.').pop()! : ''

export async function base64UrlFromComfy(
    comfy_server: diffusion_chain.ComfyServer,
    { filename, type, subfolder }: ComfyOutputImage
) {
    const base64 = await diffusion_chain.ComfyApi.view(
        comfy_server,
        filename,
        type,
        subfolder
    )
    return base64Url(base64, getFileFormat(filename))
}
export function base64UrlFromFileName(base64: string, filename: string) {
    return base64Url(base64, getFileFormat(filename))
}
export function base64Url(base64: string, format: string = 'png') {
    return `data:image/${format};base64,${base64}`
}
export function generatePrompt(prompt: Record<string, any>) {
    prompt
}
export function updateOutput(output: any, output_store_obj: any) {
    // store.data.current_prompt2_output[26] = [image, image]
    output_store_obj = output
}

export async function mapComfyOutputToStoreOutput(
    comfy_server: diffusion_chain.ComfyServer,
    comfy_output: Record<string, any>
) {
    const store_output: Record<string, any> = {}

    for (let key in comfy_output) {
        let base64_url_list = await Promise.all(
            (Object.values(comfy_output[key]).flat() as ComfyOutputImage[]).map(
                async (output: ComfyOutputImage) => {
                    try {
                        if (
                            ['png', 'gif'].includes(
                                extractFormat(output.filename)
                            )
                        ) {
                            return await base64UrlFromComfy(
                                comfy_server,
                                output
                            )
                        }
                    } catch (e) {
                        console.error(output, e)
                        return ''
                    }
                }
            )
        )
        store_output[key] = [...(store_output[key] || []), ...base64_url_list]
    }

    return store_output
}

interface LooseObject {
    [key: string]: any
}

function isSameStructure(obj1: LooseObject, obj2: LooseObject): boolean {
    // Get keys
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    // Check if both objects have the same number of keys
    if (keys1.length !== keys2.length) {
        return false
    }

    // Check if all keys in obj1 exist in obj2 and have the same structure
    for (let i = 0; i < keys1.length; i++) {
        const key = keys1[i]

        // Check if the key exists in obj2
        if (!obj2.hasOwnProperty(key)) {
            return false
        }

        // If the value of this key is an object, check their structure recursively
        if (
            typeof obj1[key] === 'object' &&
            obj1[key] !== null &&
            typeof obj2[key] === 'object' &&
            obj2[key] !== null
        ) {
            if (!isSameStructure(obj1[key], obj2[key])) {
                return false
            }
        }
    }

    // If all checks passed, the structures are the same
    return true
}

function extractFormat(input: string) {
    let format: string = ''
    if (input.includes('data:')) {
        // Case for dataURL
        format = input.split(':')[1].split(';')[0].split('/')[1]
    } else if (input.includes('.')) {
        // Case for file name with extension
        format = input.split('.').pop() || ''
    } else {
        throw `input doesn't have an extension. input:${input}`
    }
    return format
}

export default {
    getNodes,
    parseComfyInput,
    getNodeType,
    base64Url,
    getFileFormat,
    base64UrlFromComfy,
    generatePrompt,
    updateOutput,
    getHistory,
    mapComfyOutputToStoreOutput,
    postPromptAndGetBase64JsonResult,
    isSameStructure,
    extractFormat,
    workflows2,
    ComfyInputType,
    ComfyNodeType,
}
