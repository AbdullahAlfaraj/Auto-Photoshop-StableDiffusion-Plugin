const sdapi = require('../../sdapi_py_re')

const storage = require('uxp').storage
const fs = storage.localFileSystem

//REFACTOR: move to events.js
document
    .getElementById('btnImageSearch')
    .addEventListener('click', async function () {
        try {
            // const output_dir_relative = "./server/python_server/"
            const container = document.getElementById(
                'divImageSearchImagesContainer'
            )
            // const uniqueDocumentId = await getUniqueDocumentId()
            // const [image_paths, metadata_jsons] = await sdapi.loadHistory(uniqueDocumentId)
            const keywords = document.getElementById('imageSearchField').value
            const image_search_objs = await sdapi.imageSearch(keywords)
            while (container.firstChild) {
                container.removeChild(container.firstChild)
            }

            // let i = 0
            const temp_entry = await fs.getTemporaryFolder()
            for (let image_search_obj of image_search_objs) {
                const img = document.createElement('img')
                // img.src = image_search_obj['image']

                img.src = image_search_obj['thumbnail']

                img.className = 'image-search'
                // img.dataset.metadata_json_string = JSON.stringify(metadata_jsons[i])
                container.appendChild(img)
                img.addEventListener('click', async (e) => {
                    console.log(`the image url: ${img.src}`)
                    const link = img.src
                    const image_file_name = 'search_image_temp.png'
                    await downloadItExe(link, temp_entry, image_file_name)
                    // const metadata_json = JSON.parse(e.target.dataset.metadata_json_string)
                    // console.log("metadata_json: ",metadata_json)
                    // document.querySelector('#tiSeed').value = metadata_json.Seed
                    // document.querySelector('#historySeedLabel').textContent = metadata_json.Seed
                })
                // i++
            }
        } catch (e) {
            console.warn(`imageSearch warning: ${e}`)
        }
    })
