const psapi = require('../psapi')

const layer_util = require('../utility/layer')
const general = require('./general')

const { executeAsModal } = require('photoshop').core
const batchPlay = require('photoshop').action.batchPlay
const formats = require('uxp').storage.formats
const storage = require('uxp').storage
const fs = storage.localFileSystem

async function isBlackAndWhiteImage(base64EncodedImage) {
    try {
        // Load your base64 encoded image
        const image = await Jimp.read(Buffer.from(base64EncodedImage, 'base64'))
        console.log(
            'isBlackAndWhiteImage(): image.bitmap.width, image.bitmap.height: ',
            image.bitmap.width,
            image.bitmap.height
        )
        // Check if your image only has one channel
        return (
            image.bitmap.width === image.bitmap.height &&
            image.bitmap.width === 1
        )
    } catch (e) {
        console.warn(e)
    }
}

async function convertBlackAndWhiteImageToRGBChannels(base64EncodedImage) {
    // Load your base64 encoded image
    const image = await Jimp.read(Buffer.from(base64EncodedImage, 'base64'))

    // Convert your black and white image to RGB channels
    image.color([
        { apply: 'red', params: [255] },
        { apply: 'green', params: [255] },
        { apply: 'blue', params: [255] },
    ])

    // Get your base64 encoded black and white image with RGB channels
    const base64EncodedImageWithRGBChannels = await image.getBase64Async(
        Jimp.MIME_JPEG
    )

    return base64EncodedImageWithRGBChannels
}
async function convertBlackAndWhiteImageToRGBChannels2(base64EncodedImage) {
    try {
        // Load your base64 encoded image
        const image = await Jimp.read(Buffer.from(base64EncodedImage, 'base64'))

        // Convert your black and white image to RGB channels
        image.color([{ apply: 'mix', params: ['#ffffff', 100] }])

        // Get your base64 encoded black and white image with RGB channels
        const base64EncodedImageWithRGBChannels = await image.getBase64Async(
            Jimp.MIME_JPEG
        )

        return base64EncodedImageWithRGBChannels
    } catch (e) {
        console.warn(e)
    }
}
async function convertBlackAndWhiteImageToRGBChannels3(base64EncodedImage) {
    try {
        // Load your base64 encoded image
        const image = await Jimp.read(Buffer.from(base64EncodedImage, 'base64'))

        // Convert your black and white image to RGB channels
        // image.color([{ apply: 'mix', params: ['#ffffff', 100] }])

        // Get your base64 encoded black and white image with RGB channels
        const base64EncodedImageWithRGBChannels = await image.getBase64Async(
            Jimp.MIME_PNG
        )

        return base64EncodedImageWithRGBChannels
    } catch (e) {
        console.warn(e)
    }
}

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
    // constructor() {}
    static async exportWebp(layer, export_width, export_height) {
        await executeAsModal(async () => {
            //we assume we have a valid layer rectangular image/layer, no transparency
            const doc_entry = await getCurrentDocFolder() //get the main document folder before we switch doc
            const layer_info = await layer_util.Layer.getLayerInfo(layer)
            //*) create a new document
            const new_doc = await IOHelper.createDocumentExe(
                export_width,
                export_height
            )
            const new_layer = await layer_util.Layer.duplicateToDoc(
                layer,
                new_doc
            )
            //*) resize the layer to the same dimension as the document

            await layer_util.Layer.scaleTo(
                new_layer,
                new_doc.width,
                new_doc.height
            ) //

            await layer_util.Layer.moveTo(new_layer, 0, 0) //move to the top left corner
            //
            await IOHelper.saveAsWebpExe(doc_entry) //save current document as .webp file, save it into doc_entry folder
            await new_doc.closeWithoutSaving()
        })
    }
    static async exportPng() {}
    static async exportDoc() {}
    static async exportLayer() {}

    static async base64PngToPngFile(
        base64_png,
        folder,
        image_name = 'temp_base64Png.png'
    ) {
        const arrayBuffer = _base64ToArrayBuffer(base64_png)

        // const folder = await storage.localFileSystem.getTemporaryFolder()

        const file = await folder.createFile(image_name, { overwrite: true })

        await file.write(arrayBuffer, { format: storage.formats.binary })
        return file
    }
    static async openImageFileAsDocument(file_entry) {
        const new_doc = await app.open(file_entry)
        return new_doc
    }
    static async base64PngToBase64Webp(base64_png) {
        let base64_webp
        try {
            await executeAsModal(async () => {
                try {
                    const main_doc_entry = await getCurrentDocFolder()
                    //save the base64_png to .png file
                    const temp_folder = await fs.getTemporaryFolder()
                    const png_file = await this.base64PngToPngFile(
                        base64_png,
                        temp_folder
                    )

                    //load the .png file as a layer in new document
                    const new_doc = await this.openImageFileAsDocument(png_file)
                    //save document as .webp
                    const [_, webp_file] = await IOHelper.saveAsWebpExe(
                        main_doc_entry
                    ) //save current document as .webp file, save it into doc_entry folder
                    await new_doc.closeWithoutSaving()
                    //load/read the .webp file as an arraybuffer
                    const ArrayBufferWebp = await webp_file.read({
                        format: formats.binary,
                    })

                    //convert the arraybuffer to base64Webp string

                    base64_webp = _arrayBufferToBase64(ArrayBufferWebp)
                } catch (e) {
                    console.warn(e)
                }
            })
            return base64_webp
        } catch (e) {
            console.warn(e)
        }
    }
    static async base64WebpFromFile(file_entry) {
        //file_entry most be .webp
        let webp_base64
        try {
            await executeAsModal(async () => {
                const arrayBuffer = await file_entry.read({
                    format: formats.binary,
                })
                console.log('webp arrayBuffer:', arrayBuffer)

                const base64_image = _arrayBufferToBase64(arrayBuffer) //convert the buffer to base64
                console.log('base64_image:', base64_image)
                webp_base64 = base64_image
            })
            return [webp_base64, webp_arrayBuffer]
        } catch (e) {
            console.warn(e)
        }
    }

    static async base64ToLayer(
        base64_png,
        image_name = 'base64_to_layer.png',
        to_x = 0,
        to_y = 0,
        width = 512,
        height = 512,
        format = 'png'
    ) {
        let layer
        if (format === 'png') {
            try {
                await executeAsModal(async (context) => {
                    // let history_id
                    // try {
                    //     history_id = await context.hostControl.suspendHistory({
                    //         documentID: app.activeDocument.id,
                    //         name: 'Place Image',
                    //     })
                    // } catch (e) {
                    //     console.warn(e)
                    // }

                    layer = await IOBase64ToLayer.base64PngToLayer(
                        base64_png,
                        image_name
                    )

                    await psapi.setVisibleExe(layer, true)
                    await layer_util.Layer.scaleTo(layer, width, height) //
                    await layer_util.Layer.moveTo(layer, to_x, to_y) //move to the top left corner
                    await psapi.setVisibleExe(layer, true)

                    // try {
                    //     await context.hostControl.resumeHistory(history_id)
                    // } catch (e) {
                    //     console.warn(e)
                    // }
                })
            } catch (e) {
                console.warn(e)
            }
        }
        return layer
    }

    static async getSelectionFromCanvasAsBase64Silent(
        selectionInfo,
        b_resize = false,
        resize_width = 0,
        resize_height = 0
    ) {
        //it will save the document then crop it so that only the selection area are left.
        //return arrayBuffer or base64Png?
        try {
            let file
            const folder = await fs.getTemporaryFolder()
            await executeAsModal(
                async () => {
                    const canvas_image_name = 'canvas_image.png'
                    file = await folder.createFile(canvas_image_name, {
                        overwrite: true,
                    })

                    const currentDocument = app.activeDocument
                    await currentDocument.saveAs.png(file, null, true)
                    //save file end

                    //read the saved image.png
                },

                { commandName: 'readPng' }
            )

            const arrayBuffer = await file.read({
                format: formats.binary,
            })

            // const selectionInfo = g_generation_session.selectionInfo
            // const selectionInfo = await psapi.getSelectionInfoExe()
            const cropped_base64_url = await IOHelper.cropPng(
                arrayBuffer,
                selectionInfo,
                true,
                resize_width,
                resize_height
            )
            const cropped_base64 = general.base64UrlToBase64(cropped_base64_url)

            // html_manip.setInitImageSrc(cropped_base64_url)
            return cropped_base64
        } catch (e) {
            console.warn(e)
        }
    }
    static async getSelectionFromCanvasAsBase64NonSilent(
        layer,
        image_name,
        width,
        height
    ) {
        try {
            const image_buffer = await psapi.newExportPng(
                layer,
                image_name,
                width,
                height
            )

            const base64_image = _arrayBufferToBase64(image_buffer) //convert the buffer to base64
            //send the base64 to the server to save the file in the desired directory
            // await sdapi.requestSavePng(base64_image, image_name)
            // await saveFileInSubFolder(base64_image, document_name, image_name)

            const { requestSavePng } = require('../sdapi_py_re')
            await requestSavePng(base64_image, image_name)
            return base64_image
        } catch (e) {
            console.warn(e)
        }
    }
    static async getSelectionFromCanvasAsBase64Interface(
        width,
        height,
        layer,
        selectionInfo,
        resize = true,
        use_silent_mode = true,
        image_name = 'temp.png'
    ) {
        let base64_image
        if (use_silent_mode) {
            base64_image = await this.getSelectionFromCanvasAsBase64Silent(
                selectionInfo,
                resize,
                width,
                height
            )
        } else {
            base64_image = await this.getSelectionFromCanvasAsBase64NonSilent(
                layer,
                image_name,
                width,
                height
            )
        }
        return base64_image
    }
    static async getSelectionFromCanvasAsBase64Interface_New(
        width,
        height,
        selectionInfo,
        resize = true,
        image_name = 'temp.png'
    ) {
        //use this version, it has less parameters
        const use_silent_mode = html_manip.getUseSilentMode()
        let layer = null
        if (!use_silent_mode) {
            await psapi.snapshot_layerExe()
            const snapshotLayer = await app.activeDocument.activeLayers[0]
            layer = snapshotLayer
        }
        let base64_image
        if (use_silent_mode) {
            base64_image = await this.getSelectionFromCanvasAsBase64Silent(
                selectionInfo,
                resize,
                width,
                height
            )
        } else {
            base64_image = await this.getSelectionFromCanvasAsBase64NonSilent(
                layer,
                image_name,
                width,
                height
            )
        }
        await layer_util.deleteLayers([layer]) //delete the snapshot layer if it exists
        return base64_image
    }

    static async urlToLayer(image_url, image_file_name = 'image_from_url.png') {
        try {
            await psapi.unselectActiveLayersExe()
            const temp_entry = await fs.getTemporaryFolder()
            await downloadItExe(image_url, temp_entry, image_file_name)
        } catch (e) {
            console.warn('urlToLayer()', image_url, image_file_name, e)
        }
    }
}

