const { executeAsModal } = require('photoshop').core
const storage = require('uxp').storage
const fs = storage.localFileSystem
const formats = require("uxp").storage.formats;
async function exportPngCommand () {
  const batchPlay = require('photoshop').action.batchPlay
  // const result = await batchPlay { _obj: “exportSelectionAsFileTypePressed”}

  // const destFolder = (await storage.localFileSystem.getDataFolder()).nativePath;
  const storage = require('uxp').storage
  const fs = storage.localFileSystem
  
        let pluginFolder = await fs.getPluginFolder()
        // await fs.getFolder("./init_images")
        let init_images_dir = await pluginFolder.getEntry("./server/python_server/init_images")
        
  const exportCommand = {
    _obj: 'exportSelectionAsFileTypePressed',
    _target: { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
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
async function exportPng () {
  const { executeAsModal } = require('photoshop').core
  try {
    await executeAsModal(exportPngCommand)
  } catch (e) {
    console.warn('exportPng error:', e)
  }
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

const psapi = require('./psapi')
async function newExportPng (layer,image_name) {
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
    let exportDoc = await executeAsModal(async ()=>{
      
      return await app.documents.add
    })

    // for (layer of layersToExport) {
      await executeAsModal(async () => {
        console.log(layer.id)
        const dupLayer = await layer.duplicate(exportDoc)
        await psapi.selectLayers([dupLayer])
        await psapi.selectLayerChannelCommand()
        const selection_info = await psapi.getSelectionInfoExe()
        await exportDoc.crop(selection_info)
        // export_image_name = `${layer.name}.png`
        await readPng(image_name)
        // await exportDoc.closeWithoutSaving()
      })
    // }
  } catch (e) {
    console.warn(e)
  }
}

  
    



///////////////////////Start method 3///////////////////////
//My saveFolder is assigned as a global var earlier in the plugin
// var saveFolder = await require("uxp").storage.localFileSystem.getFolder();
// var saveFolder = await require("uxp").storage.localFileSystem.getPluginFolder();

// // Again, my variable here is global and assigned earlier. The value is changed during a batch loop for each file.
// var saveFile = await saveFolder.createFile("fileName.png");  

// You need to assign a token before saving.  
// const saveFileToken = await require("uxp").storage.localFileSystem.createSessionToken(saveFile);  

//To save the file
// await savePNG(saveFileToken); 

/* 
The save function is batchPlay.  This is the only way I found to control the compression type. I could get the DOM to save as PNG. However, I could never get it to control the compressions type for PNG. That may be possible with the DOM but not documented... not sure.

For the save function, if running UXP AP1 version 1 then use "wait" for modalBehavior. This was a workaround for a PS bug that was causing issues with "fail".  

If running on UXP API version 2 then use "execute" for modalBahavior, or remove the options and use {} so the options go to default.
*/
async function savePNG(saveDataTemp){
  
  const batchPlay = require("photoshop").action.batchPlay;
  

    async function savePNGCommand(){
  
    
    var saveFolder = await require("uxp").storage.localFileSystem.getPluginFolder();
  
    // Again, my variable here is global and assigned earlier. The value is changed during a batch loop for each file.
    var saveFile = await saveFolder.createFile("fileName.png");  
    
    const saveData = await require("uxp").storage.localFileSystem.createSessionToken(saveFile);  

const result = await batchPlay(
[
   {
      "_obj": "save",
      "as": {
         "_obj": "PNGFormat",
         "method": {
            "_enum": "PNGMethod",
            "_value": "quick"
         },
         "PNGInterlaceType": {
            "_enum": "PNGInterlaceType",
            "_value": "PNGInterlaceNone"
         },
         "PNGFilter": {
            "_enum": "PNGFilter",
            "_value": "PNGFilterAdaptive"
         },
         "compression": 6
      },
      "in": {
         "_path": saveData,
         "_kind": "local"
      },
      "saveStage": {
         "_enum": "saveStageType",
         "_value": "saveBegin"
      },
      "_isCommand": false,
      "_options": {
         "dialogOptions": "dontDisplay"
      }
   }
],{
   "synchronousExecution": true,
   "modalBehavior": "execute"
});    

}
await executeAsModal(async ()=>{
  savePNGCommand()
});
}    










////////////////////End method 3////////////////////////////








module.exports = {
  exportPng,
  readPng,
  savePNG,
  newExportPng
    };