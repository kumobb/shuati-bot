const log = require("npmlog");
const cron = require("cron");
const emojiCharacters = require("./emojiCharacters.js");
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const { token, dbUser, database, dbPwd, channelId } = require("./config.json");
// const token = process.env.TOKEN;
// const dbUser = process.env.DBUSER;
// const database = process.env.DATABASE;
// const dbPwd = process.env.DBPWD;
// const channelId = process.env.CHANNELID;

const { Pool } = require("pg");
const pool = new Pool({
  user: dbUser,
  host: "db.bit.io",
  database: database,
  password: dbPwd,
  port: 5432,
  ssl: true,
});

// const mysql = require("mysql2");
// const connection = mysql.createPool({
//   host: process.env.MYSQL_HOST,
//   user: process.env.MYSQL_USERNAME,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DBNAME,
//   multipleStatements: true,
// });

/*
---------------------------------------
Bot commands
---------------------------------------
*/

client.once("ready", () => {
  log.info(`Logged in as ${client.user.tag}!`);

  client.user.setActivity("刷LeetCode");

  // Start scheduled tasks
  const weeklyRanking = new cron.CronJob("0 0 19 * * SUN", function () {
    getWeeklyReport(async function () {
      getWeeklyReport(generateLeaderboard);
      log.info("Weekly report sent");
    });
  });
  weeklyRanking.start();

  // Because of timezone difference, this task starts at 8pm LA time.
  const dailyReminder = new cron.CronJob("0 0 21 * * *", function () {
    const embed = {
      color: 0xf3e600,
      title: "今天你刷题了吗？",
      author: {
        name: "刷题bot",
        iconURL:
          "https://image.doubilm.com/images/2022-08-11/1661230218076.jpg",
      },
      thumbnail: {
        url: "https://assets.leetcode.com/users/leetcode/avatar_1568224780.png",
      },
      fields: [
        {
          name: "Leetcode",
          value: "https://leetcode.com",
        },
        {
          name: "Hackerrank",
          value: "https://www.hackerrank.com",
        },
        {
          name: "CodeSignal",
          value: "https://codesignal.com",
        },
      ],
    };
    client.channels.cache.get(channelId).send({ embeds: [embed] });
  });
  dailyReminder.start();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "checkin") {
    const num = interaction.options.getInteger("刷题数");
    console.log(num);
    if (num > 20) {
      await interaction.reply("别卷了别卷了（一天最多打卡20题）");
    } else if (num > 0) {
      saveResult(interaction, num);
      const message = await interaction.reply({
        content: `${interaction.user.username}，打卡成功！你今天做了${num}题，你太牛了!`,
        fetchReply: true,
      });
      message.react("👍");
    } else if (num === 0) {
      const message = await interaction.reply({
        content: "你搁这摆烂呢？",
        fetchReply: true,
      });
      message.react("😡");
    } else {
      const message = await interaction.reply({
        content: "你再骂...",
        fetchReply: true,
      });
      message.react("😅");
    }
  }

  // Show leaderboard
  if (commandName === "leaders") {
    await interaction.reply("本周排行榜已送达～");
    getWeeklyReport(generateLeaderboard);
  }
});

client.login(token);

/*
---------------------------------------
Functions needed for commands
---------------------------------------
*/

// // Save records to database (using logic of augmenting)
// // Decide not to use
// function saveResultAdd(userId, username, numProbs, message) {
//   getPrevRecord(userId, function (num) {
//     let result = parseInt(numProbs) + parseInt(num);
//     if (num === 0) {
//       connection.query(
//         `
//         INSERT INTO user_record (user_id, username, num_probs) VALUES (?, ?, ?)
//         `,
//         [userId, username, result],
//         function (err, result) {
//           if (err) log.error(err);
//         }
//       );
//     } else {
//       connection.query(
//         `
//         UPDATE user_record SET num_probs = ?
//         WHERE user_id = ? AND DATE(CONVERT_TZ(timestamp, 'UTC', 'America/Los_Angeles')) = DATE(CONVERT_TZ(CURRENT_TIMESTAMP, 'UTC', 'America/Los_Angeles'))
//         `,
//         [result, userId],
//         function (err, result) {
//           if (err) log.error(err);
//         }
//       );
//     }
//     message.reply(
//       `${message.author.username}, 打卡成功！你今天做了${result}题，你太牛了!`
//     );
//   });
// }

