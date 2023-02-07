from modules import scripts, processing, shared, images, devices, ui, lowvram
import gradio
import requests
import time
import PIL.Image
import base64
import io
import os.path
import numpy
import itertools
import gradio as gr
import torch
from fastapi import FastAPI
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from modules import script_callbacks, scripts, shared


import sys
python_server_dir = 'server/python_server'
extension_dir = scripts.basedir()
python_server_full_path = os.path.join(extension_dir,python_server_dir)
print("python_server_full_path: ",python_server_full_path)
sys.path.insert(0, python_server_full_path)
import search
import img2imgapi
import serverMain

router = APIRouter()

# @router.get("/config")
# async def get_state():
#     print("hello get /config auto-photoshop-sd")
#     res = "hello get /config auto-photoshop-sd"
#     return {"res": res}

@router.post('/search/image/')
async def searchImage(request:Request):
    try:
        json = await request.json()
    except: 
        json = {}
    

    try:
        keywords = json.get('keywords','cute cats') 
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
    
    # print("mask expansion json :",json)
    try:
        # keywords = json.get('keywords','cute dogs') 
        base64_mask_image = json['mask']
        mask_expansion = json['mask_expansion']
        #convert base64 to img
        
        await img2imgapi.base64ToPng(base64_mask_image,"original_mask.png")#save a copy of the mask

        mask_image = img2imgapi.b64_2_img(base64_mask_image)
        
        expanded_mask_img = img2imgapi.maskExpansion(mask_image,mask_expansion)
        base64_expanded_mask_image = img2imgapi.img_2_b64(expanded_mask_img)
        await img2imgapi.base64ToPng(base64_expanded_mask_image,"expanded_mask.png")#save a copy of the mask


        return {"mask":base64_expanded_mask_image}
    
    except:
        # print("request",request)
        raise Exception(f"couldn't preform mask expansion",json)
    # return response
    return {"error": "error message: can't preform an mask expansion"}



def on_app_started(demo: gr.Blocks, app: FastAPI):
    # print("hello on_app_started auto-photoshop-plugin")
  
    if shared.cmd_opts.api:
        app.include_router(serverMain.router, prefix="/sdapi/auto-photoshop-sd", tags=['Auto Photoshop SD Plugin API'])
        # app.include_router(router, prefix="/sdapi/auto-photoshop-sd", tags=['Auto Photoshop SD Plugin API'])

        
    else:
        print("COMMANDLINE_ARGS does not contain --api, API won't be mounted.")
        
        # logger.warning("COMMANDLINE_ARGS does not contain --api, API won't be mounted.")
    # if you wanted to do anything massive to the UI, you could modify demo, but why?

script_callbacks.on_app_started(on_app_started)