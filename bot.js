const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const rarityBaseCosts = {
  Common: 100,
  Uncommon: 110,
  Rare: 120,
  Epic: 130,
  Legendary: 140,
  Mythical: 200,
};

const dungeons = {
  "Pirate Cove": {
    "Normal": 400,
    "Advanced": 2750,
    "Expert": 7500,
    "image": 'https://static.wikia.nocookie.net/crusadersroblox/images/a/a0/Pirate_Cove.png/revision/latest?cb=20250304151712'
  },
  "Sunken Ruins": {
    "Normal": 25000,
    "Advanced": 60000,
    "Expert": 90000,
    "image": 'https://static.wikia.nocookie.net/crusadersroblox/images/1/13/Sunken_Ruins.png/revision/latest?cb=20250304151817&format=original'
  }
};

function xpNeeded(level) {
  let v1 = 1 + level / 500;
  let v2 = 20 + level / 10;
  return Math.floor(Math.pow((v2 * Math.pow(level + 1, v1) * (level + 1)) - (v2 * (level + 1)), v1));
}

function calculateUpgradeChance(upgrade) {
  if (upgrade == 0) return 0.98;
  if (upgrade == 1) return 0.95;
  if (upgrade >= 2 && upgrade <= 19) return 1 - (upgrade - 1) * 0.05;
  if (upgrade == 20) return 0.08;
  if (upgrade == 21) return 0.07;
  if (upgrade == 22) return 0.05;
  return 1;
}

function calculateGoldCost(currUpgrade, finalUpgrade, rarity, itemLevel) {
  let baseCost = rarityBaseCosts[rarity];
  let totalGold = 0;

  for (let i = currUpgrade; i < finalUpgrade; i++) {
    let chance = calculateUpgradeChance(i);
    let attemptCost = Math.floor(baseCost * (itemLevel + i) * 0.9);
    let averageAttempts = Math.ceil(1 / chance);
    totalGold += attemptCost * averageAttempts;
  }
  return totalGold;
}

