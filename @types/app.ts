import { VoiceConnection } from "@discordjs/voice"
import { GuildQueue, GuildQueuePlayerNode, Player } from "discord-player"
import { DMChannel, GuildMember, NewsChannel, PartialDMChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, User, VoiceBasedChannel, VoiceChannel } from "discord.js"

export interface jsonSong {
    title: string,
    url: string
}

export interface jsonQueue {
    textChannel: DMChannel | PartialDMChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel | VoiceChannel,
    voiceChannel: VoiceBasedChannel,
    connection: VoiceConnection | null,
    audioPlayer: Player | undefined,
    songs: jsonSong[],
    volume: number,
    playing: boolean,
    queue: GuildQueue<unknown> | null | undefined,
    queuePlayer: GuildQueuePlayerNode | null,
}

export interface metadata {
    channel: DMChannel | PartialDMChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel | VoiceChannel,
    client: GuildMember | null | undefined
    requestedBy: User,
}