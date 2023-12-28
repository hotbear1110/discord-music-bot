import * as types from './@types/app';
import { Client, GatewayIntentBits, Guild, Message } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { Player } from 'discord-player';
import { prefix, token } from './config.json';
const youtube = require('youtube-search-api');

const client: Client<boolean> = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

const queue: Map<string | unknown | undefined, types.jsonQueue> = new Map();

const audioPlayer: Player = Player.singleton(client);
audioPlayer.extractors.loadDefault();

client.once("ready", () => {
    console.log("Ready!");
});
  
client.once("reconnecting", () => {
console.log("Reconnecting!");
});
  
client.once("disconnect", () => {
console.log("Disconnect!");
});

client.on("messageCreate", async (message: Message<boolean>) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue: types.jsonQueue | undefined = queue.get(message.guild?.id);

    const playRegex = new RegExp(`^\\${prefix}p(lay)?\\s`, 'i');
    const skipRegex = new RegExp(`^\\${prefix}s(kip|\\b)\\b`, 'i');
    const stopRegex = new RegExp(`^\\${prefix}stop\\b`, 'i');
    const resumeRegex = new RegExp(`^\\${prefix}r(esume|\\b)\\b`, 'i');
    const volumeRegex = new RegExp(`^\\${prefix}v(olume)?\\s`, 'i');
    const removeRegex = new RegExp(`^\\${prefix}remove\\s`, 'i');
    const queueRegex = new RegExp(`^\\${prefix}q(ueue)?\\s`, 'i');

    if (playRegex.exec(message.content)) {
        execute(message, serverQueue);
        return;
      } else if (skipRegex.exec(message.content)) {
        skip(message, serverQueue);
        return;
      } else if (message.content.startsWith(`${prefix}pause`)) {
        pause(message, serverQueue);
        return;
      } else if (resumeRegex.exec(message.content)) {
        resume(message, serverQueue);
        return;
      } else if (volumeRegex.exec(message.content)) {
        volume(message, serverQueue);
        return;
      } else if (stopRegex.exec(message.content)) {
        stop(message, serverQueue);
        return;
      } else if (removeRegex.exec(message.content)) {
        remove(message, serverQueue);
        return;
      } else if (queueRegex.exec(message.content)) {
        songQueue(message, serverQueue);
        return;
      }
});

async function execute(message: Message<boolean>, serverQueue: types.jsonQueue | undefined) {
    const search: string = message.content.split(" ").splice(1).join(" ");

    if (!search.length) {
      return message.channel.send(
        "You need to provide a song to play!"
    );
    }

    if (!message.guild) {
        return;
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
        return message.channel.send(
            "You need to be in a voice channel to play music!"
        );
    }


    const channel: types.jsonQueue | undefined = queue.get(message.guild.id);

    /* This doesn't work rn

    if (client.voice.adapters.size && channel?.voiceChannel.members.size && channel?.voiceChannel.members.size < 1) {
        return message.channel.send(
            "I am already in another channel"
        );
    }
    */

    let song: types.jsonSong;

    if(search.includes('youtube.com/watch?v=') || search.includes('youtu.be/')) {
      song = {
        title: '',
        url: search,
      };
    } else {
      const songInfo = (await youtube.GetListByKeyword(search,false,1,[{type:"video"}]))

      if (!songInfo.items.length) {
        return message.channel.send(
          `Could not find the song: ${search}`
      );
      }
  
      song = {
            title: songInfo.items[0].title,
            url: 'https://www.youtube.com/watch?v=' + songInfo.items[0].id,
       };
    }

    const queueContruct: types.jsonQueue = {
        textChannel: message.channel,
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
               leaveOnEmptyCooldown: 300000,
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
        return message.channel.send('Something went wrong trying to play the song');
      }
}

async function play(message: Message<boolean>, song: types.jsonSong) {
    if (!message.guild) {
        return;
    }
    
    const currentQueue: types.jsonQueue | undefined = queue.get(message.guild.id);

    if(!currentQueue || !currentQueue.audioPlayer) {
        return;
    }

    if (!song) {
        await currentQueue.audioPlayer.destroy();
        queue.delete(message.guild?.id);
        return;
    }
  
    const track = await currentQueue.audioPlayer.search(song.url);

    if (!track || !currentQueue.queue) {
        console.log(track + ' - ' + currentQueue.queue);
        return currentQueue.textChannel.send('Was unable to play the song');
    }

    if (!track.hasTracks()) {
        console.log(track);
        return currentQueue.textChannel.send('Was unable to find the song');
    }

    if (!currentQueue.queue.isEmpty() || currentQueue.queue.isPlaying()) {
        currentQueue.queue.addTrack(track.tracks[0]);
        return currentQueue.textChannel.send(`🎶 | Added ${track.tracks[0].title} to the queue [${currentQueue.queue.getSize()}]`);;
    }

    currentQueue.audioPlayer.play(currentQueue.voiceChannel, song.url);
}


