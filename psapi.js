const app = window.require('photoshop').app
const batchPlay = require('photoshop').action.batchPlay
const { executeAsModal } = require('photoshop').core
const export_png = require('./export_png')
// const { layerToSelection } = require('./helper')

const storage = require('uxp').storage
const fs = storage.localFileSystem





async function createSolidLayer (r, g, b) {
  await executeAsModal(async () => {
    const result = await batchPlay(
      [
        {
          _obj: 'make',
          _target: [
            {
              _ref: 'contentLayer'
            }
          ],
          using: {
            _obj: 'contentLayer',
            type: {
              _obj: 'solidColorLayer',
              color: {
                _obj: 'RGBColor',
                red: r,
                grain: g,
                blue: b
              }
            }
          },
          _options: {
            dialogOptions: 'dontDisplay'
          }
        }
      ],
      {
        synchronousExecution: true,
        modalBehavior: 'execute'
      }
    )
  })
}

async function makeGroupCommand () {
  const result = await batchPlay(
    [
      {
        _obj: 'make',
        _target: [
          {
            _ref: 'layerSection'
          }
        ],
        layerSectionStart: 405,
        layerSectionEnd: 406,
        name: 'Group 16',
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
  )

  console.log('makeGroupCommand: ', result)

  return result
}
async function createEmptyGroup () {
  let groupLayer
  await executeAsModal(async () => {
    await makeGroupCommand()
    groupLayer = app.activeDocument.activeLayers[0]
  })
  console.log('groupLayer:', groupLayer)
  return groupLayer
}

async function moveToGroupCommand (to_index, layerIDs) {
  const batchPlay = require('photoshop').action.batchPlay
  console.log('to_index:', to_index)
  console.log('layerIDs:', layerIDs)

  const result = await batchPlay(
    [
      {
        _obj: 'move',
        _target: [
          {
            _ref: 'layer',
            _enum: 'ordinal',
            _value: 'targetEnum'
          }
        ],
        to: {
          _ref: 'layer',
          _index: to_index
        },
        adjustment: false,
        version: 5,
        layerID: layerIDs,
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
  )
}
function MoveToGroupExe (toIndex, layerIDs) {
  try {
    executeAsModal(async () => {
      await moveToGroupCommand(toIndex, layerIDs)
    })
  } catch (e) {
    console.warn('executeCommand error:', e)
  }
}

async function getIndexCommand (layer_id) {
  const idx = batchPlay(
    [
      {
        _obj: 'get',
        _target: [
          {
            _property: 'itemIndex'
          },
          {
            _ref: 'layer',
            // _name: 'myGroup'
            _id: layer_id
          }
        ],
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    { synchronousExecution: true }
  )[0]['itemIndex']
  console.log('index:', idx)
  return idx
}

async function getLayerIndex (layer_id) {
  const { executeAsModal } = require('photoshop').core
  try {
    let index
    await executeAsModal(async () => {
      index = await getIndexCommand(layer_id)
      console.log('getIndex: ', index)
    })
    return index
  } catch (e) {
    console.warn('getIndex error:', e)
  }
}

async function unselectActiveLayers () {
  const layers = await app.activeDocument.activeLayers
  for (layer of layers) {
    layer.selected = false
  }
}
async function unselectActiveLayersExe () {
  await executeAsModal(async ()=>{
    await unselectActiveLayers()
  })
}
async function selectLayers (layers) {
  await unselectActiveLayers()
  for (layer of layers) {
    layer.selected = true
  }
}
async function selectLayersExe(layers){
  await executeAsModal(async ()=>{
    await selectLayers(layers)
  })
}
async function selectGroup (layer) {
  await unselectActiveLayers()
  layer.parent.selected = true
}
async function collapseGroup (layer) {
  await selectGroup(layer)
  await app.activeDocument.activeLayers[0].merge()
}

async function createMaskCommand () {
  const batchPlay = require('photoshop').action.batchPlay

  const result = await batchPlay(
    [
      {
        _obj: 'make',
        new: {
          _class: 'channel'
        },
        at: {
          _ref: 'channel',
          _enum: 'channel',
          _value: 'mask'
        },
        using: {
          _enum: 'userMaskEnabled',
          _value: 'revealSelection'
        },
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
  )
}

async function createMaskExe () {
  const { executeAsModal } = require('photoshop').core
  await executeAsModal(createMaskCommand)
}

//unselect the rectangular marquee selection area
async function unSelectMarqueeCommand () {
  const batchPlay = require('photoshop').action.batchPlay

  const result = await batchPlay(
    [
      {
        _obj: 'set',
        _target: [
          {
            _ref: 'channel',
            _property: 'selection'
          }
        ],
        to: {
          _enum: 'ordinal',
          _value: 'none'
        },
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
  )

  return result
}
async function unSelectMarqueeExe () {
  await executeAsModal(unSelectMarqueeCommand)
}
////selection:
async function selectMarqueeRectangularToolExe () {
  
  async function selectMarqueeRectangularToolCommand(){

    const result = await batchPlay(
      [
      {
        _obj: 'select',
        _target: [
          {
            _ref: 'marqueeRectTool'
          }
        ],
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
    )
    return result 
  }
  await executeAsModal(async ()=>{
    await selectMarqueeRectangularToolCommand()
  })
}
 
async function promptForMarqueeTool(){
  ;(async () => {
    const r1 = await dialog_box.prompt(
      'Please Select a Rectangular Area',
      'You Forgot to select a Rectangular Area',
      ['Cancel', 'Rectangular Marquee']
    )
    if ((r1 || 'Rectangular Marquee') !== 'Rectangular Marquee') {
      /* cancelled or No */
      console.log("cancel")
    } else {
      /* Yes */
      console.log("Rectangular Marquee")
      selectMarqueeRectangularToolExe()
    }
  })()
}

    async function selectLayerChannelCommand () {
      //   const result = await batchPlay(
        //     [
          //       {
            //         _obj: 'set',
  //         _target: [
  //           {
  //             _ref: 'channel',
  //             _property: 'selection'
  //           }
  //         ],
  //         to: {
  //           _ref: [
  //             {
  //               _ref: 'channel',
  //               _enum: 'channel',
  //               _value: 'transparencyEnum'
  //             },
  //             {
  //               _ref: 'layer',
  //               _name: 'Group 5'
  //             }
  //           ]
  //         },
  //         _options: {
  //           dialogOptions: 'dontDisplay'
  //         }
  //       }
  //     ],
  //     {
  //       synchronousExecution: false,
  //       modalBehavior: 'execute'
  //     }
  //   )
  const batchPlay = require('photoshop').action.batchPlay

  const result = await batchPlay(
    [
      {
        _obj: 'set',
        _target: [
          {
            _ref: 'channel',
            _property: 'selection'
          }
        ],
        to: {
          _ref: 'channel',
          _enum: 'channel',
          _value: 'transparencyEnum'
        },
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
  )
}

async function getSelectionInfoCommand () {
  const result = await batchPlay(
    [
      {
        _obj: 'get',
        _target: [
          {
            _property: 'selection'
          },
          {
            _ref: 'document',
            _id: app.activeDocument._id
          }
        ],
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
  )

  return result
}

async function getSelectionInfoExe () {
  console.log('getSelectionInfo was called')

  try {
    const selection = (await executeAsModal(getSelectionInfoCommand))[0]
      .selection

    let selection_info = {
      left: selection.left._value,
      right: selection.right._value,
      bottom: selection.bottom._value,
      top: selection.top._value,
      height: selection.bottom._value - selection.top._value,
      width: selection.right._value - selection.left._value
    }
    // console.dir({selection_info})
    return selection_info
  } catch (e) {
    console.warn('selection info error', e)
  }
}

async function reSelectMarqueeCommand (selectionInfo) {
  const result = await batchPlay(
    [
      {
        _obj: 'set',
        _target: [
          {
            _ref: 'channel',
            _property: 'selection'
          }
        ],
        to: {
          _obj: 'rectangle',
          top: {
            _unit: 'pixelsUnit',
            _value: selectionInfo.top
          },
          left: {
            _unit: 'pixelsUnit',
            _value: selectionInfo.left
          },
          bottom: {
            _unit: 'pixelsUnit',
            _value: selectionInfo.bottom
          },
          right: {
            _unit: 'pixelsUnit',
            _value: selectionInfo.right
          }
        },
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
  )
}
async function reSelectMarqueeExe (selectionInfo) {
  await executeAsModal(async () => {
    await reSelectMarqueeCommand(selectionInfo)
  })
}

async function snapshot_layer () {
  
  let psAction = require('photoshop').action
  // const ids = (await app.activeDocument.activeLayers).map(layer => layer.id)
  const ids = await app.activeDocument.layers.map(layer => layer.id)
  let command = [
    // Select All Layers current layer
    {
      _obj: 'selectAllLayers',
      _target: [{ _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' }]
    },
    // Duplicate current layer
    // {"ID":[459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513],"_obj":"duplicate","_target":[{"_enum":"ordinal","_ref":"layer","_value":"targetEnum"}],"version":5},
    {
      ID: ids,
      _obj: 'duplicate',
      _target: [{ _enum: 'ordinal', _ref: 'layer', _value: 'targetEnum' }],
      // version: 5
    },

    // Merge Layers
    { _obj: 'mergeLayersNew' },
    // Make
    {
      _obj: 'make',
      at: { _enum: 'channel', _ref: 'channel', _value: 'mask' },
      new: { _class: 'channel' },
      using: { _enum: 'userMaskEnabled', _value: 'revealSelection' }
    },
    // Set Selection
    {
      _obj: 'set',
      _target: [{ _property: 'selection', _ref: 'channel' }],
      to: { _enum: 'ordinal', _ref: 'channel', _value: 'targetEnum' }
    }
  ]
  const result = await psAction.batchPlay(command, {   "synchronousExecution": true,
  "modalBehavior": "execute"})
  console.log("snapshot_layer: result: ",result)
  return result
}

async function snapshot_layerExe () {
  try{

    await executeAsModal(async () => {await snapshot_layer()}, {
      commandName: 'Action Commands'
    })
  }catch(e){
    console.error(e)
  }
}

// await runModalFunction();

async function fillAndGroup () {
  let result
  let psAction = require('photoshop').action

  // let newCommand =[
  //   // snapshotLayer

  //   // makeGroupCommand

  //   // Make fill layer
  //   {"_obj":"make","_target":[{"_ref":"contentLayer"}],"using":{"_obj":"contentLayer","type":{"_obj":"solidColorLayer","color":{"_obj":"RGBColor","blue":255.0,"grain":255.0,"red":255.0}}}},

  // ]

  let command = [
    // Make fill layer
    {
      _obj: 'make',
      _target: [{ _ref: 'contentLayer' }],
      using: {
        _obj: 'contentLayer',
        type: {
          _obj: 'solidColorLayer',
          color: { _obj: 'RGBColor', blue: 255.0, grain: 255.0, red: 255.0 }
        }
      }
    }
    // Move current layer
    // {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer","_value":"targetEnum"}],"adjustment":false,"layerID":[17],"to":{"_index":7,"_ref":"layer"},"version":5},
    // Select layer “Layer 4 copy”
    // {"_obj":"select","_target":[{"_name":"Layer 4 copy","_ref":"layer"}],"layerID":[17,15],"makeVisible":false,"selectionModifier":{"_enum":"selectionModifierType","_value":"addToSelectionContinuous"}},
    // Make Group
    // {"_obj":"make","_target":[{"_ref":"layerSection"}],"from":{"_enum":"ordinal","_ref":"layer","_value":"targetEnum"},"layerSectionEnd":19,"layerSectionStart":18,"name":"Group 1"}
  ]
  const snapshotLayer = await app.activeDocument.activeLayers[0]
  await makeGroupCommand()
  const groupLayer = app.activeDocument.activeLayers[0]
  result = await psAction.batchPlay(command, {})
  const fillLayer = app.activeDocument.activeLayers[0]
  snapshotLayer.moveAbove(fillLayer)
  // await app.activeDocument.activeLayers[0].moveAbove()
  // const layerIDs = []
  // const to_index = await getIndexCommand(groupLayer.id)
  // await moveToGroupCommand(to_index, layerIDs)
}

async function fillAndGroupExe () {
  await require('photoshop').core.executeAsModal(fillAndGroup, {
    commandName: 'Action Commands'
  })
}
async function fastSnapshot () {
  await snapshot_layerExe()
  await fillAndGroupExe()
}

function layerToFileName (layer, session_id) {
  file_name = `${layer.name}_${layer.id}_${session_id}`
  return file_name
}
function layerNameToFileName(layer_name,layer_id,session_id)
{
  file_name = `${layer_name}_${layer_id}_${session_id}`
  return file_name

}
async function exportPngCommand (session_id) {
  try{

  
  // const result = await batchPlay { _obj: “exportSelectionAsFileTypePressed”}

  // const destFolder = (await storage.localFileSystem.getDataFolder()).nativePath;
  const storage = require('uxp').storage
  const fs = storage.localFileSystem

  let pluginFolder = await fs.getPluginFolder()
  // await fs.getFolder("./init_images")
  let init_images_dir = await pluginFolder.getEntry(
    './server/python_server/init_images'
  )
  const layer = await app.activeDocument.activeLayers[0]
  const old_name = layer.name
  //change the name of layer to unique name
  const file_name = layerToFileName(layer, session_id)
  layer.name = file_name
  const id = await app.activeDocument.activeLayers[0].id
  const exportCommand = {
    _obj: 'exportSelectionAsFileTypePressed',
    // _target: { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
    _target: { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum', _id: id },

    fileType: 'png',
    quality: 32,
    metadata: 0,
    destFolder: init_images_dir.nativePath,
    sRGB: true,
    openWindow: false,
    _options: { dialogOptions: 'dontDisplay' }
  }
  const result = await batchPlay([exportCommand], {
    synchronousExecution: true,
    modalBehavior: 'execute'
  })
  


  return result
}
catch (e) {
  console.error(`exportPngCommand error:, ${e}`)
}

}

async function exportPng (session_id) {
  console.log('exportPng() -> session_id:', session_id)
  try {
    const old_name = await app.activeDocument.activeLayers[0].name
    await executeAsModal(async () => {
      await exportPngCommand(session_id)
    })
    setTimeout(async () => {console.log("setTimeout() -> old_name: ",old_name)  
    await executeAsModal(async () => {
      app.activeDocument.activeLayers[0].name = old_name
    })
    
  }, 3000); 
    //after export rename the layer to it's original name by remove the "_${id}" from the name
  } catch (e) {
    
    console.error(`exportPng error:, ${e}`)
  }
}

// await runModalFunction();
async function setInitImage (layer, session_id) {
 try{

  const html_manip = require('./html_manip') 
  // const layer = await app.activeDocument.activeLayers[0]
  const old_name = layer.name 
  const sdapi = require('./sdapi')
  // await exportPng(session_id)
  // image_name = await app.activeDocument.activeLayers[0].name
  
  // image_name = layerNameToFileName(old_name,layer.id,random_session_id)
  image_name = layerNameToFileName(old_name,layer.id,session_id)
  image_name = `${image_name}.png`
  const width = html_manip.getWidth()
  const height = html_manip.getHeight()
  await newExportPng(layer,image_name,width,height)

  g_init_image_name = image_name
  console.log(image_name)
  const image_src = await sdapi.getInitImage(g_init_image_name)
  let ini_image_element = document.getElementById('init_image')
  ini_image_element.src = image_src
} catch (e) {
  console.error(`psapi.js setInitImage error:, ${e}`)
}
}
async function setInitImageMask (layer, session_id) {
  try{
    const html_manip = require('./html_manip')

  
  // const layer = await app.activeDocument.activeLayers[0]
  const old_name = layer.name 
  const sdapi = require('./sdapi')
  // await exportPng(session_id)
  //get the active layer name
  // image_name = await app.activeDocument.activeLayers[0].name
  // image_name = layerNameToFileName(old_name,layer.id,random_session_id)
  image_name = layerNameToFileName(old_name,layer.id,session_id)
  image_name = `${image_name}.png`
  const width = html_manip.getWidth()
  const height = html_manip.getHeight()
  await newExportPng(layer,image_name,width,height)
  g_init_image_mask_name = image_name // this is the name we will send to the server
  // g_init_mask_layer = layer
  // g_mask_related_layers = {} 
  console.log(image_name)
  
  const image_src = await sdapi.getInitImage(g_init_image_mask_name)// we should replace this with getInitImagePath which return path to local disk
  const ini_image_mask_element = document.getElementById('init_image_mask')
  ini_image_mask_element.src = image_src
  ini_image_mask_element.dataset.layer_id = layer.id

  //create viewer init image obj
  
} catch (e) {
  console.error(`psapi.js setInitImageMask error: `,e)
}
}

// remove the generated mask related layers from the canvas and "layers" panel


// async function cleanSnapAndFill(layers){
//   // we can delete this function and use cleanLayers() instead
//   //delete init image group
//   //delete init image (snapshot layer)
//   //delete fill layer 


//   for (layer of layers){
//     try{

//       await executeAsModal(async ()=>{await layer.delete()})
//     }catch(e){
//       console.warn("cleanSnapAndFill, issue deleting a layer",e)
//     }
//   }
// return []
// }

async function cleanLayers(layers){
  g_init_image_related_layers = {}
  g_mask_related_layers = {}
  // await loadViewerImages()// we should move loadViewerImages to a new file viewer.js
  console.log("cleanLayers() -> layers:",layers)
  for (layer of layers){
    try {
      await executeAsModal(async ()=>{await layer.delete()})}
      catch(e){
        console.warn("warning attempting to a delete layer: ",e)  
        continue;
      }
  }
  return []
}

// async function cleanLayersOutpaint(layers){
//   //delete group mask layer
//   //delete mask layer 
//   //delete group init image layer 
//   //delete init image layer (snapshot layer)
//   //delete fill layer 

//   for (layer of layers){
//     try {
//       await executeAsModal(async ()=>{await layer.delete()})}
//       catch(e){
//         console.warn("warning attempting to a delete layer: ",e)
//       }
//   }
  
// return []
// }
// async function cleanLayersInpaint(layers){
//   //delete group mask layer
//   //delete white mask layer
//   //delete the black fill layer  
//   //delete init image layer (snapshot layer)

//   for (layer of layers){
//     await executeAsModal(async ()=>{await layer.delete()})
//   }
  
// return []
// }
async function createClippingMaskExe () {
  const batchPlay = require('photoshop').action.batchPlay

  async function createClippingMaskCommand(){

    const result = await batchPlay(
      [
      {
        _obj: 'make',
        new: {
          _class: 'channel'
        },
        at: {
          _ref: 'channel',
          _enum: 'channel',
          _value: 'mask'
        },
        using: {
          _enum: 'userMaskEnabled',
          _value: 'revealSelection'
        },
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {
      synchronousExecution: true,
      modalBehavior: 'execute'
    }
    )
  }

  await executeAsModal(async () => {
    await createClippingMaskCommand()
  })
}

async function checkIfSelectionAreaIsActive()
{
  try{

    let isSelectionAreaValid = await getSelectionInfoExe()
    return isSelectionAreaValid
  }catch(e){
    console.warn(e)
  }
}
async function saveUniqueDocumentIdExe (new_id) {
  const batchPlay = require('photoshop').action.batchPlay

  async function saveUniqueDocumentIdCommand () {
    const batchPlay = require('photoshop').action.batchPlay

    const result = await batchPlay(
      [
        {
          _obj: 'set',
          _target: [
            {
              _ref: 'property',
              _property: 'fileInfo'
            },
            {
              _ref: 'document',
              _enum: 'ordinal',
              _value: 'targetEnum'
            }
          ],
          to: {
            _obj: 'fileInfo',
            caption: new_id,
            keywords: [new_id]
          },
          _options: {
            dialogOptions: 'dontDisplay'
          }
        }
      ],
      {
        synchronousExecution: true,
        modalBehavior: 'execute'
      }
    )
  }

  await executeAsModal(async () => {
    await saveUniqueDocumentIdCommand()
  })
}

async function readUniqueDocumentIdExe () {
  const batchPlay = require('photoshop').action.batchPlay

  async function readUniqueDocumentIdCommand () {
    const batchPlay = require('photoshop').action.batchPlay

    const result = await batchPlay(
      [
        {
          _obj: 'get',
          _target: [
            {
              _ref: 'property',
              _property: 'fileInfo'
            },
            {
              _ref: 'document',
              _enum: 'ordinal',
              _value: 'targetEnum'
            }
          ],
          // to: {
          //   _obj: 'fileInfo',
          //   caption: new_id,
          //   keywords: [new_id]
          // },
          _options: {
            dialogOptions: 'dontDisplay'
          }
        }
      ],
      {
        synchronousExecution: true,
        modalBehavior: 'execute'
      }
    )
    console.log("readUniqueDocumentIdCommand: result ", result)
    return result
  }

  let uniqueDocumentId = "" 
  try{

    await executeAsModal(async () => {
      uniqueDocumentId =  (await readUniqueDocumentIdCommand())[0].fileInfo.caption
      if (typeof uniqueDocumentId === "string"){
        uniqueDocumentId = uniqueDocumentId.trim()
      }
    })
  }catch(e){
    console.warn("readUniqueDocumentIdExe: ",e)
    uniqueDocumentId = ""
  }

  return uniqueDocumentId
}



const readPng = async (image_name) => {
  // image_name = 'test.png'
  try {
    await executeAsModal(
      async (control) => {
        // const tempFolder = await fs.getTemporaryFolder() ;
        const pluginFolder = await fs.getPluginFolder()
        
        let init_images_dir = await pluginFolder.getEntry("./server/python_server/init_images")
        // let init_images_dir = await pluginFolder.getEntry(
        //   './server/python_server/init_images'
        // )
        const file = await init_images_dir.createFile(image_name, {overwrite: true}) ;

        const currentDocument = app.activeDocument ;
        await currentDocument.saveAs.png(
          file,
          {
            compression: 6,
          },
          true
        ) ;

        // const arrayBuffer = await file.read({format: formats.binary}) ;
        // console.log(arrayBuffer, 'arrayBuffer') ;
      }, 

      {'commandName': 'readPng'}
    ) ;
  } catch(e) {
    console.warn(e) ;
  }
} ;


async function selectCanvasCommand(){


  // const result = await batchPlay(
  // [
  //    {
  //       _obj: "historyStateChanged",
  //       documentID: 1044,
  //       ID: 1058,
  //       name: "Select Canvas",
  //       hasEnglish: true,
  //       itemIndex: 7,
  //       commandID: 1017,
  //       _options: {
  //          dialogOptions: "dontDisplay"
  //       }
  //    }
  // ],{
  //    synchronousExecution: true,
  //    modalBehavior: "execute"
  // });
  
const result = await batchPlay(
  [
     {
        _obj: "set",
        _target: [
           {
              _ref: "channel",
              _property: "selection"
           }
        ],
        to: {
           _enum: "ordinal",
           _value: "allEnum"
        },
        _options: {
           dialogOptions: "dontDisplay"
        }
     }
  ],{
     synchronousExecution: true,
     modalBehavior: "execute"
  });

  return result
}
async function selectCanvasExe(){
  await executeAsModal(async ()=>{await selectCanvasCommand()},{'commandName': 'selectCanvasExe'})
}
async function newExportPng (layer,image_name,width,height) {
  //store layers we want to export in variables
  // let layerToExports =
  // create new document
  // duplicate the layers to the new documnet
  //select the layer channel selectLayerChannelCommand
  //document.crop
  //export using readPng()

  try {
    //get the active layers
    // const layersToExport = app.activeDocument.activeLayers
    
    //create new document
    // let exportDoc = await executeAsModal(app.documents.add)
    let exportDoc;  
    const makeDoc = async ()=>{
      let exportDoc = await app.documents.add({
      width: width,
      height: height,
      resolution: 300,
      mode: "RGBColorMode",
      fill: "transparent"
      });
      };
    await executeAsModal(async ()=>{
      
        // await app.documents.add()
        await makeDoc()
        exportDoc = app.activeDocument
    
        console.log("exportDoc.id: ",exportDoc.id)
    // for (layer of layersToExport) {
    
        console.log(layer.id)
        const dupLayer = await layer.duplicate(exportDoc)
        await selectLayers([dupLayer])
        // await selectLayerChannelCommand()
        await selectCanvasExe()
        const canvas_selection_info = await getSelectionInfoExe()
        await layerToSelection(canvas_selection_info)
        // const selection_info = await getSelectionInfoExe()
        // await exportDoc.crop(selection_info)
        // export_image_name = `${layer.name}.png`
        await readPng(image_name)
        await exportDoc.closeWithoutSaving()
      },  {'commandName': 'NewExportPng'})
    // }
  } catch (e) {
    console.error(`newExportPng error: ,${e}`)
  }
}
async function mergeVisibleCommand () {
  const result = await batchPlay(
    [
      {
          "_obj": "mergeVisible",
          "duplicate": true,
          "_isCommand": true
          // "_options": {
          //   // "dialogOptions": "dontDisplay"
          // }
      }
    ],{
      "synchronousExecution": true,
      "modalBehavior": "execute"
    });

  return result
}

async function mergeVisibleExe () {
  await executeAsModal(async () => {
    await mergeVisibleCommand()
  })
}

async function layerToSelection (selection_info) {
  //store active layer for later


  try {
    //Store selection info
    //unSelect
    //move layer
    //scale layer
    //Select from selection info
    // let selection_info = await getSelectionInfo()
    

    console.log('selection_info:',selection_info)
    

    console.log('unSelect')

    
    function getLayerSize (layer) {
      console.log('layer.bounds:')
      console.dir(layer.bounds)
      const bounds = layer.bounds
      const height = bounds.bottom - bounds.top
      const width = bounds.right - bounds.left
      return {
        height: height,
        width: width,
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom
      }
    }
     //scale layer
     async function scaleLayer (layer,selection_info) {
        console.log('scaleLayer got called')
        // const activeLayer = getActiveLayer()
        // const activeLayer = await app.activeDocument.activeLayers[0]

        let layer_info = getLayerSize(layer)
        scale_x_ratio = (selection_info.width / layer_info.width) * 100
        scale_y_ratio = (selection_info.height / layer_info.height) * 100
        console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
        await layer.scale(scale_x_ratio, scale_y_ratio)
      }
      
      

    async function moveLayerExe (layerToMove, selection_info) {
        
        let layer_info = getLayerSize(layerToMove)
      top_dist = layer_info.top - selection_info.top
      left_dist = layer_info.left - selection_info.left
      await layerToMove.translate(-left_dist, -top_dist)
    }
    // const activeLayer = await getActiveLayer()
    
    //store all active layers
    const activeLayers = await app.activeDocument.activeLayers
    await unSelectMarqueeExe()
    // await executeAsModal(unSelect,  {'commandName': 'unSelect'})
    // await executeAsModal(scaleLayer,  {'commandName': 'scaleLayer'})
    
    
    


    await executeAsModal(async () => {
      
      for (let layer of activeLayers){
        await selectLayers([layer])// make sure only one layer is selected  
        await scaleLayer(layer,selection_info)//scale to selection size
        await moveLayerExe(layer, selection_info)//move to selection
      }
    },  {'commandName': 'moveLayerExe'})

    // await reselect(selection_info)
  } catch (e) {
    console.warn(e)
  }

  
}

module.exports = {
  createSolidLayer,
  createEmptyGroup,
  getLayerIndex,
  collapseGroup,
  moveToGroupCommand,
  MoveToGroupExe,
  selectLayers,
  selectLayersExe,
  unselectActiveLayers,
  unselectActiveLayersExe,
  createMaskExe,
  getSelectionInfoExe,
  unSelectMarqueeCommand,
  unSelectMarqueeExe,
  reSelectMarqueeExe,
  selectLayerChannelCommand,
  snapshot_layer,
  snapshot_layerExe,
  fillAndGroupExe,
  fastSnapshot,
  setInitImage,
  setInitImageMask,
  exportPng,
  layerToFileName,
  layerNameToFileName,
  // cleanLayersOutpaint,
  // cleanLayersInpaint,
  // cleanSnapAndFill,
  cleanLayers,
  createClippingMaskExe,
  checkIfSelectionAreaIsActive,
  selectMarqueeRectangularToolExe,
  promptForMarqueeTool,
  saveUniqueDocumentIdExe,
  readUniqueDocumentIdExe,
  newExportPng,
  mergeVisibleExe,
  selectCanvasExe,
  layerToSelection
}
