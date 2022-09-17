import Discord, {Intents} from "discord.js"
import fossify from "./lib/fossify"
import * as settings from "./lib/settings"
import { Routes } from "discord-api-types/v9"
import { REST } from "@discordjs/rest"
import { SlashCmd, SlashCommands } from "./commands/SlashCommands"
import { CtxMenuCommand, CtxMenuCommands } from "./commands/CtxMenuCommands"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"

require('dotenv').config()

const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready',() => {
    console.log("[FossifyMyUrl] Logged in")

    if (process.env.token && client.application?.id) {
        const rest = new REST({ version: '9' }).setToken(process.env.token);

        let commands:RESTPostAPIApplicationCommandsJSONBody[] = []
        
        SlashCommands.forEach((e) => {commands.push(e.SCBuilder.toJSON())})
        CtxMenuCommands.forEach((e) => {commands.push(e.CtxBuilder.toJSON())})

        rest.put(Routes.applicationCommands(client.application.id), { body: commands })
            .then(() => console.log('[FossifyMyUrl] Successfully registered application commands.'))
            .catch(console.error);
    }
})

client.on('messageCreate',(message) => {
    if (message.guild?.me && message.channel.isText() && message.channel.type != "DM") {
        if (message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES") && !message.author.bot && settings.getServerSetting(message.guild.id,"AutoFossify")) {
            let transformedURLs = fossify(message.content,settings.getServerSetting(message.guild.id,"AutoProxy"))
            if (transformedURLs.length > 0) {
                message.reply({
                    embeds:[
                        new Discord.MessageEmbed()
                            .setColor("BLURPLE")
                            .setDescription("Click on a link to view it in an alternative frontend\n"+transformedURLs.map(e => `[${e.originalURL}](${e.newURL})`).join("\n"))
                            .setFooter({text:"(These links are hyperlinks. Clicking on one will lead you to the frontend selected in the configuration.)"})
                    ],
                    allowedMentions: {
                        repliedUser:false
                    }
                })
            }
        }
    }
})

client.on("interactionCreate",(int) => {
    if (int.isCommand()) {
        let cmd = SlashCommands.find(e => e.SCBuilder.name == int.commandName)
        if (cmd) {
            cmd.OnRun(int)
        }
    } else if (int.isMessageContextMenu() || int.isUserContextMenu()) {
        let cmd = CtxMenuCommands.find(e => e.CtxBuilder.name == int.commandName)
        if (cmd) {
            cmd.OnRun(int)
        }
    }
})

client.login(process.env.token)