function skip(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
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


function pause(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
  if (!message.member?.voice.channel) {
    return message.channel.send(
      "You have to be in a voice channel to pause the music!"
    );
  }

  if (!currentQueue || !currentQueue.queue || !currentQueue.queue.currentTrack || currentQueue.queue.isEmpty() && !currentQueue.queue.isPlaying()) {
    return message.channel.send("There is no song to pause!");
  }

  currentQueue.queue.node.pause();

  currentQueue.textChannel.send(`🎶 | ${message.author.username} Paused the song`);
}

function resume(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
  if (!message.member?.voice.channel) {
    return message.channel.send(
      "You have to be in a voice channel to resume the music!"
    );
  }

  if (!currentQueue || !currentQueue.queue || !currentQueue.queue.node.isPaused()) {
    return message.channel.send("There is no song to resume!");
  }

  currentQueue.queue.node.resume();

  currentQueue.textChannel.send(`🎶 | ${message.author.username} Resumed the song`);
}

function volume(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
  if (!message.member?.voice.channel) {
    return message.channel.send(
      "You have to be in a voice channel to change the volume!"
    );
  }

  if (!currentQueue || !currentQueue.queue) {
    return message.channel.send("Unable to change the volume!");
  }

  const volume: string = message.content.split(' ')[1];

  const currentVolume: number = currentQueue.queue.node.volume;

  let newVolume: number = parseInt(volume);

  if (volume.startsWith('+') || volume.startsWith('-')) {
    newVolume = currentVolume + ~~volume;
  }

  newVolume =  Math.min(100, Math.max(0, newVolume));

  if (newVolume === currentVolume) {
    return message.channel.send("Invalid volume set!");
  }

  currentQueue.queue.node.setVolume(newVolume);

  currentQueue.textChannel.send(`🎶 | ${message.author.username} Set the volume to ${newVolume}`);
}

async function stop(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
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

async function remove(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
  
  if (!message.member?.voice.channel) {
    return message.channel.send(
    "You have to be in a voice channel to remove a song!"
    );
  }

  const id: number = parseInt(message.content.split(" ")[1]);

  if (id === 0) {
    return message.channel.send("You can't remove the currently playing song");
  }

  if (!currentQueue || !currentQueue.queue || currentQueue.queue.isEmpty() || currentQueue.queue.size <= id) {
    return message.channel.send("There is no song that I could remove!");
  }

  const track = currentQueue.queue.tracks.at(id);

  if (!track) {
    return message.channel.send("I was unable to remove the track");
  }

  currentQueue.queue.removeTrack(id);

  currentQueue.textChannel.send(`🎶 | Removed song **${track.title}**`);
}

async function songQueue(message: Message<boolean>, currentQueue: types.jsonQueue | undefined) {
  if (!message.member?.voice.channel) {
    return message.channel.send(
    "You have to be in a voice channel to see the queue!"
    );
  }

  if (!currentQueue || !currentQueue.queue || currentQueue.queue.isEmpty()) {
    return message.channel.send("There are no songs in the queue!");
  }

  let response = "Current queue:\n\n";

  for (let id = 0; id < currentQueue.queue.size; id++) {
    const track = currentQueue.queue.tracks.at(id);

    if (!track) {
      return message.channel.send("Something went wrong generating the queue");
    }

    response += `[${id}] - **${track.title}**\n`;
  }

  return message.channel.send(response);
}

audioPlayer.events.on('playerStart', (guildQueue, track) => {
  const metadata: string | unknown = guildQueue.metadata;
  const currentQueue: types.jsonQueue | undefined = queue.get(metadata);
  currentQueue?.textChannel.send(`🎶 | Started playing **${track.title}**`);
});

audioPlayer.events.on('playerError', (guildQueue, track) => {
  const metadata: string | unknown = guildQueue.metadata;
  const currentQueue: types.jsonQueue | undefined = queue.get(metadata);
  currentQueue?.textChannel.send('Something went wrong when playing the song');
});

client.login(token);