class IOHelper {
    static async saveAsWebp(doc_entry) {
        //doc_entry must be in dataFolder or tempFolder
        //save document as webp
        const document_id = app.activeDocument.id

        // doc_entry = await getCurrentDocFolder()
        const file_entry = await doc_entry.createFile('temp.webp', {
            overwrite: true,
        })

        const token = await fs.createSessionToken(file_entry)
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

        return [result, file_entry]
    }

    static async saveAsWebpExe(doc_entry) {
        let result
        let file_entry
        await executeAsModal(async () => {
            ;[result, file_entry] = await this.saveAsWebp(doc_entry)
        })
        return [result, file_entry]
    }
    static async createDocumentExe(width, height) {
        let new_doc
        try {
            await executeAsModal(async () => {
                new_doc = await app.documents.add({
                    width: width,
                    height: height,
                    resolution: await app.activeDocument.resolution,
                    mode: 'RGBColorMode',
                    fill: 'transparent',
                })
            })
        } catch (e) {
            console.warn(e)
        }
        return new_doc
    }
    static async cropPng(
        arrayBuffer,
        selectionInfo,
        b_resize = false,
        resize_width = 0,
        resize_height = 0
    ) {
        //crop png from array buffer
        //have the option to resize the after cropping

        const crop_x = selectionInfo.left
        const crop_y = selectionInfo.top
        const crop_w = selectionInfo.width
        const crop_h = selectionInfo.height
        const base64_url_result = await Jimp.read(arrayBuffer)
            .then(async (img) => {
                let cropped_img = await img.crop(
                    crop_x,
                    crop_y,
                    crop_w,
                    crop_h
                    // crop_w - 1,
                    // crop_h - 1
                )

                let resized_img
                if (b_resize) {
                    resized_img = await cropped_img.resize(
                        resize_width,
                        resize_height,
                        // Jimp.RESIZE_BILINEAR
                        // Jimp.RESIZE_NEAREST_NEIGHBOR
                        settings_tab_ts.store.data.scale_interpolation_method
                            .jimp
                    )
                } else {
                    resized_img = cropped_img
                }

                const base64_url = await resized_img.getBase64Async(
                    Jimp.MIME_PNG
                )

                // console.log('jimp: base64_url: ', base64_url)
                // document.getElementById("image").setAttribute("src", data);

                return base64_url
            })
            .catch((error) => {
                console.error(error)
            })
        return base64_url_result
    }
}

