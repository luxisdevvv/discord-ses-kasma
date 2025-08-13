import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addUser, getUserCount, removeUser } from '../utils/db.js';
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
        .setName('join')
        .setDescription('Kullanıcı tokeni ile ses kanalına katıl')
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Kullanıcı tokeni')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Ses kanalı ID\'si')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const token = interaction.options.getString('token');
        const voiceChannelID = interaction.options.getString('channel');

        try {
            // Limit kontrolü
            const currentCount = getUserCount();
            if (currentCount >= config.maxLimit) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Limit Aşıldı')
                    .setDescription(`Maksimum kullanıcı limiti (${config.maxLimit}) aşıldı!`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Token formatı kontrolü (daha esnek)
            if (!token || token.length < 50) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Geçersiz Token')
                    .setDescription('Token çok kısa veya boş!')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Kanal ID formatı kontrolü
            if (!voiceChannelID.match(/^\d{17,19}$/)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Geçersiz Kanal ID')
                    .setDescription('Girilen kanal ID formatı geçersiz!')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Token geçerliliğini kontrol et
            try {
                console.log('🔍 Token geçerliliği kontrol ediliyor...');
                
                const response = await fetch('https://discord.com/api/v9/users/@me', {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`📡 API Yanıt: ${response.status} ${response.statusText}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Token API Hatası:', errorText);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Geçersiz Token')
                        .setDescription(`Token geçersiz! (${response.status})\n\nHata: ${errorText}`)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                const userData = await response.json();
                const username = userData.username;
                console.log(`✅ Token geçerli - Kullanıcı: ${username}`);

                // Kullanıcıyı veritabanına ekle
                const success = addUser(token, voiceChannelID);
                
                if (!success) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Hata')
                        .setDescription('Bu token zaten kayıtlı!')
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Gerçek ses kanalına katılma işlemi
                try {
                    await voiceManager.joinVoiceChannel(token, voiceChannelID);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Başarılı')
                        .setDescription(`**${username}** başarıyla ses kanalına eklendi!`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: username, inline: true },
                            { name: '🎵 Kanal ID', value: voiceChannelID, inline: true },
                            { name: '📊 Mevcut Kullanıcı', value: `${currentCount + 1}/${config.maxLimit}`, inline: true },
                            { name: '🔗 Bağlantı', value: 'Aktif', inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });

                } catch (voiceError) {
                    // Ses kanalına katılma başarısız olsa bile veritabanından kaldır
                    removeUser(token);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Ses Kanalı Hatası')
                        .setDescription('Ses kanalına katılırken hata oluştu!')
                        .addFields(
                            { name: '🔍 Hata', value: voiceError.message, inline: false }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                }

            } catch (apiError) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ API Hatası')
                    .setDescription('Discord API ile iletişim kurulamadı!')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Join komutu hatası:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sistem Hatası')
                .setDescription('Beklenmeyen bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};


