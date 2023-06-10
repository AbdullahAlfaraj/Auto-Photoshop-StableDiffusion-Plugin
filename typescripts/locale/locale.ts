import globalStore from "../globalstore"

interface LocaleItem {
    zh_CN: string,
    default: string
}

// interface LocaleSetting {
//     [key: string]: LocaleItem
// }


const LocaleSetting = {
    "controlnet.missing": {
        "zh_CN": `本地SD中缺少控制网扩展。\n请安装该插件后再使用。`,
        "default": "The Controlnet Extension is missing from Automatic1111.\nPlease install it to use it through the plugin."
    },
    "controlnet.setall": {
        "zh_CN": `设置所有控制网图片`,
        "default": `Set All CtrlNet Images`
    },
    "controlnet.disableall": {
        "zh_CN": `禁用控制网选项卡`,
        "default": `Disable ControlNet Tab`
    },
    "controlnet.index": {
        "zh_CN": '控制网 #',
        "default": `ControlNet #`
    },
    "controlnet.setimage": {
        "zh_CN": `设置原始图`,
        "default": `Set CtrlNet Img`
    },
    "controlnet.preview": {
        "zh_CN": `查看标注图`,
        "default": `Preview Annotator`
    },
    "controlnet.enable": {
        "zh_CN": `启用`,
        "default": `Enable`
    },
    "controlnet.lowVRam": {
        "zh_CN": `低显存`,
        "default": "low VRAM"
    },
    "controlnet.GuessMode": {
        "zh_CN": `猜测模式`,
        "default": "Guess Mode"
    },
    "controlnet.PixelPerfect": {
        "zh_CN": `自动分辨率`,
        "default": "Pixel Perfect"
    },
    "controlnet.ControlMode": {
        "zh_CN": `控制优先`,
        "default": "Control Mode"
    },
    "controlnet.ControlMode.Balanced": {
        "zh_CN": `平衡`,
        "default": "Balanced"
    },
    "controlnet.ControlMode.Prompt": {
        "zh_CN": `提示词`,
        "default": "Prompt"
    },
    "controlnet.ControlMode.ControlNet": {
        "zh_CN": `控制网`,
        "default": "ControlNet"
    },
    "controlnet.weight": {
        "zh_CN": `权重: `,
        "default": "Weight: "
    },
    "controlnet.guidancestart": {
        "zh_CN": `开始步数: `,
        "default": "Guidance strength start: "
    },
    "controlnet.guidanceend": {
        "zh_CN": `结束步数: `,
        "default": "Guidance strength end: "
    },
}

export default function Locale(key: keyof typeof LocaleSetting): string
{
    const locale = globalStore.Locale;
    return LocaleSetting[key][locale];
}