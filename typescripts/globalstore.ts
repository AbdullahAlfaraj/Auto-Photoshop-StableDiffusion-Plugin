import { observable } from "mobx";
import { host } from 'uxp'

interface GlobalStore {
    Locale: 'zh_CN' | 'default',
}

var globalStore = observable<GlobalStore>({
    Locale: host.uiLocale == 'zh_CN' ? host.uiLocale : 'default' 
});

export default globalStore;