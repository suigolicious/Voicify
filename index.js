const Discord = require("discord.js");
const config = require("./config.json");
const rp = require('request-promise');
const $ = require('cheerio');
var schedule = require('node-schedule');
const qualityConvoUrl = 'https://conversationstartersworld.com/250-conversation-starters/';
const bot = new Discord.Client();
const sqlite3 = require('sqlite3').verbose();
let date_ob = new Date();
var db;

var fs = require("fs");

// shuffle function
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
}

// check text file or make new array
if(fs.existsSync("./array.txt")){
  var arrtext = fs.readFileSync("./array.txt", "utf-8").split("\n");
  var stringtext = arrtext[0]
  console.log(typeof stringtext)
  var arr = stringtext.split(",")
  console.log(stringtext)
}
else{
  var arr = [...Array(276).keys()];
  shuffle(arr);
}

schedule.scheduleJob('0 56 22 * * *', function() {
  rp(qualityConvoUrl).then(function(html){
    console.log('successfully retrieved html');
    bot.guilds.cache.forEach(function(guild) {
      console.log('entered guild');
      var channelId;
      var randomNum = arr[0] + 1;
      var string = String(html);
      var noHtml = string.replace(/(<([^>]+)>)/ig,'');
      var positionOfNum = noHtml.search(randomNum + '. ');
      for (var i = positionOfNum; i < html.length; i++) {
        if (noHtml[i] == '\n' && noHtml[i+1] == '\n') {
          var question;
          if (noHtml[positionOfNum+positionOfNum.toString().length-1].match(/[A-Z]/i)) {
            question = noHtml.substring(positionOfNum+positionOfNum.toString().length-1, i);
          } else {
            question = noHtml.substring(positionOfNum+positionOfNum.toString().length, i);
          } 
          question = question.replace(/\n/g, ' ');
          question = question.replace('&#8217;', '\'');
          guild.channels.cache.forEach(function(channel) {
            if (channel.type === 'text' && !channelId) {
              channelId = channel.id;
            }
          });
          // console.log(question);
          bot.channels.cache.get(channelId).send(question);
          break;
        }
      }   
    });
    // delete first element 
    arr.shift();
    console.log(arr)

    fs.writeFile( "./array.txt" ,arr.join().replace("[","").replace("]",""), function (err) {
      if (err) throw err;
      console.log('Replaced!');
    });
  })
  .catch(function(err){
    console.log(err);
  });
});

var sqlUpdate = `UPDATE GUILD SET text_channel = ?, voice_channel = ? WHERE id = ?`;

bot.login(config.BOT_TOKEN);

bot.on('ready', () => {
  db = new sqlite3.Database('./db/voicify.db');
});

bot.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.channel;
    let oldUserChannel = oldMember.channel;

    if(oldUserChannel === null && newUserChannel !== null) {
      db.all('SELECT voice_channel FROM GUILD WHERE id = ' + newMember.guild.id, function(err, rows) {
        if (!rows[0]) {
          return;
        }
        var importantVoiceChannel = rows[0].voice_channel;
        if (newMember.guild.channels.cache.get(importantVoiceChannel).members.size === 1 && 
          newMember.channelID == importantVoiceChannel) {
          db.all('SELECT text_channel FROM GUILD WHERE id = ' + newMember.guild.id, function(err, rows) {
            // bot.channels.cache.get(rows[0].text_channel).send('@everyone ' + newMember.member.displayName + ' has arrived');
            bot.channels.cache.get(rows[0].text_channel).send(newMember.member.displayName + ' has arrived');
          }); 
        }
      });
    }
}); 

bot.on('message', msg => {
  // stupid hard-coded stuff
  if (msg.content === 'linda') {
    msg.channel.send('is the best');
  } else if (msg.content === 'brandon') {
    msg.channel.send('is not the best')
  } else if (msg.content === 'sashank') {
    msg.channel.send('is stoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooopid')
  } else if (msg.content === 'shannon') {
    msg.channel.send('is a girl')
  } else if (msg.content === 'christian') {
    msg.channel.send('should stop gambling')
  } else if (msg.content === 'rupert') {
    msg.channel.send('is really really really really cool. (did the reallys convince you) no? yeah me neither.')
  } else if (msg.content === 'kevin') {
    msg.channel.send('is a living meme generator')
  } else if (msg.content === 'alex') {
    msg.channel.send('is a boy')
  } else if (msg.content === 'collin') {
    msg.channel.send('now has a message. congrats. does it feel nice? accomplished? satisfied??')
  }

  // user commands
  if (msg.content.split(' ')[0] === '!channelimportant') {   // !CHANNEL-IMPORTANT
    var parse = msg.content.replace('!channelimportant ', '');
    var guildId = msg.guild.id;
    var mainTextChannel = checkMainTextChannelCreated(msg);
    var importantVoiceChannel = findChannelId(msg, parse);
    db.run(`INSERT INTO GUILD(id,text_channel,voice_channel) VALUES(?,?,?)`, [guildId, mainTextChannel, importantVoiceChannel], function(err) {
      if (err) {
        db.run(sqlUpdate, [mainTextChannel, importantVoiceChannel, guildId], function(err) {
          if (err) {
            return console.error(err.message);
          }
          console.log(`Row(s) updated: ${this.changes}`);
        });
      }
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    msg.channel.send('important channel connected!');
  } else if (msg.content === '!deletechannelimportant') {           // VDELETE-CHANNEL-IMPORTANT
    db.run(`DELETE FROM GUILD WHERE id=?`, msg.guild.id, function(err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Row(s) deleted ${this.changes}`);
    });
    msg.channel.send('important channel connection deleted');
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