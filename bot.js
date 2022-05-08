const Discord = require("discord.js");
const prefix = "!";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

const dotenv = require("dotenv");
dotenv.config();
const token = process.env.TOKEN;

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DBNAME,
});

client.on("ready", () => {
  console.log("Ready");
  client.user.setActivity("刷LeetCode");
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Check-In Command
  if (command === "checkin") {
    let num = args[0];
    // Here we save user's response to database
    // and show a prompt
    saveResult(message.author.id, num, message);
  }

  if (command === "remind") {
    message.channel.send("@everyone, 今天你刷题了吗?");
  }

  if (command === "test") {
    message.channel.send("test");
  }

  if (command === "reply") {
    message.channel.send(`<@${message.author.id}> 今天你刷题了吗?`);
  }
});

// Save records to database
function saveResult(userId, numProbs, message) {
  getPrevRecord(userId, function (num) {
    let result = parseInt(numProbs) + parseInt(num);
    if (num === 0) {
      connection.query(
        "INSERT INTO user_record (user_id, num_probs, day) VALUES (?, ?, current_date)",
        [userId, result],
        function (err, result) {
          if (err) throw err;
        }
      );
    } else {
      connection.query(
        "UPDATE user_record SET num_probs = ? WHERE user_id = ? and day = current_date",
        [result, userId],
        function (err, result) {
          if (err) throw err;
        }
      );
    }
    message.reply(
      `${message.author.username}, 打卡成功！你今天做了${result}题，你太牛了!`
    );
  });
}

// Retrieve user's daily record
function getPrevRecord(userId, callback) {
  connection.query(
    "SELECT num_probs FROM user_record WHERE user_id = ? and day = current_date",
    [userId],
    function (err, result) {
      if (err) throw err;
      if (result.length === 0) callback(0);
      else callback(result[0].num_probs);
    }
  );
}

client.login(token);
