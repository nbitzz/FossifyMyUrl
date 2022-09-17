import Discord, {Intents} from "discord.js"
import fossify from "./lib/fossify"
import * as settings from "./lib/settings"
import { ContextMenuCommandBuilder, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders"
import { ApplicationCommandType, Routes } from "discord-api-types/v9"
import { REST } from "@discordjs/rest"
import fs from "fs"

interface SlashCmd {
    SCBuilder:ContextMenuCommandBuilder|SlashCommandBuilder|Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    OnRun:(interaction:Discord.CommandInteraction) => void
}

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
        rest.put(Routes.applicationCommands(client.application.id), { body: commands.map((e) => e.SCBuilder.toJSON()) })
            .then(() => console.log('[FossifyMyUrl] Successfully registered application commands.'))
            .catch(console.error);
    }
})

client.on('messageCreate',(message) => {
    if (message.guild?.me && message.channel.isText() && message.channel.type != "DM") {
        if (message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES") && !message.author.bot && settings.getServerSetting(message.guild.id,"AutoFossify")) {
            let transformedURLs = fossify(message.content)
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

// slash cmds

const commands:SlashCmd[] = [
    {
        SCBuilder: new SlashCommandBuilder()
        .setName("frontends")
        .setDescription("Sends the contents of the frontends.json file."),
        OnRun: function(int) {
            // discord devs making the worst api ever

            int.deferReply({ephemeral:true}).then(() => {
                fs.readFile(__dirname+"/../Frontends.json",(err,buf) => {
                    if (err) {int.editReply({content:`Failed to get file: ${err.toString()}`});return;}
                    int.editReply({
                        files:[{name:"Frontends.json", attachment:__dirname+"/../Frontends.json"}]
                    })
                })
            })
        }
    },
    {
        SCBuilder: new SlashCommandBuilder()
        .setName("fossify")
        .setDescription("Returns fossified links in the string provided.")
        .addStringOption(new SlashCommandStringOption().setName("string").setDescription("String to fossify")),
        OnRun: function(int) {
            int.deferReply({ephemeral:true}).then(() => {
                let str = int.options.getString("string")
                if (str) {
                    let transformedURLs = fossify(str)
                    if (transformedURLs.length > 0) {
                        int.editReply({
                            embeds:[
                                new Discord.MessageEmbed()
                                    .setColor("BLURPLE")
                                    .setDescription("Click on a link to view it in an alternative frontend\n"+transformedURLs.map(e => `[${e.originalURL}](${e.newURL})`).join("\n"))
                            ]
                        })
                    } else {
                        int.editReply("No links found")
                    }
                } else {
                    int.editReply("Could not find string parameter")
                }
            })
        }
    },
    {
        SCBuilder: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Configures FossifyMyUrl in a server.")
        .addStringOption(new SlashCommandStringOption().addChoices(...settings.getSettings().map(e => {return {name:e,value:e}})).setRequired(true).setName("setting").setDescription("The setting to change"))
        .addBooleanOption(new SlashCommandBooleanOption().setName("enabled").setDescription("Whether or not the setting is enabled").setRequired(true))
        .setDMPermission(false)
        .setDefaultMemberPermissions(Discord.Permissions.FLAGS.MANAGE_GUILD),
        OnRun: function(int) {
            int.deferReply({ephemeral:true}).then(() => {
                let option = int.options.getString("setting")
                let enabled = int.options.getBoolean("enabled")
                if (option && settings.getSettings().find(e => e == option) && int.guild?.id && enabled != undefined) {
                    settings.setServerSetting(int.guild?.id,option,enabled) 
                    int.editReply(`${option} is now ${enabled.toString()}`)
                } else {
                    int.editReply("Invalid setting")
                }
            })
        }
    },
    // fossify ctxmnu
    {
        SCBuilder:new ContextMenuCommandBuilder()
        .setName("Fossify")
        .setType(ApplicationCommandType.Message),
        OnRun: () => {}
    }
]

client.on("interactionCreate",(int) => {
    if (int.isCommand()) {
        let cmd = commands.find(e => e.SCBuilder.name == int.commandName)
        if (cmd) {
            cmd.OnRun(int)
        }

    // excuse the sorta bad code here
    // but there's not really a point
    // in having a specific system for
    // ctxmnu commands when this is
    // the only one
    } else if (int.isMessageContextMenu()) {
        if (int.commandName == "Fossify") {
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
})

client.login(process.env.token)