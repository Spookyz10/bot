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
  await client.guilds.cache.get('YOUR_GUILD_ID').commands.set([
    new SlashCommandBuilder()
      .setName('calc-pot')
      .setDescription('Calculates the max potential based on base-stat and upgrade')
      .setDMPermission(false)
      .addNumberOption(option =>
        option.setName('base-stat')
          .setDescription('The base stat number (statline)')
          .setRequired(true)
      )
      .addNumberOption(option =>
        option.setName('upgrade')
          .setDescription('The upgrade number (final upgrade level)')
          .setRequired(true)
      )
      .addNumberOption(option =>
        option.setName('curr-upgrade')
          .setDescription('The current upgrade level')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('rarity')
          .setDescription('The rarity of the item')
          .setRequired(false)
          .addChoices(
            { name: 'Common', value: 'Common' },
            { name: 'Uncommon', value: 'Uncommon' },
            { name: 'Rare', value: 'Rare' },
            { name: 'Epic', value: 'Epic' },
            { name: 'Legendary', value: 'Legendary' },
            { name: 'Mythical', value: 'Mythical' }
          )
      )
      .addNumberOption(option =>
        option.setName('item-level')
          .setDescription('The level of the item')
          .setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('calc-runs')
      .setDescription('Calculates dungeon runs needed to reach a goal level')
      .setDMPermission(false)
      .addNumberOption(option =>
        option.setName('current-level')
          .setDescription('Your current level')
          .setRequired(true))
      .addNumberOption(option =>
        option.setName('goal-level')
          .setDescription('Your goal level')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('dungeon')
          .setDescription('Select a dungeon')
          .setRequired(false)
          .addChoices(
            { name: 'Pirate Cove', value: 'Pirate Cove' },
            { name: 'Sunken Ruins', value: 'Sunken Ruins' }
          ))
      .addStringOption(option =>
        option.setName('difficulty')
          .setDescription('Select dungeon difficulty')
          .setRequired(false)
          .addChoices(
            { name: 'Normal', value: 'Normal' },
            { name: 'Advanced', value: 'Advanced' },
            { name: 'Expert', value: 'Expert' }
          ))
      .addStringOption(option =>
        option.setName('modifier')
          .setDescription('Select a modifier')
          .setRequired(false)
          .addChoices(
            { name: 'None', value: '0' },
            { name: 'Nightmare', value: '0.5' },
            { name: 'Chaotic', value: '1' },
            { name: 'Impossible', value: '4' }
          ))
      .addBooleanOption(option =>
        option.setName('vip')
          .setDescription('Do you have VIP bonus?')
          .setRequired(false))
      .addBooleanOption(option =>
        option.setName('xp-potion')
          .setDescription('Do you have the 2x XP Potion?')
          .setRequired(false)),
  ]);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'calc-pot') {
    const baseStat = interaction.options.getNumber('base-stat');
    const upgrade = interaction.options.getNumber('upgrade');
    const currentUpgrade = interaction.options.getNumber('curr-upgrade');
    const rarity = interaction.options.getString('rarity');
    const itemLevel = interaction.options.getNumber('item-level');

    const statline = baseStat;
    const result = Math.floor(upgrade + statline + (statline * (upgrade * 0.02)));

    const embed = new EmbedBuilder()
      .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png/revision/latest?cb=20250304145829&format=original')
      .setColor('Purple')
      .setTitle('⚔️ Max Potential ⚔️')
      .setDescription(`The item's strength at upgrade ${upgrade} is: **${result}**`)
      .setFooter({ text: 'Max Potential Calculation' })
      .setTimestamp();

    if (itemLevel && rarity) {
      const baseCost = rarityBaseCosts[rarity];
      if (baseCost) {
        embed.addFields({
          name: '💰 Total Upgrade Cost 💰',
          value: `The upgrade cost for your item (level ${itemLevel}, rarity ${rarity}) is: **${Math.floor(baseCost * itemLevel)}**`,
        });
      }
    }

    await interaction.reply({
      content: `Hey <@${interaction.user.id}>`,
      embeds: [embed]
    });
  }

  if (commandName === 'calc-runs') {
    const currentLevel = interaction.options.getNumber('current-level');
    const goalLevel = interaction.options.getNumber('goal-level');
    const selectedDungeon = interaction.options.getString('dungeon');
    const difficulty = interaction.options.getString('difficulty');
    const modifier = parseFloat(interaction.options.getString('modifier')) || 0;
    const vip = interaction.options.getBoolean('vip') || false;
    const potion = interaction.options.getBoolean('xp-potion') || false;

    if (goalLevel <= currentLevel) {
      await interaction.reply({ content: 'The goal level must be higher than your current level.', ephemeral: true });
      return;
    }

    let totalXP = 0;
    for (let i = currentLevel; i < goalLevel; i++) {
      totalXP += xpNeeded(i);
    }

    if (selectedDungeon && difficulty) {
      let baseXP = dungeons[selectedDungeon][difficulty];
      let finalXP = baseXP;

      finalXP += Math.floor(baseXP * modifier);
      if (vip) finalXP += Math.floor(baseXP * 0.2);
      if (potion) finalXP *= 2;

      let runs = Math.ceil(totalXP / finalXP);

      const embed = new EmbedBuilder()
        .setColor('Purple')
        .setThumbnail('https://static.wikia.nocookie.net/crusadersroblox/images/1/17/Bot.png/revision/latest?cb=20250304145829&format=original')
        .setTitle('⚔️ Dungeon Run Calculator ⚔️')
        .setDescription(`**Total XP Needed:** ${totalXP.toLocaleString()}\n**Runs Needed:** ${runs.toLocaleString()}`)
        .setFooter({ text: 'Crusaders Dungeon Calculator' })
        .setTimestamp();

      if (dungeons[selectedDungeon]?.image) {
        embed.setImage(dungeons[selectedDungeon].image);
      }

      await interaction.reply({
        content: `Hey <@${interaction.user.id}>`,
        embeds: [embed]
      });
    }
  }
});

client.login(process.env.TOKEN);
