
*Version 1.1.0*

## Introduction

This guide explains the Auto Photoshop UI and its main features, it doesn't go into any detail of how Stable Diffusion works or the functionalities implemented by AUTOMATIC1111. For the latter you can read the manual [here](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features).

## Stable Diffusion UI Tab

[[Pasted image 20230131191554.png]]

- **Model Selection** - allows to select the .ckpt / .safetensors model to be used for image generation.
- **Refresh** - refreshes the models. *Note*: this will extract all loaded models in AUTOMATIC1111, if you want to add a new model, first refresh AUTOMATIC1111.
- **L2S (Layer to selection)** - convenience function to move the content of the currently selected layer into the photoshop selection.
- **Snapshot** - convenience function equivalent to "ALT + Merge Visible Layers"
- **Reset** - reset UI to default values
- **Prompt Shortcut** - enables prompt shortcuts
- Prompt - text area for the image generation prompt
- Negative Prompt - text area for the image generation negative prompt

### txt2img

[[Pasted image 20230131192430.png]]

- **Images**: number of images to be generated in a single generation session
- **Steps**: number of steps
- **Selection Mode Ratio**: the generation dimension will be set automatically to match the proportion of the photoshop selection, using 512 as the base value.
- **Selection Mode Precise**: the generation dimension will be set to match exactly the photoshop selection.
- **Selection Mode Ignore**: the generation dimension are set by the user.
- **Width and Heigth**: the image generation dimensions
- **CFG Scale**: Influence strength of the prompt (for details please see the  AUTOMATIC1111 wiki)
- **Restore Faces**: enables the restore faces function in AUTOMATIC1111
- **Hi Res Fix**: enables the Hi Res Fix function in AUTOMATIC1111 (see below)
- **Seed**: Displays and edit current seed (-1 = Random)
- **Random / Last**: sets seed to either random or last generation
- **Show Samplers**: allows to select the sampler used for image generation

**Hi Res Fix**

[[Pasted image 20230131195947.png]]

When Hi Res is checked, a number of parameters become available including Upscaler model to be used, output dimensions, and denoising strength. This is just an interface into the AUTOMATIC1111 functionality described [here](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#hires-fix).

### img2img

[[Pasted image 20230131200253.png]]

- **Image**: shows the current image used as img2img base.
- **Denoising Strength**: how much Stable Diffusion should be influenced by the image, 0 = output is same as image, 1 = completely different image.
- **Inpainting conditioning mask strength**; this field only works with inpainting special models (ending in "-inpainting."). Determines how much the process should stick to the image structure, check out [this post](https://www.reddit.com/r/StableDiffusion/comments/yi46px/new_hidden_img2img_feature_conditioning_mask/) for details.

### inpaint

[[Pasted image 20230131201122.png]]

- **Image / Mask**: show image and mask used for the inpaint process
- **Denoising Strength**: similar to img2img however it behaves differently depending on Mask Content context.
- **Mask Blur**: how much to blur the mask before processing it in pixels
- **Mask Expansion**: how much the mask should expand to create a more blended output image
- Mask Content Fill: fill it with the colors of the image
- Mask Content original: keep whatever was there originally
- Mask Content latent noise: fill it with latent space noise
- Mask Content latent nothing: fill it with latent space zeros
- **Inpaining at Full Res**: have a look [here](https://github.com/AUTOMATIC1111/stable-diffusion-webui/discussions/4637) for an explanation of this feature.
- **Restore Faces**: same as img2img

### outpaint

UI and its functionality are the same as inpaint.







## Viewer

Tab to manage the images generated in the current session.

[[Pasted image 20230131202255.png]]

- Set Mask: manually sets the currently selected mask
- Set Init Image: manually sets the currently selected image
- Generate More: adds more generated images to the current session
- Selection Area: selects the boundaries of the currently selected image in the viewer
- [[Pasted image 20230131202517.png]] Keep all images generated in the current session
- [[Pasted image 20230131202539.png]] Discard all images generated in the current session
- [[Pasted image 20230131202558.png]] Keep only the selected image in the viewer
- [[Pasted image 20230131202638.png]] Discard the selected image in the viewer

## History

[[Pasted image 20230201161508.png]]

- **Load Previous Generations**: loads the images generated within this Photoshop file.
- [[Pasted image 20230201161716.png]] hovering on the image loaded from history will allow bringing the image back into the Photoshop Layer stack
- Clicking on the image will load the plugin settings for the image generation (seed and image generation configuration)
- **Image Search**: loads a set of images from the internet, clicking on any of the images will load them into the layer stack.

## Prompts Library

[[Pasted image 20230201161938.png]]

- For this to work a file will need to be created in the following location: Auto-Photoshop-StableDiffusion-Plugin\\server\\python_server\\prompt_shortcut.json
- **Load / Save**: Once the file is present, values can be loaded and saved onto the file.
- **Key / Value / Add top Prompt Shortcut**: allows to change/add values to the existing json file.
- **Refresh Menu**: will load all values from the json, allowing the user to make changes to the value.

## Horde

Coming Soon

## Settings 

[[Pasted image 20230201163236.png]]