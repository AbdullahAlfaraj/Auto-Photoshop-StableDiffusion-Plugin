import React from 'react'
import ReactDOM from 'react-dom/client'
import { requestGet, requestPost } from '../util/ts/api'
import { observer } from 'mobx-react'
import {
    MoveToCanvasSvg,
    SpMenu,
    SpSlider,
    SpTextfield,
} from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'
import { Collapsible } from '../util/collapsible'
import Locale from '../locale/locale'
import { AStore } from '../main/astore'

import hi_res_prompt from './prompt.json'
import { Grid } from '../util/grid'
import { io } from '../util/oldSystem'
import { app } from 'photoshop'
import { reaction, toJS } from 'mobx'
import { storage } from 'uxp'
export let hi_res_prompt_temp = hi_res_prompt
console.log('hi_res_prompt: ', hi_res_prompt)

interface Error {
    type: string
    message: string
    details: string
    extra_info: any
}

interface NodeError {
    errors: Error[]
    dependent_outputs: string[]
    class_type: string
}

interface Result {
    error?: Error
    node_errors?: { [key: string]: NodeError }
}

const result: Result = {
    error: {
        type: 'prompt_outputs_failed_validation',
        message: 'Prompt outputs failed validation',
        details: '',
        extra_info: {},
    },
    node_errors: {
        '16': {
            errors: [
                {
                    type: 'value_not_in_list',
                    message: 'Value not in list',
                    details:
                        "ckpt_name: 'v2-1_768-ema-pruned.ckpt' not in ['anythingV5Anything_anythingV5PrtRE.safetensors', 'deliberate_v2.safetensors', 'dreamshaper_631BakedVae.safetensors', 'dreamshaper_631Inpainting.safetensors', 'edgeOfRealism_eorV20Fp16BakedVAE.safetensors', 'juggernaut_final-inpainting.safetensors', 'juggernaut_final.safetensors', 'loraChGirl.safetensors', 'sd-v1-5-inpainting.ckpt', 'sd_xl_base_1.0.safetensors', 'sd_xl_refiner_1.0.safetensors', 'v1-5-pruned-emaonly.ckpt']",
                    extra_info: {
                        input_name: 'ckpt_name',
                        input_config: [
                            [
                                'anythingV5Anything_anythingV5PrtRE.safetensors',
                                'deliberate_v2.safetensors',
                                'dreamshaper_631BakedVae.safetensors',
                                'dreamshaper_631Inpainting.safetensors',
                                'edgeOfRealism_eorV20Fp16BakedVAE.safetensors',
                                'juggernaut_final-inpainting.safetensors',
                                'juggernaut_final.safetensors',
                                'loraChGirl.safetensors',
                                'sd-v1-5-inpainting.ckpt',
                                'sd_xl_base_1.0.safetensors',
                                'sd_xl_refiner_1.0.safetensors',
                                'v1-5-pruned-emaonly.ckpt',
                            ],
                        ],
                        received_value: 'v2-1_768-ema-pruned.ckpt',
                    },
                },
            ],
            dependent_outputs: ['9', '12'],
            class_type: 'CheckpointLoaderSimple',
        },
    },
}

function logError(result: Result) {
    // Top-level error
    let has_error = false
    let errorMessage = ''

    // Top-level error
    if (result.error) {
        errorMessage += `Error: ${result.error.message}\n`
        has_error = true
        if (result.error.details) {
            errorMessage += `Details: ${result.error.details}\n`
        }
    }

    // Node errors
    if (result.node_errors) {
        for (const [node_id, node_error] of Object.entries(
            result.node_errors
        )) {
            errorMessage += `Node ${node_id}:\n`
            has_error = true
            for (const error of node_error.errors) {
                errorMessage += `- Error: ${error.message}\n`
                if (error.details) {
                    errorMessage += `  Details: ${error.details}\n`
                }
            }
        }
    }

    if (errorMessage) {
        app.showAlert(errorMessage)
    }
    return has_error
}

