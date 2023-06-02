
import json
import requests
import io
import base64
from PIL import Image, PngImagePlugin
import asyncio
import httpx


import os
import time
import serverHelper
import prompt_shortcut
import metadata_to_json
import search
sd_url = os.environ.get('SD_URL', 'http://127.0.0.1:7860')




async def txt2ImgRequest(payload):
    # payload = { 
    #     "prompt": "cute cat, kitten",
    #     "steps": 10
    # }
    print("payload: ",payload)
    
    if(payload['use_prompt_shortcut']): # use edit prompt
        #edit prompt, replaceShortcut(prompt)
        prompt_shortcut_dict = prompt_shortcut.load()
        prompt_shortcut_dict.update(payload["prompt_shortcut_ui_dict"])
        payload['prompt'] = prompt_shortcut.replaceShortcut(payload['prompt'],prompt_shortcut_dict)
        # edit negative prompt, replaceShortcut(negative_prompt)
        payload['negative_prompt'] = prompt_shortcut.replaceShortcut(payload['negative_prompt'],prompt_shortcut_dict)
        
    
    #request the images to be generated
    request_path = "/sdapi/v1/txt2img"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url=f'{sd_url}/sdapi/v1/txt2img', json=payload, timeout=None)
        r = response.json()

        #create a directory to store the images at
        # dirName = f'{time.time()}'
        # dir_fullpath,dirName = serverHelper.makeDirPathName()
        uniqueDocumentId = payload['uniqueDocumentId']
        dir_fullpath,dirName = serverHelper.getUniqueDocumentDirPathName(uniqueDocumentId)
        serverHelper.createFolder(dir_fullpath)
        image_paths = []
        #for each image store the prompt and settings in the meta data
        metadata = []
        images_info = []
        for i in r['images']:
            image = Image.open(io.BytesIO(base64.b64decode(i.split(",",1)[0])))

            png_payload = {
                "image": "data:image/png;base64," + i
            }
            response2 = await client.post(url=f'{sd_url}/sdapi/v1/png-info', json=png_payload)
            pnginfo = PngImagePlugin.PngInfo()
            pnginfo.add_text("parameters", response2.json().get("info"))
            image_name = f'output- {time.time()}.png'
            
            image_path = f'output/{dirName}/{image_name}'
            image_paths.append(image_path)
            image.save(f'./{image_path}', pnginfo=pnginfo)
            
            metadata_info = response2.json().get("info")
            metadata_json = metadata_to_json.convertMetadataToJson(metadata_info)
            metadata.append(metadata_json)
            images_info.append({"base64":i,"path":image_path})
            print("metadata_json: ", metadata_json)
        
        
        return dirName,images_info,metadata

import base64
from io import BytesIO


def img_2_b64(image):
    buff = BytesIO()
    image.save(buff, format="PNG")
    img_byte = base64.b64encode(buff.getvalue())
    img_str = img_byte.decode("utf-8")
    return img_str


from typing import Union

from fastapi import FastAPI
from fastapi import APIRouter, Request



router = APIRouter()


@router.get("/")
def read_root():
    return {"Hello": "World"}


@router.get("/version")
def getVersion():
    manifest_dir = "..\..\manifest.json"
    
    manifest = {'version': '0.0.0'}
    version = "0.0.0"
    try:

        with open(manifest_dir, 'r') as f:
            manifest = json.load(f)
            version = manifest['version']
    except:
        print("couldn't read the manifest.json")
    return {"version": f"v{version}"}






# @router.post("/txt2img/")
# async def txt2ImgHandle(payload:Payload):
#     print("txt2ImgHandle: \n")
#     txt2ImgRequest(payload)
#     return {"prompt":payload.prompt,"images": ""}


from fastapi import Request, Response
import img2imgapi






@router.post("/sd_url/")
async def changeSdUrl(request:Request):
    global sd_url
    try:

        payload = await request.json()
        print("changeSdUrl: payload:",payload)
        print(f"change sd url from {sd_url} to {payload['sd_url']} \n")
        sd_url = payload['sd_url']
    except:
        print("error occurred in changeSdUrl()")
        #  response.body = resp.content
        # return {}
    return {"sd_url":sd_url}









@router.post("/txt2img/")
async def txt2ImgHandle(request:Request):
    print("txt2ImgHandle: \n")
    payload = await request.json() 
    dir_name,images_info,metadata, = await txt2ImgRequest(payload)
    # return {"prompt":payload.prompt,"images": ""}
    return {"payload": payload,"dir_name": dir_name,"images_info":images_info,"metadata":metadata}

@router.post("/img2img/")
async def img2ImgHandle(request:Request):
    print("img2ImgHandle: \n")
    payload = await request.json() 
    dir_name,images_info,metadata = await img2imgapi.img2ImgRequest(sd_url,payload)
    # return {"prompt":payload.prompt,"images": ""}
    return {"payload": payload,"dir_name": dir_name,"images_info":images_info,"metadata":metadata}






