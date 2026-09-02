const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const Template = require('../models/Template');
const AIVideoTemplate = require('../models/AIVideoTemplate');

// 10 Regional Languages
const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn', 'pa', 'ml'];

// Accurate Category Translations Dictionary
const CATEGORY_TRANSLATIONS = {
  'Daily': {
    en: 'Daily',
    hi: 'दैनिक स्टेटस',
    mr: 'दैनंदिन स्टेटस',
    gu: 'દૈનિક સ્ટેટસ',
    ta: 'தினசரி நிலவரம்',
    te: 'రోజువారీ స్టేటస్',
    kn: 'ದೈನಂದಿನ ಸ್ಟೇಟಸ್',
    bn: 'দৈনিক স্ট্যাটাস',
    pa: 'ਰੋਜ਼ਾਨਾ ਸਟੇਟਸ',
    ml: 'ദിനചര്യ സ്റ്റാറ്റസ്',
  },
  'Good Morning': {
    en: 'Good Morning',
    hi: 'शुभ प्रभात',
    mr: 'शुभ सकाळ',
    gu: 'શુભ પ્રભાત',
    ta: 'காலை வணக்கம்',
    te: 'శుభోదయం',
    kn: 'ಶುಭೋದಯ',
    bn: 'সুপ্রভাত',
    pa: 'ਸ਼ੁਭ ਸਵੇਰ',
    ml: 'സുപ്രഭാതം',
  },
  'Good Night': {
    en: 'Good Night',
    hi: 'शुभ रात्रि',
    mr: 'शुभ रात्री',
    gu: 'શુભ રાત્રી',
    ta: 'இரவு வணக்கம்',
    te: 'శుభరాత్రి',
    kn: 'ಶುಭರಾತ್ರಿ',
    bn: 'শুভ রাত্রি',
    pa: 'ਸ਼ੁਭ ਰਾਤ',
    ml: 'ശുഭരാത്രി',
  },
  'Motivation': {
    en: 'Motivation',
    hi: 'प्रेरणादायक',
    mr: 'प्रेरणादायी',
    gu: 'પ્રેરણાત્મક',
    ta: 'ஊக்கம்',
    te: 'ప్రేరణ',
    kn: 'ಪ್ರೇರಣೆ',
    bn: 'অনুপ্রেরণা',
    pa: 'ਪ੍ਰੇਰਣਾਦਾਇਕ',
    ml: 'പ്രചോദനം',
  },
  'Devotional': {
    en: 'Devotional',
    hi: 'भक्ति',
    mr: 'भक्ती',
    gu: 'ભક્તિ',
    ta: 'பக்தி',
    te: 'భక్తి',
    kn: 'ಭಕ್ತಿ',
    bn: 'ভক্তি',
    pa: 'ਭਗਤੀ',
    ml: 'ഭക്തി',
  },
  'Love & Romance': {
    en: 'Love & Romance',
    hi: 'प्यार और रोमांस',
    mr: 'प्रेम आणि रोमान्स',
    gu: 'પ્રેમ અને રોમાન્સ',
    ta: 'காதல்',
    te: 'ప్రేమ',
    kn: 'ಪ್ರೀತಿ',
    bn: 'ভালোবাসা',
    pa: 'ਪਿਆਰ',
    ml: 'പ്രണയം',
  },
  'Festival & Celebration': {
    en: 'Festival & Celebration',
    hi: 'त्यौहार और उत्सव',
    mr: 'सण आणि उत्सव',
    gu: 'તહેવાર અને ઉત્સવ',
    ta: 'பண்டிகை',
    te: 'పండుగలు',
    kn: 'ಹಬ್ಬಗಳು',
    bn: 'উৎসব',
    pa: 'ਤਿਉਹਾਰ',
    ml: 'ആഘോഷങ്ങൾ',
  },
  'Birthday Wishes': {
    en: 'Birthday Wishes',
    hi: 'जन्मदिन की शुभकामनाएं',
    mr: 'वाढदिवसाच्या शुभेच्छा',
    gu: 'જન્મદિનની મુબારક',
    ta: 'பிறந்தநாள் வாழ்த்துக்கள்',
    te: 'జన్మదిన శుభాకాంక్షలు',
    kn: 'ಹುಟ್ಟುಹಬ್ಬದ ಶುಭಾಶಯಗಳು',
    bn: 'শুভ জন্মদিন',
    pa: 'ਜਨਮਦਿਨ ਦੀਆਂ ਮੁਬਾਰਕਾਂ',
    ml: 'ജന്മദിനാശംസകൾ',
  },
  'Attitude & Swagger': {
    en: 'Attitude & Swagger',
    hi: 'एटीट्यूड और टशन',
    mr: 'ॲटीट्यूड',
    gu: 'એટિટ્યુડ',
    ta: 'கெத்து',
    te: 'ఆటిట్యూడ్',
    kn: 'ಆಟಿಟ್ಯೂಡ್',
    bn: 'অ্যাটিটিউড',
    pa: 'ਐਟੀਟਿਊਡ',
    ml: 'ആറ്റിറ്റ്യൂഡ്',
  },
  'Trending Reels': {
    en: 'Trending Reels',
    hi: 'ट्रेंडिंग रील्स',
    mr: 'ट्रेंडिंग रील्स',
    gu: 'ટ્રેન્ડિંગ રીલ્સ',
    ta: 'ட்ரெண்டிங்',
    te: 'ట్రెండింగ్',
    kn: 'ಟ್ರೆಂಡಿಂಗ್',
    bn: 'ট্রেন্ডিং রিলস',
    pa: 'ਟਰੈਂਡਿੰਗ ਰੀਲਜ਼',
    ml: 'ട്രെൻഡിംഗ്',
  },
  'Business & Branding': {
    en: 'Business & Branding',
    hi: 'बिजनेस और ब्रांडिंग',
    mr: 'व्यवसाय आणि ब्रँडिंग',
    gu: 'બિઝનેસ અને બ્રાન્ડિંગ',
    ta: 'தொழில் மற்றும் பிராண்டிங்',
    te: 'వ్యాపారం',
    kn: 'ವ್ಯಾಪಾರ',
    bn: 'ব্যবসা ও ব্র্যান্ডিং',
    pa: 'ਬਜ਼ਨਸ ਅਤੇ ਬ੍ਰਾਂਡਿੰਗ',
    ml: 'ബിസിനസ്സ്',
  },
  'Suvichar & Quotes': {
    en: 'Suvichar & Quotes',
    hi: 'सुविचार और अनमोल वचन',
    mr: 'सुविचार आणि कोट्स',
    gu: 'સુવિચાર',
    ta: 'பொன்மொழிகள்',
    te: 'సుభాషితాలు',
    kn: 'ಸುವಿಚಾರ',
    bn: 'সুবিচার',
    pa: 'ਸੁਵਿਚਾਰ',
    ml: 'ചിന്തകൾ',
  },
  'Anniversary & Weddings': {
    en: 'Anniversary & Weddings',
    hi: 'शादी की सालगिरह',
    mr: 'लग्नाचा वाढदिवस',
    gu: 'લગ્નનની સાલગીરી',
    ta: 'திருமண நாள்',
    te: 'పెళ్లి రోజు',
    kn: 'ವಿವಾಹ ವಾರ್ಷಿಕೋತ್ಸವ',
    bn: 'বিবাহবার্ষিকী',
    pa: 'ਵਿਆਹ ਦੀ ਸਾਲਗ੍ਰਿਹ',
    ml: 'വിവാഹവാർഷികം',
  },
};

