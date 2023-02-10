const batchPlay = require('photoshop').action.batchPlay
const psapi = require('../psapi')
async function snapShotLayer() {
    //snapshot layer with no mask
    let command = [
        // Select All Layers current layer
        {
            _obj: 'selectAllLayers',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
        },
        // Duplicate current layer
        // {"ID":[459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513],"_obj":"duplicate","_target":[{"_enum":"ordinal","_ref":"layer","_value":"targetEnum"}],"version":5},
        {
            // ID: ids,
            _obj: 'duplicate',
            _target: [
                { _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' },
            ],
            // version: 5
        },

        // Merge Layers
        { _obj: 'mergeLayersNew' },
        // Make
        {
            _obj: 'make',
            at: { _enum: 'channel', _ref: 'channel', _value: 'mask' },
            new: { _class: 'channel' },
            using: { _enum: 'userMaskEnabled', _value: 'revealSelection' },
        },
        // Set Selection
        {
            _obj: 'set',
            _target: [{ _property: 'selection', _ref: 'channel' }],
            to: { _enum: 'ordinal', _ref: 'channel', _value: 'targetEnum' },
        },
        //make a group
        {
            _obj: 'make',
            _target: [
                {
                    _ref: 'layerSection',
                },
            ],
            from: {
                _ref: 'layer',
                _enum: 'ordinal',
                _value: 'targetEnum',
            },
            layerSectionStart: 512,
            layerSectionEnd: 513,
            name: 'Group 2',
            _options: {
                dialogOptions: 'dontDisplay',
            },
        },
        {
            _obj: 'mergeLayersNew',
            _options: {
                dialogOptions: 'dontDisplay',
            },
        },
    ]

    const result = await batchPlay(command, {
        synchronousExecution: true,
        modalBehavior: 'execute',
    })

    return result
}

async function snapShotLayerExe() {
    await executeAsModal(async () => {
        //create a fill layer above the background layer, so that it's present in the snapshot
        try {
            const selectionInfo = await psapi.getSelectionInfoExe()

            // const backgroundLayer = await app.activeDocument.backgroundLayer

            await psapi.createSolidLayer(255, 255, 255)
            const solid_layer = await app.activeDocument.activeLayers[0]
            // await psapi.unSelectMarqueeExe()//unselect the

            // await solid_layer.moveAbove(backgroundLayer)
            // await snapShotLayer() //create a layer with only the opaque pixels
            // await psapi.reSelectMarqueeExe(selectionInfo)
            // await solid_layer.delete()
        } catch (e) {
            console.warn(e)
        }
    })
    await executeAsModal(async () => {
        //create a fill layer above the background layer, so that it's present in the snapshot
        try {
            const solid_layer = await app.activeDocument.activeLayers[0]
            const backgroundLayer = await app.activeDocument.backgroundLayer
            await solid_layer.moveAbove(backgroundLayer)
            await psapi.unselectActiveLayersExe()
            await snapShotLayer() //create a layer with only the opaque pixels
            // await psapi.reSelectMarqueeExe(selectionInfo)
            // await psapi.unSelectMarqueeExe()//unselect the
            await solid_layer.delete()
        } catch (e) {
            console.warn(e)
        }
    })
}

class IO {
    constructor() {
        this.io_helper = new IOHelper()
    }
    async exportWebp() {
        //*) snapshot the current visible layers of the document
        //*)
        //create a new document
        //
        await this.io_helper.saveAsWebpExe() //save current document as .webp file
    }
    async exportPng() {}
    async exportDoc() {}
    async exportLayer() {}
}

class IOHelper {
    constructor() {}

    async saveAsWebp() {
        const document_id = app.activeDocument.id

        doc_entery = await getCurrentDocFolder()
        file_entery = await doc_entery.createFile('temp.webp', {
            overwrite: true,
        })
        const token = await fs.createSessionToken(file_entery)
        const result = await batchPlay(
            [
                {
                    _obj: 'save',
                    as: {
                        _obj: 'WebPFormat',
                        compression: {
                            _enum: 'WebPCompression',
                            _value: 'compressionLossless',
                        },
                        includeXMPData: false,
                        includeEXIFData: false,
                        includePsExtras: false,
                    },
                    in: {
                        _path: token,
                        _kind: 'local',
                    },
                    documentID: 59,
                    copy: true,
                    lowerCase: true,
                    saveStage: {
                        _enum: 'saveStageType',
                        _value: 'saveBegin',
                    },
                    _options: {
                        dialogOptions: 'dontDisplay',
                    },
                },
            ],
            {
                synchronousExecution: true,
                modalBehavior: 'execute',
            }
        )

        return result
    }

    async saveAsWebpExe() {
        await executeAsModal(async () => {
            await saveAsWebp()
        })
    }
}

module.exports = {
    IO,
    snapShotLayerExe,
}