@router.post("/getInitImage/")
async def getInitImageHandle(request:Request):
    print("getInitImageHandle: \n")
    payload = await request.json() 
    print("payload:",payload)
    init_img_dir = "./init_images"
    init_img_name = payload["init_image_name"]# change this to "image_name"
    
    numOfAttempts = 3
    init_img_str = ""
    for i in range(numOfAttempts):
        try:
            image_path = f"{init_img_dir}/{init_img_name}"
            init_img = Image.open(image_path)
            init_img_str = img_2_b64(init_img)

            
            # # If file exists, delete it.
            # if os.path.isfile(image_path):
            #     os.remove(image_path)
        except:
            print(f"exception:fail to read an image file {image_path}, will try again {i} of {numOfAttempts}")
            #sleep for one second every time you try to read an image and fail
            time.sleep(1)
            continue;
    
    
    
    return {"payload": payload,"init_image_str":init_img_str}

@router.get('/config')
async def sdapi(request: Request, response: Response):
    try:
        
        resp = requests.get(url=f'{sd_url}/config', params=request.query_params)
        response.status_code = resp.status_code
        response.body = resp.content
    except:
        print(f'exception: fail to send request to {sd_url}/config')
        print(f'{request}')
    return response

@router.get('/sdapi/v1/{path:path}')
async def sdapi(path: str, request: Request, response: Response):
    try:
        
        resp = requests.get(url=f'{sd_url}/sdapi/v1/{path}', params=request.query_params)
        response.status_code = resp.status_code
        response.body = resp.content
    except:
        print(f'exception: fail to send request to {sd_url}/sdapi/v1/{path}')
        print(f'{request}')
    return response

@router.post('/sdapi/v1/{path:path}')
async def sdapi(path: str, request: Request, response: Response):
    try:
        json = await request.json()
    except: 
        json = {}

    try:
        # if(path =="interrupt"):
        #     resp = requests.post(url=f'{sd_url}/sdapi/v1/{path}', params=request.query_params)

        # else:
        #     resp = requests.post(url=f'{sd_url}/sdapi/v1/{path}', params=request.query_params, json=await request.json())
        resp = requests.post(url=f'{sd_url}/sdapi/v1/{path}', params=request.query_params, json=json)

        response.status_code = resp.status_code
        response.body = resp.content
    except:
        print(f'exception: fail to send request to {sd_url}/sdapi/v1/{path}')
        print(f'{request}')
    return response



# async def base64ToPng(base64_image,image_path):
#     base64_img_bytes = base64_image.encode('utf-8')
#     with open(image_path, 'wb') as file_to_save:
#         decoded_image_data = base64.decodebytes(base64_img_bytes)
#         file_to_save.write(decoded_image_data)


@router.post('/save/png/')
async def savePng(request:Request):
    print("savePng()")
    try:
        json = await request.json()
        
    except: 
        json = {}
    
    print("json:",json)
    try:
        folder = './init_images'
        image_path = f"{folder}/{json['image_name']}"
        await img2imgapi.base64ToPng(json['base64'],image_path)
        
        
        
        
        return {"status":f"{json['image_name']} has been saved"}
    except:
        print(f'{request}')
    return {"error": "error message: could not save the image file"}


@router.post('/search/image/')
async def searchImage(request:Request):
    try:
        json = await request.json()
    except: 
        json = {}
    

    try:
        keywords = json.get('keywords','cute dogs') 
        images = await search.imageSearch(keywords)
        print(images)
        
        
        return {"images":images}
    except:
        print("keywords",keywords)
        # print(f'{request}')
    return {"error": "error message: can't preform an image search"}

@router.post('/mask/expansion/')
async def maskExpansionHandler(request:Request):
    try:
        json = await request.json()
    except: 
        json = {}
    

    try:
        # keywords = json.get('keywords','cute dogs') 
        base64_mask_image = json['mask']
        mask_expansion = json['mask_expansion']
        #convert base64 to img
        
        await img2imgapi.base64ToPng(base64_mask_image,"original_mask.png")#save a copy of the mask for debugging

        mask_image = img2imgapi.b64_2_img(base64_mask_image)
        
        expanded_mask_img = img2imgapi.maskExpansion(mask_image,mask_expansion)
        base64_expanded_mask_image = img2imgapi.img_2_b64(expanded_mask_img)
        await img2imgapi.base64ToPng(base64_expanded_mask_image,"expanded_mask.png")#save a copy of the mask of the expanded_mask for debugging

        print("successful mask expansion operation")
        return {"mask":base64_expanded_mask_image}
    
    except:
        print("request",request)
        raise Exception(f"couldn't preform mask expansion")
    # return response
    return {"error": "error message: can't preform an mask expansion"}


