<h1 style="text-align:center">Shuati Bot</h1>

## Deploy Command

In order to deploy on Google Cloud Platform, run following commands when logging in:

```
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

To build and run Shuati Bot, run following commands:

```
git pull origin main
npm install
node deploy-commands.js
pm2 start index.js -o logs/log-info -e logs/log-err
```

To create the local postgres database, run following commands

```
sudo apt install postgresql
sudo systemctl status postgresql
sudo systemctl enable postgresql
sudo -i -u postgres
psql
\password {your password}
\q
```

## Database Scripts

Currently the postgres database only has one table `user-record`. To create this table, run this script:

```
create table user_record (
  id serial primary key,
  user_id varchar(100) not null,
  username varchar(100) not null,
  num_probs int not null,
  timestamp timestamp not null default now()
);
```

## Changelog

### v2.0.5
As bit.io has been shut down, now the service is storing data in its local postgres database.

### v2.0

We are now using discord.js v14 as we are migrating service from Heroku to Google Cloud Platform

### v1.0

Initial release contains two basic functionalities:

<ul>
    <li> Record number of questions solved for users </li>
    <li> Generate weekly report. </li>
</ul>

## Creators

Yunding Wu <br>
Daizong (Colin) Wu <br>
