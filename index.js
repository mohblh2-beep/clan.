require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder
} = require("discord.js");

const express = require("express");

const {
    APPLY_CHANNEL_ID,
    CLANS
} = require("./config");


// ================= WEB SERVER =================

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Clan Bot Online");
});

app.listen(PORT, () => {
    console.log(`Web server running on ${PORT}`);
});


// ================= DISCORD CLIENT =================

const client = new Client({

    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],

    partials:["CHANNEL"]

});


// ================= READY =================

client.once("ready", () => {

    console.log(`✅ Logged in as ${client.user.tag}`);

});


// ================= PANEL =================

client.on("messageCreate", async message => {

    if(message.author.bot) return;

    if(message.content !== "*clan") return;


    const banner = new AttachmentBuilder("./COCAINA.png");


    const embed = new EmbedBuilder()

    .setTitle("🏆 CLAN RECRUITMENT CENTER")

    .setDescription(`

**Welcome to the official clan recruitment system.**

Choose the clan you want to join by clicking one of the buttons below and complete the application form.

━━━━━━━━━━━━━━━━━━━━━━

📌 **Before applying**

• Fill in all information correctly.
• Submit only one application.
• Wait patiently for the leader's decision.

━━━━━━━━━━━━━━━━━━━━━━

👻 **${CLANS.ghost.name}**

🌑 **${CLANS.night.name}**

🐉 **${CLANS.dragons.name}**

━━━━━━━━━━━━━━━━━━━━━━

**Click one of the buttons below to start your application.**

`)

    .setImage("attachment://COCAINA.png")

    .setColor("#8A2BE2")

    .setFooter({
        text:"Official Clan Recruitment System"
    })

    .setTimestamp();



    const row = new ActionRowBuilder()

    .addComponents(

        new ButtonBuilder()
        .setCustomId("apply_ghost")
        .setLabel("👻 GHOST")
        .setStyle(ButtonStyle.Primary),


        new ButtonBuilder()
        .setCustomId("apply_night")
        .setLabel("🌑 NIGHT")
        .setStyle(ButtonStyle.Secondary),


        new ButtonBuilder()
        .setCustomId("apply_dragons")
        .setLabel("🐉 DRAGONS")
        .setStyle(ButtonStyle.Success)

    );



    const channel = message.guild.channels.cache.get(APPLY_CHANNEL_ID);


    if(!channel)
        return message.reply("❌ Apply channel not found");



    await channel.send({

        embeds:[embed],
        components:[row],
        files:[banner]

    });



    message.reply("✅ Panel created");


});
// ================= BUTTONS + MODAL =================

client.on("interactionCreate", async interaction => {

try{


// ===== APPLY BUTTON =====

if(
    interaction.isButton() &&
    interaction.customId.startsWith("apply_")
){


    const clanKey = interaction.customId.replace("apply_","");


    const modal = new ModalBuilder()

    .setCustomId(`modal_${clanKey}`)

    .setTitle("Clan Application");



    const name = new TextInputBuilder()

    .setCustomId("name")
    .setLabel("Your name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);



    const age = new TextInputBuilder()

    .setCustomId("age")
    .setLabel("Your age")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);



    const info = new TextInputBuilder()

    .setCustomId("info")
    .setLabel("Tell us about yourself")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);



    modal.addComponents(

        new ActionRowBuilder().addComponents(name),

        new ActionRowBuilder().addComponents(age),

        new ActionRowBuilder().addComponents(info)

    );


    return interaction.showModal(modal);

}



// ===== ACCEPT =====

if(
    interaction.isButton() &&
    interaction.customId.startsWith("accept_")
){

    const data = interaction.customId.split("_");


    const guildID = data[1];
    const userID = data[2];
    const clanKey = data[3];


    const guild = client.guilds.cache.get(guildID);


    if(!guild)
        return interaction.reply({
            content:"❌ Server not found",
            ephemeral:true
        });



    const member = await guild.members.fetch(userID);



    await member.roles.add(
        CLANS[clanKey].roleID
    );



    await member.send(
        `🎉 تم قبولك في ${CLANS[clanKey].name}`
    ).catch(()=>{});



    return interaction.update({

        content:`✅ Accepted by ${interaction.user.tag}`,

        components:[]

    });

}



// ===== REJECT =====

if(
    interaction.isButton() &&
    interaction.customId.startsWith("reject_")
){

    const data = interaction.customId.split("_");


    const userID = data[2];

    const clanKey = data[3];



    const user = await client.users.fetch(userID);



    await user.send(
        `❌ تم رفض طلبك في ${CLANS[clanKey].name}`
    ).catch(()=>{});



    return interaction.update({

        content:`❌ Rejected by ${interaction.user.tag}`,

        components:[]

    });

}



// ===== MODAL SUBMIT =====

if(
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("modal_")
){


    await interaction.deferReply({
        ephemeral:true
    });



    const clanKey =
    interaction.customId.replace("modal_","");



    const clan = CLANS[clanKey];



    const embed = new EmbedBuilder()

    .setTitle("📩 New Clan Application")

    .setDescription(`

👤 User:
<@${interaction.user.id}>

📝 Name:
${interaction.fields.getTextInputValue("name")}

🎂 Age:
${interaction.fields.getTextInputValue("age")}

📌 Info:
${interaction.fields.getTextInputValue("info")}

🏆 Clan:
${clan.name}

`)

    .setColor("Blue");



    const row = new ActionRowBuilder()

    .addComponents(


        new ButtonBuilder()

        .setCustomId(
        `accept_${interaction.guild.id}_${interaction.user.id}_${clanKey}`
        )

        .setLabel("✅ Accept")

        .setStyle(ButtonStyle.Success),



        new ButtonBuilder()

        .setCustomId(
        `reject_${interaction.guild.id}_${interaction.user.id}_${clanKey}`
        )

        .setLabel("❌ Reject")

        .setStyle(ButtonStyle.Danger)

    );



    const guild = interaction.guild;


    await guild.members.fetch();



    const leaderRole =
    guild.roles.cache.get(clan.leaderRoleID);



    if(!leaderRole)

        return interaction.editReply(
            "❌ Leader role not found"
        );



    const leaders = leaderRole.members;



    if(leaders.size === 0)

        return interaction.editReply(
            "❌ No leader online"
        );



    for(const [,leader] of leaders){

        await leader.send({

            embeds:[embed],

            components:[row]

        }).catch(()=>{});

    }



    await interaction.editReply(
        "✅ Application sent to leader"
    );

}


}catch(err){

    console.log(err);

}


});


// ================= LOGIN =================

client.login(process.env.TOKEN);