export async function workflowEntries() {
    try {
        const workflow_folder = await storage.localFileSystem.getFolder()

        let entries = await workflow_folder.getEntries()
        const workflow_entries = entries.filter(
            (e: any) => e.isFile && e.name.toLowerCase().includes('.png') // must be a file and has the of the type .png
        )

        console.log('workflow_entries: ', workflow_entries)

        return workflow_entries
    } catch (e) {
        console.error(e)
    }
}
export async function postPrompt(prompt: any) {
    try {
        const url = 'http://127.0.0.1:8188/prompt'
        const payload = {
            prompt: prompt,
        }
        const result = await requestPost(url, payload)

        return result
    } catch (e) {
        console.error(e)
    }
}

const timer = (ms: any) => new Promise((res) => setTimeout(res, ms))

export async function generateRequest(prompt: any) {
    try {
        const prompt_result = await postPrompt(prompt)
        const prompt_id = prompt_result.prompt_id
        let history_result: any
        let numberOfAttempts = 0
        let has_error = logError(prompt_result)
        while (true && !has_error) {
            try {
                console.log('get history attempt: ', numberOfAttempts)
                history_result = await getHistory(prompt_id)
                console.log('history_result:', history_result)
                if (history_result?.[prompt_id]) break

                numberOfAttempts += 1
                await timer(5000)
            } catch (e) {
                console.log('getHistory failed, retrying...')
            }
        }
        return { history_result: history_result, prompt_id: prompt_id }
    } catch (e) {
        console.error(e)
    }
}
export async function generateImage(prompt: any) {
    try {
        let { history_result, prompt_id }: any = await generateRequest(prompt)
        const outputs: any[] = Object.values(history_result[prompt_id].outputs)
        const images: any[] = []
        for (const output of outputs) {
            if (Array.isArray(output.images)) {
                images.push(...output.images)
            }
        }

        const base64_imgs = []
        for (const image of images) {
            const img = await loadImage(
                image.filename,
                image.subfolder,
                image.type
            )
            base64_imgs.push(img)
        }

        store.data.comfyui_output_images = base64_imgs

        const thumbnails = []
        for (const image of base64_imgs) {
            thumbnails.push(await io.createThumbnail(image, 300))
        }
        store.data.comfyui_output_thumbnail_images = thumbnails

        return base64_imgs
    } catch (e) {
        console.error(e)
    }
}

export async function getHistory(prompt_id: string) {
    try {
        const url = `http://127.0.0.1:8188/history/${prompt_id}`
        const history_result: any = await requestGet(url)

        return history_result
    } catch (e) {
        console.error(e)
    }
}

export async function loadImage(
    filename = 'ComfyUI_00003_.png',
    subfolder = '',
    type = 'output'
) {
    try {
        const url = `http://127.0.0.1:8188/view?filename=${filename}&subfolder=${subfolder}&type=${type}`
        const image = await fetch(url)

        const array_buffer = await image.arrayBuffer()
        //@ts-ignore
        const b64 = _arrayBufferToBase64(array_buffer)

        return b64
    } catch (e) {
        console.error(e)
    }
}

export async function getConfig() {
    try {
        const prompt = {
            '1': {
                inputs: {},
                class_type: 'GetConfig',
            },
        }

        let { history_result, prompt_id }: any = await generateRequest(prompt)
        //@ts-ignore
        const config: ComfyUIConfig = Object.values(
            history_result?.[prompt_id].outputs
        )[0]
        store.data.comfyui_config = { ...config }
        store.data.comfyui_config.valid_nodes = JSON.parse(
            config.valid_nodes.join('')
        )

        return config
    } catch (e) {
        console.error(e)
    }
}
export async function getWorkflowApi(image_path: string) {
    try {
        const prompt = {
            '1': {
                inputs: {
                    // image: 'C:/Users/abdul/Downloads/img2img_workflow.png',
                    image_path: image_path,
                },
                class_type: 'LoadImageWithMetaData',
            },
        }
        let { history_result, prompt_id }: any = await generateRequest(prompt)
        //@ts-ignore
        let { prompt: result_prompt, workflow } = Object.values(
            history_result?.[prompt_id].outputs
        )[0]
        result_prompt = JSON.parse(result_prompt.join(''))
        workflow = JSON.parse(workflow.join(''))

        return { prompt: result_prompt, workflow }
    } catch (e) {
        console.error(e)
    }
}
enum InputTypeEnum {
    NumberField = 'NumberField',
    TextField = 'TextField',
    TextArea = 'TextArea',
    Menu = 'Menu',
    ImageBase64 = 'ImageBase64',
}

