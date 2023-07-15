#code copied from controlnet repo global_state.py  


preprocessor_filters = {
    "All": "none",
    "Canny": "canny",
    "Depth": "depth_midas",
    "Normal": "normal_bae",
    "OpenPose": "openpose_full",
    "MLSD": "mlsd",
    "Lineart": "lineart_standard (from white bg & black line)",
    "SoftEdge": "softedge_pidinet",
    "Scribble": "scribble_pidinet",
    "Seg": "seg_ofade20k",
    "Shuffle": "shuffle",
    "Tile": "tile_resample",
    "Inpaint": "inpaint_only",
    "IP2P": "none",
    "Reference": "reference_only",
    "T2IA": "none",
}

cn_preprocessor_modules = ["none",
    "canny",
    "depth",
    "depth_leres",
    "depth_leres++",
    "hed",
    "hed_safe",
    "mediapipe_face",
    "mlsd",
    "normal_map",
    "openpose",
    "openpose_hand",
    "openpose_face",
    "openpose_faceonly",
    "openpose_full",
    "clip_vision",
    "color",
    "pidinet",
    "pidinet_safe",
    "pidinet_sketch",
    "pidinet_scribble",
    "scribble_xdog",
    "scribble_hed",
    "segmentation",
    "threshold",
    "depth_zoe",
    "normal_bae",
    "oneformer_coco",
    "oneformer_ade20k",
    "lineart",
    "lineart_coarse",
    "lineart_anime",
    "lineart_standard",
    "shuffle",
    "tile_resample",
    "invert",
    "lineart_anime_denoise",
    "reference_only",
    "reference_adain",
    "reference_adain+attn",
    "inpaint",
    "inpaint_only",
    "inpaint_only+lama",
    "tile_colorfix",
    "tile_colorfix+sharp",
]

preprocessor_aliases = {
    "invert": "invert (from white bg & black line)",
    "lineart_standard": "lineart_standard (from white bg & black line)",
    "lineart": "lineart_realistic",
    "color": "t2ia_color_grid",
    "clip_vision": "t2ia_style_clipvision",
    "pidinet_sketch": "t2ia_sketch_pidi",
    "depth": "depth_midas",
    "normal_map": "normal_midas",
    "hed": "softedge_hed",
    "hed_safe": "softedge_hedsafe",
    "pidinet": "softedge_pidinet",
    "pidinet_safe": "softedge_pidisafe",
    "segmentation": "seg_ufade20k",
    "oneformer_coco": "seg_ofcoco",
    "oneformer_ade20k": "seg_ofade20k",
    "pidinet_scribble": "scribble_pidinet",
    "inpaint": "inpaint_global_harmonious",
}

def filter_selected_helper(k,preprocessor_list,model_list):
    if 'None' not in model_list:
        model_list = ['None'] + model_list
    ui_preprocessor_keys = ['none', preprocessor_aliases['invert']]

  
    ui_preprocessor_keys += sorted([preprocessor_aliases.get(k, k)
                                    for k in preprocessor_list
                                    if preprocessor_aliases.get(k, k) not in ui_preprocessor_keys])
    

    preprocessor_list = ui_preprocessor_keys
    # print("preprocessor_list sorted: ",preprocessor_list)
    model_list = list(model_list)
    # print("list(model_list): ",model_list)

    # print("k:",k,k.lower())
    

    default_option = preprocessor_filters[k]
    pattern = k.lower()
    # model_list = list(cn_models.keys())
    if pattern == "all":
        return [
            preprocessor_list,
            model_list,
            'none', #default option
            "None"  #default model 
            ] 
    filtered_preprocessor_list = [
        x
        for x in preprocessor_list
        if pattern in x.lower() or x.lower() == "none"
    ]
    if pattern in ["canny", "lineart", "scribble", "mlsd"]:
        filtered_preprocessor_list += [
            x for x in preprocessor_list if "invert" in x.lower()
        ]

    ##Debug start
    # for model in model_list:
    #     print("model: ",model)
    #     if pattern in model.lower():
    #         print('add to filtered')
    #         print("pattern:",pattern, "in model.lower():",model.lower())
    #     else:
    #         print("pattern:",pattern, "not in model.lower():",model.lower())
    ##Debug end
    
    filtered_model_list = [
        x for x in model_list if pattern in x.lower() or x.lower() == "none"
    ]
    if default_option not in filtered_preprocessor_list:
        default_option = filtered_preprocessor_list[0]
    if len(filtered_model_list) == 1:
        default_model = "None"
        filtered_model_list = model_list
    else:
        default_model = filtered_model_list[1]
        for x in filtered_model_list:
            if "11" in x.split("[")[0]:
                default_model = x
                break
    
    return [filtered_preprocessor_list,filtered_model_list, default_option,default_model]
