

# Auto-Photoshop-StableDiffusion-Plugin
[![Become a Patron!](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/AbdullahAlfaraj)
[![discord badge]][discord link]

[discord badge]: https://flat.badgen.net/discord/members/3mVEtrddXJ
[discord link]: https://discord.gg/3mVEtrddXJ



With Auto-Photoshop-StableDiffusion-Plugin, you can directly use the capabilities of Automatic1111 Stable Diffusion in Photoshop without switching between programs. This allows you to easily use Stable Diffusion AI in a familiar environment. You can edit your Stable Diffusion image with all your favorite tools and save it right in Photoshop.

# Table of Contents
- [Auto-Photoshop-StableDiffusion-Plugin](#auto-photoshop-stablediffusion-plugin)
- [Table of Contents](#table-of-contents)
- [Demo:](#demo) 
- [Support Us On Patreon](#support-us-on-patreon)
- [How to Install](#how-to-install)
	- [Method 1: One Click Installer](#method-1-one-click-installer)
	- [Method 2: The Unzip Method](#method-2-the-unzip-method)
	- [Method 3: The UXP Method (for Developers/Programmers Only)](#method-3-the-uxp-method-instruction-for-developers)

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
	
# Support Us On Patreon:
By supporting us on [Patreon](https://www.patreon.com/AbdullahAlfaraj), you’ll help us continue to develop and improve the Auto-Photoshop-StableDiffusion-Plugin, making it even easier for you to use Stable Diffusion AI in a familiar environment. As a supporter, you’ll have the opportunity to provide feedback and suggestions for future development. Plus, you’ll get early access to new features and tutorials, as well as exclusive art tutorials and tips from a professional artist. We’re passionate about making AI approachable to artists and with your help, we can continue to do just that.	
# Auto-Photoshop-SD Backers and Sponsors:
<h2>💎 Diamond</h2>
<table>
<tr>
<td><a href="https://ronnykhalil.com/"><img src="https://images.weserv.nl/?url=https://raw.githubusercontent.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin/206b56c911f67ede3ca3a934d0bce8c1d68a2113/docs/profile_image/A934E4F0-7778-47E9-A395-531BFF2E61F1_1_105_c.jpeg&h=80&w=80&fit=cover&mask=circle&maxage=7d" alt="Ronny Khalil"></a></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=zachary" alt="zachary"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Razvan+Matei" alt="Razvan Matei"></td>
</tr>
<tr>
<td><a href="https://ronnykhalil.com/">Ronny Khalil</a></td>
<td>zachary</td>
<td>Razvan Matei</td>
</tr>
</table>

<h2>🥇 Gold</h2>
<table>
<tr>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Alex+" alt="Alex "></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Olivier+Lefebvre" alt="Olivier Lefebvre"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Florin-Alexandru+Ilinescu" alt="Florin-Alexandru Ilinescu"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Robin+Edwards" alt="Robin Edwards"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Frederic+Dreuilhe" alt="Frederic Dreuilhe"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Danny+Sahagun" alt="Danny Sahagun"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=darius+coal" alt="darius coal"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Kerwin" alt="Kerwin"></td>
</tr>
<tr>
<td>Alex </td>
<td>Olivier Lefebvre</td>
<td>Florin-Alexandru Ilinescu</td>
<td>Robin Edwards</td>
<td>Frederic Dreuilhe</td>
<td>Danny Sahagun</td>
<td>darius coal</td>
<td>Kerwin</td>
</tr>
<tr>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=The+Dread+Vixen+Alinsa" alt="The Dread Vixen Alinsa"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Bruce+Hunter" alt="Bruce Hunter"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Smith" alt="Smith"></td>
</tr>
<tr>
<td>The Dread Vixen Alinsa</td>
<td>Bruce Hunter</td>
<td>Smith</td>
</tr>
</table>

<h2>🥈 Silver</h2>
<table>
<tr>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Amith+Thomas" alt="Amith Thomas"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=xiao+yuan" alt="xiao yuan"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Ezra+Blake" alt="Ezra Blake"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Arthur+Liu" alt="Arthur Liu"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Zenko+" alt="Zenko "></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Juan+Pablo+Mendiola" alt="Juan Pablo Mendiola"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Kevin+Schofield" alt="Kevin Schofield"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Chris+Canterbury" alt="Chris Canterbury"></td>
</tr>
<tr>
<td>Amith Thomas</td>
<td>xiao yuan</td>
<td>Ezra Blake</td>
<td>Arthur Liu</td>
<td>Zenko </td>
<td>Juan Pablo Mendiola</td>
<td>Kevin Schofield</td>
<td>Chris Canterbury</td>
</tr>
<tr>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Mvs+Srs" alt="Mvs Srs"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Lawrence+L+Tran" alt="Lawrence L Tran"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Felipe+Cortes" alt="Felipe Cortes"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Jake+Skokan" alt="Jake Skokan"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=que0005" alt="que0005"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Xavier+Matia+Bernasconi" alt="Xavier Matia Bernasconi"></td>
</tr>
<tr>
<td>Mvs Srs</td>
<td>Lawrence L Tran</td>
<td>Felipe Cortes</td>
<td>Jake Skokan</td>
<td>que0005</td>
<td>Xavier Matia Bernasconi</td>
</tr>
</table>

<h2>🥉 Copper</h2>
<table>
<tr>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Sebastian+Karbowniczek" alt="Sebastian Karbowniczek"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Petter+Lundh" alt="Petter Lundh"></td>
<td><img src="https://ui-avatars.com/api/?background=random&color=fff&rounded=true&name=Aftyr+byrn" alt="Aftyr byrn"></td>
</tr>
<tr>
<td>Sebastian Karbowniczek</td>
<td>Petter Lundh</td>
<td>Aftyr byrn</td>
</tr>
</table>
















<a href="https://www.patreon.com/AbdullahAlfaraj" rel="nofollow"><img src="docs/become_backer.svg" style="max-width: 100%;"></a>


# How To Install: 
Use method 1 or 2 if you are an Artist
use method 3 if you are a Developer/Programmer 


# Method 1: One Click Installer

1) Download the [.ccx](https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin/releases/latest) file
2) run the ccx file . that's all.  you will be able to use all of stable diffusion modes (txt2img, img2img, inpainting and outpainting), check the [tutorials](https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin/wiki) section to master the tool. 

![install_plugin_1](https://user-images.githubusercontent.com/7842232/217213943-3e2a588d-3ed8-4757-ba69-9846b55a1b36.gif)


3) (optional step) Install the Auto-Photoshop-SD Extension from Automatic1111. the extension will allow you to use the smart masking and image search features
 - a) Copy Auto-Photoshop plugin url
![copy_githup_url_2](https://user-images.githubusercontent.com/7842232/217213998-367873ce-2c09-4c42-a5fa-0044415e3908.gif)

- b) Paste the url in auto1111's extension tab and click install

![install_extension_3](https://user-images.githubusercontent.com/7842232/217214062-4c2fef9e-8d49-46a0-aa3b-80c4975f8a70.gif)

- c) Make sure the Auto-Photoshop plugin is listed, then click "Apply and Restart UI"

![apply_and_restart_4](https://user-images.githubusercontent.com/7842232/217214116-2e30d7b8-aeb6-44df-aff3-4788a56cd800.gif)



# Method 2: The Unzip Method
1) Download the  [.zip](https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin/releases/latest) file
2) Unzip it in a folder with the same name
3) move the unzipped folder to the Photoshop Plugin folder
4) (optional step) Install the Auto-Photoshop-SD Extension from Automatic1111. the extension will allow you to use the smart masking and image search features	
![image](https://user-images.githubusercontent.com/7842232/223751539-1a3013aa-aa1d-4058-87ae-e8b3fdfc5ec8.png)



# Method 3: The UXP method (Instruction for Developers):
For artists we recommend you use [the one click installer](#one-click-installer). If you are a developer Watch the any of these videos or follow the instruction bellow. 

<a href="https://www.youtube.com/watch?v=BNzdhEpFHrg&ab_channel=Abdsart" title="How To Install Auto Photoshop Stable Diffusion Plugin by Abdullah Alfaraj" rel="Click Here to Watch How To Install Tutorial by Abdullah Alfaraj"><img src="https://user-images.githubusercontent.com/7842232/217941315-8d4a3b25-1a83-4dac-b921-79b3f82e0536.png" style="width:500px"></a>

<a href="https://www.youtube.com/watch?v=CJuTZw39Reg&t=145s&ab_channel=VladimirChopine%5BGeekatPlay%5D" title="How To Install Auto Photoshop Stable Diffusion Plugin by Vladimir Chopine" rel="Click Here to Watch How To Install Tutorial by Vladimir Chopine"><img src="https://i3.ytimg.com/vi/CJuTZw39Reg/maxresdefault.jpg" style="width:500px"></a>

For artists we recommend you use [the one click installer](#one-click-installer)
## First time running the plugin (local Automatic1111):
1) download the plugin:
```
git clone https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin.git
```
2) open cmd window in the "Auto-Photoshop-StableDiffusion-Plugin" directory and then install the dependencies by typing:
```
npm install
```
3) build the plugin by transpiling typescript to javascript:
```
npm run watch
```

4) run "start_server.bat" inside "Auto-Photoshop-StableDiffusion-Plugin" directory
5) go to where you have [automatic1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) installed. 
Edit the "webui-user.bat" in automatic1111 
 change this line 
```
set COMMANDLINE_ARGS= 
```
to
```
set COMMANDLINE_ARGS= --api
```
that will allow the plugin to communicate with the automatic1111 project. After saving close the "webui-user.bat" file and run it normally.

6) run photoshop. go to edit -> prefrences -> plugins
	1) make sure you check "Enable Developer Mode" checkbox
