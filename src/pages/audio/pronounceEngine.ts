/**
 * Text-To-Speech Pronunciation Engine & Vocabulary Datasets
 * SpeechSynthesis utility service handling voice accents, speech rates, phonetic IPA text, and term decks.
 */

export interface VocabularyFlashcard {
    id: string;
    term: string;
    phoneticIpa: string;
    definition: string;
    domain: 'medical' | 'biomedical' | 'chemistry' | 'computer_science';
    exampleSentence: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SpeechSettings {
    rate: number; // 0.75, 1.0, 1.25, 1.5
    pitch: number; // 1.0
    voiceURI: string | null;
    language: string;
}

export const PRESET_VOCABULARY_DECK: VocabularyFlashcard[] = [
    {
        id: "vocab_med_101",
        term: "Sphygmomanometer",
        phoneticIpa: "/ˌsfɪɡmoʊməˈnɑːmɪtər/",
        definition: "An instrument for measuring blood pressure, typically consisting of an inflatable rubber cuff applied to the arm.",
        domain: "medical",
        exampleSentence: "The nurse wrapped the sphygmomanometer around the patient's arm to measure arterial pressure.",
        difficulty: "intermediate"
    },
    {
        id: "vocab_med_102",
        term: "Otorhinolaryngology",
        phoneticIpa: "/ˌoʊtoʊˌraɪnoʊˌlærənˈɡɑːlədʒi/",
        definition: "The surgical subspecialty within medicine that deals with conditions of the ear, nose, and throat (ENT).",
        domain: "medical",
        exampleSentence: "The resident specialized in otorhinolaryngology to perform complex endoscopic sinus procedures.",
        difficulty: "advanced"
    },
    {
        id: "vocab_chem_101",
        term: "Spectrophotometry",
        phoneticIpa: "/ˌspɛktroʊfoʊˈtɑːmɪtri/",
        definition: "A method to measure how much a chemical substance absorbs light by measuring the intensity of light as a beam passes through sample solution.",
        domain: "chemistry",
        exampleSentence: "We used UV-Vis spectrophotometry to determine the concentration of hemoglobin in the blood serum.",
        difficulty: "intermediate"
    },
    {
        id: "vocab_cs_101",
        term: "Idempotency",
        phoneticIpa: "/ˌaɪdɛmˈpoʊtənsi/",
        definition: "The property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.",
        domain: "computer_science",
        exampleSentence: "HTTP PUT and DELETE requests are designed with idempotency guarantees in REST API architectures.",
        difficulty: "advanced"
    },
    {
        id: "vocab_bio_101",
        term: "Glomerulonephritis",
        phoneticIpa: "/ɡləˌmɛrjʊloʊnɪˈfraɪtɪs/",
        definition: "Inflammation of the tiny filters in your kidneys (glomeruli) causing filtration impairment.",
        domain: "biomedical",
        exampleSentence: "Acute post-streptococcal glomerulonephritis presents with hematuria and elevated serum creatinine.",
        difficulty: "advanced"
    }
];

// Speak Text Utility wrapper around window.speechSynthesis
export const speakTermAudio = (
    text: string, 
    settings: SpeechSettings,
    onEndCallback?: () => void,
    onErrorCallback?: (err: any) => void
): boolean => {
    if (!('speechSynthesis' in window)) {
        if (onErrorCallback) onErrorCallback("Speech synthesis is not supported in this browser.");
        return false;
    }

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.lang = settings.language || 'en-US';

    if (settings.voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
        if (selectedVoice) utterance.voice = selectedVoice;
    }

    if (onEndCallback) {
        utterance.onend = () => onEndCallback();
        utterance.onerror = (e) => {
            if (onEndCallback) onEndCallback();
            if (onErrorCallback) onErrorCallback(e);
        };
    }

    window.speechSynthesis.speak(utterance);
    return true;
};
