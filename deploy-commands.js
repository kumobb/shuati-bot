const { REST, SlashCommandBuilder, Routes } = require("discord.js");

const { clientId, guildId, token } = require("./config.json");
// const clientId = process.env.CLIENTID;
// const guildId = process.env.GUILDID;
// const token = process.env.TOKEN;

const commands = [
  new SlashCommandBuilder()
    .setName("checkin")
    .setDescription("记录今天你刷的题目")
    .addIntegerOption((option) =>
      option
        .setName("刷题数")
        .setDescription("今天你刷的题目数量")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("leaders")
    .setDescription("获取本周刷题排行榜"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then((data) =>
    console.log(`Successfully registered ${data.length} application commands.`)
  )
  .catch(console.error);