class IOBase64ToLayer {
    static {}
    static async base64PngToLayer(base64_png, image_name) {
        //unselect all layers so that the imported layer get place at the top of the document
        await psapi.unselectActiveLayersExe()

        const imported_layer = await base64ToFile(base64_png, image_name) //silent import into the document

        return imported_layer
    }
}
class IOFolder {
    static {}
    static async createSettingsFolder() {
        //create a folder named "Settings" in the DataFolder
        let settings_entry
        await executeAsModal(async () => {
            settings_entry = await this.createFolderSafe('Settings')
        })
        return settings_entry
    }
    static async findOrCreateFolderExe(folder_name) {
        //create a folder named "Settings" in the DataFolder
        let folder_entry
        await executeAsModal(async () => {
            folder_entry = await this.createFolderSafe(folder_name)
        })
        return folder_entry
    }

    static async doesFolderExist(folder_name) {
        //check if folder exist. return true if it does. false if it doesn't.
        const data_folder = await fs.getDataFolder()
        let b_exist = false
        let folder
        try {
            folder = await data_folder.getEntry(folder_name)
            b_exist = true
        } catch (e) {
            // console.warn(e)
            b_exist = false
        }
        return b_exist
    }

    static async createFolderSafe(folder_name) {
        //will always return a folder. it will create the folder if it doesn't exist.
        try {
            // const uuid = await getUniqueDocumentId()
            const data_folder = await fs.getDataFolder()

            let folder_entry
            try {
                folder_entry = await data_folder.getEntry(folder_name)
            } catch (e) {
                console.warn(e)
                //create document folder
                folder_entry = await data_folder.createFolder(folder_name)
            }

            return folder_entry
        } catch (e) {
            console.warn(e)
        }
    }

