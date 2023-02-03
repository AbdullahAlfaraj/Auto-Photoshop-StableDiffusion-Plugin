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

router = APIRouter()
@router.get("/config")
async def get_state():
    print("hello get /config auto-photoshop-sd")
    res = "hello get /config auto-photoshop-sd"
    return {"res": res}

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




def on_app_started(demo: gr.Blocks, app: FastAPI):
    # print("hello on_app_started auto-photoshop-plugin")
  
    if shared.cmd_opts.api:
        app.include_router(router, prefix="/sdapi/auto-photoshop-sd", tags=['Auto Photoshop SD Plugin API'])

        
    else:
        print("COMMANDLINE_ARGS does not contain --api, API won't be mounted.")
        
        # logger.warning("COMMANDLINE_ARGS does not contain --api, API won't be mounted.")
    # if you wanted to do anything massive to the UI, you could modify demo, but why?

script_callbacks.on_app_started(on_app_started)