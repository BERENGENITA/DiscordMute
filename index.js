const Discord = require('discord.js');
const client = new Discord.Client();

const { token } = require('./secret.json');
const { prefix } = require('./config.json');

const _ = require('lodash');

let muted_channels = [];
let muted_users = [];

let editing_users = false;
let editing_channels = false;

// https://discord.com/api/oauth2/authorize?client_id=780118449413554226&permissions=8&scope=bot
// FIXME USE SETS new Set()
client.on('ready', () => {
    console.log(`Iniciado como ${client.user.tag}`);
});

client.on('message', async message => { // Messagae
    const { author, content, member, channel } = message;
    if (author.bot || !member || !message.guild || !content.startsWith(prefix) || message.system) return;

    const command = _.lowerCase(_.trimStart(content, prefix));

    const { id, voice, permissions } = member;

    const { channelID } = voice;
    const members = message.guild.channels.cache.get(channelID).members.array();

    if (!channelID && (command === "on" || command === "off")) return await message.reply('tienes que estar en un canal de voz.');
    
    if (command === "off") {
        if (!muted_channels.includes(channelID)) {
            while (editing_channels) {
                console.log("Waiting for edit");
            }
            editing_channels = true;
            muted_channels.push(channelID);
            editing_channels = false;
        }

        for (let i = 0; i < members.length; i++) {
            await process_member(members[i].voice, false);
        };
            
    } else if (command === "on") {
        if (muted_channels.includes(channelID)) {
            while (editing_channels) {
                console.log("Waiting for edit");
            }
            editing_channels = true;
            muted_channels = _.remove(muted_channels, val => val === channelID);
            editing_channels = false;
        }

        for (let i = 0; i < members.length; i++) {
            await process_member(members[i].voice, false);
        };

    } else if (command === "help") {
        return await channel.send(`${prefix}off: desactiva los micrófonos.\n${prefix}on: activa los micrófonos.`);
    } else {
        return await message.reply(`comando no encontrado. Para más información prueba \`${prefix}help\``);
    }
});

client.on('voiceStateUpdate', async (previous, current) => await process_member(current, true));

async function process_member(voice, from_change) {
    if (!voice) return;
    const { channelID, serverMute, id } = voice;

    console.log("Testeando usuario");
    console.log(muted_channels);

    if (muted_channels.includes(channelID) && !serverMute) {
        console.log("muteandolo")
        await voice.setMute(true);
        while (editing_users) {
            console.log("Waiting for edit");
        }
        editing_users = true;
        muted_users.push(id);
        editing_users = false;
    }

    if (!muted_channels.includes(channelID) && serverMute && (muted_users.includes(id) || !from_change)) {
        console.log("desmuteandolo")
        await voice.setMute(false);
        while (editing_users) {
            console.log("Waiting for edit");
        }
        editing_users = true;
        muted_users = _.remove(muted_users, val => val === id);
        editing_users = false;
    }
}

client.login(token);