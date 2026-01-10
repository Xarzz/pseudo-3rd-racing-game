import { Question, QuizCategory } from '@/types';

export const questions: Question[] = [
    // Matematika
    {
        id: 'math-1',
        question: 'Berapa hasil dari 15 × 12?',
        options: ['170', '180', '190', '200'],
        correctAnswer: 1,
        category: 'matematika',
        difficulty: 'easy',
    },
    {
        id: 'math-2',
        question: 'Jika x + 5 = 12, berapa nilai x?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 2,
        category: 'matematika',
        difficulty: 'easy',
    },
    {
        id: 'math-3',
        question: 'Berapa luas segitiga dengan alas 10 cm dan tinggi 8 cm?',
        options: ['40 cm²', '80 cm²', '18 cm²', '36 cm²'],
        correctAnswer: 0,
        category: 'matematika',
        difficulty: 'medium',
    },
    {
        id: 'math-4',
        question: 'Hasil dari √144 adalah...',
        options: ['10', '11', '12', '13'],
        correctAnswer: 2,
        category: 'matematika',
        difficulty: 'easy',
    },
    {
        id: 'math-5',
        question: 'Berapa nilai dari 2³ × 3²?',
        options: ['54', '72', '64', '48'],
        correctAnswer: 1,
        category: 'matematika',
        difficulty: 'medium',
    },

    // Sejarah
    {
        id: 'hist-1',
        question: 'Kapan Indonesia merdeka?',
        options: ['17 Agustus 1944', '17 Agustus 1945', '17 Agustus 1946', '17 Agustus 1947'],
        correctAnswer: 1,
        category: 'sejarah',
        difficulty: 'easy',
    },
    {
        id: 'hist-2',
        question: 'Siapa presiden pertama Indonesia?',
        options: ['Soekarno', 'Soeharto', 'B.J. Habibie', 'Abdurrahman Wahid'],
        correctAnswer: 0,
        category: 'sejarah',
        difficulty: 'easy',
    },
    {
        id: 'hist-3',
        question: 'Peristiwa Sumpah Pemuda terjadi pada tanggal...',
        options: ['28 Oktober 1925', '28 Oktober 1926', '28 Oktober 1927', '28 Oktober 1928'],
        correctAnswer: 3,
        category: 'sejarah',
        difficulty: 'easy',
    },
    {
        id: 'hist-4',
        question: 'Siapa pahlawan yang dijuluki "Singa dari Medan Perang"?',
        options: ['Diponegoro', 'Cut Nyak Dien', 'Tuanku Imam Bonjol', 'Pattimura'],
        correctAnswer: 0,
        category: 'sejarah',
        difficulty: 'medium',
    },
    {
        id: 'hist-5',
        question: 'Kerajaan Majapahit berdiri pada tahun...',
        options: ['1291', '1292', '1293', '1294'],
        correctAnswer: 2,
        category: 'sejarah',
        difficulty: 'medium',
    },

    // IPA
    {
        id: 'ipa-1',
        question: 'Apa rumus kimia air?',
        options: ['H2O', 'CO2', 'NaCl', 'O2'],
        correctAnswer: 0,
        category: 'ipa',
        difficulty: 'easy',
    },
    {
        id: 'ipa-2',
        question: 'Planet terbesar di tata surya kita adalah...',
        options: ['Saturnus', 'Jupiter', 'Uranus', 'Neptunus'],
        correctAnswer: 1,
        category: 'ipa',
        difficulty: 'easy',
    },
    {
        id: 'ipa-3',
        question: 'Dalam sistem pernapasan, pertukaran gas terjadi di...',
        options: ['Bronkus', 'Trakea', 'Alveolus', 'Laring'],
        correctAnswer: 2,
        category: 'ipa',
        difficulty: 'medium',
    },
    {
        id: 'ipa-4',
        question: 'Satuan gaya dalam SI adalah...',
        options: ['Joule', 'Watt', 'Newton', 'Pascal'],
        correctAnswer: 2,
        category: 'ipa',
        difficulty: 'easy',
    },
    {
        id: 'ipa-5',
        question: 'Proses tumbuhan membuat makanan sendiri disebut...',
        options: ['Respirasi', 'Fotosintesis', 'Transpirasi', 'Fermentasi'],
        correctAnswer: 1,
        category: 'ipa',
        difficulty: 'easy',
    },

    // Bahasa Indonesia
    {
        id: 'indo-1',
        question: 'Apa yang dimaksud dengan sinonim?',
        options: ['Kata berlawanan', 'Kata serupa makna', 'Kata serapan', 'Kata baku'],
        correctAnswer: 1,
        category: 'bahasa-indonesia',
        difficulty: 'easy',
    },
    {
        id: 'indo-2',
        question: 'Kalimat yang berisi ajakan disebut kalimat...',
        options: ['Perintah', 'Tanya', 'Ajakan', 'Berita'],
        correctAnswer: 2,
        category: 'bahasa-indonesia',
        difficulty: 'easy',
    },
    {
        id: 'indo-3',
        question: 'Antonim dari kata "gemuk" adalah...',
        options: ['Besar', 'Kurus', 'Pendek', 'Panjang'],
        correctAnswer: 1,
        category: 'bahasa-indonesia',
        difficulty: 'easy',
    },
    {
        id: 'indo-4',
        question: 'Kata yang mengalami perubahan bunyi disebut...',
        options: ['Homonim', 'Homofon', 'Metatesis', 'Asimilasi'],
        correctAnswer: 2,
        category: 'bahasa-indonesia',
        difficulty: 'hard',
    },
    {
        id: 'indo-5',
        question: 'Imbuhan "ber-" pada kata "berlari" berfungsi sebagai...',
        options: ['Awalan', 'Akhiran', 'Sisipan', 'Konfiks'],
        correctAnswer: 0,
        category: 'bahasa-indonesia',
        difficulty: 'easy',
    },

    // Bahasa Inggris
    {
        id: 'eng-1',
        question: 'What is the past tense of "go"?',
        options: ['Goed', 'Gone', 'Went', 'Going'],
        correctAnswer: 2,
        category: 'bahasa-inggris',
        difficulty: 'easy',
    },
    {
        id: 'eng-2',
        question: '"She _____ to school every day." Choose the correct verb.',
        options: ['go', 'goes', 'going', 'went'],
        correctAnswer: 1,
        category: 'bahasa-inggris',
        difficulty: 'easy',
    },
    {
        id: 'eng-3',
        question: 'What is the opposite of "big"?',
        options: ['Large', 'Small', 'Huge', 'Tall'],
        correctAnswer: 1,
        category: 'bahasa-inggris',
        difficulty: 'easy',
    },
    {
        id: 'eng-4',
        question: 'Which sentence is grammatically correct?',
        options: ['He don\'t like pizza', 'He doesn\'t likes pizza', 'He doesn\'t like pizza', 'He not like pizza'],
        correctAnswer: 2,
        category: 'bahasa-inggris',
        difficulty: 'medium',
    },
    {
        id: 'eng-5',
        question: '"The book _____ on the table." Choose the correct form.',
        options: ['is', 'are', 'am', 'be'],
        correctAnswer: 0,
        category: 'bahasa-inggris',
        difficulty: 'easy',
    },

    // Pengetahuan Umum
    {
        id: 'umum-1',
        question: 'Apa ibu kota Indonesia?',
        options: ['Surabaya', 'Bandung', 'Jakarta', 'Nusantara'],
        correctAnswer: 2,
        category: 'umum',
        difficulty: 'easy',
    },
    {
        id: 'umum-2',
        question: 'Bendera Indonesia berwarna...',
        options: ['Merah Putih', 'Merah Kuning', 'Putih Biru', 'Hijau Putih'],
        correctAnswer: 0,
        category: 'umum',
        difficulty: 'easy',
    },
    {
        id: 'umum-3',
        question: 'Gunung tertinggi di Indonesia adalah...',
        options: ['Gunung Merapi', 'Gunung Semeru', 'Puncak Jaya', 'Gunung Bromo'],
        correctAnswer: 2,
        category: 'umum',
        difficulty: 'medium',
    },
    {
        id: 'umum-4',
        question: 'Berapa jumlah provinsi di Indonesia (2024)?',
        options: ['34', '35', '37', '38'],
        correctAnswer: 3,
        category: 'umum',
        difficulty: 'medium',
    },
    {
        id: 'umum-5',
        question: 'Pulau terbesar di Indonesia adalah...',
        options: ['Sumatera', 'Jawa', 'Kalimantan', 'Papua'],
        correctAnswer: 2,
        category: 'umum',
        difficulty: 'easy',
    },
];

export const getQuestionsByCategory = (category: QuizCategory): Question[] => {
    return questions.filter(q => q.category === category);
};

export const getRandomQuestions = (category: QuizCategory, count: number = 5): Question[] => {
    const categoryQuestions = getQuestionsByCategory(category);
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

export const categoryNames: Record<QuizCategory, string> = {
    'matematika': 'Matematika',
    'sejarah': 'Sejarah',
    'ipa': 'IPA (Ilmu Pengetahuan Alam)',
    'bahasa-indonesia': 'Bahasa Indonesia',
    'bahasa-inggris': 'Bahasa Inggris',
    'umum': 'Pengetahuan Umum',
};

export const categoryIcons: Record<QuizCategory, string> = {
    'matematika': '🔢',
    'sejarah': '📜',
    'ipa': '🔬',
    'bahasa-indonesia': '📚',
    'bahasa-inggris': '🌍',
    'umum': '💡',
};
