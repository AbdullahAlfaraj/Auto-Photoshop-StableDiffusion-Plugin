
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
