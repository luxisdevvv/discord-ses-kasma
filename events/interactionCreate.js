import { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
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
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        // Slash komutları için mevcut handler'ı koru
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Komut hatası: ${interaction.commandName}`, error);
                const errorMessage = {
                    content: '❌ Bu komutu çalıştırırken bir hata oluştu!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
            return;
        }

        // Buton etkileşimleri
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
            return;
        }

        // Modal etkileşimleri
        if (interaction.isModalSubmit()) {
            await handleModalInteraction(interaction);
            return;
        }
    },
};

/**
 * Buton etkileşimlerini işle
 */
async function handleButtonInteraction(interaction) {
    const { customId } = interaction;

    try {
        switch (customId) {
            case 'join_voice':
                await showJoinModal(interaction);
                break;
            case 'leave_voice':
                await showLeaveModal(interaction);
                break;
            case 'status_voice':
                await showStatus(interaction);
                break;
            case 'test_token':
                await showTestModal(interaction);
                break;
            case 'refresh_panel':
                await refreshPanel(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Bilinmeyen buton!', ephemeral: true });
        }
    } catch (error) {
        console.error('Buton işleme hatası:', error);
        await interaction.reply({ content: '❌ Buton işlenirken hata oluştu!', ephemeral: true });
    }
}

/**
 * Modal etkileşimlerini işle
 */
async function handleModalInteraction(interaction) {
    const { customId } = interaction;

    try {
        switch (customId) {
            case 'join_modal':
                await handleJoinModal(interaction);
                break;
            case 'leave_modal':
                await handleLeaveModal(interaction);
                break;
            case 'test_modal':
                await handleTestModal(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Bilinmeyen modal!', ephemeral: true });
        }
    } catch (error) {
        console.error('Modal işleme hatası:', error);
        await interaction.reply({ content: '❌ Modal işlenirken hata oluştu!', ephemeral: true });
    }
}

/**
 * Ses kanalına katılma modalını göster
 */
async function showJoinModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('join_modal')
        .setTitle('🎵 Ses Kanalına Katıl');

    const tokenInput = new TextInputBuilder()
        .setCustomId('token_input')
        .setLabel('Discord Token')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Discord kullanıcı tokeninizi girin...')
        .setRequired(true)
        .setMaxLength(100);

    const channelInput = new TextInputBuilder()
        .setCustomId('channel_input')
        .setLabel('Ses Kanalı ID')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ses kanalı ID\'sini girin...')
        .setRequired(true)
        .setMaxLength(20);

    const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
    const secondActionRow = new ActionRowBuilder().addComponents(channelInput);

    modal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(modal);
}

/**
 * Ses kanalından çıkma modalını göster
 */
async function showLeaveModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('leave_modal')
        .setTitle('🚪 Ses Kanalından Çık');

    const tokenInput = new TextInputBuilder()
        .setCustomId('token_input')
        .setLabel('Discord Token')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Çıkmak istediğiniz hesabın tokenini girin...')
        .setRequired(true)
        .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
}

/**
 * Token test modalını göster
 */
async function showTestModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('test_modal')
        .setTitle('🔍 Token Test Et');

    const tokenInput = new TextInputBuilder()
        .setCustomId('token_input')
        .setLabel('Discord Token')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Test edilecek tokeni girin...')
        .setRequired(true)
        .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
}

/**
 * Join modal işle
 */
async function handleJoinModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const token = interaction.fields.getTextInputValue('token_input');
    const voiceChannelID = interaction.fields.getTextInputValue('channel_input');

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

        // Token formatı kontrolü
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
        const response = await fetch('https://discord.com/api/v9/users/@me', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Token')
                .setDescription(`Token geçersiz! (${response.status})`)
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const userData = await response.json();
        const username = userData.username;

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

        // Ses kanalına katıl
        try {
            await voiceManager.joinVoiceChannel(token, voiceChannelID);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Başarılı')
                .setDescription(`**${username}** başarıyla ses kanalına eklendi!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: username, inline: true },
                    { name: '🎵 Kanal ID', value: voiceChannelID, inline: true },
                    { name: '📊 Mevcut Kullanıcı', value: `${currentCount + 1}/${config.maxLimit}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (voiceError) {
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

    } catch (error) {
        console.error('Join modal hatası:', error);
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Sistem Hatası')
            .setDescription('Beklenmeyen bir hata oluştu!')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}

/**
 * Leave modal işle
 */
async function handleLeaveModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const token = interaction.fields.getTextInputValue('token_input');

    try {
        // Token formatı kontrolü
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

        // Token geçerliliğini kontrol et
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
            console.log('Token API kontrolü başarısız');
        }

        // Ses kanalından çık
        try {
            await voiceManager.leaveVoiceChannel(token);
        } catch (voiceError) {
            console.log('Ses kanalından çıkma hatası:', voiceError.message);
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
        console.error('Leave modal hatası:', error);
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Sistem Hatası')
            .setDescription('Beklenmeyen bir hata oluştu!')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}

/**
 * Test modal işle
 */
async function handleTestModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const token = interaction.fields.getTextInputValue('token_input');

    try {
        console.log('🔍 DEBUG: Token test ediliyor...');
        console.log(`🔍 Token uzunluğu: ${token.length}`);

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
        console.error('Test modal hatası:', error);
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Test Hatası')
            .setDescription(`Hata: ${error.message}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}

/**
 * Durum göster
 */
async function showStatus(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const currentCount = getUserCount();
        const maxLimit = config.maxLimit;
        const activeConnections = voiceManager.getActiveConnections();

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📊 Sistem Durumu')
            .addFields(
                { name: '👥 Toplam Kullanıcı', value: `${currentCount}/${maxLimit}`, inline: true },
                { name: '🔗 Aktif Bağlantılar', value: activeConnections.length.toString(), inline: true },
                { name: '⚙️ Sistem Durumu', value: '🟢 Aktif', inline: true }
            )
            .setTimestamp();

        if (activeConnections.length > 0) {
            let connectionsText = '';
            activeConnections.forEach((conn, index) => {
                connectionsText += `${index + 1}. **${conn.username}** - Kanal: ${conn.channelId}\n`;
            });
            
            embed.addFields({
                name: '🎵 Aktif Bağlantılar',
                value: connectionsText || 'Bağlantı bulunamadı',
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Status hatası:', error);
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Durum Hatası')
            .setDescription('Durum bilgileri alınırken hata oluştu!')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}

/**
 * Paneli yenile
 */
async function refreshPanel(interaction) {
    await interaction.deferUpdate();

    try {
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

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Panel yenileme hatası:', error);
        await interaction.followUp({ content: '❌ Panel yenilenirken hata oluştu!', ephemeral: true });
    }
}