    static async getDocumentFolderNativePath() {
        try {
            const uuid = await getUniqueDocumentId()

            let doc_folder = await this.getDocFolder(uuid)
            const path = general.fixNativePath(doc_folder.nativePath)
            return path
        } catch (e) {
            console.warn(e)
        }
        return ''
    }

    static async getDocFolder(doc_uuid) {
        //will create folder if does not exist. always return a folder entry
        const doc_entry = await getDocFolder(doc_uuid)
        return doc_entry
    }
    static async getSettingsFolder() {
        //will create folder if does not exist. always return a folder entry
        const settings_entry = await this.createSettingsFolder()
        return settings_entry
    }
    static async getPresetFolder() {
        //will create folder if does not exist. always return a folder entry
        const preset_entry = await this.findOrCreateFolderExe('Preset')
        return preset_entry
    }
    static async getCustomPresetFolder(
        custom_preset_folder_name = 'custom_preset'
    ) {
        //will create folder if does not exist. always return a folder entry
        const preset_entry = await this.findOrCreateFolderExe(
            custom_preset_folder_name
        )
        return preset_entry
    }
    static async createFolderIfDoesNotExist(folder_name) {
        try {
            await executeAsModal(async () => {
                try {
                    const folder = await fs.getDataFolder()
                    const sub_folder = await folder.createFolder(folder_name)
                } catch (e) {
                    console.warn(e)
                }
            })
        } catch (e) {
            console.warn(e)
        }
    }
}

class IOLog {
    static {}
    static async saveLogToFile(json, file_name) {
        try {
            const plugin_folder = await fs.getDataFolder()
            const file = await plugin_folder.createFile(file_name, {
                type: storage.types.file,
                overwrite: true,
            })

            const JSONInPrettyFormat = JSON.stringify(json, undefined, 4)
            await file.write(JSONInPrettyFormat, {
                format: storage.formats.utf8,
                append: true,
            })
        } catch (e) {
            _warn(e)
        }
    }
}
class IOJson {
    static {}
    static async saveJsonToFile(json, folder_entry, file_name) {
        try {
            const file = await folder_entry.createFile(file_name, {
                type: storage.types.file,
                overwrite: true,
            })

            const JSONInPrettyFormat = JSON.stringify(json, undefined, 4)
            await file.write(JSONInPrettyFormat, {
                format: storage.formats.utf8,
                append: false,
            })
        } catch (e) {
            console.warn(e)
        }
    }

    static async saveJsonToFileExe(json, folder_entry, file_name) {
        await executeAsModal(async () => {
            await this.saveJsonToFile(json, folder_entry, file_name)
        })
    }
    static async loadJsonFromFile(folder_entry, file_name) {
        const json_file_name = file_name

        try {
            const json_entry = await folder_entry.getEntry(json_file_name)
            if (json_entry) {
                const json = JSON.parse(
                    await json_entry.read({
                        format: storage.formats.utf8,
                    })
                )
                return json
            }
        } catch (e) {
            console.warn(e)
        }
    }

    static async saveSettingsToFile(settings_json, settings_file_name) {
        await executeAsModal(async () => {
            const folder_entry = await IOFolder.getSettingsFolder('Settings')
            await this.saveJsonToFile(
                settings_json,
                folder_entry,
                settings_file_name
            )
        })
    }
    static async loadSettingsFromFile(settings_file_name) {
        const folder_entry = await IOFolder.getSettingsFolder('Settings')
        const settings_json = await this.loadJsonFromFile(
            folder_entry,
            settings_file_name
        )
        return settings_json
    }
    static async loadSessionIDFromFile(uuid) {
        try {
            // const uuid = await getUniqueDocumentId()
            const doc_entry = await getDocFolder(uuid)
            const json_data = await this.loadJsonFromFile(
                doc_entry,
                'session_id.json'
            )
            return json_data?.session_id ?? 0
        } catch (e) {
            console.error(e)
        }
    }
    static async saveSessionID(session_id, uuid) {
        const doc_entry = await getDocFolder(uuid)

        await executeAsModal(async () => {
            await this.saveJsonToFile(
                { session_id: session_id },
                doc_entry,
                'session_id.json'
            )
        })
    }

