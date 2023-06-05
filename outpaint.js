const app = window.require('photoshop').app

const batchPlay = require('photoshop').action.batchPlay
const psapi = require('./psapi')

async function moveLayersToGroup(group_id) {
    const activeLayers = await app.activeDocument.activeLayers
    const layerIDs = activeLayers.map((layer) => layer.id)
    const { executeAsModal } = require('photoshop').core
    await executeAsModal(async () => {
        await psapi.moveToGroupCommand(group_id, layerIDs)
    })
}

async function createSnapshot() {
    const { executeAsModal } = require('photoshop').core
    //get all layers,
    //duplicate the layers
    //create a group
    //move the duplicate layers to the group
    let snapshotLayer, snapshotGroup
    try {
        const selectionInfo = await psapi.getSelectionInfoExe()
        await psapi.unSelectMarqueeExe()

        //get all layers
        const allLayers = await app.activeDocument.layers

        // const allLayerNames = allLayers.map(
        //     layer => `${layer.name} (${layer.opacity} %)`
        //   )
        // for (layer of allLayerNames){
        //     console.log(layer)
        // }
        //duplicate the layers
        let duplicatedLayers = []

        // const group_id = await createGroup()
        const groupLayer = await psapi.createEmptyGroup()

        console.log('createSnapshot(), group_id:', groupLayer.id)
        // let bHasBackground = false
        let indexOffset = 0

        const result1 = await executeAsModal(async () => {
            for (layer of allLayers) {
                if (layer.id == 1) {
                    //skip the background layer
                    // bHasBackground = true
                    indexOffset = 1
                    continue
                }
                if (layer.visible) {
                    const copyLayer = await layer.duplicate()
                    duplicatedLayers.push(copyLayer)
                }
            }

            const layerIDs = duplicatedLayers.map((layer) => layer.id)
            console.log('createSnapshot, layerIDs:', layerIDs)

            //select the layer since layerIDs don't seem to have an affect on moveToGroupCommand(), don't know why!!!!
            psapi.selectLayers(duplicatedLayers)
            let group_index = await psapi.getLayerIndex(groupLayer.id)

            await psapi.moveToGroupCommand(group_index - indexOffset, layerIDs)

            await psapi.collapseGroup(duplicatedLayers[0])
            snapshotLayer = app.activeDocument.activeLayers[0]
            await psapi.createSolidLayer(255, 255, 255)
            const whiteSolidLayer = app.activeDocument.activeLayers[0]
            await snapshotLayer.moveAbove(whiteSolidLayer)
            snapshotGroup = await psapi.createEmptyGroup()
            let snapshot_group_index = await psapi.getLayerIndex(
                snapshotGroup.id
            )

            await psapi.selectLayers([snapshotLayer, whiteSolidLayer])
            await psapi.moveToGroupCommand(
                snapshot_group_index - indexOffset,
                []
            )
            await psapi.selectLayers([snapshotGroup])
            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.createMaskExe()
            //   await psapi.selectLayerChannelCommand()
            //   await psapi.createSolidLayer(0, 0, 0)
        })

        return [snapshotLayer, snapshotGroup]
    } catch (e) {
        console.warn('createSnapshot Error:', e)
    }
}

function executeCommand(batchPlayCommandFunc) {
    const { executeAsModal } = require('photoshop').core
    try {
        executeAsModal(async () => {
            await batchPlayCommandFunc()
        })
    } catch (e) {
        console.warn('executeCommand error:', e)
    }
}

