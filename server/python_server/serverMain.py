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
            print("metadata_json: ", metadata_json)

        return dirName,image_paths,metadata

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

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/version")
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






# @app.post("/txt2img/")
# async def txt2ImgHandle(payload:Payload):
#     print("txt2ImgHandle: \n")
#     txt2ImgRequest(payload)
#     return {"prompt":payload.prompt,"images": ""}


from fastapi import Request, Response
import img2imgapi






@app.post("/sd_url/")
async def changeSdUrl(request:Request):
    global sd_url
    try:

        payload = await request.json()
        print("changeSdUrl: payload:",payload)
        print(f"change sd url from {sd_url} to {payload['sd_url']}: \n")
        sd_url = payload['sd_url']
    except:
        print("error occurred in changeSdUrl()")
        #  response.body = resp.content
        # return {}
    return {"sd_url":sd_url}









@app.post("/txt2img/")
async def txt2ImgHandle(request:Request):
    print("txt2ImgHandle: \n")
    payload = await request.json() 
    dir_name,image_paths,metadata = await txt2ImgRequest(payload)
    # return {"prompt":payload.prompt,"images": ""}
    return {"payload": payload,"dir_name": dir_name,"image_paths":image_paths,"metadata":metadata}

@app.post("/img2img/")
async def img2ImgHandle(request:Request):
    print("img2ImgHandle: \n")
    payload = await request.json() 
    dir_name,image_paths,metadata = await img2imgapi.img2ImgRequest(sd_url,payload)
    # return {"prompt":payload.prompt,"images": ""}
    return {"payload": payload,"dir_name": dir_name,"image_paths":image_paths,"metadata":metadata}






@app.post("/getInitImage/")
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

@app.get('/sdapi/v1/{path:path}')
async def sdapi(path: str, request: Request, response: Response):
    resp = requests.get(url=f'{sd_url}/sdapi/v1/{path}', params=request.query_params)
    response.status_code = resp.status_code
    response.body = resp.content
    return response

@app.post('/sdapi/v1/{path:path}')
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


@app.post('/history/load')
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
        settings_paths = glob.glob(f'./output/{uniqueDocumentId}/*.json')
        print("loadHistory: image_paths:", image_paths)
        history['image_paths'] = image_paths
        history['metadata_jsons'] = []
        for image_path in image_paths:
            metadata_dict = metadata_to_json.createMetadataJsonFileIfNotExist(image_path)
            history['metadata_jsons'].append(metadata_dict)  
        
    except:
        
        print(f'{request}')
    
    # return response
    return {"image_paths":history['image_paths'], "metadata_jsons":history['metadata_jsons']}


@app.post('/prompt_shortcut/load')
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
@app.post('/prompt_shortcut/save')
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

@app.post("/swapModel")
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