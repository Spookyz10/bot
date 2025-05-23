const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const skills = {
    "Meteor Strike": { baseDmg: 200, pct: 700, cooldown: 7, ticks: 1 },
    "Tornado": { baseDmg: 80, pct: 120, cooldown: 9, ticks: 7 },
    "Heal Pulse": { baseDmg: 0, pct: 0, cooldown: 0, ticks: 0 },
    "Geyser Blast": { baseDmg: 50, pct: 120, cooldown: 6, ticks: 7 },
    "Wind Slash": { baseDmg: 55, pct: 170, cooldown: 5, ticks: 3 },
    "Rush": { baseDmg: 390, pct: 700, cooldown: 6, ticks: 1 },
    "Vortex Slash": { baseDmg: 50, pct: 170, cooldown: 5, ticks: 2 },
    "Magician's Bubble": { baseDmg: 0, pct: 0, cooldown: 0, ticks: 0 },
    "Stone Breaker": { baseDmg: 3, pct: 80, cooldown: 5, ticks: 2 },
    "Fireball": { baseDmg: 15, pct: 93, cooldown: 5, ticks: 1 },
    "Firebolt": { baseDmg: 10, pct: 75, cooldown: 5, ticks: 1 },
    "Piercing Strike": { baseDmg: 10, pct: 160, cooldown: 5, ticks: 1 },
    "Stomp": { baseDmg: 8, pct: 90, cooldown: 4, ticks: 1 },
    "Lightning Strike": { baseDmg: 10, pct: 170, cooldown: 6, ticks: 1 },
    "Whirlwind": { baseDmg: 4, pct: 101, cooldown: 7.4, ticks: 6 },
    "False Slash": { baseDmg: 10, pct: 160, cooldown: 5, ticks: 1 },
    "Fireball Ride": { baseDmg: 18, pct: 124, cooldown: 8, ticks: 1 },
    "Anchor Smash": { baseDmg: 20, pct: 250, cooldown: 6, ticks: 1 },
    "Cannon Monkey": { baseDmg: 45, pct: 110, cooldown: 12, ticks: 10 },
    "Taunt": { baseDmg: 0, pct: 0, cooldown: 0, ticks: 0 },
};

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
      .setName('calc-runeXP')
      .setDescription('Calculates dungeon runs needed to max a rune')
      .addNumberOption(option =>
        option.setName('rune-level').setDescription('Your runes current level').setRequired(true))
      .addNumberOption(option =>
        option.setName('goal-level').setDescription('Your runes goal level').setRequired(true))
      .addStringOption(option =>
        option.setName('modifier').setDescription('Modifier').setRequired(true)
          .addChoices(
            { name: 'None', value: '25' },
            { name: 'Nightmare', value: '33' },
            { name: 'Chaotic', value: '50' },
            { name: 'Impossible', value: '66' }
          ))
      .addNumberOption(option =>
        option.setName('curr-xp').setDescription('Current rune XP').setRequired(false))
      .addNumberOption(option =>
        option.setName('time-per-run').setDescription('Time per run IN SECONDS').setRequired(false)),
        
    new SlashCommandBuilder()
      .setName('calc-skilldmg')
      .setDescription('Calculates skill damage')
      .addNumberOption(option =>
        option.setName('base-stat').setDescription('Your magical/physical stat').setRequired(true))
      .addStringOption(option =>
        option.setName('skill').setDescription('Select a skill').setRequired(true)
          .addChoices(...Object.keys(skills).map(skill => ({ name: skill, value: skill }))))
      .addNumberOption(option =>
        option.setName('crit-damage').setDescription('Critical Damage %').setRequired(true))
      .addNumberOption(option =>
        option.setName('crit-chance').setDescription('Critical Chance %').setRequired(true))
      .addNumberOption(option =>
        option.setName('boss-slayer').setDescription('Boss Slayer %').setRequired(false))
      .addNumberOption(option =>
        option.setName('crowd-control').setDescription('Crowd Control %').setRequired(false)),
      

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

    new SlashCommandBuilder()
      .setName('calc-floor')
      .setDescription('Calculates the max floor you can reach in the Boss Rush')
      .addNumberOption(option =>
        option.setName('base-damage').setDescription('Your magical/physical stat').setRequired(true))
      .addNumberOption(option =>
        option.setName('boss-slayer').setDescription('% of your boss slayer trait').setRequired(true))
      .addNumberOption(option =>
        option.setName('crit-chance').setDescription('% Critical Hit Chance').setRequired(true))
      .addNumberOption(option =>
        option.setName('crit-damage').setDescription('% Critical Hit Damage').setRequired(true))
      .addStringOption(option =>
        option.setName('skill1').setDescription('Your first skill').setRequired(true)
          .addChoices(...Object.keys(skills).map(skill => ({ name: skill, value: skill }))))
      .addStringOption(option =>
        option.setName('skill2').setDescription('Your second skill').setRequired(true)
          .addChoices(...Object.keys(skills).map(skill => ({ name: skill, value: skill }))))
      .addStringOption(option =>
        option.setName('skill3').setDescription('Your third skill').setRequired(true)
          .addChoices(...Object.keys(skills).map(skill => ({ name: skill, value: skill })))),

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

  if (commandName === 'calc-skilldmg') {
    const baseStat = interaction.options.getNumber('base-stat');
    const skillName = interaction.options.getString('skill');
    const critChance = interaction.options.getNumber('crit-chance');
    const critDamage = interaction.options.getNumber('crit-damage');
    const bossSlayer = interaction.options.getNumber('boss-slayer') || 0;
    const crowdControl = interaction.options.getNumber('crowd-control') || 0;

    if (!skills[skillName]) {
        return interaction.reply({ content: 'Invalid skill!', ephemeral: true });
    }

    const skill = skills[skillName];
    const ticks = skill.ticks || 1;

    let totalNormalDamage = 0;
    let totalCriticalDamage = 0;
    let totalAvgCriticalDamage = 0;
    let totalBossDamage = 0;
    let totalBossCriticalDamage = 0;
    let totalBossAvgCriticalDamage = 0;
    let totalCrowdDamage = 0;
    let totalCrowdCriticalDamage = 0;
    let totalCrowdAvgCriticalDamage = 0;

    for (let i = 0; i < ticks; i++) {
        let tickDamage = Math.floor(skill.baseDmg + (baseStat * (skill.pct / 100)));
        let critTickDamage = Math.floor(tickDamage + (tickDamage * (critDamage / 100)));
        
        totalNormalDamage += Math.floor(tickDamage);
        totalCriticalDamage += Math.floor(critTickDamage);
        
        if (Math.random() * 100 < critChance) {
            totalAvgCriticalDamage += Math.floor(critTickDamage);
        } else {
            totalAvgCriticalDamage += Math.floor(tickDamage);
        }
        
        let bossTickDamage = Math.floor(tickDamage + (tickDamage * (bossSlayer / 100)));
        let bossCritTickDamage = Math.floor(bossTickDamage + (bossTickDamage * (critDamage / 100)));
        
        totalBossDamage += Math.floor(bossTickDamage);
        totalBossCriticalDamage += Math.floor(bossCritTickDamage);
        
        if (Math.random() * 100 < critChance) {
            totalBossAvgCriticalDamage += Math.floor(bossCritTickDamage);
        } else {
            totalBossAvgCriticalDamage += Math.floor(bossTickDamage);
        }
        
        let crowdTickDamage = Math.floor(tickDamage + (tickDamage * (crowdControl / 100)));
        let crowdCritTickDamage = Math.floor(crowdTickDamage + (crowdTickDamage * (critDamage / 100)));
        
        totalCrowdDamage += Math.floor(crowdTickDamage);
        totalCrowdCriticalDamage += Math.floor(crowdCritTickDamage);
        
        if (Math.random() * 100 < critChance) {
            totalCrowdAvgCriticalDamage += Math.floor(crowdCritTickDamage);
        } else {
            totalCrowdAvgCriticalDamage += Math.floor(crowdTickDamage);
        }
    }

    const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle(`⚔️ ${skillName} Damage Calculation ⚔️`)
        .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png')
        .addFields(
            { name: '🔸 No Criticals', value: `**${totalNormalDamage}**`, inline: true },
            { name: '🔸 Full Criticals', value: `**${totalCriticalDamage}**`, inline: true }
        );

    if (ticks >= 2) {
        embed.addFields({ name: `🔸 Avg Criticals (${critChance}% Chance)`, value: `**${totalAvgCriticalDamage}**`, inline: true });
    }

    if (bossSlayer) {
        embed.addFields(
            { name: '👹 Damage vs Bosses (No Crits)', value: `**${totalBossDamage}**`, inline: true },
            { name: '👹 Damage vs Bosses (Full Crits)', value: `**${totalBossCriticalDamage}**`, inline: true }
        );
        if (ticks >= 2) {
            embed.addFields({ name: '👹 Damage vs Bosses (Avg Crits)', value: `**${totalBossAvgCriticalDamage}**`, inline: true });
        }
    }

    if (crowdControl) {
        embed.addFields(
            { name: '👾 Damage vs Mobs (No Crits)', value: `**${totalCrowdDamage}**`, inline: true },
            { name: '👾 Damage vs Mobs (Full Crits)', value: `**${totalCrowdCriticalDamage}**`, inline: true }
        );
        if (ticks >= 2) {
            embed.addFields({ name: '👾 Damage vs Mobs (Avg Crits)', value: `**${totalCrowdAvgCriticalDamage}**`, inline: true });
        }
    }

    embed.setTimestamp();

    await interaction.reply({ content: `Hey <@${interaction.user.id}>! Make sure you put your stats based on the player card!`, embeds: [embed] });
    }


  if (commandName === 'find-basestat') {
    const currStat = interaction.options.getNumber('curr-stat');
    const currUpg = interaction.options.getNumber('curr-upg');

    const baseStat = Math.floor((currStat - currUpg) / (1 + (currUpg * 0.02)));

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Base Stat Calculator')
      .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png')
      .setDescription(`With **${currStat}** current stat and **${currUpg}** upgrades, the base stat is **${baseStat}**.`)
      .setTimestamp();

    await interaction.reply({ content: `Hey <@${interaction.user.id}>`, embeds: [embed] });
  }