    static async saveHordeSettingsToFile(settings_json) {
        const settings_file_name = 'horde_settings.json'
        await this.saveSettingsToFile(settings_json, settings_file_name)
    }
    static async loadHordeSettingsFromFile() {
        const settings_file_name = 'horde_settings.json'
        const settings_json = await this.loadSettingsFromFile(
            settings_file_name
        )
        return settings_json
    }

    static async getJsonEntries(doc_entry) {
        let entries = await doc_entry.getEntries()
        const json_entries = entries.filter(
            (e) => e.isFile && e.name.toLowerCase().includes('.json') // must be a file and has the of the type .json
        )
        console.log('json_entries: ', json_entries)
        // .forEach((e) => console.log(e.name))
        return json_entries
    }
    static async deleteFile(doc_entry, file_name) {
        try {
            const file_entry = await doc_entry.getEntry(file_name)
            file_entry.delete()
        } catch (e) {}
    }
}

async function createThumbnail(base64Image, width = 100) {
    const image = await Jimp.read(Buffer.from(base64Image, 'base64'))
    image.resize(
        width,
        Jimp.AUTO,
        settings_tab_ts.store.data.scale_interpolation_method.jimp
    )
    const thumbnail = await image.getBase64Async(Jimp.MIME_PNG)
    return thumbnail
}

async function getImageFromCanvas() {
    const width = html_manip.getWidth()
    const height = html_manip.getHeight()
    const selectionInfo = await psapi.getSelectionInfoExe()
    const base64 = await io.IO.getSelectionFromCanvasAsBase64Interface_New(
        width,
        height,
        selectionInfo,
        true
    )
    return base64
}
async function getBase64FromJimp(jimp_image) {
    const dataURL = await jimp_image.getBase64Async(Jimp.MIME_PNG)
    const base64 = dataURL.replace(/^data:image\/png;base64,/, '')
    return base64
}

function transparentToMask(x, y, idx) {
    const alpha = this.bitmap.data[idx + 3]
    let color
    if (alpha === 0) {
        color = 0xffffffff
    } else if (alpha === 255) {
        color = 0x000000ff
    } else {
        color = Jimp.rgbaToInt(alpha, alpha, alpha, 255)
    }
    this.setPixelColor(color, x, y)
}
function inpaintTransparentToMask(x, y, idx) {
    const alpha = this.bitmap.data[idx + 3]
    let color
    // if (alpha === 0) {
    //     color = 0x000000ff
    // } else if (alpha === 255) {
    //     color = 0xffffffff
    // } else {
    //     color = Jimp.rgbaToInt(alpha, alpha, alpha, 255)
    // }

    if (alpha === 0) {
        color = 0x000000ff
    } else {
        color = 0xffffffff
    }
    this.setPixelColor(color, x, y)
}
function transparentToWhiteBackground(x, y, idx) {
    const alpha = this.bitmap.data[idx + 3]
    let color
    if (alpha === 0) {
        color = 0xffffffff
    } else {
        color = Jimp.rgbaToInt(
            this.bitmap.data[idx],
            this.bitmap.data[idx + 1],
            this.bitmap.data[idx + 2],
            255
        ) // remove transparency but keep the color, This is bad. used as workaround Auto1111 not able to handle alpha channels
    }
    this.setPixelColor(color, x, y)
}
async function getMask() {
    try {
        let b = app.activeDocument.backgroundLayer
        await executeAsModal(() => (b.visible = false))
        const base64 = await getImageFromCanvas()
        await executeAsModal(() => (b.visible = true))
        const jimp_image = await Jimp.read(Buffer.from(base64, 'base64'))

        const jimp_mask = await jimp_image.scan(
            0,
            0,
            jimp_image.bitmap.width,
            jimp_image.bitmap.height,
            transparentToMask
        )
        html_manip.setInitImageSrc(
            await jimp_mask.getBase64Async(Jimp.MIME_PNG)
        )
        const mask = await getBase64FromJimp(jimp_mask)
        return mask
    } catch (e) {
        console.warn(e)
    }
}