interface ComfyUINode {
    inputs: any
    class_type: string
}
function filterObjectProperties(node_inputs: any, valid_keys: string[]) {
    return Object.fromEntries(
        valid_keys.map((key: string) => [key, node_inputs[key]])
    )
}
export function parseUIFromNode(node: ComfyUINode, node_id: string) {
    //convert node to array of ui element definition
    try {
        const ValidNodes = store.data.comfyui_config?.valid_nodes
        const valid_ui = ValidNodes[node.class_type]?.inputs // all the valid inputs of a node
        const list_ids = ValidNodes[node.class_type]?.list_id
        if (valid_ui) {
            const keys = Object.keys(valid_ui)
            const filtered_values = filterObjectProperties(node.inputs, keys)
            const entires = keys.map((key) => {
                //example values:
                // "sampler_name": {
                // "label": "sampler_name",
                // "value": "dpmpp_2m",
                // "type": "Menu",
                // "list_id": "samplers"
                // },

                return [
                    key,
                    {
                        label: key,
                        value: filtered_values[key],
                        type: valid_ui[key],
                        list_id: list_ids?.[key],
                        node_id: node_id,
                    },
                ]
            })

            const valid_node_input = Object.fromEntries(entires)
            store.data.comfyui_valid_nodes[node_id] = valid_node_input
            store.data.uuids[node_id] = window.crypto.randomUUID()
            return valid_node_input
        }
    } catch (e) {
        console.error(e)
    }
}
interface ValidInput {
    [key: string]: any
    value: string | number
    label: string
    list?: any[]
    type: InputTypeEnum
    id?: string
}
interface PhotoshopNode {
    inputs: ValidInput[]
    id: string
}

interface ComfyUIConfig {
    [key: string]: any
    checkpoints: string[]
    samplers: string[]
    schedulers: string[]
}
export const store = new AStore({
    comfyui_valid_nodes: {} as any, // comfyui nodes like structure that contain all info necessary to create plugin ui elements
    uuids: {} as any,

    comfyui_output_images: [] as string[], //store the output images from generation
    comfyui_output_thumbnail_images: [] as string[], // store thumbnail size images
    comfyui_config: {} as ComfyUIConfig, // all config data like samplers, checkpoints ...etc
    workflow_path: '', // the path of an image that contains prompt information
    workflow_dir_path: '', // the path of the directory that contains all workflow files
    // workflows_paths: [] as string[],
    // workflows_names: [] as string[],
    workflows: {} as any,
    selected_workflow: '', // the selected workflow from the workflow menu
    current_prompt: {} as any, // current prompt extracted from the workflow
    thumbnail_image_size: 100,
    load_image_nodes: {} as any, //our custom loadImageBase64 nodes, we need to substitute comfyui LoadImage nodes with before generating a prompt
    // load_image_base64_strings: {} as any, //images the user added to the plugin comfy ui
})

export function storeToPrompt(store: any, basePrompt: any) {
    //TODO change .map to .forEach
    let modified_prompt = { ...basePrompt } // the original prompt but with the value of the ui
    Object.entries(store.data.comfyui_valid_nodes).forEach(
        ([node_id, node_inputs]: [string, any]) => {
            Object.entries(node_inputs).forEach(
                ([input_id, node_input]: [string, any]) => {
                    return (modified_prompt[node_id]['inputs'][input_id] =
                        node_input.value)
                }
            )
        }
    )
    // store.data.
    // modified_propmt[load_image_node_id]
    // prompt = { ...store.data.comfyui_valid_nodes }

    return modified_prompt
}
function createMenu(input: ValidInput) {
    console.log('input: ', toJS(input))
    return (
        <>
            <sp-label
                class="title"
                style={{ width: '60px', display: 'inline-block' }}
            >
                {input.label}
            </sp-label>
            <SpMenu
                size="m"
                title="input.label"
                items={store.data.comfyui_config[input.list_id]}
                label_item={`Select ${input.label}`}
                selected_index={store.data.comfyui_config[
                    input.list_id
                ]!.indexOf(input.value)}
                onChange={(id: any, value: any) => {
                    input.value = value.item
                }}
            ></SpMenu>
        </>
    )
}

