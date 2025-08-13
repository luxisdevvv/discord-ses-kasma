import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { addUser, getUserCount, removeUser, findUserByToken } from '../utils/db.js';
import { voiceManager } from '../utils/voiceManager.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config dosyasını oku
const config = JSON.parse(readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

export default {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Ses kasma paneli - Butonlu sistem'),

    async execute(interaction) {
        const currentCount = getUserCount();
        const maxLimit = config.maxLimit;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎵 Ses Kasma Paneli')
            .setDescription('Aşağıdaki butonları kullanarak ses kanalı işlemlerini yapabilirsiniz.')
            .addFields(
                { name: '📊 Mevcut Durum', value: `${currentCount}/${maxLimit} kullanıcı`, inline: true },
                { name: '🔗 Aktif Bağlantılar', value: voiceManager.getActiveConnections().length.toString(), inline: true },
                { name: '⚙️ Sistem Durumu', value: '🟢 Aktif', inline: true }
            )
            .addFields(
                { name: '📋 Kullanılabilir İşlemler', value: '• Ses kanalına katıl\n• Ses kanalından çık\n• Aktif bağlantıları görüntüle\n• Token test et', inline: false }
            )
            .setFooter({ text: 'Ses Kasma Botu v1.0' })
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_voice')
                    .setLabel('🎵 Ses Kanalına Katıl')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➕'),
                new ButtonBuilder()
                    .setCustomId('leave_voice')
                    .setLabel('🚪 Ses Kanalından Çık')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('➖'),
                new ButtonBuilder()
                    .setCustomId('status_voice')
                    .setLabel('📊 Durum Görüntüle')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈')
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('test_token')
                    .setLabel('🔍 Token Test Et')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔬'),
                new ButtonBuilder()
                    .setCustomId('refresh_panel')
                    .setLabel('🔄 Paneli Yenile')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔄')
            );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: false
        });
    },
};