async function snapAndFillExe(session_id) {
    //create a snapshot of canvas
    //select opaque pixel and create black fill layer
    //create a snapshot of mask
    //set initial image
    //set mask image

    try {
        let snapAndFillLayers = []
        await executeAsModal(async (context) => {
            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id, //TODO: change this to the session document id
                name: 'Img2Img layers',
            })
            const selectionInfo = await psapi.getSelectionInfoExe()
            // await psapi.unSelectMarqueeExe()

            //create a snapshot of canvas
            // let [snapshotLayer,snapshotGroup] =  await createSnapshot()
            await psapi.snapshot_layerExe()
            const snapshotLayer = await app.activeDocument.activeLayers[0]
            const snapshotGroup = await psapi.createEmptyGroup()
            snapshotLayer.name = 'Init Image Snapshot -- temporary'
            snapshotGroup.name = 'Init Image Group -- temporary'

            // snapshotGroup.name = `${snapshotGroup.name}_init_image`
            await psapi.createSolidLayer(255, 255, 255)
            const whiteSolidLayer = await app.activeDocument.activeLayers[0]
            whiteSolidLayer.name = 'Background Color -- temporary'
            snapshotLayer.moveAbove(whiteSolidLayer)
            console.log('[snapshotLayer,snapshotGroup]:', [
                snapshotLayer,
                snapshotGroup,
            ])

            //create a snapshot of mask
            await psapi.reSelectMarqueeExe(selectionInfo)
            // let [snapshotMaskLayer,snapshotMaskGroup] = await createSnapshot()

            await psapi.selectLayers([snapshotGroup])
            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.createClippingMaskExe()

            await psapi.selectLayers([snapshotGroup])

            snapAndFillLayers = [snapshotLayer, snapshotGroup, whiteSolidLayer]

            // g_init_image_related_layers['init_image_group'] = snapshotGroup
            // g_init_image_related_layers['init_image_layer'] = snapshotLayer
            // g_init_image_related_layers['solid_white'] = whiteSolidLayer

            const image_info = await psapi.silentSetInitImage(
                snapshotGroup,
                session_id
            )
            const image_name = image_info['name']
            const path = `./server/python_server/init_images/${image_name}`

            g_viewer_manager.initializeInitImage(
                snapshotGroup,
                snapshotLayer,
                whiteSolidLayer,
                path
            ) //this will be called once a session and will add the first init image to th viewer manager

            for (layer of snapAndFillLayers) {
                layer.visible = false
            }
            await psapi.reSelectMarqueeExe(selectionInfo)
            const layer_util = require('./utility/layer')
            await layer_util.collapseFolderExe([snapshotGroup], false)
            await context.hostControl.resumeHistory(history_id)
        })
        console.log('snapAndFillLayers: ', snapAndFillLayers)
        return snapAndFillLayers
    } catch (e) {
        console.error(`snapAndFill error: ${e}`)
    }
    return []
}

async function addClippingMaskToLayer(layer, selectionInfo) {
    await psapi.selectLayers([layer]) //select the layer
    await psapi.reSelectMarqueeExe(selectionInfo) //reselect the selection
    await psapi.createClippingMaskExe() //this will create an cliping mask and select the mask of the layer
    await psapi.selectLayers([layer]) //reselect the layer instead of the mask
    await psapi.reSelectMarqueeExe(selectionInfo) //reselect the selection

    ////test addClippingMaskToLayer
    // await executeAsModal(
    //   async ()=>{
    //   await outpaint.addClippingMaskToLayer(await app.activeDocument.activeLayers[0],await psapi.getSelectionInfoExe()
    //   )})
}

