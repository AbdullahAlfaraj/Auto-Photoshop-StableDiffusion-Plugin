
# controlnet original + txt2img
import requests
import cv2
import numpy as np
from base64 import b64encode , b64decode
from PIL import Image
import io

def readImage(path):
    img = cv2.imread(path)
    retval, buffer = cv2.imencode('.jpg', img)
    b64img = b64encode(buffer).decode("utf-8")
    return b64img

def readb64(uri):
   nparr = np.fromstring(b64decode(uri), np.uint8)
   img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
   return img

b64img = readImage("output_image.png")

class controlnetRequest():
    def __init__(self, prompt):
        self.url = "http://127.0.0.1:7860/controlnet/txt2img" #openpose
        self.body = {
            "prompt": prompt,
            "negative_prompt": "",
            "seed": -1,
            "subseed": -1,
            "subseed_strength": 0,
            "batch_size": 1,
            "n_iter": 1,
            "steps": 30,
            "cfg_scale": 14,
            "width": 512,
            "height": 512,
            "restore_faces": True,
            "eta": 0,
            "sampler_index": "DDIM",
            "controlnet_model": "Test_ziva",
            "controlnet_input_image": [b64img],
            "controlnet_module": 'depth',
            "ControlNet Weight": 1,
            "controlnet_model": 'control_sd15_depth [fef5e48e]',
            "controlnet_guidance": 1
        }

    def sendRequest(self):
        # print(self.simple_txt2img)
        r = requests.post(self.url, json=self.body)
        print(r)
        return r.json()
 
js = controlnetRequest("clothed busty bird").sendRequest()


for x,i in enumerate(js['images']):
    image = Image.open(io.BytesIO(b64decode(i.split(",",1)[0])))
    image.save(str(x)+'output.png')



len(js['images'])
print(js)