async function getImg2ImgInitImage() {
    //the init image will has transparent pixel in it
    //the mask will be a grayscale image/white and black
    try {
        let b = app.activeDocument.backgroundLayer
        await executeAsModal(() => (b.visible = false))
        const base64 = await getImageFromCanvas()
        await executeAsModal(() => (b.visible = true))
        const init_image = base64

        html_manip.setInitImageSrc(general.base64ToBase64Url(init_image)) // convert jimp_image to img.src data

        // console.log('mask: ', mask)
        return init_image
    } catch (e) {
        console.warn(e)
    }
}
async function getOutpaintInitImageAndMask() {
    //the init image will has transparent pixel in it
    //the mask will be a grayscale image/white and black
    try {
        let b = app.activeDocument.backgroundLayer
        await executeAsModal(() => (b.visible = false))
        const base64 = await getImageFromCanvas()
        await executeAsModal(() => (b.visible = true))
        const init_image = base64
        let jimp_init = await Jimp.read(Buffer.from(base64, 'base64'))

        let jimp_mask = await jimp_init
            .clone()
            .scan(
                0,
                0,
                jimp_init.bitmap.width,
                jimp_init.bitmap.height,
                transparentToMask
            )
        // jimp_init = await jimp_init.scan(
        //     0,
        //     0,
        //     jimp_init.bitmap.width,
        //     jimp_init.bitmap.height,
        //     transparentToWhiteBackground
        //     // transparentToMask
        // )
        html_manip.setInitImageMaskSrc(
            await jimp_mask.getBase64Async(Jimp.MIME_PNG)
        ) // convert jimp_image to img.src data
        html_manip.setInitImageSrc(
            await jimp_init.getBase64Async(Jimp.MIME_PNG)
        ) // convert jimp_image to img.src data

        const mask = await getBase64FromJimp(jimp_mask)
        // console.log('mask: ', mask)
        return {
            init_image,
            mask,
        }
    } catch (e) {
        console.warn(e)
    }
}

//generate black and white mask image from
async function getMaskFromCanvas() {
    try {
        await executeAsModal(async () => await layer_util.toggleActiveLayer()) //only white mark layer should be visible
        let mask_base64 = await getImageFromCanvas()
        await executeAsModal(async () => {
            await layer_util.toggleActiveLayer() // undo the toggling operation, active layer will be visible
            app.activeDocument.activeLayers[0].visible = false //hide the white mark
        })
        let jimp_mask = await Jimp.read(Buffer.from(mask_base64, 'base64')) //make jimp object
        jimp_mask = await jimp_mask.scan(
            0,
            0,
            jimp_mask.bitmap.width,
            jimp_mask.bitmap.height,
            inpaintTransparentToMask
        ) //convert transparent image to black and white image
        mask_base64 = await getBase64FromJimp(jimp_mask)
        return mask_base64
    } catch (e) {
        warn(e)
    }
}
async function getInpaintInitImageAndMask() {
    try {
        await executeAsModal(async () => await layer_util.toggleActiveLayer()) //only white mark layer should be visible
        const mask_base64 = await getImageFromCanvas()
        await executeAsModal(async () => {
            await layer_util.toggleActiveLayer() // undo the toggling operation, active layer will be visible
            app.activeDocument.activeLayers[0].visible = false //hide the white mark
        })
        const init_base64 = await getImageFromCanvas()

        let jimp_mask = await Jimp.read(Buffer.from(mask_base64, 'base64')) //make jimp object
        let jimp_init = await Jimp.read(Buffer.from(init_base64, 'base64')) //make jimp object, jimp_init will have transparent pixels, should we convert to white??

        jimp_mask = await jimp_mask.scan(
            0,
            0,
            jimp_mask.bitmap.width,
            jimp_mask.bitmap.height,
            inpaintTransparentToMask
        ) //convert transparent image to black and white image

        html_manip.setInitImageMaskSrc(
            await jimp_mask.getBase64Async(Jimp.MIME_PNG)
        )
        html_manip.setInitImageSrc(
            await jimp_init.getBase64Async(Jimp.MIME_PNG)
        )

        const mask = await getBase64FromJimp(jimp_mask)
        const init_image = await getBase64FromJimp(jimp_init)
        return { init_image, mask }
    } catch (e) {
        console.warn(e)
    }
}