client.once('ready', async () => {
  console.log('Bot is online!');

  await client.application.commands.set([
    new SlashCommandBuilder()
      .setName('calc-pot')
      .setDescription('Calculates the max potential and average gold cost')
      .addNumberOption(option =>
        option.setName('base-stat').setDescription('Base stat value').setRequired(true))
      .addNumberOption(option =>
        option.setName('upgrade').setDescription('Final upgrade level').setRequired(true))
      .addNumberOption(option =>
        option.setName('curr-upgrade').setDescription('Current upgrade level').setRequired(true))
      .addStringOption(option =>
        option.setName('rarity').setDescription('Item rarity').setRequired(true)
          .addChoices(
            { name: 'Common', value: 'Common' },
            { name: 'Uncommon', value: 'Uncommon' },
            { name: 'Rare', value: 'Rare' },
            { name: 'Epic', value: 'Epic' },
            { name: 'Legendary', value: 'Legendary' },
            { name: 'Mythical', value: 'Mythical' }
          ))
      .addNumberOption(option =>
        option.setName('item-level').setDescription('Item level').setRequired(true)),

    new SlashCommandBuilder()
      .setName('calc-runs')
      .setDescription('Calculates dungeon runs needed')
      .addNumberOption(option =>
        option.setName('current-level').setDescription('Your current level').setRequired(true))
      .addNumberOption(option =>
        option.setName('goal-level').setDescription('Your goal level').setRequired(true))
      .addStringOption(option =>
        option.setName('dungeon').setDescription('Select a dungeon').setRequired(true)
          .addChoices(
            { name: 'Pirate Cove', value: 'Pirate Cove' },
            { name: 'Sunken Ruins', value: 'Sunken Ruins' }
          ))
      .addStringOption(option =>
        option.setName('modifier').setDescription('Modifier').setRequired(false)
          .addChoices(
            { name: 'None', value: '0' },
            { name: 'Nightmare', value: '0.5' },
            { name: 'Chaotic', value: '1' },
            { name: 'Impossible', value: '4' }
          ))
      .addBooleanOption(option =>
        option.setName('vip').setDescription('VIP Bonus').setRequired(false))
      .addBooleanOption(option =>
        option.setName('xp-potion').setDescription('XP Potion').setRequired(false))
      .addBooleanOption(option =>
        option.setName('weekend-boost').setDescription('Weekend XP Boost (50%)').setRequired(false))
      .addNumberOption(option =>
        option.setName('curr-xp').setDescription('Current XP').setRequired(false))
      .addNumberOption(option =>
        option.setName('time-per-run').setDescription('Time per run IN SECONDS').setRequired(false)),

    new SlashCommandBuilder()
      .setName('find-basestat')
      .setDescription('Finds the base stat before upgrades')
      .addNumberOption(option =>
        option.setName('curr-stat').setDescription('Current stat value').setRequired(true))
      .addNumberOption(option =>
        option.setName('curr-upg').setDescription('Current upgrade level').setRequired(true)),
  ]);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'calc-pot') {
    const baseStat = interaction.options.getNumber('base-stat');
    const upgrade = interaction.options.getNumber('upgrade');
    const currUpgrade = interaction.options.getNumber('curr-upgrade');
    const rarity = interaction.options.getString('rarity');
    const itemLevel = interaction.options.getNumber('item-level');

    const result = Math.floor(upgrade + baseStat + (baseStat * (upgrade * 0.02)));
    const goldCost = calculateGoldCost(currUpgrade, upgrade, rarity, itemLevel);

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png')
      .setTitle('🌟 Potential Calculator 🌟')
      .addFields(
        { name: '⚔️ Potential ⚔️', value: `**${result}**`, inline: false },
        { name: '💰 Average Gold Cost 💰', value: `**${goldCost.toLocaleString()}**`, inline: false }
      )
      .setTimestamp();

    await interaction.reply({ content: `Hey <@${interaction.user.id}>`, embeds: [embed] });
  }

  if (commandName === 'find-basestat') {
    const currStat = interaction.options.getNumber('curr-stat');
    const currUpg = interaction.options.getNumber('curr-upg');

    const baseStat = Math.floor((currStat - currUpg) / (1 + (currUpg * 0.02)));

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Base Stat Calculator')
      .setDescription(`With **${currStat}** current stat and **${currUpg}** upgrades, the base stat is **${baseStat}**.`)
      .setTimestamp();

    await interaction.reply({ content: `Hey <@${interaction.user.id}>`, embeds: [embed] });
  }

if (commandName === 'calc-runs') {
    const currentLevel = interaction.options.getNumber('current-level');
    const goalLevel = interaction.options.getNumber('goal-level');
    const dungeon = interaction.options.getString('dungeon');
    const vip = interaction.options.getBoolean('vip') || false;
    const potion = interaction.options.getBoolean('xp-potion') || false;
    const weekendBoost = interaction.options.getBoolean('weekend-boost') || false; 
    const currXP = interaction.options.getNumber('curr-xp') || 0; 
    const time = interaction.options.getNumber('time-per-run'); 

    const modifierValue = interaction.options.getString('modifier') || '0';
    const modifierMap = {
      "0": "no modifier",
      "0.5": "Nightmare",
      "1": "Chaotic",
      "4": "Impossible"
    };
    const modifierName = modifierMap[modifierValue];

    let totalXP = 0;
    for (let i = currentLevel; i < goalLevel; i++) {
      totalXP += xpNeeded(i);
    }

    totalXP -= currXP; // Subtract current XP

    let modifierText = modifierName !== 'None' ? modifierName : '';
    if (vip) modifierText += modifierText ? `, VIP` : 'VIP';
    if (potion) modifierText += modifierText ? `, 2x XP Potion` : '2x XP Potion';
    if (weekendBoost) modifierText += modifierText ? `, Weekend Boost` : 'Weekend Boost';

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png')
      .setTitle(`To go from lvl ${currentLevel} to lvl ${goalLevel} you need **${totalXP.toLocaleString()} XP**`)
      .setDescription(`In **${dungeon}** with **${modifierText}**, you need to do:`)
      .setTimestamp();

    Object.keys(dungeons[dungeon]).filter(d => d !== 'image').forEach(difficulty => {
      let baseXP = dungeons[dungeon][difficulty];
      let totalBuff = 0;
      if (vip) totalBuff += 20;
      if (potion) totalBuff += 100;
      if (weekendBoost) totalBuff += 50;

      let finalXP = Math.floor((baseXP * (1 + totalBuff / 100)) * (1 + parseFloat(modifierValue)));

      let runs = Math.ceil(totalXP / finalXP);
      
      let fieldValue = `**${runs}** Runs`;

      if (time !== null) { 
          let totalTime = runs * (time + 15);
          let hours = Math.floor(totalTime / 3600);
          let minutes = Math.floor((totalTime % 3600) / 60);
          let seconds = totalTime % 60;

          let timeText = '';
          if (hours > 0) timeText += `${hours} hour${hours > 1 ? 's' : ''}`;
          if (minutes > 0) timeText += `${timeText ? ' & ' : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;
          if (seconds > 0 && timeText === '') timeText += `${seconds} second${seconds > 1 ? 's' : ''}`;
          
          fieldValue += `\n\nTime Needed:\n${timeText}`;
        
      }

      embed.addFields({
        name: `${difficulty}`,
        value: fieldValue,
        inline: true
      });
    });

    embed.setImage(dungeons[dungeon].image);
    
    await interaction.reply({ content: `Hey <@${interaction.user.id}>`, embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
