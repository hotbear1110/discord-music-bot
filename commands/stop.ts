import * as types from '../@types/app';
import { Message } from 'discord.js';
import { queue } from '../app'

export default async function stop(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
    if (!message.member?.voice.channel) {
        return message.channel.send(
            "You have to be in a voice channel to change the volume!"
        );
    }
    if (!currentQueue || !currentQueue.queue || !currentQueue.audioPlayer) {
        return;
    }

    currentQueue.queue.clear();
    await currentQueue.audioPlayer.destroy();
    queue.delete(message.guild?.id);

    currentQueue.textChannel.send(`🎶 | Left the channel`);
}