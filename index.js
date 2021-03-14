const Discord = require("discord.js");
const config = require("./config.json");
const rp = require('request-promise');
const $ = require('cheerio');
var schedule = require('node-schedule');
const qualityConvoUrl = 'https://conversationstartersworld.com/250-conversation-starters/';
const bot = new Discord.Client();
const sqlite3 = require('sqlite3').verbose();
var db;
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function getQuestion(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  var date1 = new Date("03/10/2021"); 
  var date2 = new Date(); 
    
  // To calculate the time difference of two dates 
  var Difference_In_Time = date2.getTime() - date1.getTime(); 
    
  // To calculate the no. of days between two dates 
  var Difference_In_Days = Math.floor(Difference_In_Time / (1000 * 3600 * 24))+2; 
      
  sheets.spreadsheets.values.get({
    spreadsheetId: '1syTZAaECyN3LYQr1BLmsxhODqN91l79_DzVR4iuJWAE',
    range: 'B' + Difference_In_Days,
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.map((row) => {
        var questionOfTheDay = `${row[0]}`.replace('\n', '');

        bot.guilds.cache.forEach(function(guild) {
          console.log('entered guild');
          db.all('SELECT daily_question FROM guilds WHERE guild_id = ' + guild.id, function(err, rows) {
            if (rows[0] && rows[0].daily_question === 1) {
              var channelId;
              guild.channels.cache.forEach(function(channel) {
                if (channel.type === 'text' && !channelId) {
                  channelId = channel.id;
                }
              });
              // console.log(question);
              bot.channels.cache.get(channelId).send(questionOfTheDay);
            }
          })
        })
      });
    } else {
      console.log('No data found.');
    }
  });
}

schedule.scheduleJob('0 0 10 * * *', function() {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), getQuestion);
  });
});

bot.login(config.BOT_TOKEN);

bot.on('guildCreate', guild => {
  // on entering new guild, add guildID and row into the database
  db.run(`INSERT INTO guilds(guild_id,text_channel,voice_channel,daily_question) VALUES(?,?,?,?)`, [String(guild.id), 0, 0, 0], function(err) {
    if (err) {
      console.log(err);
      console.log('guild probably aleady in database');
      return;
    }
    console.log('new guild data created');
  })
});

bot.on('guildDelete', guild => {
  db.run(`DELETE FROM guilds WHERE guild_id=?`, guild.id, function(err) {
    if (err) console.log(err);
  });
  console.log('Left guild with id ' + guild.id); 
});

bot.on('ready', () => {
  // initiate database
  db = new sqlite3.Database('./db/stayinAlive');
});

bot.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.channel;
    let oldUserChannel = oldMember.channel;

    // check if user is ENTERING voice channel
    if(oldUserChannel === null && newUserChannel !== null) {
      // find the voice channel user has tied in with the alert
      db.all('SELECT voice_channel FROM guilds WHERE guild_id = ' + newMember.guild.id, function(err, rows) {
        // if user has not tied in any channel yet, return
        if (!rows[0]) {
          return;
        }
        var importantVoiceChannel = rows[0].voice_channel;

        // only alert in text channel if first person that entered voice channel
        if ((newMember.guild.channels.cache.get(importantVoiceChannel) && newMember.guild.channels.cache.get(importantVoiceChannel).members.size === 1)
          && newMember.channelID == importantVoiceChannel) {
          // grab text channel id from database
          db.all('SELECT text_channel FROM guilds WHERE guild_id = ' + String(newMember.guild.id), function(err, rows) {
            bot.channels.cache.get(rows[0].text_channel).send(newMember.member.displayName + ' has arrived');
          }); 
        }
      })
    }
}); 

bot.on('message', msg => {
  // user commands
  if (msg.content.split(' ')[0] === '!channel') {   // !CHANNEL-IMPORTANT
    var parse = msg.content.replace('!channel ', '');
    var guildId = msg.guild.id;
    var mainTextChannel = checkMainTextChannelCreated(msg);
    var importantVoiceChannel = findChannelId(msg, parse);
    db.run(`UPDATE guilds SET text_channel = ?, voice_channel = ? WHERE guild_id = ?`, [String(mainTextChannel), String(importantVoiceChannel), String(guildId)], function(err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Row(s) updated: ${this.changes}`);
    });
    msg.channel.send('Channel connected!');
  } else if (msg.content === '!delete-channel') {           // VDELETE-CHANNEL-IMPORTANT
    var guildId = msg.guild.id;
    db.run(`UPDATE guilds SET text_channel = ?, voice_channel = ? WHERE guild_id = ?`, ['0', '0', String(guildId)], function(err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Row(s) deleted: ${this.changes}`);
    });
    msg.channel.send('Channel disconnected...');
  } else if (msg.content === '!start-questions') {
    var guildId = msg.guild.id;
    db.run(`UPDATE guilds SET daily_question = ? WHERE guild_id = ?`, [1, String(guildId)], function(err) {
      if (err) {
        console.error(err.message);
      }
    });
    msg.channel.send('Started one question a day every 10:00AM');
  } else if(msg.content === '!stop-questions') {
    var guildId = msg.guild.id;
    db.run(`UPDATE guilds SET daily_question = ? WHERE guild_id = ?`, [0, String(guildId)], function(err) {
      if (err) {
        console.error(err.message);
      }
    });
    msg.channel.send('Stopped daily questions');
  } 
});
  
function findChannelId(msg, tag) {
  var id = '';
  msg.guild.channels.cache.forEach(function (channel) {
    if (channel.name === tag) {
      id = channel.id;
    }
  });
  return id;
}
  
function checkMainTextChannelCreated(msg) {
  var mainTextChannel;
  var foundMatch = false
  msg.guild.channels.cache.forEach(function(channel) {
    if (channel.type === 'text' && !foundMatch) {
      mainTextChannel = channel.id;
      foundMatch = true;
    }
  });
  return mainTextChannel;
}