import * as types from '../@types/app';
import { Message } from 'discord.js';

export default function volume(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
    if (!message.member?.voice.channel) {
        return message.reply(
            "You have to be in a voice channel to change the volume!"
        );
    }

    if (!currentQueue || !currentQueue.queue) {
        return message.reply("Unable to change the volume!");
    }

    const volume: string = message.content.split(' ')[1];

    const currentVolume: number = currentQueue.queue.node.volume;

    let newVolume: number = parseInt(volume);

    if (volume.startsWith('+') || volume.startsWith('-')) {
        newVolume = currentVolume + ~~volume;
    }

    newVolume = Math.min(100, Math.max(0, newVolume));

    if (newVolume === currentVolume) {
        return message.reply("Invalid volume set!");
    }

    currentQueue.queue.node.setVolume(newVolume);

    currentQueue.textChannel.send(`🎶 | ${message.author.username} Set the volume to ${newVolume}`);
}