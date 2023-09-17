import { observable, reaction } from 'mobx'
import { host } from 'uxp'
import { settings } from './util/oldSystem'
import { checkServerType } from 'diffusion-chain'

interface GlobalStore {
    Locale: 'zh_CN' | 'en_US',
    ServerUrl: string,
    ServerType: "A1111" | "Comfy" | "Unknown"
}

const initialLocale =
    localStorage.getItem('last_selected_locale') || host.uiLocale

var globalStore = observable<GlobalStore>({
    Locale: initialLocale == 'zh_CN' ? initialLocale : 'en_US',
    ServerUrl: "",
    ServerType: "Unknown"
})
declare let g_sd_url: string;

;(async function() {
    const setting = await settings.loadSettings();
    console.log('[globalstore] got sd_url: ' + setting);
    const serverType = await checkServerType(setting.sd_url);
    
    g_sd_url = setting.sd_url
    globalStore.ServerType = serverType as any;
    globalStore.ServerUrl = setting.sd_url

})();


export default globalStore
