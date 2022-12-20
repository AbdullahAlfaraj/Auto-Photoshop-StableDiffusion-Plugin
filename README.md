# Auto-Photoshop-StableDiffusion-Plugin

With Auto-Photoshop-StableDiffusion-Plugin, you can directly use the capabilities of Automatic1111 Stable Diffusion in Photoshop without switching between programs. This allow you to easily use Stable Diffusion AI in a familiar environment. You can edit your stable diffusion image with all your favorite tools and save it right in Photoshop. 




# how to install:
## First time runing the plugin:
1) download the plugin:
```
git clone https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin.git
```
2) run "start_server.bat" inside "Auto-Photoshop-StableDiffusion-Plugin" directory
3) go to where you have automatic1111 installed.
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

4) run photoshop. go to edit -> prefrences -> plugins
	1) make sure you check "Enable Developer Mode" checkbox
5) install "Adobe UXP Developer Tool" from here [Installation (adobe.com)](https://developer.adobe.com/photoshop/uxp/devtool/installation/)
   this tool will add the plugin into photoshop
6) run Adobe UXP Developer Tool and click on "Add Plugin" button in the top right. Navigate to where you have "Auto-Photoshop-StableDiffusion-Plugin" folder and open "manifest.json"
7) select the plugin and click on Actions -> Load Selected
that's it.

## Steps to run the plugin for second time and onward:
1) start "webui-user.bat"
2) start "start_server.bat"
3) start "Photoshop"
4) start " Adobe UXP Developer Tool" and load the plugin

## How to use it:
1) In photoshop start new project.
2) After loading the plugin, don't select or change anything. Just click on the "Generate" button
3) If you see an image of a cat get loaded onto the canvas then everything is setup correctly.



