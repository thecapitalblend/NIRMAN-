# Nirman Hisab — निर्माण हिसाब

Apni construction site ka poora hisab-kitab: material, majdoori, transport, kharch aur
client se aayi payment — sab ek jagah. Ye ek **proper standalone web app** hai —
koi Claude ya kisi aur cheez pe depend nahi karta. Ek baar GitHub par daal ke
free host kar do, phir apna hamesha ka apna app ban jayega.

- 100% offline chalta hai (PWA hai, phone par "Add to Home Screen" karke app jaisa install ho jata hai)
- Data sirf **tumhare device** mein save hota hai (koi server, koi login nahi)
- Backup/Restore ka button hai — naya phone lene par data move kar sakte ho
- Koi build step nahi, koi `npm install` nahi — seedha kaam karta hai

---

## Step 1 — GitHub par upload karo

1. [github.com](https://github.com) par account banao (agar nahi hai).
2. Naya repository banao — naam do jaise `nirman-hisab` (Public rakho).
3. Is poore folder (`nirman-hisab-app`) ke saare files us repository mein upload kar do:
   - GitHub website par "uploading an existing file" link se seedha drag-and-drop kar sakte ho, **ya**
   - Agar `git` pata hai to terminal se:
     ```
     git init
     git add .
     git commit -m "Nirman Hisab app"
     git branch -M main
     git remote add origin https://github.com/<tumhara-username>/nirman-hisab.git
     git push -u origin main
     ```

## Step 2 — Free mein host karo (GitHub Pages)

1. Apni repository ke **Settings** tab mein jao.
2. Left menu mein **Pages** par click karo.
3. "Branch" mein `main` chuno aur folder `/ (root)` rakho, phir **Save** karo.
4. 1-2 minute mein tumhara app live ho jayega, is link par:
   `https://<tumhara-username>.github.io/nirman-hisab/`

Bas — ab ye link tumhara apna permanent app-link hai. Kabhi bhi kisi bhi browser
se khol sakte ho.

## Step 3 — Phone mein "App" jaisa install karo

1. Upar wala link apne phone ke Chrome (Android) ya Safari (iPhone) mein kholo.
2. **Android (Chrome):** menu (⋮) → "Add to Home screen" / "Install app".
3. **iPhone (Safari):** Share button → "Add to Home Screen".
4. Ab home screen par ek icon aa jayega — usse khologe to bilkul normal app
   jaisa full-screen khulega, offline bhi chalega.

---

## App mein kya-kya hai

| Tab | Kya karta hai |
|---|---|
| **Home** | Total balance, har site ka summary |
| **Sites** | Har construction site alag add/manage karo |
| **Add (+)** | Kharch ya Aamdani entry daalo — Material/Majdoori ke liye quantity/rate se amount khud ban jata hai |
| **Ledger** | Register-style pura hisab, search/filter, edit/delete, running balance |
| **Settings** | Backup download, Restore, CSV report export, sab data clear karne ka option |

## Zaroori baat — Backup

Data sirf usi browser/phone mein rehta hai jahan tumne entries daali hain.
Naya phone lene se pehle, ya browser ka data/cache clear karne se pehle:
**Settings → Backup Download Karo** zaroor kar lo. Wapas laane ke liye
**Settings → Restore** se wahi file select kar do.

## Local par test karna ho (optional, developers ke liye)

Koi build tool nahi chahiye. Bas is folder mein ek simple server chala do:

```
cd nirman-hisab-app
python3 -m http.server 8080
```

Phir browser mein `http://localhost:8080` kholo.

---

Made with plain HTML, CSS aur JavaScript — koi framework, koi dependency nahi,
isliye kabhi "break" nahi hoga aur hamesha ke liye chalega.