async function saveFileInSubFolder(b64Image, sub_folder_name, file_name) {
    // const b64Image =
    //     'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC'

    const img = _base64ToArrayBuffer(b64Image)

    // const img_name = 'temp_output_image.png'
    const img_name = file_name
    const folder = await storage.localFileSystem.getDataFolder()
    const documentFolderName = sub_folder_name
    let documentFolder
    try {
        documentFolder = await folder.getEntry(documentFolderName)
    } catch (e) {
        console.warn(e)
        //create document folder
        documentFolder = await folder.createFolder(documentFolderName)
    }

    console.log('documentFolder.nativePath: ', documentFolder.nativePath)
    const file = await documentFolder.createFile(img_name, { overwrite: true })

    await file.write(img, { format: storage.formats.binary })

    const token = await storage.localFileSystem.createSessionToken(file) // batchPlay requires a token on _path
}
//REFACTOR: move to document.js
async function saveJsonFileInSubFolder(json, sub_folder_name, file_name) {
    // const b64Image =
    //     'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC'

    // const img_name = 'temp_output_image.png'

    const json_file_name = file_name

    const folder = await storage.localFileSystem.getDataFolder()
    const documentFolderName = sub_folder_name
    let documentFolder
    try {
        documentFolder = await folder.getEntry(documentFolderName)
    } catch (e) {
        console.warn(e)
        //create document folder
        documentFolder = await folder.createFolder(documentFolderName)
    }

    console.log('documentFolder.nativePath: ', documentFolder.nativePath)
    const file = await documentFolder.createFile(json_file_name, {
        type: storage.types.file,
        overwrite: true,
    })

    const JSONInPrettyFormat = JSON.stringify(json, undefined, 4)
    await file.write(JSONInPrettyFormat, {
        format: storage.formats.utf8,
        append: false,
    })

    const token = await storage.localFileSystem.createSessionToken(file) // batchPlay requires a token on _path
}
async function fixTransparentEdges(base64) {
    function transparentToOpaque(x, y, idx) {
        const alpha = this.bitmap.data[idx + 3]
        if (alpha > 0 && alpha < 255) {
            this.bitmap.data[idx + 3] = 0 //make semi transparent pixels completely transparent
        }
    }

    try {
        let jimp_img = await Jimp.read(Buffer.from(base64, 'base64'))

        jimp_img = await jimp_img.scan(
            0,
            0,
            jimp_img.bitmap.width,
            jimp_img.bitmap.height,
            transparentToOpaque
        )
        const opaque_base64 = await getBase64FromJimp(jimp_img)
        return opaque_base64
    } catch (e) {
        console.warn(e)
    }
}

async function maskFromInitImage(base64) {
    function setTransparentToBlack(x, y, idx) {
        let alpha = this.bitmap.data[idx + 3]
        if (alpha !== 0) {
            this.bitmap.data[idx] = 0
            this.bitmap.data[idx + 1] = 0
            this.bitmap.data[idx + 2] = 0
            this.bitmap.data[idx + 3] = 255
        } else {
            //alpha === 0

            this.bitmap.data[idx] = 255
            this.bitmap.data[idx + 1] = 255
            this.bitmap.data[idx + 2] = 255
            this.bitmap.data[idx + 3] = 255
        }
    }

    try {
        let jimp_img = await Jimp.read(Buffer.from(base64, 'base64'))

        jimp_img = await jimp_img.scan(
            0,
            0,
            jimp_img.bitmap.width,
            jimp_img.bitmap.height,
            setTransparentToBlack
        )
        const mask_base64 = await getBase64FromJimp(jimp_img)
        return mask_base64
    } catch (e) {
        console.warn(e)
    }
}
async function fixMaskEdges(base64) {
    function grayScaleToBlack(x, y, idx) {
        if (
            this.bitmap.data[idx] !== 255 ||
            this.bitmap.data[idx + 1] !== 255 ||
            this.bitmap.data[idx + 2] !== 255
        ) {
            this.bitmap.data[idx] = 0
            this.bitmap.data[idx + 1] = 0
            this.bitmap.data[idx + 2] = 0
        }
    }

    try {
        let jimp_img = await Jimp.read(Buffer.from(base64, 'base64'))

        jimp_img = await jimp_img.scan(
            0,
            0,
            jimp_img.bitmap.width,
            jimp_img.bitmap.height,
            grayScaleToBlack
        )
        const opaque_base64 = await getBase64FromJimp(jimp_img)
        return opaque_base64
    } catch (e) {
        console.warn(e)
    }
}