if (commandName === 'calc-floor') {
  const baseDamage = interaction.options.getNumber('base-damage');
  const bossSlayer = interaction.options.getNumber('boss-slayer') || 0;
  const critChance = interaction.options.getNumber('crit-chance');
  const critDamage = interaction.options.getNumber('crit-damage');
  const skill1 = interaction.options.getString('skill1');
  const skill2 = interaction.options.getString('skill2');
  const skill3 = interaction.options.getString('skill3');

  function calculateDamage(base, skill) {
    let skillData = skills[skill];  
    let total = 0;

    if (skillData.ticks === 0) return 0;

    for (let i = 0; i < skillData.ticks; i++) {
        let tickDamage = skillData.baseDmg + (base * (skillData.pct / 100));
        tickDamage += tickDamage * (bossSlayer / 100);
        if (Math.random() * 100 < critChance) {
            tickDamage += tickDamage * (critDamage / 100);
        }
        total += tickDamage;
    }
    return total;
}

  let floor = 1;
  let bossHP = 55000; // Floor 1 Boss HP
  const maxTime = 5 * 60; // 5 minutes in seconds
  const attackSpeed = 0.5; // Player attacks every 0.5 seconds

  while (true) {
    let baseAttackDmg = baseDamage + (baseDamage * (bossSlayer / 100));

    if (Math.random() * 100 < critChance) {
      baseAttackDmg += baseAttackDmg * (critDamage / 100);
    }

    let skill1Total = calculateDamage(baseDamage, skill1);
    let skill2Total = calculateDamage(baseDamage, skill2);
    let skill3Total = calculateDamage(baseDamage, skill3);

    let totalDmg = 0;
    for (let t = 0; t < maxTime; t += attackSpeed) {
      totalDmg += baseAttackDmg;
      if (t % skills[skill1].cooldown === 0) totalDmg += skill1Total;
      if (t % skills[skill2].cooldown === 0) totalDmg += skill2Total;
      if (t % skills[skill3].cooldown === 0) totalDmg += skill3Total;
    }

    if (totalDmg < bossHP) {
      break;
    }

    floor++;
    bossHP += bossHP * ((floor % 20 === 0) ? 0.21 : 0.10);
  }

  const embed = new EmbedBuilder()
    .setColor('Red')
    .setTitle('🏰 Maximum Floor Calculator 🏰')
    .setDescription(`On AVERAGE you can reach up to **Floor ${floor - 1}** in the Boss Rush!`)
    .setImage('https://static.wikia.nocookie.net/crusadersroblox/images/2/2b/Boss_Rush.png/revision/latest?cb=20250312123000')
    .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png')
    .addFields(
      { name: 'Base Damage', value: `${baseDamage}`, inline: true },
      { name: 'Boss Slayer Bonus', value: `${bossSlayer}%`, inline: true },
      { name: 'Critical Chance', value: `${critChance}%`, inline: true },
      { name: 'Critical Damage', value: `${critDamage}%`, inline: true },
      { name: '🌀 Selected Skills', value: `1️⃣ ${skill1}\n2️⃣ ${skill2}\n3️⃣ ${skill3}`, inline: false }
    )
    .setTimestamp();

  await interaction.reply({ content: `Hey <@${interaction.user.id}>! Make sure you put your stats based on the player card!`, embeds: [embed] });
}