@router.post('/history/load')
async def loadHistory(request: Request):
    # {'image_paths','metadata_setting'}
    history = {}
    try:
        json = await request.json()
    except: 
        json = {}

    try:

        uniqueDocumentId = json['uniqueDocumentId']
        
        import glob

        image_paths = glob.glob(f'./output/{uniqueDocumentId}/*.png')
        settings_paths = glob.glob(f'./output/{uniqueDocumentId}/*.json')#note: why is we are not using settings_paths?
        print("loadHistory: image_paths:", image_paths)
        

        history['image_paths'] = image_paths
        history['metadata_jsons'] = []
        history['base64_images'] = []
        for image_path in image_paths:
            print("image_path: ", image_path)
            metadata_dict = metadata_to_json.createMetadataJsonFileIfNotExist(image_path)
            history['metadata_jsons'].routerend(metadata_dict)
            
            
            img = Image.open(image_path)
            base64_image = img_2_b64(img)
            history['base64_images'].routerend(base64_image)

    except:
        
        print(f'{request}')
    
    #reverse the order so that newer generated images path will be shown first
    

    history['image_paths'].reverse()
    history['metadata_jsons'].reverse()
    history['base64_images'].reverse()    
    return {"image_paths":history['image_paths'], "metadata_jsons":history['metadata_jsons'],"base64_images": history['base64_images']}


@router.post('/prompt_shortcut/load')
async def loadPromptShortcut(request: Request):
    prompt_shortcut_json = {}
    try:
        json = await request.json()
    except: 
        json = {}

    try:

        prompt_shortcut_json = prompt_shortcut.load()
        # response.body = {"prompt_shortcut":prompt_shortcut}
        # response.status_code = 200
    except:
        # print(f'exception: fail to send request to {sd_url}/sdapi/v1/{path}')
        print(f'{request}')
        
    # return response
    return {"prompt_shortcut":prompt_shortcut_json}
@router.post('/prompt_shortcut/save')
async def loadPromptShortcut(request: Request):
    prompt_shortcut_json = {}
    try:
        json = await request.json()
    except: 
        json = {}

    try:
        print("json: ",json)
        print("json['prompt_shortcut']: ",json['prompt_shortcut'])
        # save the prompt shortcut to the prompt_shortcut.json
        prompt_shortcut_json = json['prompt_shortcut']
        # response.body = {"prompt_shortcut":prompt_shortcut}
        # response.body = {"prompt_shortcut":prompt_shortcut}
        prompt_shortcut.writeToJson("prompt_shortcut.json",prompt_shortcut_json)
    except:
        # print(f'exception: fail to send request to {sd_url}/sdapi/v1/{path}')
        print(f'error occurred durning reading the request {request}')
    # return response
    return {"prompt_shortcut":prompt_shortcut_json}

@router.post("/swapModel")
async def swapModel(request:Request):
    print("swapModel: \n")
    payload = await request.json()
    print("payload:",payload)
    model_title = payload.title
    option_payload = {
        # "sd_model_checkpoint": "Anything-V3.0-pruned.ckpt [2700c435]"
        "sd_model_checkpoint": model_title

    }
    response = requests.post(url=f'{sd_url}/sdapi/v1/options', json=option_payload)


import webbrowser
@router.post("/open/url/")
async def openUrl(request:Request):
    try:
        json = await request.json()
    except: 
        json = {}

    url = "" 
    print("json: ",json)
    try:
        url = json['url']
        webbrowser.open(url)  # Go to example.com
    except:
        # print(f'exception: fail to send request to {sd_url}/sdapi/v1/{path}')
        print(f'an error has occurred durning processing the request {request}')
    # return response
    return {"url":url}


@router.get('/lora/list')
async def list_available_loras():
    lora_dict = {}
    try:
        from modules import shared
        import glob

        os.makedirs(shared.cmd_opts.lora_dir, exist_ok=True)

        candidates = \
            glob.glob(os.path.join(shared.cmd_opts.lora_dir, '**/*.pt'), recursive=True) + \
            glob.glob(os.path.join(shared.cmd_opts.lora_dir, '**/*.safetensors'), recursive=True) + \
            glob.glob(os.path.join(shared.cmd_opts.lora_dir, '**/*.ckpt'), recursive=True)

        for filename in sorted(candidates, key=str.lower):
            if os.path.isdir(filename):
                continue

            name = os.path.splitext(os.path.basename(filename))[0]
            print("lora name: ",name)
            # available_loras[name] = LoraOnDisk(name, filename)
            lora_dict[name] = name

    except Exception as e:
        print("list_available_loras() error ",repr(e),e)
    return lora_dict

@router.get('/vae/list')
async def list_available_vae():
    sd_vae_dict = {}
    try:
        from modules import shared_items
        sd_vae_dict = shared_items.sd_vae_items()
        print("sd_vae_dict:", sd_vae_dict)
    except Exception as e:
        print("list_available_vae() error ",repr(e),e)
    return sd_vae_dict


app = FastAPI()
app.include_router(router)
