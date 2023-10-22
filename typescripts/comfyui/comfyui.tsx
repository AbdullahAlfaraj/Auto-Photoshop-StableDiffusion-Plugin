import React from 'react'
import ReactDOM from 'react-dom/client'
import { requestGet, requestPost } from '../util/ts/api'
import { observer } from 'mobx-react'
import { runInAction } from 'mobx'
import {
    MoveToCanvasSvg,
    SliderType,
    SpMenu,
    SpSlider,
    SpSliderWithLabel,
    SpTextfield,
} from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'
import { Collapsible } from '../util/collapsible'
import Locale from '../locale/locale'
import { AStore } from '../main/astore'

import { Grid } from '../util/grid'
import { io } from '../util/oldSystem'
import { app } from 'photoshop'
import { reaction, toJS } from 'mobx'
import { storage } from 'uxp'

import util from './util'
import * as diffusion_chain from 'diffusion-chain'
import { urlToCanvas } from '../util/ts/general'
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
        const formats: string[] = []

        for (const image of images) {
            const img = await loadImage(
                image.filename,
                image.subfolder,
                image.type
            )
            base64_imgs.push(img)
            formats.push(util.getFileFormat(image.filename))
        }

        store.data.comfyui_output_images = base64_imgs

        const thumbnails = []
        for (let i = 0; i < base64_imgs.length; ++i) {
            if (['png', 'webp', 'jpg'].includes(formats[i])) {
                thumbnails.push(await io.createThumbnail(base64_imgs[i], 300))
            } else if (['gif'].includes(formats[i])) {
                thumbnails.push('data:image/gif;base64,' + base64_imgs[i])
            }
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
    //TODO: replace this method with get_object_info from comfyapi
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
    selected_workflow_name: '', // the selected workflow from the workflow menu
    current_prompt: {} as any, // current prompt extracted from the workflow
    thumbnail_image_size: 100,
    load_image_nodes: {} as any, //our custom loadImageBase64 nodes, we need to substitute comfyui LoadImage nodes with before generating a prompt
    // load_image_base64_strings: {} as any, //images the user added to the plugin comfy ui
    object_info: undefined as any,
    current_prompt2: {} as any,
    current_prompt2_output: {} as any,
    output_thumbnail_image_size: {} as Record<string, number>,
    comfy_server: new diffusion_chain.ComfyServer(
        'http://127.0.0.1:8188'
    ) as diffusion_chain.ComfyServer,
    loaded_images_base64_url: [] as string[],
    current_loaded_image: {} as Record<string, string>,
    loaded_images_list: [] as string[], // store an array of all images in the comfy's input directory
    nodes_order: [] as string[], // nodes with smaller index will be rendered first,
    can_edit_nodes: false as boolean,
    nodes_label: {} as Record<string, string>,
    workflows2: {
        hi_res_workflow: util.hi_res_workflow,
        lora_less_workflow: util.lora_less_workflow,
        img2img_workflow: util.img2img_workflow,
        animatediff_workflow: util.animatediff_workflow,
    } as Record<string, any>,
    progress_value: 0,
    is_random_seed: {} as Record<string, boolean>,
    last_moved: undefined as string | undefined, // the last node that has been moved in the edit mode
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

        store.data.is_random_seed = Object.fromEntries(
            Object.keys(toJS(store.data.current_prompt)).map(
                (node_id: string) => {
                    return [node_id, false]
                }
            )
        )
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
                    {/* <sp-label></sp-label>
                    <SpTextfield
                        style={{ width: '100%' }}
                        title="Workflows directory"
                        type={'text'}
                        placeholder=""
                        value={store.data.workflow_dir_path}
                        onChange={(evt: any) => {
                            store.data.workflow_dir_path = evt.target.value
                        }}
                    ></SpTextfield> */}
                    <button
                        className="btnSquare"
                        style={{ marginTop: '3px' }}
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
                        {/* <sp-label
                            class="title"
                            style={{ width: '60px', display: 'inline-block' }}
                        >
                            {'select workflow:'}
                        </sp-label> */}
                        <SpMenu
                            size="m"
                            title="workflows"
                            items={Object.keys(store.data.workflows)}
                            label_item="Select a workflow"
                            selected_index={Object.values(
                                store.data.workflows
                            ).indexOf(store.data.selected_workflow_name)}
                            onChange={async (id: any, value: any) => {
                                store.data.selected_workflow_name = value.item
                                await loadWorkflow(
                                    store.data.workflows[value.item]
                                )
                            }}
                        ></SpMenu>{' '}
                        <button
                            className="btnSquare refreshButton"
                            id="btnResetSettings"
                            title="Refresh the ADetailer Extension"
                            onClick={async () => {
                                await getConfig()
                            }}
                        ></button>
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

function setSliderValue(store: any, node_id: string, name: string, value: any) {
    runInAction(() => {
        store.data.current_prompt2[node_id].inputs[name] = value
    })
}
async function onChangeLoadImage(node_id: string, filename: string) {
    try {
        store.data.current_loaded_image[node_id] =
            await util.base64UrlFromComfy(store.data.comfy_server, {
                filename: encodeURIComponent(filename),
                type: 'input',
                subfolder: '',
            })
    } catch (e) {
        console.warn(e)
    }
}
function renderNode(node_id: string, node: any) {
    const comfy_node_info = toJS(store.data.object_info[node.class_type])
    const is_output = comfy_node_info.output_node
    console.log('comfy_node_info: ', comfy_node_info)
    const node_type = util.getNodeType(node.class_type)
    let node_html
    if (node_type === util.ComfyNodeType.LoadImage) {
        const loaded_images = store.data.loaded_images_list
        const inputs = store.data.current_prompt2[node_id].inputs
        const node_name = node.class_type
        node_html = (
            <div>
                New load image component
                <sp-label class="title" style={{ display: 'inline-block' }}>
                    {node_name}
                </sp-label>
                <div>
                    <SpMenu
                        disabled={store.data.can_edit_nodes ? true : void 0}
                        size="m"
                        title={node_name}
                        items={loaded_images}
                        label_item={`Select an Image`}
                        // id={'model_list'}
                        selected_index={loaded_images.indexOf(inputs.image)}
                        onChange={async (
                            id: any,
                            { index, item }: Record<string, any>
                        ) => {
                            console.log('onChange value.item: ', item)
                            inputs.image = item
                            //load image store for each LoadImage Node
                            //use node_id to store these

                            onChangeLoadImage(node_id, item)
                        }}
                    ></SpMenu>
                </div>
                <div>
                    <button
                        onClick={() => {
                            let index: number = loaded_images.indexOf(
                                inputs.image
                            )
                            index--
                            const length = loaded_images.length
                            index = ((index % length) + length) % length
                            inputs.image = loaded_images[index]
                            onChangeLoadImage(node_id, inputs.image)
                        }}
                    >
                        {' '}
                        {'<'}{' '}
                    </button>

                    <button
                        onClick={() => {
                            let index: number = loaded_images.indexOf(
                                inputs.image
                            )
                            index++
                            const length = loaded_images.length
                            index = ((index % length) + length) % length
                            inputs.image = loaded_images[index]
                            onChangeLoadImage(node_id, inputs.image)
                        }}
                    >
                        {' '}
                        {'>'}{' '}
                    </button>
                </div>
                <img
                    src={store.data.current_loaded_image[node_id]}
                    style={{ height: '200px' }}
                    onError={async () => {
                        console.error(
                            'error loading image: ',
                            store.data.current_loaded_image[node_id]
                        )
                        // try {
                        //     const filename = inputs.image
                        //     store.data.current_loaded_image[node_id] =
                        //         await util.base64UrlFromComfy(
                        //             store.data.comfy_server,
                        //             {
                        //                 filename: encodeURIComponent(filename),
                        //                 type: 'input',
                        //                 subfolder: '',
                        //             }
                        //         )
                        //     console.log(
                        //         'store.data.current_loaded_image[node_id]: ',
                        //         toJS(store.data.current_loaded_image[node_id])
                        //     )
                        // } catch (e) {
                        //     console.warn(e)
                        // }
                        onChangeLoadImage(node_id, inputs.image)
                    }}
                />
                {/* <Grid
                    thumbnails={store.data.loaded_images_base64_url}
                    width={200}
                    height={200}
                ></Grid> */}
            </div>
        )
    } else if (node_type === util.ComfyNodeType.Normal) {
        node_html = Object.entries(node.inputs).map(([name, value], index) => {
            // store.data.current_prompt2[node_id].inputs[name] = value
            try {
                const input = comfy_node_info.input.required[name]
                let { type, config } = util.parseComfyInput(name, input)
                const html_element = renderInput(
                    node_id,
                    name,
                    type,
                    config,
                    `${node_id}_${name}_${type}_${index}`
                )
                return html_element
            } catch (e) {
                console.error(e)
            }
        })
    }
    if (is_output) {
        const output_node_element = (
            <div>
                <>
                    {'filename_prefix' in
                    store.data.current_prompt2[node_id].inputs ? (
                        <>
                            <sp-label slot="label" class="title">
                                filename prefix:
                            </sp-label>
                            <SpTextfield
                                disabled={
                                    store.data.can_edit_nodes ? true : void 0
                                }
                                onChange={(event: any) => {
                                    try {
                                        store.data.current_prompt2[
                                            node_id
                                        ].inputs['filename_prefix'] =
                                            event.target.value
                                    } catch (e) {
                                        console.warn(e)
                                    }
                                }}
                                placeholder={`filename_prefix`}
                                value={
                                    store.data.current_prompt2[node_id].inputs[
                                        'filename_prefix'
                                    ]
                                }
                            ></SpTextfield>
                        </>
                    ) : (
                        void 0
                    )}
                </>
                <SpSlider
                    disabled={store.data.can_edit_nodes ? true : void 0}
                    style={{ display: 'block' }}
                    show-value="false"
                    id="slUpscaleSize"
                    min="25"
                    max="300"
                    value={store.data.output_thumbnail_image_size[node_id]}
                    title=""
                    onInput={(evt: any) => {
                        store.data.output_thumbnail_image_size[node_id] =
                            evt.target.value
                    }}
                >
                    <sp-label slot="label" class="title">
                        Thumbnail Size:
                    </sp-label>
                    <sp-label class="labelNumber" slot="label">
                        {parseInt(
                            store.data.output_thumbnail_image_size[
                                node_id
                            ] as any
                        )}
                    </sp-label>
                </SpSlider>
                <Grid
                    // thumbnails_data={store.data.images}

                    thumbnails={store.data.current_prompt2_output[node_id]}
                    width={store.data.output_thumbnail_image_size[node_id]}
                    height={200}
                    action_buttons={[
                        {
                            ComponentType: MoveToCanvasSvg,
                            callback: (index: number) => {
                                // io.IO.base64ToLayer(
                                //     store.data.current_prompt2_output[node_id][
                                //         index
                                //     ]
                                // )
                                urlToCanvas(
                                    store.data.current_prompt2_output[node_id][
                                        index
                                    ],
                                    'comfy_output.png'
                                )
                            },
                            title: 'Copy Image to Canvas',
                        },
                    ]}
                ></Grid>
            </div>
        )

        return output_node_element
    }
    return node_html
}
function renderInput(
    node_id: string,
    name: string,
    type: any,
    config: any,
    key?: string
) {
    let html_element = (
        <div key={key ?? void 0}>
            {name},{type}, {JSON.stringify(config)}
        </div>
    )
    const inputs = store.data.current_prompt2[node_id].inputs

    if (type === util.ComfyInputType.Seed) {
        html_element = (
            <>
                <sp-label slot="label">{name}:</sp-label>
                <sp-textfield
                    disabled={store.data.can_edit_nodes ? true : void 0}
                    // key={key ?? void 0}
                    type="text"
                    // placeholder="cute cats"
                    // value={config.default}
                    value={inputs[name]}
                    onInput={(event: any) => {
                        // store.data.search_query = event.target.value
                        inputs[name] = event.target.value
                        console.log(`${name}: ${event.target.value}`)
                    }}
                ></sp-textfield>
                <sp-checkbox
                    title="randomize seed before generation"
                    value={store.data.is_random_seed[node_id]}
                    onClick={(evt: any) => {
                        store.data.is_random_seed[node_id] = evt.target.checked
                    }}
                    style={{ display: 'inline-flex' }}
                >
                    random
                </sp-checkbox>
            </>
        )
    } else if (type === util.ComfyInputType.BigNumber) {
        html_element = (
            <>
                <sp-label slot="label">{name}:</sp-label>
                <sp-textfield
                    disabled={store.data.can_edit_nodes ? true : void 0}
                    // key={key ?? void 0}
                    type="text"
                    // placeholder="cute cats"
                    // value={config.default}
                    value={inputs[name]}
                    onInput={(event: any) => {
                        // store.data.search_query = event.target.value
                        inputs[name] = event.target.value
                        console.log(`${name}: ${event.target.value}`)
                    }}
                ></sp-textfield>
            </>
        )
    } else if (type === util.ComfyInputType.TextFieldNumber) {
        html_element = (
            <>
                <sp-label slot="label">{name}:</sp-label>
                <SpTextfield
                    disabled={store.data.can_edit_nodes ? true : void 0}
                    type="text"
                    // value={config.default}
                    value={inputs[name]}
                    onChange={(e: any) => {
                        const v = e.target.value
                        let new_value =
                            v !== ''
                                ? Math.max(config.min, Math.min(config.max, v))
                                : v
                        inputs[name] = new_value

                        console.log(`${name}: ${e.target.value}`)
                    }}
                ></SpTextfield>
            </>
        )
    } else if (type === util.ComfyInputType.Slider) {
        html_element = (
            <SpSliderWithLabel
                // key={key ?? void 0}
                disabled={store.data.can_edit_nodes ? true : void 0}
                show-value={false}
                steps={config?.step ?? 1}
                out_min={config?.min ?? 0}
                out_max={config?.max ?? 100}
                output_value={store.data.current_prompt2[node_id].inputs[name]}
                label={name}
                slider_type={
                    config?.step && !Number.isInteger(config?.step)
                        ? SliderType.Float
                        : SliderType.Integer
                }
                onSliderInput={(new_value: number) => {
                    // inputs[name] = new_value
                    // setSliderValue(store, node_id, name, new_value)
                    store.data.current_prompt2[node_id].inputs[name] = new_value
                    console.log('slider_change: ', new_value)
                }}
            />
        )
    } else if (type === util.ComfyInputType.Menu) {
        html_element = (
            <>
                <sp-label class="title" style={{ display: 'inline-block' }}>
                    {name}
                </sp-label>
                <SpMenu
                    disabled={store.data.can_edit_nodes ? true : void 0}
                    size="m"
                    title={name}
                    items={config}
                    label_item={`Select a ${name}`}
                    // id={'model_list'}
                    selected_index={config.indexOf(inputs[name])}
                    onChange={(
                        id: any,
                        { index, item }: Record<string, any>
                    ) => {
                        console.log('onChange value.item: ', item)
                        inputs[name] = item
                    }}
                ></SpMenu>
            </>
        )
    } else if (type === util.ComfyInputType.TextArea) {
        html_element = (
            <sp-textarea
                disabled={store.data.can_edit_nodes ? true : void 0}
                // key={key}
                onInput={(event: any) => {
                    try {
                        // this.changePositivePrompt(
                        //     event.target.value,
                        //     store.data.current_index
                        // )
                        // autoResize(
                        //     event.target,
                        //     store.data.positivePrompts[
                        //         store.data.current_index
                        //     ]
                        // )
                        inputs[name] = event.target.value
                    } catch (e) {
                        console.warn(e)
                    }
                }}
                placeholder={`${name}`}
                value={inputs[name]}
            ></sp-textarea>
        )
    } else if (type === util.ComfyInputType.TextField) {
        html_element = (
            <>
                <sp-label slot="label">{name}:</sp-label>

                <SpTextfield
                    disabled={store.data.can_edit_nodes ? true : void 0}
                    type="text"
                    // value={config.default}
                    value={inputs[name]}
                    onChange={(e: any) => {
                        inputs[name] = e.target.value
                        console.log(`${name}: ${e.target.value}`)
                    }}
                ></SpTextfield>
            </>
        )
    }

    return <div key={key}>{html_element}</div>
}

export function swap(index1: number, index2: number) {
    const { length } = store.data.nodes_order
    if (index1 >= 0 && index1 < length && index2 >= 0 && index2 < length) {
        ;[store.data.nodes_order[index1], store.data.nodes_order[index2]] = [
            store.data.nodes_order[index2],
            store.data.nodes_order[index1],
        ]
    }
}

export function saveWorkflowData(
    workflow_name: string,
    { prompt, nodes_order, nodes_label }: WorkflowData
) {
    storage.localStorage.setItem(
        workflow_name,
        JSON.stringify({ prompt, nodes_order, nodes_label })
    )
}
export function loadWorkflowData(workflow_name: string): WorkflowData {
    const workflow_data: WorkflowData = JSON.parse(
        storage.localStorage.getItem(workflow_name)
    )
    return workflow_data
}
interface WorkflowData {
    prompt: any
    nodes_order: string[]
    nodes_label: Record<string, string>
}
function loadWorkflow2(workflow: any) {
    const copyJson = (originalObject: any) =>
        JSON.parse(JSON.stringify(originalObject))
    //1) get prompt
    store.data.current_prompt2 = copyJson(workflow)

    //2)  get the original order
    store.data.nodes_order = Object.keys(toJS(store.data.current_prompt2))

    //3) get labels for each nodes
    store.data.nodes_label = Object.fromEntries(
        Object.entries(toJS(store.data.current_prompt2)).map(
            ([node_id, node]: [string, any]) => {
                return [
                    node_id,
                    toJS(store.data.object_info[node.class_type]).display_name,
                ]
            }
        )
    )

    // parse the output nodes
    // Note: we can't modify the node directly in the prompt like we do for input nodes.
    //.. since this data doesn't exist on the prompt. so we create separate container for the output images
    store.data.current_prompt2_output = Object.entries(
        store.data.current_prompt2
    ).reduce(
        (
            output_entries: Record<string, any[]>,
            [node_id, node]: [string, any]
        ) => {
            if (store.data.object_info[node.class_type].output_node) {
                output_entries[node_id] = []
            }
            return output_entries
        },
        {}
    )

    //slider variables for output nodes
    //TODO: delete store.data.output_thumbnail_image_size before loading a new workflow
    for (let key in toJS(store.data.current_prompt2_output)) {
        store.data.output_thumbnail_image_size[key] = 200
    }

    const workflow_name = store.data.selected_workflow_name
    if (workflow_name) {
        // check if the workflow has a name

        if (workflow_name in storage.localStorage) {
            //load the workflow data from local storage
            //1) load the last parameters used in generation
            //2) load the order of the nodes
            //3) load the labels of the nodes

            const workflow_data: WorkflowData = loadWorkflowData(workflow_name)
            if (
                util.isSameStructure(
                    workflow_data.prompt,
                    toJS(store.data.current_prompt2)
                )
            ) {
                //load 1)
                store.data.current_prompt2 = workflow_data.prompt
                //load 2)
                store.data.nodes_order = workflow_data.nodes_order
                //load 3)
                store.data.nodes_label = workflow_data.nodes_label
            } else {
                // do not load. instead override the localStorage with the new values
                workflow_data.prompt = toJS(store.data.current_prompt2)
                workflow_data.nodes_order = toJS(store.data.nodes_order)
                workflow_data.nodes_label = toJS(store.data.nodes_label)

                saveWorkflowData(workflow_name, workflow_data)
            }
        } else {
            // if workflow data is missing from local storage then save it for next time.
            //1) save parameters values
            //2) save nodes order
            //3) save nodes label

            const prompt = toJS(store.data.current_prompt2)
            const nodes_order = toJS(store.data.nodes_order)
            const nodes_label = toJS(store.data.nodes_label)
            saveWorkflowData(workflow_name, {
                prompt,
                nodes_order,
                nodes_label,
            })
        }
    }
}
@observer
class ComfyWorkflowComponent extends React.Component<{}, { value?: number }> {
    async componentDidMount(): Promise<void> {
        try {
            store.data.object_info = await diffusion_chain.ComfyApi.objectInfo(
                store.data.comfy_server
            )

            loadWorkflow2(util.lora_less_workflow)

            //convert all of comfyui loaded images into base64url that the plugin can use
            const loaded_images =
                store.data.object_info.LoadImage.input.required['image'][0]
            const loaded_images_base64_url = await Promise.all(
                loaded_images.map(async (filename: string) => {
                    try {
                        return await util.base64UrlFromComfy(
                            store.data.comfy_server,
                            {
                                filename: encodeURIComponent(filename),
                                type: 'input',
                                subfolder: '',
                            }
                        )
                    } catch (e) {
                        console.warn(e)
                    }
                })
            )
            store.data.loaded_images_list =
                store.data.object_info.LoadImage.input.required['image'][0]

            store.data.loaded_images_base64_url = loaded_images_base64_url
        } catch (e) {
            console.error(e)
        }
    }

    render(): React.ReactNode {
        const comfy_server = store.data.comfy_server
        return (
            <div>
                <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                    {/* {util.getNodes(util.hi_res_workflow).map((node, index) => {
                    // return <div>{node.class_type}</div>
                    return (
                        <div key={'node_' + index}>{this.renderNode(node)}</div>
                    )
                })} */}
                    <button
                        className="btnSquare"
                        onClick={async () => {
                            // let interval
                            let interval: NodeJS.Timeout = setInterval(
                                function () {
                                    store.data.progress_value++
                                    console.log(store.data.progress_value)
                                },
                                1000
                            ) // 1000 milliseconds = 1 second
                            try {
                                // Start the progress update

                                function runScript() {
                                    function getRandomBigIntApprox(
                                        min: bigint,
                                        max: bigint
                                    ): bigint {
                                        min = BigInt(min)
                                        max = BigInt(max)
                                        const range = Number(max - min)
                                        const rand = Math.floor(
                                            Math.random() * range
                                        )
                                        return BigInt(rand) + min
                                    }

                                    Object.entries(
                                        toJS(store.data.is_random_seed)
                                    ).forEach(([node_id, is_random]) => {
                                        if (is_random) {
                                            const min: bigint = 0n
                                            const max: bigint =
                                                18446744073709552000n
                                            const random_seed: bigint =
                                                getRandomBigIntApprox(min, max)
                                            store.data.current_prompt2[
                                                node_id
                                            ].inputs['seed'] =
                                                random_seed.toString()
                                            // Usage
                                        }
                                    })
                                }
                                runScript()
                                let store_output =
                                    await util.postPromptAndGetBase64JsonResult(
                                        comfy_server,
                                        toJS(store.data.current_prompt2)
                                    )
                                store.data.current_prompt2_output =
                                    store_output ?? {}
                            } catch (e) {
                                console.error(e)
                            } finally {
                                clearInterval(interval as NodeJS.Timeout)
                                store.data.progress_value = 0
                            }
                        }}
                    >
                        Generate
                    </button>
                    <button
                        className="btnSquare"
                        onClick={async () => {
                            store.data.last_moved = void 0
                            store.data.can_edit_nodes =
                                !store.data.can_edit_nodes

                            const workflow_name =
                                store.data.selected_workflow_name
                            const prompt = toJS(store.data.current_prompt2)
                            const nodes_order = toJS(store.data.nodes_order)
                            const nodes_label = toJS(store.data.nodes_label)

                            saveWorkflowData(workflow_name, {
                                prompt,
                                nodes_order,
                                nodes_label,
                            })
                        }}
                    >
                        {store.data.can_edit_nodes
                            ? 'Done Editing'
                            : 'Edit Nodes'}
                    </button>
                </div>
                <div>
                    <sp-progressbar
                        class="pProgressBars preview_progress_bar"
                        max="100"
                        value={`${store.data.progress_value}`}
                    ></sp-progressbar>
                </div>
                <div>
                    <SpMenu
                        size="m"
                        title="workflows"
                        items={Object.keys(store.data.workflows2)}
                        label_item="Select a workflow"
                        selected_index={Object.values(
                            store.data.workflows2
                        ).indexOf(store.data.selected_workflow_name)}
                        onChange={async (id: any, value: any) => {
                            store.data.selected_workflow_name = value.item
                            loadWorkflow2(store.data.workflows2[value.item])
                        }}
                    ></SpMenu>{' '}
                    <button
                        className="btnSquare refreshButton"
                        id="btnResetSettings"
                        title="Refresh the ADetailer Extension"
                        onClick={async () => {
                            // await getConfig()
                        }}
                    ></button>
                </div>

                {store.data.object_info ? (
                    <>
                        <div>
                            {util
                                .getNodes(store.data.current_prompt2)
                                .sort(
                                    ([node_id1, node1], [node_id2, node2]) => {
                                        return (
                                            store.data.nodes_order.indexOf(
                                                node_id1
                                            ) -
                                            store.data.nodes_order.indexOf(
                                                node_id2
                                            )
                                        )
                                    }
                                )

                                .map(([node_id, node], index) => {
                                    return (
                                        <div
                                            key={`node_${node_id}_${index}`}
                                            style={{
                                                border: '2px solid #6d6c6c',
                                                borderColor:
                                                    store.data.last_moved ===
                                                    node_id
                                                        ? '#2c4639'
                                                        : void 0,
                                                padding: '3px',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: store.data
                                                        .can_edit_nodes
                                                        ? 'flex'
                                                        : 'none',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-end',
                                                }}
                                            >
                                                <div>
                                                    <button
                                                        id={`${node_id}_swap_up`}
                                                        style={{
                                                            width: '26px',
                                                        }}
                                                        className="btnSquare"
                                                        onClick={(e: any) => {
                                                            store.data.last_moved =
                                                                node_id
                                                            console.log(
                                                                'node_id assign to the swap button: ',
                                                                node_id
                                                            )
                                                            swap(
                                                                index,
                                                                index - 1
                                                            )

                                                            // setTimeout(() => {
                                                            //     // e.target.scrollIntoView()

                                                            //     ;(
                                                            //         document.getElementById(
                                                            //             `${node_id}_swap_up`
                                                            //         ) as any
                                                            //     ).scrollIntoView(
                                                            //         false
                                                            //     )
                                                            // }, 200)
                                                        }}
                                                    >
                                                        {' '}
                                                        {'▲'}{' '}
                                                    </button>
                                                </div>
                                                <div>
                                                    <button
                                                        id={`${node_id}_swap_down`}
                                                        style={{
                                                            width: '26px',
                                                        }}
                                                        className="btnSquare"
                                                        onClick={() => {
                                                            store.data.last_moved =
                                                                node_id
                                                            swap(
                                                                index,
                                                                index + 1
                                                            )
                                                            // setTimeout(() => {
                                                            //     ;(
                                                            //         document.getElementById(
                                                            //             `${node_id}_swap_down`
                                                            //         ) as any
                                                            //     ).scrollIntoView()
                                                            // }, 200)
                                                        }}
                                                    >
                                                        {' '}
                                                        {'▼'}{' '}
                                                    </button>
                                                    {/* <span ></span> */}
                                                </div>
                                            </div>
                                            <sp-label>
                                                "{node_id}":{' '}
                                                <span
                                                    style={{
                                                        color: store.data
                                                            .can_edit_nodes
                                                            ? 'white'
                                                            : void 0,
                                                    }}
                                                >
                                                    {
                                                        store.data.nodes_label[
                                                            node_id
                                                        ]
                                                    }
                                                </span>{' '}
                                            </sp-label>{' '}
                                            <sp-label
                                                style={{
                                                    display: store.data
                                                        .can_edit_nodes
                                                        ? void 0
                                                        : 'none',
                                                }}
                                            >
                                                {node.class_type}
                                            </sp-label>
                                            <div
                                                style={{
                                                    display: !store.data
                                                        .can_edit_nodes
                                                        ? 'none'
                                                        : void 0,
                                                }}
                                            >
                                                <sp-textfield
                                                    type="text"
                                                    placeholder="write a node label"
                                                    value={
                                                        store.data.nodes_label[
                                                            node_id
                                                        ]
                                                    }
                                                    onInput={(event: any) => {
                                                        store.data.nodes_label[
                                                            node_id
                                                        ] = event.target.value
                                                    }}
                                                ></sp-textfield>
                                            </div>
                                            {renderNode(node_id, node)}
                                            {/* <sp-divider
                                            class="line-divider"
                                            size="large"
                                        ></sp-divider>
                                        <sp-divider
                                            class="line-divider"
                                            size="large"
                                        ></sp-divider> */}
                                        </div>
                                    )
                                })}
                        </div>
                    </>
                ) : (
                    void 0
                )}
            </div>
        )
    }
}
const container = document.getElementById('ComfyUIContainer')!
const root = ReactDOM.createRoot(container)
root.render(
    //<React.StrictMode>
    <ErrorBoundary>
        <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
            <Collapsible defaultIsOpen={true} label={Locale('ComfyUI')}>
                {/* <ComfyNodeComponent></ComfyNodeComponent> */}

                <ComfyWorkflowComponent />
            </Collapsible>
        </div>
        {/* <ComfyNodeComponent></ComfyNodeComponent> */}
    </ErrorBoundary>
    //</React.StrictMode>
)
