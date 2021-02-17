const Discord = require("discord.js");
const config = require("./config.json");
const bot = new Discord.Client();
var messageImportant = '@everyone i am important';
var messageWeewoo = 'I am litttttttteraly dying like you have to join me in my channel';
var importantTextChannel = '';
var importantVoiceChannel = '';
var weewooVoiceChannel = '';
var weewooTargetUsers = [];

bot.login(config.BOT_TOKEN);

bot.on('voiceStateUpdate', (oldMember, newMember) => {
    console.log('update');
    let newUserChannel = newMember.channel;
    let oldUserChannel = oldMember.channel;
    // console.log(newUserChannel);
    // console.log(oldUserChannel);
    if(oldUserChannel === null && newUserChannel !== null) {
      console.log(newMember.guild.channels.get(importantVoiceChannel).members.size);
      if (bot.channels.get(importantVoiceChannel).members.size === 1 && 
          newMember.guild.systemChannelID === importantVoiceChannel) {
        if (importantTextChannel !== '') { 
          console.log('here!!!')
          bot.channels.cache.get(importantTextChannel).send(messageImportant);
        }
      } else if (newMember.id === weewooVoiceChannel) {
        //dm
      }
    }
}); 

bot.on('message', msg => {
    if (msg.content === 'send') {
      
    }
    // stupid hard-coded stuff
    if (msg.content === 'linda') {
      msg.channel.send('is the best');
    } else if (msg.content === 'brandon') {
      msg.channel.send('is a poopy butt')
    } else if (msg.content === 'sashank') {
      msg.channel.send('is stoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooopid')
    } else if (msg.content === 'shannon') {
      msg.channel.send('is a girl')
    } else if (msg.content === 'christian') {
      msg.channel.send('should stop gambling')
    }
  
    // user commands
    if (msg.content.split(' ')[0] === 'vmessageimportant') {          // MESSAGE-IMPORTANT
      var parse = msg.content.replace('vmessageimportant ', '');
      messageImportant = '@everyone ' + parse;
      msg.channel.send('important message created!')
    } else if (msg.content.split(' ')[0] === 'vchannelimportant') {   // VCHANNEL-IMPORTANT
      var parse = msg.content.replace('vchannelimportant ', '');
      var parseArr = parse.split(' ');
      importantVoiceChannel = findChannelId(msg, parseArr[0]);
      importantTextChannel = findChannelId(msg, parseArr[1]);
      msg.channel.send('important channels created!');
    } else if (msg.content === 'vdeletechannelimportant') {           // VDELETE-CHANNEL-IMPORTANT
      importantVoiceChannel = '';
      importantTextChannel = '';
      msg.channel.send('important channel connections deleted');
    } else if (msg.content.split(' ')[0] === 'vmessageweewoo') {      // VMESSAGE-WEE-WOO
      var parse = msg.content.replace('vmessageweewoo ', '');
      messageWeewoo = parse;
      msg.channel.send('life or death dm created');
    } else if (msg.content.split(' ')[0] === 'vsetupweewoo') {        // VSETUP-WEE-WOO
      var parse = msg.content.replace('vchannelweewoo ', '');
      var parseArr = parse.split(' ');
      weewooVoiceChannel = parseArr[0];
      parseArr.shift();
      weewooTargetUsers = parseArr;
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
  
  function findUserId(tag) {
  
  }