// Save records to database (using logic of replacing)
function saveResult(interaction, numProbs) {
  getTodayRecord(interaction.user.id, function (exists) {
    if (exists === 0) {
      pool
        .query(
          `
        INSERT INTO user_record (user_id, username, num_probs) VALUES ($1, $2, $3)
        `,
          [interaction.user.id, interaction.user.username, numProbs]
        )
        .catch((err) => log.error(err));
    } else {
      pool
        .query(
          `
        UPDATE user_record SET num_probs = $1
        WHERE user_id = $2 AND DATE(timestamp) = DATE(CURRENT_TIMESTAMP)
        `,
          [numProbs, interaction.user.id]
        )
        .catch((err) => log.error(err));
    }
  });
  log.info(`result saved for ${interaction.user.id}, number ${numProbs}`);
}

// Retrieve user's daily record
function getTodayRecord(userId, callback) {
  pool
    .query(
      `
    SELECT num_probs FROM user_record
    WHERE user_id = $1 AND DATE(timestamp) = DATE(CURRENT_TIMESTAMP)
    `,
      [userId]
    )
    .then((res) => callback(res.rows.length))
    .catch((err) => log.error(err));
  log.info(`record retrieved for ${userId}`);
}

// // Clear the record for a user on the current date
// function clearResult(userId) {
//   connection.query(
//     `
//     DELETE FROM user_record
//     WHERE user_id = ? AND DATE(CONVERT_TZ(timestamp, 'UTC', 'America/Los_Angeles')) = DATE(CONVERT_TZ(CURRENT_TIMESTAMP, 'UTC', 'America/Los_Angeles'))
//     `,
//     [userId],
//     function (err, result) {
//       if (err) log.error(err);
//     }
//   );
//   log.info(`record cleared for ${userId}`);
// }

// Generate list of people ordered by number of problems solved each week
function generateLeaderboard(leaders) {
  var text = "";
  // Here you can specify the number of people displayed manually
  const length = Math.min(10, leaders.length);
  var index = 1;
  for (var i = 0; i < length; i++) {
    text += `${emojiCharacters[index]} ${leaders[i].username}(${leaders[i].num})\n`;
    index += 1;
  }
  const embed = {
    color: 0xf3e600,
    title: "本周排行榜",
    author: {
      name: "刷题bot",
      iconURL: "https://image.doubilm.com/images/2022-08-11/1661230218076.jpg",
    },
    description: `起始时间：${getMonday(new Date())}`,
    thumbnail: {
      url: "https://i.pinimg.com/originals/69/e0/6a/69e06a096ec5e14eefa1b7ff72fddf7f.gif",
    },
    fields: [
      {
        name: "\u200b",
        value: text,
      },
    ],
  };
  client.channels.cache.get(channelId).send({ embeds: [embed] });
}

// Compute weekly report
function getWeeklyReport(callback, interaction) {
  pool
    .query(
      `
      SELECT username, num
      FROM (
        SELECT row_num, num
        FROM (
          SELECT user_id, SUM(num_probs) AS num
          FROM user_record
          WHERE DATE(timestamp)
          BETWEEN DATE_TRUNC('week', CURRENT_TIMESTAMP)
          AND DATE(CURRENT_TIMESTAMP)
          GROUP BY user_id
        ) user_prob
        JOIN (
          SELECT user_id, MAX(id) AS row_num
          FROM user_record
          WHERE DATE(timestamp)
          BETWEEN DATE_TRUNC('week', CURRENT_TIMESTAMP)
          AND DATE(CURRENT_TIMESTAMP)
          GROUP BY user_id
        ) record
        ON user_prob.user_id = record.user_id
      ) temp
      JOIN user_record
      ON temp.row_num = user_record.id
      ORDER BY num DESC
      `
    )
    .then((res) => callback(res.rows, interaction))
    .catch((err) => log.error(err));
}

// Get start date of given timestamp
function getMonday(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff)).toISOString().split("T")[0];
}
