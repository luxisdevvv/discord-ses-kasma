import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ Bot başarıyla giriş yaptı!`);
        console.log(`🤖 Bot Adı: ${client.user.tag}`);
        console.log(`🆔 Bot ID: ${client.user.id}`);
        console.log(`📊 Sunucu Sayısı: ${client.guilds.cache.size}`);
        console.log(`👥 Toplam Kullanıcı: ${client.users.cache.size}`);
        console.log(`⏰ Başlatma Zamanı: ${new Date().toLocaleString('tr-TR')}`);
        console.log(`🔗 Discord.js Versiyonu: 14.14.1`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎵 Ses Kasma Botu Aktif!');
        console.log('📝 Kullanılabilir Komutlar:');
        console.log('   /panel - Butonlu ses kasma paneli');
        console.log('   /join - Ses kanalına katıl');
        console.log('   /leave - Ses kanalından ayrıl');
        console.log('   /status - Aktif bağlantıları görüntüle');
        console.log('   /debug - Token test et');
        console.log('   /testvoice - Ses kanalı test et');
        console.log('   /limit - Limit ayarla (Admin)');
        console.log('   /removelimit - Limiti kaldır (Admin)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
};
