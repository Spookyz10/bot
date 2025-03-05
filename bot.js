const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

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
    "image": 'https://static.wikia.nocookie.net/crusadersroblox/images/1/13/Sunken_Ruins.png/revision/latest?cb=20250304151817'
  }
};

function xpNeeded(level) {
  let v1 = 1 + level / 500;
  let v2 = 20 + level / 10;
  return Math.floor(Math.pow((v2 * Math.pow(level + 1, v1) * (level + 1)) - (v2 * (level + 1)), v1));
}

function calculateUpgradeChance(upgradeLevel) {
  if (upgradeLevel == 1) return 0.95;
  if (upgradeLevel >= 2 && upgradeLevel <= 19) return 1 - (upgradeLevel - 1) * 0.05;
  if (upgradeLevel == 20) return 0.08;
  if (upgradeLevel == 21) return 0.07;
  if (upgradeLevel == 22) return 0.05;
  return 1;
}

client.once('ready', async () => {
  console.log('Bot is online!');
  await client.application.commands.set([
    new SlashCommandBuilder()
      .setName('calc-pot')
      .setDescription('Calculates max potential stat based on base-stat and upgrades')
      .addNumberOption(option => option.setName('base-stat').setDescription('Base stat').setRequired(true))
      .addNumberOption(option => option.setName('upgrade').setDescription('Upgrade level').setRequired(true))
      .addNumberOption(option => option.setName('curr-upgrade').setDescription('Current upgrade level').setRequired(false))
      .addStringOption(option => option.setName('rarity').setDescription('Item rarity').setRequired(false)
        .addChoices(
          { name: 'Common', value: 'Common' },
          { name: 'Uncommon', value: 'Uncommon' },
          { name: 'Rare', value: 'Rare' },
          { name: 'Epic', value: 'Epic' },
          { name: 'Legendary', value: 'Legendary' },
          { name: 'Mythical', value: 'Mythical' }
        ))
      .addNumberOption(option => option.setName('item-level').setDescription('Item level').setRequired(false)),
    new SlashCommandBuilder()
      .setName('calc-runs')
      .setDescription('Calculates how many dungeon runs you need')
      .addNumberOption(option => option.setName('current-level').setDescription('Current level').setRequired(true))
      .addNumberOption(option => option.setName('goal-level').setDescription('Goal level').setRequired(true))
      .addStringOption(option => option.setName('dungeon').setDescription('Select dungeon').setRequired(false)
        .addChoices(
          { name: 'Pirate Cove', value: 'Pirate Cove' },
          { name: 'Sunken Ruins', value: 'Sunken Ruins' }
        ))
      .addStringOption(option => option.setName('difficulty').setDescription('Dungeon difficulty').setRequired(false)
        .addChoices(
          { name: 'Normal', value: 'Normal' },
          { name: 'Advanced', value: 'Advanced' },
          { name: 'Expert', value: 'Expert' }
        ))
      .addStringOption(option => option.setName('modifier').setDescription('Modifier').setRequired(false)
        .addChoices(
          { name: 'None', value: '0' },
          { name: 'Nightmare', value: '0.5' },
          { name: 'Chaotic', value: '1' },
          { name: 'Impossible', value: '4' }
        ))
      .addBooleanOption(option => option.setName('vip').setDescription('VIP bonus').setRequired(false))
      .addBooleanOption(option => option.setName('xp-potion').setDescription('2x XP Potion').setRequired(false)),
  ]);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'calc-runs') {
    const currentLevel = interaction.options.getNumber('current-level');
    const goalLevel = interaction.options.getNumber('goal-level');
    const dungeon = interaction.options.getString('dungeon');
    const difficulty = interaction.options.getString('difficulty');
    const modifier = parseFloat(interaction.options.getString('modifier')) || 0;
    const vip = interaction.options.getBoolean('vip') || false;
    const potion = interaction.options.getBoolean('xp-potion') || false;

    if (goalLevel <= currentLevel) {
      return await interaction.reply({ content: 'Your goal level must be higher than your current level.', ephemeral: true });
    }

    let totalXP = 0;
    for (let i = currentLevel; i < goalLevel; i++) {
      totalXP += xpNeeded(i);
    }

    if (!dungeon || !difficulty) {
      return await interaction.reply(`**Total XP Needed:** ${totalXP.toLocaleString()}`);
    }

    let baseXP = dungeons[dungeon][difficulty];
    let finalXP = baseXP + (baseXP * modifier);
    if (vip) finalXP += baseXP * 0.2;
    if (potion) finalXP *= 2;

    let runs = Math.ceil(totalXP / finalXP);
    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setThumbnail(dungeons[dungeon].image)
      .setTitle('⚔️ Dungeon Runs Calculator ⚔️')
      .setDescription(`**Total XP Needed:** ${totalXP.toLocaleString()}\n**Runs Needed:** ${runs.toLocaleString()}`)
      .setFooter({ text: 'Crusaders Dungeon Calculator' });

    await interaction.reply({
      content: `Hey <@${interaction.user.id}>`,
      embeds: [embed]
    });
  }
});

client.login(process.env.TOKEN);