function createTextField(input: ValidInput) {
    let element = (
        <>
            <sp-label>{input.label}</sp-label>
            <SpTextfield
                style={{ width: '100%' }}
                title=""
                type={input.type.includes('number') ? 'number' : 'text'}
                placeholder=""
                value={input.value}
                onChange={(evt: any) => {
                    input.value = evt.target.value
                }}
            ></SpTextfield>
        </>
    )
    return element
}
function createTextArea(input: ValidInput) {
    let element = (
        <>
            <sp-label>{input.label}</sp-label>
            <sp-textarea
                onInput={(event: any) => {
                    input.value = event.target.value
                }}
                placeholder={`${input.label}`}
                value={input.value}
            ></sp-textarea>
        </>
    )
    return element
}
function createImageBase64(input: ValidInput) {
    let element = (
        <>
            <div>
                <img
                    className="column-item-image"
                    src={
                        // store.data.load_image_base64_strings?.[input.node_id]
                        input.value
                            ? 'data:image/png;base64,' +
                              //   store.data.load_image_base64_strings?.[
                              //       input.node_id
                              //   ]
                              input.value
                            : 'https://source.unsplash.com/random'
                    }
                    width="300px"
                    height="100px"
                />
            </div>
            <div className="imgButton">
                <button
                    className="column-item button-style btnSquare"
                    onClick={async () => {
                        input.value = await io.getImg2ImgInitImage()
                    }}
                    title=""
                >
                    {Locale('Set Image')}
                </button>
            </div>
        </>
    )
    return element
}
function nodeInputToHtmlElement(input: ValidInput) {
    let element
    if (
        [InputTypeEnum.NumberField, InputTypeEnum.TextField].includes(
            input.type
        )
    ) {
        element = createTextField(input)
    } else if ([InputTypeEnum.Menu].includes(input.type)) {
        element = createMenu(input)
    } else if ([InputTypeEnum.TextArea].includes(input.type)) {
        element = createTextArea(input)
    } else if ([InputTypeEnum.ImageBase64].includes(input.type)) {
        element = createImageBase64(input)
    }
    return element
}

export async function loadWorkflow(workflow_path: string) {
    try {
        store.data.current_prompt = (
            await getWorkflowApi(workflow_path)
        )?.prompt

        const current_prompt: any = store.toJsFunc().data.current_prompt
        const loadImageNodes = Object.keys(current_prompt)
            .filter(
                (key: any) => current_prompt[key].class_type === 'LoadImage'
            )
            .reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: current_prompt[key],
                }),
                {}
            )

        Object.keys(loadImageNodes).forEach((node_id: any) => {
            store.data.current_prompt[node_id] = {
                inputs: {
                    image_base64: '',
                },
                class_type: 'LoadImageBase64',
            }
        })

        const node_obj = Object.entries(store.data.current_prompt)
        //clear both node structure and base64 images store values
        store.data.comfyui_valid_nodes = {}
        store.data.uuids = {}
        // store.data.load_image_base64_strings = {}
        node_obj.forEach(([node_id, node]: [string, any]) => {
            console.log(node_id, node)
            const valid_input = parseUIFromNode(node, node_id)
        })
    } catch (e) {
        console.error(e)
    }
}

@observer
class ComfyNodeComponent extends React.Component<{}> {
    async componentDidMount(): Promise<void> {
        try {
            await getConfig()
        } catch (e) {
            console.error(e)
        }
    }

