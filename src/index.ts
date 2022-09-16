import Discord, {Intents} from "discord.js"
import Rulang, {Environment} from "./rulang"
import * as linkify from "linkifyjs"
require('dotenv').config()

let Frontends:{[key:string]:any} = require("../Frontends.json")

const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready',() => {
    console.log("[FossifyMyUrl] Logged in")
})

client.on('messageCreate',(message) => {
    let _links = linkify.find(message.content).filter(e => e.type == "url" && (e.value.startsWith("https://") || e.value.startsWith("http://")))
    if (message.guild?.me && _links.length > 0 && message.channel.isText() && message.channel.type != "DM") {
        if (message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES") && !message.author.bot) {
            // process linkify.js output
            let links = _links.map(e => {
                let urlParts = e.value.split("/").slice(2)
                let domain = urlParts.splice(0,1)[0]
                let params = ((urlParts[urlParts.length-1] || "")
                .split("?")[1] || "")
                .split("&")
                .map((e:string) => {return {key:e.split("=")[0],value:decodeURI(e.split("=")[1])}})
                let path = urlParts.join("/")
                
                return {
                    domain:domain,
                    fullpath:path,
                    path:path.split("?")[0],
                    params:params
                }
            })

            let transformedURLs:{originalURL:string,newURL:string}[] = []

            // transform urls
            
            links.forEach((url) => {
                for (let [x,v] of Object.entries(Frontends)) {
                    if (v && typeof v == "object") {
                        let possible:string[] = [x,"www."+x]
                        if (Array.isArray(v.include)) {
                            v.include.forEach((v:string) => {
                                possible.push(v+"."+x)
                            })
                        }
                        if (possible.find(e => e == url.domain) && Array.isArray(v.rules) && v.frontend) {
                            // setup
                            let path = ""
                            let params:{[key:string]:string} = {}

                            // env
                            let env:Environment = {
                                Constants: {
                                    fullpath:url.fullpath,
                                    domain:url.domain,
                                    path:url.path,
                                    "undefined":undefined,
                                    "path.last":url.path.split("/")[url.path.split("/").length-1],
                                    "path.first":url.path.split("/")[0]
                                },
                                Functions: {
                                    AddParam: function(k:string,v:string) {params[k] = v},
                                    SetPath: function(v:string) {path = v},
                                    AppendPath: function(v:string) {path += v}
                                }
                            }

                            url.params.forEach((v:{key:string,value:string}) => {
                                env.Constants["params."+v.key] = v.value
                            })
                            
                            // run rulang

                            v.rules.forEach((st:string) => {
                                Rulang(st,env)
                            })

                            // compile params
                            
                            let prms:string[] = []

                            for (let [a,b] of Object.entries(params)) {
                                prms.push(`${a}=${encodeURI(b)}`)
                            }

                            transformedURLs.push({originalURL:url.domain+"/"+url.fullpath,newURL:`${v.frontend}${path}${prms.length > 0 ? "?" : ""}${prms.join("&")}`})
                            
                        }
                    }
                }
            })
            
            if (transformedURLs.length > 0) {
                message.reply({
                    embeds:[
                        new Discord.MessageEmbed()
                            .setColor("BLURPLE")
                            .setDescription("Click on a link to view it in an alternative frontend\n"+transformedURLs.map(e => `[${e.originalURL}](${e.newURL})`).join("\n"))
                    ],
                    allowedMentions: {
                        repliedUser:false
                    }
                })
            }
        }
    }
})

client.login(process.env.token)