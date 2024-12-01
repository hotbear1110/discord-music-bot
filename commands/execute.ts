import * as types from '../@types/app';
import { Message, TextChannel } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { queue, audioPlayer } from '../app'
import play from './play';

const youtube = require('youtube-search-api');

export default async function execute(message: Message<boolean>, serverQueue: types.jsonQueue | undefined) {
    const search: string = message.content.split(" ").splice(1).join(" ");

    if (!search.length) {
        return message.reply(
            "You need to provide a song to play!"
        );
    }

    if (!message.guild) {
        return;
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
        return message.reply(
            "You need to be in a voice channel to play music!"
        );
    }


    const channel: types.jsonQueue | undefined = queue.get(message.guild.id);

    /* This doesn't work rn

    if (client.voice.adapters.size && channel?.voiceChannel.members.size && channel?.voiceChannel.members.size < 1) {
        return message.reply(
            "I am already in another channel"
        );
    }
    */

    let song: types.jsonSong;

    if (search.includes('youtube.com/watch?v=') || search.includes('youtu.be/')) {
        song = {
            title: '',
            url: search,
        };
    } else if (search.includes('spotify.com/track/')) {
        song = {
            title: 'test',
            url: search,
        };
    } else if (search.includes('soundcloud.com/')) {
        song = {
            title: 'test',
            url: search,
        };
    } else {
        const songInfo = (await youtube.GetListByKeyword(search, false, 1, [{ type: "video" }]))

        if (!songInfo.items.length) {
            return message.reply(
                `Could not find the song: ${search}`
            );
        }

        song = {
            title: songInfo.items[0].title,
            url: 'https://www.youtube.com/watch?v=' + songInfo.items[0].id,
        };
    }

    const queueContruct: types.jsonQueue = {
        textChannel: (message.channel as TextChannel),
        voiceChannel: voiceChannel,
        connection: null,
        audioPlayer: undefined,
        songs: [],
        volume: 5,
        playing: true,
        queue: null,
        queuePlayer: null,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        if (!audioPlayer) {
            console.log('Error: No audioPlayer - ' + audioPlayer);
            return;
        }

        const guildQueue = audioPlayer.nodes.create(voiceChannel.guild.id, {
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 0,
            leaveOnEnd: true,
            leaveOnEndCooldown: 300000,
        });

        guildQueue.setMetadata(message.guild.id);

        queueContruct.connection = connection;
        queueContruct.audioPlayer = audioPlayer;
        queueContruct.queue = guildQueue;
        play(message, queueContruct.songs[0]);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.reply('Something went wrong trying to play the song');
    }
}