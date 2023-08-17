import { moveImageToLayer, moveImageToLayer_old } from './io'
import { io, layer_util, psapi } from '../oldSystem'

import { action, core } from 'photoshop'
import { MaskModeEnum } from './enum'
import { session_store } from '../../stores'
const executeAsModal = core.executeAsModal
const batchPlay = action.batchPlay

export async function applyMaskFromBlackAndWhiteImage(
    black_and_white_base64: string,
    layer_id: any,
    selectionInfo: any,
    b_borders_or_corners: MaskModeEnum = MaskModeEnum.Transparent,
    expand_by = 10
) {
    let mask_layer
    try {
        const transparent_mask_base64 =
            await io.convertBlackToTransparentKeepBorders(
                black_and_white_base64,
                b_borders_or_corners
            )
        mask_layer = await moveImageToLayer(
            transparent_mask_base64,
            selectionInfo
        )

        let cmd = [
            {
                _obj: 'select',
                _target: [{ _id: mask_layer.id, _ref: 'layer' }],
                makeVisible: false,
            },
            {
                _obj: 'set',
                _target: [
                    {
                        _ref: 'channel',
                        _property: 'selection',
                    },
                ],
                to: {
                    _ref: 'channel',
                    _enum: 'channel',
                    _value: 'transparencyEnum',
                },
                _isCommand: true,
            },
            {
                _obj: 'expand',
                by: {
                    _unit: 'pixelsUnit',
                    _value: expand_by,
                },
                selectionModifyEffectAtCanvasBounds: true,
                _isCommand: true,
            },
            {
                _obj: 'select',
                _target: [{ _id: layer_id, _ref: 'layer' }],

                makeVisible: false,
            },
            {
                _obj: 'make',
                new: {
                    _class: 'channel',
                },
                at: {
                    _ref: 'channel',
                    _enum: 'channel',
                    _value: 'mask',
                },
                using: {
                    _enum: 'userMaskEnabled',
                    _value: 'revealSelection',
                },
                _isCommand: true,
            },
        ]
        //@ts-ignore
        // await timer(g_timer_value)
        await executeAsModal(
            async () => {
                const result = await batchPlay(cmd, {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                })
            },
            {
                commandName: 'select opaque pixels',
            }
        )
    } catch (e) {
        console.error(e)
    } finally {
        await layer_util.deleteLayers([mask_layer])
    }
}

export async function selectionFromBlackAndWhiteImage(
    black_and_white_base64: string,
    selectionInfo: any,
    b_borders_or_corners: MaskModeEnum = MaskModeEnum.Transparent
) {
    let mask_layer
    try {
        const transparent_mask_base64 =
            await io.convertBlackToTransparentKeepBorders(
                black_and_white_base64,
                b_borders_or_corners
            )
        mask_layer = await moveImageToLayer(
            transparent_mask_base64,
            selectionInfo
        )

        let cmd = [
            {
                _obj: 'select',
                _target: [{ _id: mask_layer.id, _ref: 'layer' }],
                makeVisible: false,
            },
            {
                _obj: 'set',
                _target: [
                    {
                        _ref: 'channel',
                        _property: 'selection',
                    },
                ],
                to: {
                    _ref: 'channel',
                    _enum: 'channel',
                    _value: 'transparencyEnum',
                },
                _isCommand: true,
            },
        ]
        //@ts-ignore
        // await timer(g_timer_value)
        await executeAsModal(
            async () => {
                const result = await batchPlay(cmd, {
                    synchronousExecution: true,
                    modalBehavior: 'execute',
                })
            },
            {
                commandName: 'select opaque pixels',
            }
        )
    } catch (e) {
        console.error(e)
    } finally {
        await layer_util.deleteLayers([mask_layer])
    }
}

export async function activateSessionSelectionArea() {
    try {
        if (psapi.isSelectionValid(session_store.data.selectionInfo)) {
            await psapi.reSelectMarqueeExe(session_store.data.selectionInfo)
            //@ts-ignore
            await eventHandler()
        }
    } catch (e) {
        console.warn(e)
    }
}
