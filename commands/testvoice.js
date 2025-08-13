import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { voiceManager } from '../utils/voiceManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('testvoice')
        .setDescription('Ses kanalı test komutu')
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Test edilecek token')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Ses kanalı ID\'si')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const token = interaction.options.getString('token');
        const channelId = interaction.options.getString('channel');

        try {
            console.log('🎵 TEST: Ses kanalı testi başlatılıyor...');
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎵 Ses Kanalı Testi')
                .setDescription('Ses kanalına katılma testi başlatılıyor...')
                .addFields(
                    { name: '🔍 Token Uzunluğu', value: token.length.toString(), inline: true },
                    { name: '🎵 Kanal ID', value: channelId, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Ses kanalına katıl
            await voiceManager.joinVoiceChannel(token, channelId);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Test Başarılı')
                .setDescription('Ses kanalına başarıyla katıldı!')
                .addFields(
                    { name: '🎵 Kanal ID', value: channelId, inline: true },
                    { name: '🔗 Durum', value: 'Aktif', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('TEST Hatası:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Test Başarısız')
                .setDescription(`Hata: ${error.message}`)
                .addFields(
                    { name: '🔍 Hata Detayı', value: error.stack || 'Bilinmeyen hata', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
