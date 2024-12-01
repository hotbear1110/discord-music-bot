import * as types from '../@types/app';
import { Message } from 'discord.js';

export default async function remove(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {

    if (!message.member?.voice.channel) {
        return message.reply(
            "You have to be in a voice channel to remove a song!"
        );
    }

    const id: number = parseInt(message.content.split(" ")[1]);

    if (id === 0) {
        return message.reply("You can't remove the currently playing song");
    }

    if (!currentQueue || !currentQueue.queue || currentQueue.queue.isEmpty() || currentQueue.queue.getSize() < id) {
        return message.reply("There are no songs to remove!");
    }

    const track = currentQueue.queue.tracks.at(id - 1);

    if (!track) {
        return message.reply("I was unable to remove the track");
    }

    currentQueue.queue.removeTrack(id - 1);

    currentQueue.textChannel.send(`🎶 | Removed song **${track.title}**`);
}