async function getUniqueDocumentId() {
    try {
        let uniqueDocumentId = await psapi.readUniqueDocumentIdExe()

        console.log(
            'getUniqueDocumentId():  uniqueDocumentId: ',
            uniqueDocumentId
        )

        // Regular expression to check if string is a valid UUID
        const regexExp =
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi

        // String with valid UUID separated by dash
        // const str = 'a24a6ea4-ce75-4665-a070-57453082c256'

        const isValidId = regexExp.test(uniqueDocumentId) // true
        console.log('isValidId: ', isValidId)
        if (isValidId == false) {
            let uuid = self.crypto.randomUUID()
            console.log(uuid) // for example "36b8f84d-df4e-4d49-b662-bcde71a8764f"
            await psapi.saveUniqueDocumentIdExe(uuid)
            uniqueDocumentId = uuid
        }
        return uniqueDocumentId
    } catch (e) {
        console.warn('warning Document Id may not be valid', e)
    }
}
async function getImageSize(base64) {
    const image = await Jimp.read(Buffer.from(base64, 'base64'))
    const width = image.bitmap.width
    const height = image.bitmap.height
    return { width, height }
}
async function convertGrayscaleToMonochrome(base64) {
    function grayToMonoPixel(x, y, idx) {
        // convert any grayscale value to white, resulting in black and white image

        // if (this.bitmap.data[idx] > 0) {
        //     this.bitmap.data[idx] = 255
        // }
        // if (this.bitmap.data[idx + 1] > 0) {
        //     this.bitmap.data[idx + 1] = 255
        // }
        // if (this.bitmap.data[idx + 2] > 0) {
        //     this.bitmap.data[idx + 2] = 255
        // }
        let color
        if (
            this.bitmap.data[idx] !== 0 &&
            this.bitmap.data[idx + 1] !== 0 &&
            this.bitmap.data[idx + 2] !== 0
        ) {
            color = 0xffffffff
        } else {
            color = 0x000000ff
        }
        this.setPixelColor(color, x, y)
    }
    try {
        const jimp_image = await Jimp.read(Buffer.from(base64, 'base64'))

        const jimp_mask = await jimp_image.scan(
            0,
            0,
            jimp_image.bitmap.width,
            jimp_image.bitmap.height,
            grayToMonoPixel
        )
        const base64_monochrome_mask = await getBase64FromJimp(jimp_mask)
        return base64_monochrome_mask
    } catch (e) {
        console.warn(e)
    }
}

async function convertBlackToTransparentKeepBorders(
    base64,
    b_borders_or_corners = enum_ts.MaskModeEnum.Transparent // false for borders, true for corners
) {
    try {
        let jimp_mask = await Jimp.read(Buffer.from(base64, 'base64'))

        const width = jimp_mask.bitmap.width
        const height = jimp_mask.bitmap.height
        jimp_mask = await jimp_mask.scan(
            0,
            0,
            width,
            height,
            function (x, y, idx) {
                if (b_borders_or_corners === enum_ts.MaskModeEnum.Borders) {
                    // keep borders
                    if (
                        x === 0 ||
                        y === 0 ||
                        x === width - 1 ||
                        y === height - 1
                    )
                        return
                } else if (
                    b_borders_or_corners === enum_ts.MaskModeEnum.Corners
                ) {
                    // keep corners
                    if (
                        (x === 0 && y === 0) ||
                        (x === 0 && y === height - 1) ||
                        (x === width - 1 && y === 0) ||
                        (x === width - 1 && y === height - 1)
                    )
                        return
                }

                const red = this.bitmap.data[idx + 0]
                const green = this.bitmap.data[idx + 1]
                const blue = this.bitmap.data[idx + 2]
                if (red === 0 && green === 0 && blue === 0) {
                    this.bitmap.data[idx + 3] = 0
                }
            }
        )
        const base64_mask = await getBase64FromJimp(jimp_mask)
        return base64_mask
    } catch (e) {
        console.warn(e)
    }
}

async function deleteFileIfLargerThan(file_name, size_mb = 200) {
    // const file = await fs.getEntry('path/to/file.txt')
    try {
        const plugin_folder = await fs.getDataFolder()
        try {
            var file = await plugin_folder.getEntry(file_name)
        } catch (e) {
            _warn(e)
        }
        if (file) {
            const contents = await file.read({ format: storage.formats.binary })
            //  storage.formats.utf8
            const fileSizeInBytes = contents.byteLength
            const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)

            if (fileSizeInMegabytes > size_mb) {
                await fs.removeEntry(file)
            }
        }
    } catch (e) {
        // console.warn(e)
        _warn(e)
    }
}
module.exports = {
    IO,
    snapShotLayerExe,
    IOHelper,
    IOJson,
    IOFolder,
    IOLog,
    convertBlackAndWhiteImageToRGBChannels,
    convertBlackAndWhiteImageToRGBChannels2,
    convertBlackAndWhiteImageToRGBChannels3,
    isBlackAndWhiteImage,
    createThumbnail,
    getMask,
    getOutpaintInitImageAndMask,
    getInpaintInitImageAndMask,
    getImg2ImgInitImage,
    saveFileInSubFolder,
    saveJsonFileInSubFolder,
    fixTransparentEdges,
    fixMaskEdges,
    maskFromInitImage,
    getImageFromCanvas,
    getUniqueDocumentId,
    getImageSize,
    convertGrayscaleToMonochrome,
    deleteFileIfLargerThan,
    getMaskFromCanvas,
    convertBlackToTransparentKeepBorders,
}