    render(): React.ReactNode {
        return (
            <div>
                <div>
                    <sp-label></sp-label>
                    <SpTextfield
                        style={{ width: '100%' }}
                        title="Workflows directory"
                        type={'text'}
                        placeholder=""
                        value={store.data.workflow_dir_path}
                        onChange={(evt: any) => {
                            store.data.workflow_dir_path = evt.target.value
                        }}
                    ></SpTextfield>
                    <button
                        onClick={async () => {
                            try {
                                const entries = await workflowEntries()

                                store.data.workflows = {}
                                for (const entry of entries) {
                                    store.data.workflows[entry.name] =
                                        entry.nativePath
                                }
                            } catch (e) {
                                console.error(e)
                            }
                        }}
                    >
                        load workflows
                    </button>
                    <div>
                        <sp-label
                            class="title"
                            style={{ width: '60px', display: 'inline-block' }}
                        >
                            {'select workflow:'}
                        </sp-label>
                        <SpMenu
                            size="m"
                            title="workflows"
                            items={Object.keys(store.data.workflows)}
                            label_item="Select a workflow"
                            selected_index={Object.values(
                                store.data.workflows
                            ).indexOf(store.data.selected_workflow)}
                            onChange={async (id: any, value: any) => {
                                store.data.selected_workflow = value.item
                                await loadWorkflow(
                                    store.data.workflows[value.item]
                                )
                            }}
                        ></SpMenu>
                    </div>
                    <sp-label>workflow path:</sp-label>
                    <SpTextfield
                        style={{ width: '100%' }}
                        title="workflow path"
                        type={'text'}
                        placeholder=""
                        value={store.data.workflow_path}
                        onChange={(evt: any) => {
                            store.data.workflow_path = evt.target.value
                        }}
                    ></SpTextfield>
                    <div style={{ marginTop: '3px' }}>
                        <button
                            className="btnSquare"
                            style={{ marginRight: '3px' }}
                            onClick={async () => {
                                await loadWorkflow(store.data.workflow_path)
                            }}
                        >
                            Load Workflow
                        </button>
                        <button
                            className="btnSquare"
                            onClick={async () => {
                                try {
                                    const new_prompt = storeToPrompt(
                                        store.toJsFunc(),
                                        store.toJsFunc().data.current_prompt
                                    )
                                    await generateImage(new_prompt)
                                } catch (e) {
                                    console.error(e)
                                }
                            }}
                        >
                            Generate
                        </button>
                    </div>
                </div>
                {Object.keys(store.data.comfyui_valid_nodes).map(
                    (node_id: string, index_i) => {
                        return (
                            <div
                                key={`${store.data.uuids[node_id]}`}
                                style={{
                                    border: '2px solid #6d6c6c',
                                    padding: '3px',
                                }}
                            >
                                {Object.keys(
                                    store.data.comfyui_valid_nodes[node_id]
                                ).map((input_id: string, index_j: number) => {
                                    return (
                                        <div
                                            key={`${node_id}_${index_i}_${index_j}`}
                                        >
                                            {nodeInputToHtmlElement(
                                                store.data.comfyui_valid_nodes[
                                                    node_id
                                                ][input_id]
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    }
                )}
                <div>
                    <sp-label>Result: </sp-label>
                    <SpSlider
                        style={{ display: 'block' }}
                        show-value="false"
                        id="slUpscaleSize"
                        min="100"
                        max="300"
                        value={store.data.thumbnail_image_size}
                        title=""
                        onInput={(evt: any) => {
                            store.data.thumbnail_image_size = evt.target.value
                        }}
                    >
                        <sp-label slot="label" class="title">
                            Thumbnail Size:
                        </sp-label>
                        <sp-label class="labelNumber" slot="label">
                            {parseInt(store.data.thumbnail_image_size as any)}
                        </sp-label>
                    </SpSlider>
                    <Grid
                        // thumbnails_data={store.data.images}

                        thumbnails={store.data.comfyui_output_thumbnail_images}
                        width={store.data.thumbnail_image_size}
                        height={200}
                        action_buttons={[
                            {
                                ComponentType: MoveToCanvasSvg,
                                callback: (index: number) => {
                                    io.IO.base64ToLayer(
                                        store.data.comfyui_output_images[index]
                                    )
                                },
                                title: 'Copy Image to Canvas',
                            },
                        ]}
                    ></Grid>
                </div>
            </div>
        )
    }
}

const container = document.getElementById('ComfyUIContainer')!
const root = ReactDOM.createRoot(container)
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={true} label={Locale('ComfyUI')}>
                    <ComfyNodeComponent></ComfyNodeComponent>
                </Collapsible>
            </div>
            {/* <ComfyNodeComponent></ComfyNodeComponent> */}
        </ErrorBoundary>
    </React.StrictMode>
)
