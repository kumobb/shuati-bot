<h1 style="text-align:center">Shuati Bot</h1>

## Depoly Command

In order to deploy on Google Cloud Platform, run following commands when logging in.

```
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

To build and run Shuati Bot, run following commands.

```
git pull origin main
npm install
node deploy-commands.js
pm2 start index.js -o logs/log.txt
```

## Changelog

### v1.0

Initial release contains two basic functionalities:

<ul>
    <li> Record number of questions solved for users </li>
    <li> Generate weekly report. </li>
</ul>

### v2.0

We are now using discord.js v14 as we are migrating service from Heroku to Google Cloud Platform and Bit.io

## Creators

Yunding Wu <br>
Daizong (Colin) Wu <br>
