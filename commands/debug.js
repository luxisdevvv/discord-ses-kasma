import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Token debug komutu')
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Test edilecek token')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const token = interaction.options.getString('token');

        try {
            console.log('🔍 DEBUG: Token test ediliyor...');
            console.log(`🔍 Token uzunluğu: ${token.length}`);
            console.log(`🔍 Token başlangıcı: ${token.substring(0, 10)}...`);

            const response = await fetch('https://discord.com/api/v9/users/@me', {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📡 DEBUG: API Yanıt - ${response.status} ${response.statusText}`);

            const embed = new EmbedBuilder()
                .setColor(response.ok ? '#00ff00' : '#ff0000')
                .setTitle(response.ok ? '✅ Token Geçerli' : '❌ Token Geçersiz')
                .addFields(
                    { name: '📏 Token Uzunluğu', value: token.length.toString(), inline: true },
                    { name: '📡 HTTP Kodu', value: response.status.toString(), inline: true },
                    { name: '📡 Durum', value: response.statusText, inline: true }
                )
                .setTimestamp();

            if (response.ok) {
                const userData = await response.json();
                embed.addFields(
                    { name: '👤 Kullanıcı Adı', value: userData.username, inline: true },
                    { name: '🆔 Kullanıcı ID', value: userData.id, inline: true },
                    { name: '📧 Email', value: userData.email || 'Gizli', inline: true }
                );
            } else {
                const errorText = await response.text();
                embed.addFields(
                    { name: '❌ Hata Detayı', value: errorText.substring(0, 1000), inline: false }
                );
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('DEBUG Hatası:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Debug Hatası')
                .setDescription(`Hata: ${error.message}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
