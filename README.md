# Discord Ses Kasma Botu

Discord ses kanallarında kullanıcı tokenleri ile otomatik ses kasma botu. Butonlu panel sistemi ile kullanıcı dostu arayüz.

## 🚀 Özellikler

- **🎛️ Butonlu Panel Sistemi**: Tek komutla tüm işlemler
- **🎵 Gerçek Ses Bağlantısı**: WebSocket ile Discord Gateway bağlantısı
- **🔐 Token Doğrulama**: Güvenli token kontrolü ve test sistemi
- **📊 Limit Sistemi**: Maksimum kullanıcı limiti kontrolü
- **👑 Admin Kontrolü**: Sadece admin kullanıcıların limit ayarlayabilmesi
- **💾 Veritabanı**: JSON tabanlı veri saklama
- **⚡ Slash Komutlar**: Modern Discord slash komut sistemi
- **🎨 Modal Sistemi**: Güvenli bilgi girişi
- **🔄 Gerçek Zamanlı Durum**: Aktif bağlantı takibi

## 📁 Proje Yapısı

```
luxises/
├── package.json
├── config.json
├── db.json
├── index.js
├── events/
│   ├── ready.js
│   └── interactionCreate.js
├── commands/
│   ├── panel.js          # 🆕 Butonlu panel sistemi
│   ├── join.js
│   ├── leave.js
│   ├── status.js
│   ├── debug.js
│   ├── testvoice.js
│   ├── limit.js
│   └── removelimit.js
└── utils/
    ├── db.js
    └── voiceManager.js
```

## ⚙️ Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Config dosyasını düzenleyin:**
```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "adminIDs": ["ADMIN_USER_ID_1", "ADMIN_USER_ID_2"],
  "maxLimit": 3
}
```

3. **Bot'u başlatın:**
```bash
npm start
```

## 🎮 Komutlar

### 🎛️ Ana Panel Komutu
- `/panel` - **Butonlu ses kasma paneli** (Tüm işlemler tek yerden)

### 📋 Kullanıcı Komutları
- `/join <token> <channel>` - Ses kanalına katıl
- `/leave <token>` - Ses kanalından çık
- `/status` - Aktif bağlantıları görüntüle
- `/debug <token>` - Token test et
- `/testvoice <token> <channel>` - Ses kanalı test et

### 👑 Admin Komutları
- `/limit <number>` - Maksimum kullanıcı limitini ayarla
- `/removelimit` - Limiti varsayılan değere (3) sıfırla

## 🎛️ Panel Sistemi

### 📋 Panel Özellikleri
- **🎵 Ses Kanalına Katıl** - Modal ile token ve kanal ID girişi
- **🚪 Ses Kanalından Çık** - Modal ile token girişi
- **📊 Durum Görüntüle** - Aktif bağlantıları listele
- **🔍 Token Test Et** - Token geçerliliği kontrolü
- **🔄 Paneli Yenile** - Panel bilgilerini güncelle

### 🎨 Modal Sistemi
- Güvenli token girişi
- Kanal ID girişi
- Otomatik doğrulama
- Hata kontrolü

## 🔧 Teknik Detaylar

### 📦 Bağımlılıklar
- **discord.js**: Discord API entegrasyonu
- **node-fetch**: HTTP istekleri
- **ws**: WebSocket bağlantıları
- **libsodium-wrappers**: Ses şifreleme

### ⚡ Özellikler
- **ES Modules**: Modern JavaScript modül sistemi
- **Async/Await**: Asenkron işlemler
- **Error Handling**: Kapsamlı hata yönetimi
- **Logging**: Detaylı konsol logları
- **Event System**: Gelişmiş event yönetimi
- **Button Interactions**: Buton etkileşimleri
- **Modal System**: Modal form sistemi

## 📊 Veritabanı

`db.json` dosyası kullanıcı bilgilerini saklar:
```json
{
  "users": [
    {
      "token": "user_token_here",
      "voiceChannelID": "channel_id_here"
    }
  ]
}
```

## 🎯 Kullanım Örnekleri

### Panel Kullanımı
1. `/panel` komutunu çalıştırın
2. İstediğiniz butona tıklayın
3. Modal'da gerekli bilgileri girin
4. İşlem otomatik tamamlanır

### Token Test
1. `/debug` veya panel'den "Token Test Et"
2. Tokeninizi girin
3. Geçerlilik kontrolü yapılır

### Ses Kanalına Katılma
1. `/join` veya panel'den "Ses Kanalına Katıl"
2. Token ve kanal ID girin
3. Otomatik ses kanalına katılım

## 🛡️ Güvenlik

- ✅ Token formatı kontrolü
- ✅ Admin yetki kontrolü
- ✅ Hata durumunda otomatik temizlik
- ✅ Güvenli WebSocket bağlantıları
- ✅ Modal ile güvenli bilgi girişi
- ✅ Ephemeral mesajlar (gizli yanıtlar)

## 🔍 Debug Özellikleri

- **Token Kontrolü**: API ile gerçek token doğrulama
- **Kanal Doğrulama**: Ses kanalı tipi kontrolü
- **WebSocket Logları**: Bağlantı durumu takibi
- **Hata Detayları**: Kapsamlı hata mesajları
- **Durum Takibi**: Aktif bağlantı sayısı

## ⚠️ Önemli Notlar

1. **Token Güvenliği**: Kullanıcı tokenleri hassas bilgilerdir, güvenli şekilde saklanmalıdır
2. **Discord ToS**: Selfbot kullanımı Discord ToS'a aykırı olabilir
3. **Rate Limiting**: Discord API rate limitlerine dikkat edin
4. **Backup**: Veritabanı dosyalarını düzenli olarak yedekleyin

## 🐛 Hata Ayıklama

### Yaygın Hatalar

1. **Token Hatası**: Bot tokeni geçersiz
2. **Client ID Hatası**: Application client ID yanlış
3. **Yetki Hatası**: Bot'un gerekli yetkileri yok
4. **Komut Hatası**: Slash komutlar kaydedilmemiş

### Log Kontrolü
Bot başlatıldığında detaylı loglar konsola yazdırılır:
- Komut yükleme durumu
- Event yükleme durumu
- Slash komut kaydetme durumu
- Bot bağlantı durumu

## 📝 Lisans

Bu proje eğitim amaçlıdır. Kullanım sorumluluğu size aittir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun
3. Commit yapın
4. Push yapın
5. Pull Request oluşturun

## 🆕 Son Güncellemeler

### v1.1 - Butonlu Panel Sistemi
- ✅ Butonlu panel komutu eklendi
- ✅ Modal sistemi entegre edildi
- ✅ Event handler sistemi geliştirildi
- ✅ Görsel embed'ler eklendi
- ✅ Gerçek zamanlı durum takibi
- ✅ Panel yenileme özelliği

### v1.0 - Temel Özellikler
- ✅ Gerçek ses bağlantısı
- ✅ Token doğrulama sistemi
- ✅ Limit kontrolü
- ✅ Admin komutları
- ✅ Veritabanı sistemi
