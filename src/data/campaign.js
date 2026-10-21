const ev = (id, vocabularyId, nameAr, transliteration, meaningIndo, glyph, clue, hintText, hotspot) => ({
  id, vocabularyId, nameAr, transliteration, meaningIndo, glyph, clue, hintText, hotspot
});
const piece = (id, textArabic, transliteration, translation) => ({ id, textArabic, transliteration, translation });
const suspect = (id, name, nameAr, role, alibi, policeNote, isGuilty, initials) => ({ id, name, nameAr, role, alibi, policeNote, isGuilty, initials });
const q = (id, mode, prompt, options, correctIndex, explanation, vocabularyId = null, arabicPrompt = false) => {
  const shift = options.length ? [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % options.length : 0;
  const orderedOptions = options.slice(shift).concat(options.slice(0, shift));
  return { id, mode, prompt, options: orderedOptions, correctIndex: orderedOptions.indexOf(options[correctIndex]), explanation, vocabularyId, arabicPrompt: Boolean(arabicPrompt && /^[\u0600-\u06FF]/.test(prompt.trim())) };
};

export const CAMPAIGN_CONFIG = {
  campaignId: 'basyir-main',
  version: '1.0.0',
  title: 'Jejak Bulan Sabit',
  episodeOrder: ['ep01-library', 'ep02-lab', 'ep03-office', 'ep04-cafeteria']
};

export const VOCABULARY_REGISTRY = {
  'vocab.key': { vocabId: 'vocab.key', arabic: 'مِفْتَاحٌ', transliteration: 'miftāḥun', meaningIndo: 'kunci', partOfSpeech: 'isim', level: 'Pra-A1', sourceEpisodeIds: ['ep01-library', 'ep03-office'], exampleSentences: [{ arabic: 'الْمِفْتَاحُ فِي الدُّرْجِ.', transliteration: 'al-miftāḥu fī ad-durji.', meaningIndo: 'Kunci itu berada di dalam laci.' }] },
  'vocab.badge': { vocabId: 'vocab.badge', arabic: 'شَارَةٌ', transliteration: 'shāratun', meaningIndo: 'lencana', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep01-library', 'ep04-cafeteria'], exampleSentences: [{ arabic: 'هَذِهِ شَارَةٌ.', transliteration: 'hādhihi shāratun.', meaningIndo: 'Ini sebuah lencana.' }] },
  'vocab.magnifier': { vocabId: 'vocab.magnifier', arabic: 'عَدَسَةٌ مُكَبِّرَةٌ', transliteration: 'ʿadasatun mukabbiratun', meaningIndo: 'kaca pembesar', partOfSpeech: 'isim + sifat', level: 'A1', sourceEpisodeIds: ['ep01-library'], exampleSentences: [{ arabic: 'عَدَسَةٌ مُكَبِّرَةٌ عَلَى الْمَكْتَبِ.', transliteration: 'ʿadasatun mukabbiratun ʿalā al-maktabi.', meaningIndo: 'Kaca pembesar berada di atas meja.' }] },
  'vocab.pen': { vocabId: 'vocab.pen', arabic: 'قَلَمٌ', transliteration: 'qalamun', meaningIndo: 'pena', partOfSpeech: 'isim', level: 'Pra-A1', sourceEpisodeIds: ['ep01-library'], exampleSentences: [{ arabic: 'الْقَلَمُ عَلَى الْمَكْتَبِ.', transliteration: 'al-qalamu ʿalā al-maktabi.', meaningIndo: 'Pena itu berada di atas meja.' }] },
  'vocab.letter': { vocabId: 'vocab.letter', arabic: 'رِسَالَةٌ', transliteration: 'risālatun', meaningIndo: 'surat/pesan', partOfSpeech: 'isim', level: 'Pra-A1', sourceEpisodeIds: ['ep01-library'], exampleSentences: [{ arabic: 'هَذِهِ رِسَالَةٌ قَصِيرَةٌ.', transliteration: 'hādhihi risālatun qaṣīratun.', meaningIndo: 'Ini surat pendek.' }] },
  'vocab.book': { vocabId: 'vocab.book', arabic: 'كِتَابٌ', transliteration: 'kitābun', meaningIndo: 'buku', partOfSpeech: 'isim', level: 'Pra-A1', sourceEpisodeIds: ['ep01-library', 'ep02-lab'], exampleSentences: [{ arabic: 'الْكِتَابُ عَلَى الطَّاوِلَةِ.', transliteration: 'al-kitābu ʿalā aṭ-ṭāwilati.', meaningIndo: 'Buku itu berada di atas meja.' }] },
  'vocab.drawer': { vocabId: 'vocab.drawer', arabic: 'دُرْجٌ', transliteration: 'durjun', meaningIndo: 'laci', partOfSpeech: 'isim', level: 'Pra-A1', sourceEpisodeIds: ['ep01-library', 'ep03-office'], exampleSentences: [{ arabic: 'الْمِفْتَاحُ فِي الدُّرْجِ.', transliteration: 'al-miftāḥu fī ad-durji.', meaningIndo: 'Kunci itu berada di dalam laci.' }] },
  'vocab.manuscript': { vocabId: 'vocab.manuscript', arabic: 'مَخْطُوطٌ', transliteration: 'makhṭūṭun', meaningIndo: 'naskah/manuskrip', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep01-library'], exampleSentences: [{ arabic: 'الْمَخْطُوطُ فِي الْمَكْتَبَةِ.', transliteration: 'al-makhṭūṭu fī al-maktabati.', meaningIndo: 'Naskah itu berada di perpustakaan.' }] },
  'vocab.lab-tube': { vocabId: 'vocab.lab-tube', arabic: 'أُنْبُوبٌ', transliteration: 'unbūbun', meaningIndo: 'tabung', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep02-lab'], exampleSentences: [{ arabic: 'الْأُنْبُوبُ الْأَزْرَقُ عَلَى الطَّاوِلَةِ.', transliteration: 'al-unbūbu al-azraqu ʿalā aṭ-ṭāwilati.', meaningIndo: 'Tabung biru itu berada di atas meja.' }] },
  'vocab.glove': { vocabId: 'vocab.glove', arabic: 'قُفَّازٌ', transliteration: 'quffāzun', meaningIndo: 'sarung tangan', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep02-lab'], exampleSentences: [{ arabic: 'الْقُفَّازُ قُرْبَ الرَّفِّ.', transliteration: 'al-quffāzu qurba ar-raffi.', meaningIndo: 'Sarung tangan berada dekat rak.' }] },
  'vocab.schedule': { vocabId: 'vocab.schedule', arabic: 'جَدْوَلٌ', transliteration: 'jadwalun', meaningIndo: 'jadwal', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep02-lab', 'ep03-office'], exampleSentences: [{ arabic: 'أَيْنَ الْجَدْوَلُ؟', transliteration: 'ayna al-jadwalu?', meaningIndo: 'Di mana jadwal itu?' }] },
  'vocab.note': { vocabId: 'vocab.note', arabic: 'مُلَاحَظَةٌ', transliteration: 'mulāḥaẓatun', meaningIndo: 'catatan/pengamatan', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep02-lab'], exampleSentences: [{ arabic: 'هَذِهِ مُلَاحَظَةٌ قَصِيرَةٌ.', transliteration: 'hādhihi mulāḥaẓatun qaṣīratun.', meaningIndo: 'Ini catatan singkat.' }] },
  'vocab.transfer-slip': { vocabId: 'vocab.transfer-slip', arabic: 'وَرَقَةُ نَقْلٍ', transliteration: 'waraqatu naqlin', meaningIndo: 'slip perpindahan', partOfSpeech: 'frasa isim', level: 'A1', sourceEpisodeIds: ['ep02-lab', 'ep03-office', 'ep04-cafeteria'], exampleSentences: [{ arabic: 'وَرَقَةُ النَّقْلِ فِي الْمِلَفِّ.', transliteration: 'waraqatu an-naqli fī al-milaffi.', meaningIndo: 'Slip perpindahan berada di dalam map.' }] },
  'vocab.table': { vocabId: 'vocab.table', arabic: 'طَاوِلَةٌ', transliteration: 'ṭāwilatun', meaningIndo: 'meja', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep02-lab'], exampleSentences: [{ arabic: 'الْأُنْبُوبُ عَلَى الطَّاوِلَةِ.', transliteration: 'al-unbūbu ʿalā aṭ-ṭāwilati.', meaningIndo: 'Tabung itu berada di atas meja.' }] },
  'vocab.blue': { vocabId: 'vocab.blue', arabic: 'أَزْرَقُ / زَرْقَاءُ', transliteration: 'azraqu / zarqāʾu', meaningIndo: 'biru, bentuk maskulin/feminin', partOfSpeech: 'sifat', level: 'A1', sourceEpisodeIds: ['ep02-lab'], exampleSentences: [{ arabic: 'الْأُنْبُوبُ الْأَزْرَقُ.', transliteration: 'al-unbūbu al-azraqu.', meaningIndo: 'Tabung yang biru.' }] },
  'vocab.office': { vocabId: 'vocab.office', arabic: 'مَكْتَبٌ', transliteration: 'maktabun', meaningIndo: 'kantor/meja kerja', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep03-office'], exampleSentences: [{ arabic: 'السِّجِلُّ فِي الْمَكْتَبِ.', transliteration: 'as-sijillu fī al-maktabi.', meaningIndo: 'Register berada di kantor.' }] },
  'vocab.register': { vocabId: 'vocab.register', arabic: 'سِجِلٌّ', transliteration: 'sijillun', meaningIndo: 'register/catatan resmi', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep03-office'], exampleSentences: [{ arabic: 'السِّجِلُّ عَلَى الْمَكْتَبِ.', transliteration: 'as-sijillu ʿalā al-maktabi.', meaningIndo: 'Register berada di atas meja.' }] },
  'vocab.document': { vocabId: 'vocab.document', arabic: 'وَثِيقَةٌ', transliteration: 'wathīqatun', meaningIndo: 'dokumen', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep03-office', 'ep04-cafeteria'], exampleSentences: [{ arabic: 'هَذِهِ وَثِيقَةٌ مُهِمَّةٌ.', transliteration: 'hādhihi wathīqatun muhimmatun.', meaningIndo: 'Ini dokumen penting.' }] },
  'vocab.manager': { vocabId: 'vocab.manager', arabic: 'مُدِيرٌ', transliteration: 'mudīrun', meaningIndo: 'kepala/pengelola', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep03-office'], exampleSentences: [{ arabic: 'مُدِيرُ الْمَدْرَسَةِ.', transliteration: 'mudīru al-madrasati.', meaningIndo: 'Kepala sekolah.' }] },
  'vocab.appointment': { vocabId: 'vocab.appointment', arabic: 'مَوْعِدٌ', transliteration: 'mawʿidun', meaningIndo: 'jadwal/waktu yang ditetapkan', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep03-office'], exampleSentences: [{ arabic: 'مَتَى الْمَوْعِدُ؟', transliteration: 'matā al-mawʿidu?', meaningIndo: 'Kapan jadwalnya?' }] },
  'vocab.cafeteria': { vocabId: 'vocab.cafeteria', arabic: 'مَقْصَفٌ', transliteration: 'maqṣafun', meaningIndo: 'kantin', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep04-cafeteria'], exampleSentences: [{ arabic: 'ذَهَبَ سَامِي إِلَى الْمَقْصَفِ.', transliteration: 'dhahaba Sāmī ilā al-maqṣafi.', meaningIndo: 'Sami pergi ke kantin.' }] },
  'vocab.chair': { vocabId: 'vocab.chair', arabic: 'كُرْسِيٌّ', transliteration: 'kursiyyun', meaningIndo: 'kursi', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep04-cafeteria'], exampleSentences: [{ arabic: 'الْحَقِيبَةُ تَحْتَ الْكُرْسِيِّ.', transliteration: 'al-ḥaqībatu taḥta al-kursiyyi.', meaningIndo: 'Tas itu berada di bawah kursi.' }] },
  'vocab.bag': { vocabId: 'vocab.bag', arabic: 'حَقِيبَةٌ', transliteration: 'ḥaqībatun', meaningIndo: 'tas', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep04-cafeteria'], exampleSentences: [{ arabic: 'الْحَقِيبَةُ تَحْتَ الْكُرْسِيِّ.', transliteration: 'al-ḥaqībatu taḥta al-kursiyyi.', meaningIndo: 'Tas itu berada di bawah kursi.' }] },
  'vocab.clock': { vocabId: 'vocab.clock', arabic: 'سَاعَةٌ', transliteration: 'sāʿatun', meaningIndo: 'jam', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep04-cafeteria'], exampleSentences: [{ arabic: 'السَّاعَةُ عَلَى الْحَائِطِ.', transliteration: 'as-sāʿatu ʿalā al-ḥāʾiṭi.', meaningIndo: 'Jam berada di dinding.' }] },
  'vocab.envelope': { vocabId: 'vocab.envelope', arabic: 'ظَرْفٌ', transliteration: 'ẓarfun', meaningIndo: 'amplop', partOfSpeech: 'isim', level: 'A1', sourceEpisodeIds: ['ep04-cafeteria'], exampleSentences: [{ arabic: 'الظَّرْفُ تَحْتَ الْكُرْسِيِّ.', transliteration: 'aẓ-ẓarfu taḥta al-kursiyyi.', meaningIndo: 'Amplop berada di bawah kursi.' }] }
};

export const CASES_CONFIG = {
  'ep01-library': {
    contentVersion: '1.0.0',
    caseInfo: { id: 'ep01-library', number: '01', title: 'Kasus Hilangnya Naskah Kuno', location: 'Perpustakaan Al-Hikmah', description: 'Naskah kuno hilang dari laci arsip yang terkunci.', briefing: ['Naskah kuno Perpustakaan Al-Hikmah lenyap semalam.', 'Sebuah surat rahasia ditemukan dalam keadaan sobek.', 'Kumpulkan lima bukti, susun surat, lalu periksa alibi tiga orang.'] },
    curriculum: { level: 'Pra-A1 menuju A1 awal', focus: 'Benda perpustakaan, kalimat pendek, dan kata kerja lampau', coreVocabIds: ['vocab.key', 'vocab.letter', 'vocab.pen', 'vocab.drawer'] },
    unlock: { prerequisites: [], minMastery: 70 }, sceneType: 'library',
    evidence: [
      ev('key', 'vocab.key', 'مِفْتَاحٌ', 'miftāḥun', 'kunci', '🗝️', 'Laci arsip dapat dibuka dengan kunci cadangan. Catatan akses tidak menunjukkan peminjaman kunci secara resmi.', 'Periksa area dekat laci arsip.', { left: 44, top: 62 }),
      ev('badge', 'vocab.badge', 'شَارَةٌ', 'shāratun', 'lencana', '🎖️', 'Lencana pos pintu belakang tertinggal di meja kecil. Pos itu menjadi jalur akses menuju gudang.', 'Lihat meja dekat pintu belakang.', { left: 73, top: 38 }),
      ev('magnifier', 'vocab.magnifier', 'عَدَسَةٌ مُكَبِّرَةٌ', 'ʿadasatun mukabbiratun', 'kaca pembesar', '🔎', 'Serbuk kardus gudang menempel pada gagang laci. Jejak ini menghubungkan laci dengan area gudang.', 'Periksa benda kecil di dekat laci.', { left: 24, top: 73 }),
      ev('pen', 'vocab.pen', 'قَلَمٌ', 'qalamun', 'pena', '🖋️', 'Tinta pada surat cocok dengan pena di meja tulis. Surat itu berasal dari area petugas, bukan rak pengunjung.', 'Periksa meja tulis.', { left: 54, top: 26 }),
      ev('letter', 'vocab.letter', 'رِسَالَةٌ', 'risālatun', 'surat', '✉️', 'Surat menyatakan bahwa saksi melihat Khalid mengambil kunci. Nama Khalid muncul dalam konteks kalimat lampau.', 'Periksa bagian bawah alas laci.', { left: 81, top: 58 })
    ],
    puzzle: { pieces: [piece('p1', 'رَأَيْتُ', 'ra’aytu', 'aku melihat'), piece('p2', 'خَالِدًا', 'Khālidan', 'Khalid sebagai objek'), piece('p3', 'يَأْخُذُ', 'ya’khudhu', 'mengambil'), piece('p4', 'الْمِفْتَاحَ', 'al-miftāḥa', 'kunci itu')], initialOrder: ['p3', 'p1', 'p4', 'p2'], acceptedOrders: [['p1', 'p2', 'p3', 'p4']], fullTranslation: 'Aku melihat Khalid mengambil kunci itu.', grammarNote: 'Nama خَالِدًا memakai fathatain dalam kalimat ini karena berfungsi sebagai objek.' },
    suspects: [suspect('ahmad', 'Ahmad', 'أَحْمَدُ', 'Penjaga perpustakaan', 'Rekaman dan dua saksi mendukung keberadaannya di ruang baca.', 'Alibinya perlu dibandingkan dengan catatan waktu.', false, 'AH'), suspect('khalid', 'Khalid', 'خَالِدٌ', 'Petugas gudang', 'Mengaku menjaga pintu belakang sepanjang malam.', 'Buku jaga pintu belakang kosong dan surat menyebut namanya.', true, 'KH'), suspect('yusuf', 'Yusuf', 'يُوسُفُ', 'Petugas halaman', 'Dua saksi melihatnya berada di halaman saat kejadian.', 'Kesaksian lokasi perlu disandingkan dengan jejak di laci.', false, 'YU')],
    storyHook: 'Setelah kesimpulan utama, sebuah catatan dengan tanda bulan sabit ditemukan di balik sampul naskah. Catatan itu mengarah ke laboratorium sekolah.',
    mastery: [
      q('l1','vocabulary','Apa arti مِفْتَاحٌ?',['Kunci','Pena','Buku','Laci'],0,'مِفْتَاحٌ berarti kunci.','vocab.key'),
      q('l2','vocabulary','Apa arti رِسَالَةٌ?',['Surat atau pesan','Jadwal','Kursi','Tas'],0,'رِسَالَةٌ berarti surat atau pesan.','vocab.letter'),
      q('l3','vocabulary','Kata Arab untuk pena adalah ...',['قَلَمٌ','دُرْجٌ','كِتَابٌ','مَخْطُوطٌ'],0,'قَلَمٌ berarti pena.','vocab.pen',true),
      q('l4','reading','الْمِفْتَاحُ فِي الدُّرْجِ. Artinya ...',['Kunci itu berada di dalam laci.','Buku itu berada di meja.','Surat ada di pintu.','Pena berada di halaman.'],0,'فِي menunjukkan lokasi di dalam.','vocab.drawer',true),
      q('l5','vocabulary','Apa arti كِتَابٌ?',['Buku','Lencana','Jam','Amplop'],0,'كِتَابٌ berarti buku.','vocab.book'),
      q('l6','reading','رَأَيْتُ خَالِدًا يَأْخُذُ الْمِفْتَاحَ. Makna kalimatnya ...',['Aku melihat Khalid mengambil kunci itu.','Khalid melihat buku di laci.','Aku menaruh surat di meja.','Kunci itu membuka pintu.'],0,'رَأَيْتُ berarti aku melihat.','vocab.key',true),
      q('l7','grammar','Dalam kalimat رَأَيْتُ خَالِدًا, nama Khalid berfungsi sebagai ...',['Objek yang dilihat','Kata kerja','Penanda tempat','Kata tanya'],0,'Nama Khalid menjadi objek dari kata kerja رَأَيْتُ.',null,true),
      q('l8','vocabulary','Apa arti دُرْجٌ?',['Laci','Kunci','Surat','Gudang'],0,'دُرْجٌ berarti laci.','vocab.drawer'),
      q('l9','vocabulary','مَخْطُوطٌ berarti ...',['Naskah atau manuskrip','Lencana','Pena','Kaca pembesar'],0,'مَخْطُوطٌ berarti naskah/manuskrip.','vocab.manuscript',true),
      q('l10','grammar','Dalam الْمِفْتَاحُ فِي الدُّرْجِ, kata فِي berarti ...',['Di dalam','Setelah','Karena','Siapa'],0,'فِي adalah preposisi yang berarti di dalam/di.','vocab.key',true)
    ]
  },
  'ep02-lab': {
    contentVersion: '1.0.0',
    caseInfo: { id: 'ep02-lab', number: '02', title: 'Logbook Biru', location: 'Laboratorium sekolah', description: 'Buku catatan pengamatan berpindah dari laboratorium ke ruang arsip.', briefing: ['Buku catatan pengamatan tidak ada di rak laboratorium.', 'Deskripsi benda, jadwal, dan kesaksian mengarah ke lokasi lain.', 'Cocokkan sifat, tempat, dan waktu untuk memahami perpindahan buku.'] },
    curriculum: { level: 'A1', focus: 'Na’at–man’ut, warna, lokasi, dan pertanyaan waktu', coreVocabIds: ['vocab.lab-tube', 'vocab.glove', 'vocab.schedule', 'vocab.transfer-slip'] },
    unlock: { prerequisites: ['ep01-library'], minMastery: 70 }, sceneType: 'laboratory',
    evidence: [
      ev('blue-tube', 'vocab.lab-tube', 'أُنْبُوبٌ أَزْرَقُ', 'unbūbun azraqu', 'tabung biru', '🧪', 'Deskripsi menempatkan tabung biru di atas meja besar. Meja itu digunakan kelompok praktikum Umar.', 'Periksa meja besar.', { left: 32, top: 48 }),
      ev('glove', 'vocab.glove', 'قُفَّازٌ', 'quffāzun', 'sarung tangan', '🧤', 'Sarung tangan ditemukan dekat rak catatan. Ukurannya sesuai dengan perlengkapan kelompok praktikum.', 'Lihat area dekat rak.', { left: 68, top: 66 }),
      ev('schedule', 'vocab.schedule', 'جَدْوَلٌ', 'jadwalun', 'jadwal', '🗓️', 'Jadwal menunjukkan kelompok Umar memakai meja pada waktu terkait. Pernyataannya bahwa ia pergi lebih awal perlu diperiksa.', 'Periksa papan jadwal.', { left: 72, top: 24 }),
      ev('witness-note', 'vocab.note', 'مُلَاحَظَةٌ', 'mulāḥaẓatun', 'catatan/pengamatan', '📝', 'Catatan saksi menyebut seseorang membawa map biru setelah praktikum berakhir.', 'Periksa catatan di meja.', { left: 42, top: 78 }),
      ev('transfer-slip', 'vocab.transfer-slip', 'وَرَقَةُ نَقْلٍ', 'waraqatu naqlin', 'slip perpindahan', '🌙', 'Slip bertanda bulan sabit mengarahkan logbook ke ruang arsip. Slip itu bukan instruksi resmi yang disahkan laboran.', 'Periksa slip di dekat pintu.', { left: 50, top: 34 })
    ],
    puzzle: { pieces: [piece('p1', 'الْأُنْبُوبُ', 'al-unbūbu', 'tabung itu'), piece('p2', 'الْأَزْرَقُ', 'al-azraqu', 'yang biru'), piece('p3', 'عَلَى', 'ʿalā', 'di atas'), piece('p4', 'الطَّاوِلَةِ', 'aṭ-ṭāwilati', 'meja itu')], initialOrder: ['p3', 'p4', 'p1', 'p2'], acceptedOrders: [['p1', 'p2', 'p3', 'p4']], fullTranslation: 'Tabung biru itu berada di atas meja.', grammarNote: 'Kata sifat الْأَزْرَقُ mengikuti kata benda الْأُنْبُوبُ. Setelah عَلَى, الطَّاوِلَةِ berada dalam bentuk majrūr.' },
    suspects: [suspect('salma', 'Salma', 'سَلْمَى', 'Asisten laboratorium', 'Mengatakan sedang menutup lemari alat saat praktikum selesai.', 'Periksa akses lemari dan waktu pada jadwal.', false, 'SA'), suspect('umar', 'Umar', 'عُمَرُ', 'Siswa kelompok praktikum', 'Mengaku meninggalkan laboratorium sebelum buku dipindahkan.', 'Jadwal dan kesaksian menempatkannya di meja pada waktu terkait.', true, 'UM'), suspect('hind', 'Hind', 'هِنْدٌ', 'Petugas kebersihan', 'Masuk setelah praktikum selesai.', 'Waktu masuknya tidak cocok dengan perpindahan buku.', false, 'HI')],
    storyHook: 'Slip perpindahan memakai tanda bulan sabit yang sama. Salinan register sekolah mungkin menyimpan siapa yang menyetujui pemindahan berikutnya.',
    mastery: [
      q('b1','vocabulary','أُنْبُوبٌ berarti ...',['Tabung','Kunci','Tas','Register'],0,'أُنْبُوبٌ berarti tabung.','vocab.lab-tube',true),
      q('b2','vocabulary','قُفَّازٌ berarti ...',['Sarung tangan','Jam','Pena','Surat'],0,'قُفَّازٌ berarti sarung tangan.','vocab.glove',true),
      q('b3','vocabulary','Apa arti جَدْوَلٌ?',['Jadwal','Laci','Meja','Kantor'],0,'جَدْوَلٌ berarti jadwal.','vocab.schedule',true),
      q('b4','reading','الْأُنْبُوبُ الْأَزْرَقُ عَلَى الطَّاوِلَةِ. Artinya ...',['Tabung biru itu di atas meja.','Sarung tangan ada di rak.','Jadwal itu di pintu.','Buku itu di dalam tas.'],0,'الْأَزْرَقُ berarti biru dan عَلَى berarti di atas.','vocab.lab-tube',true),
      q('b5','grammar','Dalam الْأُنْبُوبُ الْأَزْرَقُ, الْأَزْرَقُ berfungsi sebagai ...',['Kata sifat','Kata tanya','Kata kerja','Kata depan'],0,'Kata sifat mengikuti kata benda yang dijelaskan.','vocab.blue',true),
      q('b6','grammar','أَيْنَ الْأُنْبُوبُ الْأَزْرَقُ؟ berarti ...',['Di mana tabung biru itu?','Kapan praktikum dimulai?','Siapa membawa buku?','Mengapa pintu terbuka?'],0,'أَيْنَ adalah kata tanya untuk tempat.','vocab.lab-tube',true),
      q('b7','grammar','مَتَى digunakan untuk menanyakan ...',['Waktu','Tempat','Warna','Kepemilikan'],0,'مَتَى berarti kapan.','vocab.schedule'),
      q('b8','vocabulary','طَاوِلَةٌ berarti ...',['Meja','Laci','Lencana','Amplop'],0,'طَاوِلَةٌ berarti meja.','vocab.table',true),
      q('b9','reading','وَرَقَةُ نَقْلٍ paling sesuai diterjemahkan sebagai ...',['Slip perpindahan','Tabung biru','Sarung tangan','Catatan kelas'],0,'Frasa ini merujuk pada slip perpindahan.','vocab.transfer-slip',true),
      q('b10','grammar','Dalam الْأُنْبُوبُ الْأَزْرَقُ عَلَى الطَّاوِلَةِ, عَلَى berarti ...',['Di atas','Di bawah','Sebelum','Tidak'],0,'عَلَى adalah preposisi yang berarti di atas.','vocab.table',true)
    ]
  },
  'ep03-office': {
    contentVersion: '1.0.0',
    caseInfo: { id: 'ep03-office', number: '03', title: 'Catatan yang Berubah', location: 'Ruang kepala sekolah', description: 'Register perpindahan dokumen memiliki dua entri waktu yang bertentangan.', briefing: ['Dua entri register menunjukkan waktu perpindahan yang berbeda.', 'Tiga orang memberi pernyataan yang tidak semuanya cocok dengan catatan fisik.', 'Bandingkan pola negasi, akses kunci, dan jadwal untuk menemukan kontradiksi.'] },
    curriculum: { level: 'A1 menuju A2 awal', focus: 'لا + mudhari’, ما + madhi, dan ليس pada kalimat nominal', coreVocabIds: ['vocab.office', 'vocab.register', 'vocab.document', 'vocab.appointment'] },
    unlock: { prerequisites: ['ep02-lab'], minMastery: 70 }, sceneType: 'office',
    evidence: [
      ev('register', 'vocab.register', 'سِجِلٌّ', 'sijillun', 'register/catatan resmi', '📒', 'Register memuat dua waktu berbeda untuk pemindahan dokumen. Salah satu angka ditulis ulang dengan tinta berbeda.', 'Periksa buku register di meja.', { left: 60, top: 40 }),
      ev('drawer-key', 'vocab.key', 'مِفْتَاحٌ', 'miftāḥun', 'kunci', '🗝️', 'Kunci laci dokumen disimpan di lemari administrasi. Catatan peminjaman menunjukkan Nabil mengaksesnya pada sore hari.', 'Lihat lemari administrasi.', { left: 28, top: 68 }),
      ev('transfer-doc', 'vocab.document', 'وَثِيقَةٌ', 'wathīqatun', 'dokumen', '📄', 'Dokumen transfer memiliki koreksi tulisan yang cocok dengan tinta pada entri register kedua.', 'Periksa dokumen di sisi meja.', { left: 72, top: 70 }),
      ev('office-schedule', 'vocab.appointment', 'مَوْعِدٌ', 'mawʿidun', 'jadwal/waktu yang ditetapkan', '🗓️', 'Jadwal kepala sekolah menunjukkan tidak ada persetujuan pemindahan pada waktu yang tercatat.', 'Periksa papan jadwal.', { left: 35, top: 24 }),
      ev('statement', 'vocab.schedule', 'جَدْوَلٌ', 'jadwalun', 'jadwal', '🎙️', 'Pernyataan Nabil memakai penyangkalan lampau. Catatan akses kunci bertentangan dengan pernyataan bahwa ia tidak masuk ruang arsip.', 'Periksa berkas kesaksian.', { left: 82, top: 44 })
    ],
    puzzle: { pieces: [piece('p1', 'لَيْسَ', 'laysa', 'tidak berada'), piece('p2', 'السِّجِلُّ', 'as-sijillu', 'register itu'), piece('p3', 'فِي', 'fī', 'di dalam'), piece('p4', 'الْمَكْتَبِ', 'al-maktabi', 'kantor itu')], initialOrder: ['p3', 'p4', 'p2', 'p1'], acceptedOrders: [['p1', 'p2', 'p3', 'p4']], fullTranslation: 'Register itu tidak berada di kantor.', grammarNote: 'لَيْسَ dipakai untuk menegasikan kalimat nominal pada pola yang sedang dipelajari.' },
    suspects: [suspect('salma-office', 'Salma', 'سَلْمَى', 'Staf tata usaha', 'Mengatakan memeriksa jadwal bersama kepala sekolah.', 'Jadwal dan daftar hadir mendukung keterangannya.', false, 'SA'), suspect('nabil', 'Nabil', 'نَبِيلٌ', 'Petugas administrasi', 'Mengatakan tidak masuk ruang arsip pada sore itu.', 'Log kunci dan perubahan tinta bertentangan dengan pernyataannya.', true, 'NA'), suspect('hadi', 'Hadi', 'هَادِي', 'Petugas keamanan', 'Mengaku berjaga di pintu depan.', 'Catatan pos menunjukkan ia tidak mengakses laci dokumen.', false, 'HA')],
    storyHook: 'Register membuktikan ada otorisasi yang tidak sah. Nomor dokumen mengarah pada daftar petugas pameran yang akan diperiksa di episode terakhir.',
    mastery: [
      q('c1','vocabulary','سِجِلٌّ berarti ...',['Register atau catatan resmi','Kursi','Kantin','Amplop'],0,'سِجِلٌّ berarti register/catatan resmi.','vocab.register',true),
      q('c2','vocabulary','وَثِيقَةٌ berarti ...',['Dokumen','Sarung tangan','Jam','Buku'],0,'وَثِيقَةٌ berarti dokumen.','vocab.document',true),
      q('c3','grammar','لَا أَحْمِلُ الْوَثِيقَةَ menggunakan لا untuk ...',['Menegasikan perbuatan kini/kebiasaan','Menegasikan kalimat nominal dengan ليس','Menanyakan waktu','Menyatakan tempat'],0,'Dalam pola ini, لا menegasikan fi’il mudhāri’.','vocab.document',true),
      q('c4','grammar','مَا حَمَلْتُ الْوَثِيقَةَ menegasikan ...',['Peristiwa lampau','Tempat','Warna','Kepemilikan'],0,'ما dipakai pada pola fi’il māḍī yang dipilih.','vocab.document',true),
      q('c5','reading','لَيْسَ السِّجِلُّ فِي الْمَكْتَبِ. Artinya ...',['Register itu tidak berada di kantor.','Register ada di meja.','Saya membawa dokumen.','Kapan jadwal dimulai?'],0,'ليس menegasikan kalimat nominal pada contoh ini.','vocab.register',true),
      q('c6','vocabulary','مَكْتَبٌ berarti ...',['Kantor atau meja kerja','Pintu belakang','Amplop','Tabung'],0,'مَكْتَبٌ dapat berarti kantor atau meja kerja, sesuai konteks.','vocab.office',true),
      q('c7','vocabulary','مَوْعِدٌ berarti ...',['Jadwal/waktu yang ditetapkan','Register','Kunci','Lencana'],0,'مَوْعِدٌ berarti jadwal atau waktu yang ditetapkan.','vocab.appointment',true),
      q('c8','grammar','Kata yang digunakan untuk menegasikan kalimat nominal pada pola ini adalah ...',['لَيْسَ','أَيْنَ','مَتَى','عَلَى'],0,'لَيْسَ digunakan dalam pola kalimat nominal yang dipelajari.','vocab.register',true),
      q('c9','reading','Jika log kunci menunjukkan Nabil masuk tetapi ia menyangkalnya, tindakan terbaik adalah ...',['Bandingkan waktu dan bukti independen','Langsung mengabaikan register','Memilih orang secara acak','Menghapus jadwal'],0,'Kesimpulan perlu didukung bukti yang saling menguatkan.'),
      q('c10','grammar','أَيْنَ menanyakan ...',['Tempat','Waktu','Alasan','Jumlah'],0,'أَيْنَ berarti di mana.','vocab.office',true)
    ]
  },
  'ep04-cafeteria': {
    contentVersion: '1.0.0',
    caseInfo: { id: 'ep04-cafeteria', number: '04', title: 'Jejak di Kantin', location: 'Kantin dan area pameran sekolah', description: 'Amplop arsip ditemukan di bawah kursi ketika pameran berlangsung.', briefing: ['Amplop arsip muncul di area publik saat pameran sekolah.', 'Waktu pada jam, posisi tas, badge kontraktor, dan dua kesaksian tidak sepenuhnya cocok.', 'Susun urutan kejadian dan simpulkan berdasarkan sedikitnya dua bukti independen.'] },
    curriculum: { level: 'Integrasi A1 menuju A2 awal', focus: 'Urutan waktu, preposisi tempat, deskripsi, dan kesaksian', coreVocabIds: ['vocab.cafeteria', 'vocab.chair', 'vocab.bag', 'vocab.clock', 'vocab.envelope'] },
    unlock: { prerequisites: ['ep03-office'], minMastery: 70 }, sceneType: 'cafeteria',
    evidence: [
      ev('clock', 'vocab.clock', 'سَاعَةٌ', 'sāʿatun', 'jam', '🕒', 'Jam dinding menunjukkan amplop berpindah ke area kantin setelah sesi pameran dimulai.', 'Periksa jam di dinding.', { left: 78, top: 20 }),
      ev('bag', 'vocab.bag', 'حَقِيبَةٌ', 'ḥaqībatun', 'tas', '🎒', 'Tas ditemukan di bawah kursi. Dua saksi memberi waktu berbeda tentang siapa yang membawanya.', 'Lihat area bawah kursi.', { left: 42, top: 70 }),
      ev('contractor-badge', 'vocab.badge', 'شَارَةٌ', 'shāratun', 'lencana', '🎖️', 'Badge kontraktor menghubungkan Rafiq dengan akses ke area belakang pameran.', 'Periksa meja registrasi.', { left: 72, top: 60 }),
      ev('witness-audio', 'vocab.document', 'وَثِيقَةٌ', 'wathīqatun', 'dokumen/kesaksian', '🎙️', 'Kesaksian pertama menyebut seseorang membawa amplop sebelum pintu utama dibuka. Kesaksian kedua mengoreksi urutan waktunya.', 'Periksa berkas kesaksian.', { left: 25, top: 34 }),
      ev('envelope', 'vocab.envelope', 'ظَرْفٌ', 'ẓarfun', 'amplop', '✉️', 'Amplop berisi slip bertanda bulan sabit. Nomor dokumen cocok dengan register yang berubah pada episode sebelumnya.', 'Periksa amplop di bawah meja.', { left: 55, top: 80 })
    ],
    puzzle: { pieces: [piece('p1', 'دَخَلَ سَامِي', 'dakhala Sāmī', 'Sami masuk'), piece('p2', 'الْمَقْصَفَ', 'al-maqṣafa', 'ke kantin'), piece('p3', 'ثُمَّ وَضَعَ', 'thumma waḍaʿa', 'kemudian meletakkan'), piece('p4', 'الْحَقِيبَةَ', 'al-ḥaqībata', 'tas itu')], initialOrder: ['p3', 'p4', 'p1', 'p2'], acceptedOrders: [['p1', 'p2', 'p3', 'p4']], fullTranslation: 'Sami masuk ke kantin, kemudian meletakkan tas itu.', grammarNote: 'ثُمَّ menandai urutan kejadian. Kesimpulan kasus tetap harus memakai gabungan waktu, lokasi, dan bukti lain.' },
    suspects: [suspect('rafiq', 'Rafiq', 'رَفِيقٌ', 'Kontraktor pameran', 'Mengaku berada di meja registrasi sepanjang sesi.', 'Badge dan kesaksian menghubungkannya dengan akses area belakang.', true, 'RA'), suspect('sami', 'Sami', 'سَامِي', 'Siswa panitia', 'Mengaku membawa tas setelah pelajaran selesai.', 'Keterangan waktunya cocok dengan sebagian, tetapi tidak seluruh rangkaian.', false, 'SA'), suspect('layla', 'Layla', 'لَيْلَى', 'Petugas stan pameran', 'Mengatakan menjaga stan utama dan tidak masuk area belakang.', 'Dua saksi mendukung keberadaannya di stan utama.', false, 'LA')],
    storyHook: 'Rafiq mengatur perpindahan catatan bertanda bulan sabit. Tiga kasus lokal sebelumnya tetap memiliki pelaku masing-masing, sementara rangkaian administrasi kini dapat ditelusuri.',
    mastery: [
      q('d1','vocabulary','مَقْصَفٌ berarti ...',['Kantin','Kantor','Laci','Laboratorium'],0,'مَقْصَفٌ berarti kantin.','vocab.cafeteria',true),
      q('d2','vocabulary','حَقِيبَةٌ berarti ...',['Tas','Jam','Surat','Tabung'],0,'حَقِيبَةٌ berarti tas.','vocab.bag',true),
      q('d3','vocabulary','كُرْسِيٌّ berarti ...',['Kursi','Meja','Dokumen','Jadwal'],0,'كُرْسِيٌّ berarti kursi.','vocab.chair',true),
      q('d4','reading','الْحَقِيبَةُ تَحْتَ الْكُرْسِيِّ. Artinya ...',['Tas itu berada di bawah kursi.','Tas berada di atas meja.','Jam ada di pintu.','Amplop ada di laci.'],0,'تَحْتَ berarti di bawah.','vocab.bag',true),
      q('d5','vocabulary','سَاعَةٌ berarti ...',['Jam','Lencana','Pena','Register'],0,'سَاعَةٌ berarti jam.','vocab.clock',true),
      q('d6','grammar','ثُمَّ menandai ...',['Urutan kejadian','Penyangkalan','Pertanyaan tempat','Kata sifat'],0,'ثُمَّ berarti kemudian/lalu.','vocab.cafeteria',true),
      q('d7','reading','دَخَلَ سَامِي الْمَقْصَفَ. Artinya ...',['Sami masuk ke kantin.','Sami keluar dari kantor.','Tas di bawah kursi.','Rafiq membawa dokumen.'],0,'دَخَلَ berarti masuk.','vocab.cafeteria',true),
      q('d8','grammar','بَعْدَ الدَّرْسِ berarti ...',['Setelah pelajaran','Sebelum pelajaran','Di bawah kursi','Di dalam kantor'],0,'بَعْدَ berarti setelah.','vocab.clock',true),
      q('d9','reading','Kesimpulan yang kuat harus didukung oleh ...',['Sedikitnya dua bukti independen','Satu rumor saja','Satu nama pada catatan','Pilihan acak'],0,'Rancangan episode meminta minimal dua bukti independen.'),
      q('d10','grammar','Untuk menentukan urutan kejadian, pemain perlu membandingkan ...',['Waktu, lokasi, dan kesaksian','Warna lencana saja','Nama yang paling sering muncul','Satu kalimat tanpa konteks'],0,'Timeline perlu dikaitkan dengan lokasi dan kesaksian.')
    ]
  }
};

export const EPISODE_META = [
  { id: 'ep01-library', title: 'Kasus Hilangnya Naskah Kuno', shortTitle: 'Naskah Kuno', location: 'Perpustakaan Al-Hikmah', label: '01', icon: '📚', accent: 'amber' },
  { id: 'ep02-lab', title: 'Logbook Biru', shortTitle: 'Logbook Biru', location: 'Laboratorium sekolah', label: '02', icon: '🧪', accent: 'cyan' },
  { id: 'ep03-office', title: 'Catatan yang Berubah', shortTitle: 'Catatan Berubah', location: 'Ruang kepala sekolah', label: '03', icon: '📒', accent: 'violet' },
  { id: 'ep04-cafeteria', title: 'Jejak di Kantin', shortTitle: 'Jejak di Kantin', location: 'Kantin dan area pameran', label: '04', icon: '🕒', accent: 'rose' }
];

export const ALL_EPISODE_IDS = CAMPAIGN_CONFIG.episodeOrder;