if (commandName === 'calc-runeXP') {
  const currentLevel = interaction.options.getNumber('rune-level');
    const goalLevel = interaction.options.getNumber('goal-level');
    const currXP = interaction.options.getNumber('curr-xp') || 0; 
    const time = interaction.options.getNumber('time-per-run'); 

    const modifierValue = interaction.options.getString('modifier') || '0';
    const modifierMap = {
      "25": "No",
      "33": "Nightmare",
      "50": "Chaotic",
      "66": "Impossible"
    };
    const modifierName = modifierMap[modifierValue];
   
  const XPNeeded = (goalLevel - currentLevel) * 100 - currXP
  
  const runsNeeded =  Math.ceil(XPNeeded / parseFloat(modifierValue))
  
  if (time !== null) { 
          let totalTime = runsNeeded * (time + 15);
          let hours = Math.floor(totalTime / 3600);
          let minutes = Math.floor((totalTime % 3600) / 60);
          let seconds = totalTime % 60;

          let timeText = '';
          if (hours > 0) timeText += `${hours} hour${hours > 1 ? 's' : ''}`;
          if (minutes > 0) timeText += `${timeText ? ' & ' : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;
          if (seconds > 0 && timeText === '') timeText += `${seconds} second${seconds > 1 ? 's' : ''}`;
          
          let fieldValue = `\n\n**Time Needed:**\n${timeText}`;
        
      }

if (goalLevel <= currentLevel) {
  return interaction.reply({ content: "Goal level must be higher than current level.", ephemeral: true });
}

  const embed = new EmbedBuilder()
    .setColor('Purple')
    .setTitle('🔮 Rune XP Calculator 🔮')
    .setDescription(`To go from ${goalLevel} from ${currentLevel} with ${modifierName} Modifier you need to complete ${runsNeeded} runs!`)
    .setImage('https://static.wikia.nocookie.net/crusadersroblox/images/2/2b/Boss_Rush.png/revision/latest?cb=20250312123000')
    .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png')
    .addFields({
        name: `Name test`,
        value: fieldValue,
        inline: true
      });
    .setTimestamp();

  await interaction.reply({ content: `Hey <@${interaction.user.id}>!`, embeds: [embed] });
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
          
          fieldValue += `\n\n**Time Needed:**\n${timeText}`;
        
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

const fs = require('fs'); 
const cooldowns = new Map();

function loadCodes() {
    try {
        const data = fs.readFileSync("codes.json"); 
        return JSON.parse(data).codes; 
    } catch (error) {
        console.error("Error reading codes.json:", error);
        return []; 
    }
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const activeCodes = loadCodes();

    // Define valid triggers (lowercase, no punctuation required)
    const codeQueries = [
        "what are the codes", "!codes", "got any codes", "what are the codes", "!code"
    ];

    const lowerMsg = message.content.toLowerCase();

    // If any query matches
    if (codeQueries.some(q => lowerMsg.includes(q))) {
        const userId = message.author.id;
        const now = Date.now();
        const cooldown = 30 * 1000;

        if (cooldowns.has(userId) && now - cooldowns.get(userId) < cooldown) {
            return;
        }

        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), 30 * 1000);

        const codesText = activeCodes.length > 0 ? activeCodes.join("\n") : "No active codes right now.";
        let response = `<@${userId}>, the current active codes are:\n\`\`\`\n${codesText}\n\`\`\``;

        await message.channel.send(response);
    }
});

