
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