// Known Template Specific Translations
const TEMPLATE_TRANSLATIONS = {
  '👑 Royal Golden Emerald VIP Status': {
    en: '👑 Royal Golden Emerald VIP Status',
    hi: '👑 रॉयल गोल्डन एमराल्ड वीआईपी स्टेटस',
    mr: '👑 रॉयल गोल्डन एमराल्ड व्हीआयपी स्टेटस',
    gu: '👑 રોયલ ગોલ્ડન એમરાલ્ડ વીઆઇપી સ્ટેટસ',
    ta: '👑 ராயல் கோல்டன் எமரால்டு விஐபி ஸ்டேட்டஸ்',
    te: '👑 రాయల్ గోల్డెన్ ఎమరాల్డ్ విఐపి స్టేటస్',
    kn: '👑 ರಾಯಲ್ ಗೋಲ್ಡನ್ ಎಮರಾಲ್ಡ್ ವಿಐಪಿ ಸ್ಟೇಟಸ್',
    bn: '👑 রয়্যাল গোল্ডেন এমারল্ড ভিআইপি স্ট্যাটাস',
    pa: '👑 ਰਾਇਲ ਗੋਲਡਨ ਐਮਰਾਲਡ ਵੀਆਈਪੀ ਸਟੇਟਸ',
    ml: '👑 റോയൽ ഗോൾഡൻ എമറാൾഡ് വിഐപി സ്റ്റാറ്റസ്',
  },
  '⚡ Cyberpunk Neon Glow Premium Reel': {
    en: '⚡ Cyberpunk Neon Glow Premium Reel',
    hi: '⚡ साइबरपंक नियन ग्लो प्रीमियम रील',
    mr: '⚡ सायबरपंक निऑन ग्लो प्रीमियम रील',
    gu: '⚡ સાયબરપંક નિયોન ગ્લો પ્રીમિયમ રીલ',
    ta: '⚡ சைபர்பங்க் நியான் க்ளோ பிரீமியம் ரீல்',
    te: '⚡ సైబర్ పంక్ నియాన్ గ్లో ప్రీమియం రీల్',
    kn: '⚡ ಸೈಬರ್‌ಪಂಕ್ ನಿಯಾನ್ ಗ್ಲೋ ಪ್ರೀಮಿಯಂ ರೀಲ್',
    bn: '⚡ সাইবারপাঙ্ক নিয়ন গ্লো প্রিমিয়াম রিল',
    pa: '⚡ ਸਾਈਬਰਪੰਕ ਨਿਓਨ ਗਲੋ ਪ੍ਰੀਮੀਅਮ ਰੀਲ',
    ml: '⚡ സൈബർപങ്ക് നിയോൺ ഗ്ലോ പ്രീമിയം റീൽ',
  },
  '🪔 Luxury Grand Festival Status (Diwali / Jayanti)': {
    en: '🪔 Luxury Grand Festival Status (Diwali / Jayanti)',
    hi: '🪔 लक्जरी ग्रैंड फेस्टिवल स्टेटस (दिवाली / जयंती)',
    mr: '🪔 लक्झरी ग्रँड फेस्टिव्हल स्टेटस (दिवाळी / जयंती)',
    gu: '🪔 લક્ઝરી ગ્રાન્ડ ફેસ્ટિવલ સ્ટેટસ (દિવાળી / જયંતિ)',
    ta: '🪔 லக்சுரி கிராண்ட் ஃபெஸ்டிவல் ஸ்டேட்டஸ்',
    te: '🪔 లగ్జరీ గ్రాండ్ ఫెస్టివల్ స్టేటస్',
    kn: '🪔 ಲಕ್ಷುರಿ ಗ್ರ್ಯಾಂಡ್ ಫೆಸ್ಟಿವಲ್ ಸ್ಟೇಟಸ್',
    bn: '🪔 লাক্সারি গ্র্যান্ড ফেস্টিভাল স্ট্যাটাস',
    pa: '🪔 ਲਗਜ਼ਰੀ ਗ੍ਰੈਂਡ ਫੈਸਟੀਵਲ ਸਟੇਟਸ',
    ml: '🪔 ലക്ഷ്വറി ഗ്രാൻഡ് ഫെസ്റ്റിവൽ സ്റ്റാറ്റസ്',
  },
};

