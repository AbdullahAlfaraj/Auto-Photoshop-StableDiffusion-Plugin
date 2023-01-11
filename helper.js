const app = window.require('photoshop').app

function getActiveLayer () {
  let activeLayers = app.activeDocument.activeLayers
  // console.dir(getSize())
  for (const layer of activeLayers) {
    console.dir({ layer })
    const name = layer.name
    console.dir({ name })
    let layer_size = getLayerSize(layer)
    console.dir({ layer_size })
  }

  return activeLayers[0]
}
// async function scaleDownLayer () {
//   let layer = getActiveLayer()
//   console.log(layer.name)
//   async function scaleLayer (executionContext) {
//     console.log('scaleLayer got called')
//     await layer.scale(50, 50)
//   }

//   await require('photoshop').core.executeAsModal(scaleLayer)
// }

function getSize () {
  let doc = app.activeDocument
  return { height: doc.height, width: doc.width }
}

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
async function getSelectionInfo () {
  console.log('getSelectionInfo was called')

  const { batchPlay } = require('photoshop').action
  const { executeAsModal } = require('photoshop').core

  async function batchPlayWrapper () {
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

  try {
    const selection = (await executeAsModal(batchPlayWrapper))[0].selection

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

const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core

async function reselectBatchPlay(selectionInfo){
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

async function reselect(selectionInfo){
await executeAsModal(async () => {
  reselectBatchPlay(selectionInfo)
},  {'commandName': 'reselect'})

}


//unselect the rectangular marquee selection area
async function unSelect () {
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

async function layerToSelectionHelper () {
  // console.log("executeAsModal layer.translate")

  //get selection info
  let activeLayer = getActiveLayer()
  let selectionInfoPromise = await getSelectionInfo()
  selectionInfoPromise.then(async value => {
    console.dir(value)

    let selection = value[0].selection

    // let selectionInfo = value[0].selection

    //unselect everything so you can move the layer
    // top_new = layer_info.top - top_dist
    executeAsModal(unSelect).then(() => {
      console.log('done unSelect Exe')
      //scale layer
      async function scaleLayer (executionContext) {
        console.log('scaleLayer got called')
        let layer_info = getLayerSize(activeLayer)
        scale_x_ratio = (selection_info.width / layer_info.width) * 100
        scale_y_ratio = (selection_info.height / layer_info.height) * 100
        console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
        activeLayer.scale(scale_x_ratio, scale_y_ratio)
      }

      executeAsModal(scaleLayer).then(async () => {
        console.log('done scaling Exe')

        await require('photoshop').core.executeAsModal(moveLayerExe)
      })
    })
  })
}

async function layerToSelection () {
  //store active layer for later

  const { executeAsModal } = require('photoshop').core

  try {
    //Store selection info
    //unSelect
    //move layer
    //scale layer
    //Select from selection info
    let selection_info = await getSelectionInfo()
    console.dir({ selection_info })

    console.log('selection_info:')
    console.dir({ selection_info })

    console.log('unSelect')

    await executeAsModal(unSelect,  {'commandName': 'unSelect'})

     //scale layer
     async function scaleLayer (executionContext) {
        console.log('scaleLayer got called')
        const activeLayer = getActiveLayer()
        let layer_info = getLayerSize(activeLayer)
        scale_x_ratio = (selection_info.width / layer_info.width) * 100
        scale_y_ratio = (selection_info.height / layer_info.height) * 100
        console.log('scale_x_y_ratio:', scale_x_ratio, scale_y_ratio)
        activeLayer.scale(scale_x_ratio, scale_y_ratio)
      }
      await executeAsModal(scaleLayer,  {'commandName': 'scaleLayer'})


    async function moveLayerExe (layerToMove, selection_info) {
        // const activeLayer = getActiveLayer()
        let layer_info = getLayerSize(layerToMove)
      top_dist = layer_info.top - selection_info.top
      left_dist = layer_info.left - selection_info.left
      await layerToMove.translate(-left_dist, -top_dist)
    }
    const activeLayer = await getActiveLayer()
    await executeAsModal(async () => {
      await moveLayerExe(activeLayer, selection_info)
    },  {'commandName': 'moveLayerExe'})

    reselect(selection_info)
  } catch (e) {
    console.warn(e)
  }

  //   await executeAsModal(layerToSelectionHelper)

  // .then(()=>{
  //   console.log("layer is transelated by 2000 unit")
  // })
  //get selection info

  //move layer to selection top_left position
}

module.exports = {
  layerToSelection
}
