import { app, core, action } from 'photoshop'
import { layer_util, psapi } from '../oldSystem'
const executeAsModal = core.executeAsModal
const batchPlay = action.batchPlay

enum DocumentTypeEnum {
    NoBackground = 'no_background',
    ImageBackground = 'image_background',
    SolidBackground = 'solid_background',
    ArtBoard = 'artboard',
}

async function isCorrectBackground() {
    const historylist = app.activeDocument.historyStates.filter(
        (h) => h.name === 'Correct Background'
    )
    console.log('historylist:', historylist)
    const is_correct_background = historylist.length > 0 ? true : false
    return is_correct_background
}

async function getColor(X: any, Y: any) {
    // const background_layer_id = await app.activeDocument.backgroundLayer.id

    try {
        const result = await batchPlay(
            [
                {
                    _obj: 'colorSampler',
                    _target: {
                        _ref: 'document',
                        _enum: 'ordinal',
                        _value: 'targetEnum',
                    },
                    samplePoint: {
                        horizontal: X,
                        vertical: Y,
                    },
                },
            ],
            {}
        )

        const red = result[0].colorSampler.red
        const green = result[0].colorSampler.grain
        const blue = result[0].colorSampler.blue

        return [red, green, blue]
    } catch (e) {
        console.warn(e)
    }
}

//REFACTOR: move to document.js
async function findDocumentType() {
    //check if the background layer exsit
    //if it doesn't return false
    //if it does:
    //duplicate the background layer and place it on the top of the document.
    //sampler 10 random pixles
    //and check if all the pixels has the same values.
    //if it doesn't duplicate the background layer and place it above the background layer.
    // make a white background layer.
    //return true

    let document_type
    const background_layer = await app.activeDocument.backgroundLayer
    const has_background_layer = app.activeDocument.backgroundLayer
        ? true
        : false
    const artboards = Array.from(await app.activeDocument.artboards)
    if (artboards.length > 0) {
        document_type = DocumentTypeEnum['ArtBoard']
        // } else if (layer_util.Layer.doesLayerExist(background_layer)) {
    } else if (has_background_layer) {
        //assume it's solid white background if correctHistory > 1 || layers.length > 5
        const b_correct_background = await isCorrectBackground() // check the history for correct operation
        if (b_correct_background) {
            document_type = DocumentTypeEnum['SolidBackground']
        } else {
            //else

            //background layer does exist
            //check if it's solid color background or an image background
            //sampler 10 random pixels
            let width = app.activeDocument.width
            let height = app.activeDocument.height
            let old_rgb: any
            let same_color = true

            await executeAsModal(
                async () => {
                    if (app.activeDocument.layers.length > 1) {
                        await layer_util.toggleBackgroundLayerExe() // hide all layers except the background layer
                    }
                    for (let i = 0; i < 10; ++i) {
                        let x = Math.floor(Math.random() * width)
                        let y = Math.floor(Math.random() * height)

                        const rgb = (await getColor(x, y))!
                        if (old_rgb) {
                            if (
                                Math.round(old_rgb[0]) === Math.round(rgb[0]) &&
                                Math.round(old_rgb[1]) === Math.round(rgb[1]) &&
                                Math.round(old_rgb[2]) === Math.round(rgb[2])
                            ) {
                            } else {
                                same_color = false //it's an image background
                                break
                            }
                        }
                        old_rgb = rgb
                    }
                    if (app.activeDocument.layers.length > 1) {
                        await layer_util.toggleBackgroundLayerExe() // undo the toggle operation; display all layers
                    }
                },
                {
                    commandName: 'Checking Document Type...',
                }
            )

            document_type = same_color
                ? DocumentTypeEnum['SolidBackground']
                : DocumentTypeEnum['ImageBackground']
        }
    } else {
        //create the background layer since it doesn't exsit
        document_type = DocumentTypeEnum['NoBackground']
    }

    return document_type
}

async function correctDocumentType(documentType: any) {
    if (documentType === DocumentTypeEnum['SolidBackground']) {
        //do nothing
    } else if (documentType === DocumentTypeEnum['ImageBackground']) {
        //duplicate the layer
        await executeAsModal(
            async () => {
                const image_layer: any =
                    await app.activeDocument.backgroundLayer!.duplicate() //
                image_layer.name = 'Image'
                await app.activeDocument.backgroundLayer!.delete()
                await layer_util.createBackgroundLayer(255, 255, 255)
            },
            {
                commandName: 'Correct Background',
            }
        )
    } else if (documentType === DocumentTypeEnum['ArtBoard']) {
        //duplicate the layer
        await app.showAlert(
            "the plugin doesn't work with artboards, create normal document with no artboard to use the plugin"
        )
        throw "the plugin doesn't work with artboards, create normal document with no artboard to use the plugin"
    } else if (documentType === DocumentTypeEnum['NoBackground']) {
        await layer_util.createBackgroundLayer(255, 255, 255)
    }
}

export async function initializeBackground() {
    await executeAsModal(
        async (context) => {
            const document_type = await findDocumentType()

            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id, //TODO: change this to the session document id
                name: 'Correct Background',
            })
            //store selection
            //store active layer
            const selectionInfo = await psapi.getSelectionInfoExe()
            await psapi.unSelectMarqueeExe()
            const active_layers = app.activeDocument.activeLayers

            //1)check if the documnet has a background layer

            await correctDocumentType(document_type)

            //retore selection
            //restore active layer
            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.selectLayersExe(active_layers)
            await context.hostControl.resumeHistory(history_id)
        },
        {
            commandName: 'Initialize Background',
        }
    )
}
