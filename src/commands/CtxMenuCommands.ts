import Discord, {Intents} from "discord.js"
import fossify, {FossifySettings} from "../lib/fossify"
import { ContextMenuCommandBuilder } from "@discordjs/builders"
import { ApplicationCommandType } from "discord-api-types/v9"

export interface CtxMenuCommand {
    CtxBuilder:ContextMenuCommandBuilder,
    OnRun:(interaction:Discord.MessageContextMenuInteraction|Discord.UserContextMenuInteraction) => void
}

export let CtxMenuCommands:CtxMenuCommand[] = [
    {
        CtxBuilder:new ContextMenuCommandBuilder()
        .setName("Fossify")
        .setType(ApplicationCommandType.Message),
        OnRun: (int) => {
            if (int.isMessageContextMenu()) {
                int.deferReply({ephemeral:true}).then(() => {
                    let str = int.targetMessage.content
                    if (str) {
                        let transformedURLs = fossify(str)
                        if (transformedURLs.length > 0) {
                            int.editReply({
                                embeds:[
                                    new Discord.MessageEmbed()
                                        .setColor("BLURPLE")
                                        .setDescription("Click on a link to view it in an alternative frontend\n"+transformedURLs.map(e => `[${e.originalURL}](${e.newURL})`).join("\n"))
                                        .setFooter({text:"(These links are  hyperlinks. Clicking on one will lead you to the frontend selected in the configuration.)"})
                                ]
                            })
                        } else {
                            int.editReply("No links found")
                        }
                    } else {
                        int.editReply("Message content empty")
                    }
                })
            }
        }
    },
    // If proxy exists, add to array
    ...(FossifySettings.morty ? [{
        CtxBuilder:new ContextMenuCommandBuilder()
        .setName("Fossify with Morty")
        .setType(ApplicationCommandType.Message),
        OnRun: (int:Discord.ContextMenuInteraction) => {
            if (int.isMessageContextMenu()) {
                int.deferReply({ephemeral:true}).then(() => {
                    let str = int.targetMessage.content
                    if (str) {
                        let transformedURLs = fossify(str,true)
                        if (transformedURLs.length > 0) {
                            int.editReply({
                                embeds:[
                                    new Discord.MessageEmbed()
                                        .setColor("BLURPLE")
                                        .setDescription("Click on a link to view it in an alternative frontend\n"+transformedURLs.map(e => `[${e.originalURL}](${e.newURL})`).join("\n"))
                                        .setFooter({text:"(These links are  hyperlinks. Clicking on one will lead you to the frontend selected in the configuration.)"})
                                ]
                            })
                        } else {
                            int.editReply("No links found")
                        }
                    } else {
                        int.editReply("Message content empty")
                    }
                })
            }
        }
    }] : [])
]