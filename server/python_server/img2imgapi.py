import json
import requests
import io
import base64
from PIL import Image, PngImagePlugin
# from serverMain import sd_url
import asyncio
import httpx


from io import BytesIO
import prompt_shortcut

# Convert Image to Base64 
def img_2_b64(image):
    buff = BytesIO()
    image.save(buff, format="PNG")
    img_byte = base64.b64encode(buff.getvalue())
    img_str = img_byte.decode("utf-8")
    return img_str

import time
import serverHelper
import metadata_to_json

async def img2ImgRequest(sd_url,payload):
    # init_img = Image.open(r"C:/Users/abdul/Desktop/photoshop_plugins/my_plugin_1/server/python_server/output- 1670544300.95411.png") 
    print("payload debug:",payload)
    
    if(payload['use_prompt_shortcut']): # use edit prompt
        #edit prompt, replaceShortcut(prompt)
        prompt_shortcut_dict = prompt_shortcut.load()
        prompt_shortcut_dict.update(payload["prompt_shortcut_ui_dict"])
        payload['prompt'] = prompt_shortcut.replaceShortcut(payload['prompt'],prompt_shortcut_dict)
        # edit negative prompt, replaceShortcut(negative_prompt)
        payload['negative_prompt'] = prompt_shortcut.replaceShortcut(payload['negative_prompt'],prompt_shortcut_dict)
        
    init_img_dir = "./init_images"
    init_img_name = payload['init_image_name']
    init_img = Image.open(f"{init_img_dir}/{init_img_name}")
    init_img_str = img_2_b64(init_img) 
    payload['init_images'] = [init_img_str]

    # mask

    init_img_mask_name = payload.get('init_image_mask_name',"")
    

    #only if image exist then try to open it
    if(len(init_img_mask_name) > 0):
        init_img_mask = Image.open(f"{init_img_dir}/{init_img_mask_name}")
        init_img_mask_str = img_2_b64(init_img_mask) 
        payload['mask'] = init_img_mask_str #there is only one mask, unlike 'init_images' which is of type array


    # payload = { 
    #     "prompt": "cute dog",
    #     "steps": 10,
    #     "init_images":[init_img_str],
    #     "n_iter":3
    # }
    # print("payload:",payload)
    print(type(init_img_str))
    #request the images to be generated
    async with httpx.AsyncClient() as client:
        response = await client.post(url=f'{sd_url}/sdapi/v1/img2img', json=payload, timeout=None)

        r = response.json()

        #create a directory to store the images at
        # dirName = f'{time.time()}'
        # dir_fullpath,dirName = serverHelper.makeDirPathName()
        uniqueDocumentId = payload['uniqueDocumentId']
        dir_fullpath,dirName = serverHelper.getUniqueDocumentDirPathName(uniqueDocumentId)
        serverHelper.createFolder(dir_fullpath)
        image_paths = []
        metadata = []
        #for each image store the prompt and settings in the meta data
        for i in r['images']:
            image = Image.open(io.BytesIO(base64.b64decode(i.split(",",1)[0])))

            png_payload = {
                "image": "data:image/png;base64," + i
            }
            response2 = await client.post(url=f'{sd_url}/sdapi/v1/png-info', json=png_payload, timeout=None)
            pnginfo = PngImagePlugin.PngInfo()
            pnginfo.add_text("parameters", response2.json().get("info"))
            image_name = f'output- {time.time()}.png'
            image_path = f'output/{dirName}/{image_name}'
            image_paths.append(image_path)
            image.save(f'./{image_path}', pnginfo=pnginfo)

            metadata_info = response2.json().get("info")
            metadata_json = metadata_to_json.convertMetadataToJson(metadata_info)
            metadata.append(metadata_json)
            print("metadata_json: ", metadata_json)   
        
        return dirName,image_paths,metadata

if __name__=="__main__":
    img2ImgRequest()