# Auto-Photoshop-StableDiffusion-Plugin

With Auto-Photoshop-StableDiffusion-Plugin, you can directly use the capabilities of Automatic1111 Stable Diffusion in Photoshop without switching between programs. This allows you to easily use Stable Diffusion AI in a familiar environment. You can edit your Stable Diffusion image with all your favorite tools and save it right in Photoshop.

# Table of Contents
- [Auto-Photoshop-StableDiffusion-Plugin](#auto-photoshop-stablediffusion-plugin)
- [Table of Contents](#table-of-contents)
- [Demo:](#demo)
- [How to Install](#how-to-install)

- [FAQ and Known Issues](#faq-and-known-issues)
	- [What Photoshop version do I need to run the plugin?](#what-photoshop-version-do-i-need-to-run-the-plugin)
	- [Path Doesn't Exist](#path-doesnt-exist)
	- [Plugin Load Failed](#plugin-load-failed)
		- [No application are connected to the service](#no-application-are-connected-to-the-service)
		- [Load command failed in App with ID PS and Version X.X.X](#load-command-failed-in-app-with-id-ps-and-version-xxx)
	- [Exception in ASGI application / Expecting value: line 1 column 1](#exception-in-asgi-application--expecting-value-line-1-column-1)
	- [No Generations and Plugin Server doesn't send messages. (Remote setup)](#no-generations-and-plugin-server-doesnt-send-messages-remote-setup)

- [No GPU Options](#no-gpu-options)
	- [Stable Horde](#stable-horde)
	- [Colab](#colab)

# Demo:
[![Click Here to Watch Demo](https://i3.ytimg.com/vi/VL_gbQai79E/maxresdefault.jpg)](https://youtu.be/VL_gbQai79E "Stable diffusion AI Photoshop Plugin Free and Open Source")

# How To Install:
1) Download the  [.zip](https://github.com/le0nik/Auto-Photoshop-StableDiffusion-Plugin/releases/latest) file
2) Unzip it in a folder with the same name
3) move the unzipped folder to the Photoshop Plugin folder
4) (optional step) Install the Auto-Photoshop-SD Extension from Automatic1111. the extension will allow you to use the smart masking and image search features
![image](https://user-images.githubusercontent.com/7842232/223751539-1a3013aa-aa1d-4058-87ae-e8b3fdfc5ec8.png)

# FAQ and Known Issues
## What Photoshop version do I need to run the plugin?
The minimum Photoshop version that the plugin supports is Photoshop v24

## Plugin Load Failed
There are a few issues that can result in this error, please follow the instructions for the corresponding error message in the UDT logs

### No application are connected to the service
This error occurs when Photoshop is not started before the plugin is attempted to be loaded. Simply start photoshop then restart UXP and load the plugin


## Exception in ASGI application / Expecting value: line 1 column 1
This error occurs due to mismatched expectations between the plugin and the Automatic1111 backend.
It can be solved by both updating the version of the Automatic111 backend to the latest verion, and making sure "Save text information about generation parameters as chunks to png files" setting is enabled within the UI.

## No Generations and Plugin Server doesn't send messages. (Remote setup)
This error occurs when the remote server does not have the api enabled. You can verify this by attempting to go to the URL you access the webui at and appending "/docs#" to the end of the url. If you have permissions, make relaunch the remote instance with the "--api" flag.

# No GPU Options:
we provide two options to use the auto-photoshp plugin without GPU.
## Stable Horde
This is an awesome free crowdsourced distributed cluster of Stable Diffusion workers. If you like this service, consider joining the horde yourself!
the horde is enabled completely by the generosity of volunteers so make sure you don't overwhelm the service and help join the cause if you can.
read more on their [github page](https://github.com/db0/AI-Horde)
## Colab:
we link to this [Colab](https://colab.research.google.com/drive/1nbcx_WOneRmYv9idBO33pN5CbxXrqZHu?usp=sharing#scrollTo=Y4ebYsPqTrGb) directly inside plugin find it in the settings tab. you only need to run it. no need to change any of the settings. copy the gradio.live url the colab will generate and paste it into ```sd url``` field in the settings tab.
