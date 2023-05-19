import * as types from './@types/app';
import { Client, GatewayIntentBits, Guild, Message } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { Player } from 'discord-player';
import { prefix, token } from './config.json';
const youtube = require('youtube-search-api');

const client: Client<boolean> = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

const queue: Map<String | unknown | undefined, types.jsonQueue> = new Map();

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

    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
        return;
      } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
      } else if (message.content.startsWith(`${prefix}pause`)) {
        //pause(message, serverQueue);
        return;
      } else if (message.content.startsWith(`${prefix}resume`)) {
        //resume(message, serverQueue);
        return;
      }
});

async function execute(message: Message<boolean>, serverQueue: types.jsonQueue | undefined) {
    const search: String = message.content.split(" ").splice(1).join(" ");

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

    const songInfo = (await youtube.GetListByKeyword(search,false,1,[{type:"video"}]))

    const song: types.jsonSong = {
          title: songInfo.items[0].title,
          url: 'https://www.youtube.com/watch?v=' + songInfo.items[0].id,
     };

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
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send('Something went wrong trying to play the song');
      }
}

async function play(guild: Guild | null, song: types.jsonSong) {
    if (!guild) {
        return;
    }
    
    const currentQueue: types.jsonQueue | undefined = queue.get(guild.id);

    if(!currentQueue || !currentQueue.audioPlayer) {
        return;
    }

    if (!song) {
        await currentQueue.audioPlayer.destroy();
        queue.delete(guild?.id);
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
    if (!message.member?.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!currentQueue || !currentQueue.queue || currentQueue.queue.isEmpty() && !currentQueue.queue.isPlaying()) {
        return message.channel.send("There is no song that I could skip!");
    }
    currentQueue.queue.node.skip();

    currentQueue.textChannel.send(`🎶 | ${message.author.username} Skipped the song`);
}

audioPlayer.events.on('playerStart', (guildQueue, track) => {
    const metadata: String | unknown = guildQueue.metadata;
    const currentQueue: types.jsonQueue | undefined = queue.get(metadata);
    currentQueue?.textChannel.send(`🎶 | Started playing **${track.title}**`);
});

client.login(token);