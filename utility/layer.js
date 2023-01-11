const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core

async function createNewLayerExe (layerName) {

   await executeAsModal(async ()=>{await createNewLayerCommand(layerName)})
   const new_layer = await app.activeDocument.activeLayers[0]
   return new_layer
  }
  
async function createNewLayerCommand (layerName) {
    return await app.activeDocument.createLayer({
      name: layerName,
      opacity: 100,
      mode: 'normal'
    })
  }



  async function deleteLayers(layers){
    const {cleanLayers, getLayerIndex} = require('../psapi')
    await cleanLayers(layers)
  }

  async function getIndexCommand(){
    
   const command = {
    _obj: 'get',
    "_target": [
        { 
           "_property": "itemIndex" 
        },
        {
           "_ref": "layer",
           "_enum": "ordinal",
           "_value": "targetEnum"
        }
   ]
  }
  const result = await batchPlay([command], {
    synchronousExecution: true,
    modalBehavior: 'execute'
  })

  return result
  }

  async function getIndexExe(){
  let index; 
    await executeAsModal(async ()=>{
        index = getIndexCommand()
    })

    return index
  }
  module.exports = {
    
    createNewLayerExe,
    deleteLayers,
    getIndexExe
  }