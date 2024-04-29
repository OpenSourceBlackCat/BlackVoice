require("dotenv").config();
const {Client, GatewayIntentBits, Partials, SlashCommandBuilder, Events, REST, Routes, Collection} = require("discord.js");
const {joinVoiceChannel, createAudioPlayer, createAudioResource} = require("@discordjs/voice");
const gTTS = require("gtts");
const BlackClient = new Client({intents:Object.values(GatewayIntentBits), partials: Object.values(Partials)});
const BlackREST = new REST().setToken(process.env.TOKEN);
const AllSlashCommands = new Collection();
const BlackSlashCommands = [];
const BlackPlayer = createAudioPlayer();
const AllVoices = [];
let CurrentSpeaker;
BlackClient.on(Events.ClientReady, async(ctx)=>{
    const BlackCommands = [{slashCommand: new SlashCommandBuilder()
    .setName("bark").setDescription("For Black Voice!")
    .addStringOption(option=>option.setName("text").setDescription("Message To Bark!").setRequired(true)),
    async execute(ctx){
        let userText;
        if(CurrentSpeaker!=ctx.member.id){
            CurrentSpeaker = ctx.member.id;
            userText = `${ctx.member.nickname?ctx.member.nickname:ctx.member.user.globalName} says ${ctx.options.getString("text")}`;
        }else{
            userText = `${ctx.options.getString("text")}`;
        }
        if(ctx.member.voice){
            if(!BlackClient.user.voice){
                const BlackVoiceConnection = await joinVoiceChannel({
                    channelId: ctx.member.voice.channel.id,
                    guildId: process.env.GUILD,
                    adapterCreator: ctx.guild.voiceAdapterCreator,
                    selfDeaf:false,
                    selfMute:false
                });
                BlackVoiceConnection.subscribe(BlackPlayer);
                const VoiceGenerate = new gTTS(userText, "hi");
                await VoiceGenerate.save("./BlackVoice.mp3", async()=>{
                    await BlackPlayer.play(createAudioResource("./BlackVoice.mp3"));
                });
            }
        }
        await ctx.deleteReply();
    }}];
    for(let BlackCommand of BlackCommands){
        await AllSlashCommands.set(BlackCommand.slashCommand.name, BlackCommand);
        await BlackSlashCommands.push(BlackCommand.slashCommand);
    }
    await BlackREST.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD), {body: BlackSlashCommands});
    console.log("BlackVoice!");
});
BlackClient.on(Events.InteractionCreate, async(ctx)=>{
    if(ctx.isChatInputCommand()){
        await ctx.deferReply();
        await AllSlashCommands.get(ctx.commandName).execute(ctx);
    }
});
BlackClient.login(process.env.TOKEN);