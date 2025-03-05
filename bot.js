const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const rarityBaseCosts = {
  Common: 100,
  Uncommon: 110,
  Rare: 120,
  Epic: 130,
  Legendary: 140,
  Mythical: 200
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

client.once('ready', async () => {
  console.log('Bot is online!');
  await client.application.fetch();
  
  await client.application.commands.set([
    new SlashCommandBuilder()
      .setName('calc-pot')
      .setDescription('Calculates the max potential based on base-stat and upgrade')
      .addNumberOption(option =>
        option.setName('base-stat').setDescription('The base stat number').setRequired(true))
      .addNumberOption(option =>
        option.setName('upgrade').setDescription('The upgrade number').setRequired(true))
      .addStringOption(option =>
        option.setName('rarity').setDescription('The rarity of the item').setRequired(false)
          .addChoices(
            { name: 'Common', value: 'Common' },
            { name: 'Uncommon', value: 'Uncommon' },
            { name: 'Rare', value: 'Rare' },
            { name: 'Epic', value: 'Epic' },
            { name: 'Legendary', value: 'Legendary' },
            { name: 'Mythical', value: 'Mythical' }
          ))
      .addNumberOption(option =>
        option.setName('item-level').setDescription('The level of the item').setRequired(false)),

    new SlashCommandBuilder()
      .setName('calc-runs')
      .setDescription('Calculates dungeon runs needed')
      .addNumberOption(option =>
        option.setName('current-level').setDescription('Your current level').setRequired(true))
      .addNumberOption(option =>
        option.setName('goal-level').setDescription('Your goal level').setRequired(true))
      .addStringOption(option =>
        option.setName('dungeon').setDescription('Dungeon name').setRequired(false)
          .addChoices(
            { name: 'Pirate Cove', value: 'Pirate Cove' },
            { name: 'Sunken Ruins', value: 'Sunken Ruins' }
          ))
      .addStringOption(option =>
        option.setName('difficulty').setDescription('Difficulty').setRequired(false)
          .addChoices(
            { name: 'Normal', value: 'Normal' },
            { name: 'Advanced', value: 'Advanced' },
            { name: 'Expert', value: 'Expert' }
          ))
  ]);

  console.log('Slash commands registered');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'calc-pot') {
    const baseStat = interaction.options.getNumber('base-stat');
    const upgrade = interaction.options.getNumber('upgrade');
    const result = Math.floor(upgrade + baseStat + (baseStat * (upgrade * 0.02)));

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setTitle('⚔️ Max Potential ⚔️')
      .setDescription(`The item's max potential is: **${result}**`)
      .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png/revision/latest?cb=20250304145829&format=original')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
