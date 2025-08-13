import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config dosyasını oku
const config = JSON.parse(readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// Discord client oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Komutlar için collection
client.commands = new Collection();

/**
 * Komutları yükle
 */
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    console.log('📁 Komutlar yükleniyor...');

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(`file://${filePath.replace(/\\/g, '/')}`);
        
        if ('data' in command.default && 'execute' in command.default) {
            client.commands.set(command.default.data.name, command.default);
            console.log(`✅ Komut yüklendi: ${command.default.data.name}`);
        } else {
            console.log(`⚠️ Komut yüklenemedi: ${file} - gerekli özellikler eksik`);
        }
    }

    console.log(`📊 Toplam ${client.commands.size} komut yüklendi`);
}

/**
 * Event dosyalarını yükle
 */
async function loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    console.log('📁 Eventler yükleniyor...');

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = await import(`file://${filePath.replace(/\\/g, '/')}`);
        
        if (event.default.once) {
            client.once(event.default.name, (...args) => event.default.execute(...args));
        } else {
            client.on(event.default.name, (...args) => event.default.execute(...args));
        }
        
        console.log(`✅ Event yüklendi: ${event.default.name}`);
    }

    console.log(`📊 Toplam ${eventFiles.length} event yüklendi`);
}

/**
 * Slash komutları Discord API'ye kaydet
 */
async function deployCommands() {
    try {
        console.log('🚀 Slash komutları Discord API\'ye kaydediliyor...');

        const commands = [];
        for (const command of client.commands.values()) {
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(config.token);

        console.log(`📝 ${commands.length} komut global olarak kaydediliyor...`);

        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log(`✅ ${data.length} slash komut başarıyla kaydedildi!`);
        
        // Kaydedilen komutları listele
        console.log('📋 Kaydedilen komutlar:');
        for (const command of commands) {
            console.log(`   - /${command.name}: ${command.description}`);
        }

    } catch (error) {
        console.error('❌ Slash komut kaydetme hatası:', error);
    }
}



/**
 * Bot başlatma
 */
async function startBot() {
    try {
        console.log('🤖 Discord Ses Kasma Botu başlatılıyor...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Komutları ve eventleri yükle
        await loadCommands();
        await loadEvents();

        // Bot'a giriş yap
        await client.login(config.token);

        // Slash komutları kaydet
        await deployCommands();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Bot başarıyla başlatıldı!');

    } catch (error) {
        console.error('❌ Bot başlatma hatası:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Bot kapatılıyor...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Bot kapatılıyor...');
    client.destroy();
    process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', error => {
    console.error('❌ Yakalanmamış Promise Rejection:', error);
});

// Bot'u başlat
startBot();
