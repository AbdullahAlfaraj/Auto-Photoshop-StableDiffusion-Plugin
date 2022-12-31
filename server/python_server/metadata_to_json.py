import os
from pathlib import Path
from PIL import Image
import json

import serverHelper
# metadata_str = 'cute cat\nSteps: 20, Sampler: Euler a, CFG scale: 7.0, Seed: 2253354038, Size: 512x512, Model hash: 3e16efc8, Seed resize from: -1x-1, Denoising strength: 0, Conditional mask weight: 1.0'
def convertMetadataToJson(metadata_str):
    print(metadata_str)
    last_new_line_index = metadata_str.rindex('\n')
    prompt = metadata_str[:last_new_line_index]
    other_settings = metadata_str[last_new_line_index+1:] 

    print("prompt:", prompt)
    print("other_settings:", other_settings)
    sub_settings = other_settings.split(",")
    print("sub_settings: ",sub_settings)

    settings_dict = {}
    settings_dict['prompt'] = prompt

    for setting in sub_settings:
        [key,value]= setting.split(":")
        key =  key.lstrip(' ')
        value =  value.lstrip(' ')
        settings_dict[key] = value
    import json
    settings_json = json.dumps(settings_dict)
    print("settings_dict: ",settings_dict)
    print("settings_json ",settings_json)
    return settings_json




def getMetadataFromPng(image_path):
    # image_path = "./output/5c42fd2a-6708-45e2-b282-2e9f3894368e/output- 1672476035.4888158.png"
    # image_path = "C:/Users/abdul/Desktop/auto-photoshop/Auto-Photoshop-StableDiffusion-Plugin/server/python_server/output/5c42fd2a-6708-45e2-b282-2e9f3894368e/output- 1672476035.4888158.png"
    im = Image.open(image_path) 
    # im.load()  # Needed only for .png EXIF data (see citation above)
    # print(im.info['parameters'])
    metadata_string = im.info['parameters']
    metadata_json_string = convertMetadataToJson(metadata_string)
    metadata_dict = json.loads(metadata_json_string)
    print("metadata_dict: ", metadata_dict)
    # print(im.info['meta_to_read'])
    return metadata_dict


def createMetadataJsonFileIfNotExist(image_path):
    
    # image_name = os.path.splitext(image_path)
    image_name = Path(image_path).stem
    # parent_dir_path = Path(image_path)
    # parent_dir_path = image_path.split(image_name)[0]
    # os.path.join()
    head = os.path.split(image_path)[0]
    json_file_tail = f'{image_name}.json'
    json_full_path = os.path.join(head,json_file_tail)
    print("image_name: ",image_name)
    print("json_full_path: ",json_full_path)
    isExist = os.path.exists(json_full_path)
    if(isExist):
        #read metadata from json
        metadata_dict = serverHelper.readJson(json_full_path)
        
    else:
        #read metadata from image
        #save the metadata to a json file
        metadata_dict = getMetadataFromPng(image_path)
        serverHelper.writeJson(json_full_path,metadata_dict)
    return metadata_dict
        

if __name__ == "__main__":
    image_path = "C:/Users/abdul/Desktop/auto-photoshop/Auto-Photoshop-StableDiffusion-Plugin/server/python_server/output/5c42fd2a-6708-45e2-b282-2e9f3894368e/output- 1672476035.4888158.png"
    # getMetadataFromPng(image_path)
    createMetadataJsonFileIfNotExist(image_path)
