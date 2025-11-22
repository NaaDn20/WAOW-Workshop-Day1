WAOW WORKSHOP DAY-1

Panduan cepat untuk menjalankan proyek.

---

Setup Proyek 

### 1. Klon dan Masuk Folder

```bash
git clone [(https://github.com/NaaDn20/WAOW-Workshop-Day1)]
cd [waow_workshop]
```

### 2. Instal Dependensi Python

Jalankan perintah ini secara berurutan untuk membuat file menginstalnya requirements:

```bash
pip install -r requirements.txt
```

### 3. Setup Database (MySQL)
Buka klien MySQL Anda dan buat database bernama shop, lalu impor data yang disediakan.

```bash
CREATE DATABASE IF NOT EXISTS shop;
```

### 4. Jalankan Aplikasi
Pastikan MySQL berjalan.
Jalankan aplikasi dari terminal:
```bash
python app.py
```
Akses di browser: http://127.0.0.1:5000/

