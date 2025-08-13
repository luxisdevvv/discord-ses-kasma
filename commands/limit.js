import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '..', 'config.json');

export default {
    data: new SlashCommandBuilder()
        .setName('limit')
        .setDescription('Maksimum kullanıcı limitini ayarla (Sadece Admin)')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Yeni limit sayısı (1-10 arası)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Config dosyasını oku
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Admin kontrolü
            if (!configData.adminIDs.includes(interaction.user.id)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetkisiz Erişim')
                    .setDescription('Bu komutu kullanmak için admin yetkisine sahip olmalısınız!')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            const newLimit = interaction.options.getInteger('number');
            const oldLimit = configData.maxLimit;

            // Limit değişikliği kontrolü
            if (newLimit === oldLimit) {
                const embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setTitle('⚠️ Limit Değişmedi')
                    .setDescription(`Limit zaten **${oldLimit}** olarak ayarlı!`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Config dosyasını güncelle
            configData.maxLimit = newLimit;
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Limit Güncellendi')
                .setDescription(`Maksimum kullanıcı limiti başarıyla değiştirildi!`)
                .addFields(
                    { name: '👤 Eski Limit', value: oldLimit.toString(), inline: true },
                    { name: '🆕 Yeni Limit', value: newLimit.toString(), inline: true },
                    { name: '🔧 Admin', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Konsola log
            console.log(`🔧 Limit güncellendi: ${oldLimit} → ${newLimit} (Admin: ${interaction.user.tag})`);

        } catch (error) {
            console.error('Limit komutu hatası:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sistem Hatası')
                .setDescription('Limit güncellenirken beklenmeyen bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
