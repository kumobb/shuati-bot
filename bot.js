const log = require("npmlog");
const cron = require("cron");

const Discord = require("discord.js");
const prefix = "!";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

const dotenv = require("dotenv");
dotenv.config();
const token = process.env.TOKEN;

const mysql = require("mysql2");
const connection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DBNAME,
});

/*
---------------------------------------
Bot commands
---------------------------------------
*/

client.on("ready", () => {
  log.info("Ready");
  client.user.setActivity("刷LeetCode");

  // Start scheduled tasks
  let scheduledMessage = new cron.CronJob("0 0 18 * * SUN", function () {
    getWeeklyResult(function (topThree) {
      let juanWang = "本周的卷王是：";
      for (let i in topThree) {
        juanWang += topThree[i].username + " ";
      }
      client.channels.cache.get(process.env.CHANNEL_ID).send(juanWang);
    });
  });
  scheduledMessage.start();
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Daily check in
  if (command === "checkin") {
    let num = args[0];
    // Here we save user's response to database
    // and show a prompt
    saveResult(message.author.id, message.author.username, num, message);
  }

  // Clear daily record in case mistakenly input wrong number
  if (command === "clear") {
    clearResult(message.author.id);
    message.channel.send("今天的记录已清空！");
  }

  // Show leaderboard
  if (command === "leaders") {
    sendWeeklyResult(message);
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

/*
---------------------------------------
Functions needed for commands
---------------------------------------
*/

// Save records to database
function saveResult(userId, username, numProbs, message) {
  getPrevRecord(userId, function (num) {
    let result = parseInt(numProbs) + parseInt(num);
    if (num === 0) {
      connection.query(
        "INSERT INTO user_record (user_id, username, num_probs, day) VALUES (?, ?, ?, current_date)",
        [userId, username, result],
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

function clearResult(userId) {
  connection.query(
    "DELETE FROM user_record WHERE user_id = ? and day = current_date",
    [userId],
    function (err, result) {
      if (err) throw err;
    }
  );
}

function sendWeeklyResult(message) {
  getWeeklyResult(function (topThree) {
    let juanWang = "本周的卷王是：";
    for (let i in topThree) {
      juanWang += topThree[i].username + " ";
    }
    message.reply(juanWang);
  });
}

function getWeeklyResult(callback) {
  connection.query(
    `
    WITH leaders AS (
      SELECT user_id, SUM(num_probs) AS num 
      FROM user_record 
      WHERE day BETWEEN DATE_SUB(current_date, INTERVAL(WEEKDAY(current_date)) DAY) AND current_date 
      GROUP BY user_id 
      ORDER BY SUM(num_probs) DESC 
      LIMIT 3
    ),
    record AS (
      SELECT user_id, MAX(id) AS row_num
      FROM user_record
      WHERE day BETWEEN DATE_SUB(current_date, INTERVAL(WEEKDAY(current_date)) DAY) AND current_date
      GROUP BY user_id
    ),
    temp AS (
      SELECT row_num, num 
      FROM leaders JOIN record 
      ON leaders.user_id = record.user_id
    )
    SELECT username, num 
    FROM temp JOIN user_record
    ON temp.row_num = user_record.id
    ORDER BY num DESC
    `,
    function (err, result) {
      if (err) throw err;
      else callback(result);
    }
  );
}

client.login(token);
