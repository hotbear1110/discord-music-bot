import * as types from '../@types/app';
import { Message } from 'discord.js';

export default function skip(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
    if (!message.member?.voice.channel) {
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    }

    if (!currentQueue || !currentQueue.queue || currentQueue.queue.isEmpty() && !currentQueue.queue.isPlaying()) {
        return message.channel.send("There is no song that I could skip!");
    }
    currentQueue.queue.node.skip();

    currentQueue.textChannel.send(`🎶 | ${message.author.username} Skipped the song`);
}