const eightBallResponses = [
    "Without a doubt.",
    "Yes, but only if you truly believe.",
    "The answer lies within you.",
    "Absolutely — if the stars align.",
    "Not today, but soon.",
    "Unclear. Ask again with purpose.",
    "Only if you're willing to risk it.",
    "I wouldn’t count on it.",
    "Yes, and the universe agrees.",
    "Doubtful, but miracles happen.",
    "In time, all will be revealed.",
    "No — but what if you made it a yes?",
    "You're not ready for that answer.",
    "Possibly, if fate allows.",
    "It's looking very likely.",
    "Too close to call — try again later.",
    "The signs point to yes.",
    "Something tells me... no.",
    "It depends on how you ask.",
    "Only when the moment is right.",
    "Yes — but don’t tell anyone.",
    "No — and that's probably for the best.",
    "A strong maybe.",
    "Focus and ask again.",
    "That's a secret between you and destiny.",
    "Hold up let me ask Froggyz................. he said 'YEAH MAN!!!!!!!!!!'",
    "Hold up let me ask Froggyz................. he said 'go to a mental asylum man.'"
];


const cooldown1 = new Set();

const battleCooldown = new Set();
const userBattleOutcomes = [
    "{winner} dropkicked {loser} into the Shadow Realm.",
    "{loser} tried to fight back, but accidentally muted themselves. {winner} wins!",
    "{winner} threw a banana peel. {loser} slipped and faceplanted.",
    "{loser} challenged {winner} to a dance-off. Bad idea.",
    "{winner} won using pure sarcasm. {loser} couldn’t cope.",
    "{loser} brought a spoon to a sword fight. {winner} wins by default.",
    "It was close, but {winner} yelled louder. {loser} gave up.",
    "{loser} tripped while typing `/battle`. {winner} seizes victory.",
    "{winner} posted a cringe meme. {loser} self-destructed.",
    "{loser} said 'ez'. The gods smited them. {winner} wins.",
    "{winner} won after {loser} got distracted watching anime.",
    "{loser} got ratio’d mid-battle. {winner} wins."
];

