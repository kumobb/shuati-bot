const Discord = require('discord.js');
const prefix = "!";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const token = process.env.TOKEN;

client.on('ready', () => {

    console.log('Ready');
    client.user.setActivity("刷LeetCode");

});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "checkin") {
        let num = args[0];
        message.reply(`${message.author.username}, 打卡成功！你今天做了${num}题，你太牛了!`);
    }

    if (command === "remind") {
        message.channel.send("@everyone, 今天你刷题了吗?");
    }

    if (command === "test") {
        message.channel.send("test");
    }
});

client.login(token);