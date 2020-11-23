// https://discord.com/api/oauth2/authorize?client_id=780118449413554226&permissions=8&scope=bot

const Discord = require('discord.js');
const client = new Discord.Client();

const { token } = require('./secret.json');
const { prefix } = require('./config.json');

const _ = require('lodash');

let muted_channels = new Set();
let muted_users = new Set();

client.on('ready', () => {
    console.log(`Iniciado como ${client.user.tag}`);
});

client.on('message', async message => { // Messagae
    const { author, content, member, channel } = message;
    if (author.bot || !member || !message.guild || !content.startsWith(prefix) || message.system) return;

    const command = _.lowerCase(_.trimStart(content, prefix));

    const { voice } = member;

    const { channelID } = voice;
    if (!channelID && (command === "on" || command === "off")) return await message.reply('tienes que estar en un canal de voz.');

    if (!member.hasPermission('MUTE_MEMBERS')) return await message.reply('tienes que tener el permiso Silenciar Miembros.');
    
    if (command === "off") {
        const members = message.guild.channels.cache.get(channelID).members.array();
        muted_channels.add(channelID);

        for (let i = 0; i < members.length; i++) {
            await process_member(members[i].voice, false);
        };
            
    } else if (command === "on") {
        const members = message.guild.channels.cache.get(channelID).members.array();
        muted_channels.delete(channelID);

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
    const { channelID, serverMute, id } = voice;
    if (!channelID) return;

    console.log("Testeando usuario");
    console.log(muted_channels);

    if (muted_channels.has(channelID) && !serverMute) {
        console.log("muteandolo")
        await voice.setMute(true);
        muted_users.add(id);
    }

    if (!muted_channels.has(channelID) && serverMute && (muted_users.has(id) || !from_change)) {
        console.log("desmuteandolo")
        await voice.setMute(false);
        muted_users.delete(id);
    }
}

client.login(token);