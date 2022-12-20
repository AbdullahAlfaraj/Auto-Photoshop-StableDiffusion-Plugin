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
    console.log('exportPng error:', e)
  }
}



module.exports = {
  exportPng
    };