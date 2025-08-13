import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { removeUser, findUserByToken, getUserCount } from '../utils/db.js';
import { voiceManager } from '../utils/voiceManager.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config dosyasını oku
const config = JSON.parse(readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Kullanıcı tokeni ile ses kanalından ayrıl')
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Kullanıcı tokeni')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const token = interaction.options.getString('token');

        try {
            // Token formatı kontrolü (daha esnek)
            if (!token || token.length < 50) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Geçersiz Token')
                    .setDescription('Token çok kısa veya boş!')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Kullanıcıyı veritabanında ara
            const user = findUserByToken(token);
            
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Kullanıcı Bulunamadı')
                    .setDescription('Bu token ile kayıtlı kullanıcı bulunamadı!')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Token geçerliliğini kontrol et ve kullanıcı bilgilerini al
            let username = 'Bilinmeyen Kullanıcı';
            try {
                const response = await fetch('https://discord.com/api/v9/users/@me', {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    username = userData.username;
                }
            } catch (apiError) {
                console.log('Token API kontrolü başarısız, kullanıcı adı bilinmiyor');
            }

            // Gerçek ses kanalından çıkma işlemi
            try {
                await voiceManager.leaveVoiceChannel(token);
            } catch (voiceError) {
                console.log('Ses kanalından çıkma hatası:', voiceError.message);
                // Hata olsa bile devam et
            }

            // Kullanıcıyı veritabanından kaldır
            const success = removeUser(token);
            
            if (!success) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Kullanıcı kaldırılırken hata oluştu!')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            const currentCount = getUserCount();

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Başarılı')
                .setDescription(`**${username}** başarıyla ses kanalından çıkarıldı!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: username, inline: true },
                    { name: '🎵 Kanal ID', value: user.voiceChannelID, inline: true },
                    { name: '📊 Mevcut Kullanıcı', value: `${currentCount}/${config.maxLimit}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Leave komutu hatası:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sistem Hatası')
                .setDescription('Beklenmeyen bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};


