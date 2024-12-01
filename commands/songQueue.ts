import * as types from '../@types/app';
import { Message } from 'discord.js';

export default async function songQueue(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
    if (!message.member?.voice.channel) {
        return message.reply(
            "You have to be in a voice channel to see the queue!"
        );
    }

    if (!currentQueue || !currentQueue.queue) {
        return message.reply("There is no queue!");
    }

    let response = "Current queue:\n\n";

    if (currentQueue.queue.node.isPaused() && currentQueue.queue.currentTrack) {
        if (currentQueue.queue.isEmpty()) {
            return message.reply(`Currently playing [PAUSED] **${currentQueue.queue.currentTrack.title}**\n\nNo songs in the queue`);
        } else {
            response = `Currently playing [PAUSED] **${currentQueue.queue.currentTrack.title}**\n\nCurrent queue:\n\n`;
        }
    }

    if (!currentQueue.queue.node.isPaused() && currentQueue.queue.isPlaying() && currentQueue.queue.currentTrack) {
        if (currentQueue.queue.isEmpty()) {
            return message.reply(`Currently playing **${currentQueue.queue.currentTrack.title}**\n\nNo songs in the queue`);
        } else {
            response = `Currently playing **${currentQueue.queue.currentTrack.title}**\n\nCurrent queue:\n\n`;
        }
    }

    if (!currentQueue.queue.isPlaying() && !currentQueue.queue.node.isPaused() && currentQueue.queue.isEmpty()) {
        return message.reply("There is no queue!");
    }

    for (let id = 0; id < currentQueue.queue.size; id++) {
        const track = currentQueue.queue.tracks.at(id);

        if (!track) {
            return message.reply("Something went wrong generating the queue");
        }

        response += `[${id + 1}] - **${track.title}**\n`;
    }

    return message.reply(response);
}