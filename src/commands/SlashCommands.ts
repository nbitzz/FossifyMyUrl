import Discord, {Intents} from "discord.js"
import fossify, {FossifySettings} from "../lib/fossify"
import * as settings from "../lib/settings"
import { SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders"
import fs from "fs"

export interface SlashCmd {
    SCBuilder:SlashCommandBuilder|Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    OnRun:(interaction:Discord.CommandInteraction) => void
}

export let SlashCommands:SlashCmd[] = [
    {
        SCBuilder: new SlashCommandBuilder()
        .setName("configuration")
        .setDescription("Sends the current configuration of this FossifyMyUrl instance."),
        OnRun: function(int) {
            // discord devs making the worst api ever

            int.deferReply({ephemeral:true}).then(() => {
                fs.readFile(__dirname+"/../../Frontends.json",(err,buf) => {
                    if (err) {int.editReply({content:`Failed to get file: ${err.toString()}`});return;}
                    fs.readFile(__dirname+"/../../Fossify.json",(err,buf) => {
                        if (err) {int.editReply({content:`Failed to get file: ${err.toString()}`});return;}
                        int.editReply({
                            files:[{name:"Frontends.json", attachment:__dirname+"/../../Frontends.json"},{name:"Fossify.json", attachment:__dirname+"/../../Fossify.json"}],
                            embeds:[
                                new Discord.MessageEmbed()
                                    .setColor("BLURPLE")
                                    .setTitle("Instance configuration")
                            ]
                        })
                    })
                })
            })
        }
    },
    {
        SCBuilder: new SlashCommandBuilder()
        .setName("fossify")
        .setDescription("Returns fossified links in the string provided.")
        .addStringOption(new SlashCommandStringOption().setName("string").setDescription("String to fossify").setRequired(true)),
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
                                    .setFooter({text:"(These links are hyperlinks. Clicking on one will lead you to the frontend selected in the configuration.)"})
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
    // If proxy exists, add to array
    ...(FossifySettings.morty ? [{
        SCBuilder: new SlashCommandBuilder()
        .setName("proxy")
        .setDescription("Returns fossified links in the string provided.")
        .addStringOption(new SlashCommandStringOption().setName("string").setDescription("String to fossify").setRequired(true)),
        OnRun: function(int:Discord.CommandInteraction) {
            int.deferReply({ephemeral:true}).then(() => {
                let str = int.options.getString("string")
                if (str) {
                    let transformedURLs = fossify(str,true)
                    if (transformedURLs.length > 0) {
                        int.editReply({
                            embeds:[
                                new Discord.MessageEmbed()
                                    .setColor("BLURPLE")
                                    .setDescription("Click on a link to view it in an alternative frontend\n"+transformedURLs.map(e => `[${e.originalURL}](${e.newURL})`).join("\n"))
                                    .setFooter({text:"(These links are hyperlinks. Clicking on one will lead you to the frontend selected in the configuration.)"})
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
    }] : []),
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
    }
]