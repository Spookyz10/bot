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
    "image": 'https://static.wikia.nocookie.net/crusadersroblox/images/1/13/Sunken_Ruins.png/revision/latest?cb=20250304151817'
  }
};

function xpNeeded(level) {
  let v1 = 1 + level / 500;
  let v2 = 20 + level / 10;
  return Math.floor(Math.pow((v2 * Math.pow(level + 1, v1) * (level + 1)) - (v2 * (level + 1)), v1));
}

client.once('ready', async () => {
  console.log('Bot is online!');

  await client.application.commands.set([
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
    .addNumberOption(option =>
      option.setName('curr-xp').setDescription('Current XP').setRequired(false))
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
      option.setName('weekend-boost').setDescription('Weekend Boost').setRequired(false)),
]);

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'calc-runs') {
    const currentLevel = interaction.options.getNumber('current-level');
    const goalLevel = interaction.options.getNumber('goal-level');
    const currXP = interaction.options.getNumber('curr-xp') || 0;
    const dungeon = interaction.options.getString('dungeon');
    const vip = interaction.options.getBoolean('vip') || false;
    const potion = interaction.options.getBoolean('xp-potion') || false;
    const weekend = interaction.options.getBoolean('weekend-boost') || false;

    const modifierValue = interaction.options.getString('modifier') || '0';
    const modifierMap = {
      "0": "None",
      "0.5": "Nightmare",
      "1": "Chaotic",
      "4": "Impossible"
    };
    const modifierName = modifierMap[modifierValue];

    let totalXP = 0;
    for (let i = currentLevel; i < goalLevel; i++) {
      totalXP += xpNeeded(i);
    }

    totalXP -= currXP; // Subtract Current XP
    if (totalXP < 0) totalXP = 0; // Prevent negative XP

    let totalBuff = 0;
    if (vip) totalBuff += 20;
    if (potion) totalBuff += 100;
    if (weekend) totalBuff += 50;

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setTitle(`To go from lvl ${currentLevel} to lvl ${goalLevel} you need **${totalXP.toLocaleString()} XP**`)
      .setDescription(`In **${dungeon}** with **${modifierName}**, you need to do:`)
      .setImage(dungeons[dungeon].image)
      .setTimestamp();

    Object.keys(dungeons[dungeon]).filter(d => d !== 'image').forEach(difficulty => {
      let baseXP = dungeons[dungeon][difficulty];
      let finalXP = Math.floor(baseXP * (1 + totalBuff / 100) * (1 + parseFloat(modifierValue)));
      let runs = Math.ceil(totalXP / finalXP);

      embed.addFields({ name: `${difficulty}`, value: `**${runs}** Runs`, inline: true });
    });

    await interaction.reply({ content: `Hey <@${interaction.user.id}>`, embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