async function outpaintExe(session_id) {
    //create a snapshot of canvas
    //select opaque pixel and create black fill layer
    //create a snapshot of mask
    //set initial image
    //set mask image

    try {
        let outpaintLayers = []
        await executeAsModal(async (context) => {
            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id, //TODO: change this to the session document id
                name: 'Outpaint Mask Related layers',
            })
            const selectionInfo = await psapi.getSelectionInfoExe()
            // await psapi.unSelectMarqueeExe()

            //create a snapshot of canvas
            // let [snapshotLayer,snapshotGroup] =  await createSnapshot()
            await psapi.snapshot_layerExe()
            const snapshotLayer = await app.activeDocument.activeLayers[0]
            snapshotLayer.name = 'Init Image Snapshot -- temporary'
            const snapshotGroup = await psapi.createEmptyGroup()
            // snapshotGroup.name = `${snapshotGroup.name}_init_image`
            snapshotGroup.name = 'Init Image Group -- temporary'
            await psapi.createSolidLayer(255, 255, 255) //solid white inside the Init Image Group
            const whiteSolidLayer = await app.activeDocument.activeLayers[0]
            whiteSolidLayer.name = 'Background Color -- temporary'
            snapshotLayer.moveAbove(whiteSolidLayer) //move the snapshot layer to be the first layer in "Init Image Group"
            console.log('[snapshotLayer,snapshotGroup]:', [
                snapshotLayer,
                snapshotGroup,
            ])

            //select opaque pixel and create black fill layer
            await psapi.selectLayers([snapshotLayer])
            await psapi.selectLayerChannelCommand()
            const snapshotMaskGroup = await psapi.createEmptyGroup()

            await psapi.createSolidLayer(0, 0, 0)
            let solid_black_layer = app.activeDocument.activeLayers[0]
            //create a snapshot of mask
            await psapi.reSelectMarqueeExe(selectionInfo)
            // let [snapshotMaskLayer,snapshotMaskGroup] = await createSnapshot()
            await psapi.snapshot_layerExe()
            const snapshotMaskLayer = await app.activeDocument.activeLayers[0]
            snapshotMaskLayer.name = 'Mask -- Paint White to Mask -- temporary'
            // const snapshotMaskGroup = await psapi.createEmptyGroup()

            // snapshotMaskGroup.name = `${snapshotMaskGroup.name}_mask`
            snapshotMaskGroup.name = 'Mask Group -- temporary'
            snapshotMaskLayer.moveBelow(solid_black_layer)
            await snapshotMaskGroup.moveAbove(snapshotGroup)
            await solid_black_layer.delete() //

            await addClippingMaskToLayer(snapshotGroup, selectionInfo)

            const mask_info = await psapi.silentSetInitImageMask(
                snapshotMaskGroup,
                session_id
            )
            snapshotMaskGroup.visible = false

            const image_info = await psapi.silentSetInitImage(
                snapshotGroup,
                session_id
            )
            snapshotGroup.visible = false

            const init_image_name = image_info['name']
            const init_path = `./server/python_server/init_images/${init_image_name}`

            await psapi.reSelectMarqueeExe(selectionInfo)

            await addClippingMaskToLayer(snapshotMaskGroup, selectionInfo)

            await psapi.reSelectMarqueeExe(selectionInfo)

            const mask_name = mask_info['name']
            const mask_path = `./server/python_server/init_images/${mask_name}`
            await psapi.reSelectMarqueeExe(selectionInfo)
            //set initial image
            //set mask image
            outpaintLayers = [
                snapshotMaskGroup,
                snapshotMaskLayer,
                snapshotLayer,
                snapshotGroup,
                whiteSolidLayer,
            ]
            // g_mask_related_layers['mask_group'] = snapshotMaskGroup
            // g_mask_related_layers['white_mark'] = snapshotMaskLayer
            // // g_mask_related_layers['solid_black'] = blackSolidLayer
            g_viewer_manager.initializeMask(
                snapshotMaskGroup,
                snapshotMaskLayer,
                null,
                mask_path,
                mask_info['base64']
            )
            // g_init_image_related_layers['init_image_group'] = snapshotGroup
            // g_init_image_related_layers['init_image_layer'] = snapshotLayer
            // g_init_image_related_layers['solid_white'] = whiteSolidLayer
            g_viewer_manager.initializeInitImage(
                snapshotGroup,
                snapshotLayer,
                whiteSolidLayer,
                init_path
            ) //this will be called once a session and will add the first init image to th viewer manager

            for (layer of outpaintLayers) {
                layer.visible = false
            }

            //collapse the folders
            const layer_util = require('./utility/layer')
            await layer_util.collapseFolderExe(
                [snapshotGroup, snapshotMaskGroup],
                false
            )
            await context.hostControl.resumeHistory(history_id)
        })
        console.log('outpaintLayers 2: ', outpaintLayers)
        return outpaintLayers
    } catch (e) {
        console.error(`outpaintExe error: ${e}`)
    }
    return []
}