7) install "Adobe UXP Developer Tool" from here [Installation (adobe.com)](https://developer.adobe.com/photoshop/uxp/devtool/installation/)
   this tool will add the plugin into photoshop
8) run Adobe UXP Developer Tool and click on "Add Plugin" button in the top right. Navigate to where you have "Auto-Photoshop-StableDiffusion-Plugin" folder and open "manifest.json"
9) select the plugin and click on Actions -> Load Selected
that's it.

## First time running the plugin (remote Automatic1111):
__The remote webui must also have `--api` set in `COMMANDLINE_ARGS`. You can check if api access is enabled by appending "/docs#" to the end of the url. If the documentation includes `/sdapi/v1/samplers` then api access is enabled.__

1) download the plugin:
```
git clone https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin.git
```
1) edit [start_server.bat](start_server.bat) (or start_server.sh if on linux) to point to the remote installation of Automatic1111
2) run "start_server.bat" inside "Auto-Photoshop-StableDiffusion-Plugin" directory
3) run photoshop. go to edit -> prefrences -> plugins
	1) make sure you check "Enable Developer Mode" checkbox
4) install "Adobe UXP Developer Tool" from here [Installation (adobe.com)](https://developer.adobe.com/photoshop/uxp/devtool/installation/)
   this tool will add the plugin into photoshop
5) run Adobe UXP Developer Tool and click on "Add Plugin" button in the top right. Navigate to where you have "Auto-Photoshop-StableDiffusion-Plugin" folder and open "manifest.json"
6) select the plugin and click on Actions -> Load Selected
that's it.






# Demo:
[![Click Here to Watch Demo](https://i3.ytimg.com/vi/VL_gbQai79E/maxresdefault.jpg)](https://youtu.be/VL_gbQai79E "Stable diffusion AI Photoshop Plugin Free and Open Source")


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
read more on their [GitHub page](https://github.com/db0/AI-Horde)
## Colab:
we link to this [Colab](https://colab.research.google.com/drive/1nbcx_WOneRmYv9idBO33pN5CbxXrqZHu?usp=sharing#scrollTo=Y4ebYsPqTrGb) directly inside plugin find it in the settings tab. you only need to run it. no need to change any of the settings. copy the gradio.live url the colab will generate and paste it into ```sd url``` field in the settings tab.
