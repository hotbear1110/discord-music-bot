import * as types from './@types/app';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { Player } from 'discord-player';
import { prefix, token, oauthTokens } from './config.json';
import execute from './commands/execute'
import skip from './commands/skip'
import pause from './commands/pause'
import resume from './commands/resume'
import volume from './commands/volume'
import stop from './commands/stop'
import remove from './commands/remove'
import songQueue from './commands/songQueue';
import { YoutubeiExtractor } from "discord-player-youtubei"

const { promisify } = require('node:util');
const { exec } = require('node:child_process');

const client: Client<boolean> = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

const queue: Map<string | unknown | undefined, types.jsonQueue> = new Map();

const audioPlayer: Player = Player.singleton(client);

client.once("ready", async () => {
  try {
    await audioPlayer.extractors.register(YoutubeiExtractor, {
      authentication: oauthTokens
    });
  } catch (err) {
    console.log(err)
  }

  await audioPlayer.extractors.loadDefault();
  await audioPlayer.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');

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
  const queueRegex = new RegExp(`^\\${prefix}q(ueue)?\\b`, 'i');
  const commandsRegex = new RegExp(`^\\${prefix}commands\\b`, 'i');
  const restartRegex = new RegExp(`^\\${prefix}(restart|fix)\\b`, 'i');

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
  } else if (commandsRegex.exec(message.content)) {
    message.reply(`**Commands:**\n\n>>> !play (!p) - Adds a song to the queue. Example: !play in da club\n!skip (!s) - Skips the current song\n!pause - Pauses the current song\n!resume (!r) - Resumes the song if paused\n!volume (!v) - Adjusts the volume of the song. Example: !volume 50\n!stop - Stops the music, deletes the queue and leaves the server\n!remove - Removes a song from the queue with the given index. Example: !remove 2\n!queue (!q) - Shows the song queue\n!commands - Shows this list of commands`);
    return;
  } else if (restartRegex.exec(message.content)) {
    // Easy fix "for now"
    const shell = promisify(exec);
    await message.reply(`Restarting bot...`);

    shell('sudo systemctl restart discord-music-bot')
  }
});

audioPlayer.events.on('playerStart', (guildQueue, track) => {
  const metadata: string | unknown = guildQueue.metadata;
  const currentQueue: types.jsonQueue | undefined = queue.get(metadata);
  console.log(track)
  currentQueue?.textChannel.send(`🎶 | Started playing **${track.title}**`);
});

audioPlayer.events.on('playerError', (guildQueue, track) => {
  const metadata: string | unknown = guildQueue.metadata;
  const currentQueue: types.jsonQueue | undefined = queue.get(metadata);
  currentQueue?.textChannel.send('Something went wrong when playing the song');
});

audioPlayer.events.on('error', (queue, error) => {
  // Emitted when the player queue encounters error
  console.log(`General player error event: ${error.message}`);
  console.log(error);
});

client.login(token);

export { queue, audioPlayer }