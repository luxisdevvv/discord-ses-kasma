import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { voiceManager } from '../utils/voiceManager.js';
import { getUserCount } from '../utils/db.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config dosyasını oku
const config = JSON.parse(readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Aktif ses bağlantılarını görüntüle'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const activeConnections = voiceManager.getActiveConnections();
            const totalUsers = getUserCount();
            const currentLimit = config.maxLimit;

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Ses Bağlantı Durumu')
                .setDescription('Aktif ses kanalı bağlantıları')
                .addFields(
                    { name: '🔗 Aktif Bağlantı', value: activeConnections.length.toString(), inline: true },
                    { name: '📊 Toplam Kullanıcı', value: totalUsers.toString(), inline: true },
                    { name: '⚡ Limit', value: `${currentLimit}`, inline: true }
                )
                .setTimestamp();

            // Aktif bağlantıları listele
            if (activeConnections.length > 0) {
                const connectionList = activeConnections.map((conn, index) => {
                    return `${index + 1}. **${conn.username}** - Kanal: \`${conn.channelId}\``;
                }).join('\n');

                embed.addFields({
                    name: '🎵 Aktif Kullanıcılar',
                    value: connectionList,
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '🎵 Aktif Kullanıcılar',
                    value: 'Aktif bağlantı bulunmuyor',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Status komutu hatası:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sistem Hatası')
                .setDescription('Durum bilgileri alınırken hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
