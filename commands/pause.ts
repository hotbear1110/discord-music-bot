import * as types from '../@types/app';
import { Message } from 'discord.js';

export default function pause(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
    if (!message.member?.voice.channel) {
        return message.reply(
            "You have to be in a voice channel to pause the music!"
        );
    }

    if (!currentQueue || !currentQueue.queue || !currentQueue.queue.currentTrack || currentQueue.queue.isEmpty() && !currentQueue.queue.isPlaying()) {
        return message.reply("There is no song to pause!");
    }

    currentQueue.queue.node.pause();

    currentQueue.textChannel.send(`🎶 | ${message.author.username} Paused the song`);
}