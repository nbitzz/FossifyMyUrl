import fs from "fs"

let CurrentSettings:{[key:string]:{[key:string]:boolean}} = {}

fs.readFile(__dirname+"/../../.data/settings.json",(err,buf) => {
    if (err) {console.error(err); return};
    CurrentSettings = JSON.parse(buf.toString() || "{}")
})

export let Defaults:{[key:string]:any} = {
    AutoFossify:true
}

export function saveSettings() {
    if (!fs.existsSync(__dirname+"/../../.data")) {
        fs.mkdirSync(__dirname+"/../../.data")
    }
    fs.writeFile(__dirname+"/../../.data/settings.json",JSON.stringify(CurrentSettings),(err) => {
        if (err) console.error(err)
    })
}

export function getSettings() {
    return Array.from(Object.keys(Defaults))
}

export function getServerSettings(serverId:string) {
    return CurrentSettings[serverId]
}

export function getServerSetting(serverId:string,setting:string) {
    return (CurrentSettings[serverId] || {})[setting] || Defaults[setting]
}

export function setServerSetting(serverId:string,setting:string,value:boolean) {
    if (!CurrentSettings[serverId]) CurrentSettings[serverId] = {}
    CurrentSettings[serverId][setting] = value
    saveSettings()
}