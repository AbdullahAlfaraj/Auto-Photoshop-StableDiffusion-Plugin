import { app, core, action } from 'photoshop'
import { layer_util, psapi } from '../oldSystem'
// import { settings_tab_ts } from '../../entry'
import * as settings_tab_ts from '../../settings/settings'
const executeAsModal = core.executeAsModal
const { batchPlay } = action

export interface RectArea {
    top: number
    left: number
    height: number
    width: number
}

async function transformBatchPlay(
    centerX: number,
    centerY: number,
    scaleRatioX: number,
    scaleRatioY: number,
    translateX: number,
    translateY: number
) {
    const setInterpolationMethodDesc = {
        _obj: 'set',
        _target: [
            {
                _ref: 'property',
                _property: 'generalPreferences',
            },
            {
                _ref: 'application',
                _enum: 'ordinal',
                _value: 'targetEnum',
            },
        ],
        to: {
            _obj: 'generalPreferences',
            interpolationMethod: {
                _enum: 'interpolationType',
                // _value: 'bilinear',
                _value: settings_tab_ts.store.data.scale_interpolation_method
                    .photoshop,
            },
        },
        _isCommand: true,
    }

    let imageSizeDescriptor = {
        _obj: 'transform',
        _target: [
            {
                _ref: 'layer',
                _enum: 'ordinal',
                _value: 'targetEnum',
            },
        ],
        freeTransformCenterState: {
            _enum: 'quadCenterState',
            _value: 'QCSIndependent',
        },
        position: {
            _obj: 'paint',
            horizontal: { _unit: 'pixelsUnit', _value: centerX },
            vertical: { _unit: 'pixelsUnit', _value: centerY },
        },
        offset: {
            _obj: 'offset',
            horizontal: {
                _unit: 'pixelsUnit',
                _value: translateX,
            },
            vertical: {
                _unit: 'pixelsUnit',
                _value: translateY,
            },
        },
        width: {
            _unit: 'percentUnit',
            _value: scaleRatioX,
        },
        height: {
            _unit: 'percentUnit',
            _value: scaleRatioY,
        },
        linked: true,
        interfaceIconFrameDimmed: {
            _enum: 'interpolationType',
            // _value: 'bilinear',
            _value: settings_tab_ts.store.data.scale_interpolation_method
                .photoshop,
        },
        _isCommand: true,
    }
    return batchPlay([setInterpolationMethodDesc, imageSizeDescriptor], {
        synchronousExecution: true,
        modalBehavior: 'execute',
    })
}

export async function transformCurrentLayerTo(
    toRect: RectArea,
    fromRect: RectArea
) {
    const selection_info = await psapi.getSelectionInfoExe()
    await psapi.unSelectMarqueeExe()

    const scale_x_ratio = (toRect.width / fromRect.width) * 100
    const scale_y_ratio = (toRect.height / fromRect.height) * 100

    const top_dist = toRect.top - fromRect.top
    const left_dist = toRect.left - fromRect.left
    console.log(
        'transformCurrentLayer',
        top_dist,
        left_dist,
        scale_x_ratio,
        scale_y_ratio
    )

    await executeAsModal(
        () =>
            transformBatchPlay(
                fromRect.left,
                fromRect.top,
                scale_x_ratio,
                scale_y_ratio,
                left_dist,
                top_dist
            ),
        { commandName: 'transform' }
    )

    await psapi.reSelectMarqueeExe(selection_info)
}
