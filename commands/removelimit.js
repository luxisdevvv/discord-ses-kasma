import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '..', 'config.json');

export default {
    data: new SlashCommandBuilder()
        .setName('removelimit')
        .setDescription('Maksimum kullanıcı limitini varsayılan değere döndür (Sadece Admin)'),

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

            const currentLimit = configData.maxLimit;
            const defaultLimit = 3;

            // Limit zaten varsayılan değerde mi kontrol et
            if (currentLimit === defaultLimit) {
                const embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setTitle('⚠️ Limit Zaten Varsayılan')
                    .setDescription(`Limit zaten varsayılan değer olan **${defaultLimit}** olarak ayarlı!`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Config dosyasını güncelle
            configData.maxLimit = defaultLimit;
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Limit Sıfırlandı')
                .setDescription(`Maksimum kullanıcı limiti varsayılan değere döndürüldü!`)
                .addFields(
                    { name: '👤 Eski Limit', value: currentLimit.toString(), inline: true },
                    { name: '🔄 Varsayılan Limit', value: defaultLimit.toString(), inline: true },
                    { name: '🔧 Admin', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Konsola log
            console.log(`🔄 Limit sıfırlandı: ${currentLimit} → ${defaultLimit} (Admin: ${interaction.user.tag})`);

        } catch (error) {
            console.error('Removelimit komutu hatası:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sistem Hatası')
                .setDescription('Limit sıfırlanırken beklenmeyen bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