const battleVsRoleWin = [
    "{winner} just soloed {role}! Absolute legend.",
    "{winner} took on {role}... and won without breaking a sweat.",
    "{role} stood no chance. {winner} walks away victorious.",
    "Against all odds, {winner} obliterated {role}.",
    "{winner} clapped the entirety of {role}. No survivors."
];

const battleVsRoleLose = [
    "{winner} tried to fight {role}... they lasted 2 seconds.",
    "{role} obliterated {winner} in record time.",
    "{winner} picked a fight with {role}. Bad move.",
    "{role} didn’t even flinch. {winner} got steamrolled.",
    "Legend says {winner} is still recovering from challenging {role}."
];

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;

    // --- 8BALL ---
    if (message.content.startsWith('!8ball')) {
        if (cooldown1.has(userId)) {
            const sent = await message.reply("⏳ You're on cooldown! Please wait a few seconds.");
            setTimeout(() => {
                message.delete().catch(() => {});
                sent.delete().catch(() => {});
            }, 3000);
            return;
        }

        const question = message.content.slice(6).trim();
        if (!question) {
            cooldown1.add(userId);
            const sent = await message.reply("❓ You need to ask a question! Usage: `!8ball <your question>`");
            setTimeout(() => {
                message.delete().catch(() => {});
                sent.delete().catch(() => {});
            }, 3000);
            setTimeout(() => cooldown1.delete(userId), 3000);
            return;
        }

        const response = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
        message.reply(`🎱 ${response}`);

        cooldown1.add(userId);
        setTimeout(() => cooldown1.delete(userId), 7000);
    }

    // --- BATTLE ---
    if (message.content.startsWith('!battle')) {
        const mentionedUser = message.mentions.users.first();
        const mentionedRole = message.mentions.roles.first();

        if (!mentionedUser && !mentionedRole) {
            const sent = await message.reply("⚔️ You need to mention a user or a role to battle! Usage: `!battle @username` or `!battle @role`");
            setTimeout(() => {
                message.delete().catch(() => {});
                sent.delete().catch(() => {});
            }, 3000);
            return;
        }

        if (mentionedUser && mentionedUser.id === userId) {
            const sent = await message.reply("🤨 You can't battle yourself. Try someone else.");
            setTimeout(() => {
                message.delete().catch(() => {});
                sent.delete().catch(() => {});
            }, 3000);
            return;
        }

        const targetId = mentionedUser ? mentionedUser.id : mentionedRole.id;

        if (battleCooldown.has(userId) || battleCooldown.has(targetId)) {
            const sent = await message.reply("⏳ One of you is still recovering from a previous battle. Try again in a bit!");
            setTimeout(() => {
                message.delete().catch(() => {});
                sent.delete().catch(() => {});
            }, 3000);
            return;
        }

        let outcome = "";

        if (mentionedUser) {
            // User vs User
            const [winner, loser] = Math.random() < 0.5
                ? [message.author, mentionedUser]
                : [mentionedUser, message.author];

            const outcomeTemplate = userBattleOutcomes[Math.floor(Math.random() * userBattleOutcomes.length)];
            outcome = outcomeTemplate
                .replace('{winner}', `**${winner.username}**`)
                .replace('{loser}', `**${loser.username}**`);

        } else if (mentionedRole) {
            // User vs Role
            const didWin = Math.random() < 0.5;
            const roleName = `**${mentionedRole.name}**`;
            const winnerName = `**${message.author.username}**`;

            if (didWin) {
                const winTemplate = battleVsRoleWin[Math.floor(Math.random() * battleVsRoleWin.length)];
                outcome = winTemplate
                    .replace('{winner}', winnerName)
                    .replace('{role}', roleName);
            } else {
                const loseTemplate = battleVsRoleLose[Math.floor(Math.random() * battleVsRoleLose.length)];
                outcome = loseTemplate
                    .replace('{winner}', winnerName)
                    .replace('{role}', roleName);
            }
        }

        // Apply cooldowns
        battleCooldown.add(userId);
        battleCooldown.add(targetId);
        setTimeout(() => {
            battleCooldown.delete(userId);
            battleCooldown.delete(targetId);
        }, 30000);

        message.channel.send(`⚔️ ${outcome}`);
    }
});

client.login(process.env.TOKEN);