// AI Video Template Translations
const AI_TEMPLATE_TRANSLATIONS = {
  'AI Trial': {
    en: 'AI Trial',
    hi: 'एआई ट्रायल',
    mr: 'एआय ट्रायल',
    gu: 'એઆઈ ટ્રાયલ',
    ta: 'ஏஐ ட்ரையல்',
    te: 'ఏఐ ట్రయల్',
    kn: 'ಎಐ ಟ್ರಯಲ್',
    bn: 'এআই ট্রায়াল',
    pa: 'ਏਆਈ ਟ੍ਰਾਇਲ',
    ml: 'എഐ ട്രയൽ',
  },
  'Sideface Trial': {
    en: 'Sideface Trial',
    hi: 'साइडफेस एआई ट्रायल',
    mr: 'साइडफेस एआय ट्रायल',
    gu: 'સાઇડફેસ એઆઈ ટ્રાયલ',
    ta: 'சைட் பேஸ் ஏஐ ட்ரையல்',
    te: 'సైడ్ ఫేస్ ఏఐ ట్రయల్',
    kn: 'ಸೈಡ್ ಫೇಸ್ ಎಐ ಟ್ರಯಲ್',
    bn: 'সাইডফেস এআই ট্রায়াল',
    pa: 'ਸਾਈਡ ਫੇਸ ਏਆਈ ਟ੍ਰਾਇਲ',
    ml: 'സൈഡ്ഫേസ് എഐ ട്രയൽ',
  },
  'Festival Video Greeting': {
    en: 'Festival Video Greeting',
    hi: 'त्यौहार वीडियो बधाई',
    mr: 'सण व्हिडिओ शुभेच्छा',
    gu: 'તહેવાર વીડિયો મુબારક',
    ta: 'பண்டிகை வீடியோ வாழ்த்து',
    te: 'పండుగ వీడియో శుభాకాంక్షలు',
    kn: 'ಹಬ್ಬದ ವೀಡಿಯೊ ಶುಭಾಶಯಗಳು',
    bn: 'উৎসব ভিডিও শুভেচ্ছা',
    pa: 'ਤਿਉਹਾਰ ਵੀਡੀਓ ਮੁਬਾਰਕ',
    ml: 'ആഘോഷ വീഡിയോ ആശംസകൾ',
  },
  'Royal King AI Portrait': {
    en: 'Royal King AI Portrait',
    hi: 'रॉयल किंग एआई पोर्ट्रेट',
    mr: 'रॉयल किंग एआय पोर्ट्रेट',
    gu: 'રોયલ કિંગ એઆઈ પોટ્રેટ',
    ta: 'ராயல் கிங் ஏஐ போர்ட்ரெய்ட்',
    te: 'రాయల్ కింగ్ ఏఐ పోర్ట్రెయిట్',
    kn: 'ರಾಯಲ್ ಕಿಂಗ್ ಎಐ ಪೋರ್ಟ್ರೇಟ್',
    bn: 'রয়্যাল কিং এআই পোর্ট্রেট',
    pa: 'ਰਾਇਲ ਕਿੰਗ ਏਆਈ ਪੋਰਟਰੇਟ',
    ml: 'റോയൽ കിംഗ് എഐ പോർട്രെയ്റ്റ്',
  },
};

