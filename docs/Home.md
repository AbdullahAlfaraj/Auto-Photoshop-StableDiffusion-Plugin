
*Version 1.1.0*

## Introduction

This guide explains the Auto Photoshop UI and its main features, it doesn't go into any detail of how Stable Diffusion works or the functionalities implemented by AUTOMATIC1111. For the latter you can read the manual [here](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features).

## Stable Diffusion UI Tab

![[Pasted image 20230131191554.png]]

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

When Hi Res is checked, a number of parameters become avaiable including Upscaler model to be used, output dimensions and denoising strength. This is just an interface into the AUTOMATIC1111 functionality described [here](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#hires-fix).

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
- Mask Content Fill: fill it with colors of the image
- Mask Content original: keep whatever was there originally
- Mask Content latent noise: fill it with latent space noise
- Mask Content latent nothing: fill it with latent space zeros
- **Inpaining at Full Res**: have a look [here](https://github.com/AUTOMATIC1111/stable-diffusion-webui/discussions/4637) for an explanation of this feature.
- **Restore Faces**: same as img2img

### outpaint

UI and its functionality are same as inpaint.







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
- Clicking on the image will load the pluging settings for the image generation (seed and image generation configuration)
- **Image Search**: loads a set of images from the internet, clicking on any of the images will load them into the layer stack.

## Prompts Library

[[Pasted image 20230201161938.png]]

- For this to work a file will need to be created in the following location: Auto-Photoshop-StableDiffusion-Plugin\\server\\python_server\\prompt_shortcut.json
- **Load / Save**: Once the file is present, values can be loaded and saved onto the file.
- **Key / Value / Add top Prompt Shortcut**: allows to change / add values to the existing json file.
- **Refresh Menu**: will load all values from the json, allowing the user to make changes to the value.

## Horde

Coming Soon

## Settings 

[[Pasted image 20230201163236.png]]

# Tutorials

## Generate a txt2img

[[Generate txt2img.gif]]

1. Make a selection where you want the image to be generated
2. Press [[Pasted image 20230203191656.png]]
3. (optional) use the Viewer to select which images to keep in case of multiple image generation

## Using the Viewer

[[Viewer Tutorial.gif]]
1. Generate images as usual
2. Select the image in the viewer grid (shift + click for multiple selection)
3. Choose from: keep one, discard one, keep all, discard all.
4. Images are saved in the latest session layer folder.

## History Tab

[[History.gif]]

1. Load Previous Generations button
2. Single click on image to load its settings in the Stable Diffusion tab (seed, prompt, etc)
3. Click on edit button to load the image in Photoshop

## Generate an img2img

[[img2img.gif]]

1. Select the portion of the image to be used as a sample
2. Select img2img mode and adjust the parameters (denoising strenght especially)
3. Press Generate img2img
4. (optional) use the Viewer to select which images to keep in case of multiple image generation

## Prompts Shortcut
you can substitute a whole sequence of words with one word. 

Instead of writing the following as a prompt :
```
Unreal Engine, Octane Render, arcane card game ui, hearthstone art style, epic fantasy style art
```
you could write: 
```
{game_like}
```

as long as you have defined the relationship in the prompt library tab
```
{
"game_like": "Unreal Engine, Octane Render, arcane card game ui, hearthstone art style, epic fantasy style art"
}
```


[[prompt_shortcut_file.gif]]


### Editing and Using a Prompt File
[[prompt_shortcut.gif]]

1. Switch to the *Prompt Shortcut* tab.
2. Load the json file.
3. Input a keyword and its value
4. Press *Add to Prompt Shortcut*
5. Now the new Prompt Shortcut can be used in the Stable Diffusion tab
6. To reuse previously saved shortcuts, ensure you load the json file at the start of each session.

## Inpainting

[[inpainting.gif]]

1. Select inpainting mode in the Stable Diffusion tab
2. Select the target area where to produce the image using rectangular marquee tool
3. With a 100% opacity white brush paint the area that you wish to inpaint
4. Ensure that you have a -inpainting.ckpt model selected (this is as important as it is easy to forget)
5. Write a prompt describing the inpaining image
6. Select the desired Mask Content option and adjust the Denoising Strength accordingly.
7. Hit Generate

## Outpainting

[[outpainting.gif]]

1. Select outpainting mode in the Stable Diffusion tab
2. Select the target area where to produce the image using rectangular marquee tool, ensure that you have **some overlap** with the existing image (to provide Stable Diffusion with some context) and that the target area is **transparent**.
4. Ensure that you have a -inpainting.ckpt model selected (this also works for outpainting)
5. Write a prompt describing the outpaining image
6. Select the desired Mask Content option and adjust the Denoising Strength accordingly.
7. Hit Generate


## Heal Brush
[[heal_brush.gif]]
1. Select the "Heal Brush" from the Smart Preset dropdown menu in the Stable Diffusion tab
2. Select the target area where to produce the image using rectangular marquee tool
3. With a 100% opacity white brush paint the area that you wish to erase
4. Ensure that you have a -inpainting.ckpt model selected (this is as important as it is easy to forget)
5. Write a prompt describing what you would like to see in the erased area
6. Hit Generate