async function inpaintFasterExe(session_id) {
    //create a snapshot of canvas
    //select opaque pixel and create black fill layer
    //create a snapshot of mask
    //set initial image
    //set mask image
    try {
        let inpaintLayers = []
        await executeAsModal(async (context) => {
            const history_id = await context.hostControl.suspendHistory({
                documentID: app.activeDocument.id,
                name: 'Inpaint Mask Related layers',
            })
            const original_white_mark_layer = await app.activeDocument
                .activeLayers[0]
            original_white_mark_layer.visible = false

            const selectionInfo = await psapi.getSelectionInfoExe()

            //duplicate the current active layer and use it as the white mark layer
            const white_mark_layer =
                await app.activeDocument.activeLayers[0].duplicate()
            white_mark_layer.visible = true
            const mask_layer_opacity = await white_mark_layer.opacity
            white_mark_layer.opacity = 100 //make sure the opacity is full
            await psapi.selectLayers([white_mark_layer])
            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.createClippingMaskExe()
            await psapi.reSelectMarqueeExe(selectionInfo)

            white_mark_layer.visible = false
            white_mark_layer.name = 'Mask -- Paint White to Mask -- temporary'
            // white_mark_layer.visible = true

            //create a snapshot of canvas

            // let [snapshotLayer,snapshotGroup] =  await createSnapshot()
            // await psapi.snapshot_layer()
            await psapi.unselectActiveLayersExe() //invisible layer will cause problem with merging "command is not available" type of error
            // await psapi.mergeVisibleExe()
            await psapi.snapshot_layerExe()

            const snapshotLayer = await app.activeDocument.activeLayers[0]
            snapshotLayer.name = 'Init Image Snapshot -- temporary'
            const snapshotGroup = await psapi.createEmptyGroup()
            snapshotGroup.name = 'Init Image Group -- temporary'
            await psapi.createSolidLayer(255, 255, 255)
            const whiteSolidLayer = await app.activeDocument.activeLayers[0]
            whiteSolidLayer.name = 'Background Color -- temporary'
            await snapshotLayer.moveAbove(whiteSolidLayer)

            await psapi.selectLayers([snapshotGroup])
            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.createClippingMaskExe()
            await psapi.reSelectMarqueeExe(selectionInfo)

            const maskGroup = await psapi.createEmptyGroup()
            // maskGroup.name = `${maskGroup.name}_mask`

            maskGroup.name = 'Mask Group -- temporary'

            await psapi.createSolidLayer(0, 0, 0)
            const blackSolidLayer = await app.activeDocument.activeLayers[0]
            blackSolidLayer.name = "Don't Edit -- temporary"
            // snapshotLayer.moveAbove(blackSolidLayer)
            white_mark_layer.moveAbove(blackSolidLayer)
            white_mark_layer.visible = true
            await psapi.reSelectMarqueeExe(selectionInfo)

            console.log('[snapshotLayer,maskGroup]:', [
                snapshotLayer,
                maskGroup,
            ])
            // //select opaque pixel and create black fill layer
            // await psapi.selectLayers([snapshotLayer])
            // await psapi.selectLayerChannelCommand()
            // const snapshotMaskGroup = await psapi.createEmptyGroup()

            // await psapi.createSolidLayer(0, 0, 0)
            // let solid_black_layer  = app.activeDocument.activeLayers[0]
            // //create a snapshot of mask
            // await psapi.reSelectMarqueeExe(selectionInfo)
            // // let [snapshotMaskLayer,snapshotMaskGroup] = await createSnapshot()
            // await psapi.snapshot_layer()
            // const snapshotMaskLayer = await app.activeDocument.activeLayers[0]
            // // const snapshotMaskGroup = await psapi.createEmptyGroup()

            // snapshotMaskGroup.name = `${snapshotMaskGroup.name}_mask`
            // snapshotMaskLayer.moveBelow(solid_black_layer)
            // await snapshotMaskGroup.moveAbove(snapshotGroup)
            // solid_black_layer.delete()

            await psapi.selectLayers([maskGroup])
            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.createClippingMaskExe()
            await psapi.reSelectMarqueeExe(selectionInfo)

            // await psapi.selectLayers([snapshotGroup])

            await psapi.selectLayers([maskGroup])

            const mask_info = await psapi.silentSetInitImageMask(
                maskGroup,
                session_id
            )
            maskGroup.visible = false
            //hide the mask so you can take screenshot of the init image
            const mask_name = mask_info['name']
            const mask_path = `./server/python_server/init_images/${mask_name}`

            await psapi.reSelectMarqueeExe(selectionInfo)
            await psapi.selectLayers([snapshotGroup])

            const image_info = await psapi.silentSetInitImage(
                snapshotGroup,
                session_id
            )
            const image_name = image_info['name']
            const path = `./server/python_server/init_images/${image_name}`

            await psapi.reSelectMarqueeExe(selectionInfo)
            // await psapi.selectLayers([snapshotMaskGroup])
            // await psapi.setInitImageMask(snapshotMaskGroup)
            // //set initial image
            // //set mask image

            await psapi.selectLayers([maskGroup])
            inpaintLayers = [
                maskGroup,
                white_mark_layer,
                blackSolidLayer,
                snapshotGroup,
                snapshotLayer,
                whiteSolidLayer,
            ]
            // g_mask_related_layers['mask_group'] = maskGroup
            // g_mask_related_layers['white_mark'] = white_mark_layer
            // g_mask_related_layers['solid_black'] = blackSolidLayer
            g_viewer_manager.initializeMask(
                maskGroup,
                white_mark_layer,
                blackSolidLayer,
                mask_path,
                mask_info['bases64']
            )
            // g_init_image_related_layers['init_image_group'] = snapshotGroup
            // g_init_image_related_layers['init_image_layer'] = snapshotLayer
            // g_init_image_related_layers['solid_white'] = whiteSolidLayer
            g_viewer_manager.initializeInitImage(
                snapshotGroup,
                snapshotLayer,
                whiteSolidLayer,
                path
            ) //this will be called once a session and will add the first init image to th viewer manager
            for (layer of inpaintLayers) {
                layer.visible = false
            }
            const layer_util = require('./utility/layer')

            await layer_util.collapseFolderExe(
                [snapshotGroup, maskGroup],
                false
            )
            white_mark_layer.opacity = mask_layer_opacity // restore the opacity
            // original_white_mark_layer.visible = true// leave it off so we can toggle using the viewer manager
            await context.hostControl.resumeHistory(history_id)
        })
        return inpaintLayers
    } catch (e) {
        console.warn('inpaintFasterExe error:', e)
    }
    return []
}
module.exports = {
    createSnapshot,

    moveLayersToGroup,
    executeCommand,
    outpaintExe,
    // outpaintFasterExe,
    inpaintFasterExe,
    snapAndFillExe,
    addClippingMaskToLayer,
}
