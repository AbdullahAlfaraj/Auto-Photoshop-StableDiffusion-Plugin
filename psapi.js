const app = window.require('photoshop').app
const batchPlay = require('photoshop').action.batchPlay
const { executeAsModal } = require('photoshop').core

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
        synchronousExecution: false,
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
      synchronousExecution: false,
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
      synchronousExecution: false,
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
    console.log('executeCommand error:', e)
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
    console.log('getIndex error:', e)
  }
}

function unselectActiveLayers () {
  const layers = app.activeDocument.activeLayers
  for (layer of layers) {
    layer.selected = false
  }
}
async function unselectActiveLayersExe () {
  await executeAsModal(async ()=>{
    await unselectActiveLayers()
  })
}
function selectLayers (layers) {
  unselectActiveLayers()
  for (layer of layers) {
    layer.selected = true
  }
}
async function selectLayersExe(layers){
  await executeAsModal(async ()=>{
    await selectLayers(layers)
  })
}
function selectGroup (layer) {
  unselectActiveLayers()
  layer.parent.selected = true
}
async function collapseGroup (layer) {
  selectGroup(layer)
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
      synchronousExecution: false,
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
      synchronousExecution: false,
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
      synchronousExecution: false,
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
      synchronousExecution: false,
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
    console.log('selection info error', e)
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
      synchronousExecution: false,
      modalBehavior: 'execute'
    }
  )
}
async function reSelectMarqueeExe (selectionInfo) {
  await executeAsModal(async () => {
    reSelectMarqueeCommand(selectionInfo)
  })
}

async function snapshot_layer () {
  let result
  let psAction = require('photoshop').action
  ids = app.activeDocument.activeLayers.map(layer => layer.id)
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
      version: 5
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
  result = await psAction.batchPlay(command, {})
  return result
}

async function snapshot_layerExe () {
  await require('photoshop').core.executeAsModal(snapshot_layer, {
    commandName: 'Action Commands'
  })
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
    console.log('exportPng error:', e)
  }
}

// await runModalFunction();
async function setInitImage (layer, session_id) {
  // const layer = await app.activeDocument.activeLayers[0]
  const old_name = layer.name 
  const sdapi = require('./sdapi')
  await exportPng(session_id)
  // image_name = await app.activeDocument.activeLayers[0].name

  image_name = layerNameToFileName(old_name,layer.id,random_session_id)
  // image_name = layer.name
  image_name = `${image_name}.png`
  g_init_image_name = image_name
  console.log(image_name)
  const image_src = await sdapi.getInitImage(g_init_image_name)
  let ini_image_element = document.getElementById('init_image')
  ini_image_element.src = image_src
}
async function setInitImageMask (layer, session_id) {
  // const layer = await app.activeDocument.activeLayers[0]
  const old_name = layer.name 
  const sdapi = require('./sdapi')
  await exportPng(session_id)
  //get the active layer name
  // image_name = await app.activeDocument.activeLayers[0].name
  image_name = layerNameToFileName(old_name,layer.id,random_session_id)
  // image_name = layer.name
  image_name = `${image_name}.png`
  g_init_image_mask_name = image_name
  console.log(image_name)
  const image_src = await sdapi.getInitImage(g_init_image_mask_name)
  const ini_image_mask_element = document.getElementById('init_image_mask')
  ini_image_mask_element.src = image_src
}

// remove the generated mask related layers from the canvas and "layers" panel

async function cleanSnapAndFill(layers){
  //delete init image group
  //delete init image (snapshot layer)
  //delete fill layer 


  for (layer of layers){
    await executeAsModal(async ()=>{await layer.delete()})
  }
return []
}

async function cleanLayers(layers){
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
    createClippingMaskCommand()
  })
}

async function checkIfSelectionAreaIsActive()
{
  let isSelectionAreaValid = getSelectionInfoExe()
return isSelectionAreaValid
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
    saveUniqueDocumentIdCommand()
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
  cleanSnapAndFill,
  cleanLayers,
  createClippingMaskExe,
  checkIfSelectionAreaIsActive,
  selectMarqueeRectangularToolExe,
  promptForMarqueeTool,
  saveUniqueDocumentIdExe,
  readUniqueDocumentIdExe
}
