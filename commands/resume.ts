import * as types from '../@types/app';
import { Message } from 'discord.js';

export default function resume(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
    if (!message.member?.voice.channel) {
        return message.reply(
            "You have to be in a voice channel to resume the music!"
        );
    }

    if (!currentQueue || !currentQueue.queue || !currentQueue.queue.node.isPaused()) {
        return message.reply("There is no song to resume!");
    }

    currentQueue.queue.node.resume();

    currentQueue.textChannel.send(`🎶 | ${message.author.username} Resumed the song`);
}