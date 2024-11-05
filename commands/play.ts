import * as types from '../@types/app';
import { Message } from 'discord.js';
import { queue } from '../app'

export default async function play(message: Message<boolean>, song: types.jsonSong) {
    if (!message.guild) {
        return;
    }

    const currentQueue: types.jsonQueue | undefined = queue.get(message.guild.id);

    if (!currentQueue || !currentQueue.audioPlayer) {
        return;
    }

    if (!song) {
        queue.delete(message.guild?.id);
        return;
    }

    const track = await currentQueue.audioPlayer.search(song.url);

    if (!track || !currentQueue.queue) {
        console.log(track + ' - ' + currentQueue.queue);
        if (currentQueue.queue && (!currentQueue.queue.isPlaying() && !currentQueue.queue.node.isPaused() && currentQueue.queue.isEmpty())) {
            currentQueue.queue.clear();
            currentQueue.audioPlayer.extractors.loadDefault();
            queue.delete(message.guild?.id);
        } else if (!currentQueue.queue) {
            currentQueue.audioPlayer.extractors.loadDefault();
            queue.delete(message.guild?.id);
        }

        return currentQueue.textChannel.send('Was unable to play the song');
    }

    if (!track.hasTracks()) {
        console.log(track);
        if (!currentQueue.queue.isPlaying() && !currentQueue.queue.node.isPaused() && currentQueue.queue.isEmpty()) {
            currentQueue.queue.clear();
            currentQueue.audioPlayer.extractors.loadDefault();
            queue.delete(message.guild?.id);
        }
        return currentQueue.textChannel.send('Was unable to find the song');
    }

    if (!currentQueue.queue.isEmpty() || currentQueue.queue.isPlaying()) {
        currentQueue.queue.addTrack(track.tracks[0]);
        return currentQueue.textChannel.send(`🎶 | Added **${track.tracks[0].title}** to the queue [${currentQueue.queue.getSize()}]`);;
    }

    currentQueue.audioPlayer.play(currentQueue.voiceChannel, track);
}