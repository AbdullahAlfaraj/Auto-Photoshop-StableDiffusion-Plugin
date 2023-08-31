import { observable, reaction } from 'mobx'
import { SelectionInfoType } from '../util/ts/enum'
type ResizeMode = 'Just Resize' | 'Crop and Resize' | 'Resize and Fill'
export const controlnetModes = [
    'Balanced',
    'My prompt is more important',
    'ControlNet is more important',
] as const
export type ControlnetMode = (typeof controlnetModes)[number]
export const DefaultControlNetUnitData = {
    enabled: false,
    input_image: '',
    mask: '',
    detect_map: '',
    module: '',
    model: '',
    weight: 1.0,
    resize_mode: 'Crop and Resize' as ResizeMode,
    lowvram: true,
    processor_res: 512,
    threshold_a: 0,
    threshold_b: 0,

    guidance_start: 0,
    guidance_end: 1,
    guessmode: false,

    control_mode: 'Balanced' as ControlnetMode,
    pixel_perfect: true,
    auto_image: true,
}

export const DefaultPresetControlNetUnitData = {
    enabled: false,
    // input_image: '',
    // mask: '',
    // detect_map: '',
    module: 'none',
    model: 'None',
    filter_keyword: 'All',
    weight: 1.0,

    resize_mode: 'Crop and Resize' as ResizeMode,

    lowvram: true,

    processor_res: 512,
    threshold_a: 0,
    threshold_b: 0,

    guidance_start: 0,
    guidance_end: 1,
    guessmode: false,

    control_mode: 'Balanced' as ControlnetMode,
    pixel_perfect: true,
    auto_image: true,
}

export interface controlNetUnitData {
    enabled: boolean
    input_image: string
    mask: string
    detect_map: string
    module_list: string[]
    model_list: string[]
    module: string
    model: string
    filter_keyword: string
    weight: number
    resize_mode: ResizeMode
    lowvram: boolean
    processor_res: number
    threshold_a: number
    threshold_b: number

    guidance_start: number
    guidance_end: number
    guessmode: boolean

    control_mode: ControlnetMode
    pixel_perfect: boolean
    auto_image: boolean // sync CtrlNet image with sd input image
    selection_info: SelectionInfoType
}
interface ControlNetMobxStore {
    disableControlNetTab: boolean
    maxControlNet: number
    controlnetApiVersion: number

    supportedModels: string[]
    supportedPreprocessors: string[]
    filterKeywords: string[]
    preprocessorDetail: { [key: string]: any }

    controlNetUnitData: controlNetUnitData[]
}

var ControlNetStore = observable<ControlNetMobxStore>({
    disableControlNetTab: false,
    maxControlNet: 0,
    controlnetApiVersion: 1,

    supportedModels: [],
    supportedPreprocessors: [],
    filterKeywords: [],
    preprocessorDetail: {},

    controlNetUnitData: [],
})

reaction(
    () => {
        return ControlNetStore.controlNetUnitData.map((data) => data.module)
    },
    (module_, index) => {
        ControlNetStore.controlNetUnitData.forEach((data, index) => {
            const pd = ControlNetStore.preprocessorDetail[module_[index]] || {}
            const pSlider = pd.sliders || []
            data.processor_res = pSlider[0]?.value || 512
            data.threshold_a = pSlider[1]?.value || 0
            data.threshold_b = pSlider[2]?.value || 0
        })
    }
)
reaction(
    () => ControlNetStore.maxControlNet,
    (maxControlNet) => {
        ControlNetStore.controlNetUnitData = Array(maxControlNet)
            .fill(0)
            .map((v, index) => {
                return (
                    ControlNetStore.controlNetUnitData[index] ||
                    DefaultControlNetUnitData
                )
            })
    }
)

export default ControlNetStore