async function seedMultilingual() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/starpix';
    console.log('[Multilingual Seed] Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Update Categories
    console.log('[Multilingual Seed] Updating Categories with localized names...');
    const categories = await Category.find({});
    for (const cat of categories) {
      const transMap = new Map();
      const predefined = CATEGORY_TRANSLATIONS[cat.name];

      SUPPORTED_LANGUAGES.forEach((lang) => {
        if (predefined && predefined[lang]) {
          transMap.set(lang, predefined[lang]);
        } else {
          transMap.set(lang, cat.name);
        }
      });

      cat.nameTranslations = transMap;
      await cat.save();
      console.log(`✓ Updated Category: "${cat.name}" -> ${transMap.get('hi')} / ${transMap.get('mr')} / ${transMap.get('gu')}`);
    }

    // 2. Update Templates
    console.log('[Multilingual Seed] Updating Standard Templates with localized names...');
    const templates = await Template.find({});
    for (const tmpl of templates) {
      const transMap = new Map();
      const predefined = TEMPLATE_TRANSLATIONS[tmpl.name];

      SUPPORTED_LANGUAGES.forEach((lang) => {
        if (predefined && predefined[lang]) {
          transMap.set(lang, predefined[lang]);
        } else {
          transMap.set(lang, tmpl.name);
        }
      });

      tmpl.nameTranslations = transMap;
      await tmpl.save();
      console.log(`✓ Updated Template: "${tmpl.name}" -> ${transMap.get('hi')} / ${transMap.get('mr')}`);
    }

    // 3. Update AI Video Templates
    console.log('[Multilingual Seed] Updating AI Video Templates with localized titles...');
    const aiTemplates = await AIVideoTemplate.find({});
    for (const aiTmpl of aiTemplates) {
      const transMap = new Map();
      const predefined = AI_TEMPLATE_TRANSLATIONS[aiTmpl.title];

      SUPPORTED_LANGUAGES.forEach((lang) => {
        if (predefined && predefined[lang]) {
          transMap.set(lang, predefined[lang]);
        } else {
          transMap.set(lang, aiTmpl.title);
        }
      });

      aiTmpl.titleTranslations = transMap;
      await aiTmpl.save();
      console.log(`✓ Updated AI Template: "${aiTmpl.title}" -> ${transMap.get('hi')} / ${transMap.get('mr')}`);
    }

    console.log('[Multilingual Seed] Successfully populated translations for all categories, templates, and AI video templates!');
  } catch (err) {
    console.error('[Multilingual Seed Error]:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedMultilingual();
