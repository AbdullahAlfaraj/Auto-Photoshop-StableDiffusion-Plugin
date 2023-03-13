const psapi = require('../psapi')
const file_util = require('./file_util')
const storage = require('uxp').storage
const app = window.require('photoshop').app

async function getCurrentDocFolder() {
    const uuid = await getUniqueDocumentId()

    return await getDocFolder(uuid)
}

async function getInitImagesDir() {
    const uuid = await getUniqueDocumentId()

    let doc_folder = await getDocFolder(uuid)
    let init_folder
    try {
        init_folder = await doc_folder.getEntry('init_images')
    } catch (e) {
        console.warn(e)
        //create document folder
        init_folder = await doc_folder.createFolder('init_images')
    }
    return init_folder
}
async function saveFileInSubFolder(b64Image, sub_folder_name, file_name) {
    const img = file_util._base64ToArrayBuffer(b64Image)

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

async function saveJsonFileInSubFolder(json, sub_folder_name, file_name) {
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

// open an image in the plugin folder as new document
// async function openImageAction() {
//     const fs = storage.localFileSystem
//     try {
//         let pluginFolder = await fs.getPluginFolder()
//         // let theTemplate = await pluginFolder.getEntry("/image1.png");
//         //directory where all image's request folders are. one folder for each request
//         const relative_dir_path = `./server/python_server/`
//
//         const image_path = `${relative_dir_path}/${
//             session.GenerationSession.instance().currentImagePath
//         }`
//         // 'C:/Users/abdul/Desktop/photoshop_plugins/my_plugin_1/server/python_server/output- 1670544300.95411.png'
//         let theTemplate = await pluginFolder.getEntry(image_path)
//
//         await app.open(theTemplate)
//     } catch (e) {
//         console.warn("couldn't open image ", e)
//     }
// }

async function getUniqueDocumentId() {
    console.warn(
        'getUniqueDocumentId is deprecated, instead use the methods in IOFolder'
    )
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

async function getDocFolder(doc_uuid) {
    try {
        // const uuid = await getUniqueDocumentId()
        const data_folder = await storage.localFileSystem.getDataFolder()

        let doc_folder
        try {
            doc_folder = await data_folder.getEntry(doc_uuid)
        } catch (e) {
            console.warn(e)
            //create document folder
            doc_folder = await data_folder.createFolder(doc_uuid)
        }

        return doc_folder
    } catch (e) {
        console.warn(e)
    }
}

// async function openImageExe() {
//     await require('photoshop').core.executeAsModal(
//         openImageAction
//     )
// }

module.exports = {
    getCurrentDocFolder,
    getInitImagesDir,
    saveFileInSubFolder,
    saveJsonFileInSubFolder,
    // openImageAction,
    getUniqueDocumentId,
    getDocFolder,
    // openImageExe,
}
